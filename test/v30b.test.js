const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
test('v20261030b: 9 more AI designs Benz picked (6 Google Gemini, 3 Leonardo.ai), New badge, cross-listed, no Magen David ones', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI5_DESIGNS = (\{.*?\});\n/); assert.ok(m);
  const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.strictEqual(ks.length,6); // 9 minus 3 removed in v20261030d (Star of David)
  assert.strictEqual(ks.filter(k=>D[k].src==='gem').length,3); assert.strictEqual(ks.filter(k=>D[k].src==='leo').length,3);
  for(const k of ks){ const d=D[k]; assert.ok(d.nb&&d.isNew&&d.ai, k); assert.strictEqual(d.note, d.src==='gem'?'AI art · Google Gemini':'AI art · Leonardo.ai');
    for(const f of [d.file,d.thumb]){ assert.ok(fs.existsSync(S+'/img/'+f+'.webp'), f); }
    assert.ok(d.pad.length===3 && d.pad.every(x=>x>5&&x<50), k); }
  for(const bad of ['nightsky','velvet','leather']) assert.ok(!ks.some(k=>k.includes(bad)), bad+' was left out');
  const ca=JSON.parse(core.match(/var CROSS_ADD = (\{.*?\});\n/)[1]); for(const k of ks) assert.ok(Array.isArray(ca[k]), 'cross '+k);
  const wed=['chasuna','vort','engaged','tenoyim','aufruf','shevabrachos'], boy=['bris','shalomzachor','vachnacht','pidyonhaben','upsherin','barmitzvah','tefillin'];
  for(const k of ['ai5gemkiddushhydrangea']) for(const t of wed) assert.ok(!ca[k].includes(t)&&!D[k].types.includes(t), k+' not under '+t);
  for(const k of ['ai5leokiddushblushgeo','ai5leochasunaranunculus']) for(const t of boy) assert.ok(!ca[k].includes(t)&&!D[k].types.includes(t), k+' not under '+t);
  assert.ok(D.ai5gempidyonemerald.types.includes('pidyonhaben') );
  // this morning's 18 keep their New badge (no new strip line after AI4)
  const a4=core.indexOf('var AI4_DESIGNS'), a5=core.indexOf('var AI5_DESIGNS'); assert.ok(a4<a5 && a5<core.indexOf('var CROSS_ADD'));
  assert.ok(!/only the newest set wears the New badge/.test(core.slice(core.indexOf('var AI5_DESIGNS'), core.indexOf('var KEYS'))));
  assert.match(core,/v20261030b/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/v=20261030a/.test(h),f); assert.match(h,/v=20261030[b-z]/,f); }
  assert.match(rd('download.js'),/VERSION = '20261030[b-z]'/);
});
