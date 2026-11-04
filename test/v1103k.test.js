// v20261103k: themed baby boy / baby girl / shalom zachor / bar mitzvah (tefillin) designs — Benz Nov 3, 6:36 PM: "make it more creative for baby boy make blue background and crib and baby toys ..."
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261103k: 25 themed designs (14 Firefly with high-res, 11 Canva), credentials, labels, New badge, text areas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI18_DESIGNS = (\{.*?\});\n/); assert.ok(m,'AI18 block'); const D=JSON.parse(m[1]); const ks=Object.keys(D);
  assert.strictEqual(ks.length,19); /* v20261103l: the 6 Canva tefillin designs were removed (Benz Nov 3, 11:06 PM) */ const dl=rd('download.js'); const names=new Set(); const cnt={adobe:0,canva:0}; const cat={};
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
  assert.deepStrictEqual(cnt,{adobe:14,canva:5}); assert.deepStrictEqual(cat,{bris:6,kiddush:7,shalomzachor:6}); assert.ok(!ks.some(k=>/barmitzvah|tefillin/.test(k)));
  const F=load(); for(const k of ks) assert.ok(F.DESIGNS[k], k);
  const all=Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain); assert.strictEqual(all.length,551+25-6+8);
  for(const t of ['bris','kiddush','vachnacht']){ const f=F.designsFor(t).first[0]; assert.ok(/^ai18/.test(f), t+' leads with '+f); }
  assert.ok(/^ai19/.test(F.designsFor('shalomzachor').first[0])); for(const t of ['barmitzvah','tefillin']) assert.ok(!F.designsFor(t).first.some(k=>/^ai18can|cx5-barmitzvah/.test(k+F.DESIGNS[k].file)), t+': no Canva tefillin left');
  // v20261103l: the home row is chosen in core.js FEATURED (tested in v1103l)
});
test('v20261103k: label still escaped', ()=>{
  const core=rd('core.js'); assert.ok(!core.includes('AI art · ')); assert.ok(!core.includes('Â'));
});
