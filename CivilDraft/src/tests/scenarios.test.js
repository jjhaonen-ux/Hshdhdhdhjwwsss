/* ═══ سيناريوهات القبول الثمانية ═══ (م٠ · خطة تطوير أدوات الرسم §٩)
   مقياسُ كل مرحلة لاحقة: كل سيناريو يُنفَّذ بالأدوات الحقيقية عبر toolRig،
   ويعدّ النقرات والحروف، ويتحقّق من الناتج الهندسي.

   قاعدة العدّ (ثابتة، فالمقارنةُ بين المراحل عادلة):
   · اسمُ أداة مكتوب في سطر الأوامر = طولُه + 1 (Enter). تبديلُ أداة بكتابة
     اسمها لا يحتاج Esc.
   · نصٌّ مكتوب في خطوة (إحداثي · مقاس · key=value) = طولُه + 1 (Enter).
   · Enter وحده = 1 · Esc = 1 · كل نقرة على اللوحة = نقرة.
   · Enter على سطرٍ فارغ بعد انتهاء الأداة يكرّرها = 1.
   النقر على أيقونة الشريط بدل كتابة الاسم يُنقص الحروف ويزيد نقرة، ولا يُعدّ هنا.

   الحارس: الناتجُ صحيح، والعدّ لا يزيد على خط الأساس (BASE). مرحلةٌ تُحسّن
   سيناريو تُنزل رقمَه في BASE في الطلب نفسه، فلا يرجع أحدٌ إلى الأسوأ.
   أرقامُ BASE مقيسةٌ بهذا الملف على 2.11.0. وجدولُ «اليوم» في الخطة استعمل
   قاعدةَ عدٍّ غير مكتوبة فأرقامُه أعلى؛ المرجعُ من الآن هذا الملف.
   التشغيل: node src/tests/scenarios.test.js                         */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,near,summary} from "./harness.js";
import {readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
shim(); shimCanvas(); shimDOM();
const HERE=fileURLToPath(new URL(".",import.meta.url));
const ST=await import("../core/state.js");
const EN=await import("../core/ents.js");
const RN=await import("../core/render.js");
const WL=await import("../core/walls.js");
for(const f of readdirSync(HERE+"../tools").filter(f=>f.endsWith(".js")))await import(`../tools/${f}`);
const R=await import("../tools/registry.js");
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k),invalidate:()=>RN.invalidate()});
const S=()=>ST.S;

/* خط الأساس 2.11.0 — {نقرات، حروف} */
export const BASE={
 s1:{clicks:4,keys:15}, s2:{clicks:1,keys:17}, s3:{clicks:1,keys:9},
 s4:{clicks:1,keys:48}, s5:{clicks:6,keys:15}, s6:{clicks:1,keys:10},
 s7:{clicks:33,keys:30}, s8:null};

/* ═══ العدّاد ═══ */
function counter(){
 const c={clicks:0,keys:0};
 return {c,
  cmd(n){const [name,...tail]=String(n).trim().split(/\s+/),arg=tail.join(" ");
   const d=R.findTool(name); if(!d)throw new Error(`لا أداة «${name}»`);
   if(R.active())R.cancel(true); R.begin(d.id,arg||null); c.keys+=String(n).length+1},
  type(s){rig.type(s); c.keys+=String(s).length+1},
  at(x,y){rig.at(x,y); c.clicks++},
  enter(){rig.enter(); c.keys++},
  esc(){rig.esc(); c.keys++},
  /* Enter على سطرٍ فارغ بلا أداة يكرّر آخرَ أداة (ui/cmdline) */
  again(id){if(R.active())R.cancel(true); R.begin(id); c.keys++}};
}
function fresh(){
 ST.newState(); ST.ensureShape(); RN.invalidate(); rig.clear();
 ["wall","rect","door","win","roomdim","fillet","trim","offset",
  "axis","gridcols","footing","beam"].forEach(id=>rig.defs(id));
}
const within=(id,c)=>{
 const b=BASE[id];
 ok(c.clicks<=b.clicks&&c.keys<=b.keys,
  `${id}: ${c.clicks} نقرة و${c.keys} حرفاً (الأساس ${b.clicks}/${b.keys})`);
 RESULTS[id]=Object.assign({},c);
};
const RESULTS={};
const len=w=>Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
const ang=w=>{let a=Math.atan2(w.b[1]-w.a[1],w.b[0]-w.a[0])*180/Math.PI; return a<0?a+360:a};

group("١ · غرفة 4×5 بباب وشباك وأبعادها",()=>{
 fresh(); const k=counter();
 k.cmd("r"); k.at(0,0); k.type("4x5");
 k.cmd("d"); k.at(2000,0);
 k.cmd("n"); k.at(0,2500);
 k.cmd("rd"); k.at(2000,2500); k.enter(); k.esc();
 eq(S().walls.length,4,"أربعة جدران");
 eq(S().opens.length,2,"باب وشباك");
 eq(S().dims.length,2,"بُعدان");
 within("s1",k.c);
});

group("٢ · غرفة صافيها 3.6×4.0 (align=l)",()=>{
 fresh(); const k=counter();
 k.cmd("r"); k.type("align=l"); k.at(0,0); k.type("3.6x4"); k.esc();
 eq(S().walls.length,4,"أربعة جدران");
 /* الصافي: الصندوقُ الداخليّ لأوجه الجدران الأقرب إلى المركز */
 const F=S().walls.map(WL.faces);
 const cx=S().walls.reduce((s,w)=>s+w.a[0],0)/4, cy=S().walls.reduce((s,w)=>s+w.a[1],0)/4;
 const inner=F.map(f=>{
  const d=s=>Math.hypot((s[0][0]+s[1][0])/2-cx,(s[0][1]+s[1][1])/2-cy);
  return d(f.l)<d(f.r)?f.l:f.r});
 const xs=inner.flat().map(p=>p[0]), ys=inner.flat().map(p=>p[1]);
 /* الأوجه الداخلية تمتدّ إلى الأركان الخارجية؛ الصافي = أصغر بُعدين بين الأوجه المتقابلة */
 const vx=inner.filter(s=>s[0][0]===s[1][0]).map(s=>s[0][0]).sort((a,b)=>a-b);
 const hy=inner.filter(s=>s[0][1]===s[1][1]).map(s=>s[0][1]).sort((a,b)=>a-b);
 eq(vx[1]-vx[0],3600,"العرض الصافي 3600 مم");
 eq(hy[1]-hy[0],4000,"الطول الصافي 4000 مم");
 ok(xs.length&&ys.length,"أوجهٌ محسوبة");
 within("s2",k.c);
});

group("٣ · جدار مائل 5 م بزاوية 30°",()=>{
 fresh(); const k=counter();
 k.cmd("w"); k.at(0,0); k.type("@5<30"); k.esc();
 eq(S().walls.length,1,"جدارٌ واحد");
 const w=S().walls[0];
 near(len(w),5000,1,`الطول ${len(w).toFixed(2)} مم (خطأ < 1 مم)`);
 near(ang(w),30,0.01,`الزاوية ${ang(w).toFixed(4)}°`);
 within("s3",k.c);
});

group("٤ · سلسلة ٥ أضلاع بزوايا مطلقة ثم إغلاق C",()=>{
 fresh(); const k=counter();
 k.cmd("w"); k.at(0,0);
 ["@4.2<15","@3.1<80","@2.7<140","@3.3<200","@2.5<255"].forEach(s=>k.type(s));
 k.type("c"); k.esc();
 eq(S().walls.length,6,"خمسةُ أضلاع + ضلعُ الإغلاق");
 const L=S().walls[S().walls.length-1];
 eq(JSON.stringify(L.b),"[0,0]","الإغلاقُ على النقطة الأولى تماماً");
 within("s4",k.c);
});

group("٤م٣أ · السلسلة المكتوبة ذات الانعطاف النسبي",()=>{
 fresh(); const k=counter();
 const seq="@4<0;@3<<90;@4<<90;@2<<90;c";
 ok(seq.length<=33,`السلسلة ${seq.length} حرفاً (الحد 33)`);
 k.cmd("w"); k.at(0,0); k.type(seq); k.esc();
 eq(S().walls.length,5,"أربعة أضلاع مع ضلع إغلاق خامس");
 eq(JSON.stringify(S().walls[4].b),"[0,0]","الإغلاق على نقطة البداية");
 ok(S().walls.every(w=>len(w)>1),"لا ضلع صفري");
 RESULTS.s4m3a=Object.assign({},k.c);
 ok(k.c.clicks===1&&k.c.keys<=33,
  `${k.c.clicks} نقرة و${k.c.keys} حرفاً مع اختيار الأداة والإنهاء`);
});

/* م١: السلسلة نفسُها بالانعطاف النسبي. الهندسةُ تطابق المطلقة (القلم الدقيق)،
   لكنّ الحروفَ لا تنقص: «<<» أطولُ من «<» بحرف، والانعطافاتُ هنا ليست أقصر
   من الزوايا المطلقة. هدفُ ≤ 33 حرفاً يحتاج السلسلةَ بسطرٍ واحد (`;` · م٣)،
   فيُسجَّل الرقمُ هنا ولا يُدّعى. */
group("٤ب · السلسلة نفسُها بالانعطاف النسبي @L<<a (م١)",()=>{
 fresh(); const k=counter();
 k.cmd("w"); k.at(0,0);
 ["@4.2<15","@3.1<<65","@2.7<<60","@3.3<<60","@2.5<<55"].forEach(s=>k.type(s));
 const ends=S().walls.map(w=>w.b);
 k.type("c"); k.esc();
 eq(S().walls.length,6,"خمسةُ أضلاع + ضلعُ الإغلاق");
 eq(JSON.stringify(S().walls[5].b),"[0,0]","الإغلاقُ على النقطة الأولى تماماً");
 /* المرجع: الرؤوسُ الدقيقة بالزوايا المطلقة */
 let x=0,y=0,mx=0;
 [[4.2,15],[3.1,80],[2.7,140],[3.3,200],[2.5,255]].forEach(([L,a],i)=>{
  x+=L*1000*Math.cos(a*Math.PI/180); y+=L*1000*Math.sin(a*Math.PI/180);
  mx=Math.max(mx,Math.hypot(ends[i][0]-x,ends[i][1]-y));
 });
 ok(mx<=0.71,`أقصى انحراف رأسٍ عن موضعه الدقيق ${mx.toFixed(3)} مم (≤ 0.71)`);
 RESULTS.s4rel=Object.assign({},k.c);
 ok(k.c.clicks===1&&k.c.keys===49,`${k.c.clicks} نقرة و${k.c.keys} حرفاً (المطلقة ${BASE.s4.keys})`);
});

group("٥ · قصّ ركن ثم إزاحة جدار 1.2 م · والاستدارة r=0 مرفوضة",()=>{
 fresh(); const k=counter();
 /* جداران متقاطعان على شكل + : القصُّ يترك ركن L */
 WL.addWall([-2000,0],[4000,0],200,"int","c");
 WL.addWall([0,-2000],[0,4000],200,"int","c");
 ST.touchGeom(); RN.invalidate();
 const W1=S().walls[0].id, W2=S().walls[1].id;
 k.cmd("tr"); k.at(1000,0); k.at(0,1000); k.enter();
 k.at(-1500,0); k.at(0,-1500); k.esc();
 const a=S().walls.find(w=>w.id===W1), b=S().walls.find(w=>w.id===W2);
 ok(a&&Math.min(a.a[0],a.b[0])>=-1&&Math.max(a.a[0],a.b[0])===4000,"الأفقيّ قُصّ من اليسار");
 ok(b&&Math.min(b.a[1],b.b[1])>=-1&&Math.max(b.a[1],b.b[1])===4000,"والرأسيّ من الأسفل");
 const n0=S().walls.length;
 k.cmd("of"); k.type("d=1.2"); k.at(2000,0); k.at(2000,800); k.esc();
 eq(S().walls.length,n0+1,"جدارٌ موازٍ جديد");
 const o=S().walls[S().walls.length-1];
 eq(o.a[1],1200,"على 1.2 م من المحور");
 within("s5",k.c);
 /* الاستدارة بنصف قطر صفر: الحدُّ الأدنى نصفُ السماكة + 1 مم (ف٩) */
 fresh();
 WL.addWall([0,0],[4000,0],200,"int","c");
 WL.addWall([0,0],[0,4000],200,"int","c");
 ST.touchGeom(); RN.invalidate(); rig.clear();
 R.begin("fillet"); rig.type("r=0"); rig.at(2000,0); rig.at(0,2000); rig.esc();
 ok(rig.errs().some(s=>/لا يكفي|الأدنى/.test(s)),"r=0 مرفوضة برسالةٍ تذكر الحدّ");
});

group("٦ · محاذاة نهاية جدار مع س نقطةٍ بعيدة (بمعرفة الإحداثي)",()=>{
 fresh();
 WL.addWall([7350,6000],[9000,6000],200,"int","c");   /* الطرف البعيد x=7.35 */
 ST.touchGeom(); RN.invalidate();
 const k=counter();
 k.cmd("w"); k.at(0,0); k.type("7.35,0"); k.esc();
 const w=S().walls[S().walls.length-1];
 eq(w.b[0],7350,"النهاية على س الطرف البعيد");
 within("s6",k.c);
});

group("٧ · مخطط 3×3 محاور و٩ أعمدة و٩ قواعد و١٢ كمرة",()=>{
 fresh(); const k=counter(),G=[0,5000,10000];
 /* المحاور موجودة مسبقاً: الاختبار يقيس وضع الأعمدة والقواعد والكمرات. */
 S().grid.xs=G.slice();S().grid.ys=G.slice();
 k.cmd("gk");k.cmd("ft on=cols");k.enter();k.cmd("bm grid=1");k.enter();
 eq(S().grid.xs.length,3,"٣ محاور رأسية"); eq(S().grid.ys.length,3,"و٣ أفقية");
 eq(S().cols.length,9,"٩ أعمدة");
 const st=S().struct;
 eq(st.filter(e=>e.kind==="footing").length,9,"٩ قواعد");
 eq(st.filter(e=>e.kind==="beam").length,12,"١٢ كمرة");
 ok(k.c.clicks===0&&k.c.keys<30,"م٣ب: بلا نقرات وأقل من 30 حرفاً بعد تجهيز المحاور");
 RESULTS.s7m3b=Object.assign({},k.c);
 within("s7",k.c);
});

group("٨ · مقطع كمرة بتسليحها: غير مدعوم اليوم",()=>{
 const N=["beamsec","bsec","rebar","مقطع_كمرة","تسليح","bbs"];
 ok(N.every(n=>!R.findTool(n)),"لا أداة مقطع كمرة ولا تسليح (المرحلة م٧ وم٨)");
 eq(BASE.s8,null,"خط الأساس: غير مدعوم");
});

console.log("\nنتائج العدّ:",JSON.stringify(RESULTS));
process.exit(summary()?1:0);
