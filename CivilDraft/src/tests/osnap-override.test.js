/* ═══ م٢أ · التجاوز المؤقت لنقطة واحدة ═══ (خطة تطوير أدوات الرسم · ف٣)
   · كلمة النمط في خطوة النقطة (end/نهاية، int/تقاطع، ...) تفعّل النمط وحده للنقرة التالية.
   · بعد النقرة يعود S.os كما كان.
   · اختبار التعارض: لا كلمة تجاوز تطابق اسماً أو اسماً مستعاراً لأداة في السجل.
   · الكلمة لا تُقرأ داخل خطوة كيان (ent) ولا تُقرأ نصّاً حرّاً.
   التشغيل: node src/tests/osnap-override.test.js                    */
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
const W=await import("../core/walls.js");
const R=await import("../tools/registry.js");
for(const f of await (await import("node:fs")).promises.readdir(new URL("../tools/",import.meta.url))){
 if(f.endsWith(".js"))await import(`../tools/${f}`);
}
const CV=await import("../ui/canvas.js");
const OS=await import("../core/osnap.js");
const {norm}=await import("../core/units.js");
const S=()=>ST.S;

ST.newState(); ST.ensureShape(); RN.invalidate();
W.addWall([5000,0],[9000,0],150,"int","c");
W.addWall([5000,0],[5000,4000],150,"int","c");
ST.touchGeom(); RN.invalidate();
CV.V.k=0.05;

group("م٢أ · كل كلمة تجاوز تطابق نمطاً صالحاً",()=>{
 for(const [w,k] of [["end","end"],["نهاية","end"],["int","int"],["تقاطع","int"],["cen","cen"],
  ["مركز","cen"],["per","per"],["عمودي","per"],["توازي","par"],["nod","nod"],["عقدة","nod"],
  ["near","near"],["أقرب","near"],["mid","mid"],["منتصف","mid"],["par","par"],["موازٍ","par"]]){
  ok(!R.OSW[norm("موازي")],"«موازي» بالياء تبقى اسماً مستعاراً للإزاحة (offset) لا تجاوزاً");
  eq(R.OSW[norm(w)],k,`«${w}» ⇒ ${k}`);
 }
});

group("م٢أ · اختبار التعارض: لا كلمة تجاوز تطابق اسماً أو اسماً مستعاراً",()=>{
 for(const w of Object.keys(R.OSW)){
  ok(!R.findTool(w),`«${w}» ليست أداة ولا اسماً مستعاراً`);
 }
});

group("م٢أ · التجاوز يفعّل النمط للنقطة التالية فقط ثم يعود",()=>{
 S().os.end=1; S().os.int=0; S().os.pick="order";
 R.begin("wall");
 R.feedText("int");
 eq(R.T.osOv,"int","التجاوز مضبوطٌ على تقاطع");
 const p=CV.snap(5010,5,[0,0],[0,0]);
 eq(!!CV.UI.osnap&&CV.UI.osnap.m,"int","النمط المتجاوَز يُلتقط وإن كان مُطفأً");
 eq(S().os.int,0,"إعداد S.os لم يتغيّر");
 R.feedPoint(p,[5010,5]);
 eq(R.T.osOv,null,"بعد النقرة يزول التجاوز");
 R.cancel(true);
});

group("م٢أ · التجاوز يُسقط الأنماط الأخرى لتلك النقطة فقط",()=>{
 S().os.end=1; S().os.int=0;
 R.begin("wall");
 R.feedText("int");
 const p=CV.snap(5000,0,[0,0],[0,0]);
 ok(!CV.UI.osnap||CV.UI.osnap.m==="int","لا تفوز نهاية وإن كانت مُفعّلة");
 R.cancel(true);
});

group("م٢أ · التجاوز لا يُقرأ داخل خطوة كيان ولا خطوة نص",()=>{
 R.begin("wall");
 const st=R.step();
 ok(st&&!st.ent,"خطوة النقطة الأولى ليست كياناً");
 R.cancel(true);
});

group("م٢أ · الإلغاء يمسح التجاوز",()=>{
 R.begin("wall");
 R.feedText("end");
 R.cancel(true);
 eq(R.T.osOv,null,"Esc يمسحه");
});

process.exit(summary()?1:0);
