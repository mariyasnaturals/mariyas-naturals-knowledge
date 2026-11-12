"""Prepare/activate a separately reviewed CI authority; never replace owner tools or keys."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
from ci_staging import trust,runtime,health
from ci_staging.github import GitHub
from automatic_staging import private_file
core=runtime.core


def verify_bundle():
    inventory=ROOT/'ops/ci_staging/bundle.sha256'
    for line in inventory.read_text().splitlines():
        digest,name=line.split()
        trust.require(trust.safe_name(name) and trust.digest((ROOT/name).read_bytes())==digest,'Installed runtime bundle changed')


def prepare(args):
    verify_bundle();os.umask(0o077)
    trust.require(trust.valid_sha(args.source_sha),'Use reviewed immutable implementation SHA')
    owner=core.config_load(private_file(args.owner_config))
    trust.require(owner['enabled'] is False and str(owner['_root'])==trust.DOCUMENT_ROOT,'Owner mechanism must remain disabled at verified .cloud root')
    old=core.read_json(owner['_state']/'current.json')
    trust.require(old and old.get('release_commit') and old.get('max_sequence',0)>0,'Existing independently authorized first deployment is required')
    pub=private_file(args.public_key); token=private_file(args.github_token_file)
    public_hash=trust.digest(pub.read_bytes())
    trust.require(public_hash!=owner['release_public_key_sha256'],'Do not reuse the owner signing identity')
    der=subprocess.check_output(['openssl','pkey','-pubin','-in',str(pub),'-outform','DER'],stderr=subprocess.PIPE)
    owner_der=subprocess.check_output(['openssl','pkey','-pubin','-in',owner['release_public_key'],'-outform','DER'],stderr=subprocess.PIPE)
    trust.require(der!=owner_der,'Owner signing key cannot be reused, including differently formatted PEM')
    trust.require(len(der)==44 and der.startswith(bytes.fromhex('302a300506032b6570032100')),'Automation identity must be Ed25519')
    config=Path(args.config)
    core.no_symlinks(config)
    trust.require(owner['_root'] not in config.parents and config.is_absolute(),'Configuration cannot be public')
    # One-time source cache is private and independent of the owner release cache.
    state=owner['_state']/'ci-staging';state.mkdir(mode=0o700,exist_ok=True)
    source=trust.fetch_source(state/'source.git',owner)
    policy=trust.make_trust(state/'source.git',args.source_sha)
    trust.verify_gate(state/'source.git',source,policy)
    api=GitHub(token.read_text());api.protection()
    trust_path=state/('trust-'+args.source_sha+'.json')
    data=json.dumps(policy,sort_keys=True,separators=(',',':')).encode()+b'\n'
    if trust_path.exists():trust.require(private_file(trust_path).read_bytes()==data,'Existing versioned trust differs')
    else:
        with trust_path.open('xb') as f:f.write(data)
        trust_path.chmod(0o600)
    settings={'schema':'ci-staging-config/v1','enabled':False,'owner_config':str(Path(args.owner_config).resolve()),'state_dir':str(state),'trust_file':str(trust_path),'trust_sha256':trust.digest(data),'automation_public_key':str(pub.resolve()),'automation_public_key_sha256':public_hash,'github_token_file':str(token.resolve()),'runtime':str(ROOT),'runtime_bundle_sha256':trust.digest((ROOT/'ops/ci_staging/bundle.sha256').read_bytes())}
    if config.exists():
        existing=json.loads(private_file(config).read_text())
        trust.require({k:v for k,v in existing.items() if k not in ('enabled','cloudflare')}=={k:v for k,v in settings.items() if k!='enabled'},'Existing configuration differs; explicit migration/backup required')
        print('Existing matching configuration preserved; no activation changed')
    else:
        config.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
        with config.open('x') as f:json.dump(settings,f,indent=2)
        config.chmod(0o600)
    print('PREPARED, NOT ACTIVE. New public identity '+public_hash)


def plan(path):
    cfg,owner,policy,state=runtime.load_config(path,enabled=False)
    with runtime.coordinated_lock(owner):
        trust.require(not (owner['_state']/'pending.json').exists() and not (state/'pending.json').exists(),'Pending transaction blocks activation')
        api=GitHub(private_file(cfg['github_token_file']).read_text());api.protection()
        sha=trust.fetch_source(state/'source.git',owner);trust.verify_gate(state/'source.git',sha,policy)
        data={'target':trust.DOCUMENT_ROOT,'owner_history_sha256':runtime.owner_fingerprint(owner),'inventory_sha256':core.inventory_hash(core.static_inventory(owner['_root'])),'public_key_sha256':cfg['automation_public_key_sha256'],'trust_sha256':cfg['trust_sha256'],'source_sha':sha}
        return cfg,owner,state,data


def activate(path, approved):
    os.umask(0o077)
    # Re-evaluate everything while holding the shared lock; a plan is not an apply.
    cfg,owner,policy,state=runtime.load_config(path,enabled=False)
    with runtime.coordinated_lock(owner):
        trust.require(not (owner['_state']/'pending.json').exists() and not (state/'pending.json').exists(),'Pending transaction blocks activation')
        api=GitHub(private_file(cfg['github_token_file']).read_text());api.protection()
        sha=trust.fetch_source(state/'source.git',owner);trust.verify_gate(state/'source.git',sha,policy)
        data={'target':trust.DOCUMENT_ROOT,'owner_history_sha256':runtime.owner_fingerprint(owner),'inventory_sha256':core.inventory_hash(core.static_inventory(owner['_root'])),'public_key_sha256':cfg['automation_public_key_sha256'],'trust_sha256':cfg['trust_sha256'],'source_sha':sha}
        trust.require(trust.digest(json.dumps(data,sort_keys=True).encode())==approved,'Activation plan changed or is not explicitly approved')
        adoption=state/'adoption.json'
        if adoption.exists():
            trust.require(core.read_json(adoption)==data,'Existing adoption differs; stop for reviewed migration')
        else:
            # A fresh private static backup supplements the existing full/protected-file backup.
            backup_id,_,_=core.backup(owner['_root'],state)
            core.atomic_json(state/'activation-backup.json',{'backup':backup_id})
            core.atomic_json(adoption,data)
        current=state/'current.json'
        if not current.exists():
            previous=core.read_json(owner['_state']/'current.json')
            core.atomic_json(current,{**previous,'max_sequence':0,'authority':'ci-staging/v1'})
        cfg['enabled']=True
        core.atomic_json(Path(path),cfg)
    print('ARMED, NOT YET VERIFIED ACTIVE. Run the poller and verify public receipt before enabling its timer.')


def recover(path, approved_marker):
    cfg,owner,policy,state=runtime.load_config(path,enabled=False)
    trust.require(cfg['enabled'] is False,'Disable CI polling before manual recovery')
    with runtime.coordinated_lock(owner):
        marker_path=owner['_state']/'pending.json';marker=core.read_json(marker_path)
        trust.require(marker and marker.get('authority')=='ci-staging/v1' and marker.get('state_dir')==str(state),'Not this authority\'s interlock')
        trust.require(trust.digest(private_file(marker_path).read_bytes())==approved_marker,'Exact recovery marker approval required')
        trust.require(runtime.owner_fingerprint(owner)==marker['owner_history_sha256'],'Owner history changed; do not recover across authorities')
        observation=health.observe()
        trust.require(not observation['html_cached'] or cfg.get('cloudflare'),'Configure scoped purge or cache bypass before recovery')
        ci={'_root':owner['_root'],'_state':state,'enabled':True}
        pending=core.read_json(state/'pending.json')
        if pending:core.rollback(ci,pending['backup'],True,recover=True)
        elif core.inventory_hash(core.static_inventory(owner['_root']))!=marker['before_inventory_sha256']:
            current=core.read_json(state/'current.json');core.rollback(ci,current['backup'],True)
        trust.require(core.inventory_hash(core.static_inventory(owner['_root']))==marker['before_inventory_sha256'],'Recovery inventory mismatch; interlock retained')
        health.purge(cfg,set(core.static_inventory(owner['_root'])),observation)
        health.verify(owner['_root'])
        runtime.cleanup_interlock(owner,marker)
    print('Verified recovery; authority stays disabled')


def rollback(path, backup_id, approved_inventory):
    cfg,owner,policy,state=runtime.load_config(path,enabled=False)
    trust.require(cfg['enabled'] is False,'Pause automation before explicit rollback')
    with runtime.coordinated_lock(owner):
        trust.require(not (owner['_state']/'pending.json').exists() and not (state/'pending.json').exists(),'Recover pending transaction first')
        before=core.static_inventory(owner['_root'])
        trust.require(core.inventory_hash(before)==approved_inventory,'Rollback requires the exact current inventory digest')
        trust.require(core.read_json(state/'adoption.json')['owner_history_sha256']==runtime.owner_fingerprint(owner),'Owner history changed; stop for review')
        # Verify the selected private backup before creating a shared interlock.
        import re
        trust.require(re.fullmatch('[0-9]+',backup_id),'Invalid backup ID')
        core.verify_backup(state/'backups'/backup_id)
        marker={'authority':'ci-staging/v1','state_dir':str(state),'source_sha':core.read_json(state/'current.json').get('source_sha'),'owner_history_sha256':runtime.owner_fingerprint(owner),'before_inventory_sha256':core.inventory_hash(before),'previous_ci':core.read_json(state/'current.json'),'started_ns':time.time_ns()}
        observation=health.observe()
        trust.require(not observation['html_cached'] or cfg.get('cloudflare'),'Configure scoped purge or cache bypass before rollback')
        core.atomic_json(owner['_state']/'pending.json',marker)
        ci={'_root':owner['_root'],'_state':state,'enabled':True}
        core.rollback(ci,backup_id,True)
        health.purge(cfg,set(before)|set(core.static_inventory(owner['_root'])),observation)
        health.verify(owner['_root'])
        runtime.cleanup_interlock(owner,marker)
        core.atomic_json(state/'receipt.json',{'status':'rolled-back','backup':backup_id})
    print('Verified rollback. CI remains paused; seen sequences are retained.')


if __name__=='__main__':
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='cmd',required=True)
    q=sub.add_parser('prepare')
    for name in ['config','owner-config','source-sha','public-key','github-token-file']:q.add_argument('--'+name,required=True)
    q=sub.add_parser('plan');q.add_argument('--config',required=True)
    q=sub.add_parser('activate');q.add_argument('--config',required=True);q.add_argument('--approve-plan-sha256',required=True)
    q=sub.add_parser('pause');q.add_argument('--config',required=True)
    q=sub.add_parser('rollback');q.add_argument('--config',required=True);q.add_argument('--backup',required=True);q.add_argument('--approve-inventory-sha256',required=True)
    q=sub.add_parser('recover');q.add_argument('--config',required=True);q.add_argument('--approve-marker-sha256',required=True)
    args=p.parse_args()
    if args.cmd=='prepare':prepare(args)
    elif args.cmd=='plan':
        _,_,_,data=plan(args.config);print(json.dumps(data,indent=2));print('PLAN_SHA256='+trust.digest(json.dumps(data,sort_keys=True).encode()))
    elif args.cmd=='activate':activate(args.config,args.approve_plan_sha256)
    elif args.cmd=='rollback':rollback(args.config,args.backup,args.approve_inventory_sha256)
    elif args.cmd=='recover':recover(args.config,args.approve_marker_sha256)
    else:
        cfg,_,_,_=runtime.load_config(args.config,enabled=False);cfg['enabled']=False;core.atomic_json(Path(args.config),cfg);print('CI authority paused; owner trust/history unchanged')
