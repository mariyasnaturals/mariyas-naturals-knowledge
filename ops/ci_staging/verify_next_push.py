"""Explicitly authorized reversible staging proof; requires an already active live authority."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import time
import urllib.request

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
from ci_staging import trust


def gh(*args):return json.loads(subprocess.check_output(['gh',*args],stderr=subprocess.PIPE))

def live():
    with urllib.request.urlopen(trust.ORIGIN+'/staging-revision.json?proof='+str(time.time_ns()),timeout=30) as response:
        trust.require(response.geturl().startswith(trust.ORIGIN+'/staging-revision.json?') and response.status==200,'Unexpected live proof response')
        return json.load(response)


def push_commit(message):
    trust.git(ROOT,'add','--','src/data/staging-preview-note.json')
    trust.git(ROOT,'commit','-m',message)
    sha=trust.git(ROOT,'rev-parse','HEAD').decode().strip()
    subprocess.run(['git','-C',str(ROOT),'push','origin','HEAD:refs/heads/'+trust.BRANCH],check=True)
    return sha


def wait_run(sha,success,timeout=1800):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        runs=gh('run','list','--repo',trust.REPOSITORY,'--workflow',str(trust.WORKFLOW_ID),'--event','push','--commit',sha,'--json','databaseId,status,conclusion,url')
        if runs and runs[0]['status']=='completed':
            run=runs[0];trust.require(run['conclusion']==('success' if success else 'failure'),'Unexpected CI conclusion: '+str(run));return run
        time.sleep(15)
    raise ValueError('Timed out waiting for actual push CI')


def wait_live(sha,timeout=600):
    deadline=time.monotonic()+timeout
    while time.monotonic()<deadline:
        if live().get('source_sha')==sha and successful_deployment(sha):return live()
        time.sleep(15)
    raise ValueError('CI passed but the exact source was not deployed; inspect private VPS failure log')


def successful_deployment(sha):
    deployments=gh('api','repos/'+trust.REPOSITORY+'/deployments?environment=cinematic-cloud&per_page=10')
    match=[d for d in deployments if d['sha']==sha]
    if not match:return False
    statuses=gh('api','repos/'+trust.REPOSITORY+'/deployments/'+str(match[0]['id'])+'/statuses')
    return bool(statuses and statuses[0]['state']=='success')


def prove():
    trust.require(not trust.git(ROOT,'status','--porcelain'),'Proof requires a clean checkout')
    trust.require(trust.git(ROOT,'branch','--show-current').decode().strip()==trust.BRANCH,'Wrong proof branch')
    start=trust.git(ROOT,'rev-parse','HEAD').decode().strip()
    trust.require(live().get('source_sha')==start,'Automation is not already verified at this source; no proof commits created')
    trust.require(successful_deployment(start),'Live deployment has not been verified successful')
    note=ROOT/'src/data/staging-preview-note.json';trust.require(not note.exists(),'Proof note already exists; preserve it')
    evidence={'started_from':start};pushed=False
    try:
        note.write_text('{ "note": "Reversible staging automation verification" }\n')
        pushed=True;good=push_commit('test(staging): prove automatic CI deployment')
        evidence['successful_ci']=wait_run(good,True);evidence['public_test_revision']=wait_live(good)
        note.write_text('{ intentionally invalid staging proof JSON\n')
        bad=push_commit('test(staging): prove failing CI blocks deployment')
        evidence['failed_ci']=wait_run(bad,False)
        # More than two scheduler intervals after CI failure, checking actual public revision.
        for _ in range(9):
            trust.require(live().get('source_sha')==good,'Failed CI revision changed the live site')
            time.sleep(15)
        evidence['failed_ci_did_not_deploy']=True
    finally:
        if pushed:
            note.unlink(missing_ok=True)
            restored=push_commit('test(staging): restore automation verification note')
            evidence['restored_ci']=wait_run(restored,True);evidence['restored_public']=wait_live(restored)
            output=ROOT/'ci-staging-bootstrap/next-push-evidence.json';output.parent.mkdir(exist_ok=True);output.write_text(json.dumps(evidence,indent=2)+'\n')
            print('Actual end-to-end proof evidence: '+str(output))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--execute-authorized-staging-proof',action='store_true',required=True);p.parse_args();prove()
