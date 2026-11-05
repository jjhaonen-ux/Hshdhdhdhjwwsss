/* ═══ م٢أ · تدوير المرشّحين وسياسة الأولوية ═══ (خطة تطوير أدوات الرسم · ف٢)
   · osnapAll تُرجع أقربَ مرشّحٍ لكل نمط ثم باقي المرشّحين النقطيّين (م٢ج: end/mid/int/nod)
     مرتّبين بالمسافة بعد الأول.
   · os.pick=order (الافتراضي) يطابق السلوك القديم حرفاً: osnap = أوّل القائمة.
   · os.pick=near: أقربُ نقطيّ يفوز، و«أقرب/عمودي/موازٍ» لا تفوز إلا وحدها.
   · osCycle يدوّر المرشّح المعروض، ويلفّ، ولا يعمل بلا قائمة من أكثر من مرشّح.
   · عدّاد الشريط «2/4 · تقاطع» يظهر مع أكثر من مرشّح فقط.
   التشغيل: node src/tests/osnap-cycle.test.js                        */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {shim,shimCanvas,shimDOM,group,ok,eq,summary} from "./harness.js";
shim(); shimCanvas(); shimDOM();
const doc=globalThis.document;
for(const id of ["top","srchBtn","ribbon","tools","navbar","fabDock","thumb","qpCard","status",
 "touchBar","optbar","log","side","sideE","dynBox","cv"]){
 if(doc.getElementById&&doc.getElementById(id))continue;
 const e=doc.createElement(id==="cv"?"canvas":"div"); e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
const ST=await import("../core/state.js");
const RN=await import("../core/render.js");
const OS=await import("../core/osnap.js");
const W=await import("../core/walls.js");
const R=await import("../tools/registry.js");
for(const f of ["draw"])await import(`../tools/${f}.js`);
const CV=await import("../ui/canvas.js");
const S=()=>ST.S;

/* مشهد: جداران يلتقيان عند (5000,0) بزاوية، ونقطة تقاطعهما قريبة من مؤشّر */
ST.newState(); ST.ensureShape(); RN.invalidate();
W.addWall([5000,0],[9000,0],150,"int","c");
W.addWall([5000,0],[5000,4000],150,"int","c");
ST.touchGeom(); RN.invalidate();
CV.V.k=0.05;
const tol=320;
const keep=Object.assign({},S().os), keepPick=S().os.pick;
S().os.end=1; S().os.int=1; S().os.mid=1; S().os.near=0;

group("م٢أ/م٢ج · osnapAll: أقرب مرشّحٍ لكل نمط أوّلاً، ثم الباقي بالمسافة",()=>{
 S().os.pick="order";
 const L=OS.osnapAll(5100,100,tol);
 ok(L.length>=2,`عدّة مرشّحات حول (5100,100): ${L.map(c=>c.m).join(",")}`);
 eq(new Set(L.map(c=>c.p+"")).size,L.length,"لا نقطة تتكرّر (النمط قد يتكرّر لنقاط مختلفة، م٢ج)");
 const seenM={}; L.forEach(c=>{ if(!seenM[c.m]){ seenM[c.m]=c; } });
 ok(Object.values(seenM).every(f=>L.filter(c=>c.m===f.m).every(c=>c.d>=f.d)),"أوّل ظهورٍ لكل نمطٍ هو أقربُ مرشّحيه");
 const rest=L.slice(1).map(c=>c.d);
 ok(rest.every((d,i)=>i===0||rest[i-1]<=d),"الباقي مرتّبٌ بالمسافة");
 eq(JSON.stringify(OS.osnap(5100,100,tol)),JSON.stringify(L[0]),"osnap = أوّل osnapAll (الافتراضي)");
 eq(OS.osnapAll(100000,100000,tol).length,0,"بلا مرشّح بعيداً عن الكل");
});

group("م٢أ · os.pick=order يطابق السلوك القديم (ترتيب الأنماط لا المسافة)",()=>{
 S().os.pick="order";
 const L=OS.osnapAll(5010,10,tol);
 const first=L[0];
 const legacyOrder=OS.MODES.map(m=>m.k).find(k=>L.some(c=>c.m===k));
 eq(first.m,legacyOrder,`الفائز أول نمطٍ بالترتيب (${first.m})`);
});

group("م٢أ · os.pick=near: الأقرب نقطيّاً يفوز على أنماط الترتيب",()=>{
 S().os.pick="near";
 S().os.end=1; S().os.int=1; S().os.mid=1; S().os.near=1;
 const L=OS.osnapAll(5100,80,tol);
 const pts=L.filter(c=>!["near","per","par"].includes(c.m));
 if(pts.length){
  const minPt=pts.reduce((a,c)=>c.d<a.d?c:a);
  eq(L[0].m,minPt.m,`الأقرب نقطيّاً (${minPt.m}) يفوز`);
 }
 const nearOnly=OS.osnapAll(5000,2000,tol);
 ok(nearOnly.length===0||!["near","per","par"].includes(nearOnly[0].m)||nearOnly.every(c=>["near","per","par"].includes(c.m)),
  "أنماط الخطّ وحدها لا تُقدَّم على نقطةٍ حقيقية");
 S().os.pick="order"; S().os.near=0;
});

group("م٢أ · osCycle: التدوير بين المرشّحين ولفّ الفهرس",()=>{
 S().os.pick="order";
 R.begin("wall");
 R.T.hover=[5100,100];
 const q=CV.snap(5100,100,null,null);
 ok(!!CV.UI.osList&&CV.UI.osList.length>=2,"القائمة المعروضة فيها أكثر من مرشّح");
 const n=CV.UI.osList.length;
 const seen=[CV.UI.osnap.m];
 for(let i=0;i<n;i++){ CV.osCycle(); seen.push(CV.UI.osnap.m) }
 eq(seen[n],seen[0],"بعد دورةٍ كاملة يعود إلى الأول");
 ok(new Set(seen.slice(0,n)).size>=1,"الدورة تمرّ على أنماطٍ فعلية");
 {
  const pts=[CV.UI.osnap.m+CV.UI.osnap.p];
  for(let i=1;i<n;i++){ CV.osCycle(); pts.push(CV.UI.osnap.m+CV.UI.osnap.p) }
  CV.osCycle();
  ok(new Set(pts).size===n,"كل مرشّحٍ (نمط+نقطة) يظهر مرّةً في الدورة");
 }
 CV.osCycle();
 eq(CV.UI.osnap.i,1,"الفهرس الظاهر في العدّاد يتبع التدوير");
 R.cancel(true);
});

group("م٢أ · osCycle لا يعمل خارج الأداة أو بمرشّح واحد",()=>{
 R.cancel(true);
 ok(!CV.osCycle(),"بلا أداة فعّالة: لا تدوير");
 R.begin("wall");
 R.T.hover=[30000,30000];
 CV.snap(30000,30000,null,null);
 ok(!CV.osCycle(),"بلا مرشّح: لا تدوير");
 R.cancel(true);
});

group("م٢أ · عدّاد «٢/٤» على الشريط والعدسة لا يظهر لمرشّح واحد",()=>{
 S().os.pick="order";
 R.begin("wall");
 CV.snap(5100,100,null,null);
 ok(CV.UI.osList.length>1,"مرشّحان على الأقل");
 ok(/^\d\/\d /.test(CV.loupeTag()||""),`العدّاد في وسم العدسة: «${CV.loupeTag()}»`);
 CV.snap(100000,100000,null,null);
 eq(CV.loupeTag().includes("/"),false,"بلا التقاط: لا عدّاد");
 R.cancel(true);
});

/* ═══ Tab في الإدخال الحركي: التعارض مع قفل الحقل (البند ١) ═══
   الحقلُ فارغ وتحت المؤشّر أكثر من مرشّح ⇒ تدوير · فيه كتابة ⇒ القفلُ القديم */
const DY=await import("../ui/dyninput.js");
const tab=(el,shift)=>{const e={type:"keydown",key:"Tab",shiftKey:!!shift}; el.dispatchEvent(e); return e};
group("م٢أ · Tab في الإدخال الحركي: يدوّر بحقلٍ فارغ ويقفل بحقلٍ مكتوب",()=>{
 S().os.pick="order";
 const rb=Object.assign({},S().rb);
 S().rb.dyn=1; S().rb.ortho=0; S().rb.polar=0; S().rb.snap=1;
 DY.wireDyn();
 R.begin("wall"); R.feedText("0,0");
 R.T.hover=[5100,100];
 R.T.ghost=CV.snap(5100,100,R.osBase(),R.snapBase());
 DY.syncDyn();
 doc.querySelectorAll("#dynBox input").forEach(n=>{if(!n.select)n.select=()=>{}; if(!n.focus)n.focus=()=>{}});
 const f0=doc.querySelector('#dynBox [data-df="0"]');
 ok(!!f0,"حقل الطول ظاهر بعد نقطة الأساس");
 ok(CV.UI.osList&&CV.UI.osList.length>1,"وتحت المؤشّر أكثر من مرشّح");
 const i0=CV.UI.osnap.i;
 f0.value=""; tab(f0);
 eq(CV.UI.osnap.i,(i0+1)%CV.UI.osList.length,"الحقل فارغ ⇒ Tab دوّر المرشّح");
 eq(R.T.lenLock,null,"ولم يُقفَل طول");
 f0.value="3"; const i1=CV.UI.osnap.i; tab(f0);
 eq(R.T.lenLock,3000,"الحقل فيه «3» ⇒ Tab قفل الطول 3 م (السلوك القديم)");
 eq(CV.UI.osnap&&CV.UI.osnap.i,i1,"ولم يدوّر");
 R.lockLen(null); f0.value="";
 R.T.hover=[30000,30000]; R.T.ghost=CV.snap(30000,30000,R.osBase(),R.snapBase());
 tab(f0);
 eq(R.T.lenLock,null,"بلا مرشّح وحقلٍ فارغ: لا تدوير ولا قفل");
 R.cancel(true); S().rb=Object.assign(S().rb,rb);
});

{
 const OV=await import("../ui/osov.js");
 group("م٢أ · os.pick: مفتاح «الأقرب يفوز» في شرائح اللمس",()=>{
  S().os.pick="order";
  ok(/data-tb="pick"[^>]*aria-pressed="false"/.test(OV.chipsHtml(null)),"الشريحة ظاهرة ومطفأة افتراضاً");
  eq(OV.togglePick(),"near","لمسةٌ أولى ⇒ near");
  ok(/data-tb="pick"[^>]*aria-pressed="true"/.test(OV.chipsHtml(null)),"والشريحة مضغوطة");
  eq(OV.togglePick(),"order","لمسةٌ ثانية ⇒ order");
  S().os.pick="bogus"; ST.ensureShape();
  eq(S().os.pick,"order","قيمةٌ فاسدة في ملفّ ⇒ order (الافتراضي)");
  S().os.pick="near"; ST.ensureShape();
  eq(S().os.pick,"near","near تُحفَظ وتبقى");
  S().os.pick="order";
 });
}

/* ═══ م٢ج · التدوير بين مرشّحَين من النمط نفسه ═══
   كان osnapAll يُبقي مرشّحاً واحداً لكل نمط، فنهايتان متجاورتان (ركنا وجهَي
   جدارٍ مثلاً) لا يمكن التبديل بينهما. الآن النقطيّ (end/mid/int/nod) يُعرض كلُّه
   مرتّباً بالمسافة، وأوّل القائمة لا يتغيّر. */
group("م٢ج · نهايتان متجاورتان: كلتاهما في القائمة، والأقرب أوّلاً",()=>{
 S().os.pick="order"; S().os.near=0;
 const L=OS.osnapAll(5100,100,tol), E=L.filter(c=>c.m==="end");
 ok(E.length>=2,`أكثر من «نهاية» في القائمة (${E.length}): ${E.map(c=>c.p).join(" ")}`);
 eq(L[0].m,"end","والأول نهاية كما كان (ترتيب الأنماط)");
 ok(E.every(c=>c.d>=E[0].d),"والأوّل أقربُ النهايات");
 const rest=L.slice(1).map(c=>c.d);
 ok(rest.every((d,i)=>i===0||rest[i-1]<=d),"الباقي مرتّبٌ بالمسافة");
 eq(new Set(L.map(c=>c.p+"")).size,L.length,"بلا نقطةٍ مكرّرة");
 eq(JSON.stringify(OS.osnap(5100,100,tol)),JSON.stringify(L[0]),"osnap = أوّل القائمة");
});

group("م٢ج · osCycle يمرّ على كل النقاط بما فيها المتماثلة النمط",()=>{
 S().os.pick="order";
 R.begin("wall"); R.T.hover=[5100,100];
 CV.resetCycle(); CV.snap(5100,100,null,null);
 const n=CV.UI.osList.length, ends=CV.UI.osList.filter(c=>c.m==="end").length;
 ok(ends>=2&&n>ends,`قائمةٌ مختلطة: ${ends} نهايات من ${n}`);
 const visited=[CV.UI.osnap.p+""];
 for(let i=1;i<n;i++){ ok(CV.osCycle(),`Tab رقم ${i}`); visited.push(CV.UI.osnap.p+"") }
 eq(new Set(visited).size,n,"كل نقطةٍ ظهرت مرّةً");
 ok(visited.filter((_,i)=>CV.UI.osList[i].m==="end").length>=2,"ومنها نهايتان على الأقل");
 CV.osCycle(); eq(CV.UI.osnap.i,0,"ثم يلفّ إلى الأول");
 eq(CV.UI.osnap.n,n,"والعدّاد يعدّ النقاط");
 R.cancel(true);
});

group("م٢ج · التجاوز المؤقت «نهاية» يدوّر بين النهايات وحدها",()=>{
 const L=OS.osnapAll(5100,100,tol,null,{only:"end"});
 ok(L.length>=2&&L.every(c=>c.m==="end"),`${L.length} نهايات فقط`);
 ok(L.every((c,i)=>i===0||L[i-1].d<=c.d),"مرتّبة بالمسافة");
});

group("م٢ج · الأنماط الدالّية (أقرب/عمودي) لا تتضاعف",()=>{
 S().os.near=1; S().os.per=1;
 const L=OS.osnapAll(5300,40,tol,[5000,2000]);
 eq(L.filter(c=>c.m==="near").length<=1,true,"«أقرب» مرشّحٌ واحد");
 eq(L.filter(c=>c.m==="per").length<=1,true,"«عمودي» مرشّحٌ واحد");
 S().os.near=0; S().os.per=keep.per;
});

group("م٢ج · سقفٌ للإضافيين في مشهدٍ مزدحم",()=>{
 const ws=[];
 for(let i=0;i<12;i++)ws.push(W.addWall([20000+i*30,20000],[20000+i*30,24000],150,"int","c"));
 ST.touchGeom(); RN.invalidate();
 S().os.end=1;
 const L=OS.osnapAll(20150,20010,tol);
 const modes=new Set(L.map(c=>c.m)).size;
 eq(L.length-modes,6,`12 نهاية متاحة ⇒ الإضافيون عند السقف 6 تماماً (${L.length} مرشّحاً)`);
 eq(new Set(L.map(c=>c.p+"")).size,L.length,"بلا تكرار");
 ws.forEach(w=>{ try{ W.removeWall&&W.removeWall(w.id||w) }catch(_){} });
});

S().os=keep; S().os.pick=keepPick;
process.exit(summary()?1:0);
