/* الدهان — المرحلة ٣-ب · BS 6150 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
export default {
 id:"paint", group:"masonry", title:"الدهان",
 desc:"لترات الدهان (والأساس) وعدد العبوات لمساحةٍ بعدد أوجهٍ ومعدّل فرشٍ معلوم من نشرة المصنِّع، مع نسبة الفقد.",
 aliases:"paint painting emulsion primer دهان دهانات بويه طلاء اوجه وجه برايمر اساس لتر جالون عبوه سطل",
 ref:"BS 6150:2019 (دهان المباني — دليل الممارسة) · معدّل الفرش من نشرة المصنِّع الفنية",
 formula:["الدهان = المساحة × عدد الأوجه ÷ معدّل الفرش × (1 + الفقد)",
  "الأساس = المساحة × أوجه الأساس ÷ معدّله × (1 + الفقد)","العبوات = ⌈ اللترات ÷ سعة العبوة ⌉"],
 inputs:[
  {k:"A",n:"المساحة",kind:"area",unit:"m2",def:100,min:0},
  {k:"n",n:"عدد أوجه الدهان",def:2,min:1,max:6,step:1},
  {k:"r",n:"معدّل الفرش للوجه (م²/لتر)",def:10,min:1,max:25,step:0.5},
  {k:"pn",n:"أوجه الأساس (0 = بلا أساس)",def:0,min:0,max:3,step:1},
  {k:"pr",n:"معدّل فرش الأساس (م²/لتر)",def:12,min:1,max:25,step:0.5,when:v=>v.pn>0},
  {k:"loss",n:"الفقد (مسامية، رشّ، بقايا)",kind:"pct",unit:"pct",def:0,min:0,max:50},
  {k:"can",n:"سعة العبوة",kind:"vol",unit:"L",def:18,min:0.25}
 ],
 outputs:[
  {k:"P",n:"الدهان",kind:"vol",unit:"L",dp:2,main:1},
  {k:"cans",n:"عبوات الدهان",dp:0,main:1},
  {k:"Pr",n:"الأساس",kind:"vol",unit:"L",dp:2,when:v=>v.pn>0},
  {k:"pcans",n:"عبوات الأساس",dp:0,when:v=>v.pn>0}
 ],
 compute(v){
  const n=Math.round(v.n), pn=Math.round(v.pn), w=1+v.loss/100;
  const P=v.A*n/v.r*w, o={P,cans:Math.ceil(P/v.can-1e-9)};
  const st=[ltr(`${fmt(v.A,2)} × ${n} ÷ ${fmt(v.r,2)}${v.loss?` × ${fmt(w,2)}`:""} = ${fmt(P,2)}`)+" لتر"];
  if(pn>0){o.Pr=v.A*pn/v.pr*w; o.pcans=Math.ceil(o.Pr/v.can-1e-9);
   st.push(ltr(`الأساس = ${fmt(v.A,2)} × ${pn} ÷ ${fmt(v.pr,2)}${v.loss?` × ${fmt(w,2)}`:""} = ${fmt(o.Pr,2)}`)+" لتر")}
  return {out:o,steps:st,warn:["معدّل الفرش يختلف بالمنتج ومسامية السطح — خذه من النشرة الفنية للمصنِّع"]};
 },
 cases:[
  {n:"100 م² بوجهين ومعدّل 10 م²/لتر",src:"حساب يدوي: 100 × 2 ÷ 10 = 20 لتراً ⇒ عبوتان 18 لتراً",in:{A:100,n:2,r:10},out:{P:20,cans:2},tol:1e-9},
  {n:"250 م² بوجهين ومعدّل 12 وفقد 10٪",src:"حساب يدوي: 250 × 2 ÷ 12 × 1.1 = 45.83 لتراً ⇒ 3 عبوات 18 لتراً",in:{A:250,n:2,r:12,loss:10},out:{P:45.8333,cans:3},tol:1e-5},
  {n:"60 م² بوجهين @10 ووجه أساس @12",src:"حساب يدوي: الدهان 60 × 2 ÷ 10 = 12 لتراً ، الأساس 60 ÷ 12 = 5 لترات",in:{A:60,n:2,r:10,pn:1,pr:12,can:4},out:{P:12,cans:3,Pr:5,pcans:2},tol:1e-9}
 ]
};
