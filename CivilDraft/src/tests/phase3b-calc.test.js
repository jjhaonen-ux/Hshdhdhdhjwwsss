/* ═══ المرحلة ٣-ب من خطّة التطوير · حاسبات المباني والحفر (v2.8.0) ═══
   ومعها: المشروعُ يعتمد BS 8110 كوداً للحاسبات.
   ١ · تسعُ حاسباتٍ جديدة ⇒ المجموع 21، بمجموعتين جديدتين
   ٢ · كلُّ حالةٍ مرجعية تُطابَق ضمن سماحيتها
   ٣ · مِلفّ الكود: BS 8110 في كلّ نتيجةٍ ونصٍّ وPDF ولوحة
   ٤ · التثبيتُ والوصلة تطابق الجدول 3.27 وفكُّ الشدّات الجدول 6.3
   ٥ · الرفضُ الصريح والتنبيهات
   ٦ · الأدوات المصدَّرة (mortarPerM2 · prismoid · soilOf)
   ٧ · الاندماج: البحث والدليل والـPDF والعمل بلا اتصال وخارج الإقلاع
   التشغيل:  node src/tests/phase3b-calc.test.js */
import {shim,group,ok,eq,near,deep,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
shim();
const E=await import("../calc/engine.js");
const C=await import("../calc/index.js");
const P=await import("../calc/pdf.js");
const T=await import("../calc/tables.js");
const MA=await import("../calc/defs/masonry.js");
const EX=await import("../calc/defs/excav.js");
const SW=await import("../calc/defs/swell.js");
const PI=await import("../core/projinfo.js");
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const src=f=>readFileSync(join(ROOT,f),"utf8");
const NEW=["masonry","plaster","paint","tiles","insul","ceiling","excav","swell","trucks"];
const run=(id,i,u)=>E.runCalc(C.calcById(id),i,u);

group("١ · تسع حاسبات جديدة والمجموع 21",()=>{
 eq(C.calcList().filter(d=>["general","concrete","steel","masonry","earth"].includes(d.group)&&d.id!=="slabbar").length,21,"21 حاسبة (12 من ٣-أ + 9 من ٣-ب) — slabbar من ٣-د");
 deep(C.GROUPS.map(g=>g.id).slice(0,5),["general","concrete","steel","masonry","earth"],"خمس مجموعات أولاً (٣-أ و٣-ب)");
 eq(C.groupName("masonry"),"المباني والتشطيبات","اسم مجموعة المباني");
 eq(E.groupName("earth"),"الحفر والردم","اسم مجموعة الحفر");
 eq(C.calcList().filter(d=>d.group==="masonry").length,6,"ست حاسبات مبانٍ");
 eq(C.calcList().filter(d=>d.group==="earth").length,3,"ثلاث حاسبات حفر");
 NEW.forEach(id=>{
  const d=C.calcById(id);
  ok(!!d,`${id} مسجّلة`);
  eq(E.validateDef(d).length,0,`${id}: تعريفٌ صالح`);
  ok(d.cases.length>=3,`${id}: ${d.cases.length} حالات مرجعية`);
  ok(E.runCalc(d,{}).ok,`${id}: القيم الافتراضية وحدها تعطي نتيجة`);
 });
});

group("٢ · الحالات المرجعية لـ ٣-ب تُطابَق",()=>{
 NEW.forEach(id=>C.calcById(id).cases.forEach(c=>{
  const r=run(id,c.in);
  ok(r.ok,`${id} · ${c.n}: الحساب يمرّ`);
  Object.entries(c.out).forEach(([k,want])=>{
   const got=r.out[k], tol=c.tol??1e-6;
   ok(typeof got==="number"&&Math.abs(got-want)<=tol*Math.max(1,Math.abs(want)),
    `${id} · ${c.n} · ${k} = ${got} (المتوقَّع ${want})`);
  });
 }));
});

group("٣ · الكود المعتمد BS 8110",()=>{
 eq(T.CODE.id,"bs8110","CODE.id"); ok(/BS 8110-1:1997/.test(T.CODE.full),"الاسم الكامل بالإصدار");
 eq(C.CODE,T.CODE,"الفهرس يصدّر الكود نفسه");
 ok(E.codeLine().includes("BS 8110"),"codeLine");
 const r=run("lapdev",{});
 ok(E.resultText(r).includes(E.codeLine()),"النصّ المنسوخ يحمل الكود");
 NEW.concat(["lapdev","formwork"]).forEach(id=>{
  const pr=P.calcPDFPrims(run(id,{}));
  ok(pr.prims.some(p=>p.s===E.codeLine()),`${id}: الكود في الـPDF`);
  ok(pr.prims.some(p=>p.s===C.calcById(id).title),`${id}: العنوان في الـPDF`);
 });
 ok(/codeLine\(\)/.test(src("src/ui/calcPanel.js")),"واللوحة تعرضه");
 ok(/BS 8110/.test(C.calcById("lapdev").ref)&&/BS 8110/.test(C.calcById("formwork").ref),"مرجعا التثبيت والشدّات BS 8110");
 ok(!/ACI 318|ACI 347/.test(C.calcById("lapdev").ref+C.calcById("formwork").ref),"ولا ذكرَ لـ ACI فيهما");
 ok(/DoE|BRE/.test(C.calcById("mixdesign").ref)&&/BS 8110/.test(C.calcById("mixdesign").ref),"تصميم الخلطة بطريقة DoE/BRE وقيود BS 8110 (v2.11.0)");
 ok(PI.CODES.bs8110&&/BS 8110/.test(PI.CODES.bs8110),"BS 8110 بين أكواد معلومات المشروع");
 eq(PI.normTitleExt({code:"bs8110"}).code,"bs8110","وقيمتُه تُحفظ في المشروع");
});

group("٤ · BS 8110: الجدول 3.27 والجدول 6.3",()=>{
 /* [fcu, نوع, شدّ, ضغط] بمضاعفات القطر لـ fy 460 من الجدول 3.27 */
 [[25,"type2",40,32],[30,"type2",37,29],[35,"type2",34,27],[40,"type2",32,25],
  [25,"type1",50,40],[40,"type1",40,32]].forEach(([fcu,bar,t,c])=>{
  const r=run("lapdev",{d:"20",fcu,fy:"460",bar});
  ok(Math.abs(r.out.ldb-t)/t<=0.02,`fcu ${fcu} ${bar}: الشدّ ${E.fmt(r.out.ldb,2)}φ ≈ ${t}φ`);
  ok(Math.abs(r.out.ldc/20-c)/c<=0.03,`fcu ${fcu} ${bar}: الضغط ${E.fmt(r.out.ldc/20,2)}φ ≈ ${c}φ`);
 });
 near(run("lapdev",{d:"16",fcu:50}).out.ldb,run("lapdev",{d:"16",fcu:40}).out.ldb,1e-9,"fcu > 40 يُحدّ بـ 40");
 ok(run("lapdev",{fcu:50}).warn.some(w=>/40/.test(w)),"مع تنبيه");
 near(run("lapdev",{d:"8",fcu:40}).out.lap,300,1e-9,"الحدّ الأدنى 300 مم يحكم Ø8");
 near(run("lapdev",{d:"20",fcu:25,fy:"500"}).out.ldb,500/1.15/(4*0.5*5),1e-9,"fy 500 بـ γm 1.15");
 ok(run("lapdev",{bar:"plain",fy:"250"}).warn.some(w=>/خطّاف/.test(w)),"الأملس ينبّه للخطّاف");
 [["vert",16,12],["vert",7,18],["slabS",7,6],["slabP",16,10],["beamS",7,14],["beamP",16,14]].forEach(([el,t,want])=>
  eq(run("formwork",{el,t}).out.r,want,`الجدول 6.3: ${el} عند ${t}°C = ${want}`));
 near(run("formwork",{el:"slabS",t:20}).out.d,100/30,1e-9,"المعادلة 100/(t+10) لحرارةٍ أخرى");
 ok(run("formwork",{cem:"other"}).warn.length>=2,"الأسمنت الآخر ينبّه");
 ok(!run("formwork",{t:"45"}).ok,"حرارة خارج المدى تُرفض");
});

group("٥ · الرفض الصريح والتنبيهات",()=>{
 ok(!run("masonry",{L:2,H:2,op:5}).ok,"فتحاتٌ أكبر من الجدار تُرفض");
 ok(!run("tiles",{L:2,W:2,ded:5}).ok,"خصمٌ أكبر من المساحة يُرفض");
 ok(!run("insul",{mode:"mem",rw:0.5,sl:600}).ok,"تراكبٌ أكبر من اللفّة يُرفض");
 ok(run("excav",{D:2,k:0}).warn.some(w=>/BS 6031/.test(w)),"حفرٌ رأسيٌّ عميق ينبّه");
 const ex=run("excav",{L:1,W:1,D:1,ws:0,Vs:5});
 ok(ex.ok&&ex.out.B===0&&ex.warn.length>0,"منشأٌ أكبر من الحفر ⇒ ردمٌ صفر مع تنبيه");
 ok(run("trucks",{Vb:300,cap:16,pay:20,rho:1800}).warn.some(w=>/الوزن/.test(w)),"الوزن يحكم ⇒ تنبيه");
 eq(run("trucks",{cyc:600,hrs:1}).out.tpd,1,"دورةٌ أطول من اليوم ⇒ نقلةٌ واحدة");
 ok(run("plaster",{t:25}).warn.length>0,"لياسةٌ سميكة تنبّه للطبقات");
 ok(!run("paint",{r:"0"}).ok,"معدّل فرشٍ صفر يُرفض");
 ok(run("masonry",{u:"blk400"}).warn.length>0&&run("masonry",{u:"brick"}).warn.length===0,"تنبيه البلوك المفرَّغ وحده");
 /* وحداتٌ أخرى */
 eq(run("tiles",{L:5,W:4,a:"60",b:"60",j:3,waste:10},{a:"cm",b:"cm"}).out.N,61,"البلاطة بالسنتيمتر تُحوَّل");
 near(run("excav",{L:"10",W:5,D:2,ws:0},{L:"ft"}).out.V,3.048*5*2,1e-9,"الطول بالقدم");
});

group("٦ · الأدوات المصدَّرة",()=>{
 near(MA.mortarPerM2({l:215,h:65,t:102.5},10),0.1025*(1-215*65/(225*75)),1e-12,"mortarPerM2");
 eq(MA.mortarPerM2({l:400,h:200,t:200},0),0,"بلا فاصل لا مونة");
 const p=EX.prismoid(2,2,1,1);
 near(p.V,28/3,1e-12,"prismoid = جذع الهرم"); eq(p.Lt,4,"وسطحه");
 near(EX.prismoid(3,4,2,0).V,24,1e-12,"prismoid رأسي = متوازي مستطيلات");
 deep(SW.soilOf({soil:"sand"}),T.SOILS.list.sand,"soilOf من الجدول");
 deep(SW.soilOf({soil:"custom",sw:7,sh:3}),{sw:7,sh:3},"soilOf من المدخلات");
 eq(T.MASONRY.mortar.iii.s,6,"BS 5628 الدرجة (iii) = 1:6");
 ok(T.BS4449.dias.includes(16)&&T.BS4449.dias.includes(32),"BS 4449 الأقطار");
 eq(T.BS8110.lapMinD,15,"15φ"); eq(T.BS8110.compLap,1.25,"وصلة الضغط 1.25");
});

group("٧ · البحث والدليل والـPDF وبلا اتصال وخارج الإقلاع",()=>{
 const pe=C.paletteEntries(), L=C.calcLessons();
 NEW.forEach(id=>{
  ok(pe.some(e=>e.id===id),`${id} في Ctrl+K`);
  ok(L.some(l=>l.calcId===id&&l.body.includes("المرجع")),`${id} في الدليل`);
 });
 [["بلوك","masonry"],["لياسه","plaster"],["بويه","paint"],["سيراميك","tiles"],["عزل","insul"],
  ["سقف مستعار","ceiling"],["ردم","excav"],["انتفاش","swell"],["قلابات","trucks"]].forEach(([w,id])=>
  ok(pe.find(e=>e.id===id).hay.includes(w),`«${w}» يجد ${id}`));
 const sw=src("sw.js");
 NEW.forEach(id=>ok(sw.includes(`./src/calc/defs/${id}.js`),`sw.js يخزّن ${id} — بلا اتصال`));
 ok(/VERSION="2\.(8|9|1\d)\.\d+"/.test(sw),"إصدار العامل 2.8.x أو أحدث");
 ok(/"test:phase3b"/.test(src("package.json")),"npm run test:phase3b");
});
const SB=await import("../../scripts/size-budget.js");
group("٧ب · ٣-ب خارج رسم الإقلاع",()=>{
 const f=SB.measure(ROOT).files.map(x=>x.f.replace(/\\/g,"/"));
 eq(f.filter(x=>x.startsWith("src/calc/")).length,0,"لا ملفّ من calc/ في الإقلاع");
});
summary();
