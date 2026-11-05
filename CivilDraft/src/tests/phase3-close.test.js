/* ═══ إغلاق المرحلة ٣ كاملة (v2.11.0) · حقيبة المهندس على BS 8110 ═══
   ١ · المجموع: ٤٠ حاسبة فأكثر، لكلٍّ ٣ حالات مرجعية مطابقة، والكود المعتمد يُطبَع مع كلّ نتيجة
   ٢ · BS 8110 وحده: لا مرجعَ ACI في أيّ حاسبة، والمشروع لا يعرض كوداً آخر للاختيار
   ٣ · الربط بالمخطّط في الاتّجاهين: الدرجُ المحدَّد ⇐ الحاسبة ⇐ الدرج (بالمُدقِّق وخطوة تراجعٍ واحدة)
   ٤ · عيوبٌ أُصلحت: القاعدة بلا حمل (0 ÷ 0) · قارئُ DXF كان في رسم الإقلاع فتجاوز الحدّ
   ٥ · الإصدار والكاش: 2.11.0 في الثلاثة، وكلُّ ملفّات calc/ والجديدُ في CORE فتعمل بلا إنترنت
   التشغيل:  node src/tests/phase3-close.test.js */
import {shim,group,ok,eq,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
shim();
const ST=await import("../core/state.js");
const SS=await import("../core/stairs.js");
const E=await import("../calc/engine.js");
const C=await import("../calc/index.js");
const L=await import("../calc/link.js");
const PI=await import("../core/projinfo.js");
const SK=await import("../core/skipsum.js");
const {ltr}=await import("../core/units.js");
const DX=await import("../io/dxfin.js");
const LIM=(await import("../core/limits.js")).LIM;
const SB=await import("../../scripts/size-budget.js");
const VER=(await import("../core/version.js")).VERSION;
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const src=f=>readFileSync(join(ROOT,f),"utf8");
const close=(a,b,t)=>Math.abs(a-b)<=Math.max(t,Math.abs(b)*t);

group("١ · المرحلة ٣ كاملة: ٤٠ حاسبة فأكثر بحالاتها",()=>{
 const all=C.calcList();
 ok(all.length>=40,`${all.length} حاسبة (الهدف ٤٠)`);
 const groups=new Set(all.map(d=>d.group));
 ["general","concrete","steel","masonry","earth","loads","soil","water","mep","stairs"].forEach(g=>ok(groups.has(g),`المجموعة ${g} حاضرة`));
 let bad=[];
 all.forEach(d=>{
  if(d.cases.length<3)bad.push(d.id+": أقلّ من ٣ حالات");
  d.cases.forEach(c=>{
   const r=E.runCalc(d,c.in,c.units||{});
   if(!r.ok){bad.push(`${d.id} «${c.n}»: ${r.errs.map(e=>e.m).join("؛ ")}`);return}
   Object.entries(c.out).forEach(([k,x])=>{
    const y=r.out[k];
    if(typeof x==="number"?!(typeof y==="number"&&close(y,x,c.tol!=null?Math.max(c.tol,1e-9):1e-6)):String(y)!==String(x))bad.push(`${d.id} «${c.n}» ${k}: ${y} ≠ ${x}`);
   });
  });
 });
 eq(bad.length,0,"كلُّ الحالات المرجعية مطابقة"+(bad.length?" — "+bad.slice(0,3).join(" | "):""));
 const r=E.runCalc("rebarwt",{},{});
 ok(/BS 8110/.test(E.resultText(r)),"النتيجة المنسوخة تحمل الكود المعتمد");
});

group("٢ · BS 8110 كودٌ وحيد",()=>{
 const aci=C.calcList().filter(d=>/\bACI\b/.test(d.ref+" "+d.formula.join(" ")));
 eq(aci.map(d=>d.id).join(","),"","لا حاسبة مرجعُها ACI");
 ok(/DoE|BRE/.test(C.calcById("mixdesign").ref),"الخلطة بطريقة DoE/BRE البريطانية");
 ok(/BS 8110/.test(C.calcById("lapdev").ref)&&/BS 8110/.test(C.calcById("formwork").ref),"التثبيت وفكّ الشدّات بـ BS 8110");
 eq(PI.DESIGN_CODE,C.CODE.id,"كود المشروع = كود الحاسبات");
 const hub=src("src/ui/projhub.js");
 ok(/k===""\|\|k===DESIGN_CODE\|\|k===\(T\.code\|\|""\)/.test(hub),"قائمة الكود: BS 8110 والافتراضيّ (والقديمُ المحفوظ وحده يظهر تسمية)");
});

group("٣ · الدرج في الاتّجاهين: الحاسبة ⇒ الدرج المحدَّد",()=>{
 ST.edit(()=>SS.addStair([0,0],[4000,0],1000,16));
 const st=ST.S.stairs[ST.S.stairs.length-1], sel={k:"stair",id:st.id};
 const pre=L.linkFor(sel);
 eq(pre&&pre.id,"stairs","الدرج المحدَّد يفتح حاسبته");
 const r=E.runCalc("stairs",{...pre.pre.raw,H:"3200",r0:"170"},pre.pre.units);
 ok(r.ok&&r.out.N===19,"الحاسبة: 3.20 م بقائمة 170 ⇒ 19 قائمة");
 const p=L.stairPlan(r,st);
 ok(p.ok&&p.N===19&&p.curN===16&&!p.same,"الخطّة خالصة: تقول ما سيُكتب ولا تكتب");
 eq(st.flights[0].n,16,"…ولم يتغيّر الدرج بعد");
 const h0=ST.S.history?ST.S.history.length:null;
 const a=L.applyStair(sel,r);
 ok(a.ok,"طُبِّق: "+a.msg);
 const st2=ST.S.stairs.find(x=>x.id===st.id);
 eq(st2.flights[0].n,19,"عدد القوائم 19");
 eq(st2.h,3200,"ارتفاع الدور 3200 مم");
 ST.undo();
 const st3=ST.S.stairs.find(x=>x.id===st.id);
 ok(st3.flights[0].n===16&&st3.h==null,"تراجعٌ واحد يُرجع الارتفاع والعدد معاً");
 const again=L.applyStair(sel,E.runCalc("stairs",{...pre.pre.raw},pre.pre.units));
 ok(again.ok&&again.p&&again.p.same,"نتيجةٌ مطابقة للدرج ⇒ لا تغيير ولا خطوة تراجع");
 ok(!L.applyStair({k:"struct",id:"X"},r).ok,"غير الدرج يُرفض");
 ok(!L.applyStair({k:"stair",id:"nope"},r).ok,"درجٌ محذوف يُرفض");
 ok(!L.stairPlan({ok:false},st).ok,"نتيجةٌ خاطئة لا تُطبَّق");
 const panel=src("src/ui/calcPanel.js");
 ok(/data-cl="apply"/.test(panel)&&/applyStair\(S\.src/.test(panel),"زرّ «طبّق على الدرج» في اللوحة يظهر حين فُتحت من درج");
 ok(/S\.src=null/.test(panel),"تبديل الحاسبة يُسقط مصدر التحديد فلا يُطبَّق على غير ما حُسب");
 void h0;
});

group("٤ · عيوبٌ أُصلحت",()=>{
 const r=E.runCalc("footing",{G:0,Q:0},{});
 ok(!r.ok&&r.errs.length===1&&/حمل/.test(r.errs[0].m),"قاعدة بلا حمل: رسالةٌ مفهومة بدل «غير محدّدة» مرّتين");
 const w=E.runCalc("footing",{G:20,Q:10,qa:200},{});
 ok(w.ok&&w.warn.some(x=>/الحدّ العمليّ/.test(x)),"قاعدة صغيرة جدّاً ⇒ تنبيه الحدّ العمليّ");
 const s={"وحدة":2,"قيمة خارج المدى":1,"نوع":3};
 eq(SK.skipSummary(s,["قيمة خارج المدى"]),"وحدة ×"+ltr(2)+" · نوع ×"+ltr(3),"skipSummary في core: الأرقام معزولة بـ ltr كما تقتضي قاعدة الاتجاه");
 eq(DX.skipSummary(s),SK.skipSummary(s),"ويُعاد تصديره من dxfin.js حرفاً");
 eq(DX.MAXENT,LIM.refEnts.max,"حدود القارئ هي حدود limits.js (يقرؤها المفتّش منها)");
 eq(DX.MAXCO,LIM.coord.max,"MAXCO كذلك");
 const ins=src("src/ui/inspector.js");
 ok(!/from\s*"\.\.\/io\/dxfin\.js"/.test(ins)&&/import\("\.\.\/io\/dxfin\.js"\)/.test(ins),"المفتّش يحمّل قارئ DXF عند أوّل استيراد لا عند الإقلاع");
 const m=SB.measure(ROOT), f=m.files.map(x=>x.f.replace(/\\/g,"/"));
 ok(!f.includes("src/io/dxfin.js")&&!f.includes("src/io/cp1256.js"),"قارئ DXF وcp1256 خارج رسم الإقلاع");
 ok(m.kb<=SB.BUDGET.src,`حجم مصدر الإقلاع ${m.kb} ≤ ${SB.BUDGET.src} ك.ب`);
 eq(f.filter(x=>x.startsWith("src/calc/")).length,0,"ولا ملفّ من calc/ في الإقلاع");
});

group("٥ · الإصدار والعمل بلا إنترنت",()=>{
 ok(/^2\.1\d\.\d+$/.test(VER),`version.js ${VER} (2.11.x أو أحدث)`);
 eq(JSON.parse(src("package.json")).version,VER,"package.json");
 ok(src("sw.js").includes(`const VERSION="${VER}"`),"sw.js");
 const sw=src("sw.js");
 ok(sw.includes("src/core/skipsum.js"),"الملفّ الجديد في كاش العامل");
 const miss=C.DEFS.map(d=>`src/calc/defs/${d.id}.js`).filter(p=>!sw.includes(p));
 eq(miss.join(","),"","كلُّ تعريفات الحاسبات في كاش العامل");
 ["engine","index","link","pdf","tables","units"].forEach(n=>ok(sw.includes(`src/calc/${n}.js`),`calc/${n}.js في الكاش`));
});
summary();
