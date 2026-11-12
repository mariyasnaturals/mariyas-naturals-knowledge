"""One-time owner GitHub administration via an already authenticated GitHub CLI."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.parse
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'ops'))
from ci_staging.trust import REPOSITORY,REPOSITORY_ID,BRANCH,ENVIRONMENT,digest,require


def gh(*args, data=None):
    return subprocess.check_output(['gh',*args],input=data,stderr=subprocess.PIPE)


def api(path, method='GET', data=None, missing=False):
    try:
        raw=gh('api','--method',method,path,*(['--input','-'] if data is not None else []),data=None if data is None else json.dumps(data).encode())
        return json.loads(raw) if raw.strip() else {}
    except subprocess.CalledProcessError as error:
        if missing and b'404' in error.stderr:return None
        raise ValueError('GitHub setup denied; authenticate an owner administration connection. No credentials should be pasted into chat.') from None


def setup(directory):
    os.umask(0o077);directory=Path(directory)
    require(not directory.is_symlink(),'Unsafe setup destination')
    directory.mkdir(mode=0o700,parents=True,exist_ok=True)
    repo=api('repos/'+REPOSITORY)
    require(repo['id']==REPOSITORY_ID and repo['permissions'].get('admin') is True,'Repository administrator identity required')
    branch='repos/'+REPOSITORY+'/branches/'+urllib.parse.quote(BRANCH,safe='')+'/protection'
    protection=api(branch,missing=True)
    if protection is None:
        # Minimum policy permits routine direct pushes; independent VPS pins freeze the CI gate.
        api(branch,'PUT',{'required_status_checks':None,'enforce_admins':True,'required_pull_request_reviews':None,'restrictions':None,'allow_force_pushes':False,'allow_deletions':False})
    else:
        require(protection.get('enforce_admins',{}).get('enabled') is True and protection.get('allow_force_pushes',{}).get('enabled') is False and protection.get('allow_deletions',{}).get('enabled') is False,'Existing branch protection must be strengthened manually; this helper will not weaken/replace it')
    env_path='repos/'+REPOSITORY+'/environments/'+ENVIRONMENT
    environment=api(env_path,missing=True)
    if environment is None:
        api(env_path,'PUT',{'deployment_branch_policy':{'protected_branches':False,'custom_branch_policies':True}})
    else:
        require(environment.get('deployment_branch_policy')=={'protected_branches':False,'custom_branch_policies':True},'Existing environment policy differs; no overwrite')
        require(not any(r.get('type')=='required_reviewers' for r in environment.get('protection_rules',[])),'Existing reviewer-gated environment cannot silently become unattended')
    policies=api(env_path+'/deployment-branch-policies')['branch_policies']
    if not policies:api(env_path+'/deployment-branch-policies','POST',{'name':BRANCH,'type':'branch'})
    else:require(len(policies)==1 and policies[0]['name']==BRANCH and policies[0].get('type','branch')=='branch','Environment permits an unexpected branch')
    public=directory/'staging-public.pem';receipt=directory/'identity.json'
    if public.exists() or receipt.exists():
        require(public.is_file() and receipt.is_file() and not public.is_symlink() and not receipt.is_symlink(),'Incomplete identity setup; inspect before retrying')
        require(json.loads(receipt.read_text())['public_key_sha256']==digest(public.read_bytes()),'Existing staging public key changed')
        print('Existing dedicated identity retained. No key rotation performed.')
        return
    secrets=api(env_path+'/secrets')['secrets']
    require(not any(s['name']=='STAGING_AUTOMATION_KEY' for s in secrets),'Existing secret without matching local receipt: refuse rotation')
    with tempfile.TemporaryDirectory(dir=directory) as temporary:
        private=Path(temporary)/'dedicated-staging.pem';pub=Path(temporary)/'public.pem'
        subprocess.run(['openssl','genpkey','-algorithm','ED25519','-out',str(private)],check=True,capture_output=True)
        subprocess.run(['openssl','pkey','-in',str(private),'-pubout','-out',str(pub)],check=True,capture_output=True)
        data=pub.read_bytes()
        with public.open('xb') as out:out.write(data)
        public.chmod(0o600)
        gh('secret','set','STAGING_AUTOMATION_KEY','--repo',REPOSITORY,'--env',ENVIRONMENT,data=private.read_bytes())
        gh('variable','set','STAGING_AUTOMATION_KEY_SHA256','--repo',REPOSITORY,'--env',ENVIRONMENT,'--body',digest(data))
        # Setup does not start signing or deploy anything; first activation is a separate step.
        gh('variable','set','STAGING_AUTOMATION_ENABLED','--repo',REPOSITORY,'--body','false')
        with receipt.open('x') as out:json.dump({'public_key_sha256':digest(data),'environment':ENVIRONMENT,'repository':REPOSITORY},out,indent=2)
    print('Dedicated staging identity provisioned; private bootstrap copy deleted. Signing remains disabled.')
    print('Transfer only staging-public.pem to the VPS. Public PEM SHA-256: '+digest(public.read_bytes()))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    setup(args.output)
