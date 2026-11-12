import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
from ci_staging import cli,trust,artifact,install,runtime


class PackagingAndInstallation(unittest.TestCase):
    def test_actual_repository_paths_and_all_original_media_are_pinned(self):
        sha=trust.git(ROOT,'rev-parse','HEAD').decode().strip()
        policy=trust.make_trust(ROOT,sha)
        self.assertEqual(len(policy['original_media']),4)
        for name in ['cinematic/homepage-desktop.mp4','cinematic/homepage-mobile.mp4','cinematic/original-model.jpg','cinematic/original-product.jpg']:
            self.assertEqual(policy['public_files'][name]['sha256'],trust.digest((ROOT/'public'/name).read_bytes()))
        self.assertTrue(trust.is_ui_file('src/pages/[lang]/index.astro'))
        self.assertFalse(trust.is_ui_file('src/data/cinematic-assets.json'))
        self.assertFalse(trust.is_ui_file('.github/workflows/validate.yml'))

    def test_pr_and_checkout_mismatch_cannot_package(self):
        sha=trust.git(ROOT,'rev-parse','HEAD').decode().strip()
        base={'GITHUB_ACTIONS':'true','GITHUB_EVENT_NAME':'push','GITHUB_REF':'refs/heads/'+trust.BRANCH,'GITHUB_REPOSITORY':trust.REPOSITORY,'GITHUB_SHA':sha,'GITHUB_RUN_ID':'1','GITHUB_RUN_NUMBER':'1','GITHUB_RUN_ATTEMPT':'1'}
        for change in [{'GITHUB_EVENT_NAME':'pull_request'},{'GITHUB_REF':'refs/heads/main'},{'GITHUB_REPOSITORY':'fork/repo'},{'GITHUB_SHA':'a'*40}]:
            with patch.dict(os.environ,{**base,**change}),self.assertRaises(ValueError):cli.ci_context()

    def test_data_only_signer_authenticates_exact_envelope(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder=Path(tmp);site=folder/'site';site.mkdir()
            for name in ['index.html','en/index.html','ml/index.html','hi/index.html','ta/index.html']:
                p=site/name;p.parent.mkdir(exist_ok=True);p.write_text('<meta name="robots" content="noindex, nofollow"><link rel="canonical" href="'+trust.ORIGIN+'/'+name.removesuffix('index.html')+'">')
            (site/'robots.txt').write_text('User-agent: *\nDisallow: /\n')
            policy={'original_media':[],'public_files':{}}
            sha='b'*40;run={'id':7,'run_number':8,'run_attempt':1}
            m,archive=artifact.payload(site,sha,run,policy)
            source=folder/'input';source.mkdir();(source/'release.zip').write_bytes(archive);(source/'unsigned.json').write_bytes(artifact.encode(m))
            key=folder/'key';pub=folder/'pub'
            subprocess.run(['openssl','genpkey','-algorithm','ED25519','-out',str(key)],check=True,capture_output=True)
            subprocess.run(['openssl','pkey','-in',str(key),'-pubout','-out',str(pub)],check=True,capture_output=True)
            with patch.object(cli,'ci_context',return_value=(sha,run)),patch.object(trust,'make_trust',return_value=policy),patch.dict(os.environ,{'STAGING_AUTOMATION_KEY':key.read_text(),'STAGING_AUTOMATION_KEY_SHA256':trust.digest(pub.read_bytes()),'RUNNER_TEMP':tmp}):
                cli.sign(source,folder/'output')
                self.assertNotIn('STAGING_AUTOMATION_KEY',os.environ)
            self.assertEqual({p.name for p in (folder/'output').iterdir()},{'release.zip','manifest.json','manifest.sig'})
            output=folder/'verified';output.mkdir()
            envelope=artifact.zip_bytes({p.name:p.read_bytes() for p in (folder/'output').iterdir()})
            runtime.authenticated_release(envelope,output,{'automation_public_key':str(pub),'automation_public_key_sha256':trust.digest(pub.read_bytes())},policy,sha,run)

    def test_installed_bundle_matches_all_reviewed_tools(self):
        install.verify_bundle()
        records=[line.split() for line in (ROOT/'ops/ci_staging/bundle.sha256').read_text().splitlines()]
        self.assertIn('ops/cinematic/pull_deploy.py',[n for _,n in records])
        self.assertIn('ops/cinematic/media_policy.py',[n for _,n in records])
        self.assertIn('ops/cinematic/owner-media-policy.json',[n for _,n in records])
        for digest,name in records:self.assertEqual(trust.digest((ROOT/name).read_bytes()),digest)

    def test_private_installed_configuration_and_runtime_integrity(self):
        import shutil, types
        with tempfile.TemporaryDirectory() as tmp:
            base=Path(tmp);bundle=base/'runtime';bundle.mkdir(mode=0o700)
            records=[line.split() for line in (ROOT/'ops/ci_staging/bundle.sha256').read_text().splitlines()]
            for _,name in records:
                p=bundle/name;p.parent.mkdir(mode=0o700,parents=True,exist_ok=True);shutil.copyfile(ROOT/name,p);p.chmod(0o600)
            inventory=bundle/'ops/ci_staging/bundle.sha256';shutil.copyfile(ROOT/'ops/ci_staging/bundle.sha256',inventory);inventory.chmod(0o600)
            state=base/'owner';state.mkdir(mode=0o700)
            pubs=[]
            for name in ['owner','automation']:
                key=base/(name+'.private');pub=base/(name+'.pub')
                subprocess.run(['openssl','genpkey','-algorithm','ED25519','-out',str(key)],check=True,capture_output=True)
                subprocess.run(['openssl','pkey','-in',str(key),'-pubout','-out',str(pub)],check=True,capture_output=True)
                pub.chmod(0o600);pubs.append(pub)
            files={}
            for name,data in [('owner-config',b'{}'),('trust',b'{}'),('token',b'fixture')]:
                p=base/name;p.write_bytes(data);p.chmod(0o600);files[name]=p
            owner={'enabled':False,'_root':Path(trust.DOCUMENT_ROOT),'site':trust.ORIGIN,'_state':state,'release_public_key_sha256':trust.digest(pubs[0].read_bytes()),'release_public_key':str(pubs[0])}
            cfg={'schema':'ci-staging-config/v1','enabled':True,'owner_config':str(files['owner-config']),'runtime':str(bundle),'runtime_bundle_sha256':trust.digest(inventory.read_bytes()),'trust_file':str(files['trust']),'trust_sha256':trust.digest(files['trust'].read_bytes()),'automation_public_key':str(pubs[1]),'automation_public_key_sha256':trust.digest(pubs[1].read_bytes()),'github_token_file':str(files['token']),'state_dir':str(state/'ci-staging')}
            config=base/'config';config.write_text(json.dumps(cfg));config.chmod(0o600)
            with patch.object(runtime,'ROOT',bundle),patch.object(runtime.pwd,'getpwuid',return_value=types.SimpleNamespace(pw_name='mariyascloud')),patch.object(runtime.core,'config_load',return_value=owner):
                self.assertEqual(runtime.load_config(config)[0],cfg)
                (bundle/'ops/ci_staging/trust.py').write_text('altered runtime')
                with self.assertRaisesRegex(ValueError,'runtime file changed'):runtime.load_config(config)


if __name__=='__main__':unittest.main()
