from fontTools.ttLib import TTFont
import io,json,pathlib,uharfbuzz as hb
r=pathlib.Path(__file__).resolve().parent.parent
report={}
samples={'ml':'മലയാളം പ്രകൃതി ക്ഷേമം വ്യക്തിപരിചരണം പാരമ്പര്യം ക്ക ക്ഷ ന്ത്ര ശ്ര ച്ച ഞ്ച','hi':'प्रकृति परंपरा व्यक्तिगत देखभाल क्ष त्र ज्ञ श्र','ta':'தமிழ் இயற்கை பாரம்பரியம் கூந்தல் பராமரிப்பு ஸ்ரீ'}
for lang,script,low,high in [('ml','malayalam',0x0d00,0x0d7f),('hi','devanagari',0x0900,0x097f),('ta','tamil',0x0b80,0x0bff)]:
 text=(r/'src/i18n'/f'{lang}.json').read_text()+samples[lang]
 chars={ord(c) for c in text if low<=ord(c)<=high}
 report[lang]={}
 for kind in ['sans','serif']:
  f=TTFont(r/'public/fonts'/f'noto-{kind}-{script}-{script}-wght-normal.woff2')
  missing=chars-set(f.getBestCmap())
  # Decode WOFF2 to SFNT before HarfBuzz shapes representative conjuncts.
  f.flavor=None;stream=io.BytesIO();f.save(stream)
  font=hb.Font(hb.Face(stream.getvalue()))
  # The script subsets omit Latin and spaces; shape the Indic sample itself.
  sample=hb.Buffer();sample.add_str(samples[lang].replace(' ',''));sample.guess_segment_properties();hb.shape(font,sample)
  notdef=sum(g.codepoint==0 for g in sample.glyph_infos)
  report[lang][kind]={'scriptCodepointsChecked':len(chars),'missing':[f'U+{c:04X}' for c in sorted(missing)],'GSUB':'GSUB' in f,'GPOS':'GPOS' in f,'sample':samples[lang],'shapedGlyphs':len(sample.glyph_infos),'missingShapedGlyphs':notdef}
  assert not missing and notdef==0,(lang,kind,missing,notdef)
print(json.dumps(report,indent=2,ensure_ascii=False))
(r/'docs/rebrand-glyph-coverage.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
