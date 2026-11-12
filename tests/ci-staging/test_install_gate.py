import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch, Mock

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
from ci_staging import install,runtime,trust,health
from ci_staging.github import GitHub,SafeRedirect
from urllib.request import Request


class GateAndInstall(unittest.TestCase):
    def test_skipped_python_or_browser_checks_and_signing_job_are_rejected(self):
        names=['Run npm run check','Run npm run lint','Run npm test','Run npm run build','Run npm run test:static','Run npm run test:media-policy','Browser and accessibility checks','Package CI staging payload',*['Run python3 -m unittest discover -s tests/'+f+' -v' for f in ['pull','cinematic-release','readiness','staging-auto','ci-staging']]]
        run={'id':1,'run_number':1,'run_attempt':1,'head_sha':'b'*40}
        jobs={'total_count':2,'jobs':[{'name':'static-site','conclusion':'success','steps':[{'name':n,'conclusion':'success'} for n in names]},{'name':'authenticate-staging','conclusion':'success'}]}
        api=GitHub('fixture')
        with patch.object(api,'protection'),patch.object(api,'head',return_value='b'*40),patch.object(api,'validate_run'),patch.object(api,'json',side_effect=lambda path:{'workflow_runs':[run]} if '/runs?' in path else jobs):
            self.assertEqual(api.eligible_run('b'*40),run)
            for step in jobs['jobs'][0]['steps']:
                step['conclusion']='skipped'
                with self.assertRaisesRegex(ValueError,'Required check'):api.eligible_run('b'*40)
                step['conclusion']='success'
            jobs['jobs'][1]['conclusion']='skipped'
            with self.assertRaisesRegex(ValueError,'signing job'):api.eligible_run('b'*40)

    def test_api_redirect_never_forwards_token_to_artifact_storage(self):
        req=Request('https://api.github.com/repos/example/artifact',headers={'Authorization':'Bearer fixture'})
        new=SafeRedirect().redirect_request(req,None,302,'redirect',{},'https://example.blob.core.windows.net/artifact')
        self.assertIsNone(new.get_header('Authorization'))
        for url in ['https://evil.example/artifact','http://example.blob.core.windows.net/artifact']:
            with self.assertRaises(ValueError):SafeRedirect().redirect_request(req,None,302,'redirect',{},url)

    def test_wrong_staging_root_and_owner_enabled_rejected_before_key_or_network(self):
        args=Mock();args.source_sha='b'*40;args.owner_config='fixture'
        for owner in [{'enabled':True,'_root':Path(trust.DOCUMENT_ROOT)},{'enabled':False,'_root':Path('/home/production/wordpress')}]:
            with patch.object(install,'verify_bundle'),patch.object(install,'private_file'),patch.object(install.core,'config_load',return_value=owner),self.assertRaisesRegex(ValueError,'verified .cloud root'):
                install.prepare(args)

    def test_no_unattended_first_apply_and_no_owner_key_reuse(self):
        with tempfile.TemporaryDirectory() as tmp:
            owner={'enabled':False,'_root':Path(trust.DOCUMENT_ROOT),'_state':Path(tmp),'release_public_key_sha256':'fixture'}
            args=Mock();args.source_sha='b'*40;args.owner_config='fixture'
            with patch.object(install,'verify_bundle'),patch.object(install,'private_file'),patch.object(install.core,'config_load',return_value=owner),self.assertRaisesRegex(ValueError,'first deployment'):
                install.prepare(args)
            pub=Path(tmp)/'pub';pub.write_text('fixture');owner['release_public_key_sha256']=trust.digest(pub.read_bytes())
            install.core.atomic_json(Path(tmp)/'current.json',{'release_commit':'owner','max_sequence':1})
            with patch.object(install,'verify_bundle'),patch.object(install,'private_file',return_value=pub),patch.object(install.core,'config_load',return_value=owner),self.assertRaisesRegex(ValueError,'reuse'):
                install.prepare(args)

    def test_activation_requires_exact_plan_no_writes_on_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            state=Path(tmp);owner={'_state':state,'_root':state/'web'};owner['_root'].mkdir();(owner['_root']/'index.html').write_text('old')
            install.core.atomic_json(state/'current.json',{'source_sha':'a'*40})
            ci=state/'ci-staging';ci.mkdir();cfg={'github_token_file':'fixture','automation_public_key_sha256':'pub','trust_sha256':'trust'}
            with patch.object(runtime,'load_config',return_value=(cfg,owner,{},ci)),patch.object(runtime,'coordinated_lock',return_value=__import__('contextlib').nullcontext()),patch.object(install,'private_file',return_value=Mock(read_text=lambda:'fixture')),patch.object(install,'GitHub'),patch.object(trust,'fetch_source',return_value='b'*40),patch.object(trust,'verify_gate'),self.assertRaisesRegex(ValueError,'Activation plan'):
                install.activate('fixture','unapproved')
            self.assertFalse((ci/'adoption.json').exists())
            self.assertEqual((owner['_root']/'index.html').read_text(),'old')

    def test_cloudflare_purge_is_conditional_and_hostname_scoped(self):
        self.assertFalse(health.purge({}, {'index.html'}, {'html_cached':False}))
        with self.assertRaisesRegex(ValueError,'Cloudflare'):health.purge({}, {'index.html'}, {'html_cached':True})
        response=Mock();response.__enter__=Mock(return_value=response);response.__exit__=Mock(return_value=False);response.read=lambda:b'{"success":true}'
        with tempfile.TemporaryDirectory() as tmp:
            token=Path(tmp)/'token';token.write_text('fixture');token.chmod(0o600)
            with patch('automatic_staging.private_file',return_value=token),patch.object(health.urllib.request,'urlopen',return_value=response) as opened:
                health.purge({'cloudflare':{'zone_id':'a'*32,'api_token_file':'fixture'}},{'index.html','en/index.html'}, {'html_cached':True})
                request=opened.call_args.args[0];payload=json.loads(request.data)
                self.assertNotIn('purge_everything',payload)
                self.assertTrue(all(u.startswith(trust.ORIGIN+'/') for u in payload['files']))


if __name__=='__main__':unittest.main()
