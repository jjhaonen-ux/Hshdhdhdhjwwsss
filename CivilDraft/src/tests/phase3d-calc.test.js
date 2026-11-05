/* ═══ المرحلة ٣-د من خطّة التطوير · المياه والكهرباء والدرج والربط بالمخطّط (v2.10.0) ═══
   ١ · اثنتا عشرة حاسبة جديدة ⇒ المجموع 42، بثلاث مجموعات جديدة (المياه · الكهرباء · الدرج)
   ٢ · كلُّ حالةٍ مرجعية تُطابَق ضمن سماكتها
   ٣ · الأدوات المصدَّرة والوحدات الجديدة
   ٤ · الربط بالمخطّط: الغرفة ⇒ التكييف والإضاءة · البلاطة ⇒ الحديد · الدرج ⇒ التصميم
   ٥ · الاندماج: البحث والدليل والنصّ المنسوخ وبلا اتصال وخارج الإقلاع
   التشغيل:  node src/tests/phase3d-calc.test.js */
import {shim,group,ok,eq,near,deep,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
shim();
const E=await import("../calc/engine.js");
const C=await import("../calc/index.js");
const U=await import("../calc/units.js");
const T=await import("../calc/tables.js");
const L=await import("../calc/link.js");
const ST=await import("../calc/defs/stairs.js");
const CB=await import("../calc/defs/cable.js");
const TK=await import("../calc/defs/tank.js");
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const src=f=>readFileSync(join(ROOT,f),"utf8");
const NEW=["tank","septic","supplypipe","drainpipe","pipeslope","hvac","lux","cable","panel","stairs","ramp","slabbar"];
const run=(id,i,u)=>E.runCalc(C.calcById(id),i,u);

group("١ · اثنتا عشرة حاسبة ⇒ المجموع 42 وثلاث مجموعات جديدة",()=>{
 eq(C.calcList().length,42,"42 حاسبة (30 + 12)");
 eq(C.DEFS.length,42,"DEFS = 42");
 deep(C.GROUPS.map(g=>g.id),["general","concrete","steel","masonry","earth","loads","soil","water","mep","stairs"],"عشر مجموعات بالترتيب");
 eq(C.groupName("water"),"المياه والصرف","اسم مجموعة المياه");
 eq(C.groupName("mep"),"الكهرباء والميكانيكا","اسم مجموعة الكهرباء");
 eq(C.groupName("stairs"),"الدرج والمنحدرات","اسم مجموعة الدرج");
 eq(C.calcList().filter(d=>d.group==="water").length,5,"خمس حاسبات مياه");
 eq(C.calcList().filter(d=>d.group==="mep").length,4,"أربع حاسبات كهرباء وميكانيكا");
 eq(C.calcList().filter(d=>d.group==="stairs").length,2,"حاسبتا درج ومنحدر");
 NEW.forEach(id=>{
  const d=C.calcById(id);
  ok(!!d,`${id} مسجّلة`);
  eq(E.validateDef(d).length,0,`${id}: تعريفٌ صالح`);
  ok(d.cases.length>=3,`${id}: ${d.cases.length} حالات مرجعية`);
  ok(E.runCalc(d,{}).ok,`${id}: القيم الافتراضية وحدها تعطي نتيجة`);
  ok(d.outputs.some(o=>o.main),`${id}: مخرجٌ رئيسيّ`);
 });
 ok(C.calcById("slabbar").group==="steel","حديد البلاطة في مجموعة الحديد");
});

group("٢ · الحالات المرجعية لـ ٣-د تُطابَق",()=>{
 let n=0;
 NEW.forEach(id=>C.calcById(id).cases.forEach(c=>{
  const r=run(id,c.in);
  ok(r.ok,`${id} · ${c.n}: الحساب يمرّ`);
  Object.entries(c.out).forEach(([k,want])=>{
   const got=r.out[k], tol=c.tol??1e-6; n++;
   ok(typeof got==="number"&&Math.abs(got-want)<=tol*Math.max(1,Math.abs(want)),
    `${id} · ${c.n} · ${k} = ${got} (المتوقَّع ${want})`);
  });
 }));
 ok(n>=90,`${n} مقارنةً مرجعية`);
});

group("٣ · ما لا يُحسَب يُرفض أو يُنبَّه، ولا يُصحَّح بصمت",()=>{
 ok(!run("tank",{P:0}).ok,"عدد سكانٍ صفر يُرفض");
 ok(!run("septic",{Vp:5}).ok,"Vp أقلّ من 15 يُرفض");
 const cab=run("cable",{sys:"3",P:3,tb:"te"}); ok(!cab.ok&&cab.errs.some(e=>/4D5/.test(e.m)),"جدول 4D5 لا يُستعمل للثلاثي: يُرفض صراحةً");
 const big=run("cable",{P:200,L:3,vd:4,tb:"te"}); ok(!big.ok,"تيارٌ فوق كلّ الكابلات الجدولية يُرفض");
 const dr=run("drainpipe",{D:100,S:0.1,m:"upvc",y:50,Q:50}); ok(dr.ok&&dr.warn.some(w=>/يتجاوز السعة/.test(w)),"تدفّقٌ فوق السعة يُنبَّه");
 const dv=run("drainpipe",{D:100,S:1,m:"upvc",y:50,Q:2}); ok(dv.ok&&!dv.warn.some(w=>/يتجاوز السعة|التنظيف/.test(w)),"ميلٌ كافٍ بلا تنبيه");
 const sl=run("drainpipe",{D:100,S:0.05,m:"upvc",y:50,Q:0}); ok(sl.warn.some(w=>/التنظيف الذاتي/.test(w)),"سرعةٌ أقلّ من التنظيف الذاتي تُنبَّه");
 const sp=run("supplypipe",{Q:500,v:0.3,m:"ppr"}); ok(!sp.ok&&sp.errs.some(e=>/أكبر من/.test(e.m)||/قسّم/.test(e.m)),"قطرٌ يتجاوز أكبر DN يُرفض لا يُقطَع");
 const rp=run("ramp",{H:600,X:9}); ok(!rp.ok,"ميلٌ أشدّ من 1:12 يُرفض");
 const st=run("stairs",{H:3200,mode:"free",r0:200,F:"1",b:630}); ok(st.ok&&st.warn.some(w=>/النائمة/.test(w)),"قائمةٌ عريضة تنبّه على الحدّ الأدنى للنائمة");
 const pn=run("panel",{li:0,so:0,ac:0,he:0,ot:0}); ok(!pn.ok&&pn.errs.some(e=>/لا حمل/.test(e.m)||/حمل/.test(e.m)),"لوحةٌ بلا حمل تُرفض");
});

group("٤ · الأحمال والوحدات الجديدة",()=>{
 eq(U.KINDS.flow.base,"Ls","التدفّق أساسه لتر/ث");
 near(U.convert(1,"flow","m3h","Ls"),1/3.6,1e-12,"م³/ساعة ⇒ لتر/ث");
 near(U.convert(60,"flow","gpm","Ls"),3.785411784,1e-9,"جالون/دقيقة ⇒ لتر/ث");
 near(U.convert(1,"power","tr","W"),3516.852842,1e-6,"طن التبريد = 3516.85 W");
 near(U.convert(1,"power","btuh","W"),0.29307107017,1e-12,"BTU/h ⇒ W");
 near(U.convert(1,"power","hp","W"),745.69987158,1e-6,"حصان ⇒ W");
 near(U.convert(1,"area","donum","m2"),1000,1e-9,"دونم ⇒ م²");
 near(run("hvac",{A:20,qa:150,p:2,qp:130,eq:0.3,li:10,sf:10},{eq:"kW"}).out.W,4136,1e-9,"حمل الأجهزة 0.3 kW ⇒ 300 W");
});

group("٥ · الربط بالمخطّط: الغرفة ⇒ التكييف والإضاءة",()=>{
 const ring=[[0,0],[6000,0],[6000,5000],[0,5000]];          /* مم */
 const a={id:"A1",ring};
 const p=L.areaPre(a);
 ok(!!p,"الغرفة المغلقة تُعطي تعبئة");
 near(+p.A.raw.A,30,1e-9,"مساحة الغرفة 30 م² من الحلقة");
 near(+p.lux.raw.L,6,1e-9,"الطول 6 م من الصندوق"); near(+p.lux.raw.W,5,1e-9,"العرض 5 م");
 const r=run("lux",p.lux.raw,p.lux.units); ok(r.ok&&r.out.Nr>0,"الإضاءة تحسب من الغرفة المربوطة");
 const h=run("hvac",{...C.calcById("hvac").inputs.reduce((o,i)=>(o[i.k]=i.def,o),{}),A:p.A.raw.A},p.A.units); ok(h.ok,"التكييف يقرأ مساحة الغرفة");
 ok(L.areaPre({ring:[[0,0],[1,0]]})===null,"حلقةٌ من نقطتين لا تُعطي تعبئة");
});
group("٥ب · الربط بالمخطّط: البلاطة ⇒ حديدها، والدرج ⇒ تصميمه",()=>{
 const slab={id:"G1",kind:"slab",th:150,pts:[[0,0],[5000,0],[5000,4000],[0,4000]]};
 const sp=L.slabPre(slab);
 ok(!!sp,"البلاطة تُعطي تعبئة");
 near(+sp.raw.Lx,5,1e-9,"Lx = 5 م"); near(+sp.raw.Ly,4,1e-9,"Ly = 4 م"); eq(sp.raw.th,"150","السماكة 150 مم");
 const sb=run("slabbar",{Lx:"5",Ly:"4",th:"150",c:25,dx:"10",sx:150,dy:"10",sy:200,lay:"1",ext:0});
 ok(sb.ok&&sb.out.n12>0,"حديد البلاطة يحسب من الأبعاد المربوطة");
 eq(L.slabPre({kind:"beam",a:[0,0],b:[1000,0],w:250,d:500}),null,"الكمرة ليست بلاطة");
 const st={id:"S1",type:"straight",w:1000,h:3200,flights:[{a:[0,0],b:[4000,0],n:19}]};
 const spre=L.stairPre(st);
 ok(!!spre,"الدرج يُعطي تعبئة");
 eq(spre.raw.H,"3200","H = ارتفاع الدور");
 const sr=run("stairs",spre.raw,spre.units); ok(sr.ok&&sr.out.N===19,`تصميم الدرج يعيد N = 19 (الحالي)`);
 near(sr.out.R,3200/19,1e-6,"القائمة = الارتفاع ÷ N");
 const sf=run("stairs",{H:3000,mode:"fit",run:4.5,F:"1",b:630}); ok(sf.ok,"وضع الطول المتاح يعمل");
});
group("٥ج · حسابٌ مستقلّ بعد الربط: القاطع والكابل من تيار الحمل",()=>{
 near(CB.ibOf("1",3,0.9),3000/(230*0.9),1e-12,"Ib الأحادي");
 near(CB.ibOf("3",3,0.9),3000/(Math.sqrt(3)*400*0.9),1e-12,"Ib الثلاثي");
 eq(CB.mcbFor(14.5),16,"أقرب قاطع فوق 14.5 A");
 eq(CB.mcbFor(64),80,"64 A ⇒ 80 A (لا 63)");
 near(TK.up(2.0001),2.05,1e-9,"تقريب الخزّان للأعلى 50 مم");
});

group("٦ · المرجع والكود والتنبيه في النصّ المنسوخ",()=>{
 NEW.forEach(id=>{
  const r=run(id,{}), t=E.resultText(r);
  ok(t.includes("المرجع:")&&t.includes("BS 8110")&&t.includes(E.DISCLAIMER),`${id}: النصّ المنسوخ بالمرجع والكود والتنبيه`);
  ok(E.outputRows(r).length>0&&E.inputRows(r).length>0,`${id}: صفوف العرض`);
 });
 ok(T.CABLE.ref.includes("BS 7671")&&T.STAIR.ref.includes("بلوندل"),"مراجع الجداول مذكورة بالبند");
});

group("٧ · الاندماج: البحث والدليل وبلا اتصال وخارج الإقلاع",()=>{
 const pe=C.paletteEntries(), Ls=C.calcLessons();
 eq(pe.length,43,"42 حاسبة + مدخلُ «العنصر المحدَّد» في Ctrl+K"); eq(Ls.length,42,"42 درساً");
 NEW.forEach(id=>{
  ok(pe.some(e=>e.id===id),`${id} في Ctrl+K`);
  ok(Ls.some(l=>l.calcId===id&&l.body.includes("المرجع")),`${id} في الدليل`);
 });
 [["مياه","tank"],["خزان","tank"],["بيارة","septic"],["قطر","supplypipe"],["ميل","pipeslope"],["تكييف","hvac"],["لوكس","lux"],["كابل","cable"],["لوحه","panel"],["درج","stairs"],["منحدر","ramp"],["حديد البلاطه","slabbar"]].forEach(([w,id])=>
  ok(pe.find(e=>e.id===id).hay.includes(w),`«${w}» يجد ${id}`));
 const sw=src("sw.js");
 NEW.forEach(id=>ok(sw.includes(`./src/calc/defs/${id}.js`),`sw.js يخزّن ${id} — بلا اتصال`));
 ok(sw.includes("./src/calc/link.js"),"sw.js يخزّن الربط بالمخطّط");
 ok(/VERSION="2\.1\d\.\d+"/.test(sw),"إصدار العامل 2.10.x");
 ok(/"test:phase3d"/.test(src("package.json")),"npm run test:phase3d");
 ok(/"version": "2\.1\d\./.test(src("package.json")),"package.json 2.10.x");
 ok(/VERSION="2\.1\d\./.test(src("src/core/version.js")),"version.js 2.10.x");
 ok(!/"(loads|soil|water|mep)"/.test(src("src/ui/calcPanel.js")),"اللوحة بلا مجموعاتٍ مكتوبة بيد");
 const pcs=src("src/ui/calcPanel.js");
 ok(/openCalcPanel\(id,pre\)/.test(pcs)&&/pre&&pre\.raw/.test(pcs),"اللوحة تقبل تعبئةً من الربط");
 ok(/id==="sel"/.test(pcs)&&/selectionPre/.test(pcs),"«العنصر المحدَّد» يُحلّ من التحديد");
});
const SB=await import("../../scripts/size-budget.js");
group("٧ب · ٣-د خارج رسم الإقلاع",()=>{
 const f=SB.measure(ROOT).files.map(x=>x.f.replace(/\\/g,"/"));
 eq(f.filter(x=>x.startsWith("src/calc/")).length,0,"لا ملفّ من calc/ في الإقلاع");
});

/* (v2.11.0) القاعدة المرسومة ⇒ حاسبتها، والتحديد يُحلّ عبر linkFor */
group("٨ · القاعدة المرسومة ⇒ فحص أبعادها (v2.11.0)",()=>{
 const f={kind:"footing",id:"F1",x:0,y:0,w:2000,h:2000,th:400};
 const p=L.footingPre(f);
 eq(p.raw.sh,"sq","مربّعة ⇒ sh=sq");
 eq(p.raw.Bd,"2","عرض القاعدة بالمتر");
 const g={kind:"footing",id:"F2",x:0,y:0,w:1500,h:3000,th:400};
 const q=L.footingPre(g);
 eq(q.raw.sh,"rect","مستطيلة ⇒ rect"); eq(q.raw.ratio,"2","النسبة L/B");
 eq(L.footingPre({kind:"beam",a:[0,0],b:[1000,0]}),null,"الكمرة ليست قاعدة");

 const fd=C.calcById("footing");
 const r=E.runCalc(fd,{...q.raw,G:600,Q:400,qa:200,sw:10},{});
 ok(r.ok&&r.out.ud>1,"قاعدة 1.5×3 م تحت حمل 1100 kN لا تكفي عند qa = 200");
 const st={struct:[f,g],stairs:[],areas:[]};
 const sel=L.linkFor({k:"struct",id:"F1"},st);
 eq(sel&&sel.id,"footing","التحديد على قاعدة يفتح حاسبتها");
 eq(L.linkFor({k:"struct",id:"nope"},st),null,"عنصرٌ غير موجود لا يفتح شيئاً");
 const b={kind:"beam",id:"B1",a:[0,0],b:[1000,0],w:250,d:500};
 eq(L.linkFor({k:"struct",id:"B1"},{struct:[b]}),null,"الكمرة لا تُربط بحاسبة");
});
summary();
