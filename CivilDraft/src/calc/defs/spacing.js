/* تحويل التباعد ↔ مساحة التسليح لكل متر */
import {fmt,barArea} from "../engine.js";
import {ltr} from "../../core/units.js";
import {DIAS} from "./rebarwt.js";
export default {
 id:"spacing", group:"steel", title:"تباعد الأسياخ",
 desc:"مساحة التسليح لكل متر من قطرٍ وتباعد (Ø12@150)، أو أكبر تباعدٍ يحقّق مساحةً مطلوبة لكل متر، وعددُ الأسياخ على عرضٍ معلوم — للبلاطات والحوائط والقواعد.",
 aliases:"spacing bar spacing As per meter تباعد الاسياخ تباعد الحديد سيخ كل مسافه اسياخ في المتر @ c/c",
 ref:"As لكل متر = Ab × 1000 ÷ s (معادلةٌ هندسيةٌ مباشرة)",
 formula:["As لكل متر = (π d²/4) × 1000 ÷ s","s الأقصى = Ab × 1000 ÷ As المطلوبة (يُقرَّب إلى الأدنى)","عدد الأسياخ على العرض W = ⌊W ÷ s⌋ + 1"],
 inputs:[
  {k:"mode",n:"المطلوب",type:"sel",def:"s2a",opts:[{v:"s2a",n:"المساحة لكل متر من التباعد"},{v:"a2s",n:"التباعد من المساحة المطلوبة"}]},
  {k:"d",n:"القطر",type:"sel",def:"12",opts:DIAS.map(d=>({v:String(d),n:`Ø${d} مم`}))},
  {k:"s",n:"التباعد (مركز إلى مركز)",kind:"len",unit:"mm",def:150,min:25,max:1000,when:v=>v.mode==="s2a"},
  {k:"As",n:"المساحة المطلوبة لكل متر",kind:"apm",unit:"mm2m",def:500,min:1,when:v=>v.mode==="a2s"},
  {k:"rnd",n:"تقريب التباعد إلى الأدنى",type:"sel",def:"25",opts:[{v:"5",n:"5 مم"},{v:"10",n:"10 مم"},{v:"25",n:"25 مم"},{v:"50",n:"50 مم"}],when:v=>v.mode==="a2s"},
  {k:"W",n:"العرض المراد تغطيته (0 = تجاهل)",kind:"len",unit:"m",def:0,min:0}
 ],
 outputs:[
  {k:"asm",n:"المساحة لكل متر",kind:"apm",unit:"mm2m",dp:1,main:1},
  {k:"s",n:"التباعد المحسوب",kind:"len",unit:"mm",dp:1,when:v=>v.mode==="a2s"},
  {k:"sp",n:"التباعد العملي",kind:"len",unit:"mm",dp:0,main:1,when:v=>v.mode==="a2s"},
  {k:"npm",n:"عدد الأسياخ في المتر",dp:2},
  {k:"nW",n:"عدد الأسياخ على العرض",dp:0,when:(v)=>v.W>0}
 ],
 compute(v){
  const d=+v.d, Ab=barArea(d), st=[ltr(`Ab = π × ${d}²/4 = ${fmt(Ab,2)}`)+" مم²"], warn=[];
  let s, o={};
  if(v.mode==="s2a"){s=v.s}
  else{
   o.s=Ab*1000/v.As; const r=+v.rnd; s=Math.floor(o.s/r+1e-9)*r;
   st.push(ltr(`s = ${fmt(Ab,2)} × 1000 ÷ ${fmt(v.As,1)} = ${fmt(o.s,1)}`)+` مم ⇒ ${s} مم`);
   if(s<25){warn.push("التباعد أقلّ من 25 مم — اختر قطراً أكبر"); s=Math.max(s,1)}
   o.sp=s;
  }
  o.asm=Ab*1000/s; o.npm=1000/s;
  st.push(ltr(`As = ${fmt(Ab,2)} × 1000 ÷ ${fmt(s,1)} = ${fmt(o.asm,1)}`)+" مم²/م");
  if(v.W>0){o.nW=Math.floor(v.W*1000/s+1e-9)+1; st.push(ltr(`n = ⌊${fmt(v.W*1000,0)} ÷ ${fmt(s,1)}⌋ + 1 = ${o.nW}`))}
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"Ø12@150",src:"حساب: π×12²/4 × 1000 ÷ 150 = 753.98 مم²/م",in:{mode:"s2a",d:"12",s:150},out:{asm:753.98},tol:0.001},
  {n:"Ø10@200 على عرض 4 م",src:"حساب: 78.54 × 1000 ÷ 200 = 392.7 مم²/م ، العدد ⌊4000/200⌋ + 1 = 21",in:{mode:"s2a",d:"10",s:200,W:4},out:{asm:392.70,nW:21},tol:0.001},
  {n:"As = 500 مم²/م بقطر 10",src:"s = 78.54 × 1000 ÷ 500 = 157.1 ⇒ التقريب إلى 25 مم = 150 ⇒ 523.6 مم²/م",in:{mode:"a2s",d:"10",As:500,rnd:"25"},out:{s:157.08,sp:150,asm:523.6},tol:0.001}
 ]
};
