const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261030c: every Star of David design is hidden from all galleries but still renders old links', ()=>{
  const core=rd('core.js'); const H=JSON.parse(core.match(/var HIDDEN_DESIGNS = (\[.*?\]);\n/)[1]);
  assert.strictEqual(H.length,18);
  for(const k of ['magen','kosel','velvet','papercut','ai4gembriscartouche','ai4gemmelavamalkaplum','ai4gemsefertorahkeser','ai4gemchasunanavydeco','ai4gemshevabrachosteal','ai5gemjerusalemstone','leobris3']) assert.ok(H.includes(k),k);
  for(const k of ['ai5gembrissage','ai5gemkiddushhydrangea']) assert.ok(!H.includes(k), k+' was retouched and stays');
  const F=load();
  for(const k of H){ assert.ok(F.DESIGNS[k] && F.DESIGNS[k].hidden, k+' kept but hidden'); }
  for(const t of Object.keys(F.TYPES)){ const g=F.designsFor(t); const all=g.first.concat(g.rest);
    for(const k of H) assert.ok(!all.includes(k), k+' listed under '+t);
    assert.ok(g.first.length>=5, t+' still has designs'); assert.ok(!F.DESIGNS[F.sampleCard(t).d].hidden, t+' default not hidden'); }
  for(const k of H){ const f=F.DESIGNS[k].file; if(f) assert.ok(fs.existsSync(S+'/img/'+f+'.webp'), 'image kept '+f); }
  assert.match(rd('make.js'), /!F\.DESIGNS\[params\.get\('design'\)\]\.hidden/);
});
test('v20261030c: per-line font menu has a Font label and a clear default in EN/LK/Yiddish', ()=>{
  const pe=rd('partedit.js');
  assert.match(pe,/<span class="pe-flab">Font<\/span><select id="peFont"/);
  assert.match(pe,/<option value="">Same as card<\/option>/);
  assert.ok(!/<option value="">Same as now<\/option>/.test(pe));
  assert.match(pe,/'Same as card': \['כמו בהזמנה', 'ווי אויפן קארטל'\]/);
  assert.match(rd('styles.css'),/\.pe-flab \{/);
  assert.match(rd('core.js'),/v20261030c/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/v=20261030b/.test(h),f); assert.match(h,/v=20261030c/,f); }
  assert.match(rd('download.js'),/VERSION = '20261030c'/);
});
