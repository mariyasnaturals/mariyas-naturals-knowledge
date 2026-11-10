import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import types
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('pull', Path(__file__).resolve().parents[2] / 'ops/pull_deploy.py')
pull = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pull)


class PullSafety(unittest.TestCase):
    def setUp(self):
        previous_umask = os.umask(0o022)
        self.addCleanup(os.umask, previous_umask)
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'web'
        self.state = self.base / 'state'
        self.root.mkdir()
        self.state.mkdir(mode=0o700)
        (self.root / 'index.html').write_text('PREVIOUS')
        (self.root / 'old.js').write_text('old static content')
        (self.root / '.well-known/acme-challenge').mkdir(parents=True)
        (self.root / '.well-known/acme-challenge/token').write_text('ACME')
        (self.root / '.htaccess').write_text('PROTECTED CONFIG')
        (self.root / '.mariyas-cloud-root').write_text(pull.ORIGIN + '\n')
        (self.root / '.mariyas-cloud-root').chmod(0o600)
        self.key = self.base / 'private.pem'
        self.public = self.base / 'public.pem'
        subprocess.run(['openssl', 'genpkey', '-algorithm', 'ED25519', '-out', str(self.key)], check=True, capture_output=True)
        subprocess.run(['openssl', 'pkey', '-in', str(self.key), '-pubout', '-out', str(self.public)], check=True, capture_output=True)
        self.cfg = {'_root': self.root, '_state': self.state, 'release_public_key': str(self.public), 'enabled': False}
        self.files = {name: b'<html><head><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://www.mariyasnaturals.cloud/en/"></head><body><img src="/images/current.webp"></body></html>' for name in ['index.html', 'en/index.html', 'ml/index.html', 'hi/index.html', 'ta/index.html']}
        self.files['robots.txt'] = b'User-agent: *\nDisallow: /\n'
        self.files['images/current.webp'] = b'approved compiled image fixture'

    def snapshot(self):
        return {p.relative_to(self.root).as_posix(): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}

    def release(self, sequence=1, names=None, alter=None):
        directory = self.base / ('release-' + str(len(list(self.base.glob('release-*')))))
        directory.mkdir()
        content = names or self.files
        with zipfile.ZipFile(directory / 'release.zip', 'w') as z:
            for name, data in content.items():
                z.writestr(name, data)
        m = {'schema': 1, 'site': pull.ORIGIN, 'branch': pull.SOURCE_BRANCH, 'source_sha': 'a' * 40, 'sequence': sequence, 'robots': 'noindex, nofollow', 'purchasing_enabled': False, 'media_policy': 'current-approved-in-only', 'checks': ['types', 'lint', 'unit', 'build', 'static', 'media-policy', 'browser'], 'archive_sha256': pull.digest((directory / 'release.zip').read_bytes()), 'approved_images': {'images/current.webp': pull.digest(self.files['images/current.webp'])}, 'files': [{'path': n, 'bytes': len(d), 'sha256': pull.digest(d)} for n, d in content.items()]}
        if alter:
            alter(m)
        (directory / 'manifest.json').write_text(json.dumps(m))
        self.sign(directory)
        return directory

    def sign(self, directory):
        subprocess.run(['openssl', 'pkeyutl', '-sign', '-inkey', str(self.key), '-rawin', '-in', str(directory / 'manifest.json'), '-out', str(directory / 'manifest.sig')], check=True, capture_output=True)

    def verified(self, sequence=1):
        return pull.verify_release(self.release(sequence), self.cfg)

    def approve(self, manifest_hash):
        pull.atomic_json(self.state / 'initial-approval.json', {'manifest_sha256': manifest_hash, 'inventory_sha256': pull.inventory_hash(pull.static_inventory(self.root))})

    def deploy(self):
        self.cfg['enabled'] = True
        m, h, staged = self.verified()
        self.approve(h)
        pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        return m, h, staged

    def test_dry_run_leaves_every_website_byte_and_backup_directory_untouched(self):
        before = self.snapshot()
        m, h, staged = self.verified()
        pull.apply_release(self.cfg, m, h, staged, 'b' * 40)
        self.assertEqual(before, self.snapshot())
        self.assertFalse((self.state / 'backups').exists())
        self.assertFalse((self.state / 'current.json').exists())

    def test_live_is_disabled_and_first_approval_must_match_release_and_inventory(self):
        m, h, staged = self.verified()
        with self.assertRaises(ValueError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        self.cfg['enabled'] = True
        with self.assertRaises(FileNotFoundError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        self.approve(h)
        (self.root / 'new.txt').write_text('changed after approval')
        with self.assertRaises(ValueError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        self.assertEqual((self.root / 'index.html').read_text(), 'PREVIOUS')

    def test_apply_requires_verified_backup_and_preserves_well_known_and_dotfiles(self):
        self.deploy()
        current = pull.read_json(self.state / 'current.json')
        folder = self.state / 'backups' / current['backup']
        pull.verify_backup(folder)
        with zipfile.ZipFile(folder / 'site.zip') as z:
            self.assertEqual(z.read('index.html'), b'PREVIOUS')
        self.assertEqual((self.root / '.well-known/acme-challenge/token').read_text(), 'ACME')
        self.assertEqual((self.root / '.htaccess').read_text(), 'PROTECTED CONFIG')
        self.assertFalse((self.root / 'old.js').exists())

    def test_rollback_is_backed_up_and_polling_does_not_undo_it(self):
        m, h, staged = self.deploy()
        current = pull.read_json(self.state / 'current.json')
        before = self.snapshot()
        pull.rollback(self.cfg, current['backup'])
        self.assertEqual(before, self.snapshot())
        pull.rollback(self.cfg, current['backup'], True)
        self.assertEqual((self.root / 'index.html').read_text(), 'PREVIOUS')
        self.assertEqual(pull.read_json(self.state / 'current.json')['max_sequence'], 1)
        pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        self.assertEqual((self.root / 'index.html').read_text(), 'PREVIOUS')

    def test_signature_and_archive_tampering_fail_before_website_write(self):
        before = self.snapshot()
        directory = self.release()
        (directory / 'manifest.json').write_text('{}')
        with self.assertRaises(ValueError):
            pull.verify_release(directory, self.cfg)
        directory = self.release()
        (directory / 'release.zip').write_bytes(b'tampered')
        with self.assertRaises(ValueError):
            pull.verify_release(directory, self.cfg)
        self.assertEqual(before, self.snapshot())

    def test_signed_wrong_site_source_policy_and_checks_fail(self):
        for key, value in [('site', 'https://mariyasnaturals.in'), ('branch', 'unapproved'), ('purchasing_enabled', True), ('robots', 'index, follow'), ('media_policy', 'legacy'), ('checks', [])]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                pull.verify_release(self.release(alter=lambda m: m.update({key: value})), self.cfg)

    def test_traversal_dotfiles_well_known_and_server_scripts_are_rejected(self):
        for name in ['../escape.html', '/absolute.html', '.well-known/token', '_astro/../../escape.js', 'index.php', '.htaccess']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                pull.verify_release(self.release(names={**self.files, name: b'BAD'}), self.cfg)
        self.assertFalse((self.base / 'escape.html').exists())

    def test_zip_symlink_is_rejected_even_with_valid_signature(self):
        directory = self.release()
        with zipfile.ZipFile(directory / 'release.zip', 'w') as z:
            for name, data in self.files.items():
                item = zipfile.ZipInfo(name)
                item.external_attr = (0o120777 << 16) if name.endswith('.webp') else (0o100644 << 16)
                z.writestr(item, data)
        m = json.loads((directory / 'manifest.json').read_text())
        m['archive_sha256'] = pull.digest((directory / 'release.zip').read_bytes())
        (directory / 'manifest.json').write_text(json.dumps(m))
        self.sign(directory)
        with self.assertRaises(ValueError):
            pull.verify_release(directory, self.cfg)

    def test_corrupt_backup_blocks_write(self):
        before = self.snapshot()
        m, h, staged = self.verified()
        self.cfg['enabled'] = True
        self.approve(h)
        with patch.object(pull, 'verify_backup', side_effect=ValueError('corrupt backup')), self.assertRaises(ValueError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        self.assertEqual(before, self.snapshot())

    def test_partial_failure_restores_verified_backup(self):
        before = self.snapshot()
        m, h, staged = self.verified()
        self.cfg['enabled'] = True
        self.approve(h)
        real = pull.reconcile
        calls = []
        def fail_once(root, desired, data_for):
            if not calls:
                calls.append(True)
                (root / 'index.html').write_text('PARTIAL')
                raise OSError('simulated write failure')
            return real(root, desired, data_for)
        with patch.object(pull, 'reconcile', side_effect=fail_once), self.assertRaises(OSError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        self.assertEqual(before, self.snapshot())
        self.assertFalse((self.state / 'pending.json').exists())

    def test_pending_transaction_blocks_new_release_until_explicit_recovery(self):
        self.deploy()
        current = pull.read_json(self.state / 'current.json')
        pull.atomic_json(self.state / 'pending.json', {'backup': current['backup'], 'previous': {'max_sequence': 0}})
        m, h, staged = self.verified(2)
        with self.assertRaises(ValueError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40, True)
        (self.root / '.mariyas-write-index.html').write_text('orphan from simulated process termination')
        pull.rollback(self.cfg, current['backup'], True, recover=True)
        self.assertFalse((self.root / '.mariyas-write-index.html').exists())
        self.assertEqual((self.root / 'index.html').read_text(), 'PREVIOUS')

    def test_symlink_and_file_directory_conflicts_refuse_without_changes(self):
        m, h, staged = self.verified()
        outside = self.base / 'outside'
        outside.write_text('UNTOUCHED')
        (self.root / 'images').symlink_to(outside)
        with self.assertRaises(ValueError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40)
        self.assertEqual(outside.read_text(), 'UNTOUCHED')
        (self.root / 'images').unlink()
        (self.root / 'en').write_text('existing file')
        with self.assertRaises(ValueError):
            pull.apply_release(self.cfg, m, h, staged, 'b' * 40)

    def test_config_refuses_wrong_user_wordpress_wrong_marker_and_public_state(self):
        key = self.base / 'deploy-key'
        key.write_text('fixture')
        key.chmod(0o600)
        cfg = {'site': pull.ORIGIN, 'enabled': False, 'document_root': str(self.root), 'state_dir': str(self.state), 'deploy_key': str(key), 'known_hosts': str(self.public), 'release_public_key': str(self.public), 'release_public_key_sha256': pull.digest(self.public.read_bytes())}
        path = self.base / 'config.json'
        path.write_text(json.dumps(cfg))
        path.chmod(0o600)
        with patch.object(pull.pwd, 'getpwuid', return_value=types.SimpleNamespace(pw_name='wrong')), self.assertRaises(ValueError):
            pull.config_load(path)
        with patch.object(pull.pwd, 'getpwuid', return_value=types.SimpleNamespace(pw_name='mariyascloud')):
            pull.config_load(path)
            (self.root / 'wp-config.php').write_text('do not touch')
            with self.assertRaises(ValueError):
                pull.config_load(path)
            (self.root / 'wp-config.php').unlink()
            cfg['state_dir'] = str(self.root / 'backups')
            path.write_text(json.dumps(cfg))
            with self.assertRaises(ValueError):
                pull.config_load(path)


    def test_concurrent_cron_lock_skips_without_fetch_or_write(self):
        lock_path = self.state / 'lock'
        with open(lock_path, 'a') as lock:
            pull.fcntl.flock(lock, pull.fcntl.LOCK_EX | pull.fcntl.LOCK_NB)
            with patch.object(pull, 'config_load', return_value=self.cfg), patch.object(pull, 'git_fetch') as fetch, patch('sys.argv', ['pull_deploy.py', '--config', 'fixture']):
                pull.main()
                fetch.assert_not_called()

    def test_signed_duplicate_archive_entry_is_rejected(self):
        directory = self.release()
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            with zipfile.ZipFile(directory / 'release.zip', 'a') as z:
                z.writestr('index.html', b'DUPLICATE')
        m = json.loads((directory / 'manifest.json').read_text())
        m['archive_sha256'] = pull.digest((directory / 'release.zip').read_bytes())
        (directory / 'manifest.json').write_text(json.dumps(m))
        self.sign(directory)
        with self.assertRaises(ValueError):
            pull.verify_release(directory, self.cfg)

    def test_signed_file_hash_mismatch_is_rejected(self):
        with self.assertRaises(ValueError):
            pull.verify_release(self.release(alter=lambda m: m['files'][0].update({'sha256': '0' * 64})), self.cfg)


    def test_publisher_local_git_creates_only_data_and_advances_without_force(self):
        spec = importlib.util.spec_from_file_location('publisher', Path(__file__).resolve().parents[2] / 'ops/publish_release.py')
        publisher = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(publisher)
        remote = self.base / 'fixture-remote.git'
        subprocess.run(['git', 'init', '--bare', str(remote)], check=True, capture_output=True)
        source = self.base / 'publication'
        source.mkdir()
        for name in ['manifest.json', 'manifest.sig', 'release.zip']:
            (source / name).write_bytes(b'fixture static data')
        env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
        env.update({'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null'})
        publisher.publish(source, env, str(remote))
        first = subprocess.check_output(['git', '--git-dir=' + str(remote), 'rev-parse', 'staging-release']).strip()
        (source / 'manifest.json').write_bytes(b'second fixture')
        publisher.publish(source, env, str(remote))
        parent = subprocess.check_output(['git', '--git-dir=' + str(remote), 'rev-parse', 'staging-release^']).strip()
        self.assertEqual(first, parent)
        tree = subprocess.check_output(['git', '--git-dir=' + str(remote), 'ls-tree', '--name-only', 'staging-release']).decode().splitlines()
        self.assertEqual(tree, ['manifest.json', 'manifest.sig', 'release.zip'])


if __name__ == '__main__':
    unittest.main()
