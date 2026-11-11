"""Cinematic verifier tests: disposable signatures, never owner keys or live hosts."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ops/cinematic'))
import pull_deploy as pull
import prepare_release as owner


class CinematicRelease(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.policy = json.loads((ROOT/'ops/cinematic/owner-media-policy.json').read_text())

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.key, self.pub = self.root/'test-private.pem', self.root/'test-public.pem'
        subprocess.run(['openssl','genpkey','-algorithm','ED25519','-out',str(self.key)], check=True, capture_output=True)
        subprocess.run(['openssl','pkey','-in',str(self.key),'-pubout','-out',str(self.pub)], check=True, capture_output=True)
        self.release = self.root/'candidate'
        self.release.mkdir()
        self.files = {n:(ROOT/'public'/n).read_bytes() for n in self.policy['approved_images']}
        page = ('<meta name="robots" content="noindex, nofollow"><link rel="canonical" href="'+pull.ORIGIN+'/en/"><img src="/cinematic/original-model.jpg">').encode()
        self.files.update({n:page for n in ['index.html','en/index.html','ml/index.html','hi/index.html','ta/index.html']})
        self.files['robots.txt'] = b'User-agent: *\nDisallow: /\n'
        self.write_archive()
        self.manifest = {'schema':1,'site':pull.ORIGIN,'branch':pull.SOURCE_BRANCH,'source_sha':owner.BASELINE,'approved_ui_baseline':owner.BASELINE,'sequence':1,'robots':'noindex, nofollow','purchasing_enabled':False,'media_policy':'current-approved-in-only','checks':owner.CHECKS,'approved_images':self.policy['approved_images'],'archive_sha256':pull.digest((self.release/'release.zip').read_bytes()),'files':[{'path':n,'bytes':len(d),'sha256':pull.digest(d)} for n,d in self.files.items()],'approval':{'method':'offline-owner','workflow_run_id':'42','workflow_run_attempt':1}}
        self.sign()

    def write_archive(self):
        with zipfile.ZipFile(self.release/'release.zip','w') as z:
            for n,d in self.files.items(): z.writestr(n,d)

    def sign(self):
        (self.release/'manifest.json').write_text(json.dumps(self.manifest))
        subprocess.run(['openssl','pkeyutl','-sign','-inkey',str(self.key),'-rawin','-in',str(self.release/'manifest.json'),'-out',str(self.release/'manifest.sig')],check=True,capture_output=True)

    def verify(self):
        import shutil
        shutil.rmtree(self.release/'site', ignore_errors=True)  # Fresh disposable extraction per attempt.
        return pull.verify_release(self.release,{'release_public_key':str(self.pub)})

    def test_legitimate_cinematic_candidate_and_signature_are_accepted(self):
        owner.validate_candidate(self.release)
        self.assertEqual(self.verify()[0]['source_sha'], owner.BASELINE)

    def test_unapproved_baseline_and_preview_schema_are_refused(self):
        for field,value in [('approved_ui_baseline','0'*40),('schema','mariyas-unapproved-pr-preview/v1')]:
            saved=copy.deepcopy(self.manifest); self.manifest[field]=value; self.sign()
            with self.assertRaises(ValueError): owner.validate_candidate(self.release)
            with self.assertRaises(ValueError): self.verify()
            self.manifest=saved

    def test_altered_manifest_and_signature_failure_are_refused(self):
        (self.release/'manifest.json').write_bytes((self.release/'manifest.json').read_bytes()+b' ')
        with self.assertRaisesRegex(ValueError,'signature'): self.verify()
        self.sign(); (self.release/'manifest.sig').write_bytes(b'forged')
        with self.assertRaisesRegex(ValueError,'signature'): self.verify()

    def test_tampered_original_even_with_updated_archive_digest_is_refused(self):
        n='cinematic/original-product.jpg'; self.files[n]+=b'tampered'; self.write_archive()
        self.manifest['archive_sha256']=pull.digest((self.release/'release.zip').read_bytes())
        for f in self.manifest['files']:
            if f['path']==n: f.update(bytes=len(self.files[n]),sha256=pull.digest(self.files[n]))
        self.sign()
        with self.assertRaises(ValueError): owner.validate_candidate(self.release)
        with self.assertRaises(ValueError): self.verify()

    def test_only_exact_cinematic_paths_are_admitted(self):
        for path in ['../escape.mp4','cinematic/extra.mp4','cinematic/../private.jpg','cinematic/original-product.jpg/evil','/cinematic/original-product.jpg']:
            self.assertFalse(pull.valid_name(path))
        self.assertTrue(pull.valid_name('cinematic/homepage-mobile.mp4'))

    def test_pinned_tool_checksums_match(self):
        folder=ROOT/'ops/cinematic'
        for line in (folder/'owner-tools.sha256').read_text().splitlines():
            digest,name=line.split()
            self.assertEqual(hashlib.sha256((folder/name).read_bytes()).hexdigest(),digest)

    def test_mp4_tamper_and_missing_photograph_are_refused(self):
        for name in ['cinematic/homepage-desktop.mp4', 'cinematic/original-model.jpg']:
            with self.subTest(name=name):
                original=self.files[name]; self.files[name]=original+b'changed'; self.write_archive()
                self.manifest['archive_sha256']=pull.digest((self.release/'release.zip').read_bytes()); self.sign()
                with self.assertRaises(ValueError): self.verify()
                self.files[name]=original
        del self.files['cinematic/original-product.jpg']; self.write_archive()
        self.manifest['archive_sha256']=pull.digest((self.release/'release.zip').read_bytes()); self.sign()
        with self.assertRaises(ValueError): self.verify()

    def test_unapproved_branch_source_and_policy_metadata_are_refused(self):
        import media_policy
        for field,value in [('branch','main'),('source_sha','not-a-sha')]:
            saved=copy.deepcopy(self.manifest); self.manifest[field]=value; self.sign()
            with self.assertRaises(ValueError): self.verify()
            self.manifest=saved
        bundle=self.root/'bundle'; bundle.mkdir()
        (bundle/'review-manifest.json').write_text(json.dumps({'sourceSha':'a'*40,'origin':pull.ORIGIN,'robots':'noindex, nofollow','purchasingEnabled':False}))
        with self.assertRaisesRegex(ValueError,'selected source'):
            owner.inspect(bundle,self.root/'out','b'*40,1,'42')
        policy=copy.deepcopy(self.policy); policy['cinematicProvenance'][0]['width']=1
        with self.assertRaises(ValueError): media_policy.validate(policy)
        policy=copy.deepcopy(self.policy)
        for r in policy['cinematicProvenance']:
            if r.get('derivedFrom'): r['sourceSha256']='0'*64; break
        with self.assertRaises(ValueError): media_policy.validate(policy)

    def test_oversized_archive_and_symlink_entry_are_refused(self):
        from unittest.mock import patch
        with patch.object(pull,'MAX_ZIP',1), self.assertRaisesRegex(ValueError,'size'): self.verify()
        with zipfile.ZipFile(self.release/'release.zip','a') as z:
            entry=zipfile.ZipInfo('evil.js'); entry.external_attr=0o120777<<16
            z.writestr(entry,'/etc/passwd')
        self.manifest['files'].append({'path':'evil.js','bytes':11,'sha256':pull.digest(b'/etc/passwd')})
        self.manifest['archive_sha256']=pull.digest((self.release/'release.zip').read_bytes()); self.sign()
        with self.assertRaises(ValueError): self.verify()
        alias=self.root/'alias'; alias.mkdir()
        (alias/'manifest.json').symlink_to(self.release/'manifest.json')
        with self.assertRaises(ValueError): owner.validate_candidate(alias)

    def test_wrong_root_unauthorized_apply_and_replay_are_refused(self):
        from unittest.mock import patch
        import types
        cfgfile=self.root/'config.json'
        cfgfile.write_text(json.dumps({'site':pull.ORIGIN,'document_root':str(self.root),'state_dir':str(self.root/'state')}));cfgfile.chmod(0o600)
        with patch.object(pull.pwd,'getpwuid',return_value=types.SimpleNamespace(pw_name='mariyascloud')):
            with self.assertRaisesRegex(ValueError,'document root'): pull.config_load(cfgfile)
        m,h,staged=self.verify(); web=self.root/'web';web.mkdir();(web/'index.html').write_text('OLD')
        state=self.root/'state';state.mkdir(mode=0o700)
        cfg={'_root':web,'_state':state,'enabled':False}
        with self.assertRaisesRegex(ValueError,'disabled'):pull.apply_release(cfg,m,h,staged,'a'*40,True)
        cfg['enabled']=True
        with self.assertRaises(FileNotFoundError):pull.apply_release(cfg,m,h,staged,'a'*40,True)
        pull.atomic_json(state/'current.json',{'max_sequence':m['sequence']+1})
        pull.apply_release(cfg,m,h,staged,'a'*40,True)
        self.assertEqual((web/'index.html').read_text(),'OLD')
        self.assertFalse((state/'backups').exists())

    def test_rollback_backup_and_first_apply_algorithms_remain_identical_to_trusted_ops(self):
        import ast
        old=ast.parse((ROOT/'ops/pull_deploy.py').read_text())
        new=ast.parse((ROOT/'ops/cinematic/pull_deploy.py').read_text())
        for name in ['backup','verify_backup','reconcile','restore','apply_release','rollback','git_fetch']:
            before=next(n for n in old.body if isinstance(n,ast.FunctionDef) and n.name==name)
            after=next(n for n in new.body if isinstance(n,ast.FunctionDef) and n.name==name)
            self.assertEqual(ast.dump(before),ast.dump(after), name)
