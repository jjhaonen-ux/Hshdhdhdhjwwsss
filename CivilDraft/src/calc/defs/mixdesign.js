/* تصميم الخلطة الخرسانية — طريقة DoE/BRE البريطانية (v2.11.0)
   كانت بـ ACI 211.1 (مقاومة الأسطوانة). المشروعُ على BS 8110 بمقاومة المكعّب fcu،
   والطريقة المرافقة له «Design of normal concrete mixes» (BRE 1997).
   الجداول 2 و3 من calc/tables.js، والأشكال 4 و5 و6 معالَجةٌ صراحةً (انظر DOE هناك). */
import {fmt} from "../engine.js";
import {ltr} from "../../core/units.js";
import {DOE as T,BS8110_DUR,durOf} from "../tables.js";

const AGE=T.ages.map(a=>({v:String(a),n:`${a} يوماً`})).filter(o=>o.v!=="3");
const SL=[{v:"0-10",n:"0–10 مم (جافّة جدّاً)"},{v:"10-30",n:"10–30 مم (قليل)"},
 {v:"30-60",n:"30–60 مم (متوسّط)"},{v:"60-180",n:"60–180 مم (عالٍ)"}];
const TYP=[{v:"cr",n:"مكسَّر"},{v:"unc",n:"غير مكسَّر (طبيعي)"}];
const EXP=[{v:"none",n:"بلا قيد ديمومة"}].concat(Object.entries(BS8110_DUR.exp).map(([v,e])=>({v,n:e.n})));

/* الهامش والمقاومة المستهدفة */
function target(v){
 const s=v.sd==="none"?T.sNoData:v.s, k=T.kDef[v.def]||1.64;
 return {s,k,fm:v.fcu+k*s};
}
/* مقاومة w/c = 0.5 من الجدول 2 لنوع الأسمنت والركام الخشن والعمر */
const f05=v=>T.f05[v.cem][v.ca][T.ages.indexOf(+v.age)];
/* الشكل 4 (تقريب أسّيّ يمرّ بنقطة الجدول 2) */
const wcFig4=(f0,fm)=>0.5+Math.log(f0/fm)/T.k4;
/* الجدول 3 مع قاعدة الركامَين المختلفين */
function water(v){
 const si=T.slumps.indexOf(v.slump), row=T.water[+v.dmax];
 const Wf=row[v.fa][si], Wc=row[v.ca][si];
 return {W:v.fa===v.ca?Wf:(2/3)*Wf+(1/3)*Wc,Wf,Wc};
}

export default {
 id:"mixdesign", group:"concrete", title:"تصميم الخلطة الخرسانية",
 desc:"أوزانُ الماء والأسمنت والرمل والحصى لمتر مكعّب من الخرسانة بطريقة DoE/BRE البريطانية بمقاومة المكعّب fcu، مع قيود الديمومة من BS 8110 الجدول 3.3. الركامُ مشبَع جافّ السطح (SSD) — صحّح للرطوبة في الموقع.",
 aliases:"mix design doe bre british تصميم خلطه خلطه خرسانيه نسب الخلطه ماء اسمنت w/c مكعب fcu",
 ref:T.ref+" · "+BS8110_DUR.ref,
 formula:["fm = fcu + k·s (k = 1.64 لنسبة عيوب 5٪ ، s = 8 N/mm² بلا سجلّ نتائج)",
  "w/c: من الشكل 4 عبر نقطة الجدول 2 (f0 عند w/c = 0.5): w/c = 0.5 + ln(f0 ÷ fm) ÷ 2.3 — أو المقروءة من الشكل",
  "w/c ≤ أقصى قيمة للديمومة (BS 8110 الجدول 3.3)",
  "الماء W من الجدول 3 (الهبوط والمقاس ونوع الركام) ، ونوعان: W = ⅔ Wf + ⅓ Wc",
  "الأسمنت C = W ÷ (w/c) ، ولا يقلّ عن أدنى محتوى للديمومة",
  "الركام الكلّي A = (1 − W/1000 − C/(1000·Gc) − الهواء) × 1000 × RD (بديل الشكل 5)",
  "الرمل = p × A (p من الشكل 6) ، والحصى = A − الرمل"],
 inputs:[
  {k:"fcu",n:"المقاومة المميّزة للمكعّب fcu",kind:"press",unit:"MPa",def:30,min:10,max:60},
  {k:"age",n:"عمر الاختبار",type:"sel",def:"28",opts:AGE},
  {k:"sd",n:"الانحراف المعياري s",type:"sel",def:"none",opts:[{v:"none",n:"بلا سجلّ نتائج (s = 8 N/mm²)"},{v:"given",n:"من سجلّ نتائج (≥ 20)"}]},
  {k:"s",n:"الانحراف المعياري s",kind:"press",unit:"MPa",def:6,min:1,max:15,when:v=>v.sd==="given"},
  {k:"def",n:"نسبة العيوب المقبولة",type:"sel",def:"5",opts:[{v:"5",n:"5٪ (k = 1.64)"},{v:"2.5",n:"2.5٪ (k = 1.96)"},{v:"1",n:"1٪ (k = 2.33)"}]},
  {k:"cem",n:"نوع الأسمنت",type:"sel",def:"opc",opts:[{v:"opc",n:"بورتلاندي عادي / مقاوم للكبريتات"},{v:"rhpc",n:"سريع التصلّد"}]},
  {k:"ca",n:"الركام الخشن",type:"sel",def:"cr",opts:TYP},
  {k:"fa",n:"الركام الناعم",type:"sel",def:"unc",opts:TYP},
  {k:"slump",n:"الهبوط",type:"sel",def:"30-60",opts:SL},
  {k:"dmax",n:"المقاس الأقصى للركام",type:"sel",def:"20",opts:T.sizes.map(x=>({v:String(x),n:`${x} مم`}))},
  {k:"exp",n:"حالة التعرّض (BS 8110 الجدول 3.2)",type:"sel",def:"mild",opts:EXP},
  {k:"wc4",n:"w/c مقروءة من الشكل 4 (0 = التقريب)",def:0,min:0,max:0.9,step:0.01},
  {k:"pf",n:"نسبة الرمل من الشكل 6",kind:"pct",unit:"pct",def:35,min:20,max:65,hint:"اقرأها من الشكل 6 حسب المقاس والهبوط وw/c والمارّ من منخل 600 ميكرون"},
  {k:"rd",n:"الكثافة النسبية للركام المختلط (SSD)",def:2.7,min:2.3,max:3.0,step:0.01,hint:"بلا قياس: 2.6 للطبيعي و2.7 للمكسَّر"},
  {k:"gc",n:"الكثافة النوعية للأسمنت",def:3.15,min:2.8,max:3.3,step:0.01},
  {k:"air",n:"الهواء المحبوس",kind:"pct",unit:"pct",def:1,min:0,max:3}
 ],
 outputs:[
  {k:"fm",n:"المقاومة المستهدفة fm",kind:"press",unit:"MPa",dp:2},
  {k:"wc",n:"نسبة الماء الحرّ/الأسمنت w/c",dp:3,main:1},
  {k:"W",n:"الماء الحرّ",kind:"mass",unit:"kg",dp:0,main:1},
  {k:"C",n:"الأسمنت",kind:"mass",unit:"kg",dp:0,main:1},
  {k:"bags",n:"أكياس الأسمنت (50 كجم)",dp:1},
  {k:"A",n:"الركام الكلّي",kind:"mass",unit:"kg",dp:0},
  {k:"FA",n:"الرمل (الركام الناعم)",kind:"mass",unit:"kg",dp:0,main:1},
  {k:"CA",n:"الحصى (الركام الخشن)",kind:"mass",unit:"kg",dp:0,main:1},
  {k:"c10",n:"منه 5–10 مم",kind:"mass",unit:"kg",dp:0,when:v=>v.dmax!=="10"},
  {k:"c20",n:"منه 10–20 مم",kind:"mass",unit:"kg",dp:0,when:v=>v.dmax!=="10"},
  {k:"c40",n:"منه 20–40 مم",kind:"mass",unit:"kg",dp:0,when:v=>v.dmax==="40"},
  {k:"dens",n:"الكثافة الطازجة المحسوبة",kind:"dens",unit:"kgm3",dp:0},
  {k:"wt",n:"النسبة الوزنية أسمنت : رمل : حصى",u:""},
  {k:"vol",n:"النسبة الحجمية التقريبية (سائبة)",u:""},
  {k:"cover",n:"أقلّ غطاء اسميّ للرتبة (الجدول 3.3)",kind:"len",unit:"mm",dp:0,when:(v,o)=>o.cover!=null}
 ],
 /* الشكل 4 مداه 0.30 – 0.90: خارجه لا استقراء — رفضٌ على حقل المقاومة */
 check(v){
  const fm=target(v).fm;
  if(v.wc4>0){
   return v.wc4<T.wcMin?[{k:"wc4",m:`w/c = ${fmt(v.wc4,2)} خارج مدى الشكل 4 (${ltr("0.30 – 0.90")})`}]:[];
  }
  const wc=wcFig4(f05(v),fm);
  return (wc<T.wcMin||wc>T.wcMax)
   ?[{k:"fcu",m:`المقاومة المستهدفة ${fmt(fm,1)} N/mm² تعطي w/c = ${fmt(wc,2)} خارج مدى الشكل 4 (${ltr("0.30 – 0.90")}) — لا استقراء`}]:[];
 },
 compute(v){
  const st=[], warn=[];
  const {s,k,fm}=target(v);
  st.push(ltr(`fm = ${fmt(v.fcu,1)} + ${fmt(k,2)} × ${fmt(s,2)} = ${fmt(fm,2)}`)+" N/mm²");
  if(v.sd==="given"&&s<T.sMin)warn.push(`s أقلّ من ${T.sMin} N/mm²: طريقة DoE لا تقبل انحرافاً أصغر — استُعمل كما أُدخل`);
  const f0=f05(v);
  let wc;
  if(v.wc4>0){wc=v.wc4; st.push(`w/c مقروءة من الشكل 4 = ${ltr(fmt(wc,3))}`)}
  else{
   wc=wcFig4(f0,fm);
   st.push(`الجدول 2: ${ltr(`f0 = ${f0}`)} N/mm² عند ${ltr("w/c = 0.5")} ⇒ الشكل 4 (تقريباً): ${ltr(`w/c = 0.5 + ln(${f0} ÷ ${fmt(fm,2)}) ÷ ${T.k4} = ${fmt(wc,3)}`)}`);
   warn.push("w/c من تقريبٍ أسّيّ لمنحنيات الشكل 4 (دقّته نحو ±0.02): اقرأها من الشكل وأدخلها في حقلها لتحكم");
  }
  const D=v.exp==="none"?null:durOf(v.exp);
  if(D){
   if(wc>D.wc){wc=D.wc; st.push(`الديمومة (${D.n}) تحكم ⇒ ${ltr(`w/c = ${fmt(wc,2)}`)}`)}
   if(v.fcu<D.grade)warn.push(`BS 8110 الجدول 3.3: أدنى رتبة لحالة «${D.n}» هي C${D.grade} — fcu المُدخلة أقلّ`);
  }
  const {W,Wf,Wc}=water(v);
  st.push(v.fa===v.ca
   ?`الجدول 3: هبوط ${ltr(v.slump)} مم ومقاس ${ltr(v.dmax)} مم ⇒ ${ltr(`W = ${fmt(W,0)}`)} كجم/م³`
   :`الجدول 3: ${ltr(`W = ⅔ × ${Wf} + ⅓ × ${Wc} = ${fmt(W,1)}`)} كجم/م³ (ركامان من نوعين)`);
  let C=W/wc;
  st.push(ltr(`C = ${fmt(W,1)} ÷ ${fmt(wc,3)} = ${fmt(C,1)}`)+" كجم");
  if(D&&C<D.cmin){C=D.cmin; wc=W/C; st.push(`أدنى محتوى أسمنت للديمومة ${ltr(D.cmin)} كجم يحكم ⇒ ${ltr(`w/c = ${fmt(wc,3)}`)}`)}
  if(C>T.cMax)warn.push(`محتوى الأسمنت أكبر من ${T.cMax} كجم/م³: خطر الانكماش وحرارة الإماهة — راجع الخلطة`);
  const va=v.air/100, vagg=1-W/1000-C/(1000*v.gc)-va, A=vagg*1000*v.rd;
  st.push(`الركام الكلّي = ${ltr(`(1 − ${fmt(W/1000,4)} − ${fmt(C/(1000*v.gc),4)} − ${fmt(va,3)}) × ${fmt(v.rd*1000,0)} = ${fmt(A,1)}`)} كجم`);
  const FA=v.pf/100*A, CA=A-FA;
  st.push(ltr(`FA = ${fmt(v.pf,1)}% × ${fmt(A,1)} = ${fmt(FA,1)}`)+" كجم ، "+ltr(`CA = ${fmt(CA,1)}`)+" كجم");
  const o={fm,wc,W,C,bags:C/50,A,FA,CA,dens:W+C+A};
  T.split[+v.dmax].forEach(([sz,f])=>{o["c"+sz]=CA*f});
  if(v.dmax!=="10")st.push("تقسيم الحصى (BRE البند 6.6): "+T.split[+v.dmax].map(([sz,f])=>ltr(`${sz} مم: ${fmt(CA*f,0)}`)).join(" ، ")+" كجم");
  if(D){
   /* الرتبة المعتمدة للغطاء: الأعلى بين fcu وأدنى رتبةٍ مسموحة للتعرّض */
   let gi=BS8110_DUR.grades.findIndex(g=>g>=v.fcu); if(gi<0)gi=BS8110_DUR.grades.length-1;
   const cv=BS8110_DUR.exp[v.exp].cover[Math.max(gi,D.i)];
   if(cv!=null)o.cover=cv;
   if(+v.dmax!==20)warn.push("قيم الجدول 3.3 لركام 20 مم: عدِّل أدنى محتوى أسمنت للمقاس الآخر حسب الكود");
  }
  if(vagg<=0.5)warn.push("حجم الركام صغيرٌ جدّاً — راجع المدخلات");
  warn.push("نسبة الرمل مدخلٌ من الشكل 6 لا تُحسب هنا: أي تغيير في المقاس أو الهبوط أو w/c يستوجب قراءتها من جديد");
  /* النسبة الحجمية السائبة بكثافاتٍ شائعة: أسمنت 1440 ، رمل 1600 ، حصى 1500 */
  const vC=C/1440, vF=FA/1600, vG=CA/1500;
  o.wt=ltr(`1 : ${fmt(FA/C,2)} : ${fmt(CA/C,2)}`);
  o.vol=ltr(`1 : ${fmt(vF/vC,2)} : ${fmt(vG/vC,2)}`);
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"مثال DoE المنشور: C30 بلا سجلّ · ركام مكسَّر 20 مم · هبوط 10–30 · w/c من الشكل 4 = 0.55",
   src:"القيم المنشورة للمثال في BRE (1997) كما تُنقل في كتب المواد: w/c 0.55 ، ماء 190 ، أسمنت 345 ، كثافة 2400 ، ركام 1865 ، رمل 35٪ ⇒ 650 ، حصى 1215 (قراءة الشكل 5 تقرّب). يلزم مطابقتها بنصّ BRE الرسمي",
   in:{fcu:30,age:"28",sd:"none",def:"5",cem:"opc",ca:"cr",fa:"cr",slump:"10-30",dmax:"20",exp:"none",wc4:0.55,pf:35,rd:2.7,gc:3.15,air:1},
   out:{fm:43.12,wc:0.55,W:190,C:345,dens:2400,A:1865,FA:650,CA:1215},tol:0.006},
  {n:"المثال نفسه بتقريب الشكل 4",
   src:"حساب يدوي مستقل: fm = 43.12 ؛ w/c = 0.5 + ln(49 ÷ 43.12) ÷ 2.3 = 0.55558 ؛ C = 190 ÷ 0.55558 = 341.99 ؛ A = (1 − 0.19 − 0.10857 − 0.01) × 2700 = 1866.87 ؛ رمل 653.40 ؛ حصى 1213.47 (فرقه عن المنشور < 1٪)",
   in:{fcu:30,age:"28",sd:"none",def:"5",cem:"opc",ca:"cr",fa:"cr",slump:"10-30",dmax:"20",exp:"none",wc4:0,pf:35,rd:2.7,gc:3.15,air:1},
   out:{fm:43.12,wc:0.5555797,C:341.98512,A:1866.8699,FA:653.40446,CA:1213.46543,c10:404.48848,c20:808.97695},tol:1e-6},
  {n:"C25 · s = 6 من سجلّ · ركام طبيعي 20 مم · هبوط 30–60 · تعرّض متوسّط",
   src:"حساب يدوي مستقل: fm = 25 + 1.64×6 = 34.84 ؛ w/c = 0.5 + ln(42 ÷ 34.84) ÷ 2.3 = 0.58126 (< 0.60) ؛ W = 180 ؛ C = 309.67 (> 300) ؛ A = 1850.40 ؛ رمل 40٪ = 740.16",
   in:{fcu:25,age:"28",sd:"given",s:6,def:"5",cem:"opc",ca:"unc",fa:"unc",slump:"30-60",dmax:"20",exp:"moderate",wc4:0,pf:40,rd:2.6,gc:3.15,air:1},
   out:{fm:34.84,wc:0.5812624,W:180,C:309.67083,A:1850.39868,FA:740.15947,cover:35},tol:1e-6},
  {n:"C20 · ركام مكسَّر ورمل طبيعي 10 مم · هبوط 0–10 · تعرّض شديد (الديمومة تحكم)",
   src:"حساب يدوي مستقل: W = ⅔×150 + ⅓×180 = 160 ؛ w/c من الشكل 4 = 0.670 ⇒ قيد 0.55 ⇒ C = 290.9 < 325 ⇒ C = 325 و w/c = 160 ÷ 325 = 0.49231 ؛ A = 1926.09 ؛ رمل 45٪ = 866.74",
   in:{fcu:20,age:"28",sd:"none",def:"5",cem:"opc",ca:"cr",fa:"unc",slump:"0-10",dmax:"10",exp:"severe",wc4:0,pf:45,rd:2.65,gc:3.15,air:1},
   out:{fm:33.12,W:160,wc:0.4923077,C:325,A:1926.0873,FA:866.73929,CA:1059.34802},tol:1e-6}
 ]
};
