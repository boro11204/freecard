// v20261103k: themed baby boy / baby girl / shalom zachor / bar mitzvah (tefillin) designs — Benz Nov 3, 6:36 PM: "make it more creative for baby boy make blue background and crib and baby toys ..."
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261103k: 25 themed designs (14 Firefly with high-res, 11 Canva), credentials, labels, New badge, text areas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI18_DESIGNS = (\{.*?\});\n/); assert.ok(m,'AI18 block'); const D=JSON.parse(m[1]); const ks=Object.keys(D);
  assert.strictEqual(ks.length,25); const dl=rd('download.js'); const names=new Set(); const cnt={adobe:0,canva:0}; const cat={};
  for(const k of ks){ const d=D[k]; assert.ok(d.nb && d.isNew && d.ai && d.kind==='img', k); cnt[d.src]++; cat[d.types[0]]=(cat[d.types[0]]||0)+1;
    assert.ok(!names.has(d.name), 'unique name '+d.name); names.add(d.name); assert.ok(!/star|magen|moon|cross|church/i.test(d.name), d.name);
    assert.ok(Array.isArray(d.pad) && d.pad.length===4 && d.pad.every(x=>x>=4 && x<=95), k+' pad');
    assert.ok(d.pad[1]+d.pad[3]<=60 && d.pad[0]+d.pad[2]<=92, k+' leaves room for the words'); assert.ok(d.bsd<d.pad[0], k);
    assert.ok(d.vars && /^#[0-9a-f]{6}$/.test(d.vars.bg) && /^#[0-9a-f]{6}$/.test(d.vars.ink), k+' colours');
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(b.includes('c2pa'), 'credentials kept '+d.file); assert.ok(b.length<260000, d.file);
    assert.strictEqual(b.readUInt32LE(4)+8, b.length); const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000); assert.strictEqual(t.readUInt32LE(4)+8, t.length);
    const slug=d.file.slice(3);
    if(d.src==='adobe'){ assert.ok(/^ai18adobe/.test(k) && /^ax5-/.test(slug)); assert.strictEqual(d.note,'AI art \u00b7 Adobe Firefly'); assert.ok(b.includes('Adobe'));
      const h=fs.readFileSync(S+'/img/ai/hd/'+slug+'.webp'); assert.ok(h.includes('c2pa') && h.length<900000); assert.strictEqual(h.readUInt32LE(4)+8, h.length); assert.ok(dl.includes(' '+slug), 'HD_SET has '+slug); }
    else { assert.strictEqual(d.src,'canva'); assert.ok(/^ai18can/.test(k) && /^cx5-/.test(slug)); assert.strictEqual(d.note,'AI art \u00b7 Canva');
      assert.ok(!fs.existsSync(S+'/img/ai/hd/'+slug+'.webp') && !dl.includes(' '+slug), 'no upscaled high-res copy for Canva '+slug); } }
  assert.deepStrictEqual(cnt,{adobe:14,canva:11}); assert.deepStrictEqual(cat,{bris:6,kiddush:7,shalomzachor:6,barmitzvah:6});
  const F=load(); for(const k of ks) assert.ok(F.DESIGNS[k], k);
  const all=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain); assert.strictEqual(all.length,551+25);
  for(const t of ['bris','kiddush','shalomzachor','barmitzvah','tefillin','vachnacht']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai18/.test(f), t+' leads with '+f); }
  assert.ok(/^ai18can/.test(F.designsFor('barmitzvah').first[0]));
  const nb=all.filter(k=>F.DESIGNS[k].nb && F.DESIGNS[k].kind==='img'); const seen={}, row=[]; nb.forEach(k=>{ const t=F.DESIGNS[k].types[0]; if(row.length<8 && !seen[t]){ seen[t]=1; row.push(k); } });
  assert.strictEqual(row.length,8); assert.strictEqual(row.filter(k=>/^ai18/.test(k)).length,4, row.join());
});
test('v20261103k: version everywhere, label still escaped', ()=>{
  const core=rd('core.js'); assert.ok(!core.includes('AI art · ')); assert.ok(!core.includes('Â'));
  for(const f of ['index.html','make.html','card.html','host.html','designs.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103j') && h.includes('?v=20261103k'), f); }
  assert.match(rd('download.js'),/var VERSION = '20261103k';/); assert.match(core,/var TILE_V = 'v20261103k'/);
});
