const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
const GONE=["ai5gemjerusalemstone", "ai5gemvortpapercut", "ai5gemupsherinhoney", "ai4gembarmitzvahmarble", "ai4gembriscartouche", "ai4gemchasunanavydeco", "ai4gemkiddushlavender", "ai4gemmelavamalkaplum", "ai4gemsefertorahkeser", "ai4gemshevabrachosteal", "ai4gemsiyumburgundy", "ai4gemupsherinchalk", "ai4gemchasunaviolin", "leobris3", "papercut", "kosel", "magen", "velvet"];
const FILES=["ai/g-chanukashabayis-stone", "ai/p/g-chanukashabayis-stone", "ai/g-vort-papercut", "ai/p/g-vort-papercut", "ai/g-upsherin-honey", "ai/p/g-upsherin-honey", "ai/g-barmitzvah-marble", "ai/p/g-barmitzvah-marble", "ai/g-bris-cartouche", "ai/p/g-bris-cartouche", "ai/g-chasuna-navydeco", "ai/p/g-chasuna-navydeco", "ai/g-kiddush-lavender", "ai/p/g-kiddush-lavender", "ai/g-melavamalka-plum", "ai/p/g-melavamalka-plum", "ai/g-sefertorah-keser", "ai/p/g-sefertorah-keser", "ai/g-shevabrachos-teal", "ai/p/g-shevabrachos-teal", "ai/g-siyum-burgundy", "ai/p/g-siyum-burgundy", "ai/g-upsherin-chalk", "ai/p/g-upsherin-chalk", "ai/g-chasuna-violin", "ai/p/g-chasuna-violin", "ai/leo-bris-03", "ai/p/leo-bris-03"];
test('v20261030d: the 18 Star of David designs are removed entirely (no entries, no hidden flag, no pictures, no drawn art)', ()=>{
  const core=rd('core.js');
  assert.ok(!/HIDDEN_DESIGNS|\.hidden\b/.test(core), 'no hidden mechanism left');
  for(const k of GONE) assert.ok(!new RegExp('"'+k+'"').test(core), k+' still named in core.js');
  for(const a of ['magensm','magendeco','embroider']) assert.ok(!core.includes('"'+a+'"') && !core.includes('ART.'+a), 'art '+a);
  assert.ok(!/ART\.kosel\b/.test(core) && !/"papercut":\{"vb"/.test(core));
  for(const f of FILES){ assert.ok(!fs.existsSync(S+'/img/'+f+'.webp'), 'picture deleted '+f); assert.ok(!core.includes(f), 'file named '+f); }
  assert.ok(!/\.hidden/.test(rd('make.js').split('\n')[8]));
  const F=load();
  for(const k of GONE) assert.ok(!F.DESIGNS[k], k+' still in DESIGNS');
  for(const t of Object.keys(F.TYPES)){ const g=F.designsFor(t); assert.ok(g.first.length>=5, t+' still has designs'); assert.ok(F.DESIGNS[F.sampleCard(t).d], t+' default exists'); }
  for(const k of Object.keys(F.DESIGNS)){ const d=F.DESIGNS[k]; if(d.kind==='img' && d.file){ assert.ok(fs.existsSync(S+'/img/'+d.file+'.webp'), d.file); if(d.thumb) assert.ok(fs.existsSync(S+'/img/'+d.thumb+'.webp'), d.thumb); } }
  assert.match(core,/var key = DESIGNS\[c\.d\] \? c\.d : \(designsFor\(TYPES\[c\.t\] \? c\.t : 'chasuna'\)\.first\[0\] \|\| 'gold'\)/);
  assert.match(core,/v20261030d/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/v=20261030c/.test(h),f); assert.match(h,/v=20261030d/,f); }
  assert.match(rd('download.js'),/VERSION = '20261030d'/);
});
