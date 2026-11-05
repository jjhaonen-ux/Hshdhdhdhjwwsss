/* أبعاد القاعدة المبدئية — المرحلة ٣-ج */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {BS8110_GF as F} from "../tables.js";
const STEP=0.05;                         /* التقريب للأعلى لأقرب 50 مم */
const up=x=>Math.ceil(x/STEP-1e-9)*STEP;
export default {
 id:"footing", group:"soil", title:"أبعاد القاعدة المبدئية",
 desc:"أبعاد قاعدةٍ منفصلة (مربّعة أو مستطيلة) أو شريطية من حمل العمود الميّت والحيّ والقدرة المسموحة الصافية، مع إجهاد الخدمة الفعلي وإجهاد التصميم النهائي الذي تُصمَّم به القاعدة.",
 aliases:"footing size isolated strip pad foundation dimensions قاعده ابعاد منفصله شريطيه مربعه مستطيله حمل عمود مساحه اساس",
 ref:"BS 8004:2015 (الأساسات: الإجهاد المسموح) · BS 8110-1:1997 الجدول 2.1 (إجهاد التصميم النهائي)",
 formula:["P = (Gk + Qk) × (1 + نسبة وزن القاعدة والردم)","A = P ÷ qa ، المربّعة: B = √A ، المستطيلة: B = √(A ÷ نسبة L/B) ثم L = A ÷ B (تقريب 50 مم للأعلى)","الشريطية (لكل م طول): B = P ÷ qa","إجهاد الخدمة = P ÷ (B·L) ، وإجهاد التصميم = (1.4 Gk + 1.6 Qk) ÷ (B·L) (بلا وزن القاعدة)"],
 inputs:[
  {k:"sh",n:"الشكل",type:"sel",def:"sq",opts:[{v:"sq",n:"مربّعة"},{v:"rect",n:"مستطيلة"},{v:"strip",n:"شريطية (لكل متر طول)"}]},
  {k:"G",n:"الحمل الميّت Gk (kN، أو kN/م للشريطية)",kind:"force",unit:"kN",def:600,min:0},
  {k:"Q",n:"الحمل الحيّ Qk (kN، أو kN/م للشريطية)",kind:"force",unit:"kN",def:400,min:0},
  {k:"qa",n:"القدرة المسموحة الصافية qa",kind:"press",unit:"kPa",def:200,min:25,max:2000},
  {k:"sw",n:"وزن القاعدة والردم من الحمل",kind:"pct",unit:"pct",def:10,min:0,max:30},
  {k:"ratio",n:"النسبة L ÷ B",def:1.5,min:1,max:3,step:0.1,when:v=>v.sh==="rect"},
  /* (v2.11.0 · ٣-د) القاعدة المرسومة: تُملأ من المخطّط حين تُحدَّد قاعدة، و0 = بلا فحص */
  {k:"Bd",n:"عرض القاعدة المرسومة (0 = بلا فحص)",kind:"len",unit:"m",def:0,min:0,max:12},
  {k:"Ld",n:"طول القاعدة المرسومة",kind:"len",unit:"m",def:0,min:0,max:12,when:v=>v.sh!=="strip"&&v.Bd>0}
 ],
 outputs:[
  {k:"P",n:"الحمل الكلّي P",kind:"force",unit:"kN",dp:1},
  {k:"A",n:"المساحة المطلوبة",kind:"area",unit:"m2",dp:3},
  {k:"B",n:"العرض B",kind:"len",unit:"m",dp:2,main:1},
  {k:"L",n:"الطول L",kind:"len",unit:"m",dp:2,main:1,when:v=>v.sh!=="strip"},
  {k:"qs",n:"إجهاد الخدمة الفعلي",kind:"press",unit:"kPa",dp:1},
  {k:"qd",n:"إجهاد التصميم النهائي",kind:"press",unit:"kPa",dp:1,main:1},
  {k:"qsd",n:"إجهاد الخدمة على القاعدة المرسومة",kind:"press",unit:"kPa",dp:1,when:v=>v.Bd>0},
  {k:"ud",n:"استغلال القاعدة المرسومة (qs ÷ qa)",dp:3,main:1,when:v=>v.Bd>0},
  {k:"okd",n:"القاعدة المرسومة",u:"",when:v=>v.Bd>0}
 ],
 /* (v2.11.0) Gk = Qk = 0 كان يعطي «النتيجة غير محدّدة» على الإجهادين (0 ÷ 0) بلا سبب مفهوم */
 check:v=>v.G+v.Q>0?[]:["أدخل حملاً ميّتاً أو حيّاً أكبر من صفر"],
 compute(v){
  const P=(v.G+v.Q)*(1+v.sw/100), A=P/v.qa, Nu=F.uls.dq.g*v.G+F.uls.dq.q*v.Q, st=[], warn=[], o={P,A};
  st.push(ltr(`P = (${fmt(v.G,1)} + ${fmt(v.Q,1)}) × ${fmt(1+v.sw/100,2)} = ${fmt(P,2)}`)+" kN ، "+ltr(`A = ${fmt(P,2)} ÷ ${fmt(v.qa,1)} = ${fmt(A,3)}`)+" م²");
  let area;
  if(v.sh==="strip"){o.B=up(A); area=o.B; st.push(ltr(`B = ${fmt(A,3)} ⇒ ${fmt(o.B,2)}`)+" م لكل متر طول")}
  else if(v.sh==="sq"){o.B=up(Math.sqrt(A)); o.L=o.B; area=o.B*o.L; st.push(ltr(`B = √${fmt(A,3)} = ${fmt(Math.sqrt(A),3)} ⇒ ${fmt(o.B,2)}`)+" م")}
  else{o.B=up(Math.sqrt(A/v.ratio)); o.L=up(A/o.B); area=o.B*o.L;
   st.push(ltr(`B = √(${fmt(A,3)} ÷ ${fmt(v.ratio,2)}) = ${fmt(Math.sqrt(A/v.ratio),3)} ⇒ ${fmt(o.B,2)} ، L = ${fmt(A,3)} ÷ ${fmt(o.B,2)} ⇒ ${fmt(o.L,2)}`)+" م")}
  o.qs=P/area; o.qd=Nu/area;
  st.push(ltr(`qs = ${fmt(P,2)} ÷ ${fmt(area,3)} = ${fmt(o.qs,2)}`)+" kPa ، "+ltr(`qd = ${fmt(Nu,2)} ÷ ${fmt(area,3)} = ${fmt(o.qd,2)}`)+" kPa");
  if(v.Bd>0){
   const Ad=v.sh==="strip"?v.Bd:v.Bd*(v.Ld>0?v.Ld:v.Bd);
   o.qsd=P/Ad; o.ud=o.qsd/v.qa; o.okd=o.ud<=1+1e-9?"✓ كافية":"✗ غير كافية — كبّرها";
   st.push(ltr(`المرسومة: ${fmt(P,2)} ÷ ${fmt(Ad,3)} = ${fmt(o.qsd,2)} kPa ، ${fmt(o.qsd,2)} ÷ ${fmt(v.qa,1)} = ${fmt(o.ud,3)}`));
  }
  if(o.B<(v.sh==="strip"?0.45:0.6)-1e-9)warn.push(`العرض ${fmt(o.B,2)} م أقلّ من الحدّ العمليّ الشائع (${v.sh==="strip"?"0.45":"0.60"} م) للحفر والتسليح — اعتمد الأكبر`);
  if(v.sh!=="strip"&&o.B>4)warn.push("قاعدة كبيرة (B > 4 م): ادرس القاعدة المشتركة أو اللبشة");
  warn.push("أبعادٌ مبدئية: لا تشمل السماكة وقصّ الثقب والتسليح (المرحلة ٤) ولا الأحمال اللامركزية");
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"قاعدة مربّعة: Gk 600 و Qk 400 kN و qa = 200 kPa",src:"حساب يدوي: P = 1100 ؛ A = 5.5 ؛ √A = 2.345 ⇒ B = 2.35 م ؛ qs = 1100 ÷ 5.5225 = 199.19 ؛ qd = (840 + 640) ÷ 5.5225 = 267.99",in:{sh:"sq",G:600,Q:400,qa:200,sw:10},out:{P:1100,A:5.5,B:2.35,L:2.35,qs:199.1851,qd:267.9946},tol:1e-6},
  {n:"قاعدة مستطيلة L/B = 1.5 لنفس الأحمال",src:"حساب يدوي: B = √(5.5÷1.5) = 1.915 ⇒ 1.95 م ؛ L = 5.5 ÷ 1.95 = 2.82 ⇒ 2.85 م ؛ qs = 1100 ÷ (1.95×2.85) = 1100 ÷ 5.5575 = 197.9307",in:{sh:"rect",G:600,Q:400,qa:200,sw:10,ratio:1.5},out:{B:1.95,L:2.85,qs:197.9307},tol:1e-6},
  {n:"قاعدة شريطية: 150 + 100 kN/م و qa = 150 kPa",src:"حساب يدوي: P = 275 kN/م ⇒ B = 275 ÷ 150 = 1.833 ⇒ 1.85 م ؛ qs = 275 ÷ 1.85 = 148.65 ؛ qd = (210 + 160) ÷ 1.85 = 200",in:{sh:"strip",G:150,Q:100,qa:150,sw:10},out:{P:275,B:1.85,qs:148.6486,qd:200},tol:1e-6},
  {n:"فحص قاعدة مرسومة 2.0 × 2.0 م لأحمال الحالة الأولى",src:"حساب يدوي: P = 1100 ؛ المرسومة 4.0 م² ⇒ qs = 275 kPa ؛ 275 ÷ 200 = 1.375 > 1 ⇒ غير كافية (المطلوب 2.35 م)",in:{sh:"sq",G:600,Q:400,qa:200,sw:10,Bd:2,Ld:2},out:{B:2.35,qsd:275,ud:1.375},tol:1e-9}
 ]
};
