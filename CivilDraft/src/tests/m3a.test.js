/* M3A — أدوات الرسم الأساسية */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,near,deep,summary} from "./harness.js";
shim();shimCanvas();shimDOM();
const ST=await import("../core/state.js");
const {S,newState,undo,clearHistory}=ST;
const W=await import("../core/walls.js");
const PL=await import("../core/plines.js");
const EN=await import("../core/ents.js");
const R=await import("../tools/registry.js");
await import("../tools/draw.js");
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k)});
const reset=()=>{if(R.active())R.cancel(true);newState();clearHistory();rig.clear();R.loadOpts();for(const id of ["wall","arcwall","rect","pline"])rig.defs(id)};

 group("wall — المحاذاة والسلسلة المكتوبة",()=>{
  reset();R.begin("wall");rig.at(0,0);rig.type("f");rig.at(4000,0);
  eq(S.walls[0].align,"l","F يقلب المحاذاة للجدار التالي");
  rig.type("ف");rig.at(4000,3000);eq(S.walls[1].align,"r","المفتاح العربي ف يعمل أيضاً");
  rig.esc();
  reset();R.begin("wall");rig.at(0,0);
  rig.type("@4<0;@3<<90;@4<<90;@3<<90;c");
  eq(S.walls.length,4,"الأضلاع الأربعة تصل إلى نقطة الإغلاق دون ضلع صفري");
  deep(S.walls.map(w=>w.b),[[4000,0],[4000,3000],[0,3000],[0,0]],"رؤوس السلسلة متراكمة بالترتيب");
  ok(!rig.errs().length,"لا أخطاء في السلسلة");rig.esc();
 });

group("arcwall — نصف القطر والمركز والمماس",()=>{
 reset();R.setOpt("arcwall","by","r");R.begin("arcwall");rig.at(0,0);rig.at(4000,0);rig.ghost(2000,1000);rig.type("3");
 ok(!!S.walls[0]?.bulge,"نصف القطر ينشئ قوساً");near(W.arcParams(S.walls[0]).R,3000,2,"R=3 م دقيق");rig.esc();
 reset();R.setOpt("arcwall","by","cen");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);rig.at(0,3000);
 near(Math.abs(W.arcParams(S.walls[0]).sweep),Math.PI/2,1e-6,"وضع المركز يرسم 90°");rig.esc();
 reset();W.addWall([0,0],[3000,0],150,"int","c");R.setOpt("arcwall","by","tan");R.begin("arcwall");rig.at(3000,3000);
 ok(!!S.walls[1]?.bulge,"المماس يبدأ من نهاية الجدار السابق");near(W.arcParams(S.walls[1]).R,1500,2,"نصف قطر المماس صحيح");rig.esc();
});

group("rect — مركز ودوران ومساحة وثلاث نقاط ومخرجات",()=>{
 reset();R.setOpt("rect","base","center");R.begin("rect");rig.at(0,0);rig.type("3.6x4<30");
 eq(S.walls.length,4,"مستطيل من المركز");
 const w=S.walls[0];near(W.wallLen(w),3600,2,"العرض 3.6م");
 const all=S.walls.flatMap(x=>[x.a,x.b]);
 near(all.reduce((s,p)=>s+p[0],0)/all.length,0,1,"المركز حول الأصل");rig.esc();
 reset();R.begin("rect");rig.at(0,0);rig.type("A20:1.25");
 near(Math.max(...S.walls.map(x=>x.a[0]))-Math.min(...S.walls.map(x=>x.a[0])),5000,2,"A20:1.25 يعطي 5×4");rig.esc();
 reset();R.setOpt("rect","by","3p");R.begin("rect");rig.at(0,0);rig.at(4000,0);rig.at(4000,3000);
 eq(S.walls.length,4,"المستطيل بثلاث نقاط");near(W.wallLen(S.walls[0]),4000,1,"الضلع الأول من اتجاه النقر");rig.esc();
 reset();R.setOpt("rect","as","pline");R.begin("rect");rig.at(0,0);rig.type("3x4");
 eq(S.plines.length,1,"as=pline ينتج خطاً متعدد الأضلاع مغلقاً");eq(S.plines[0].closed,1,"الخط المتعدد مغلق");rig.esc();
 reset();R.setOpt("rect","as","slab");R.begin("rect");rig.at(0,0);rig.type("3x4");
 eq(S.struct[0]?.kind,"slab","as=slab ينتج بلاطة");rig.esc();
});

group("pline — أقواس مماسية ونصف قطر وثلاث نقاط",()=>{
 reset();R.begin("pline");rig.at(0,0);rig.at(1000,0);rig.type("q");rig.at(2000,1000);rig.enter();
 near(S.plines[0].bulge[1],Math.tan(Math.PI/8),1e-4,"Q ينشئ قوساً مماسياً");rig.esc();
 reset();R.begin("pline");rig.at(0,0);rig.at(1000,0);rig.type("r=1");rig.ghost(1500,500);rig.at(2000,0);rig.enter();
 near(Math.abs(S.plines[0].bulge[1]),Math.tan(Math.PI/12),1e-4,"r=1 يحدد نصف القطر");rig.esc();
 reset();R.begin("pline");rig.at(0,0);rig.type("s");rig.at(500,500);rig.at(1000,0);rig.enter();
 ok(!!S.plines[0]?.bulge?.[0],"S ينشئ قوساً من ثلاث نقاط");rig.esc();
});

group("pjoin — دمج الأطراف",()=>{
 reset();const a=PL.addPline([[0,0],[1000,0]]),b=PL.addPline([[1000,0],[2000,0]]);
 R.begin("pjoin");rig.type(a.id);rig.type(b.id);
 eq(S.plines.length,1,"اختفى الأصلان وبقي خط واحد");deep(S.plines[0].pts,[[0,0],[1000,0],[2000,0]],"دمج الأطراف مرتب");
 undo();eq(S.plines.length,2,"التراجع يعيد الخطين الأصليين");
});

group("step keys — بلا تصادم ومعادل لمس",async()=>{
 const aliases=new Set(R.toolList().flatMap(d=>(d.alias||"").split(/\s+/).map(x=>x.toLowerCase())));
 for(const k of ["f","e","q","l","s"])ok(!aliases.has(k),`${k.toUpperCase()} ليس اسماً مستعاراً لأداة`);
 const TB=await import("../ui/touchbar.js");
 const w=R.findTool("wall");ok(TB.barFor(w,w.steps[1],0,{pt:false}).some(x=>x.k==="step:f"),"زر لمس المحاذاة يظهر في خطوة الجدار");
 const p=R.findTool("pline");ok(TB.barFor(p,p.steps[1],0,{pt:false}).filter(x=>x.k.startsWith("step:")).length>=3,"أزرار قوس/مستقيم/S للخط المتعدد");
});

process.exit(summary());
