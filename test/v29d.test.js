const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site');
const core=fs.readFileSync(S+'/core.js','utf8');
test('v20261029d: general AI designs are cross-listed under the simchas they fit, own designs first', ()=>{
  const m=core.match(/var CROSS_ADD = (\{.*?\});\n/); assert.ok(m); const C=JSON.parse(m[1]);
  const ai={}; for(const nm of ['AI_DESIGNS','LEO_DESIGNS','AI3_DESIGNS','AI4_DESIGNS','AI5_DESIGNS']){ const x=core.match(new RegExp('var '+nm+' = (\\{.*?\\});\\n')); Object.assign(ai, JSON.parse(x[1])); }
  for(const k of Object.keys(C)){ assert.ok(ai[k], k+' is an AI design'); assert.ok(C[k].length>0); }
  const babyKeys=['leogirl1','leogirl2','leogirl3','ai3leogirl04','leobris1','leobris2','leobris3','leoupsherin2','ai3leoupsherin03','ai3brpowderblue1','ai3brpowderblue2','ai3brpowderblue3'];
  const wed=['chasuna','vort','engaged','tenoyim','aufruf','shevabrachos'];
  for(const k of babyKeys) for(const t of wed) assert.ok(!(C[k]||[]).includes(t), k+' must not go under '+t);
  const blush=['aichblush1','aichblush2','aichblush3','aichblush4','ai3leovort01','ai3enblushrose1','ai3enblushrose2','ai3enblushrose4'];
  for(const k of blush) for(const t of ['bris','shalomzachor','vachnacht','pidyonhaben','upsherin','barmitzvah','tefillin']) assert.ok(!(C[k]||[]).includes(t)&&!ai[k].types.includes(t), k+' not under '+t);
  for(const k of Object.keys(C)) for(const t of ['purim','chanukah','mishloach']) assert.ok(!C[k].includes(t));
  assert.match(core,/var BORROWED = \{\};/); assert.match(core,/return tiers\(own\)\.concat\(tiers\(lent\)/);
  // no new picture files: cross-listing reuses the same images
  assert.ok(!/"file": "ai\/x-/.test(core));
});
test('v20261029d: home simcha cards have no arrow over the Hebrew title', ()=>{
  const i=fs.readFileSync(S+'/index.html','utf8'); assert.ok(!/class="arrow"/.test(i)); assert.ok(i.includes('class="t-he"'));
  const c=fs.readFileSync(S+'/styles.css','utf8'); assert.ok(!/\.type \.arrow/.test(c));
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=fs.readFileSync(S+'/'+f,'utf8'); assert.ok(!/v=20261029c/.test(h),f); assert.match(h,/v=202610(?:29[d-z]|3\d[a-z])/,f); }
  assert.match(fs.readFileSync(S+'/download.js','utf8'),/VERSION = '202610(?:29[d-z]|3\d[a-z])'/);
  assert.match(i,/<footer[^]*ai-credit[^]*Canva,? (?:and )?Leonardo\.ai/);
});
