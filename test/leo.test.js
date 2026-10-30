
const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site');
test('13 Leonardo designs (14 minus Blue Deco Starlight, removed v20261030d for its Star of David) with real image files and credits', ()=>{
  const core=fs.readFileSync(S+'/core.js','utf8');
  const m=core.match(/var LEO_DESIGNS = (\{.*?\});\n/); assert.ok(m);
  const D=JSON.parse(m[1]); const keys=Object.keys(D); assert.strictEqual(keys.length,13);
  for(const k of keys){ const d=D[k]; assert.ok(fs.statSync(S+'/img/'+d.file+'.webp').size>50000,k); assert.ok(fs.statSync(S+'/img/'+d.thumb+'.webp').size>3000,k);
    assert.strictEqual(d.src,'leo'); assert.ok(d.nb && d.isNew && d.ai); assert.ok(!/hand/i.test(d.name+d.note)); }
  assert.strictEqual(new Set(keys.map(k=>D[k].name)).size,13);
  assert.match(fs.readFileSync(S+'/index.html','utf8'),/AI-generated with Canva,? (?:and )?Leonardo\.ai/);
  assert.match(fs.readFileSync(S+'/make.js','utf8'),/AI art · Leonardo\.ai/);
  // v20261029b: the home design gallery is gone; the per-design credit lives on the card maker's tiles
  assert.match(fs.readFileSync(S+'/make.js','utf8'),/AI art · Leonardo\.ai/);
  const i18n=fs.readFileSync(S+'/i18n.js','utf8'); for(const s of ['AI art · Leonardo.ai','Background art AI-generated with Leonardo.ai','Some background art AI-generated with Canva and Leonardo.ai']) assert.ok(i18n.includes(JSON.stringify(s)+':'),s);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=fs.readFileSync(S+'/'+f,'utf8'); assert.ok(!h.includes('v=20261028f'),f); assert.match(h,/name="viewport"/); }
});
