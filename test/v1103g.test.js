// v20261103g: text layout per line (Paragraph / Copyfit / Tab & dot leader / Curve / Columns), text kept inside each design's text area,
// and the 15 designs from Benz's own Adobe Firefly project (Benz Nov 2, 11:09 PM: "add all thses from this project."; 11:37 PM about Tavlah's text layout: "Yes.")
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
function webpSize(b){ const i=b.indexOf('VP8'); if(b[i+3]===0x58){ return [1+b.readUIntLE(i+12,3), 1+b.readUIntLE(i+15,3)]; } if(b[i+3]===0x4c){ const v=b.readUInt32LE(i+9); return [1+(v&0x3fff), 1+((v>>14)&0x3fff)]; } return [b.readUInt16LE(i+14)&0x3fff, b.readUInt16LE(i+16)&0x3fff]; }

test('v20261103g: a part keeps its layout with its other changes', ()=>{
  const F=load();
  assert.deepStrictEqual(F.peClean({lo:'arc',k:500,co:9,cg:3,cd:'1',ld:'0'}), {lo:'arc',k:100,co:4,cg:3,cd:'1',ld:'0'});
  assert.deepStrictEqual(F.peClean({lo:'arc'}), {lo:'arc',k:40});
  assert.deepStrictEqual(F.peClean({lo:'fit'}), {lo:'fit'});
  assert.deepStrictEqual(F.peClean({lo:'tab',co:2,cg:4}), {lo:'tab',co:2});
  assert.deepStrictEqual(F.peClean({lo:'bogus',co:1,cg:'x'}), {});
  assert.ok(!F.peIsEmpty(F.peClean({lo:'tab'})));
});
test('v20261103g: Tab splits the words from the time (Latin and Hebrew/Yiddish)', ()=>{
  const F=load(), s=F.loSplitTab;
  assert.deepStrictEqual(s('Kabolas Ponim 6:30'), ['Kabolas Ponim','6:30']);
  assert.deepStrictEqual(s('Kabolas Ponim ....... 6:30'), ['Kabolas Ponim','6:30']);
  assert.deepStrictEqual(s('Chupah 7:00 PM'), ['Chupah','7:00 PM']);
  assert.deepStrictEqual(s('קבלת פנים ....... 6:30'), ['קבלת פנים','6:30']);
  assert.deepStrictEqual(s('קבלת פנים 5:30'), ['קבלת פנים','5:30']);
  assert.deepStrictEqual(s('Seudah - Main Hall'), ['Seudah','Main Hall']);
  assert.deepStrictEqual(s('Kiddush'), ['Kiddush','']);
  assert.strictEqual(F.LO_SEP, '\u2028');
});
test('v20261103g: layout is built on the card itself (same in preview, downloads and the drawn copy)', ()=>{
  const c=rd('core.js'), css=rd('card.css');
  assert.match(c, /try \{ loBuild\(inner\); \} catch/); assert.match(c, /loMeasure\(card\);   \/\/ v20261103g/);
  assert.ok(c.includes("loTabRow") && c.includes("loArc") && c.includes("loGuard"));
  // letters of a curve are placed in % and rotated, so the bigger download copies scale with the card
  assert.ok(/style\.left = .*\+ '%'/.test(c) && /rotate\(' \+/.test(c));
  const i=css.indexOf('/* ===== v20261103g'); assert.ok(i>0); const mine=css.slice(i);
  for (const r of ['fc-e','fc-ld','fc-tl','fc-tv','fc-col','fc-g','fc-h','fc-sp','.fc-row','.lo-fit','.lo-arc','.lo-tab','.lo-cols','.lo-div']) assert.ok(mine.includes(r), r);
  assert.ok(!mine.includes('.fc-tr'), 'fc-tr is the corner ornament class');
  assert.ok(/fc-h \{ visibility: hidden; \}/.test(mine) && /fc-g \{[^}]*visibility: visible/.test(mine));
});
test('v20261103g: the line panel has a small Layout button that opens the choices (EN / LK / Yiddish)', ()=>{
  const p=rd('partedit.js');
  assert.ok(p.includes('id="peLoBtn"') && p.includes('id="peLo" hidden'));
  for (const v of ['data-lo=""','data-lo="fit"','data-lo="tab"','data-lo="arc"','id="peArc"','id="peCm"','id="peCp"','id="peGm"','id="peGp"','id="peDiv"','data-ld="0"']) assert.ok(p.includes(v), v);
  for (const k of ["'Layout'","'Paragraph'","'Copyfit'","'Curve'","'Columns'","'Gap'","'Line between'","'Dots'","'Blank'"]) assert.ok(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+": \\['[^']+', '[^']+'\\]").test(p), k);
  assert.ok(p.includes("loEntries() ? '\\u2028' : ' '"), 'Enter makes a new line inside the part for Tab and columns');
  assert.ok(p.includes('F.plainText'), 'names and words shown without leader dots or curved copies');
  assert.ok(rd('styles.css').includes('.pe-lomodes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr))'));
});
test('v20261103g: the 15 Adobe project designs (#13 the broken blue plate)', ()=>{
  const F=load(); const ks=Object.keys(F.DESIGNS).filter(k=>/^ai16adobe/.test(k)); assert.strictEqual(ks.length,15);
  const dl=rd('download.js'); const hd=dl.match(/HD_SET = \{\};\n  '([^']+)'\.split/)[1].split(' ');
  for(const k of ks){ const d=F.DESIGNS[k];
    assert.ok(d.nb && d.isNew && d.ai && d.kind==='img' && d.src==='adobe' && d.note==='AI art · Adobe Firefly', k);
    assert.ok(/^ai\/ap-/.test(d.file) && d.thumb==='ai/p/'+d.file.slice(3), k);
    assert.ok(Array.isArray(d.pad) && d.pad.length===4 && d.bsd<d.pad[0], k);
    const b=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.deepStrictEqual(webpSize(b),[1000,1500], d.file); assert.ok(b.includes('c2pa'), d.file);
    assert.deepStrictEqual(webpSize(fs.readFileSync(S+'/img/'+d.thumb+'.webp')),[400,600], d.thumb);
    const h=fs.readFileSync(S+'/img/ai/hd/'+d.file.slice(3)+'.webp'); assert.deepStrictEqual(webpSize(h),[1600,2400]); assert.ok(h.length<700000);
    assert.ok(hd.includes(d.file.slice(3)), 'hd download '+k);
    assert.ok(!/magen|moon|cross|crescent/i.test(d.name), d.name);
  }
  const plate=ks.find(k=>/brokenblueplate/.test(k)); assert.ok(plate && F.DESIGNS[plate].types.includes('tenoyim'));
  assert.strictEqual(Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain).length, 501);
});
test('v20261103g: version everywhere', ()=>{
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103f'), f); assert.ok(h.includes('?v=20261103g'), f); }
  assert.match(rd('download.js'),/var VERSION = '20261103g';/); assert.match(rd('core.js'),/var TILE_V = 'v20261103g'/);
});
