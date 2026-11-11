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
