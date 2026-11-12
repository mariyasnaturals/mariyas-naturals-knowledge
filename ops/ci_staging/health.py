import json
from pathlib import Path
import urllib.error
import urllib.request
from .trust import ORIGIN, DOCUMENT_ROOT, require, digest


def get(path, headers=None, limit=8*1024*1024):
    req=urllib.request.Request(ORIGIN+path,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache',**(headers or {})})
    with urllib.request.urlopen(req,timeout=30) as response:
        require(response.geturl()==ORIGIN+path, 'Unexpected staging redirect')
        body=response.read(limit+1);require(len(body)<=limit,'Public response too large')
        return body,response.status,dict((k.lower(),v) for k,v in response.headers.items())


def observe():
    _,status,headers=get('/en/')
    require(status==200,'Staging HTTPS failed')
    present=bool(headers.get('cf-ray'))
    cache=headers.get('cf-cache-status','').upper()
    return {'observed':present,'cache_status':cache,'html_cached':present and cache not in ('','DYNAMIC','BYPASS')}


def purge(config,files,observation):
    if not observation['html_cached']:
        return False
    cf=config.get('cloudflare')
    require(cf and cf.get('zone_id') and cf.get('api_token_file'), 'Cloudflare HTML caching observed: supply zone-scoped purge authority or configure HTML bypass')
    import re
    require(re.fullmatch('[a-f0-9]{32}',cf['zone_id']), 'Invalid .cloud zone ID')
    from automatic_staging import private_file
    token_file=private_file(cf['api_token_file'])
    require(Path(DOCUMENT_ROOT) not in Path(token_file).parents,'Cache credential must be outside the web root')
    token=token_file.read_text().strip()
    urls=set()
    for name in files:
        urls.add(ORIGIN+'/'+name)
        if name.endswith('index.html'):urls.add(ORIGIN+'/'+name.removesuffix('index.html'))
    urls=sorted(urls)
    for offset in range(0,len(urls),30):
        req=urllib.request.Request('https://api.cloudflare.com/client/v4/zones/'+cf['zone_id']+'/purge_cache',data=json.dumps({'files':urls[offset:offset+30]}).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method='POST')
        with urllib.request.urlopen(req,timeout=30) as response:result=json.load(response)
        require(result.get('success') is True,'Scoped Cloudflare purge failed')
    return True


def verify(root,sha=None):
    root=Path(root)
    if sha:
        body,status,_=get('/staging-revision.json?source='+sha)
        require(status==200 and json.loads(body)['source_sha']==sha, 'Public deployed revision mismatch')
    for lang in ['en','ml','hi','ta']:
        path='/'+lang+'/'
        body,status,_=get(path)
        expected=(root/lang/'index.html').read_bytes()
        require(status==200 and digest(body)==digest(expected) and b'noindex, nofollow' in body,'Public language page does not match installed source')
    robots,status,_=get('/robots.txt')
    require(status==200 and robots==b'User-agent: *\nDisallow: /\n','Public robots mismatch')
    for name in ['homepage-desktop.mp4','homepage-mobile.mp4']:
        local=(root/'cinematic'/name).read_bytes()
        data,status,headers=get('/cinematic/'+name,{'Range':'bytes=0-65535'},limit=8*1024*1024)
        require(headers.get('content-type','').split(';')[0]=='video/mp4','Wrong video MIME')
        if status==206:
            require(data==local[:65536] and headers.get('content-range')=='bytes 0-65535/'+str(len(local)), 'Public video range differs')
        else:require(status==200 and data==local,'Public video differs')
    for name in ['original-model.jpg','original-product.jpg']:
        data,status,_=get('/cinematic/'+name)
        require(status==200 and digest(data)==digest((root/'cinematic'/name).read_bytes()),'Public original photo differs')
    for folder,pattern in [('_astro','*'),('fonts','*.woff2')]:
        for asset in (root/folder).glob(pattern):
            if not asset.is_file():continue
            data,status,_=get('/'+folder+'/'+asset.name)
            require(status==200 and digest(data)==digest(asset.read_bytes()), 'Public script/style/font differs')
    return {'https':True,'languages':4,'videos':2,'original_photos':2,'source_sha':sha}
