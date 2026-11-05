/* M3B — القياس والأبعاد والفتحات والإنشاء الجماعي */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,near,summary} from "./harness.js";
shim();shimCanvas();
const DOC=shimDOM();
{const cv=DOC.createElement("canvas");cv.setAttribute("id","cv");DOC.body.appendChild(cv);}
const ST=await import("../core/state.js");
const {S,newState,clearHistory,undo}=ST;
const EN=await import("../core/ents.js");
const WL=await import("../core/walls.js");
const CL=await import("../core/cols.js");
const STR=await import("../core/struct.js");
const R=await import("../tools/registry.js");
for(const f of ["draw","annotate","openings","parts"])await import(`../tools/${f}.js`);
const TB=await import("../ui/touchbar.js");
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k)});
const fresh=()=>{
 if(R.active())R.cancel(true);
 newState();clearHistory();rig.clear();R.loadOpts();
 ["measure","dim","door","footing","beam","slab"].forEach(id=>rig.defs(id));
};
const wall=(a,b,t=200)=>WL.addWall(a,b,t,"int","c");
const col=(x,y,w=300,h=w)=>CL.addCol("rect",[x,y],w,h,0,"conc","");
const key=(id,index,k)=>{
 const d=R.findTool(id),b=TB.barFor(d,R.step(),0,{pt:false}).find(x=>x.k==="step:"+k);
 ok(!!b,`${id}/${k}: يظهر زر اللمس السياقي`);
 if(b)TB.runTouch(b.k);
};

group("القياس — الزاوية والعنصر واللمس",()=>{
 fresh();R.setOpt("measure","mode","angle");R.setOpt("measure","keep",1);
 R.begin("measure");rig.at(0,0);rig.at(1000,0);rig.at(0,1000);
 eq(S.dims.length,1,"تُحفظ الزاوية كبُعد");
 eq(S.dims[0].kind,"ang","أُنشئ بُعد زاوي");
 ok(rig.said(/الزاوية 90\.00°.*المكمّلة 270\.00°/),"تُعرض الزاوية الداخلية والمكمّلة");
 fresh();wall([0,0],[4000,0]);
 R.setOpt("measure","mode","ent");R.begin("measure");rig.at(2000,0);
 ok(rig.said(/الطول 4\.000 م/),"قياس طول العنصر بالنقر عليه");
 fresh();R.begin("measure");key("measure",0,"s");
 eq(R.OPT.measure.mode,"angle","زر S يبدّل وضع القياس إلى الزاوية");
});

group("البعد — النوع التلقائي والنقر على جدار أو عمود",()=>{
 fresh();const w=wall([0,0],[5000,0]);
 R.begin("dim");rig.at(2500,0);
 eq(R.T.i,2,"نقرة الجدار تتجاوز الطرفين وتنتقل إلى موضع البعد");
 rig.at(2500,1200);eq(S.dims.length,1,"أُنشئ البعد");
 eq(S.dims[0].kind,"al","يقيس النقر طول وجه الجدار");
 fresh();const c=col(0,0,600,400);
 R.begin("dim");rig.at(200,0);rig.at(200,1200);
 eq(S.dims.length,1,"يُنشأ بُعد العمود بالنقر عليه");
 near(Math.hypot(S.dims[0].b[0]-S.dims[0].a[0],S.dims[0].b[1]-S.dims[0].a[1]),600,2,"يُقاس عرض العمود");
 fresh();R.setOpt("dim","kind","auto");R.begin("dim");
 rig.at(0,0);rig.at(4000,0);rig.at(2000,1200);
 eq(S.dims[0].kind,"h","يختار التلقائي الأفقي بحسب جهة سحب موضع الخط");
 fresh();R.begin("dim");rig.at(0,0);rig.at(1000,0);
 key("dim",2,"b");eq(R.OPT.dim.kind,"v","يدوّر B نوع البعد");
});

group("الباب — مرجع الجنب الصافي والقلب",()=>{
 fresh();const h=wall([0,0],[5000,0]),x=wall([0,-1000],[0,1000]);
 R.setOpt("door","ref","jamb");R.setOpt("door","at","0.10");
 R.begin("door");rig.at(1000,0);
 eq(S.opens.length,1,"وُضع الباب");
 eq(S.opens[0].s,650,"0,10 m est mesuré depuis la face et le bord proche");
 eq(S.opens[0].swing,"left","جهة الفتح الافتراضية");
 key("door",0,"f");eq(R.OPT.door.swing,"right","يقلب F جهة الفتح");
 key("door",0,"b");eq(R.OPT.door.hinge,"end","B retourne la charnière");
 fresh();wall([0,0],[5000,0]);wall([0,-1000],[0,1000]);wall([5000,-1000],[5000,1000]);
 R.setOpt("door","at","cc");R.begin("door");rig.at(1000,0);
 eq(S.opens[0].s,2500,"يختار cc منتصف المسافة الصافية بين الجدارين");
});

group("footing on=cols — معاينة وتراجع ذرّي",()=>{
 fresh();S.grid.xs=[0,3000,6000];S.grid.ys=[0,4000,8000];
 for(const x of S.grid.xs)for(const y of S.grid.ys)col(x,y);
 R.setOpt("footing","on","cols");R.begin("footing");
 eq(R.step().confirm,1,"القواعد تظهر في خطوة تأكيد");
 ok(R.preview().length>0,"معاينة حدود القواعد قبل الإنشاء");
 rig.enter();eq(S.struct.filter(x=>x.kind==="footing").length,9,"تسع قواعد أنشئت");
 undo();eq(S.struct.length,0,"تراجع واحد يزيل المجموعة كلها");
 fresh();col(0,0);R.setOpt("footing","on","cols");rig.pick([{k:"col",id:S.cols[0].id}]);
 R.begin("footing");rig.enter();eq(S.struct.length,1,"التحديد يقيّد الإنشاء للأعمدة المختارة");
});

group("beam grid — كمرات تلقائية على المحاور",()=>{
 fresh();S.grid.xs=[0,3000,6000];S.grid.ys=[0,4000,8000];
 for(const x of S.grid.xs)for(const y of S.grid.ys)col(x,y);
 R.setOpt("beam","grid",1);R.begin("beam");
 eq(R.T.ctx.targets.length,12,"اثنتا عشرة وصلة بين الأعمدة المتجاورة");
 ok(R.preview().length>=48,"معاينة الكمرات قبل التأكيد");
 rig.enter();eq(S.struct.filter(x=>x.kind==="beam").length,12,"تأكيد إنشاء الكمرات");
 undo();eq(S.struct.length,0,"التراجع يزيل كامل الدفعة");
});

group("slab pick — التقاط حلقة الجدران أو الكمرات",()=>{
 fresh();
 const Q=[[0,0],[4000,0],[4000,3000],[0,3000]];
 Q.forEach((p,i)=>wall(p,Q[(i+1)%4]));
 R.setOpt("slab","pick",1);R.begin("slab");rig.at(2000,1500);
 eq(S.struct.filter(x=>x.kind==="slab").length,1,"بلاطة من حلقة الجدران بنقرة");
 near(STR.strArea(S.struct.find(x=>x.kind==="slab")),10.64e6,100,"المساحة الصافية داخل وجوه الجدران 10.64 م²");
 fresh();
 const P=[[0,0],[4000,0],[4000,3000],[0,3000]];
 P.forEach((p,i)=>STR.addBeam(p,P[(i+1)%4],200,400,"conc",""));
 R.setOpt("slab","pick",1);R.begin("slab");rig.at(2000,1500);
 eq(S.struct.filter(x=>x.kind==="slab").length,1,"بلاطة من حلقة الكمرات المغلقة");
});

group("M3B touch parity",()=>{
 fresh();R.begin("measure");key("measure",0,"s");eq(R.OPT.measure.mode,"angle","زر S يمر عبر معالج الخطوة");
 fresh();R.begin("dim");rig.at(0,0);rig.at(1000,0);key("dim",2,"b");
 ok(true,"زر B موجود في خطوة موضع البعد");
 fresh();R.begin("door");key("door",0,"f");key("door",0,"b");
 eq(R.OPT.door.swing,"right","زر جهة الفتح يعمل");
 eq(R.OPT.door.hinge,"end","زر المفصلة يعمل");
});

process.exit(summary());