const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261031a: 14 new Google Gemini designs (ihopetoseeyou.com style), New badge, pictures + tiles, lead their simchas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI6_DESIGNS = (\{.*\});/); assert.ok(m);
  const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.strictEqual(ks.length,14);
  for(const k of ks){ const d=D[k]; assert.ok(d.nb&&d.isNew&&d.ai&&d.src==='gem', k); assert.strictEqual(d.note,'AI art · Google Gemini');
    assert.ok(fs.existsSync(S+'/img/'+d.file+'.webp'), d.file); const sz=fs.statSync(S+'/img/'+d.thumb+'.webp').size; assert.ok(sz<60000, d.thumb+' '+sz);
    assert.ok(!/star|magen|moon/i.test(d.name), d.name); }
  const F=load(); assert.strictEqual(Object.keys(F.DESIGNS).length,154);
  const nb=Object.keys(F.DESIGNS).filter(k=>F.DESIGNS[k].nb); assert.deepStrictEqual(nb.sort(), ks.slice().sort());
  for(const t of ['chasuna','barmitzvah','vort','bris','kiddush','shevabrachos','upsherin']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai6/.test(f), t+' leads with '+f); assert.strictEqual(F.sampleCard(t).d,f); }
  for(const t of Object.keys(F.TYPES)){ assert.ok(F.DESIGNS[F.sampleCard(t).d], t); }
  assert.match(core,/v20261031a/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/v=20261030d/.test(h),f); assert.match(h,/v=20261031a/,f); }
  assert.match(rd('download.js'),/VERSION = '20261031a'/);
  assert.match(rd('index.html')+rd('make.html')+rd('i18n.js')+core,/Some background art AI-generated with Canva, Leonardo\.ai and Google Gemini/);
});
