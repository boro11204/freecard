
const {open}=require(process.env.FC_LIB||'./lib.js'); const fs=require('fs');
(async()=>{
 const base=process.env.BASE||'http://127.0.0.1:8799'; const mode=process.argv[2]||'p'; const out=process.argv[3]||'/tmp/kbt'; fs.mkdirSync(out,{recursive:true});
 const phone=mode.includes('p'); const lang=process.argv[4]||'he';
 const {b,p,errs}=await open({viewport: phone?{width:390,height:844}:{width:1280,height:900}, mobile:phone, dpr: phone?2:1});
 const R={};
 await p.goto(`${base}/make.html?type=chasuna&lang=${lang}`,{waitUntil:'load'}); await p.waitForTimeout(1500);
 R.icons=await p.$$eval('.vkb-ico',x=>x.length);
 const tap=async(sel)=>{ if(phone) await p.tap(sel); else await p.click(sel); };
 const typeKeys=async(chars)=>{ for(const c of chars){ const ok=await p.evaluate((c)=>{ const k=[...document.querySelectorAll('#vkb .vkb-k')].find(b=>b._act===c); if(!k) return false; return true; },c); if(!ok) throw new Error('no key '+c);
   const h=await p.evaluateHandle((c)=>[...document.querySelectorAll('#vkb .vkb-k')].find(b=>b._act===c),c); if(phone) await h.tap(); else await h.click(); } };
 const keyAct=async(a)=>{ const h=await p.evaluateHandle((a)=>[...document.querySelectorAll('#vkb .vkb-k')].find(b=>b._act===a),a); if(phone) await h.tap(); else await h.click(); };
 // 1: names field, Hebrew
 if(phone){ await tap('#w-n1 .vkb-ico'); } else { await p.click('#f-n1'); }
 await p.waitForTimeout(400);
 R.open1=await p.evaluate(()=>({open:FCvkb.isOpen(), field:FCvkb.field()&&FCvkb.field().id, layout:FCvkb.layout(), im:document.getElementById('f-n1').getAttribute('inputmode'), active:document.activeElement.id, below: document.getElementById('vkb').getBoundingClientRect().top >= document.getElementById('f-n1').getBoundingClientRect().bottom-1, kbBottom:document.getElementById('vkb').getBoundingClientRect().bottom, vw:innerWidth, kbW:document.getElementById('vkb').getBoundingClientRect().width, sw:document.documentElement.scrollWidth}));
 await p.evaluate(()=>{ const f=document.getElementById('f-n1'); f.value=''; f.dispatchEvent(new Event('input',{bubbles:true})); });
 if(await p.evaluate(()=>FCvkb.layout())==='en') await keyAct('lang');
 await typeKeys(['מ','ש','ה',' ','כ','ה','ן']);
 R.n1=await p.$eval('#f-n1',f=>f.value);
 await p.waitForTimeout(500);
 R.cardHasN1=await p.evaluate(()=>document.querySelector('#card .fc-card').textContent.includes('משה כהן'));
 // caret insert in middle + backspace
 await p.evaluate(()=>{ const f=document.getElementById('f-n1'); f.setSelectionRange(3,3); f._vkbSel=[3,3]; });
 await typeKeys(['י']); R.mid=await p.$eval('#f-n1',f=>f.value);
 await keyAct('back'); R.afterBack=await p.$eval('#f-n1',f=>f.value);
 // selection replace
 await p.evaluate(()=>{ const f=document.getElementById('f-n1'); f.setSelectionRange(4,7); f._vkbSel=[4,7]; });
 await typeKeys(['ל','ו','י']); R.selRep=await p.$eval('#f-n1',f=>f.value);
 if(mode.includes('shot')){ await p.evaluate(()=>{ const f=document.getElementById('f-n1'); f.setSelectionRange(f.value.length,f.value.length); }); await p.waitForTimeout(700); await p.screenshot({path:out+'/he.png'}); }
 // 2: switch to English, parents field
 if(phone) await tap('#w-p1 .vkb-ico'); else await p.click('#f-p1');
 await p.waitForTimeout(300);
 R.follow=await p.evaluate(()=>FCvkb.field().id);
 await p.evaluate(()=>{ const f=document.getElementById('f-p1'); f.value=''; f.dispatchEvent(new Event('input',{bubbles:true})); });
 if(await p.evaluate(()=>FCvkb.layout())==='he') await keyAct('lang');
 R.layout2=await p.evaluate(()=>FCvkb.layout());
 await keyAct('shift'); await typeKeys(['M']); await typeKeys(['r','.',' ']); await keyAct('shift'); await typeKeys(['K']); await typeKeys(['a','t','z']);
 R.p1=await p.$eval('#f-p1',f=>f.value);
 await p.waitForTimeout(500);
 R.cardHasP1=await p.evaluate(()=>document.querySelector('#card .fc-card').textContent.includes('Mr. Katz'));
 // numbers into More times
 await p.evaluate(()=>document.getElementById('f-sc').scrollIntoView({block:'center'}));
 if(phone) await tap('#f-sc + .vkb-ico'); else await p.click('#f-sc');
 await p.waitForTimeout(300);
 await p.evaluate(()=>{ const f=document.getElementById('f-sc'); f.value=''; f.dispatchEvent(new Event('input',{bubbles:true})); });
 await keyAct('num'); await typeKeys(['7',':','3','0']);
 R.sc=await p.$eval('#f-sc',f=>f.value);
 // textarea: invitation text, enter key exists
 await p.evaluate(()=>document.getElementById('f-x').scrollIntoView({block:'start'}));
 if(phone) await tap('#f-x + .vkb-ico'); else await p.click('#f-x');
 await p.waitForTimeout(300);
 R.enter=await p.evaluate(()=>!![...document.querySelectorAll('#vkb .vkb-k')].find(b=>b._act==='\n'));
 await p.evaluate(()=>{ const f=document.getElementById('f-x'); f.setSelectionRange(f.value.length,f.value.length); f._vkbSel=[f.value.length,f.value.length]; });
 if(await p.evaluate(()=>FCvkb.layout())==='en') await keyAct('lang');
 await keyAct('\n'); await typeKeys(['ש','ל','ו','ם']);
 R.xEnd=await p.$eval('#f-x',f=>JSON.stringify(f.value.slice(-6)));
 await p.waitForTimeout(500);
 R.cardHasX=await p.evaluate(()=>document.querySelector('#card .fc-card').textContent.includes('שלום'));
 // hold-to-repeat backspace
 const bk=await p.evaluateHandle(()=>[...document.querySelectorAll('#vkb .vkb-k')].find(b=>b._act==='back'));
 const bb=await bk.boundingBox(); const before=await p.$eval('#f-x',f=>f.value.length);
 await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2); await p.mouse.down(); await p.waitForTimeout(900); await p.mouse.up();
 R.repeatDeleted=before-await p.$eval('#f-x',f=>f.value.length);
 // close
 await tap('#vkbX'); await p.waitForTimeout(200);
 R.closed=await p.evaluate(()=>!FCvkb.isOpen() && !document.getElementById('f-x').hasAttribute('inputmode'));
 if(!phone){ await p.click('#f-hl'); await p.waitForTimeout(200); R.desktopStaysClosedAfterX=await p.evaluate(()=>!FCvkb.isOpen()); await p.click('#w-n2 .vkb-ico'); await p.waitForTimeout(200); R.iconReopens=await p.evaluate(()=>FCvkb.isOpen()&&FCvkb.field().id==='f-n2'); await p.click('#vkbX'); }
 else { await p.tap('#f-hl'); await p.waitForTimeout(200); R.phoneNoAutoOpen=await p.evaluate(()=>!FCvkb.isOpen()); }
 // part editor on the card
 await p.evaluate(()=>window.scrollTo(0,0));
 const part=await p.$('#card .fc-card [data-pe="hl"], #card .fc-card [data-pe="h"]');
 if(part){ await part.scrollIntoViewIfNeeded(); if(phone) await part.tap(); else await part.click(); await p.waitForTimeout(600);
   R.peIcon=await p.evaluate(()=>!!document.querySelector('#peSheet .vkb-ico'));
   const ic=await p.$('#peSheet .vkb-ico'); if(ic){ if(phone) await ic.tap(); else await ic.click(); await p.waitForTimeout(400);
     R.peOpen=await p.evaluate(()=>FCvkb.isOpen()&&FCvkb.field().id);
     await p.evaluate(()=>{ const f=document.getElementById('peWords'); f.setSelectionRange(f.value.length,f.value.length); f._vkbSel=[f.value.length,f.value.length]; });
     if(await p.evaluate(()=>FCvkb.layout())==='en') await keyAct('lang');
     await typeKeys([' ','ב','ר','ו','ך']); await p.waitForTimeout(500);
     R.peWords=await p.$eval('#peWords',f=>f.value.slice(-8));
     R.peCard=await p.evaluate(()=>document.querySelector('#card .fc-card').textContent.includes('ברוך'));
     if(mode.includes('shot')) await p.screenshot({path:out+'/pe.png'});
     await p.click('#peDone').catch(()=>{}); await p.waitForTimeout(500); R.peClosedKb=await p.evaluate(()=>!FCvkb.isOpen());
   } }
 // drag (desktop)
 if(!phone){ await p.click('#w-n1 .vkb-ico'); await p.waitForTimeout(300); const g=await (await p.$('#vkbGrip')).boundingBox(); await p.mouse.move(g.x+5,g.y+5); await p.mouse.down(); await p.mouse.move(g.x+205,g.y-95,{steps:5}); await p.mouse.up();
   R.drag=await p.evaluate(()=>{ const k=document.getElementById('vkb'); return k.classList.contains('vkb-float')+' '+Math.round(k.getBoundingClientRect().left); }); await typeKeys(['א']); R.dragType=await p.$eval('#f-n1',f=>f.value.slice(-2)); if(mode.includes('shot')) await p.screenshot({path:out+'/drag.png'}); await p.click('#vkbX'); }
 // download still works
 const dl=await p.evaluate(async()=>{ const n=document.querySelector('#card .fc-card'); const o={}; for(const k of ['jpeg','pdf']){ try{ const bl=await FreeCardDownload.make(n,k); o[k]=bl.size; }catch(e){ o[k]='ERR '+e.message; } } return o; });
 R.dl=dl; R.sw=await p.evaluate(()=>document.documentElement.scrollWidth); R.errs=errs.filter(e=>!/favicon|api\//.test(e));
 console.log(JSON.stringify(R,null,1));
 await b.close();
})().catch(e=>{console.error('FAIL',e); process.exit(1);});
