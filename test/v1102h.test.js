// v20261102h: design tiles are real <img> pictures (cache-busted, with the full picture as fallback); every part of the card
// can be retyped or deleted (מזל טוב, בס״ד, fixed titles); the "Tap any line" hint is big; the Star of David damask design is gone
const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261102h: the Black Damask & Gold Candelabras design (Stars of David in its damask) is removed entirely', ()=>{
  const core=rd('core.js'); assert.ok(!/candelabras/i.test(core), 'no entry, order or cross-listing left');
  assert.ok(!fs.existsSync(S+'/img/ai/c11-chasuna-candelabras.webp') && !fs.existsSync(S+'/img/ai/p/c11-chasuna-candelabras.webp'), 'pictures deleted');
  const F=load(); assert.ok(!Object.keys(F.DESIGNS).some(k=>/candelabra/.test(k)));
  for(const k of Object.keys(F.DESIGNS)){ const d=F.DESIGNS[k]; if(d.kind!=='img') continue; const f=d.file||k; assert.ok(fs.existsSync(S+'/img/'+f+'.webp'), f); const t=d.thumb||('p/'+f); assert.ok(fs.existsSync(S+'/img/'+t+'.webp'), t); }
});
test('v20261102h: picker tiles draw their picture as an <img> with explicit size, a version on the address and a full-picture fallback', ()=>{
  const core=rd('core.js'), css=rd('card.css');
  assert.match(core,/function tileImg\(card, src, full\)/); assert.match(core,/if \(opts\.thumb\) tileImg\(card, src, 'img\/' \+ \(D\.file \|\| key\) \+ '\.webp'\)/);
  assert.match(core,/im\.width = 400; im\.height = 600;/); assert.match(core,/im\.src = src \+ '\?v=' \+ TILE_V/); assert.match(core,/im\.src = full \+ '\?v=' \+ TILE_V/);
  assert.match(core,/var TILE_V = 'v20261102h'/);
  assert.ok(!/opts\.thumb && lazyBg\(card, src\)/.test(core), 'tiles no longer wait on a CSS background');
  assert.match(css,/\.fc-card > img\.fc-tbg \{ position: absolute;[^}]*width: 100%; height: 100%;[^}]*z-index: -1;/); assert.match(css,/\.fc-card\.has-tbg \{ isolation: isolate; \}/);
});
test('v20261102h: every part can be retyped or deleted, and a deleted part stays deleted (stored with the part edits)', ()=>{
  const F=load(); const o=F.peClean({t:''}); assert.strictEqual(o.t,''); assert.ok(!F.peIsEmpty(o), 'a deletion is a real edit');
  assert.strictEqual(F.peClean({t:'Mazel Tov!'}).t,'Mazel Tov!'); assert.strictEqual(F.peClean({t:'x'.repeat(900)}).t.length,400);
  const core=rd('core.js'), pe=rd('partedit.js'), css=rd('card.css');
  assert.match(core,/\['fc-bsd', 'bsd'\]\]/, 'בס״ד is a tappable part');
  assert.match(core,/if \(o\.t === ''\) cl\.add\('pe-gone'\); else \{ e\.textContent = o\.t;/); assert.match(css,/\.fc-card \.pe-gone \{ display: none !important; \}/);
  assert.match(pe,/id="peDel"/); assert.match(pe,/function delLine\(\)/); assert.match(pe,/if \(src\.type === 'none'\) change\(function \(o\) \{ o\.t = ''; \}\)/);
  assert.match(pe,/'Delete this line': \['מחיקת השורה', 'אויסמעקן די שורה'\]/);
  assert.match(pe,/if \(src && src\.type === 'none'\) \{ var v = ev\.target\.value/, 'fixed words are typed over right in the panel');
});
test('v20261102h: the "Tap any line" hint is big and bold, version 20261102h everywhere', ()=>{
  const css=rd('styles.css'); assert.match(css,/\.pe-tip \{ font-size: 1\.2rem; font-weight: 700;/); assert.match(css,/body\.ed-mode \.ed-tip \{ font-size: 1\.15rem; font-weight: 700;/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261102g'), f); assert.ok(h.includes('?v=20261102h'), f); }
  assert.match(rd('download.js'),/var VERSION = '20261102h';/);
  assert.match(rd('_worker.js'),/parts\[1\] === 'tilelog'/);
});
