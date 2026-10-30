const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site');
test('v20261029c: 20 more AI designs (12 Leonardo.ai, 8 Canva) with card pictures and tile pictures', ()=>{
  const core=fs.readFileSync(S+'/core.js','utf8');
  const m=core.match(/var AI3_DESIGNS = (\{.*?\});\n/); assert.ok(m);
  const D=JSON.parse(m[1]); const keys=Object.keys(D); assert.strictEqual(keys.length,20);
  assert.strictEqual(keys.filter(k=>D[k].src==='leo').length,12);
  for(const k of keys){ const d=D[k];
    const f=fs.readFileSync(S+'/img/'+d.file+'.webp'); assert.equal(f.toString('ascii',8,12),'WEBP',k); assert.ok(f.length>30000,k);
    const t=fs.readFileSync(S+'/img/'+d.thumb+'.webp'); assert.equal(t.toString('ascii',8,12),'WEBP',k); assert.ok(t.length>3000&&t.length<60000,k);
    assert.ok(d.ai && d.nb && d.isNew && d.kind==='img' && d.types.length>0, k);
    assert.strictEqual(d.note, d.src==='leo' ? 'AI art · Leonardo.ai' : 'AI art · Canva');
    if(d.src!=='leo') assert.ok(f.includes(Buffer.from('c2pa')), k+' keeps its C2PA manifest');
  }
  assert.strictEqual(new Set(keys.map(k=>D[k].name)).size,20);
  const all=[...core.matchAll(/"name": "([^"]+)", "note": "AI art/g)].map(x=>x[1]); assert.strictEqual(new Set(all).size, all.length, 'AI design names are unique');
});
test('v20261029c: AI designs come before the older drawn designs in every simcha', ()=>{
  const core=fs.readFileSync(S+'/core.js','utf8');
  assert.match(core,/function aiFirst\(list\)/); assert.match(core,/return \{ first: aiFirst\(first\), rest: aiFirst\(rest\) \};/);
  assert.match(core,/if \(DESIGNS\[k\]\.nb\) DESIGNS\[k\]\.nb = false;/);
  const i=fs.readFileSync(S+'/index.html','utf8'); assert.match(i,/<footer[^]*ai-credit[^]*Canva,? (?:and )?Leonardo\.ai/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=fs.readFileSync(S+'/'+f,'utf8'); assert.ok(!/v=20261029b/.test(h),f); assert.match(h,/v=202610(?:29[c-z]|3\d[a-z])/,f); }
});
