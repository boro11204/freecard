// v20261103c: Adobe Firefly batch 3 (ai14adobe*, files ax3-*) — Benz Nov 2: "add more I want like 50 more nuanced"
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261103c: 28 more Adobe Firefly designs with pictures, tiles, credentials, label, New badge, text areas inside the card', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI14_DESIGNS = (\{.*?\});\n/); assert.ok(m,'AI14 block'); const D=JSON.parse(m[1]); const ks=Object.keys(D);
  assert.strictEqual(ks.length,28);
  for(const k of ks){ const d=D[k]; assert.ok(/^ai14adobe/.test(k) && d.nb && d.isNew && d.ai && d.src==='adobe', k); assert.strictEqual(d.note,'AI art · Adobe Firefly');
    assert.ok(/^ai\/ax3-/.test(d.file) && d.thumb==='ai/p/'+d.file.slice(3), k);
    assert.ok(Array.isArray(d.pad) && d.pad.length===4 && d.pad.every(x=>x>=4 && x<=95), k+' pad');
    assert.ok(d.pad[1]+d.pad[3]<=60 && d.pad[0]+d.pad[2]<=92, k+' leaves room for the words'); assert.ok(d.bsd<d.pad[0], k+' bsd above the words');
    assert.ok(!/star|magen|moon|cross/i.test(d.name), d.name);
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(b.includes('c2pa') && b.includes('Adobe'), 'credentials kept '+d.file);
    assert.ok(b.length<260000, d.file+' size'); const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000, d.thumb+' size');
    assert.strictEqual(t.readUInt32LE(4)+8, t.length, 'tile is a whole RIFF file'); }
  // dropped on the re-check: a double of the live navy-and-gold "midnight", and carved flowers with + shaped petals
  for(const f of ["ax3-bris-navy-white-carved-floral-scroll-frame", "ax3-chasuna-sapphire-gold-rococo-corners"]) assert.ok(!core.includes(f) && !fs.existsSync(S+'/img/ai/'+f+'.webp'), f);
  const F=load(); const all=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain); assert.ok(all.length>=448);
  for(const k of ks) assert.ok(F.DESIGNS[k], k);
  for(const t of ['chasuna','tenoyim','vort','kiddush','barmitzvah','shevabrachos','vachnacht','shalomzachor','bris','pidyonhaben','upsherin']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai1[456](adobe|can)/.test(f), t+' leads with '+f); }
  assert.ok(all.filter(k=>/^ai1[23]adobe/.test(k)).every(k=>F.DESIGNS[k].nb), 'the earlier Adobe sets keep New');
});
test('v20261103c: version everywhere', ()=>{
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103b'), f); assert.ok(/\?v=20261103[c-z]/.test(h), f); }
  assert.match(rd('download.js'),/var VERSION = '20261103[c-z]';/); assert.match(rd('core.js'),/var TILE_V = 'v20261103[c-z]'/);
});
