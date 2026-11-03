// v20261103d: high-res Download (Benz Nov 2, 10:05 PM: "yes" to loading the high-res file only when someone hits Download)
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function webpSize(b){ // VP8 / VP8L / VP8X header -> [w,h]
  const t=b.toString('ascii',12,16);
  if(t==='VP8X') return [1+b.readUIntLE(24,3), 1+b.readUIntLE(27,3)];
  if(t==='VP8 ') return [b.readUInt16LE(26)&0x3fff, b.readUInt16LE(28)&0x3fff];
  if(t==='VP8L'){ const v=b.readUInt32LE(21); return [1+(v&0x3fff), 1+((v>>14)&0x3fff)]; }
  return null; }
test('v20261103d: every high-res copy exists, is 1600x2400, small enough, and belongs to a live picture design', ()=>{
  const dl=rd('download.js'); const m=dl.match(/HD_SET = \{\};\n  '([^']+)'\.split/); assert.ok(m,'HD list'); const names=m[1].split(' ');
  assert.strictEqual(names.length, 96); assert.strictEqual(new Set(names).size, names.length);
  const core=rd('core.js');
  for(const n of names){
    const p=S+'/img/ai/hd/'+n+'.webp'; assert.ok(fs.existsSync(p), p); const b=fs.readFileSync(p);
    assert.strictEqual(b.toString('ascii',0,4),'RIFF'); assert.strictEqual(b.readUInt32LE(4)+8, b.length, n+' whole file');
    assert.deepStrictEqual(webpSize(b),[1600,2400], n); assert.ok(b.length<720000, n+' '+b.length);
    assert.ok(core.includes('"file": "ai/'+n+'"'), n+' is a live design');
    assert.ok(fs.existsSync(S+'/img/ai/'+n+'.webp'), n+' normal picture still there');
    if(/^ax[123]-/.test(n)) assert.ok(b.includes('c2pa'), n+' keeps its Adobe credentials');
  }
  // the editor never asks for them: only download.js (on Download) knows the folder
  for(const f of ['core.js','make.js','card.js','index.html','make.html','card.html']) assert.ok(!rd(f).includes('img/ai/hd'), f);
  assert.ok(!fs.readdirSync(S+'/img/ai/hd').some(f=>!names.includes(f.replace(/\.webp$/,''))), 'no stray files');
});
test('v20261103d: download makes the card bigger only on Download, with a quiet fallback', ()=>{
  const dl=rd('download.js');
  assert.match(dl,/var HD_W = 1600/); assert.match(dl,/function hdPlan\(node, opts\)/); assert.match(dl,/function tryHd\(/);
  assert.match(dl,/Preparing high-res…/); assert.match(rd('i18n.js'),/"Preparing high-res…": \["/);
  assert.match(dl,/noHd: true/); assert.match(rd('paint.js'),/opts\.swap/);
  // warm() (runs while editing) must not touch the high-res copies
  const warm=dl.slice(dl.indexOf('function warm('), dl.indexOf('// print layouts'));
  assert.ok(!/hd/i.test(warm.replace(/htmlToImage/g,'')), 'warm stays on the normal pictures');
  // hdUrl maps only listed designs
  global.window=global; global.navigator={userAgent:''}; global.document={getElementById(){return null}};
  const ctx={}; const src=dl.replace("})(window);","})(ctx);"); new Function('ctx',src)(ctx);
  const D=ctx.FreeCardDownload;
  assert.strictEqual(D.hdUrl('https://freecard.sites.tab.bot/img/ai/ax1-chasuna-blackregal.webp'),'https://freecard.sites.tab.bot/img/ai/hd/ax1-chasuna-blackregal.webp?v=20261103d');
  assert.strictEqual(D.hdUrl('https://boro11204.github.io/freecard/img/ai/ch-navy-deco-2.webp?v=1'),'https://boro11204.github.io/freecard/img/ai/hd/ch-navy-deco-2.webp?v=20261103d');
  assert.strictEqual(D.hdUrl('https://x/img/ai/c11-tenoyim-malachite.webp'),null); assert.strictEqual(D.hdUrl('https://x/img/ai/p/ax1-chasuna-blackregal.webp'),null);
});
test('v20261103d: version everywhere', ()=>{
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103c'), f); assert.ok(/\?v=20261103[d-z]/.test(h), f); }
  assert.match(rd('download.js'),/var VERSION = '20261103[d-z]';/); assert.match(rd('core.js'),/var TILE_V = 'v20261103[d-z]'/);
});
