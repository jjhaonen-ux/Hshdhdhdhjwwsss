/* ═══ م٢ب · «من نقطة» ═══ (خطة تطوير أدوات الرسم · البند ٥)
   from/من في خطوة نقطة ⇒ نقطة أساس ⇒ إزاحة @س,ص أو @طول<زاوية.
   · الكلمتان ليستا أداةً ولا اسماً مستعاراً (اختبار التعارض).
   · لا تُقرأ في خطوة كيان، والإلغاء يمسحها، والنقرة بدل الإزاحة تضع النقطة.
   · الإدخال القديم (@ نسبيٌّ إلى آخر نقطة) بلا تغيير.
   · تعمل في الدفعة (الخطط والماكرو) وشريحة «من» في اللمس.
   التشغيل: node src/tests/from-point.test.js                          */
import {shim,shimCanvas,shimDOM,group,ok,eq,deep,throws,summary,toolRig} from "./harness.js";
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
const W=await import("../core/walls.js");
const R=await import("../tools/registry.js");
for(const f of await (await import("node:fs")).promises.readdir(new URL("../tools/",import.meta.url))){
 if(f.endsWith(".js"))await import(`../tools/${f}`);
}
await import("../ui/canvas.js");
const TB=await import("../ui/touchbar.js");
const RUN=await import("../ai/run.js");
const S=()=>ST.S;
const rig=toolRig(R);
const reset=()=>{R.cancel(true); ST.newState(); ST.ensureShape(); RN.invalidate();
 W.addWall([0,0],[4000,0],150,"int","c"); ST.touchGeom(); RN.invalidate(); rig.clear()};
const last=()=>S().walls[S().walls.length-1];

group("م٢ب · اختبار التعارض: from ومن ليستا أداة",()=>{
 for(const w of ["from","من","FROM"])ok(!R.findTool(w),`«${w}» ليست أداة ولا اسماً مستعاراً`);
});

group("م٢ب · from ثم أساس ثم @س,ص",()=>{
 reset(); R.begin("wall");
 ok(R.feedText("from"),"from مقبولة في خطوة النقطة");
 eq(R.T.fromS,1,"تنتظر نقطة الأساس"); ok(/من: نقطة الأساس/.test(R.promptText().p),"والسطر يقولها");
 R.feedPoint([4000,0],[4000,0]);
 deep(R.fromBase(),[4000,0],"الأساس محفوظ"); ok(/الإزاحة من الأساس/.test(R.promptText().p),"ثم تُطلب الإزاحة");
 eq(R.T.i,0,"الأساس لا يُعدّ نقطةً للأداة");
 R.feedText("@0.6,0");
 deep(R.baseOf(),[4600,0],"أوّل الجدار = الأساس + 0.6 م"); eq(R.T.fromS,0,"وانتهت «من»");
 R.feedText("@0,2"); R.enter();
 deep([last().a,last().b],[[4600,0],[4600,2000]],"والنقطة التالية نسبيّةٌ إلى ما وُضع (القديم كما هو)");
});

group("م٢ب · «من» بالعربية و@طول<زاوية وفي النقطة الثانية",()=>{
 reset(); R.begin("wall");
 R.feedPoint([0,3000],[0,3000]);
 R.feedText("من"); R.feedPoint([4000,0],[4000,0]); R.feedText("@1<90"); R.enter();
 deep([last().a,last().b],[[0,3000],[4000,1000]],"الإزاحة القطبية من الأساس لا من آخر نقطة");
});

group("م٢ب · النقرة بدل الإزاحة تضع النقطة، والإلغاء يمسح",()=>{
 reset(); R.begin("wall");
 R.feedText("from"); R.feedPoint([4000,0],[4000,0]);
 R.feedPoint([5000,500],[5000,500]);
 deep(R.baseOf(),[5000,500],"النقرة تضع النقطة حيث نُقرت"); eq(R.T.fromS,0,"وتُنهي «من»");
 R.cancel(true);
 R.begin("wall"); R.feedText("from"); R.cancel(true);
 eq(R.T.fromS,0,"Esc يمسح «من»");
});

group("م٢ب · لا تُقرأ في خطوة كيان",()=>{
 reset(); R.begin("match");
 ok(R.step()&&R.step().ent,"خطوة «مطابقة» الأولى كيان");
 rig.clear(); R.feedText("from");
 eq(R.T.fromS,0,"لم تبدأ «من»"); ok(rig.errs().some(e=>/خطوة نقطة/.test(e)),"وتقول السبب");
 R.cancel(true);
});

group("م٢ب · الإدخال القديم بلا «من» كما كان",()=>{
 reset(); R.begin("wall");
 R.feedText("1,1"); R.feedText("@0.6,0"); R.enter();
 deep([last().a,last().b],[[1000,1000],[1600,1000]],"@ نسبيٌّ إلى آخر نقطة");
});

group("م٢ب · في الدفعة (خطة/ماكرو)",()=>{
 reset();
 const t=RUN.trial([{kind:"tool",tool:"wall"},{kind:"text",s:"from"},{kind:"text",s:"4,0"},
  {kind:"text",s:"@0.5,0"},{kind:"text",s:"@0,1"},{kind:"enter"}]);
 eq(t.errs,0,"بلا خطأ"); eq(t.made,1,"جدارٌ واحد");
 deep([last().a,last().b],[[4500,0],[4500,1000]],"من الأساس 4,0 بإزاحة 0.5");
});

group("م٢ب · اللمس: شريحة «من»",()=>{
 reset();
 ok(TB.barFor({id:"wall"},{p:"نقطة"},0,{pt:1}).some(c=>c.k==="from"),"تظهر في خطوة نقطة");
 ok(!TB.barFor({id:"wall"},{p:"x"},0,{pt:0}).some(c=>c.k==="from"),"ولا تظهر في غيرها");
 R.begin("wall"); ok(TB.runTouch("from")!==false,"تعمل"); eq(R.T.fromS,1,"وتبدأ «من»");
 R.cancel(true);
 eq(R.fromStart(),false,"بلا أداة لا «من»");
});

summary();
