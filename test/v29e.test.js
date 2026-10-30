const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site');
const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
test('v20261029e: on-screen keyboard (English + Hebrew) is loaded on the card maker', ()=>{
  const m=rd('make.html'), k=rd('vkb.js'), c=rd('styles.css');
  assert.match(m,/<script src="vkb\.js\?v=20261029[e-z]"><\/script>/);
  assert.ok(m.indexOf('partedit.js')<m.indexOf('vkb.js'), 'after the part editor so its text box gets the keyboard too');
  assert.ok(!/id="kb"/.test(m), 'old bottom-only Hebrew keyboard removed');
  assert.ok(!/kbOpen|KB_ROWS/.test(rd('make.js')));
  // Israeli layout rows exactly as asked
  assert.ok(k.includes("['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ']"));
  assert.ok(k.includes("['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף']"));
  assert.ok(k.includes("['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ']"));
  assert.ok(k.includes("['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']"));
  for(const p of ["'.'","','","'?'","'!'","'-'","':'","';'","'\"'","\"'\"","'@'"]) assert.ok(k.includes(p), 'punctuation '+p);
  assert.match(k,/'1', '2', '3', '4', '5', '6', '7', '8', '9', '0'/);
  assert.match(k,/setAttribute\('inputmode', 'none'\)/); assert.match(k,/removeAttribute\('inputmode'\)/);
  assert.match(k,/new InputEvent\('input'/); assert.match(k,/vkbX/); assert.match(k,/vkbGrip/); assert.match(k,/'shift'/);
  assert.ok(!/https?:\/\//.test(k), 'no outside libraries');
  assert.match(c,/\.vkb \{/); assert.match(c,/\.vkb-ico \{/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/v=20261029d/.test(h),f); assert.match(h,/v=20261029[e-z]/,f); }
  assert.match(rd('download.js'),/VERSION = '20261029[e-z]'/);
  assert.match(rd('index.html'),/<footer[^]*ai-credit[^]*Canva and Leonardo\.ai/);
});
test('v20261029e: every text box on the card maker can get the keyboard', ()=>{
  const m=rd('make.html');
  const ids=[...m.matchAll(/<(input|textarea) id="(f-[a-z0-9]+)"([^>]*)>/g)].filter(x=>x[1]==='textarea'||!/type="(date|time|number|file|checkbox|color)"/.test(x[3])).map(x=>x[2]);
  for(const id of ['f-x','f-h','f-n1','f-n2','f-p1','f-p2','f-hd','f-sc','f-hl','f-ad','f-ex','f-nt','f-pw']) assert.ok(ids.includes(id), id);
  assert.match(rd('vkb.js'),/getElementById\('form'\), d\.getElementById\('peSheet'\)/);
});
