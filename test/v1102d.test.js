// v20261102d/e: a new Canva set (ai10) in the style of Benz's invitation-catalog screenshots (original art) — New badge moves to it
const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261102d: the ai10 Canva set (no Gemini) has pictures, tiles, Canva credentials, the New badge, and leads its simchas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI10_DESIGNS = (\{.*\});/); assert.ok(m, 'AI10 block');
  const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.ok(ks.length>=19, 'count '+ks.length);
  const F=load(); const all=Object.keys(F.DESIGNS); const names=new Set(all.map(k=>F.DESIGNS[k].name)); assert.strictEqual(names.size, all.length, 'every design name is unique');
  for(const k of ks){ const d=D[k]; assert.ok(/^ai10can/.test(k) && d.nb && d.isNew && d.ai && !d.src, k); assert.strictEqual(d.note,'AI art · Canva');
    assert.ok(Array.isArray(d.pad) && d.pad.length===3 && d.pad.every(x=>x>=10 && x<=50), k+' pad');
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(!b.includes('Google'), d.file); assert.ok(b.includes('c2pa'), 'Canva credentials kept '+d.file);
    assert.ok(b.length<260000, d.file+' size'); const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000, d.thumb+' size'); }
  const nb=all.filter(k=>F.DESIGNS[k].nb); assert.deepStrictEqual(nb.sort(), ks.slice().sort());
  for(const t of ['chasuna','barmitzvah','tenoyim','bris','vachnacht','shalomzachor','kiddush','shevabrachos','pidyonhaben']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai10can/.test(f), t+' leads with '+f); }
  const h=rd('index.html'); assert.match(h, /v=20261102[d-z]/); assert.ok(!/Gemini/.test(h));
});
