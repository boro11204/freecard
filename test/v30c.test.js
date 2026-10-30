const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
function load(){ global.window=global; global.document={createElement:()=>({style:{},classList:{add(){}},appendChild(){},setAttribute(){}})}; delete require.cache[require.resolve(S+'/core.js')]; require(S+'/core.js'); return window.FreeCard; }
test('v20261030c: per-line font menu has a Font label and a clear default in EN/LK/Yiddish', ()=>{
  const pe=rd('partedit.js');
  assert.match(pe,/<span class="pe-flab">Font<\/span><select id="peFont"/);
  assert.match(pe,/<option value="">Same as card<\/option>/);
  assert.ok(!/<option value="">Same as now<\/option>/.test(pe));
  assert.match(pe,/'Same as card': \['כמו בהזמנה', 'ווי אויפן קארטל'\]/);
  assert.match(rd('styles.css'),/\.pe-flab \{/);
  assert.match(rd('core.js'),/v20261030c/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/v=20261030b/.test(h),f); assert.match(h,/v=20261030[c-z]/,f); }
  assert.match(rd('download.js'),/VERSION = '20261030[c-z]'/);
});
