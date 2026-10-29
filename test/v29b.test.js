const test=require('node:test'); const assert=require('node:assert'); const fs=require('fs'); const path=require('path');
const S=path.join(__dirname,'..','site');
test('v20261029b: home page has no design gallery and nothing points at it', ()=>{
  for(const f of fs.readdirSync(S).filter(f=>f.endsWith('.html'))){ const h=fs.readFileSync(path.join(S,f),'utf8');
    assert.ok(!/#designs|designGrid|Designs for every simcha|Tap one to start/.test(h), f);
    assert.ok(/name="viewport" content="width=device-width/.test(h), f+' viewport');
    assert.ok(!/\?v=20261029a/.test(h) && !/\?v=20261029b/.test(h), f+' version');
    for(const m of h.matchAll(/(?:src|href)="([^"#?:]+\.(?:js|css|svg|jpg|webp))/g)) assert.ok(fs.existsSync(path.join(S,m[1])), f+' missing '+m[1]); }
  const i=fs.readFileSync(path.join(S,'index.html'),'utf8');
  assert.match(i,/<title>[^<]+<\/title>/); assert.match(i,/href="#simchas">See all simchas/); assert.match(i,/id="simchas"/);
  assert.match(i,/<footer[^]*ai-credit[^]*Canva and Leonardo\.ai/);
  assert.ok(!/designGrid/.test(fs.readFileSync(path.join(S,'home.js'),'utf8')));
});
test('v20261029b: every picture design has a sharp 400x600 tile picture', ()=>{
  const c=fs.readFileSync(path.join(S,'core.js'),'utf8');
  const thumbs=[...c.matchAll(/"thumb": "(ai\/p\/[^"]+)"/g)].map(m=>m[1]); assert.equal(thumbs.length,58);
  for(const t of thumbs){ const b=fs.readFileSync(path.join(S,'img',t+'.webp')); assert.equal(b.toString('ascii',8,12),'WEBP',t); assert.ok(b.length>3000&&b.length<60000,t); }
  for(const k of ['orchid','jerusalem','torah','tallis','lchaim','bris','girl','kos','upsherin','damask','midnight']) assert.ok(fs.existsSync(path.join(S,'img/p',k+'.webp')),k);
  assert.ok(!fs.existsSync(path.join(S,'img/ai/t')));
  assert.match(c,/opts\.thumb \? \(D\.thumb \|\| 'p\/'/);
});
test('v20261029b: design picker tiles are live mini cards, two to a row on a phone, lazily drawn', ()=>{
  const m=fs.readFileSync(path.join(S,'make.js'),'utf8'), s=fs.readFileSync(path.join(S,'styles.css'),'utf8');
  assert.match(m,/IntersectionObserver/); assert.match(m,/function tileCard/); assert.match(m,/refreshTiles\(\)/); assert.match(m,/'New'/); assert.match(m,/AI art · Leonardo\.ai/);
  assert.match(s,/@media \(max-width: 640px\) \{\n  \.swatches \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
