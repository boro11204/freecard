const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261031c: 17 new Canva / Leonardo.ai designs (no Gemini), New badge, pictures + tiles, lead their simchas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI7_DESIGNS = (\{.*\});/); assert.ok(m);
  const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.strictEqual(ks.length,17);
  assert.strictEqual(ks.filter(k=>D[k].src==='leo').length,6); assert.strictEqual(ks.filter(k=>!D[k].src).length,11);
  for(const k of ks){ const d=D[k]; assert.ok(d.nb&&d.isNew&&d.ai, k); assert.strictEqual(d.note, d.src==='leo'?'AI art · Leonardo.ai':'AI art · Canva');
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(!b.includes('Google'), d.file); if(!d.src) assert.ok(b.includes('c2pa'), 'Canva credentials kept '+d.file);
    const sz=fs.statSync(S+'/img/'+d.thumb+'.webp').size; assert.ok(sz<60000, d.thumb+' '+sz);
    assert.ok(!/star|magen|moon/i.test(d.name), d.name); assert.ok(d.pad.length===3, k); }
  const F=load(); assert.strictEqual(Object.keys(F.DESIGNS).length,173+Object.keys(F.DESIGNS).filter(k=>/^ai(9|10|11)can|^ai1[234]adobe|^ai15(adobe|can)/.test(k)).length); // v20261101a: +19; v20261102a: + the ai9 set; v20261102d: + the ai10 set
  const nb=Object.keys(F.DESIGNS).filter(k=>F.DESIGNS[k].nb); assert.ok(ks.every(k=>F.DESIGNS[k] && nb.indexOf(k)<0)); // v20261101a: the ai7 set stays but drops the New badge
  for(const t of ['chasuna','barmitzvah','vort','bris','kiddush','shevabrachos','upsherin','basmitzvah']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai([789]|1[012345])/.test(f), t+' leads with '+f); assert.strictEqual(F.sampleCard(t).d,f); }
  assert.ok(!Object.values(F.DESIGNS).some(d=>d.src==='gem'));
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.match(h,/v=(?:20261031c|202611\d\d[a-z])/,f); assert.ok(!/Gemini/.test(h), f); }
  assert.match(rd('download.js'),/VERSION = '(?:20261031c|202611\d\d[a-z])'/);
  assert.match(rd('index.html'),/Some background art AI-generated with Canva(,| and) Leonardo\.ai/);
});
