"""Export review-only production variants; never touch protected original media/policies."""
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image, ImageOps
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'review/botanical'
SOURCES=json.loads((FOLDER/'generation-sources.json').read_text())
ASSETS=FOLDER/'assets';ASSETS.mkdir(exist_ok=True,parents=True)
MASTERS=FOLDER/'masters';MASTERS.mkdir(exist_ok=True,parents=True)
def sha(data):return hashlib.sha256(data).hexdigest()
records=[]
previous={a['file']:a for a in json.loads((FOLDER/'asset-manifest.json').read_text()).get('assets',[])} if (FOLDER/'asset-manifest.json').exists() else {}
def record(path,source,role,**metadata):
    image=Image.open(path)
    records.append({'file':path.relative_to(FOLDER).as_posix(),'sha256':sha(path.read_bytes()),'bytes':path.stat().st_size,'width':image.width,'height':image.height,'alpha':image.mode=='RGBA','source':source,'role':role,'reviewStatus':'pending-visual-approval',**metadata})
for key,source in list(SOURCES.items()):
    original=Path(source)
    master=MASTERS/(key+'.png')
    if original.is_absolute() and original.exists() and not master.exists():shutil.copyfile(original,master)
    assert master.is_file(),key
    SOURCES[key]='masters/'+key+'.png'
    record(master,'image-generation-tool','native-generated-master',generationId=previous.get(master.relative_to(FOLDER).as_posix(),{}).get('generationId',original.stem))
(FOLDER/'generation-sources.json').write_text(json.dumps(SOURCES,indent=2)+'\n')
backgrounds=['botanical-origin','ingredient-world','preparation','extraction','dark-oil','final-reveal']
for key,size,name in [('landscape',(1600,900),'desktop'),('portrait',(900,1600),'mobile')]:
    master=MASTERS/(key+'.png')
    image=ImageOps.fit(Image.open(master).convert('RGB'),size,Image.Resampling.LANCZOS)
    for background in backgrounds:
        path=ASSETS/(background+'-'+name+'.webp');image.save(path,'WEBP',quality=84,method=6)
        record(path,'masters/'+key+'.png','shared-continuity-background',composition=name,sharedPlate=True)
props={'mortar':'preparation-device','pestle':'preparation-pestle','glass':'glass-receiving-vessel','copper':'copper-oil-vessel','stream':'dark-oil-stream','droplet':'dark-oil-droplet','reflections':'liquid-reflections','fragments':'preparation-fragments','pourer':'pouring-vessel','extraction-filter':'extraction-filter'}
for key,name in props.items():
    image=Image.open(MASTERS/(key+'.png')).convert('RGBA')
    # Tighten transparent borders without repainting any generated object pixels.
    box=image.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox();assert box,key
    image=image.crop(box);image.thumbnail((1100,1100),Image.Resampling.LANCZOS)
    png=ASSETS/(name+'.png');image.save(png,optimize=True);record(png,'masters/'+key+'.png','independent-generated-prop')
    path=ASSETS/(name+'.webp');image.save(path,'WEBP',quality=88,method=6);record(path,png.relative_to(FOLDER).as_posix(),'optimized-independent-prop')
for group_index,group in enumerate('ABCDEF'):
    image=Image.open(MASTERS/('group-'+group+'.png')).convert('RGBA')
    alpha=np.asarray(image.getchannel('A'));counts=(alpha>8).sum(axis=0);width,height=image.size
    cuts=[0]
    for boundary in range(1,5):
        ideal=round(boundary*width/5);lo=round(ideal-width*.09);hi=round(ideal+width*.09)
        options=np.arange(lo,hi);minimum=counts[lo:hi].min();best=options[counts[lo:hi]==minimum]
        cut=int(best[np.abs(best-ideal).argmin()]);assert cut>cuts[-1]
        cuts.append(cut)
    cuts.append(width)
    for slot in range(5):
        cell=image.crop((cuts[slot],0,cuts[slot+1],height))
        box=cell.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox();assert box,(group,slot)
        obj=cell.crop(box);obj.thumbnail((440,560),Image.Resampling.LANCZOS)
        pad=Image.new('RGBA',(obj.width+24,obj.height+24));pad.paste(obj,(12,12))
        number=group_index*5+slot+1;name='ingredient-'+str(number).zfill(2)
        png=ASSETS/(name+'.png');pad.save(png,optimize=True)
        metadata={'group':group,'identity':None,'scientificName':None,'identityVerified':False,'artisticRepresentation':True,'atlasBounds':[cuts[slot],0,cuts[slot+1],height]}
        record(png,'masters/group-'+group+'.png','unnamed-artistic-botanical-study',**metadata)
        path=ASSETS/(name+'.webp');pad.save(path,'WEBP',quality=86,method=6);record(path,png.relative_to(FOLDER).as_posix(),'optimized-artistic-study',**metadata)
# Never regenerate, repaint, relabel, resize or cut out the genuine packaging photograph.
product=ASSETS/'authentic-product.jpg';shutil.copyfile(ROOT/'public/cinematic/original-product.jpg',product)
record(product,'public/cinematic/original-product.jpg','byte-identical-owner-product-photograph')
manifest={'schema':'botanical-review/v1','deploymentAllowed':False,'heroBaseline':'bf011e1cc395ee3d9b35ec752cbdea55a79f7de1','claim':{'text':'60 Natural Ingredients','status':'owner-confirmed','confirmation':'Owner instruction 2026-11-12: client confirms supporting government documents and certificates are available; no additional certification claim is inferred.'},'botanicalCount':30,'botanicalPolicy':'Unnamed non-exhaustive artistic representations. Not verified botanical identities or a complete formulation list.','processPolicy':'Artistic process visualization, not a verified Mariyas manufacturing method.','oilColorLock':['#020a06','#071a13','#244a31','#344735'],'productCutout':{'status':'not-generated','reason':'Original photographic pixels preserved; full photograph presented independently. No generative packaging extraction.'},'officialProductPage':{'url':'https://www.mariyasnaturals.com/product/hair-care-oil-1l/','httpStatus':200,'canonicalVerified':True,'variants':['200ML','500ML','1LTR'],'verifiedAt':'2026-11-12','activation':'Existing commerce and release guards remain unchanged.'},'backgroundPolicy':'One common master per viewport is intentionally shared across stages for continuity; foreground objects, fill, ripples, light and product animate independently.','assets':records}
(FOLDER/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Exported',len(records),'records; 30 independent artistic studies; genuine alpha preserved.')
