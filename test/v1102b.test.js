// v20261102b: tap a design → enlarged preview with tools beside it; more elegant lettering
const fs=require('fs'), path=require('path'), assert=require('assert');
const W=path.join(__dirname,'..','site');
const mj=fs.readFileSync(W+'/make.js','utf8'), css=fs.readFileSync(W+'/styles.css','utf8'), fcss=fs.readFileSync(W+'/fonts.css','utf8'), core=fs.readFileSync(W+'/core.js','utf8'), html=fs.readFileSync(W+'/make.html','utf8');
['function edEnter','function edExit','function edBuildStrip','edStrip','ed-tile',"closest('#swFirst, #swRest')"].forEach(s=>assert(mj.includes(s),'make.js lacks '+s));
['body.ed-mode .maker-grid','body.ed-mode .ed-stage','.ed-row','@media (min-width: 901px)'].forEach(s=>assert(css.includes(s),'styles.css lacks '+s));
['id="swFirst"','id="swRest"','id="card"','id="dlJpg"','id="dlPdf"','id="fontGrid"','id="preview"'].forEach(s=>assert(html.includes(s),'make.html lost '+s));
assert(!/Gemini/.test(html));
const m=core.match(/Object\.assign\(FONTS, \{([\s\S]*?)\n  \}\);/); assert(m,'FONTS block');
const ents=[...m[1].matchAll(/(\w+): \{ name: '([^']+)', he: '([^']+)', family: '([^']+)', weight: (\d+)([^}]*)\}/g)];
assert(ents.length>=29,'fonts '+ents.length);
let newCount=0;
for(const e of ents){ const fam=e[4], rest=e[6]; const faces=[...fcss.matchAll(/@font-face \{([^}]*)\}/g)].map(x=>x[1]).filter(b=>b.includes("'"+fam+"'"));
  assert(faces.length,'no @font-face for '+fam);
  faces.forEach(b=>{ const u=b.match(/url\((fonts\/[^)]+)\)/)[1]; assert(fs.existsSync(path.join(W,u)),'missing file '+u); });
  if(/isNew: true/.test(rest)){ newCount++; if(!/enOnly: true/.test(rest)) assert(faces.some(b=>/U\+0590-05FF/.test(b)),'labeled Hebrew but no Hebrew face: '+fam); }
}
assert(newCount>=10,'new fonts '+newCount);
console.log('v1102b ok', ents.length,'fonts,', newCount,'new');
