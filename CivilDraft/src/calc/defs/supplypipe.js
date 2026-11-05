/* قطر ماسورة التغذية — المرحلة ٣-د · السرعة وهيزن-ويليامز */
import {ltr} from "../../core/units.js";
import {fmt,PI} from "../engine.js";
import {HAZEN as H} from "../tables.js";
export const hw=(Q,C,D)=>10.67*Math.pow(Q,1.852)/(Math.pow(C,1.852)*Math.pow(D,4.87));   /* م/م · Q م³/ث · D م */
export default {
 id:"supplypipe", group:"water", title:"قطر ماسورة التغذية",
 desc:"أصغر قطرٍ داخليّ يحقّق التدفّق التصميمي دون تجاوز السرعة القصوى، وأقرب قطرٍ اسميّ أكبر منه، والسرعة الفعلية وفقد الاحتكاك بمعادلة هيزن-ويليامز.",
 aliases:"supply pipe diameter water pipe sizing velocity hazen williams ماسوره تغذيه قطر مواسير مياه سرعه تدفق فاقد احتكاك",
 ref:H.ref,
 formula:["D المطلوب = √(4Q ÷ (π v)) ثم أقرب قطرٍ اسميّ أكبر","v الفعلية = Q ÷ (π D² ÷ 4)","J = 10.67 Q^1.852 ÷ (C^1.852 D^4.87) (م لكل م) ، والفقد = J × الطول"],
 inputs:[
  {k:"Q",n:"التدفّق التصميمي",kind:"flow",unit:"Ls",def:1,min:0.01,max:500},
  {k:"v",n:"السرعة القصوى",kind:"vel",unit:"ms",def:2,min:0.3,max:3},
  {k:"m",n:"مادّة الماسورة",type:"sel",def:"ppr",opts:Object.entries(H.list).map(([v,o])=>({v,n:`${o.t} — C = ${o.c}`}))},
  {k:"Lp",n:"طول الخطّ (0 = تجاهل)",kind:"len",unit:"m",def:0,min:0}
 ],
 outputs:[
  {k:"Dr",n:"القطر الداخلي المطلوب",kind:"len",unit:"mm",dp:1},
  {k:"Ds",n:"القطر الاسمي المقترح",kind:"len",unit:"mm",dp:0,main:1},
  {k:"vs",n:"السرعة الفعلية",kind:"vel",unit:"ms",dp:2,main:1},
  {k:"J",n:"فقد الاحتكاك",dp:2,u:"م لكل 100 م"},
  {k:"hf",n:"الفقد على الطول",kind:"len",unit:"m",dp:2,when:v=>v.Lp>0}
 ],
 compute(v){
  const q=v.Q/1000, C=H.list[v.m].c, Dr=Math.sqrt(4*q/(PI*v.v))*1000, st=[], warn=[];
  const Ds=H.dn.find(d=>d>=Dr-1e-9);
  st.push(ltr(`D = √(4 × ${fmt(q,5)} ÷ (π × ${fmt(v.v,2)})) = ${fmt(Dr,1)}`)+" مم");
  if(Ds==null)throw new Error(`القطر المطلوب ${fmt(Dr,0)} مم أكبر من ${H.dn[H.dn.length-1]} مم: قسّم التدفّق على خطّين`);
  const vs=q/(PI*Math.pow(Ds/1000,2)/4), J=hw(q,C,Ds/1000), o={Dr,Ds,vs,J:J*100};
  st.push(ltr(`DN ${Ds} ⇒ v = ${fmt(q,5)} ÷ ${fmt(PI*Math.pow(Ds/1000,2)/4,6)} = ${fmt(vs,2)}`)+" م/ث");
  st.push(ltr(`J = ${fmt(J*100,2)}`)+" م لكل 100 م");
  if(v.Lp>0){o.hf=J*v.Lp; st.push(ltr(`${fmt(J,5)} × ${fmt(v.Lp,1)} = ${fmt(o.hf,2)}`)+" م")}
  warn.push("القطر الاسمي ليس الداخلي دائماً: راجع القطر الداخلي في نشرة المصنّع وضغطها (PN)");
  if(J*100>10)warn.push("فقدٌ كبير (> 10 م لكل 100 م): كبّر القطر أو قلّل السرعة");
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"1 لتر/ث بسرعة 2 م/ث (PPR)",src:"حساب يدوي: D = √(0.004÷6.2832) = 25.23 مم ⇒ DN32 ؛ v = 0.001÷0.000804 = 1.243 م/ث ؛ J = 5.272 م/100 م",in:{Q:1,v:2,m:"ppr",Lp:0},out:{Dr:25.2313,Ds:32,vs:1.24340,J:5.27185},tol:1e-5},
  {n:"0.3 لتر/ث بسرعة 1.5 م/ث (نحاس) على 20 م",src:"حساب يدوي: D = 15.96 مم ⇒ DN20 ؛ v = 0.955 م/ث ؛ J = 6.355 م/100 م ⇒ 1.271 م",in:{Q:0.3,v:1.5,m:"cu",Lp:20},out:{Dr:15.9577,Ds:20,vs:0.954930,J:6.35547,hf:1.27109},tol:1e-5},
  {n:"3 لتر/ث بسرعة 2 م/ث (مجلفن) على 50 م",src:"حساب يدوي: D = 43.70 مم ⇒ DN50 ؛ v = 1.528 م/ث ؛ J = 6.937 م/100 م ⇒ 3.468 م",in:{Q:3,v:2,m:"gi",Lp:50},out:{Dr:43.7019,Ds:50,vs:1.52789,J:6.93690,hf:3.46845},tol:1e-5}
 ]
};
