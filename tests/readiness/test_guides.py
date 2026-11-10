"""Execute new guide logic only in disposable local fixtures; never contact VPS/GitHub."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import tempfile
import os
import pwd
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
VPS = ROOT / 'docs/vps-first-activation.md'
ANDROID = ROOT / 'docs/android-owner-setup.md'
REAL_ROOT = '/home/mariyascloud/htdocs/www.mariyasnaturals.cloud'


def blocks(path):
    return re.findall(r'```sh\n(.*?)\n```', path.read_text(), re.S)


def python_blocks(path):
    return [m.group(1) for b in blocks(path) for m in re.finditer(r"python3? - <<'PY'\n(.*?)\nPY", b, re.S)]


class GuideSimulation(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name) / 'home'
        self.home.mkdir()
        self.web = self.home / 'htdocs/www.mariyasnaturals.cloud'
        self.web.mkdir(parents=True)
        (self.web/'index.html').write_text('old staging')
        (self.web/'.well-known').mkdir()
        (self.web/'.well-known/token').write_text('ACME')
        self.before = self.snapshot()
        patch_home = patch.object(Path, 'home', return_value=self.home)
        patch_home.start(); self.addCleanup(patch_home.stop)
        actual = pwd.getpwuid(os.geteuid())
        patch_user = patch('pwd.getpwuid', return_value=pwd.struct_passwd(('mariyascloud', *actual[1:])))
        patch_user.start(); self.addCleanup(patch_user.stop)

    def snapshot(self):
        return {p.relative_to(self.web).as_posix(): p.read_bytes() for p in self.web.rglob('*') if p.is_file()}

    def execute(self, code, answers=()):
        # Only adapt the literal target/home/user and terminal input for local fixtures.
        # Crypto, tar/ZIP checks, file permissions and data comparisons execute for real.
        code = code.replace(REAL_ROOT, str(self.web)).replace("sys.stdin = open('/dev/tty')", 'pass # terminal input simulated by unittest')
        with patch('builtins.input', side_effect=list(answers)), contextlib.redirect_stdout(io.StringIO()):
            exec(compile(code, '<reviewed-guide-fixture>', 'exec'), {})

    def backup(self):
        self.execute(python_blocks(VPS)[1])
        receipts = list((self.home/'.local/state/mariyas-pull/operator-backups').glob('*.verified.json'))
        self.assertEqual(len(receipts), 1)
        return receipts[0]

    def key(self, encrypted=False):
        folder = self.home/'.local/share/mariyas-owner/keys'
        folder.mkdir(parents=True)
        private, public = folder/'release-private.pem', folder/'release-public.pem'
        command = ['openssl', 'genpkey', '-algorithm', 'ED25519', '-out', str(private)]
        if encrypted:
            command += ['-aes-256-cbc', '-pass', 'pass:disposable-fixture-key']
        subprocess.run(command, check=True, capture_output=True)
        command = ['openssl', 'pkey', '-in', str(private), '-pubout', '-out', str(public)]
        if encrypted:
            command += ['-passin', 'pass:disposable-fixture-key']
        subprocess.run(command, check=True, capture_output=True)
        return public

    def test_all_copy_paste_blocks_have_valid_shell_and_python_syntax(self):
        for path in [VPS, ANDROID]:
            for block in blocks(path):
                subprocess.run(['bash', '-n'], input=block, text=True, check=True, capture_output=True)
            for code in python_blocks(path):
                compile(code, str(path), 'exec')

    def test_first_preflight_and_full_backup_leave_every_website_byte_unchanged(self):
        self.execute(python_blocks(VPS)[0])
        receipt = self.backup()
        record = json.loads(receipt.read_text())
        self.assertEqual(hashlib.sha256(Path(record['archive']).read_bytes()).hexdigest(), record['sha256'])
        self.assertIn('.well-known/token', record['files'])
        self.assertEqual(self.before, self.snapshot())

    def test_verified_backup_public_pin_and_disabled_config_install(self):
        receipt = self.backup()
        public = self.key()
        answers = ['www.mariyasnaturals.cloud', str(receipt), *public.read_text().splitlines(), hashlib.sha256(public.read_bytes()).hexdigest()]
        self.execute(python_blocks(VPS)[3], answers)
        config = self.home/'.config/mariyas-pull/config.json'
        settings = json.loads(config.read_text())
        self.assertIs(settings['enabled'], False)
        self.assertEqual(config.stat().st_mode & 0o777, 0o600)
        self.assertEqual((self.web/'.well-known/token').read_text(), 'ACME')
        self.assertEqual((self.web/'index.html').read_text(), 'old staging')
        self.assertEqual((self.web/'.mariyas-cloud-root').stat().st_mode & 0o777, 0o600)

    def test_site_change_after_backup_refuses_marker_and_configuration(self):
        receipt = self.backup()
        (self.web/'index.html').write_text('owner modified after backup')
        with self.assertRaises(AssertionError):
            self.execute(python_blocks(VPS)[3], ['www.mariyasnaturals.cloud', str(receipt)])
        self.assertFalse((self.web/'.mariyas-cloud-root').exists())
        self.assertFalse((self.home/'.config/mariyas-pull/config.json').exists())

    def test_encrypted_recovery_export_and_restore_without_exposing_private_pem(self):
        self.key(encrypted=True)
        base = self.home/'.local/share/mariyas-owner'
        (base/'tools').mkdir()
        (base/'tools/owner-tools.sha256').write_bytes((ROOT/'ops/owner-tools.sha256').read_bytes())
        (self.home/'storage/downloads').mkdir(parents=True)
        real_run = subprocess.run
        def unlock(command, **kwargs):
            if command[:2] == ['openssl', 'enc']:
                command = [*command, '-pass', 'pass:disposable-fixture-container']
            elif command[:2] == ['openssl', 'pkey']:
                command = [*command, '-passin', 'pass:disposable-fixture-key']
            return real_run(command, **kwargs)
        with patch('subprocess.run', side_effect=unlock):
            self.execute(python_blocks(ANDROID)[1])
            container = self.home/'storage/downloads/mariyas-owner-recovery.enc'
            self.assertNotIn(b'PRIVATE KEY', container.read_bytes())
            self.execute(python_blocks(ANDROID)[2], [str(container), hashlib.sha256(container.read_bytes()).hexdigest()])
            with self.assertRaises(AssertionError):
                self.execute(python_blocks(ANDROID)[2], [str(container), '0'*64])
        self.assertEqual([p.name for p in (self.home/'storage/downloads').iterdir()], ['mariyas-owner-recovery.enc'])
        self.assertEqual(self.before, self.snapshot())

    def test_android_checksum_pin_matches_reviewed_tools_and_pinned_commit(self):
        text = ANDROID.read_text()
        for name in ['prepare_release.py', 'publish_release.py', 'pull_deploy.py', 'owner-media-policy.json']:
            expected = subprocess.check_output(['git', 'show', 'da0c28877fa0b74b72b914984e62b19ddf91d2ed:ops/'+name], cwd=ROOT)
            self.assertEqual((ROOT/'ops'/name).read_bytes(), expected)
            self.assertIn(hashlib.sha256(expected).hexdigest()+'  '+name, text)


if __name__ == '__main__':
    unittest.main()
