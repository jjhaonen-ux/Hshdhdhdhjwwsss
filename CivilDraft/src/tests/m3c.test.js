/* M3C — إكمال المرحلة ٣: ما بقي بعد م٣أ/م٣ب
   break للخطّ المتعدّد · رسالة السلسلة · معاينات القوسي وإسقاط cen · رسائل
   الرفض بقيَمها · قياس S/س ووجها الجدار · بُعد حيّ · cc وswing=cursor ·
   تداخل القواعد بمقداره · حقول اللمس (R · زاوية · م²) */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,near,summary} from "./harness.js";
shim();shimCanvas();
const DOC=shimDOM();
{const cv=DOC.createElement("canvas");cv.setAttribute("id","cv");DOC.body.appendChild(cv);}
const ST=await import("../core/state.js");
const {S,newState,clearHistory,undo}=ST;
const EN=await import("../core/ents.js");
const WL=await import("../core/walls.js");
const CL=await import("../core/cols.js");
const PL=await import("../core/plines.js");
const MD=await import("../core/modify.js");
const R=await import("../tools/registry.js");
for(const f of ["draw","annotate","openings","parts","modify"])await import(`../tools/${f}.js`);
const TB=await import("../ui/touchbar.js");
const DI=await import("../ui/dyninput.js");
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k)});
const fresh=()=>{
 if(R.active())R.cancel(true);
 newState();clearHistory();rig.clear();R.loadOpts();
 ["wall","arcwall","rect","pline","measure","dim","door","footing","beam"].forEach(id=>rig.defs(id));
};
const wall=(a,b,t=200)=>WL.addWall(a,b,t,"int","c");
const col=(x,y,w=300)=>CL.addCol("rect",[x,y],w,w,0,"conc","");
const txt=(id,g)=>(R.findTool(id).prev(R.T.ctx,g)||[]).filter(x=>x.t==="tx").map(x=>x.s).join("|");
const totLen=()=>S.plines.reduce((s,p)=>s+PL.plineLen(p),0);

group("break — الخطّ المتعدّد",()=>{
 fresh();const a=PL.addPline([[0,0],[2000,0],[2000,2000]],{bulge:[0,0.5]});
 const L0=totLen();
 R.begin("break");rig.type(a.id);rig.at(1000,0);R.cancel(true);
 eq(S.plines.length,2,"قُطع إلى جزءين");
 near(totLen(),L0,0.5,"الطول الكلّي محفوظ");
 eq(S.plines[0].id,a.id,"الجزء الأول يبقى بمعرّف الأصل");
 R.begin("break");rig.type(S.plines[1].id);rig.at(2400,1000);R.cancel(true);
 eq(S.plines.length,3,"الضلع القوسي يُقسَم");
 near(totLen(),L0,0.5,"القوس المقسوم يحفظ الطول الكلّي");
 ok(S.plines[1].bulge&&S.plines[2].bulge,"الجزءان القوسيان يحملان انحناءً");
 undo();undo();eq(S.plines.length,1,"التراجع ذرّي ويعيد الأصل");
 deepBul(S.plines[0].bulge,[0,0.5]);
 fresh();const c=PL.addPline([[0,0],[3000,0],[3000,3000],[0,3000]],{closed:1});
 R.begin("break");rig.type(c.id);rig.at(1500,0);R.cancel(true);
 eq(S.plines.length,1,"المغلق يُفتح خطّاً واحداً");
 eq(S.plines[0].closed,0,"لم يعد مغلقاً");
 eq(S.plines[0].pts.length,6,"يبدأ وينتهي عند نقطة القطع");
 fresh();const d=PL.addPline([[0,0],[3000,0]]);
 R.begin("break");rig.type(d.id);rig.at(1,0);
 ok(rig.said(/طرف الخطّ/),"القطع عند الطرف مرفوض بسببه");
 eq(S.plines.length,1,"لم يُقطع شيء");
 R.cancel(true);
 fresh();wall([0,0],[4000,0]);R.begin("break");rig.at(2000,0);rig.at(2000,0);R.cancel(true);
 eq(S.walls.length,2,"قطع الجدار ما زال يعمل");
});
function deepBul(a,b){ok(a&&a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<1e-9),"الانحناء الأصلي مستعاد")}

group("breakPline — الدالّتان مباشرةً (core/modify.js وcore/plines.js)",()=>{
 fresh();const a=PL.addPline([[0,0],[4000,0]]);
 const r=MD.breakPline(a.id,[1000,0]);
 eq(S.plines.length,2,"الغلاف الذرّي يقسم الخطّ");
 near(r.a+r.b,4000,0.5,"مجموع الجزءين يساوي الأصل");
 undo();eq(S.plines.length,1,"تراجعٌ واحد");
 fresh();const b=PL.addPline([[0,0],[4000,0]]);
 const q=PL.breakPline(b,3000,0);
 eq(q.nid&&S.plines.length,2,"الدالّة الأساسية تقسم على مكانها");
 let msg="";try{MD.breakPline("PL999",[0,0])}catch(e){msg=e.message}
 ok(/غير موجود/.test(msg),"معرّف غير موجود: رفض بسببه");
});

group("سلسلة الجدار — رسالة السبب وعدد ما رُسم",()=>{
 fresh();R.begin("wall");rig.at(0,0);rig.type("@4<0;@3<<90;@4<<;@3<<90");
 eq(S.walls.length,2,"ما رُسم قبل الجزء الفاسد يبقى");
 ok(rig.errs().some(e=>/الجزء ٣: «@4<<» زاوية ناقصة — رُسم جزءان/.test(e)),"رسالة واحدة: الرقم والنص والسبب والعدد");
 R.cancel(true);
});

group("الجدار القوسي — المعاينة وcen وزاوية المركز وR",()=>{
 fresh();R.setOpt("arcwall","by","cen");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);
 ok(/R 3\.00 م · 90\.0°/.test(txt("arcwall",[0,3000])),"معاينة cen تعرض R والزاوية الصحيحين");
 ok(/قوس 4\.71 م/.test(txt("arcwall",[0,3000])),"وتُعرض طول القوس");
 rig.at(0,3500);
 eq(S.walls.length,1,"النهاية غير المطابقة لنصف القطر تُسقَط على الدائرة");
 ok(rig.said(/أُسقطت على الدائرة/),"يُعلَن الإسقاط ولا يُصحَّح صمتاً");
 fresh();R.setOpt("arcwall","by","cen");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);rig.type("a=90");
 eq(S.walls.length,1,"a=90 ينشئ القوس بزاوية مركزية");
 near(Math.hypot(S.walls[0].b[0]-0,S.walls[0].b[1]-3000),0,2,"النهاية على الدائرة عند 90°");
 fresh();R.setOpt("arcwall","by","cen");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);rig.type("a=0");
 eq(S.walls.length,0,"زاوية صفرية مرفوضة");
 R.cancel(true);
 fresh();R.setOpt("arcwall","by","r");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);rig.type("R2");
 eq(S.walls.length,1,"R2 تُقبل بالبادئة");
 fresh();R.setOpt("arcwall","by","r");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);rig.type("1.2");
 ok(rig.errs().some(e=>/أصغر من نصف الوتر/.test(e)),"R أصغر من نصف الوتر يُرفض بقيمته");
 R.cancel(true);
 fresh();R.setOpt("arcwall","by","r");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);
 ok(/اكتب R/.test(txt("arcwall",[1500,-800])),"معاينة r تُرشد لكتابة R");
 R.cancel(true);
});

group("المستطيل — رسالة المساحة بقيمتها",()=>{
 fresh();R.begin("rect");rig.at(0,0);rig.type("A0.1:1");
 ok(rig.errs().some(e=>/المساحة 0\.1 م² تعطي ضلعاً 0\.316 م — الأدنى 0\.500 م/.test(e)),"المساحة والضلع الناتج والحدّ");
 rig.type("0.3x4");
 ok(rig.errs().some(e=>/المقاس \S*0\.300×4\.000\S* م — الأدنى 0\.500 م/.test(e)),"المقاس والحدّ (الأرقام معزولة الاتجاه)");
 R.cancel(true);
});

group("القياس — S/س والعنصر وزاوية حيّة",()=>{
 fresh();R.begin("measure");rig.type("s");eq(R.OPT.measure.mode,"angle","S: مسار ← زاوية");
 rig.type("س");eq(R.OPT.measure.mode,"ent","س: زاوية ← عنصر");
 rig.type("s");eq(R.OPT.measure.mode,"path","S: عنصر ← مسار (دورة كاملة)");
 R.cancel(true);
 fresh();R.setOpt("measure","mode","angle");R.begin("measure");rig.at(0,0);rig.at(1000,0);
 ok(/90\.00° · المكمّلة 270\.00°/.test(txt("measure",[0,1000])),"معاينة الزاوية الحيّة");
 R.cancel(true);
 fresh();const w=WL.addWall([0,0],[4000,0],200,"int","c");
 R.setOpt("measure","mode","ent");R.begin("measure");rig.at(2000,0);
 ok(rig.said(/الوجهان 4\.000 م/),"وجها الجدار المستقيم");
 R.cancel(true);
 fresh();const A=WL.addWall([0,0],[4000,0],200,"int","c");
 R.setOpt("measure","mode","ent");
 fresh();col(0,0);R.setOpt("measure","mode","ent");R.begin("measure");rig.at(0,0);
 ok(rig.errs().some(e=>/ليس له طول \(عمود\)/.test(e)),"العمود: رفض بسببه واسمه");
 R.cancel(true);
});

group("البُعد — قيمة ونوع في المعاينة",()=>{
 fresh();R.begin("dim");rig.at(0,0);rig.at(4000,0);
 ok(/أفقي 4\.00 م/.test(txt("dim",[2000,1000])),"المعاينة تعرض نوع البُعد وقيمته الحيّة");
 R.cancel(true);
});

group("الفتحات — cc وswing=cursor والأبعاد المؤقتة",()=>{
 fresh();wall([0,0],[5000,0]);wall([0,-1000],[0,1000]);wall([700,-1000],[700,1000]);
 R.setOpt("door","at","cc");R.setOpt("door","w","0.9");R.begin("door");rig.at(350,0);
 ok(rig.errs().some(e=>/المقطع الصافي 0\.500 م أقل من عرض الباب 0\.900 م/.test(e)),"رسالة المقطع الصافي بقيمتيه");
 R.cancel(true);
 fresh();wall([0,0],[5000,0]);
 R.setOpt("door","swing","cursor");R.begin("door");
 R.T.hover=[1000,400];rig.at(1000,0);
 eq(S.opens[0]&&S.opens[0].swing,"left","المؤشر فوق المسار ⇒ يسار");
 R.cancel(true);
 fresh();wall([0,0],[5000,0]);
 R.setOpt("door","swing","cursor");R.begin("door");
 R.T.hover=[3000,-400];rig.at(3000,0);
 eq(S.opens[0]&&S.opens[0].swing,"right","المؤشر تحت المسار ⇒ يمين");
 R.cancel(true);
 fresh();wall([0,0],[5000,0]);wall([0,-1000],[0,1000]);wall([5000,-1000],[5000,1000]);
 R.begin("door");R.T.hover=[2500,0];
 const items=R.findTool("door").prev(R.T.ctx,[2500,0])||[];
 ok(items.filter(x=>x.t==="tx").length>=3,"أبعاد مؤقتة إلى الوجهين مع نص الباب");
 R.cancel(true);
});

group("الإنشائي — تداخل القواعد ومحاور الكمرات",()=>{
 fresh();col(0,0);col(1000,0);R.setOpt("footing","on","cols");R.setOpt("footing","w","1.5");
 R.begin("footing");
 ok(rig.said(/القاعدتان تحت K\d+ وK\d+ تتداخلان بـ0\.500 م — قلّل العرض/),"تداخل القاعدتين بمقداره");
 eq(S.struct.length,0,"لا شيء أُنشئ");
 if(R.active())R.cancel(true);
 fresh();S.grid.xs=[0,3000,6000];S.grid.ys=[0,4000];
 [[0,0],[3000,0],[0,4000],[3000,4000]].forEach(p=>col(...p));
 R.setOpt("beam","grid",1);R.begin("beam");
 ok(rig.said(/بلا أعمدة/),"محور بلا أعمدة: رسالة صريحة");
 if(R.active())R.cancel(true);
 fresh();S.grid.xs=[0,3000,6000];S.grid.ys=[0,4000];
 [[0,0],[3000,0],[0,4000],[3000,4000],[6000,0]].forEach(p=>col(...p));
 R.setOpt("beam","grid",1);R.begin("beam");
 ok(rig.said(/عليه عمود واحد فقط/),"محور بعمود واحد: رسالة صريحة");
 if(R.active())R.cancel(true);
});

group("اللمس — حقول R والزاوية والمساحة",()=>{
 fresh();R.begin("rect");rig.at(0,0);
 const F=TB.measureFor(R.step());
 eq(F&&F.map(f=>f.k).join(""),"whrA","المستطيل: عرض · طول · زاوية · م²");
 eq(TB.composeBox(["3.6","4","30",""]),"3.6x4<30","الزاوية تركّب مقاساً مائلاً");
 eq(TB.composeBox(["","","","20"]),"A20:1","م² وحدها ⇒ مربّع");
 eq(TB.composeBox(["4","","","20"]),"A20x4","م²+ضلع");
 eq(TB.composeBox(["5","4","","20"]),"A20:1.25","م²+نسبة");
 eq(TB.composeBox(["3","4","",""]),"@3,4","المقاس العادي بلا تغيير");
 R.cancel(true);
 fresh();R.begin("rect");rig.type("3x3");R.cancel(true);
 fresh();R.begin("rect");rig.at(0,0);rig.type("A20:1.25");
 eq(S.walls.length,4,"A20:1.25 تنشئ مستطيلاً بأربعة جدران");
 R.cancel(true);
 fresh();R.setOpt("arcwall","by","r");R.begin("arcwall");rig.at(0,0);rig.at(3000,0);
 const G=TB.measureFor(R.step());
 eq(G&&G[0].k,"R","خطوة نصف القطر: حقل R بدل النص الحرّ");
 eq(DI.composeVals(G,["3"]),"3","R يُركَّب قيمةً مباشرة");
 R.cancel(true);
 fresh();R.begin("pline");rig.at(0,0);rig.at(1000,0);rig.type("q");
 const H2=TB.measureFor(R.step());
 eq(H2&&H2[0].k,"R","وضع القوس المماسّي: حقل R");
 eq(DI.composeVals(H2,["4"]),"r=4","يركّب r=4");
 rig.type("l");ok(!(TB.measureFor(R.step())||[]).some(f=>f.k==="R"),"المستقيم: لا حقل R");
 R.cancel(true);
});
process.exit(summary());
