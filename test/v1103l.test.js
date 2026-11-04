// v20261103l: 8 Adobe Firefly shalom zachor designs Benz picked (Nov 3, 10:58 PM), the 6 Canva tefillin designs removed (11:06 PM), home row
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261103l: 8 new Firefly shalom zachor designs with pictures, tiles, high-res, credentials, label, New badge, text areas', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI19_DESIGNS = (\{.*?\});\n/); assert.ok(m); const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.strictEqual(ks.length,8);
  const dl=rd('download.js'); const F=load();
  for(const k of ks){ const d=D[k]; assert.ok(/^ai19adobeshalomzachor/.test(k)); assert.strictEqual(d.types[0],'shalomzachor'); assert.strictEqual(d.src,'adobe'); assert.strictEqual(d.note,'AI art \u00b7 Adobe Firefly');
    assert.ok(d.nb && d.isNew && d.ai && d.kind==='img'); assert.ok(!/star|magen|moon|cross|church|tefillin/i.test(d.name), d.name);
    assert.ok(d.pad.length===4 && d.pad.every(x=>x>=8 && x<=95)); assert.ok(d.pad[1]+d.pad[3]<=60, k+' wide enough'); assert.ok(150-d.pad[0]-d.pad[2]>=46, k+' tall enough for big words'); assert.ok(d.bsd<d.pad[0]);
    const slug=d.file.slice(3); assert.ok(/^ax6-shalomzachor-/.test(slug));
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.ok(b.includes('c2pa') && b.includes('Adobe') && b.length<260000); assert.strictEqual(b.readUInt32LE(4)+8,b.length);
    const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.ok(t.length<60000); assert.strictEqual(t.readUInt32LE(4)+8,t.length);
    const h=fs.readFileSync(S+'/img/ai/hd/'+slug+'.webp'); assert.ok(h.includes('c2pa') && h.length<900000); assert.ok(dl.includes(' '+slug));
    assert.ok(F.DESIGNS[k]); }
  assert.deepStrictEqual(F.designsFor('shalomzachor').first.slice(0,8).sort(), ks.slice().sort(), 'new ones lead shalom zachor');
  for(const k of ['ai18canshalomzachorchickpeabordertwobot','ai18canshalomzachorbeerarbescornersonro','ai18canshalomzachorsteelbluebottlesarbe','ai18adobeshalomzachorbeerarbesborderonn','ai18adobeshalomzachorbeerbottlesarbesbo','ai18adobeshalomzachoramberbottlespepper']) assert.ok(F.DESIGNS[k], 'kept '+k);
});
test('v20261103l: no tefillin design is published (Benz approves tefillin first)', ()=>{
  const F=load(); const core=rd('core.js');
  assert.ok(!/cx5-barmitzvah/.test(core)); assert.ok(!fs.readdirSync(S+'/img/ai').some(f=>/cx5-barmitzvah/.test(f))); assert.ok(!fs.readdirSync(S+'/img/ai/p').some(f=>/cx5-barmitzvah/.test(f)));
  for(const k of Object.keys(F.DESIGNS)) if(/^ai1[89]/.test(k)) assert.ok(!/tefillin|barmitzvah/i.test(k+F.DESIGNS[k].name), k);
});
test('v20261103l: home row = chosen list (two new shalom zachor in place of the old one and the tefillin tile)', ()=>{
  const F=load(); const D=F.DESIGNS; assert.ok(Array.isArray(F.FEATURED) && F.FEATURED.length===8); F.FEATURED.forEach(k=>assert.ok(D[k] && D[k].kind==='img', k));
  assert.strictEqual(F.FEATURED.filter(k=>/^ai19/.test(k)).length,2); assert.ok(!F.FEATURED.some(k=>/tefillin|barmitzvah/.test(k)));
  assert.match(rd('theme.js'),/F\.FEATURED \|\| \[\]/);
});
test('v20261103l: version everywhere, language fix kept', ()=>{
  for(const f of ['index.html','make.html','card.html','host.html','designs.html']){ const h=rd(f); assert.ok(!/\?v=20261103k(?!2)/.test(h) && h.includes('?v=20261103l'), f); assert.ok(h.includes('i18n.js?v=20261103k2'), f+' i18n fix'); }
  assert.match(rd('download.js'),/var VERSION = '20261103l';/); assert.match(rd('core.js'),/var TILE_V = 'v20261103l'/);
});

test('v20261103l: 4 more Hebrew fonts (OFL, self-hosted, in the picker, Yiddish fixes)', ()=>{
  const F=load(); const css=rd('fonts.css'); const mk=rd('make.js');
  const add={cardo:'Cardo',libertinus:'Libertinus Serif',bellefair:'Bellefair',bubbles:'Rubik Bubbles'};
  for(const [k,fam] of Object.entries(add)){ const f=F.FONTS[k]; assert.ok(f && f.family===fam && f.isNew && /[\u05D0-\u05EA]/.test(f.he), k); assert.ok(mk.includes("'"+k+"'"), k+' in a group');
    const faces=[...css.matchAll(new RegExp("font-family: '"+fam+"';[^}]*?src: url\\(fonts/([^)]+)\\)","g"))].map(m=>m[1]); assert.ok(faces.length>=1, fam);
    for(const fn of faces){ const b=fs.readFileSync(path.join(S,'fonts',fn)); assert.strictEqual(b.toString('ascii',0,4),'wOF2', fn); }
    assert.ok(fs.readFileSync(path.join(S,'fonts/licenses',fam.replace(/ /g,'')+'-OFL.txt'),'utf8').includes('SIL OPEN FONT LICENSE'), fam+' license'); }
  assert.strictEqual(F.fixText('\u05F2\uFB2E', F.FONTS.bellefair.fix), '\u05D9\u05D9\u05D0\u05B7'); assert.ok(!F.FONTS.suez);
  assert.strictEqual(F.FONTS.cardo.fix, undefined);
});
