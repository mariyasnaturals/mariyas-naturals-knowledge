"""Independent read-side CI gate; a staging signature alone never authorizes deployment."""
import json
import urllib.error
import urllib.parse
import urllib.request
from .trust import REPOSITORY, REPOSITORY_ID, BRANCH, WORKFLOW_ID, WORKFLOW, MAX_ZIP, require, digest


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target=urllib.parse.urlsplit(newurl)
        require(target.scheme == 'https' and not target.username and not target.password, 'Unsafe artifact redirect')
        host=target.hostname or ''
        require(host == 'api.github.com' or host.endswith(('.blob.core.windows.net','.githubusercontent.com','.amazonaws.com')), 'Unexpected artifact download host')
        redirected=super().redirect_request(req,fp,code,msg,headers,newurl)
        if target.netloc != urllib.parse.urlsplit(req.full_url).netloc:
            redirected.remove_header('Authorization')
        return redirected


class GitHub:
    def __init__(self, token):
        self.token=token.strip()
        self.opener=urllib.request.build_opener(SafeRedirect())

    def request(self, path, data=None, limit=4*1024*1024):
        require(path.startswith('/') and not path.startswith('//'), 'Invalid API path')
        req=urllib.request.Request('https://api.github.com'+path, data=None if data is None else json.dumps(data).encode(), headers={'Authorization':'Bearer '+self.token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'})
        try:
            with self.opener.open(req,timeout=45) as response:
                body=response.read(limit+1)
                require(len(body)<=limit, 'GitHub response exceeds bound')
                return body
        except urllib.error.HTTPError as error:
            raise ValueError('GitHub API denied request (HTTP '+str(error.code)+'); check scoped permissions/protection') from None

    def json(self, path, data=None):
        return json.loads(self.request(path,data))

    def repo(self, suffix):
        return '/repos/'+REPOSITORY+suffix

    def protection(self):
        p=self.json(self.repo('/branches/'+urllib.parse.quote(BRANCH,safe='')+'/protection'))
        require(p.get('enforce_admins',{}).get('enabled') is True, 'Branch protection must enforce administrators')
        require(p.get('allow_force_pushes',{}).get('enabled') is False and p.get('allow_deletions',{}).get('enabled') is False, 'Force-push/deletion protection is required')
        return p

    def head(self):
        return self.json(self.repo('/git/ref/heads/'+BRANCH))['object']['sha']

    def eligible_run(self, sha):
        self.protection()
        require(self.head()==sha, 'Source is no longer the trusted branch tip')
        query=urllib.parse.urlencode({'branch':BRANCH,'event':'push','head_sha':sha,'per_page':10})
        runs=self.json(self.repo('/actions/workflows/'+str(WORKFLOW_ID)+'/runs?'+query))['workflow_runs']
        runs=[r for r in runs if r['head_sha']==sha]
        require(bool(runs), 'No trusted CI push run exists')
        run=max(runs,key=lambda r:(r['run_number'],r['run_attempt']))
        self.validate_run(run,sha)
        jobs=self.json(self.repo('/actions/runs/'+str(run['id'])+'/attempts/'+str(run['run_attempt'])+'/jobs?per_page=100'))
        require(jobs['total_count']==len(jobs['jobs']), 'Incomplete CI job inventory')
        by_name={j['name']:j for j in jobs['jobs']}
        for name in ['static-site','authenticate-staging']:
            require(by_name.get(name,{}).get('conclusion')=='success', 'Required CI/signing job did not pass: '+name)
        steps={s['name']:s.get('conclusion') for s in by_name['static-site']['steps']}
        for name in ['Run npm run check','Run npm run lint','Run npm test','Run npm run build','Run npm run test:static','Run npm run test:media-policy','Browser and accessibility checks','Package CI staging payload', *['Run python3 -m unittest discover -s tests/'+folder+' -v' for folder in ['pull','cinematic-release','readiness','staging-auto','ci-staging']]]:
            require(steps.get(name)=='success', 'Required check missing/skipped/failed: '+name)
        return run

    @staticmethod
    def validate_run(run,sha):
        require(run['event']=='push' and run['head_branch']==BRANCH and run['head_sha']==sha, 'Untrusted CI branch/event/source')
        require(run['workflow_id']==WORKFLOW_ID and run['path']==WORKFLOW, 'Untrusted workflow identity')
        require(run['repository']['id']==REPOSITORY_ID and run['head_repository']['id']==REPOSITORY_ID, 'Fork/repository mismatch')
        require(run['status']=='completed' and run['conclusion']=='success', 'CI is incomplete or failed')

    def artifact(self,run):
        name='ci-staging-'+str(run['id'])+'-'+str(run['run_attempt'])
        result=self.json(self.repo('/actions/runs/'+str(run['id'])+'/artifacts?per_page=100'))
        require(result['total_count']==len(result['artifacts']), 'Incomplete artifact inventory')
        found=[a for a in result['artifacts'] if a['name']==name and not a['expired']]
        require(len(found)==1, 'Missing/ambiguous authenticated staging artifact')
        a=found[0]
        require(a['workflow_run']['id']==run['id'] and a['workflow_run']['head_sha']==run['head_sha'], 'Artifact belongs to another run/source')
        body=self.request(self.repo('/actions/artifacts/'+str(a['id'])+'/zip'),limit=MAX_ZIP+2*1024*1024)
        require(a.get('digest')=='sha256:'+digest(body), 'GitHub artifact digest mismatch')
        return body,a

    def deployment(self,sha):
        return self.json(self.repo('/deployments'), {'ref':sha,'environment':'cinematic-cloud','auto_merge':False,'production_environment':False,'transient_environment':True,'required_contexts':[],'description':'Verified protected CI staging artifact'})['id']

    def report(self,deployment_id,state,description):
        self.json(self.repo('/deployments/'+str(deployment_id)+'/statuses'), {'state':state,'environment_url':'https://www.mariyasnaturals.cloud','description':description[:140],'auto_inactive':False})
