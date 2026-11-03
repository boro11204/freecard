// v20261102g: the editor shows only the editing tools beside the card; the words/details/photo open in a drawer; the design strip shows real artwork
const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
test('v20261102g: in the editor only the tools sit beside the card, and the details open in a drawer inside the form', ()=>{
  const h=rd('make.html'), js=rd('make.js'), css=rd('styles.css'), pe=rd('partedit.js'), i18n=rd('i18n.js');
  for(const c of ['p-type','p-design','p-words','p-details','p-photo']) assert.strictEqual((h.match(new RegExp('class="panel '+c+'"','g'))||[]).length,1,c);
  const f0=h.indexOf('<form id="form"'), f1=h.indexOf('</form>'); const dr=h.indexOf('id="edDrawer"'), bt=h.indexOf('id="edDetailsBtn"');
  assert.ok(f0<dr && dr<f1, 'the drawer is inside the form, so every field still belongs to it'); assert.ok(f0<bt && bt<f1);
  assert.match(css,/body\.ed-mode #form > \.panel\.p-details/); assert.match(css,/body\.ed-mode #form > \.panel\.p-design/);
  assert.match(css,/\.ed-dr-body > \.panel \{ display: block/);
  assert.match(js,/function edDrawerOpen\(target\)/); assert.match(js,/function edDrawerClose\(\)/); assert.match(js,/edDrawerClose\(\); document\.body\.classList\.remove\('ed-mode'\)/);
  assert.match(js,/reveal: edReveal/); assert.match(pe,/window\.__fcEd\.reveal\(target\)/);
  for(const s of ['Edit the words & details','The words & details']) assert.ok(i18n.includes(JSON.stringify(s)+': ['), s);
});
test('v20261102g: the design strip tiles load their own picture as soon as they are drawn', ()=>{
  const js=rd('make.js');
  assert.match(js,/var cd = w\.querySelector\('\.fc-card\[data-bg\]'\); if \(cd && !cd\.style\.backgroundImage\) cd\.style\.backgroundImage/);
  assert.match(js,/function edDrawVisible\(\)/); assert.match(js,/row\.addEventListener\('scroll'/);
  const h=rd('make.html'); assert.match(h,/v=2026110(2[g-z]|3[a-z])/);
});
