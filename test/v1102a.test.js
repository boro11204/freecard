const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261102: the big Canva Pro set (ai9, no Gemini), New badge only on them, pictures + tiles, lead their simchas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI9_DESIGNS = (\{.*\});/); assert.ok(m);
  const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.ok(ks.length>=50, 'count '+ks.length);
  assert.ok(ks.every(k=>!D[k].src && /^ai9can/.test(k)));
  const names=new Set();
  for(const k of ks){ const d=D[k]; assert.ok(d.nb&&d.isNew&&d.ai, k); assert.strictEqual(d.note,'AI art · Canva');
    assert.ok(!names.has(d.name), 'unique name '+d.name); names.add(d.name);
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(!b.includes('Google'), d.file); assert.ok(b.includes('c2pa'), 'Canva credentials kept '+d.file);
    const sz=fs.statSync(S+'/img/'+d.thumb+'.webp').size; assert.ok(sz<60000, d.thumb+' '+sz);
    assert.ok(!/star|magen|moon|cross|church/i.test(d.name), d.name); assert.ok(d.pad.length===3, k); }
  const F=load(); const k10=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain).filter(k=>/^ai10can/.test(k)); const k11=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain).filter(k=>/^ai11can/.test(k)); const k12=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain).filter(k=>/^ai1[234]adobe|^ai15(adobe|can)|^ai16adobe|^ai17adobe|^ai1[89]/.test(k)); assert.strictEqual(Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain).length,173+ks.length+k10.length+k11.length+k12.length); // v20261102d adds the ai10 set; v20261102f the ai11 set
  const nb=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain).filter(k=>F.DESIGNS[k].nb); assert.deepStrictEqual(nb.sort(), k10.concat(k11).concat(k12).sort()); assert.ok(ks.every(k=>!F.DESIGNS[k].nb)); // v20261102d: the badge moved to the ai10 set
  for(const t of ['chasuna','barmitzvah','vort','bris','kiddush','shevabrachos','upsherin']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai(9|1[01])can|^ai1[234]adobe|^ai15(adobe|can)|^ai16adobe|^ai17adobe|^ai1[89]/.test(f), t+' leads with '+f); assert.strictEqual(F.sampleCard(t).d,f); }
  assert.ok(!Object.values(F.DESIGNS).some(d=>d.src==='gem'));
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.match(h,/v=202611\d\d[a-z]/,f); assert.ok(!/Gemini/.test(h), f); }
  assert.match(rd('index.html'),/Some background art AI-generated with Canva(,| and) Leonardo\.ai/);
});
