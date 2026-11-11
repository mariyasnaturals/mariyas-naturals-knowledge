import hashlib
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('auto',Path(__file__).resolve().parents[2]/'ops/automatic_staging.py')
auto=importlib.util.module_from_spec(spec);spec.loader.exec_module(auto)


class AutomaticStaging(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.state=self.root/'state';self.state.mkdir()
        self.profile=self.root/'profile';self.profile.mkdir()
        lines=[]
        for name in sorted(auto.NAMES):
            data=b'fixture';self.write(self.profile/name,data)
            lines.append(hashlib.sha256(data).hexdigest()+'  '+name)
        sums=('\n'.join(lines)+'\n').encode();self.write(self.profile/'owner-tools.sha256',sums)
        self.pull=self.root/'pull.json';self.write(self.pull,json.dumps({'site':auto.ORIGIN,'document_root':auto.ROOT,'enabled':True,'state_dir':str(self.state)}).encode())
        self.write(self.state/'current.json',json.dumps({'release_commit':'a'*40,'max_sequence':1,'source_sha':'a'*40,'manifest_sha256':'a'*64}).encode())
        self.settings={'enabled':True,'profile':str(self.profile),'profile_checksums_sha256':hashlib.sha256(sums).hexdigest(),'pull_config':str(self.pull)}
        self.config=self.root/'auto.json';self.save()

    def write(self,path,data):path.write_bytes(data);path.chmod(0o600)
    def save(self):self.write(self.config,json.dumps(self.settings).encode())

    def test_disabled_or_unapproved_first_deployment_never_runs_a_puller(self):
        self.settings['enabled']=False;self.save()
        with self.assertRaises(ValueError):auto.checked_settings(self.config)
        self.settings['enabled']=True;self.save()
        self.write(self.state/'current.json',b'{"max_sequence":0}')
        with self.assertRaisesRegex(ValueError,'First deployment'):auto.checked_settings(self.config)

    def test_production_root_modified_tools_and_pending_transaction_are_refused(self):
        original=self.pull.read_bytes();p=json.loads(original);p['document_root']='/home/wordpress';self.write(self.pull,json.dumps(p).encode())
        with self.assertRaises(ValueError):auto.checked_settings(self.config)
        self.write(self.pull,original);self.write(self.profile/'pull_deploy.py',b'changed')
        with self.assertRaisesRegex(ValueError,'profile changed'):auto.checked_settings(self.config)
        self.write(self.profile/'pull_deploy.py',b'fixture');self.write(self.state/'pending.json',b'{}')
        with self.assertRaisesRegex(ValueError,'Pending'):auto.checked_settings(self.config)

    def test_public_health_failure_does_not_record_deployment_success(self):
        with patch.object(auto.pwd,'getpwuid',return_value=types.SimpleNamespace(pw_name='mariyascloud')),patch.object(auto.subprocess,'run') as run,patch.object(auto,'purge_cache'),patch.object(auto,'check_public_site',side_effect=ValueError('unhealthy')):
            with self.assertRaises(ValueError):auto.run(self.config)
            self.assertIn('--apply',run.call_args.args[0])
        self.assertFalse((self.state/'automatic-staging-success.json').exists())

    def test_success_receipt_is_private_and_unchanged_release_is_not_purged_twice(self):
        with patch.object(auto.pwd,'getpwuid',return_value=types.SimpleNamespace(pw_name='mariyascloud')),patch.object(auto.subprocess,'run'),patch.object(auto,'purge_cache') as purge,patch.object(auto,'check_public_site'):
            auto.run(self.config);auto.run(self.config)
            purge.assert_called_once()
        self.assertEqual((self.state/'automatic-staging-success.json').stat().st_mode & 0o777,0o600)

    def test_private_config_and_zone_scope_are_required(self):
        self.config.chmod(0o644)
        with self.assertRaises(ValueError):auto.checked_settings(self.config)
        self.config.chmod(0o600);self.root.chmod(0o777)
        with self.assertRaisesRegex(ValueError,'parent directory'):auto.checked_settings(self.config)
        self.root.chmod(0o700)
        with self.assertRaises(ValueError):auto.purge_cache({'cloudflare':{'zone_id':'bad','api_token':'fixture'}})
