/* مساحات وحجوم الأشكال */
import {ltr} from "../../core/units.js";
import {PI,fmt} from "../engine.js";
const S2=["rect","circle","tri","trap"], S3=["box","cyl","cone","sphere"];
const has=(s,L)=>v=>L.includes(v.shape)&&s;
export default {
 id:"shapes", group:"general", title:"مساحات وحجوم الأشكال",
 desc:"مساحة ومحيط الأشكال المستوية (مستطيل · دائرة · مثلث · شبه منحرف) وحجم ومساحة سطح المجسّمات (متوازي مستطيلات · أسطوانة · مخروط · كرة).",
 aliases:"shapes area volume مساحه حجم شكل دائره مثلث اسطوانه كره مخروط محيط",
 ref:"معادلات الهندسة الإقليدية القياسية",
 formula:["مستطيل: A = a·b ، P = 2(a+b)","دائرة: A = π r² ، P = 2π r","مثلث: A = ½·b·h","شبه منحرف: A = ½(a+b)·h",
  "متوازي مستطيلات: V = a·b·h","أسطوانة: V = π r² h ، السطح = 2π r(r+h)","مخروط: V = ⅓ π r² h ، السطح = π r(r+√(r²+h²))","كرة: V = ⁴⁄₃ π r³ ، السطح = 4π r²"],
 inputs:[
  {k:"shape",n:"الشكل",type:"sel",def:"rect",opts:[
   {v:"rect",n:"مستطيل"},{v:"circle",n:"دائرة"},{v:"tri",n:"مثلث (قاعدة وارتفاع)"},{v:"trap",n:"شبه منحرف"},
   {v:"box",n:"متوازي مستطيلات"},{v:"cyl",n:"أسطوانة"},{v:"cone",n:"مخروط"},{v:"sphere",n:"كرة"}]},
  {k:"a",n:"الطول a / القاعدة",kind:"len",unit:"m",def:4,min:0,when:v=>["rect","tri","trap","box"].includes(v.shape)},
  {k:"b",n:"العرض b / القاعدة الثانية",kind:"len",unit:"m",def:3,min:0,when:v=>["rect","trap","box"].includes(v.shape)},
  {k:"r",n:"نصف القطر r",kind:"len",unit:"m",def:1,min:0,when:v=>["circle","cyl","cone","sphere"].includes(v.shape)},
  {k:"h",n:"الارتفاع h",kind:"len",unit:"m",def:2,min:0,when:v=>["tri","trap","box","cyl","cone"].includes(v.shape)}
 ],
 outputs:[
  {k:"A",n:"المساحة",kind:"area",unit:"m2",dp:4,main:1,when:v=>S2.includes(v.shape)},
  {k:"P",n:"المحيط",kind:"len",unit:"m",dp:4,when:v=>["rect","circle"].includes(v.shape)},
  {k:"V",n:"الحجم",kind:"vol",unit:"m3",dp:4,main:1,when:v=>S3.includes(v.shape)},
  {k:"Sa",n:"مساحة السطح الكلّية",kind:"area",unit:"m2",dp:4,when:v=>S3.includes(v.shape)}
 ],
 compute(v){
  const {a,b,r,h}=v, o={}, st=[];
  switch(v.shape){
   case "rect": o.A=a*b; o.P=2*(a+b); st.push(ltr(`A = ${fmt(a)} × ${fmt(b)} = ${fmt(o.A,4)}`)+" م²"); break;
   case "circle": o.A=PI*r*r; o.P=2*PI*r; st.push(ltr(`A = π × ${fmt(r)}² = ${fmt(o.A,4)}`)+" م²"); break;
   case "tri": o.A=a*h/2; st.push(ltr(`A = ½ × ${fmt(a)} × ${fmt(h)} = ${fmt(o.A,4)}`)+" م²"); break;
   case "trap": o.A=(a+b)/2*h; st.push(ltr(`A = ½ × (${fmt(a)} + ${fmt(b)}) × ${fmt(h)} = ${fmt(o.A,4)}`)+" م²"); break;
   case "box": o.V=a*b*h; o.Sa=2*(a*b+a*h+b*h); st.push(ltr(`V = ${fmt(a)} × ${fmt(b)} × ${fmt(h)} = ${fmt(o.V,4)}`)+" م³"); break;
   case "cyl": o.V=PI*r*r*h; o.Sa=2*PI*r*(r+h); st.push(ltr(`V = π × ${fmt(r)}² × ${fmt(h)} = ${fmt(o.V,4)}`)+" م³"); break;
   case "cone": o.V=PI*r*r*h/3; o.Sa=PI*r*(r+Math.hypot(r,h)); st.push(ltr(`V = ⅓ × π × ${fmt(r)}² × ${fmt(h)} = ${fmt(o.V,4)}`)+" م³"); break;
   case "sphere": o.V=4/3*PI*r**3; o.Sa=4*PI*r*r; st.push(ltr(`V = ⁴⁄₃ × π × ${fmt(r)}³ = ${fmt(o.V,4)}`)+" م³"); break;
  }
  return {out:o,steps:st};
 },
 cases:[
  {n:"دائرةٌ نصف قطرها ١ م",src:"معادلات هندسية قياسية: A = πr² ، P = 2πr",in:{shape:"circle",r:1},out:{A:3.141593,P:6.283185},tol:1e-5},
  {n:"شبه منحرف ٤ و٦ وارتفاع ٣",src:"A = ½(4+6)×3 = 15 (حساب مباشر)",in:{shape:"trap",a:4,b:6,h:3},out:{A:15},tol:1e-9},
  {n:"كرةٌ قطرها ١ م",src:"V = 4/3 π r³ ، السطح = 4π r² (معادلات قياسية)",in:{shape:"sphere",r:0.5},out:{V:0.523599,Sa:3.141593},tol:1e-5},
  {n:"أسطوانة r = 0.2 و h = 3",src:"حساب مباشر: π × 0.2² × 3 = 0.376991",in:{shape:"cyl",r:0.2,h:3},out:{V:0.376991},tol:1e-5}
 ]
};
