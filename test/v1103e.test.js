// v20261103e: the Adobe-vs-Canva test images on the site (ai15adobe* / ai15can*, files ab-adobe-* / ab-canva-*) — Benz Nov 2, 10:40 PM: "u should really add all these. i dont mind adobe's little sparkles, as long as its not stars of david."
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
function webpSize(b){ const t=b.toString('ascii',12,16);
  if(t==='VP8X') return [1+b.readUIntLE(24,3), 1+b.readUIntLE(27,3)];
  if(t==='VP8 ') return [b.readUInt16LE(26)&0x3fff, b.readUInt16LE(28)&0x3fff];
  if(t==='VP8L'){ const v=b.readUInt32LE(21); return [1+(v&0x3fff), 1+((v>>14)&0x3fff)]; } return null; }
test('v20261103e: 38 designs from the Adobe-vs-Canva test (18 Adobe Firefly, 20 Canva) with pictures, tiles, labels, New badge, text areas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI15_DESIGNS = (\{.*?\});\n/); assert.ok(m,'AI15 block'); const D=JSON.parse(m[1]); const ks=Object.keys(D);
  assert.strictEqual(ks.length,38);
  assert.strictEqual(ks.filter(k=>/^ai15adobe/.test(k)).length,18); assert.strictEqual(ks.filter(k=>/^ai15can/.test(k)).length,20);
  const dl=rd('download.js'); const hm=dl.match(/HD_SET = \{\};\n  '([^']+)'\.split/); const hd=hm[1].split(' ');
  for(const k of ks){ const d=D[k], adobe=/^ai15adobe/.test(k); assert.ok(d.nb && d.isNew && d.ai && d.kind==='img', k);
    assert.strictEqual(d.note, adobe?'AI art · Adobe Firefly':'AI art · Canva'); assert.strictEqual(d.src, adobe?'adobe':'canva');
    assert.ok((adobe?/^ai\/ab-adobe-/:/^ai\/ab-canva-/).test(d.file) && d.thumb==='ai/p/'+d.file.slice(3), k);
    assert.ok(Array.isArray(d.pad) && d.pad.length===4 && d.pad.every(x=>x>=4 && x<=95), k+' pad');
    assert.ok(d.pad[1]+d.pad[3]<=64 &&  /* v20261103g: Black Lacquer's text area moved inside its frame */ d.pad[0]+d.pad[2]<=92, k+' leaves room for the words'); assert.ok(d.bsd<d.pad[0], k+' bsd above the words');
    assert.ok(!/magen|moon|cross|crescent/i.test(d.name), d.name);
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.deepStrictEqual(webpSize(b),[1000,1500], d.file); assert.ok(b.length<260000, d.file+' size');
    if(adobe) assert.ok(b.includes('c2pa') && b.includes('Adobe'), 'credentials kept '+d.file);
    const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000, d.thumb+' size'); assert.deepStrictEqual(webpSize(t),[400,600], d.thumb);
    assert.strictEqual(t.readUInt32LE(4)+8, t.length, 'tile is a whole RIFF file');
    const n=d.file.slice(3);
    if(adobe){ assert.ok(hd.includes(n), n+' has a high-res copy'); const h=fs.readFileSync(S+'/img/ai/hd/'+n+'.webp'); assert.deepStrictEqual(webpSize(h),[1600,2400], n); assert.ok(h.length<720000, n+' hd size'); assert.ok(h.includes('c2pa')); }
    else assert.ok(!hd.includes(n), n+' Canva source is 1040 wide: no high-res copy'); }
  // left out: Adobe's walnut (Stars of David carved in) and Adobe's silver tray (a photo of a tray on a table with a cross-shaped medallion)
  assert.ok(!/walnut/i.test(Object.values(D).filter(d=>d.src==='adobe').map(d=>d.name).join(' ')), 'no Adobe walnut');
  assert.ok(!fs.readdirSync(S+'/img/ai').some(f=>/^ab-adobe-(kiddush-walnut|pidyonhaben)/.test(f)), 'dropped Adobe files are not shipped');
  const F=load(); const all=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain); assert.strictEqual(all.length,501);
  for(const k of ks) assert.ok(F.DESIGNS[k], k);
  for(const t of ['chasuna','tenoyim','vort','kiddush','barmitzvah','shevabrachos','vachnacht','shalomzachor','bris','pidyonhaben','upsherin']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai1[56]/.test(f), t+' leads with '+f); }
});
test('v20261103e: version everywhere', ()=>{
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103d') && !h.includes('?v=20261103e'), f); assert.ok(!h.includes('?v=20261103f') && h.includes('?v=20261103g'), f); }  // v20261103g: bumped again
  assert.match(rd('download.js'),/var VERSION = '20261103g';/); assert.match(rd('core.js'),/var TILE_V = 'v20261103g'/);
});
