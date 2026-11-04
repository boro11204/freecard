// v20261103i: add a line exactly where you want it (Benz Nov 3, 2026: "whenever I click add a line on a free card it always adds
// in the same place I want to be able to choose where I want to add the new line")
const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
const RAWS=['# שמחת תנאים','[CHOSSON] נ״י','עב״ג הכלה','[KALLAH] תחי׳','','[ADDRESS]'];
test('v20261103i: insert a line above / below any line; the edits of the other lines follow their own words', ()=>{
  const F=load();
  const ed={ 'L1':{f:'notoblack',r:'[CHOSSON] נ״י'}, 'L3':{c:'#a8802c',r:'[KALLAH] תחי׳'}, 'h':{t:'x'}, 'inv/L1':{z:120,r:'y'} };
  let r=F.lineInsert(RAWS,1,0,'[LINE]'); assert.strictEqual(r.at,1); assert.deepStrictEqual(r.raws.slice(0,3),['# שמחת תנאים','[LINE]','[CHOSSON] נ״י']);
  let e=F.peRelayout(ed,'',RAWS,r.raws,r.map,{1:{f:'notoblack',kd:'n'}});
  assert.deepStrictEqual(e.L2,{f:'notoblack',r:'[CHOSSON] נ״י'}); assert.deepStrictEqual(e.L4,{c:'#a8802c',r:'[KALLAH] תחי׳'});
  assert.deepStrictEqual(e.L1,{f:'notoblack',kd:'n',r:'[LINE]'}, 'the new line takes the look of its neighbour');
  assert.deepStrictEqual(e.h,{t:'x'}); assert.deepStrictEqual(e['inv/L1'],{z:120,r:'y'}, 'other parts and pieces untouched');
  r=F.lineInsert(RAWS,3,1,'[LINE]'); assert.strictEqual(r.at,4); assert.strictEqual(r.raws[4],'[LINE]'); assert.strictEqual(r.raws[3],'[KALLAH] תחי׳'); assert.strictEqual(r.raws.length,RAWS.length+1);
  e=F.peRelayout(ed,'',RAWS,r.raws,r.map); assert.ok(e.L1 && e.L3 && !e.L4, 'lines above the new one keep their numbers');
  r=F.lineInsert(RAWS,99,1); assert.strictEqual(r.at,RAWS.length, 'no such line: at the end');
});
test('v20261103i: move a line up / down (past empty lines) and delete a line; edits move with it', ()=>{
  const F=load(); const ed={ 'L3':{c:'#a8802c',r:'[KALLAH] תחי׳'}, 'L5':{b:'1',r:'[ADDRESS]'} };
  let r=F.lineMove(RAWS,3,-1); assert.strictEqual(r.at,2); assert.deepStrictEqual(r.raws.slice(2,4),['[KALLAH] תחי׳','עב״ג הכלה']);
  let e=F.peRelayout(ed,'',RAWS,r.raws,r.map); assert.deepStrictEqual(e.L2,{c:'#a8802c',r:'[KALLAH] תחי׳'}); assert.ok(!e.L3);
  r=F.lineMove(RAWS,5,-1); assert.strictEqual(r.at,3, 'skips the empty spacer line'); assert.strictEqual(r.raws[3],'[ADDRESS]');
  e=F.peRelayout(ed,'',RAWS,r.raws,r.map); assert.deepStrictEqual(e.L3,{b:'1',r:'[ADDRESS]'}); assert.deepStrictEqual(e.L5,{c:'#a8802c',r:'[KALLAH] תחי׳'});
  assert.strictEqual(F.lineMove(RAWS,0,-1),null); assert.strictEqual(F.lineMove(RAWS,5,1),null);
  r=F.lineRemove(RAWS,2); assert.strictEqual(r.raws.length,RAWS.length-1); e=F.peRelayout(ed,'',RAWS,r.raws,r.map);
  assert.deepStrictEqual(e.L2,{c:'#a8802c',r:'[KALLAH] תחי׳'}); assert.deepStrictEqual(e.L4,{b:'1',r:'[ADDRESS]'});
  // a piece of the matching set keeps its own scope
  const pe={'inv/L0':{f:'notoblack',r:'a'}, 'L0':{f:'suez',r:'# שמחת תנאים'}}; r=F.lineInsert(['a','b'],0,0);
  e=F.peRelayout(pe,'inv/',['a','b'],r.raws,r.map); assert.deepStrictEqual(e['inv/L1'],{f:'notoblack',r:'a'}); assert.deepStrictEqual(e.L0,pe.L0);
});
test('v20261103i: a line added next to a names line keeps the names look (kd), and it is kept with the card', ()=>{
  const F=load(); assert.strictEqual(F.peClean({kd:'n'}).kd,'n'); assert.ok(!('kd' in F.peClean({kd:'x'}))); assert.ok(!F.peIsEmpty({kd:'n'}));
  const core=rd('core.js');
  assert.match(core,/if \(kdn && ln\.kind === 'blank'\) \{ le = el\('div', 'fc-l fc-blank fc-n'/); assert.match(core,/if \(kdn && \(ln\.kind === 'text' \|\| ln\.kind === 'pre'\)\) \{ le = el\('div', 'fc-n', ln\.text\)/);
  const mk=rd('make.js'); assert.match(mk,/return \{ raw: title \? '# \[LINE\]' : '\[LINE\]', edits: o \};/, 'a title stays a title');
  assert.match(mk,/\['f', 'z', 'c', 'b', 'a', 'l', 'kd'\]\.forEach/, 'font, size, colour, bold, align, spacing are copied');
});
test('v20261103i: + Add line goes right under the selected line (tapped on the card or picked in the list), else at the end', ()=>{
  const mk=rd('make.js'), pe=rd('partedit.js');
  assert.match(mk,/function addLine\(\) \{\n    var n = selIdx\(\);\n    if \(n == null\) \{ \/\/ nothing selected: at the end, as before/);
  assert.match(mk,/afterLines\(insertLine\(n, 1\), true\);/);
  assert.match(pe,/if \(api\.selectLine\) api\.selectLine\(e\.hasAttribute\('data-pl'\) \? parseInt\(e\.getAttribute\('data-pl'\), 10\) : null\);/, 'tapping a line on the card selects it');
  assert.match(pe,/box\.classList\.toggle\('pe-soft', sheet\.hidden\);/, 'it stays outlined after Done');
  assert.match(rd('styles.css'),/\.pe-box\.pe-soft \{ border-style: dashed;/);
  assert.match(mk,/selectLine: selectLine, selLine: selIdx/);
});
test('v20261103i: the Words list has + above, + below, move up / down and delete on every line, translated', ()=>{
  const mk=rd('make.js'), css=rd('styles.css');
  for(const c of ['ll-ab','ll-bl','ll-up','ll-dn','ll-del']) assert.ok(mk.includes("llBtn('"+c+"'"), c);
  assert.match(mk,/lineList\.id = 'lineList'/); assert.match(mk,/'Add a line above': \['הוספת שורה מעל'/); assert.match(mk,/'Move down': \['הזזה למטה'/);
  assert.match(mk,/if \(!force && \(llTyping \|\| \(a && lineList\.contains\(a\) && a\.tagName === 'INPUT'\)\)\) \{ markList\(\); return; \}/, 'typing in a row keeps its box');
  assert.match(css,/\.ll-row\.on \{ border-color: #c8962e;/); assert.match(css,/@media \(max-width: 520px\) \{ \.ll-row \.ll-t \{ flex-basis: 100%; \}/);
  for(const f of ['index.html','make.html','card.html','host.html','designs.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103h') && h.includes('?v=20261103k'), f); }
  assert.match(rd('download.js'),/var VERSION = '20261103[i-z]';/);
});
