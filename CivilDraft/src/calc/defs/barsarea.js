/* عدد الأسياخ ↔ مساحة التسليح */
import {ltr} from "../../core/units.js";
import {fmt,barArea} from "../engine.js";
import {DIAS} from "./rebarwt.js";
export default {
 id:"barsarea", group:"steel", title:"عدد الأسياخ ↔ مساحة التسليح",
 desc:"مساحة مقطع عددٍ من الأسياخ، أو أقلّ عددٍ من قطرٍ معيّن يحقّق مساحة تسليحٍ مطلوبة — مع المساحة الموفَّرة والزيادة.",
 aliases:"bars area as steel area عدد الاسياخ مساحه التسليح مساحه الحديد as مم2 سم2",
 ref:"مساحة السيخ = π d²/4 (المعادلة الهندسية المباشرة)",
 formula:["مساحة السيخ Ab = π d²/4","As = n × Ab","n = ⌈ As المطلوبة ÷ Ab ⌉"],
 inputs:[
  {k:"mode",n:"المطلوب",type:"sel",def:"n2a",opts:[{v:"n2a",n:"المساحة من العدد"},{v:"a2n",n:"العدد من المساحة المطلوبة"}]},
  {k:"d",n:"القطر",type:"sel",def:"16",opts:DIAS.map(d=>({v:String(d),n:`Ø${d} مم`}))},
  {k:"n",n:"عدد الأسياخ",def:4,min:1,step:1,when:v=>v.mode==="n2a"},
  {k:"As",n:"مساحة التسليح المطلوبة",kind:"area",unit:"mm2",def:1200,min:1,when:v=>v.mode==="a2n"}
 ],
 outputs:[
  {k:"Ab",n:"مساحة السيخ الواحد",kind:"area",unit:"mm2",dp:2},
  {k:"n",n:"عدد الأسياخ",dp:0,main:1,when:v=>v.mode==="a2n"},
  {k:"Asp",n:"المساحة الموفَّرة",kind:"area",unit:"mm2",dp:1,main:1},
  {k:"Ascm",n:"المساحة الموفَّرة",kind:"area",unit:"cm2",dp:2},
  {k:"over",n:"الزيادة على المطلوب",kind:"pct",unit:"pct",dp:1,when:v=>v.mode==="a2n"}
 ],
 compute(v){
  const d=+v.d, Ab=barArea(d);
  if(v.mode==="n2a"){
   const n=Math.round(v.n), Asp=n*Ab;
   return {out:{Ab,Asp,Ascm:Asp/100},steps:[ltr(`Ab = π × ${d}²/4 = ${fmt(Ab,2)}`)+" مم²",ltr(`As = ${n} × ${fmt(Ab,2)} = ${fmt(Asp,1)}`)+" مم²"]};
  }
  const n=Math.max(1,Math.ceil(v.As/Ab-1e-9)), Asp=n*Ab;
  return {out:{Ab,n,Asp,Ascm:Asp/100,over:(Asp/v.As-1)*100},
   steps:[ltr(`Ab = π × ${d}²/4 = ${fmt(Ab,2)}`)+" مم²",ltr(`n = ⌈${fmt(v.As,1)} ÷ ${fmt(Ab,2)}⌉ = ⌈${fmt(v.As/Ab,3)}⌉ = ${n}`)]};
 },
 cases:[
  {n:"4Ø16",src:"حساب: 4 × π×16²/4 = 804.25 مم²",in:{mode:"n2a",d:"16",n:4},out:{Asp:804.25},tol:0.001},
  {n:"6Ø12",src:"حساب: 6 × π×12²/4 = 678.58 مم²",in:{mode:"n2a",d:"12",n:6},out:{Asp:678.58},tol:0.001},
  {n:"As = 1200 مم² بقطر 20",src:"Ab(Ø20) = 314.16 ⇒ ⌈3.82⌉ = 4 أسياخ = 1256.6 مم²",in:{mode:"a2n",d:"20",As:1200},out:{n:4,Asp:1256.64},tol:0.001}
 ]
};
