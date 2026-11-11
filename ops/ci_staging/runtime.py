"""Site-user transactions coordinated with, but isolated from, owner-signed history."""
import fcntl
import json
import os
from pathlib import Path
import pwd
import subprocess
import sys
import tempfile
import time

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
sys.path.insert(0,str(ROOT/'ops/cinematic'))
import pull_deploy as core
from automatic_staging import private_file
from ci_staging import artifact,health,trust
from ci_staging.github import GitHub


def load_config(path, enabled=True):
    trust.require(pwd.getpwuid(os.geteuid()).pw_name=='mariyascloud','Use only the staging site user')
    cfg=json.loads(private_file(path).read_text())
    trust.require(cfg.get('schema')=='ci-staging-config/v1' and (not enabled or cfg.get('enabled') is True),'CI staging authority is not activated')
    owner=core.config_load(private_file(cfg['owner_config']))
    trust.require(owner['enabled'] is False,'Pause CI automation while the owner authority is enabled')
    trust.require(str(owner['_root'])==trust.DOCUMENT_ROOT and owner['site']==trust.ORIGIN,'Incorrect staging destination')
    trust.require(Path(cfg['runtime']).resolve()==ROOT.resolve(),'Run the explicitly installed runtime version')
    inventory=private_file(ROOT/'ops/ci_staging/bundle.sha256').read_bytes()
    trust.require(trust.digest(inventory)==cfg['runtime_bundle_sha256'],'Runtime checksum inventory changed')
    for row in inventory.decode().splitlines():
        expected,name=row.split()
        trust.require(trust.safe_name(name) and trust.digest(private_file(ROOT/name).read_bytes())==expected,'Installed runtime file changed')
    require_files=['trust_file','automation_public_key','github_token_file']
    for name in require_files:
        p=private_file(cfg[name])
        trust.require(owner['_root'] not in p.parents,'Trust/credential file is public')
    require_pin=lambda name,pin:trust.require(trust.digest(Path(cfg[name]).read_bytes())==cfg[pin],'Installed trust fingerprint changed')
    require_pin('trust_file','trust_sha256');require_pin('automation_public_key','automation_public_key_sha256')
    trust.require(cfg['automation_public_key_sha256']!=owner['release_public_key_sha256'],'Owner signing identity cannot be the automation identity')
    automation_der=subprocess.check_output(['openssl','pkey','-pubin','-in',cfg['automation_public_key'],'-outform','DER'],stderr=subprocess.PIPE)
    owner_der=subprocess.check_output(['openssl','pkey','-pubin','-in',owner['release_public_key'],'-outform','DER'],stderr=subprocess.PIPE)
    trust.require(automation_der!=owner_der,'Owner identity must remain independent')
    policy=json.loads(Path(cfg['trust_file']).read_text())
    state=owner['_state']/'ci-staging'
    trust.require(str(state)==cfg['state_dir'] and not state.is_symlink(),'Automation history must be separate and private')
    if state.exists():trust.require(state.stat().st_uid==os.geteuid() and not state.stat().st_mode&0o077,'Unsafe CI state directory')
    return cfg,owner,policy,state


def owner_fingerprint(owner):
    return trust.digest(private_file(owner['_state']/'current.json').read_bytes())


def coordinated_lock(owner):
    lock=owner['_state']/'lock'
    core.no_symlinks(lock)
    if lock.exists():private_file(lock)
    try:
        descriptor=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600);os.close(descriptor)
    except FileExistsError:
        private_file(lock)
    handle=lock.open('a')
    try:fcntl.flock(handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except Exception:
        handle.close();raise
    return handle


def authenticated_release(body, destination, cfg, policy, sha, run):
    members=artifact.read_zip(body,['manifest.json','manifest.sig','release.zip'],trust.MAX_ZIP+1024*1024)
    trust.require(len(members['manifest.json'])<=1024*1024 and len(members['manifest.sig'])==64,'Invalid manifest/signature bound')
    for name,data in members.items():(destination/name).write_bytes(data)
    result=subprocess.run(['openssl','pkeyutl','-verify','-pubin','-inkey',cfg['automation_public_key'],'-rawin','-in',str(destination/'manifest.json'),'-sigfile',str(destination/'manifest.sig')],capture_output=True)
    trust.require(result.returncode==0,'Invalid dedicated staging signature')
    m=json.loads(members['manifest.json'])
    trust.require(m.get('key_sha256')==cfg['automation_public_key_sha256'],'Wrong staging identity')
    files=artifact.validate(m,members['release.zip'],policy,sha,run)
    staged=destination/'site';staged.mkdir(mode=0o700)
    for name,data in files.items():
        path=staged/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    return m,trust.digest(members['manifest.json']),staged


def cleanup_interlock(owner,marker):
    path=owner['_state']/'pending.json'
    trust.require(core.read_json(path)==marker,'Shared authority interlock changed')
    path.unlink()


def transaction(cfg,owner,state,m,manifest_hash,staged,release_id,api,run):
    trust.require(not (owner['_state']/'pending.json').exists() and not (state/'pending.json').exists(),'Pending transaction: explicit recovery required')
    adoption=core.read_json(state/'adoption.json')
    trust.require(adoption and owner_fingerprint(owner)==adoption['owner_history_sha256'],'Owner signed history changed; pause/re-adopt before CI deployment')
    before=core.static_inventory(owner['_root']);before_hash=core.inventory_hash(before)
    previous=core.read_json(state/'current.json')
    if previous['max_sequence']>=m['sequence']:
        return {'status':'no-change','source_sha':previous.get('source_sha')}
    marker={'authority':'ci-staging/v1','state_dir':str(state),'source_sha':m['source_sha'],'owner_history_sha256':adoption['owner_history_sha256'],'started_ns':time.time_ns(),'before_inventory_sha256':before_hash,'previous_ci':previous}
    # Legacy applies/recoveries refuse this marker; only this authority may clear it.
    core.atomic_json(owner['_state']/'pending.json',marker)
    ci={'_root':owner['_root'],'_state':state,'enabled':True}
    deployment=None
    try:
        deployment=api.deployment(m['source_sha']);api.report(deployment,'in_progress','Verified protected push CI and dedicated staging signature')
        observation=health.observe()
        trust.require(not observation['html_cached'] or bool(cfg.get('cloudflare')), 'Cloudflare HTML caching observed; configure scoped purge or HTML bypass before apply')
        core.apply_release(ci,m,manifest_hash,staged,release_id,True)
        current=core.read_json(state/'current.json')
        purged=health.purge(cfg,{f['path'] for f in m['files']},observation)
        evidence=health.verify(owner['_root'],m['source_sha'])
        trust.require(owner_fingerprint(owner)==adoption['owner_history_sha256'],'Owner history changed during CI transaction')
        receipt={'status':'verified-report-pending','source_sha':m['source_sha'],'run_id':run['id'],'run_attempt':run['run_attempt'],'sequence':m['sequence'],'manifest_sha256':manifest_hash,'deployment_id':deployment,'backup':current['backup'],'health':evidence,'cloudflare':{**observation,'purged':purged}}
        core.atomic_json(state/'receipt.json',receipt)
        cleanup_interlock(owner,marker)
    except Exception as error:
        rolled_back=False
        try:
            current=core.read_json(state/'current.json')
            if not (state/'pending.json').exists() and current!=previous and current.get('backup'):
                core.rollback(ci,current['backup'],True)
                health.purge(cfg,set(before)|{f['path'] for f in m['files']},observation)
                health.verify(owner['_root'])
            if not (state/'pending.json').exists() and core.inventory_hash(core.static_inventory(owner['_root']))==before_hash:
                cleanup_interlock(owner,marker);rolled_back=True
        except Exception:
            pass  # Leave the shared interlock in place for explicit recovery.
        core.atomic_json(state/'failure.json',{'source_sha':m['source_sha'],'run_id':run['id'],'rolled_back':rolled_back,'recovery_required':not rolled_back,'reason':str(error)[:300] if isinstance(error,ValueError) else type(error).__name__})
        if deployment:
            try:api.report(deployment,'failure','Staging failed; '+('verified rollback completed' if rolled_back else 'operator recovery required'))
            except Exception:pass
        raise ValueError('CI staging failed; inspect private failure/journal. No success was reported.') from None
    # Reporting failure must not undo a verified site; retry reporting on the next poll.
    api.report(deployment,'success','Verified public .cloud source '+m['source_sha'])
    receipt['status']='success';core.atomic_json(state/'receipt.json',receipt)
    return receipt


def poll(config_path):
    os.umask(0o077)
    cfg,owner,policy,state=load_config(config_path)
    state.mkdir(mode=0o700,exist_ok=True)
    with coordinated_lock(owner):
        trust.require(not (owner['_state']/'pending.json').exists() and not (state/'pending.json').exists(),'Pending owner/CI transaction requires recovery')
        adoption=core.read_json(state/'adoption.json')
        trust.require(adoption and owner_fingerprint(owner)==adoption['owner_history_sha256'],'Owner history changed; CI authority paused')
        api=GitHub(private_file(cfg['github_token_file']).read_text())
        sha=trust.fetch_source(state/'source.git',owner)
        trust.verify_gate(state/'source.git',sha,policy)
        run=api.eligible_run(sha)
        current=core.read_json(state/'current.json')
        if current.get('source_sha'):
            trust.git(state/'source.git','merge-base','--is-ancestor',current['source_sha'],sha)
        if current['max_sequence']>=artifact.sequence(run):
            receipt=core.read_json(state/'receipt.json',{})
            if receipt.get('status')=='verified-report-pending':
                health.verify(owner['_root'],receipt['source_sha'])
                api.report(receipt['deployment_id'],'success','Verified public staging source '+receipt['source_sha'])
                receipt['status']='success';core.atomic_json(state/'receipt.json',receipt)
            print(json.dumps({'status':'no-change','source_sha':current.get('source_sha')}));return
        body,record=api.artifact(run)
        # Recheck before any site mutation: no stale successful run after a newer push.
        api.eligible_run(sha)
        with tempfile.TemporaryDirectory(dir=state,prefix='verified-ci-') as temporary:
            m,h,staged=authenticated_release(body,Path(temporary),cfg,policy,sha,run)
            print(json.dumps(transaction(cfg,owner,state,m,h,staged,'ci:'+str(run['id'])+':'+str(run['run_attempt']),api,run)))


if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--config',required=True);args=p.parse_args()
    try:poll(args.config)
    except BlockingIOError:print('Another owner/CI transaction is active; deferred')
    except Exception as error:
        # Reason strings exclude credential values and signed redirect URLs.
        print('STAGING AUTOMATION FAILED: '+str(error) if isinstance(error,ValueError) else 'STAGING AUTOMATION FAILED: transport/process error; inspect private logs',file=sys.stderr)
        sys.exit(1)
