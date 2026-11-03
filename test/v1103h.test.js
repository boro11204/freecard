// v20261103h: Benz's headline fonts as the default for the main words (Benz Nov 3, 2:29 PM: "find fonts like these, for my cards. the main words should default in such fonts."; 2:38 PM: "3 and 4")
// and the live site switched to redesign A (2:39 PM: "also i choose full site redesign a. but dont put the whole collection on the main page.")
const test=require('node:test'), assert=require('assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(path.join(S,f),'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
const FILES={notocondblack:['NotoSerifHebrewCondBlack-hebrew','NotoSerifHebrewCondBlack-latin'], notoblack:['NotoSerifHebrewBlack-hebrew','NotoSerifHebrewBlack-latin']};

test('v20261103h: Noto Serif Black Condensed and Noto Serif Black are fonts of the site (files, @font-face, card rules, list, license)', ()=>{
  const F=load(), css=rd('fonts.css'), card=rd('card.css'), mk=rd('make.js'), lp=rd('fonts/licenses/index.html');
  assert.strictEqual(F.FONTS.notocondblack.name,'Noto Serif Black Condensed'); assert.strictEqual(F.FONTS.notoblack.name,'Noto Serif Black');
  assert.strictEqual(F.DEF_TITLE,'notocondblack'); assert.strictEqual(F.DEF_NAMES,'notoblack');
  for(const k of Object.keys(FILES)){ const f=F.FONTS[k]; assert.ok(f.he && f.family && f.weight===900 && !f.yi, k);
    for(const file of FILES[k]){ const b=fs.readFileSync(S+'/fonts/'+file+'.woff2'); assert.strictEqual(b.toString('ascii',0,4),'wOF2'); assert.ok(b.length<40000);
      assert.ok(css.includes("src: url(fonts/"+file+".woff2) format('woff2')"), file); }
    const faces=css.split('@font-face').filter(r=>r.includes("font-family: '"+f.family+"';")); assert.strictEqual(faces.length,2,k);
    faces.forEach(r=>assert.match(r,/font-weight: 100 900;/));
    assert.ok(card.includes('.fc-card.f-'+k+' {') && card.includes('.fc-card.nf-'+k+' {'), k+' card rules');
    assert.ok(lp.includes(f.name), 'license page lists '+k); }
  assert.match(mk, /\['Elegant & headline', \['notocondblack', 'notoblack',/);
  assert.match(lp, /OFL-1\.1\.txt/); assert.ok(fs.existsSync(S+'/fonts/licenses/OFL-1.1.txt'));
});

test('v20261103h: by default the big titles use Noto Serif Black Condensed and the names Noto Serif Black; chosen fonts are kept', ()=>{
  const core=rd('core.js'), card=rd('card.css');
  assert.match(core, /nkey = FONTS\[c\.nf\] \? c\.nf : \(fkey === 'script' \? DEF_NAMES : fkey\)/);
  assert.match(core, /\(fkey === 'script' \? ' hdf' : ''\)/);
  assert.match(card, /\.fc-card\.hdf \.fc-in \.fc-head, \.fc-card\.hdf \.fc-in \.fc-title, \.fc-card\.hdf \.fc-in \.fc-type, \.fc-card\.hdf \.fc-in \.fc-foot \{ font-family: 'Noto Serif Hebrew Condensed Black'/);
  // a line's own font and a part's font still win (their rules are !important)
  assert.match(card, /\.pe-f\.pe-f[^{]*\{ font-family: var\(--ef\) !important/); assert.match(card, /\.fc-card\.tfs \.sec-top[^{]*\{ font-family: var\(--sft\) !important/);
});

test('v20261103h: in a real browser the default card, a chosen lettering and a chosen names font', async (t)=>{
  let pw; try { pw=require('/home/user/node_modules/playwright-core'); } catch(e) { t.skip('no browser here'); return; }
  const b=await pw.chromium.launch({args:['--no-sandbox']}); const p=await b.newPage();
  try {
    await p.goto('file://'+S+'/make.html?type=tenoyim&lang=he'); await p.waitForFunction(()=>window.FreeCard && document.querySelector('#card .fc-card'));
    const r=await p.evaluate(()=>{ const F=window.FreeCard, m=document.createElement('div'); document.body.appendChild(m);
      const fam=(c,s)=>{ F.renderCard(c,m,{noFit:true}); const e=m.querySelector(s); return e?getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g,''):''; };
      const base=F.sampleCard('tenoyim',null,'he'), en=F.sampleCard('chasuna',null,'en');
      const custom=Object.assign({},base,{x:'# שמחת תנאים\n[CHOSSON]'});
      return { head:fam(base,'.fc-head'), name:fam(base,'.fc-n'), body:fam(base,'.fc-l.fc-text'), foot:fam(base,'.fc-foot'),
        title:fam(custom,'.fc-title'), enName:fam(en,'.fc-n'),
        frankHead:fam(Object.assign({},base,{f:'frank'}),'.fc-head'), frankName:fam(Object.assign({},base,{f:'frank'}),'.fc-n'),
        nfScript:fam(Object.assign({},base,{nf:'rashi'}),'.fc-n'), tfHead:fam(Object.assign({},base,{tf:'david'}),'.fc-head'),
        decoded:F.expand(F.compact(Object.assign({},base))).f };
    });
    assert.strictEqual(r.head,'Noto Serif Hebrew Condensed Black'); assert.strictEqual(r.foot,'Noto Serif Hebrew Condensed Black');
    assert.strictEqual(r.title,'Noto Serif Hebrew Condensed Black'); assert.strictEqual(r.name,'Noto Serif Hebrew Black'); assert.strictEqual(r.enName,'Noto Serif Hebrew Black');
    assert.strictEqual(r.body,'Frank Ruhl Libre', 'the body lines stay as they were');
    assert.strictEqual(r.frankHead,'Frank Ruhl Libre'); assert.strictEqual(r.frankName,'Frank Ruhl Libre');
    assert.strictEqual(r.nfScript,'Noto Rashi Hebrew'); assert.strictEqual(r.tfHead,'David Libre', 'a font chosen for the top wins'); assert.strictEqual(r.decoded,'script');
  } finally { await b.close(); }
});

test('v20261103h: redesign A is the live look; the home page has simchas and a short row of new designs, the whole collection is on designs.html', ()=>{
  for(const f of ['index.html','make.html','card.html','host.html','designs.html']){ const h=rd(f);
    assert.match(h,/<html lang="en" data-theme="a">/, f); assert.ok(h.includes('theme.css?v=20261103j'), f); }
  const i=rd('index.html'), d=rd('designs.html'), tj=rd('theme.js');
  assert.match(i,/id="gallery" data-mode="featured"/); assert.ok(!/g-chips|g-more"/.test(i), 'no full gallery on home');
  assert.match(i,/href="designs\.html">All designs/); assert.match(i,/href="make\.html\?blank=1">Start from scratch/);
  assert.match(d,/id="gallery" data-mode="all"/); assert.match(d,/class="g-chips"/);
  assert.match(tj,/var FEAT = 8/); assert.match(tj,/each simcha card on the home page shows one of its designs/);
  assert.ok(!/rsvp/i.test(tj+rd('theme.css')), 'the theme adds no RSVP');
});
