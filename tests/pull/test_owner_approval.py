"""Approval-boundary tests use disposable keys and local data only."""
import contextlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch
import zipfile
import test_pull

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'ops'))
import prepare_release as owner
import publish_release as publisher
import pull_deploy as pull


class OwnerApproval(unittest.TestCase):
    def setUp(self):
        self.fixture = test_pull.PullSafety()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.base = self.fixture.base
        self.key, self.public = self.fixture.key, self.fixture.public
        fixture_release = self.fixture.release()
        manifest = json.loads((fixture_release / 'manifest.json').read_text())
        self.images = manifest['approved_images']
        policy = patch.object(owner, 'policy_images', return_value=self.images)
        policy.start()
        self.addCleanup(policy.stop)
        self.bundle = self.base / 'bundle'
        self.bundle.mkdir()
        self.archive = self.bundle / 'review.zip'
        self.archive.write_bytes((fixture_release / 'release.zip').read_bytes())
        self.review = {'sourceSha': 'a' * 40, 'origin': pull.ORIGIN, 'robots': 'noindex, nofollow', 'purchasingEnabled': False, 'approvedUiBaseline': owner.BASELINE, 'archive': 'review.zip', 'archiveSha256': pull.digest(self.archive.read_bytes()), 'files': manifest['files']}
        (self.bundle / 'review-manifest.json').write_text(json.dumps(self.review))
        self.candidate = self.base / 'candidate'

    def inspect(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return owner.inspect(self.bundle, self.candidate, 'a' * 40, 1, '42')

    def signed(self):
        h = self.inspect()
        owner.approve(self.candidate, self.key, self.public, h)
        return h

    def test_inspection_is_unsigned_and_never_opens_or_executes_a_key(self):
        with patch.object(owner.subprocess, 'run') as process:
            self.inspect()
            process.assert_not_called()
        self.assertFalse((self.candidate / 'manifest.sig').exists())

    def test_exact_manifest_approval_is_required_before_key_access(self):
        self.inspect()
        with patch.object(owner.subprocess, 'run') as process, self.assertRaises(ValueError):
            owner.approve(self.candidate, self.base / 'missing-key', self.public, '0' * 64)
        process.assert_not_called()
        self.assertFalse((self.candidate / 'manifest.sig').exists())

    def test_archive_tampering_is_rejected_before_key_access(self):
        h = self.inspect()
        (self.candidate / 'release.zip').write_bytes(b'edited after review')
        with patch.object(owner.subprocess, 'run') as process, self.assertRaises(ValueError):
            owner.approve(self.candidate, self.key, self.public, h)
        process.assert_not_called()

    def test_review_source_must_equal_explicit_owner_selection(self):
        with self.assertRaises(ValueError):
            owner.inspect(self.bundle, self.candidate, 'b' * 40, 1, '42')
        self.assertFalse(self.candidate.exists())

    def test_signed_build_is_accepted_by_unchanged_vps_verifier(self):
        before = self.fixture.snapshot()
        h = self.signed()
        publisher.verify_publication(self.candidate, self.public, h)
        m, actual, _ = pull.verify_release(self.candidate, self.fixture.cfg)
        self.assertEqual(h, actual)
        self.assertEqual(m['approval']['workflow_run_id'], '42')
        self.assertEqual(before, self.fixture.snapshot())

    def test_artifact_cannot_replace_installed_media_policy(self):
        self.inspect()
        p = self.candidate / 'manifest.json'
        m = json.loads(p.read_text())
        m['approved_images'] = {'images/old.webp': '0' * 64}
        p.write_text(json.dumps(m))
        with patch.object(owner.subprocess, 'run') as process, self.assertRaises(ValueError):
            owner.approve(self.candidate, self.key, self.public, pull.digest(p.read_bytes()))
        process.assert_not_called()

    def test_wrong_signing_key_never_releases_signature(self):
        h = self.inspect()
        other = self.base / 'other.pem'
        subprocess.run(['openssl', 'genpkey', '-algorithm', 'ED25519', '-out', str(other)], check=True, capture_output=True)
        with self.assertRaises(ValueError):
            owner.approve(self.candidate, other, self.public, h)
        self.assertFalse((self.candidate / 'manifest.sig').exists())

    def test_encrypted_key_can_sign_after_owner_unlock(self):
        h = self.inspect()
        encrypted = self.base / 'encrypted.pem'
        password = b'disposable test passphrase\n'
        subprocess.run(['openssl', 'pkey', '-in', str(self.key), '-aes-256-cbc', '-passout', 'stdin', '-out', str(encrypted)], input=password, check=True, capture_output=True)
        encrypted.chmod(0o600)
        real_run = subprocess.run
        def unlock(command, **kwargs):
            if command[:3] == ['openssl', 'pkeyutl', '-sign']:
                # Simulate the owner's unlock without requiring a physical terminal in CI.
                command = [*command, '-passin', 'stdin']
                kwargs.update(input=password, capture_output=True)
            return real_run(command, **kwargs)
        with patch.object(owner.subprocess, 'run', side_effect=unlock):
            owner.approve(self.candidate, encrypted, self.public, h)
        publisher.verify_publication(self.candidate, self.public, h)

    def test_candidate_change_during_unlock_does_not_release_a_signature(self):
        h = self.inspect()
        real_run = subprocess.run
        def change_after_sign(command, **kwargs):
            result = real_run(command, **kwargs)
            if command[:3] == ['openssl', 'pkeyutl', '-sign']:
                p = self.candidate / 'manifest.json'
                m = json.loads(p.read_text())
                m['sequence'] = 2
                p.write_text(json.dumps(m))
            return result
        with patch.object(owner.subprocess, 'run', side_effect=change_after_sign), self.assertRaises(ValueError):
            owner.approve(self.candidate, self.key, self.public, h)
        self.assertFalse((self.candidate / 'manifest.sig').exists())

    def test_cli_refuses_ci_before_reading_inputs_or_credentials(self):
        with patch.dict(os.environ, {'GITHUB_ACTIONS': 'true'}):
            with self.assertRaises(ValueError):
                owner.main()
            with self.assertRaises(ValueError):
                publisher.main()

    def test_publication_defaults_to_dry_run_without_network_or_token(self):
        h = self.signed()
        argv = ['publish_release.py', '--candidate', str(self.candidate), '--public-key', str(self.public), '--approve-manifest-sha256', h]
        with patch.dict(os.environ, {'GITHUB_ACTIONS': '', 'CI': ''}), patch('sys.argv', argv), patch.object(publisher, 'publish') as publish, patch.object(publisher.getpass, 'getpass') as token:
            publisher.main()
            publish.assert_not_called()
            token.assert_not_called()

    def test_publication_refuses_missing_signature_wrong_digest_and_signature_tamper(self):
        h = self.inspect()
        with self.assertRaises(ValueError):
            publisher.verify_publication(self.candidate, self.public, h)
        owner.approve(self.candidate, self.key, self.public, h)
        with self.assertRaises(ValueError):
            publisher.verify_publication(self.candidate, self.public, '0' * 64)
        (self.candidate / 'manifest.sig').write_bytes(b'forged')
        with self.assertRaises(ValueError):
            publisher.verify_publication(self.candidate, self.public, h)

    def test_outer_download_is_read_as_data_and_rejects_traversal(self):
        download = self.base / 'artifact.zip'
        with zipfile.ZipFile(download, 'w') as z:
            for path in self.bundle.iterdir():
                z.write(path, path.name)
        with owner.artifact_bundle(download) as bundle:
            self.assertEqual((bundle / 'review.zip').read_bytes(), self.archive.read_bytes())
        with zipfile.ZipFile(download, 'w') as z:
            z.writestr('../escape.py', 'malicious source')
        with self.assertRaises(ValueError):
            with owner.artifact_bundle(download):
                self.fail('Unsafe artifact accepted')
        self.assertFalse((self.base / 'escape.py').exists())

    def test_actions_has_no_signing_or_publication_authority(self):
        workflows = Path(__file__).resolve().parents[2] / '.github/workflows'
        for path in workflows.glob('*.yml'):
            text = path.read_text()
            self.assertNotIn('contents: write', text)
            self.assertNotIn('STAGING_RELEASE_SIGNING_KEY', text)
            self.assertNotIn('ops/publish_release.py', text)
            self.assertNotIn('ops/prepare_release.py', text)
