/* ═══ م١ب · القلم الدقيق: لا تراكم في السلاسل المكتوبة ═══ (البوابة ب٠-١)
   النقطةُ المكتوبة تحفظ موضعها غير المقرَّب، والتالية تُحسب منه ثم تُقرَّب.
   · المسار العشوائي ذو ١٠٠ ضلع (البذرة 20261029 وخمس بذورٍ أخرى): انحراف
     آخر رأس ≤ 1 مم، وكلُّ رأسٍ ≤ 0.71 مم عن موضعه الدقيق.
   · خطأ الضلع: كلٌّ من رأسيه ≤ 0.71 مم فحدّه 1.41 مم (√2·0.5) لا 0.71 —
     ثمنٌ معلوم للقلم الدقيق، يُثبَّت هنا كي لا يسوء.
   · نقرةٌ تقطع القلم الدقيق: ما بعدها يُحسب من النقطة المخزَّنة الصحيحة.
   · ١٠٠ ضلع منعطفة @L<<a: الانحراف ≤ 1 مم أيضاً (الاتجاه من المواضع الدقيقة).
   · C يغلق على النقطة الأولى تماماً كما كان.
   التشغيل: node src/tests/chain-drift.test.js                        */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,summary} from "./harness.js";
import {readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
shim(); shimCanvas(); shimDOM();
const HERE=fileURLToPath(new URL(".",import.meta.url));
const ST=await import("../core/state.js");
const RN=await import("../core/render.js");
for(const f of readdirSync(HERE+"../tools").filter(f=>f.endsWith(".js")))await import(`../tools/${f}`);
const R=await import("../tools/registry.js");
const rig=toolRig(R,{invalidate:()=>RN.invalidate()});
const S=()=>ST.S;
const D2R=Math.PI/180;
function rnd(seed){let t=seed>>>0; return()=>{t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t);
 r^=r+Math.imul(r^r>>>7,61|r); return((r^r>>>14)>>>0)/4294967296}}
function fresh(){ST.newState(); ST.ensureShape(); RN.invalidate(); rig.clear(); rig.defs("wall")}
const wl=w=>Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
export const MEAS={};

function run(seed,rel){
 fresh();
 const r=rnd(seed);
 R.begin("wall"); rig.at(0,0);
 let ex=[0,0], A=0, mv=0, mL=0;
 for(let i=0;i<100;i++){
  const L=+(0.5+r()*6).toFixed(3), a=+(r()*360).toFixed(2);
  const t=(rel&&i)?+(a-180).toFixed(2):a;     /* انعطافٌ بين -180 و180 */
  A=(rel&&i)?A+t:t;
  rig.type(rel&&i?`@${L}<<${t}`:`@${L}<${t}`);
  ex=[ex[0]+L*1000*Math.cos(A*D2R), ex[1]+L*1000*Math.sin(A*D2R)];
  const w=S().walls[S().walls.length-1];
  mv=Math.max(mv,Math.hypot(w.b[0]-ex[0],w.b[1]-ex[1]));
  mL=Math.max(mL,Math.abs(wl(w)-L*1000));
 }
 const n=S().walls.length;
 const tip=S().walls[n-1].b;
 const drift=Math.hypot(tip[0]-ex[0],tip[1]-ex[1]);
 rig.type("c");
 const c=S().walls[S().walls.length-1];
 const closed=JSON.stringify(c.b)==="[0,0]"&&S().walls.length===101;
 rig.esc();
 return {n,drift,mv,mL,closed};
}

group("المسار العشوائي المرجعي (بذرة 20261029) — معيار ب٠-١",()=>{
 const m=run(20261029,false);
 eq(m.n,100,"١٠٠ ضلع");
 ok(m.drift<=1,`انحراف آخر رأس ${m.drift.toFixed(3)} مم ≤ 1 مم (كان 2.899 قبل م١ب)`);
 ok(m.mv<=0.71,`أقصى انحراف رأس ${m.mv.toFixed(3)} مم ≤ 0.71`);
 ok(m.mL<=1.42,`أقصى خطأ ضلع ${m.mL.toFixed(3)} مم ≤ 1.41`);
 ok(m.closed,"C يغلق على (0,0) والضلع 101");
 MEAS.ref=m;
});

group("خمس بذورٍ أخرى",()=>{
 [1,2,3,42,777].forEach(sd=>{
  const m=run(sd,false);
  ok(m.n===100&&m.drift<=1&&m.mv<=0.71&&m.mL<=1.42&&m.closed,
   `بذرة ${sd}: انحراف ${m.drift.toFixed(3)} · رأس ${m.mv.toFixed(3)} · ضلع ${m.mL.toFixed(3)} مم`);
 });
});

group("١٠٠ ضلع منعطفة @L<<a",()=>{
 const m=run(20261029,true);
 eq(m.n,100,"١٠٠ ضلع");
 ok(m.drift<=1,`انحراف آخر رأس ${m.drift.toFixed(3)} مم ≤ 1 مم`);
 ok(m.mv<=0.71,`أقصى انحراف رأس ${m.mv.toFixed(3)} مم ≤ 0.71`);
 ok(m.closed,"C يغلق تماماً");
 MEAS.rel=m;
});

group("النقرة تقطع القلم الدقيق",()=>{
 /* 3000.4 تُخزَّن 3000؛ والتالية من الموضع الدقيق 6000.8 ⇒ 6001،
    ومن نقرةٍ على [3000,0] نفسها 6000.4 ⇒ 6000 */
 fresh();
 R.begin("wall"); rig.at(0,0);
 rig.type("@3.0004,0"); rig.type("@3.0004,0");
 eq(JSON.stringify(S().walls[1].b),"[6001,0]","مكتوبٌ بعد مكتوب: من الموضع الدقيق");
 rig.esc();
 fresh();
 R.begin("wall"); rig.at(0,0);
 rig.type("@3.0004,0"); rig.at(3000,3000);    /* نقرةٌ: ضلعٌ رأسيّ */
 rig.type("@0,-3");                             /* يعود إلى [3000,0] بلا موضعٍ دقيق */
 rig.type("@3.0004,0");
 eq(JSON.stringify(S().walls[S().walls.length-1].b),"[6000,0]","بعد نقرة: من النقطة المخزَّنة الصحيحة");
 rig.esc();
 fresh();
 R.begin("wall"); rig.at(0,0);
 rig.type("@3.0004,0"); rig.type("u"); rig.type("@3.0004,0");
 eq(JSON.stringify(S().walls[0].b),"[3000,0]","U ثم إعادة: الأساس (0,0) صحيح");
 rig.esc();
});

console.log("القياسات:",JSON.stringify(MEAS,(k,v)=>typeof v==="number"?+v.toFixed(3):v));
summary();
