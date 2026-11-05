/* خزّان التحليل وحقل التصريف (البيّارة) — المرحلة ٣-د · BS 6297 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {SEPTIC as T} from "../tables.js";
import {up} from "./tank.js";
export default {
 id:"septic", group:"water", title:"خزّان التحليل والبيّارة",
 desc:"سعة خزّان التحليل (سبتك) من عدد المستخدمين وفق BS 6297، وأبعاده المبدئية بنسبة طول إلى عرض 2:1، ومساحة حقل التصريف (البيّارة/التسريب) من معامل نفاذية التربة Vp.",
 aliases:"septic tank soakaway drainage field percolation خزان تحليل سبتك بياره بيارة تسريب صرف صحي نفاذيه تربه Vp",
 ref:T.ref,
 formula:["P التصميمي = max(P ، 4)","C = 180 P + 2000 (لتر)","مساحة حقل التصريف A = P × Vp × 0.25 (م²) ، 15 ≤ Vp ≤ 100 ث/مم","العرض W = √(C ÷ 2h) ، والطول L = C ÷ (h × W) (تقريب 50 مم للأعلى)"],
 inputs:[
  {k:"P",n:"عدد المستخدمين",def:6,min:1,max:1000,step:1},
  {k:"Vp",n:"معامل النفاذية Vp (ث/مم)",def:30,min:T.vp[0],max:T.vp[1],hint:"اختبار التسريب BS 6297 الملحق A"},
  {k:"h",n:"عمق السائل في الخزّان",kind:"len",unit:"m",def:1.5,min:1,max:3}
 ],
 outputs:[
  {k:"Pe",n:"عدد المستخدمين التصميمي",dp:0},
  {k:"C",n:"سعة خزّان التحليل",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"W",n:"العرض الداخلي",kind:"len",unit:"m",dp:2},
  {k:"L",n:"الطول الداخلي",kind:"len",unit:"m",dp:2},
  {k:"A",n:"مساحة حقل التصريف",kind:"area",unit:"m2",dp:1,main:1}
 ],
 compute(v){
  const Pe=Math.max(T.pMin,Math.round(v.P)), C=(T.a*Pe+T.b)/1000, A=Pe*v.Vp*T.field, st=[], warn=[];
  const W=up(Math.sqrt(C/(2*v.h))), L=up(C/(v.h*W));
  st.push(ltr(`C = 180 × ${Pe} + 2000 = ${fmt(C*1000,0)}`)+" لتر");
  st.push(ltr(`W = √(${fmt(C,3)} ÷ ${fmt(2*v.h,2)}) ⇒ ${fmt(W,2)} ، L = ${fmt(C,3)} ÷ (${fmt(v.h,2)} × ${fmt(W,2)}) ⇒ ${fmt(L,2)}`)+" م");
  st.push(ltr(`A = ${Pe} × ${fmt(v.Vp,1)} × 0.25 = ${fmt(A,1)}`)+" م²");
  if(v.P<T.pMin)warn.push("BS 6297: أقلّ سعة تعادل 4 مستخدمين (≈ 2.7 م³)");
  warn.push("يُقسَم الخزّان غرفتين (الأولى ثلثا الطول)، ويُراجَع بُعد البيّارة عن المباني والآبار وفق اشتراطات الجهة");
  return {out:{Pe,C,W,L,A},steps:st,warn};
 },
 cases:[
  {n:"6 مستخدمين و Vp = 30 وعمق 1.5 م",src:"حساب يدوي: C = 1080 + 2000 = 3080 لتر ؛ A = 6×30×0.25 = 45 م² ؛ W = √(3.08÷3) = 1.013 ⇒ 1.05 ؛ L = 3.08÷1.575 = 1.956 ⇒ 2.00",in:{P:6,Vp:30,h:1.5},out:{Pe:6,C:3.08,A:45,W:1.05,L:2},tol:1e-9},
  {n:"10 مستخدمين و Vp = 50",src:"حساب يدوي: C = 3800 لتر ؛ A = 125 م² ؛ W = √(3.8÷3) = 1.125 ⇒ 1.15 ؛ L = 3.8÷1.725 = 2.203 ⇒ 2.25",in:{P:10,Vp:50,h:1.5},out:{C:3.8,A:125,W:1.15,L:2.25},tol:1e-9},
  {n:"3 مستخدمين ⇒ الحدّ الأدنى 4",src:"BS 6297: P = 4 ⇒ C = 2720 لتر ؛ A = 4×20×0.25 = 20 م² ؛ W = √(2.72÷2.4) = 1.065 ⇒ 1.10 ؛ L = 2.72÷1.32 = 2.061 ⇒ 2.10",in:{P:3,Vp:20,h:1.2},out:{Pe:4,C:2.72,A:20,W:1.1,L:2.1},tol:1e-9}
 ]
};
