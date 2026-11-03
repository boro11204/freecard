// v20261103a: the Adobe Firefly set (ai12adobe*, files ax1-*) — Benz Nov 2: "add the adobe batch to free card. note: some look doubled."
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path'), vm=require('vm');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261103a: 17 Adobe Firefly designs with pictures, tiles, Adobe credentials, label, New badge, leading their simchas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI12_DESIGNS = (\{.*?\});\n/); assert.ok(m,'AI12 block'); const D=JSON.parse(m[1]); const ks=Object.keys(D);
  assert.strictEqual(ks.length,17);
  for(const k of ks){ const d=D[k]; assert.ok(/^ai12adobe/.test(k) && d.nb && d.isNew && d.ai && d.src==='adobe', k); assert.strictEqual(d.note,'AI art · Adobe Firefly');
    assert.ok(/^ai\/ax1-/.test(d.file) && d.thumb==='ai/p/'+d.file.slice(3), k);
    assert.ok(Array.isArray(d.pad) && d.pad.length===3 && d.pad.every(x=>x>=10 && x<=55), k+' pad'); assert.ok(!/star|magen|moon|fan/i.test(d.name), d.name);
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(b.includes('c2pa'), 'credentials kept '+d.file); assert.ok(b.includes('Adobe'), 'Adobe parent ingredient '+d.file);
    assert.ok(b.length<260000, d.file+' size'); const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000, d.thumb+' size');
    assert.strictEqual(t.readUInt32LE(4)+8, t.length, 'tile is a whole RIFF file'); }
  const sims=ks.map(k=>D[k].types[0]); for(const s of ['chasuna','tenoyim','vort','kiddush','barmitzvah','shevabrachos','vachnacht','shalomzachor','bris','upsherin','pidyonhaben']) assert.ok(sims.includes(s), s);
  // the doubles and the two Benz flagged are not on the site
  for(const f of ['ax1-shevabrachos-black-gold-deco-fans','ax1-tenoyim-emerald-filigree-panel','ax1-vachnacht-hydrangea']) assert.ok(!core.includes(f) && !fs.existsSync(S+'/img/ai/'+f+'.webp'), f);
  const F=load(); const all=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain); assert.strictEqual(all.length,551); // v20261103b adds 22; v20261103c adds 28
  for(const k of ks) assert.ok(F.DESIGNS[k], k);
  for(const t of ['chasuna','tenoyim','kiddush','barmitzvah','shevabrachos','vachnacht','shalomzachor','bris','pidyonhaben','upsherin']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai1[234]adobe|^ai15(adobe|can)|^ai16adobe|^ai17adobe/.test(f), t+' leads with '+f); }
  const nb=all.filter(k=>F.DESIGNS[k].nb); assert.ok(nb.every(k=>/^ai1[01]can|^ai1[234]adobe|^ai15(adobe|can)|^ai16adobe|^ai17adobe/.test(k))); assert.ok(all.filter(k=>/^ai1[01]can/.test(k)).every(k=>F.DESIGNS[k].nb), "today's Canva sets keep New");
});
test('v20261103a: credit names Adobe Firefly in English, Hebrew and Yiddish; tile label; version everywhere', ()=>{
  assert.match(rd('index.html'),/class="ai-credit">Some background art AI-generated with Canva, Leonardo\.ai and Adobe Firefly</);
  assert.match(rd('make.html'),/AI-generated with Canva, Leonardo\.ai or Adobe Firefly\./);
  const i18n=rd('i18n.js'); for(const s of ['AI art · Adobe Firefly','Background art AI-generated with Adobe Firefly','Some background art AI-generated with Canva, Leonardo.ai and Adobe Firefly','Designs marked “AI art” have background art AI-generated with Canva, Leonardo.ai or Adobe Firefly.']) assert.ok(i18n.includes(JSON.stringify(s)+':'),s);
  assert.ok(i18n.includes('Adobe Firefly", "AI קונסט · Adobe Firefly"') || i18n.includes('"AI קונסט · Adobe Firefly"'));
  assert.match(rd('make.js'),/adobe \? 'AI art · Adobe Firefly'/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261102h'), f); assert.ok(/\?v=20261103[a-z]/.test(h), f); }
  assert.match(rd('download.js'),/var VERSION = '20261103[a-z]';/); assert.match(rd('core.js'),/var TILE_V = 'v20261103[a-z]'/);
});
