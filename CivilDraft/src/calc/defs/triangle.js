/* المثلثات والزوايا */
import {ltr} from "../../core/units.js";
import {fmt,deg} from "../engine.js";
export default {
 id:"triangle", group:"general", title:"المثلثات والزوايا",
 desc:"يحلّ المثلث القائم من ضلعيه القائمين، أو أيَّ مثلثٍ من أضلاعه الثلاثة: الزوايا والمساحة والمحيط — لتوقيع الزوايا في الموقع (٣-٤-٥) والجملونات.",
 aliases:"triangle angle pythagoras heron مثلث زاويه زوايا فيثاغورس هيرون وتر قائم",
 ref:"نظرية فيثاغورس · قانون جيب التمام · صيغة هيرون",
 formula:["قائم: c = √(a² + b²) ، A = tan⁻¹(a/b)","عام: cos A = (b² + c² − a²) ÷ 2bc","هيرون: s = (a+b+c)/2 ، المساحة = √(s(s−a)(s−b)(s−c))"],
 inputs:[
  {k:"mode",n:"المعلوم",type:"sel",def:"right",opts:[{v:"right",n:"مثلث قائم: الضلعان القائمان"},{v:"sss",n:"الأضلاع الثلاثة"}]},
  {k:"a",n:"الضلع a",kind:"len",unit:"m",def:3,min:0.000001},
  {k:"b",n:"الضلع b",kind:"len",unit:"m",def:4,min:0.000001},
  {k:"c",n:"الضلع c",kind:"len",unit:"m",def:5,min:0.000001,when:v=>v.mode==="sss"}
 ],
 check(v){
  if(v.mode!=="sss")return [];
  const {a,b,c}=v;
  return (a+b<=c||a+c<=b||b+c<=a)?[{k:"c",m:"الأضلاع لا تصنع مثلثاً: مجموع أيّ ضلعين يجب أن يزيد عن الثالث"}]:[];
 },
 outputs:[
  {k:"c",n:"الضلع c (الوتر في القائم)",kind:"len",unit:"m",dp:4,main:1,when:v=>v.mode==="right"},
  {k:"A",n:"الزاوية A (مقابل a)",kind:"ang",unit:"deg",dp:4},
  {k:"B",n:"الزاوية B (مقابل b)",kind:"ang",unit:"deg",dp:4},
  {k:"C",n:"الزاوية C (مقابل c)",kind:"ang",unit:"deg",dp:4},
  {k:"area",n:"المساحة",kind:"area",unit:"m2",dp:4,main:1},
  {k:"P",n:"المحيط",kind:"len",unit:"m",dp:4}
 ],
 compute(v){
  const a=v.a,b=v.b, st=[];
  if(v.mode==="right"){
   const c=Math.hypot(a,b), A=deg(Math.atan2(a,b));
   st.push(ltr(`c = √(${fmt(a)}² + ${fmt(b)}²) = ${fmt(c,4)}`), ltr(`A = tan⁻¹(${fmt(a)} ÷ ${fmt(b)}) = ${fmt(A,4)}°`));
   return {out:{c,A,B:90-A,C:90,area:a*b/2,P:a+b+c},steps:st};
  }
  const c=v.c, ang=(x,y,z)=>deg(Math.acos(Math.max(-1,Math.min(1,(y*y+z*z-x*x)/(2*y*z)))));
  const A=ang(a,b,c), B=ang(b,a,c), C=180-A-B, s=(a+b+c)/2, area=Math.sqrt(Math.max(0,s*(s-a)*(s-b)*(s-c)));
  st.push(ltr(`cos A = (${fmt(b)}² + ${fmt(c)}² − ${fmt(a)}²) ÷ (2 × ${fmt(b)} × ${fmt(c)}) ⇒ A = ${fmt(A,4)}°`),
   ltr(`s = ${fmt(s,4)}`)+" ، المساحة = "+ltr(`√(${fmt(s,4)} × ${fmt(s-a,4)} × ${fmt(s-b,4)} × ${fmt(s-c,4)}) = ${fmt(area,4)}`));
  return {out:{A,B,C,area,P:2*s},steps:st};
 },
 cases:[
  {n:"المثلث ٣-٤-٥",src:"فيثاغورس: c = 5 ، A = 36.87° ، المساحة 6 (حساب مباشر)",in:{mode:"right",a:3,b:4},out:{c:5,A:36.869898,B:53.130102,area:6},tol:1e-5},
  {n:"مثلثٌ متطابق الأضلاع ٢ م",src:"متطابق الأضلاع: الزوايا 60° ، المساحة = √3 = 1.7321",in:{mode:"sss",a:2,b:2,c:2},out:{A:60,B:60,C:60,area:1.732051},tol:1e-5},
  {n:"المثلث ٧-٨-٩",src:"هيرون: s = 12 ، المساحة = √720 = 26.833 ، A = 48.19°",in:{mode:"sss",a:7,b:8,c:9},out:{area:26.832816,A:48.189685,B:58.411864,C:73.398451},tol:1e-5}
 ]
};
