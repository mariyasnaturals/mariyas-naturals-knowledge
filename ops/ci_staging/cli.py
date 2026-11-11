import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
from ci_staging import artifact,trust


def ci_context():
    sha=trust.git(ROOT,'rev-parse','HEAD').decode().strip()
    trust.require(os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('GITHUB_REF')=='refs/heads/'+trust.BRANCH, 'Not a trusted push context')
    trust.require(os.environ.get('GITHUB_REPOSITORY')==trust.REPOSITORY and os.environ.get('GITHUB_SHA')==sha, 'CI checkout mismatch')
    trust.require(not trust.git(ROOT,'status','--porcelain','--untracked-files=all'), 'CI source is dirty')
    return sha,{'id':int(os.environ['GITHUB_RUN_ID']),'run_number':int(os.environ['GITHUB_RUN_NUMBER']),'run_attempt':int(os.environ['GITHUB_RUN_ATTEMPT'])}


def package(output):
    sha,run=ci_context();policy=trust.make_trust(ROOT,sha)
    note_file=ROOT/'src/data/staging-preview-note.json'
    note=json.loads(note_file.read_text()) if note_file.exists() else None
    m,data=artifact.payload(ROOT/'dist',sha,run,policy,note)
    output.mkdir(mode=0o700)
    (output/'release.zip').write_bytes(data);(output/'unsigned.json').write_bytes(artifact.encode(m))
    print('CI staging payload: '+sha+' archive '+m['archive_sha256'])


def sign(source,output):
    sha,run=ci_context();policy=trust.make_trust(ROOT,sha)
    trust.require(sorted(p.name for p in source.iterdir())==['release.zip','unsigned.json'], 'Unexpected unsigned artifact')
    trust.require(all(p.is_file() and not p.is_symlink() for p in source.iterdir()), 'Linked artifact')
    trust.require((source/'unsigned.json').stat().st_size<=1024*1024 and (source/'release.zip').stat().st_size<=trust.MAX_ZIP,'Oversized unsigned artifact')
    m=json.loads((source/'unsigned.json').read_bytes());data=(source/'release.zip').read_bytes()
    artifact.validate(m,data,policy,sha,run)
    os.umask(0o077)
    with tempfile.TemporaryDirectory(dir=os.environ.get('RUNNER_TEMP')) as temporary:
        folder=Path(temporary);key=folder/'automation.pem';pub=folder/'automation-public.pem'
        key.write_text(os.environ.pop('STAGING_AUTOMATION_KEY'))
        subprocess.run(['openssl','pkey','-in',str(key),'-pubout','-out',str(pub)],check=True,capture_output=True)
        public_hash=trust.digest(pub.read_bytes())
        trust.require(public_hash==os.environ['STAGING_AUTOMATION_KEY_SHA256'], 'Dedicated staging key does not match configured public identity')
        m['key_sha256']=public_hash
        output.mkdir(mode=0o700)
        (output/'manifest.json').write_bytes(artifact.encode(m));(output/'release.zip').write_bytes(data)
        subprocess.run(['openssl','pkeyutl','-sign','-inkey',str(key),'-rawin','-in',str(output/'manifest.json'),'-out',str(output/'manifest.sig')],check=True,capture_output=True)
    print('Authenticated CI staging artifact for '+sha+'; no server connection made')


if __name__=='__main__':
    p=argparse.ArgumentParser();subs=p.add_subparsers(dest='cmd',required=True)
    q=subs.add_parser('package');q.add_argument('--output',type=Path,required=True)
    q=subs.add_parser('sign');q.add_argument('--input',type=Path,required=True);q.add_argument('--output',type=Path,required=True)
    args=p.parse_args()
    if args.cmd=='package':package(args.output)
    else:sign(args.input,args.output)
