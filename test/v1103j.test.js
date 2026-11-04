// v20261103j: Adobe Firefly batch 4 (ai17adobe*, files ax4-*) — Benz Nov 3, 4:50 PM: "make 50 more Adobe designs today make nice ones"
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261103j: 50 new Adobe Firefly designs with web pictures, tiles, high-res copies, credentials, label, New badge, text areas inside the card', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI17_DESIGNS = (\{.*?\});\n/); assert.ok(m,'AI17 block'); const D=JSON.parse(m[1]); const ks=Object.keys(D);
  assert.strictEqual(ks.length,50);
  const dl=rd('download.js'); const names=new Set();
  for(const k of ks){ const d=D[k]; assert.ok(/^ai17adobe/.test(k) && d.nb && d.isNew && d.ai && d.src==='adobe' && d.kind==='img', k); assert.strictEqual(d.note,'AI art · Adobe Firefly');
    assert.ok(/^ai\/ax4-/.test(d.file) && d.thumb==='ai/p/'+d.file.slice(3), k); assert.ok(!names.has(d.name), 'unique name '+d.name); names.add(d.name);
    assert.ok(Array.isArray(d.pad) && d.pad.length===4 && d.pad.every(x=>x>=4 && x<=95), k+' pad');
    assert.ok(d.pad[1]+d.pad[3]<=60 && d.pad[0]+d.pad[2]<=92, k+' leaves room for the words'); assert.ok(d.bsd<d.pad[0], k+' bsd above the words');
    assert.ok(!/star|magen|moon|cross|church/i.test(d.name), d.name);
    assert.ok(d.vars && /^#[0-9a-f]{6}$/.test(d.vars.bg) && /^#[0-9a-f]{6}$/.test(d.vars.ink), k+' colours');
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(b.includes('c2pa') && b.includes('Adobe'), 'credentials kept '+d.file);
    assert.ok(b.length<260000, d.file+' size'); assert.strictEqual(b.readUInt32LE(4)+8, b.length, 'web picture is a whole RIFF file');
    const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000, d.thumb+' size'); assert.strictEqual(t.readUInt32LE(4)+8, t.length, 'tile is a whole RIFF file');
    const slug=d.file.slice(3); const h=fs.readFileSync(S+'/img/ai/hd/'+slug+'.webp'); assert.ok(h.includes('c2pa') && h.length<900000, 'hd '+slug);
    assert.strictEqual(h.readUInt32LE(4)+8, h.length, 'hd is a whole RIFF file'); assert.ok(dl.includes(' '+slug), 'HD_SET has '+slug); }
  const F=load(); for(const k of ks) assert.ok(F.DESIGNS[k], k);
  const all=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain); assert.ok(all.length>=501+50, 'at least the 551 of v20261103j');
  for(const t of ['chasuna','tenoyim','vort','kiddush','barmitzvah','basmitzvah','shevabrachos','bris','upsherin','chanukashabayis']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai1[78]/.test(f), t+' leads with '+f); }
  // the home row (8 newest, one per simcha) is made of this batch, and the home page still does not list the whole collection
  const nb=all.filter(k=>F.DESIGNS[k].nb && F.DESIGNS[k].kind==='img'); const seen={}, row=[]; nb.forEach(k=>{ const t=F.DESIGNS[k].types[0]; if(row.length<8 && !seen[t]){ seen[t]=1; row.push(k); } });
  assert.strictEqual(row.length,8); assert.ok(row.every(k=>/^ai1[78]/.test(k)), row.join());
  assert.ok(/var FEAT = 8/.test(rd('theme.js'))); assert.ok(rd('index.html').includes('data-mode="featured"'));
});
test('v20261103j: the tile label can never show as "Â·" (written as \\u00b7 in core.js), version everywhere', ()=>{
  const core=rd('core.js'); assert.ok(!core.includes('AI art · '), 'no raw middle dot in labels'); assert.ok(core.includes('AI art \\u00b7 Adobe Firefly')); assert.ok(!core.includes('Â'));
  const F=load(); const lab=Object.values(F.DESIGNS).filter(d=>d.src==='adobe').map(d=>d.note); assert.ok(lab.length>100 && lab.every(n=>n==='AI art \u00b7 Adobe Firefly'));
  for(const f of ['index.html','make.html','card.html','host.html','designs.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103i') && /\?v=20261103[j-z]/.test(h), f); }
  assert.match(rd('download.js'),/var VERSION = '20261103[j-z]';/); assert.match(core,/var TILE_V = 'v20261103[j-z]'/);
});
