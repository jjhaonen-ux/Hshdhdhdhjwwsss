/* تصميم الدرج: القائمة والنائمة وعدد الدرجات بمعادلة بلوندل — المرحلة ٣-د
   المدى نفسه الذي تفحص به أداةُ الدرج (STAIR في tables.js = core/stairs.js)،
   ومخرجُها N يُطبَّق على درج المخطّط مباشرةً (calc/link.js). */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {STAIR as T} from "../tables.js";
/* الوضع الحرّ: N من القائمة المستهدفة ثم يُصحَّح إلى المدى، والنائمة من بلوندل */
export function stFree(H,r0,F,b){
 let N=Math.max(F+1,Math.round(H/r0));
 while(H/N>T.rise[1]+1e-9)N++;
 while(H/N<T.rise[0]-1e-9&&N>F+1)N--;
 const R=H/N, G=b-2*R;
 return {N,R,G,run:(N-F)*G};
}
/* وضع الطول المتاح: كلُّ N تقع قائمتُه في المدى، ويُختار الأقرب إلى بلوندل */
export function stFit(H,run,F,b){
 let best=null;
 for(let N=Math.max(F+1,Math.ceil(H/T.rise[1]-1e-9));N<=Math.floor(H/T.rise[0]+1e-9);N++){
  const R=H/N, G=run/(N-F), d=Math.abs(2*R+G-b);
  if(!best||d<best.d-1e-12)best={N,R,G,run,d};
 }
 return best;
}
export default {
 id:"stairs", group:"stairs", title:"تصميم الدرج (بلوندل)",
 desc:"عدد القوائم وارتفاع القائمة وعرض النائمة وطول الدرج من ارتفاع الدور، إمّا من قائمةٍ مستهدفة أو من طولٍ متاح، بمعادلة بلوندل 2ق + ن — وتُطبَّق النتيجة على درج المخطّط المحدَّد.",
 aliases:"stairs stair design riser tread going blondel درج سلم قائمه نائمه بلوندل عدد الدرجات ارتفاع الدور بسطه",
 ref:T.ref,
 formula:["N = تقريب(H ÷ ق المستهدفة) ثم يُصحَّح حتى تقع ق = H ÷ N في 150 – 200 مم","الحرّ: ن = 630 − 2ق ، والطول = (N − عدد الرحلات) × ن","الطول المتاح: ن = الطول ÷ (N − عدد الرحلات) ، ويُختار N الأقرب إلى 2ق + ن = 630","الميل = atan(ق ÷ ن)"],
 inputs:[
  {k:"H",n:"ارتفاع الدور (من أرضية إلى أرضية)",kind:"len",unit:"mm",def:3200,min:500,max:8000},
  {k:"mode",n:"المعطى",type:"sel",def:"free",opts:[{v:"free",n:"قائمةٌ مستهدفة (الطول يُحسب)"},{v:"fit",n:"طولٌ متاح للرحلات"}]},
  {k:"r0",n:"القائمة المستهدفة",kind:"len",unit:"mm",def:170,min:T.rise[0],max:T.rise[1],when:v=>v.mode==="free"},
  {k:"run",n:"الطول المتاح (مجموع الرحلات بلا البسطة)",kind:"len",unit:"m",def:4.5,min:0.5,max:40,when:v=>v.mode==="fit"},
  {k:"F",n:"عدد الرحلات",type:"sel",def:"1",opts:[{v:"1",n:"رحلة واحدة (مستقيم)"},{v:"2",n:"رحلتان ببسطة (L أو U)"}]},
  {k:"b",n:"خطوة بلوندل 2ق + ن",kind:"len",unit:"mm",def:T.blondel,min:T.rule[0],max:T.rule[1]}
 ],
 outputs:[
  {k:"N",n:"عدد القوائم",dp:0,main:1},
  {k:"R",n:"القائمة",kind:"len",unit:"mm",dp:1,main:1},
  {k:"G",n:"النائمة",kind:"len",unit:"mm",dp:1,main:1},
  {k:"rule",n:"2ق + ن",kind:"len",unit:"mm",dp:1},
  {k:"nT",n:"عدد النائمات",dp:0},
  {k:"run",n:"طول الرحلات",kind:"len",unit:"m",dp:3},
  {k:"ang",n:"ميل الدرج",kind:"ang",unit:"deg",dp:1}
 ],
 compute(v){
  const F=+v.F, st=[], warn=[];
  let r;
  if(v.mode==="free"){
   r=stFree(v.H,v.r0,F,v.b);
   st.push(ltr(`N = ${fmt(v.H,0)} ÷ ${fmt(v.r0,0)} ⇒ ${r.N}`)+" ، "+ltr(`R = ${fmt(r.R,2)}`)+" ، "+ltr(`G = ${fmt(v.b,0)} − 2 × ${fmt(r.R,2)} = ${fmt(r.G,2)}`)+" مم");
  }else{
   r=stFit(v.H,v.run*1000,F,v.b);
   if(!r)throw new Error(`لا عددَ قوائم يضع القائمة بين ${T.rise[0]} و${T.rise[1]} مم لهذا الارتفاع`);
   st.push(ltr(`N = ${r.N} ⇒ R = ${fmt(v.H,0)} ÷ ${r.N} = ${fmt(r.R,2)} ، G = ${fmt(v.run*1000,0)} ÷ ${r.N-F} = ${fmt(r.G,2)}`)+" مم");
  }
  const rule=2*r.R+r.G, ang=Math.atan(r.R/r.G)*180/Math.PI;
  st.push(ltr(`2 × ${fmt(r.R,2)} + ${fmt(r.G,2)} = ${fmt(rule,2)}`)+" مم ، "+ltr(`atan(${fmt(r.R,2)} ÷ ${fmt(r.G,2)}) = ${fmt(ang,2)}°`));
  if(r.G<T.treadMin)warn.push(`النائمة ${fmt(r.G,0)} مم أقلّ من ${T.treadMin} مم: زِد الطول المتاح`);
  if(rule<T.rule[0]-1e-9||rule>T.rule[1]+1e-9)warn.push(`2ق + ن = ${fmt(rule,0)} مم خارج ${ltr(T.rule[0]+" – "+T.rule[1])} مم`);
  if(ang>42)warn.push("ميلٌ أكبر من 42°: يتجاوز حدّ الدرج الخاصّ في Approved Document K");
  return {out:{N:r.N,R:r.R,G:r.G,rule,nT:r.N-F,run:(r.N-F)*r.G/1000,ang},steps:st,warn};
 },
 cases:[
  {n:"دور 3.20 م بقائمة مستهدفة 170 مم ورحلة واحدة",src:"حساب يدوي: 3200 ÷ 170 = 18.8 ⇒ 19 ؛ R = 168.42 ؛ G = 630 − 336.84 = 293.16 ؛ الطول = 18 × 293.16 = 5.277 م ؛ الميل 29.88°",in:{H:3200,mode:"free",r0:170,F:"1",b:630},out:{N:19,R:168.421,G:293.158,rule:630,nT:18,run:5.27684,ang:29.8776},tol:1e-5},
  {n:"دور 3.00 م في طولٍ متاح 4.5 م",src:"حساب يدوي: N من 15 إلى 20 ؛ عند 17: R = 176.47 و G = 4500 ÷ 16 = 281.25 ⇒ 2R+G = 634.19 (الأقرب إلى 630)",in:{H:3000,mode:"fit",run:4.5,F:"1",b:630},out:{N:17,R:176.471,G:281.25,rule:634.191,nT:16,ang:32.1063},tol:1e-5},
  {n:"دور 3.30 م برحلتين في 4.8 م",src:"حساب يدوي: عند N = 19: R = 173.68 و G = 4800 ÷ 17 = 282.35 ⇒ 2R+G = 629.72",in:{H:3300,mode:"fit",run:4.8,F:"2",b:630},out:{N:19,R:173.684,G:282.353,rule:629.721,nT:17,run:4.8},tol:1e-5}
 ]
};
