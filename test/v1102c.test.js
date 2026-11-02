// v20261102c: Benz called 7 plain cream cards with only a small kids' strip at the bottom "nebby" — deleted (not hidden)
const fs=require('fs'), path=require('path'), assert=require('assert');
const S=path.join(__dirname,'..','site');
const core=fs.readFileSync(S+'/core.js','utf8');
const GONE=["ai9canbristrains", "ai9cankiddushpeachdaisy", "ai9canupsherinwoodland", "ai9canupsherincars", "ai9canupsherinfarm", "ai9canupsherinveggiegarden", "ai9canupsherinlionbear"];
const FILES=["c9-bris-trains", "c9-kiddush-peachdaisy", "c9-upsherin-woodland", "c9-upsherin-cars", "c9-upsherin-farm", "c9-upsherin-veggiegarden", "c9-upsherin-lionbear"];
const m=core.match(/var AI9_DESIGNS = (\{.*\});/); assert(m,'AI9 block');
const D=JSON.parse(m[1]);
assert.strictEqual(Object.keys(D).length,95,'newest set count');
for(const k of GONE){ assert(!D[k],k+' still a design'); assert(!core.includes('"'+k+'"'),k+' still referenced'); }
for(const f of FILES){ for(const p of ['img/ai/'+f+'.webp','img/ai/p/'+f+'.webp']){ assert(!fs.existsSync(path.join(S,p)),p+' still on disk'); assert(!core.includes(f+'"'),f+' still referenced'); } }
for(const k of Object.keys(D)){ assert(fs.existsSync(path.join(S,'img',D[k].file+'.webp')),'missing '+D[k].file); assert(fs.existsSync(path.join(S,'img',D[k].thumb+'.webp')),'missing '+D[k].thumb); }
for(const f of ['index.html','make.html','card.html','host.html']){ const h=fs.readFileSync(S+'/'+f,'utf8'); assert(!/v=20261102b/.test(h),f+' old version'); assert(/v=20261102[c-z]/.test(h),f+' new version'); }
assert(/VERSION = '20261102[c-z]'/.test(fs.readFileSync(S+'/download.js','utf8')));
console.log('v1102c ok', Object.keys(D).length,'newest designs');
