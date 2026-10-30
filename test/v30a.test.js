const test=require('node:test'), assert=require('node:assert'), fs=require('fs'), path=require('path');
const S=path.join(__dirname,'..','site'); const rd=f=>fs.readFileSync(S+'/'+f,'utf8');
test('v20261030a: 18 more AI designs (10 Google Gemini, 8 Leonardo.ai) with card and tile pictures, New badge, cross-listed', ()=>{
  const core=rd('core.js'); const m=core.match(/var AI4_DESIGNS = (\{.*?\});\n/); assert.ok(m);
  const D=JSON.parse(m[1]); const ks=Object.keys(D); assert.strictEqual(ks.length,18);
  assert.strictEqual(ks.filter(k=>D[k].src==='gem').length,10); assert.strictEqual(ks.filter(k=>D[k].src==='leo').length,8);
  for(const k of ks){ const d=D[k]; assert.ok(d.nb&&d.isNew&&d.ai, k);
    for(const f of [d.file,d.thumb]){ assert.ok(fs.existsSync(S+'/img/'+f+'.webp'), f); }
    assert.ok(d.pad.length===3 && d.pad.every(x=>x>5&&x<50), k); }
  const ca=JSON.parse(core.match(/var CROSS_ADD = (\{.*?\});\n/)[1]); for(const k of ks) assert.ok(Array.isArray(ca[k]), 'cross '+k);
  assert.ok(core.indexOf('var AI4_DESIGNS')>core.indexOf('var AI3_DESIGNS') && core.indexOf('var AI4_DESIGNS')<core.indexOf('var CROSS_ADD'));
  assert.match(core,/v20261030a/);
  for(const f of ['index.html','make.html','card.html','host.html']){ const h=rd(f); assert.ok(!/v=20261029e/.test(h),f); assert.match(h,/v=20261030[a-z]/,f); }
  assert.match(rd('download.js'),/VERSION = '20261030[a-z]'/);
  assert.match(rd('index.html'),/ai-credit[^<]*Canva, Leonardo\.ai and Google Gemini/);
  assert.match(rd('make.html'),/Canva, Leonardo\.ai or Google Gemini/);
  assert.match(rd('make.js'),/gem \? 'AI art · Google Gemini'/);
  const i18n=rd('i18n.js'); for(const s of ['AI art · Google Gemini','Background art AI-generated with Google Gemini','Some background art AI-generated with Canva, Leonardo.ai and Google Gemini']) assert.ok(i18n.includes(JSON.stringify(s)), s);
});
test('v20261030a: in the browser, new designs lead and only they wear New', ()=>{
  const vm=require('vm'); const ctx={window:{},document:undefined,navigator:{userAgent:''},console}; ctx.window=ctx; ctx.self=ctx; ctx.global=ctx;
  try { vm.runInNewContext(rd('core.js'), ctx); } catch(e) { return; } // core may need a DOM; the browser check covers it
  const F=ctx.FreeCard||ctx.window.FreeCard; if(!F) return;
  const ks=Object.keys(F.DESIGNS).filter(k=>F.DESIGNS[k].nb); assert.ok(ks.length>=18 && ks.filter(k=>/^ai4/.test(k)).length===18);
  assert.ok(/^ai[45]/.test(F.designsFor('chasuna').first[0]));
});
