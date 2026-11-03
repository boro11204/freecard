// v20261102f: today's second Canva set (ai11) in the same catalog style (original art) — New badge on both of today's sets (ai10 + ai11)
const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261102f: the ai11 Canva set (no Gemini) has pictures, tiles, Canva credentials, the New badge, leads its simchas, and upsherin got rich designs', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI11_DESIGNS = (\{.*\});/); assert.ok(m, 'AI11 block');
  const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.ok(ks.length>=40, 'count '+ks.length);
  const F=load(); const all=Object.keys(F.DESIGNS); const names=new Set(all.map(k=>F.DESIGNS[k].name)); assert.strictEqual(names.size, all.length, 'every design name is unique');
  for(const k of ks){ const d=D[k]; assert.ok(/^ai11can/.test(k) && d.nb && d.isNew && d.ai && !d.src, k); assert.strictEqual(d.note,'AI art · Canva');
    assert.ok(Array.isArray(d.pad) && d.pad.length===3 && d.pad.every(x=>x>=10 && x<=50), k+' pad');
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(!b.includes('Google'), d.file); assert.ok(b.includes('c2pa'), 'Canva credentials kept '+d.file);
    assert.ok(b.length<260000, d.file+' size'); const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000, d.thumb+' size'); }
  const nb=all.filter(k=>F.DESIGNS[k].nb); assert.ok(nb.every(k=>/^ai1[01]can|^ai1[234]adobe/.test(k))); assert.ok(ks.every(k=>F.DESIGNS[k].nb));
  assert.ok(all.filter(k=>/^ai10can/.test(k)).every(k=>F.DESIGNS[k].nb), 'this morning set keeps New');
  for(const t of ['chasuna','barmitzvah','tenoyim','bris','vachnacht','shalomzachor','kiddush','shevabrachos','pidyonhaben','upsherin']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai11can|^ai1[234]adobe/.test(f), t+' leads with '+f); }
  assert.ok(ks.filter(k=>D[k].types[0]==='upsherin').length>=5, 'upsherin');
  const h=rd('index.html'); assert.match(h, /v=2026110(2[f-z]|3[a-z])/); assert.ok(!/Gemini/.test(h));
});
