"""Execute the documented installer in private fixtures; Git transport is simulated."""
import contextlib
import hashlib
import io
import os
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
DOC = (ROOT/'docs/cinematic-release-handoff.md').read_text()
INSTALL = re.search("python3 - <<'INSTALL'\n(.*?)\nINSTALL", DOC, re.S).group(1)


class Migration(unittest.TestCase):
    def run_install(self, home, pin=None):
        sums = (ROOT/'ops/cinematic/owner-tools.sha256').read_bytes()
        env = {'PROFILE_SOURCE':'a'*40, 'PROFILE_SUMS':pin or hashlib.sha256(sums).hexdigest(), 'PROFILE_MODE':'android'}
        def git(command, **kwargs):
            if 'show' in command:
                return (ROOT/'ops/cinematic'/command[-1].split('/')[-1]).read_bytes()
            return b''
        previous = os.umask(0o077)
        try:
            with patch.dict(os.environ, env), patch.object(Path,'home',return_value=home), patch('subprocess.check_output',side_effect=git), contextlib.redirect_stdout(io.StringIO()):
                exec(compile(INSTALL,'documented-installer','exec'), {})
        finally:
            os.umask(previous)

    def test_installs_verified_version_without_touching_old_tools_or_keys(self):
        with tempfile.TemporaryDirectory() as tmp:
            home=Path(tmp); old=home/'.local/share/mariyas-owner/tools';old.mkdir(parents=True)
            (old/'pull_deploy.py').write_bytes(b'OLD TRUSTED')
            keys=old.parent/'keys';keys.mkdir();(keys/'release-private.pem').write_bytes(b'PRIVATE FIXTURE')
            self.run_install(home)
            version=old.parent/'versions'/('a'*40)
            self.assertEqual((version/'pull_deploy.py').read_bytes(),(ROOT/'ops/cinematic/pull_deploy.py').read_bytes())
            self.assertEqual((old/'pull_deploy.py').read_bytes(),b'OLD TRUSTED')
            self.assertEqual((keys/'release-private.pem').read_bytes(),b'PRIVATE FIXTURE')
            with self.assertRaises(AssertionError):self.run_install(home)

    def test_wrong_independent_checksum_never_installs_version(self):
        with tempfile.TemporaryDirectory() as tmp:
            home=Path(tmp)
            with self.assertRaises(AssertionError):self.run_install(home,'0'*64)
            self.assertFalse((home/'.local/share/mariyas-owner/versions'/('a'*40)).exists())
