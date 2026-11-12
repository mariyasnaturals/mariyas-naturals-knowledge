"""Install a pinned, side-by-side runtime through existing read-only GitHub SSH."""
import argparse
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'ops'))
from ci_staging import trust
from ci_staging.runtime import core
from automatic_staging import private_file


def install(owner_config, source_sha, inventory_sha256):
    os.umask(0o077)
    trust.require(trust.valid_sha(source_sha),'Immutable reviewed source SHA required')
    owner=core.config_load(private_file(owner_config))
    trust.require(owner['enabled'] is False,'Pause the owner mechanism before preparing another authority')
    state=owner['_state']/'ci-staging';core.no_symlinks(state);state.mkdir(mode=0o700,exist_ok=True)
    cache=state/'source.git';trust.fetch_source(cache,owner)
    inventory=trust.git(cache,'show',source_sha+':ops/ci_staging/bundle.sha256')
    trust.require(trust.digest(inventory)==inventory_sha256,'Independently reviewed bundle checksum mismatch')
    records=[line.split() for line in inventory.decode().splitlines()]
    names=[name for _,name in records]
    trust.require(len(names)==len(set(names)) and len(names)>10 and all(trust.safe_name(n) and n.startswith('ops/') for n in names),'Unsafe runtime inventory')
    parent=Path('/home/mariyascloud/.local/lib/mariyas-ci');core.no_symlinks(parent);parent.mkdir(mode=0o700,parents=True,exist_ok=True)
    target=parent/source_sha
    expected={name:digest for digest,name in records}
    expected['ops/ci_staging/bundle.sha256']=inventory_sha256
    if target.exists():
        actual={p.relative_to(target).as_posix():trust.digest(private_file(p).read_bytes()) for p in target.rglob('*') if p.is_file() or p.is_symlink()}
        trust.require(actual==expected,'Existing runtime differs; never overwrite it')
        print('Existing checksum-identical runtime retained: '+str(target));return
    temporary=Path(tempfile.mkdtemp(prefix='.install-',dir=parent))
    try:
        for name,digest in expected.items():
            data=inventory if name=='ops/ci_staging/bundle.sha256' else trust.git(cache,'show',source_sha+':'+name)
            trust.require(trust.digest(data)==digest,'Runtime file checksum mismatch: '+name)
            path=temporary/name;path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
            with path.open('xb') as output:output.write(data)
            path.chmod(0o600)
        os.rename(temporary,target)
    finally:
        if temporary.exists():shutil.rmtree(temporary)
    print('INSTALLED, NOT ACTIVATED: '+str(target))
    print('Original owner tools, configuration and signing identity were not replaced.')


if __name__=='__main__':
    p=argparse.ArgumentParser()
    for name in ['owner-config','source-sha','bundle-sha256']:p.add_argument('--'+name,required=True)
    a=p.parse_args();install(a.owner_config,a.source_sha,a.bundle_sha256)
