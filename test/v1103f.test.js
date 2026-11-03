// v20261103f: 20 Yiddish/Hebrew invitation fonts, the compact font list, + Add line, Clear all text, Start from scratch, plain backgrounds
// (Benz Nov 2, 11:10 PM: "add all 20 fonts. maybe the box for the font shouldnt be so big … but i want full selection."; 11:11 PM: "also add an option if i want to add a full line on a invitation, also add the option for a full custom one.")
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
const NEW={"shlomostam": ["ShlomoStam"], "stamashk": ["StamAshkenazCLM"], "taameyashk": ["TaameyAshkenaz-Medium", "TaameyAshkenaz-Bold"], "keteryg": ["KeterYG-Medium", "KeterYG-Bold"], "mekorot": ["Mekorot-Vilna", "Mekorot-Vilna-Bold"], "rommvilna": ["RommVilna-Regular", "RommVilna-Heading"], "shlomosemi": ["ShlomoSemiStam"], "keteraram": ["KeterAramTsova"], "ezra": ["SILEOT"], "taameyfrank": ["TaameyFrankCLM-Medium", "TaameyFrankCLM-Bold"], "drugulin": ["DrugulinCLM-Bold"], "nesher": ["NesherGadol"], "yehoash": ["E-Yehoash-Esther"], "hadasim": ["HadasimCLM-Regular", "HadasimCLM-Bold"], "shofar": ["ShofarRegular", "ShofarDemi-Bold"], "dorian": ["DorianCLM-Book"], "gan": ["GanCLM-Bold"], "gladia": ["GladiaCLM-Bold"], "lulav": ["LulavCLM"], "shmulik": ["ShmulikCLM"]};
test('v20261103f: the 20 new fonts are on the site, each with its files, @font-face rules, card rules and license', ()=>{
  const F=load(), css=rd('fonts.css'), card=rd('card.css');
  const yi=Object.keys(F.FONTS).filter(k=>F.FONTS[k].yi); assert.deepStrictEqual(yi.sort(), Object.keys(NEW).sort()); assert.strictEqual(yi.length,20);
  for(const k of yi){ const f=F.FONTS[k]; assert.ok(f.name && f.he && f.family && f.isNew, k);
    for(const file of NEW[k]){ const p=S+'/fonts/'+file+'.woff2'; assert.ok(fs.existsSync(p), file); const b=fs.readFileSync(p); assert.strictEqual(b.toString('ascii',0,4),'wOF2', file); assert.ok(b.length<40000, file);
      assert.ok(css.includes("src: url(fonts/"+file+".woff2) format('woff2')"), 'font-face '+file); }
    const faces=css.split('@font-face').filter(r=>r.includes("font-family: '"+f.family+"';"));
    assert.strictEqual(faces.length, NEW[k].length, k+' faces'); faces.forEach(r=>{ assert.match(r,/font-display: swap/); assert.match(r,/font-weight: \d+ \d+;/); });
    assert.ok(card.includes('.fc-card.f-'+k+' {') && card.includes('.fc-card.nf-'+k+' {'), k+' card rules'); }
  for(const l of ['OFL-1.1.txt','GPL-2.0.txt','Culmus-LICENSE.txt','Mekorot-Vilna-LICENSE.txt','README.txt','index.html']) assert.ok(fs.existsSync(S+'/fonts/licenses/'+l), l);
  const lp=rd('fonts/licenses/index.html'); for(const k of yi) assert.ok(lp.includes(F.FONTS[k].name), 'license page lists '+k);
  assert.ok(rd('index.html').includes('href="fonts/licenses/"'), 'footer links the font licenses');
  // the new fonts are not fetched in the background: only when shown
  assert.match(rd('make.js'), /function preloadAll\(\) \{ FONT_KEYS\.filter\(function \(k\) \{ return !F\.FONTS\[k\]\.yi; \}\)/);
});
test('v20261103f: letters a font lacks are drawn as plain letters on the card only', ()=>{
  const F=load();
  for(const k of ['stamashk','gan','gladia','lulav','nesher']) assert.ok(/l/.test(F.FONTS[k].fix), k+' splits װ ױ ײ');
  for(const k of ['gan','gladia','lulav','nesher','yehoash']) assert.ok(/n/.test(F.FONTS[k].fix), k+' has no vowel marks');
  assert.strictEqual(F.fixText('װ ױ ײ ײַ', 'l'), 'וו וי יי ייַ');
  assert.strictEqual(F.fixText('\uFB1F \uFB2E \uFB4E', 'dl'), 'יי\u05B7 א\u05B7 פ\u05BF');
  assert.strictEqual(F.fixText('בְּשָׁעָה טוֹבָה ײַ', 'dln'), 'בשעה טובה יי');
  assert.strictEqual(F.fixText('בס״ד ר׳', 'p'), 'בס"ד ר\'');
  for(const k of ['shlomostam','taameyashk','ezra','hadasim']) assert.ok(!F.FONTS[k].fix, k+' needs nothing');
  const core=rd('core.js'); assert.match(core, /mount\.appendChild\(card\);\n    try \{ fixCard\(card, c\); \} catch/); // after the card is on the page; the saved words are not touched
});
test('v20261103f: one compact font list with every font, grouped, the new ones first', ()=>{
  const html=rd('make.html'), mk=rd('make.js'), fp=rd('fontpick.js');
  assert.ok(html.includes('<select id="f-f" class="font-main" aria-label="Lettering"></select>') && !html.includes('id="fontGrid"'));
  assert.ok(html.indexOf('fontpick.js?v=20261103g') > html.indexOf('partedit.js?v=20261103g'), 'fontpick after partedit');
  const F=load(); const m=mk.match(/var FONT_GROUPS = (\[[\s\S]*?\n  \]);/); assert.ok(m); const G=eval(m[1]);
  assert.strictEqual(G[0][0],'Yiddish & sofer classics'); assert.deepStrictEqual(G[0][1].slice(0,5),['shlomostam','stamashk','taameyashk','keteryg','mekorot']);
  const all=[].concat(...G.map(g=>g[1])); assert.strictEqual(new Set(all).size, all.length, 'no font twice');
  assert.deepStrictEqual(all.slice().sort(), Object.keys(F.FONTS).sort(), 'every font in the list'); assert.ok(all.length>=53);
  for(const id of ['f-f','f-tf','f-nf','f-bf','peFont']) assert.ok(fp.includes("'"+id+"'"), id+' gets the list');
  assert.match(fp, /IntersectionObserver/); assert.match(fp, /fp-sheet/); assert.match(fp, /ArrowDown/);
  assert.match(rd('styles.css'), /\.fp-pop\.fp-sheet \{[^}]*max-height: min\(52vh/);
});
test('v20261103f: + Add line, Clear all text, Start from scratch, plain backgrounds', ()=>{
  const html=rd('make.html'), mk=rd('make.js'), pe=rd('partedit.js'), F=load();
  for(const id of ['addLine','addLine2','clearText','startBlank','plainDots']) assert.ok(html.includes('id="'+id+'"'), id);
  assert.ok(rd('index.html').includes('href="make.html?blank=1"'), 'home page: start from scratch');
  const c=F.sampleCard('chasuna', null, 'yi'); c.x='# [LINE]\nמזל טוב\n[LINE]';
  const L=F.buildLines(c); assert.deepStrictEqual(L.map(l=>l.kind), ['blank','text','blank']); assert.ok(L[0].title);
  assert.match(pe, /\/\^\(#\\s\+\)\?\\s\*\\\[LINE\\\]\\s\*\$\/i\.test\(raw\) \? '' :/, 'an empty line shows an empty words box');
  assert.match(mk, /raws\.push\('\[LINE\]'\)/); assert.match(mk, /var BLANK_TPL = '# \[LINE\]\\n\[LINE\]\\n\[LINE\]\\n\[LINE\]'/);
  assert.match(mk, /fcx-ov fc-blank-hint/, 'the "Tap to write" marks sit beside the card, not in it');
  assert.strictEqual(F.PLAIN.length, 5); for(const p of F.PLAIN){ const d=F.DESIGNS[p[0]]; assert.ok(d && d.plain && d.kind==='plain' && d.types.length===0, p[0]); }
  for(const t of ['chasuna','bris','kiddush']){ const g=F.designsFor(t); assert.ok(!g.first.concat(g.rest).some(k=>F.DESIGNS[k].plain), t+': plain colours only in their own row'); }
  assert.strictEqual(Object.keys(F.DESIGNS).filter(k=>!F.DESIGNS[k].plain).length, 501);
});
test('v20261103f: version everywhere', ()=>{
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!h.includes('?v=20261103e'), f); assert.ok(!h.includes('?v=20261103f') && h.includes('?v=20261103g'), f); }  // v20261103g: bumped again
  assert.match(rd('download.js'),/var VERSION = '20261103g';/); assert.match(rd('core.js'),/var TILE_V = 'v20261103g'/);
});
