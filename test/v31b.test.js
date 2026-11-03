const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
const GONE={"ai6gemchasunaivorymirror": ["ai/g6-chasuna-ivorymirror", "ai/p/g6-chasuna-ivorymirror"], "ai6gemchasunablackrococo": ["ai/g6-chasuna-blackrococo", "ai/p/g6-chasuna-blackrococo"], "ai6gemchasunamoodyflorals": ["ai/g6-chasuna-moodyflorals", "ai/p/g6-chasuna-moodyflorals"], "ai6gemvortpressedflowers": ["ai/g6-vort-pressedflowers", "ai/p/g6-vort-pressedflowers"], "ai6gemvortchocolategilt": ["ai/g6-vort-chocolategilt", "ai/p/g6-vort-chocolategilt"], "ai6gemshevabrachosemerald": ["ai/g6-shevabrachos-emerald", "ai/p/g6-shevabrachos-emerald"], "ai6gemshevabrachoseucalyptus": ["ai/g6-shevabrachos-eucalyptus", "ai/p/g6-shevabrachos-eucalyptus"], "ai6gembarmitzvahnavycartouche": ["ai/g6-barmitzvah-navycartouche", "ai/p/g6-barmitzvah-navycartouche"], "ai6gembarmitzvahparchment": ["ai/g6-barmitzvah-parchment", "ai/p/g6-barmitzvah-parchment"], "ai6gembrisskyrococo": ["ai/g6-bris-skyrococo", "ai/p/g6-bris-skyrococo"], "ai6gembristeddy": ["ai/g6-bris-teddy", "ai/p/g6-bris-teddy"], "ai6gemkiddushblushroses": ["ai/g6-kiddush-blushroses", "ai/p/g6-kiddush-blushroses"], "ai6gemupsherincircus": ["ai/g6-upsherin-circus", "ai/p/g6-upsherin-circus"], "ai6gemupsherinballoons": ["ai/g6-upsherin-balloons", "ai/p/g6-upsherin-balloons"], "ai5gempidyonemerald": ["ai/g-pidyonhaben-emerald", "ai/p/g-pidyonhaben-emerald"], "ai5gembrissage": ["ai/g-bris-sage", "ai/p/g-bris-sage"], "ai5gemkiddushhydrangea": ["ai/g-kiddush-hydrangea", "ai/p/g-kiddush-hydrangea"]};
test('v20261031b: every Google Gemini design is removed entirely (entries, pictures), old links fall back, credit names Canva and Leonardo.ai', ()=>{
  const core=rd('core.js');
  assert.ok(!/"src": "gem"/.test(core) && !/"note": "AI art · Google Gemini"/.test(core));
  for(const [k,files] of Object.entries(GONE)){ assert.ok(!core.includes('"'+k+'"'), k); for(const f of files){ assert.ok(!fs.existsSync(S+'/img/'+f+'.webp'), f); assert.ok(!core.includes('"'+f+'"'), f); } }
  for(const f of fs.readdirSync(S+'/img/ai')) if(f.endsWith('.webp')) assert.ok(!fs.readFileSync(S+'/img/ai/'+f).includes('Google'), 'Google credentials in '+f);
  const F=load();
  for(const k of Object.keys(GONE)) assert.ok(!F.DESIGNS[k], k);
  for(const t of Object.keys(F.TYPES)){ const g=F.designsFor(t); assert.ok(g.first.length>=5, t); const d=F.sampleCard(t).d; assert.ok(F.DESIGNS[d], t);
    assert.ok(!['ai3leobris04','ai4leoupsherinballoons'].includes(d), t+' opens with a starry design'); }
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/Google Gemini/.test(h), f); }
  assert.match(rd('index.html'),/Some background art AI-generated with Canva(,| and) Leonardo\.ai/);
});
