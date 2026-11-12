"""Idempotent site-user scheduler, only after verified first CI apply; no root service."""
import argparse
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
from ci_staging import runtime,trust,health
from ci_staging.github import GitHub
from automatic_staging import private_file
MARKER='# mariyas-ci-staging/v1'


def change(config,enable):
    os.umask(0o077)
    cfg,owner,policy,state=runtime.load_config(config,enabled=enable)
    with runtime.coordinated_lock(owner):
        if enable:
            trust.require(not (owner['_state']/'pending.json').exists() and not (state/'pending.json').exists(),'Recover pending transaction before scheduling')
            receipt=runtime.core.read_json(state/'receipt.json',{})
            trust.require(receipt.get('status')=='success','First authenticated CI deployment must pass public health checks before scheduling')
            api=GitHub(private_file(cfg['github_token_file']).read_text())
            run=api.eligible_run(receipt['source_sha'])
            trust.require(run['id']==receipt['run_id'] and run['run_attempt']==receipt['run_attempt'],'Receipt is not the current protected successful run')
            health.verify(owner['_root'],receipt['source_sha'])
        result=subprocess.run(['crontab','-l'],capture_output=True,text=True)
        trust.require(result.returncode==0 or 'no crontab' in result.stderr.lower(),'Cannot read site-user crontab')
        current=result.stdout if result.returncode==0 else ''
        backup=state/('crontab-before-'+str(time.time_ns())+'.txt');backup.write_text(current);backup.chmod(0o600)
        lines=[line for line in current.splitlines() if MARKER not in line]
        if enable:
            command=shlex.join(['/usr/bin/python3','-I',str(ROOT/'ops/ci_staging/runtime.py'),'--config',str(Path(config).resolve())])
            trust.require('%' not in command and '\n' not in command,'Unsafe cron command')
            lines.append('* * * * * umask 077; '+command+' >> '+shlex.quote(str(state/'poll.log'))+' 2>&1 '+MARKER)
        desired='\n'.join(lines)+'\n'
        if desired!=current:subprocess.run(['crontab','-'],input=desired,text=True,check=True,capture_output=True)
        print(('SCHEDULED' if enable else 'UNSCHEDULED')+' for mariyascloud only. Prior crontab: '+str(backup))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('action',choices=['enable','disable']);p.add_argument('--config',required=True);a=p.parse_args();change(a.config,a.action=='enable')
