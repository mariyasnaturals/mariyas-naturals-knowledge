"""No network/host writes: exercise the independent CI authority and real transaction core."""
import copy
import io
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ops'))
from ci_staging import artifact, trust, runtime, health
from ci_staging.github import GitHub, SafeRedirect

SHA = 'b' * 40
RUN = {'id': 123, 'run_number': 42, 'run_attempt': 1}


def command(*args):
    return subprocess.check_output(args, stderr=subprocess.PIPE)


def site_files():
    files = {'robots.txt': b'User-agent: *\nDisallow: /\n'}
    for path in ['index.html', *[lang + '/index.html' for lang in ['en','ml','hi','ta']]]:
        files[path] = ('<html><head><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="' + trust.ORIGIN + '/' + path.removesuffix('index.html') + '"></head><body>Staging</body></html>').encode()
    files['cinematic/test.mp4'] = b'original-mp4'
    files['cinematic/original.jpg'] = b'original-photo'
    return files


def policy_for(files):
    return {'public_files': {n: {'sha256': trust.digest(d), 'bytes': len(d)} for n,d in files.items() if n.startswith('cinematic/')}, 'original_media': [{'dimensions':[1280,720], 'provenance':'owner-upload', 'sha256':trust.digest(b'original-mp4')}]}


class ArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name); self.files = site_files(); self.policy = policy_for(self.files)
        for name,data in self.files.items():
            p=self.folder/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
        self.m,self.archive=artifact.payload(self.folder,SHA,RUN,self.policy)

    def test_reproducible_archive_and_exact_inventory(self):
        m,data=artifact.payload(self.folder,SHA,{**RUN,'id':124},self.policy)
        self.assertEqual(data,self.archive)
        self.assertNotEqual(m['run_id'],self.m['run_id'])
        self.assertEqual(set(artifact.validate(self.m,self.archive,self.policy,SHA,RUN)),set(self.files)|{'staging-revision.json'})

    def test_tampered_video_and_photo_rejected_even_with_new_manifest_hashes(self):
        for name in ['cinematic/test.mp4','cinematic/original.jpg']:
            p=self.folder/name;original=p.read_bytes();p.write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError,'Pinned public/media'):artifact.payload(self.folder,SHA,RUN,self.policy)
            p.write_bytes(original)

    def test_missing_media_rejected(self):
        (self.folder/'cinematic/test.mp4').unlink()
        with self.assertRaisesRegex(ValueError,'Missing original'):artifact.payload(self.folder,SHA,RUN,self.policy)

    def test_source_branch_provenance_and_release_confusion(self):
        for key,value in [('branch','main'),('source_sha','a'*40),('schema','staging-release/v1'),('original_media',[]),('sequence',1),('archive_sha256','0'*64)]:
            m={**self.m,key:value}
            with self.assertRaises(ValueError):artifact.validate(m,self.archive,self.policy,SHA,RUN)

    def test_noindex_and_commerce(self):
        for change in [lambda s:s.replace(b'noindex, nofollow',b'index, follow'),lambda s:s.replace(b'</body>',b'<a href="https://mariyasnaturals.com/checkout">Buy</a></body>')]:
            p=self.folder/'en/index.html';p.write_bytes(change(self.files['en/index.html']))
            with self.assertRaises(ValueError):artifact.payload(self.folder,SHA,RUN,self.policy)

    def test_symlink_input_and_unexpected_file(self):
        (self.folder/'secret.pem').write_bytes(b'secret')
        with self.assertRaisesRegex(ValueError,'Unexpected release'):artifact.payload(self.folder,SHA,RUN,self.policy)
        (self.folder/'secret.pem').unlink();(self.folder/'link').symlink_to(self.folder/'en/index.html')
        with self.assertRaisesRegex(ValueError,'Linked'):artifact.payload(self.folder,SHA,RUN,self.policy)

    def test_unsafe_duplicate_symlink_and_expansion_zip(self):
        for name,mode in [('../escape',stat.S_IFREG),('.well-known/x',stat.S_IFREG),('link',stat.S_IFLNK),('/absolute',stat.S_IFREG)]:
            out=io.BytesIO()
            with zipfile.ZipFile(out,'w') as z:
                info=zipfile.ZipInfo(name);info.external_attr=(mode|0o644)<<16;z.writestr(info,b'target')
            with self.assertRaises(ValueError):artifact.read_zip(out.getvalue())
        with self.assertRaisesRegex(ValueError,'Expanded'):artifact.read_zip(self.archive,total_limit=1)
        with patch.object(trust,'MAX_ZIP',1),patch.object(artifact,'MAX_ZIP',1):
            with self.assertRaisesRegex(ValueError,'limit'):artifact.zip_bytes(self.files)
        out=io.BytesIO()
        with zipfile.ZipFile(out,'w') as z:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter('ignore');z.writestr('same',b'a');z.writestr('same',b'b')
        with self.assertRaisesRegex(ValueError,'Duplicate'):artifact.read_zip(out.getvalue())

    def test_dedicated_signature_and_modified_manifest(self):
        key=self.folder/'key.pem';pub=self.folder/'public.pem'
        command('openssl','genpkey','-algorithm','ED25519','-out',str(key))
        command('openssl','pkey','-in',str(key),'-pubout','-out',str(pub))
        m={**self.m,'key_sha256':trust.digest(pub.read_bytes())}
        manifest=self.folder/'manifest.json';sig=self.folder/'manifest.sig';manifest.write_bytes(artifact.encode(m))
        command('openssl','pkeyutl','-sign','-inkey',str(key),'-rawin','-in',str(manifest),'-out',str(sig))
        files={'manifest.json':manifest.read_bytes(),'manifest.sig':sig.read_bytes(),'release.zip':self.archive}
        cfg={'automation_public_key':str(pub),'automation_public_key_sha256':trust.digest(pub.read_bytes())}
        destination=self.folder/'accepted';destination.mkdir()
        result=runtime.authenticated_release(artifact.zip_bytes(files),destination,cfg,self.policy,SHA,RUN)
        self.assertEqual(result[0]['source_sha'],SHA)
        for name,data in [('manifest.json',manifest.read_bytes()+b' '),('manifest.sig',b'x'*64)]:
            dest=self.folder/('rejected-'+name);dest.mkdir()
            with self.assertRaisesRegex(ValueError,'signature'):runtime.authenticated_release(artifact.zip_bytes({**files,name:data}),dest,cfg,self.policy,SHA,RUN)


class GateTests(unittest.TestCase):
    def test_source_gate_accepts_ui_only_and_rejects_workflow_and_new_tools(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo=Path(tmp);command('git','init','-q',str(repo));command('git','-C',tmp,'config','user.email','test@example.test');command('git','-C',tmp,'config','user.name','Test')
            for name in ['.github/workflows/validate.yml','src/components/Hero.astro']:
                p=repo/name;p.parent.mkdir(parents=True);p.write_text('initial')
            def commit():
                command('git','-C',tmp,'add','.');command('git','-C',tmp,'commit','-qm','test');return command('git','-C',tmp,'rev-parse','HEAD').decode().strip()
            first=commit();policy={'schema':'ci-staging-trust/v1','repository_id':trust.REPOSITORY_ID,'branch':trust.BRANCH,'reviewed_commit':first,'gate_files':trust.tree_policy(repo,first)}
            (repo/'src/components/Hero.astro').write_text('routine hero correction');second=commit();trust.verify_gate(repo,second,policy)
            (repo/'.github/workflows/validate.yml').write_text('skip tests');third=commit()
            with self.assertRaisesRegex(ValueError,'Protected CI'):trust.verify_gate(repo,third,policy)

    def test_ci_run_rejects_fork_wrong_branch_event_workflow_and_failed(self):
        run={**RUN,'event':'push','head_branch':trust.BRANCH,'head_sha':SHA,'workflow_id':trust.WORKFLOW_ID,'path':trust.WORKFLOW,'repository':{'id':trust.REPOSITORY_ID},'head_repository':{'id':trust.REPOSITORY_ID},'status':'completed','conclusion':'success'}
        GitHub.validate_run(run,SHA)
        for key,value in [('event','pull_request'),('head_branch','main'),('workflow_id',0),('head_sha','a'*40),('path','other.yml'),('head_repository',{'id':0}),('conclusion','failure'),('status','in_progress')]:
            with self.assertRaises(ValueError):GitHub.validate_run({**run,key:value},SHA)

    def test_protection_is_mandatory(self):
        api=GitHub('fixture-token')
        good={'enforce_admins':{'enabled':True},'allow_force_pushes':{'enabled':False},'allow_deletions':{'enabled':False}}
        with patch.object(api,'json',return_value=good):api.protection()
        for key in good:
            bad=copy.deepcopy(good);bad[key]['enabled']=not good[key]['enabled']
            with patch.object(api,'json',return_value=bad),self.assertRaises(ValueError):api.protection()

    def test_artifact_digest_and_run_binding(self):
        api=GitHub('fixture-token');body=b'fixture-artifact'
        item={'id':55,'name':'ci-staging-123-1','expired':False,'workflow_run':{'id':123,'head_sha':SHA},'digest':'sha256:'+trust.digest(body)}
        with patch.object(api,'json',return_value={'total_count':1,'artifacts':[item]}),patch.object(api,'request',return_value=body):
            self.assertEqual(api.artifact({**RUN,'head_sha':SHA})[0],body)
        item['digest']='sha256:'+'0'*64
        with patch.object(api,'json',return_value={'total_count':1,'artifacts':[item]}),patch.object(api,'request',return_value=body),self.assertRaisesRegex(ValueError,'digest'):api.artifact({**RUN,'head_sha':SHA})


class TransactionTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        base=Path(self.tmp.name);self.root=base/'web';self.state=base/'owner';self.ci=self.state/'ci-staging';self.stage=base/'staged'
        for p in [self.root,self.state,self.ci,self.stage]:p.mkdir(mode=0o700)
        (self.root/'index.html').write_text('old');(self.root/'.well-known').mkdir();(self.root/'.well-known/acme').write_text('protected');(self.root/'.env').write_text('protected')
        self.owner={'_root':self.root,'_state':self.state}
        self.original={'release_commit':'owner-signed','source_sha':'a'*40,'max_sequence':7}
        runtime.core.atomic_json(self.state/'current.json',self.original)
        runtime.core.atomic_json(self.ci/'current.json',{**self.original,'max_sequence':0})
        runtime.core.atomic_json(self.ci/'adoption.json',{'owner_history_sha256':runtime.owner_fingerprint(self.owner)})
        (self.stage/'index.html').write_text('new')
        self.m={'source_sha':SHA,'sequence':100001,'files':[{'path':'index.html','sha256':trust.digest(b'new'),'bytes':3}]}
        from unittest.mock import Mock
        self.api=Mock();self.api.deployment.return_value=10
        self.observe=patch.object(health,'observe',return_value={'observed':False,'html_cached':False});self.observe.start();self.addCleanup(self.observe.stop)
        self.purge=patch.object(health,'purge',return_value=False);self.purge.start();self.addCleanup(self.purge.stop)
        self.verify=patch.object(health,'verify',return_value={'https':True});self.health=self.verify.start();self.addCleanup(self.verify.stop)

    def apply(self):
        import contextlib
        with contextlib.redirect_stdout(io.StringIO()),runtime.coordinated_lock(self.owner):
            return runtime.transaction({},self.owner,self.ci,self.m,'f'*64,self.stage,'ci:123:1',self.api,RUN)

    def assert_protected(self):
        self.assertEqual(runtime.core.read_json(self.state/'current.json'),self.original)
        self.assertEqual((self.root/'.env').read_text(),'protected')
        self.assertEqual((self.root/'.well-known/acme').read_text(),'protected')

    def test_verified_apply_separate_history_replay_and_protected_paths(self):
        receipt=self.apply();self.assertEqual(receipt['status'],'success');self.assertEqual((self.root/'index.html').read_text(),'new');self.assert_protected()
        self.assertEqual(self.apply()['status'],'no-change');self.assertFalse((self.state/'pending.json').exists())

    def test_bad_public_health_rolls_back_and_never_reports_success(self):
        self.health.side_effect=[ValueError('bad public result'),{'https':True}]
        with self.assertRaisesRegex(ValueError,'No success'):self.apply()
        self.assertEqual((self.root/'index.html').read_text(),'old');self.assert_protected()
        self.assertFalse((self.state/'pending.json').exists())
        self.assertTrue(runtime.core.read_json(self.ci/'failure.json')['rolled_back'])
        self.assertNotIn('success',[c.args[1] for c in self.api.report.call_args_list])

    def test_owner_or_ci_pending_prevents_mutation(self):
        for state in [self.state,self.ci]:
            runtime.core.atomic_json(state/'pending.json',{'existing':True})
            with self.assertRaisesRegex(ValueError,'Pending'):self.apply()
            self.assertEqual((self.root/'index.html').read_text(),'old');(state/'pending.json').unlink()

    def test_changed_owner_history_prevents_mutation(self):
        runtime.core.atomic_json(self.state/'current.json',{**self.original,'max_sequence':8})
        with self.assertRaisesRegex(ValueError,'Owner signed history'):self.apply()
        self.assertEqual((self.root/'index.html').read_text(),'old')

    def test_shared_lock_excludes_other_authority(self):
        with runtime.coordinated_lock(self.owner):
            with self.assertRaises(BlockingIOError):runtime.coordinated_lock(self.owner)

    def test_failed_recovery_retains_shared_interlock(self):
        self.health.side_effect=ValueError('public unreachable')
        with patch.object(runtime.core,'rollback',side_effect=ValueError('disk unavailable')):
            with self.assertRaises(ValueError):self.apply()
        self.assertTrue((self.state/'pending.json').exists())
        self.assertTrue(runtime.core.read_json(self.ci/'failure.json')['recovery_required'])

    def test_cloudflare_cache_without_purge_authority_stops_before_apply(self):
        with patch.object(health,'observe',return_value={'observed':True,'html_cached':True}):
            with self.assertRaises(ValueError):self.apply()
        self.assertEqual((self.root/'index.html').read_text(),'old')

    def test_interrupted_apply_recovers_exact_inventory_without_owner_history_changes(self):
        from ci_staging import install
        before=runtime.core.static_inventory(self.root)
        backup,_,_=runtime.core.backup(self.root,self.ci)
        marker={'authority':'ci-staging/v1','state_dir':str(self.ci),'owner_history_sha256':runtime.owner_fingerprint(self.owner),'before_inventory_sha256':runtime.core.inventory_hash(before)}
        runtime.core.atomic_json(self.state/'pending.json',marker)
        runtime.core.atomic_json(self.ci/'pending.json',{'backup':backup,'previous':runtime.core.read_json(self.ci/'current.json')})
        (self.root/'index.html').write_text('partial apply')
        approved=trust.digest((self.state/'pending.json').read_bytes())
        import contextlib
        with patch.object(runtime,'load_config',return_value=({'enabled':False},self.owner,{},self.ci)),contextlib.redirect_stdout(io.StringIO()):
            install.recover('fixture',approved)
        self.assertEqual((self.root/'index.html').read_text(),'old')
        self.assertFalse((self.state/'pending.json').exists());self.assertFalse((self.ci/'pending.json').exists());self.assert_protected()


if __name__=='__main__':unittest.main()
