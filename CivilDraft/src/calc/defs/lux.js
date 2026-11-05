/* شدّة الإضاءة وعدد الوحدات — المرحلة ٣-د · طريقة اللومن */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
export default {
 id:"lux", group:"mep", title:"الإضاءة (لوكس) وعدد الوحدات",
 desc:"عدد وحدات الإنارة اللازمة لشدّة إضاءة مطلوبة بطريقة اللومن، ومؤشّر الغرفة، والشدّة الفعلية بعد تقريب العدد للأعلى.",
 aliases:"lighting lux lumen method luminaires illuminance اضاءه لوكس لومن عدد الكشافات وحدات انارة شده الاضاءه",
 ref:"طريقة اللومن (SLL Lighting Handbook 2018 · CIBSE) · الشدّات المطلوبة: BS EN 12464-1:2021 (مثلاً المكاتب 500 lx والممرّات 100 lx)",
 formula:["مؤشّر الغرفة K = L W ÷ (Hm (L + W))","N = E A ÷ (Φ × UF × MF) ثم يُقرَّب للأعلى","E الفعلية = N Φ UF MF ÷ A"],
 inputs:[
  {k:"L",n:"طول الغرفة",kind:"len",unit:"m",def:6,min:0.5,max:500},
  {k:"W",n:"عرض الغرفة",kind:"len",unit:"m",def:5,min:0.5,max:500},
  {k:"Hm",n:"ارتفاع الوحدة فوق سطح العمل",kind:"len",unit:"m",def:2.15,min:0.3,max:30},
  {k:"E",n:"الشدّة المطلوبة",kind:"illum",unit:"lx",def:500,min:10,max:5000},
  {k:"phi",n:"فيض الوحدة الواحدة",kind:"lum",unit:"lm",def:3600,min:50,max:200000},
  {k:"UF",n:"معامل الاستفادة UF",def:0.6,min:0.1,max:1,step:0.05},
  {k:"MF",n:"معامل الصيانة MF",def:0.8,min:0.3,max:1,step:0.05}
 ],
 outputs:[
  {k:"K",n:"مؤشّر الغرفة K",dp:2},
  {k:"Nr",n:"العدد المحسوب",dp:2},
  {k:"N",n:"عدد الوحدات",dp:0,main:1},
  {k:"Ea",n:"الشدّة الفعلية",kind:"illum",unit:"lx",dp:0,main:1}
 ],
 compute(v){
  const A=v.L*v.W, K=A/(v.Hm*(v.L+v.W)), Nr=v.E*A/(v.phi*v.UF*v.MF), N=Math.ceil(Nr-1e-9), Ea=N*v.phi*v.UF*v.MF/A, st=[], warn=[];
  st.push(ltr(`K = ${fmt(A,2)} ÷ (${fmt(v.Hm,2)} × ${fmt(v.L+v.W,2)}) = ${fmt(K,3)}`));
  st.push(ltr(`N = ${fmt(v.E,0)} × ${fmt(A,2)} ÷ (${fmt(v.phi,0)} × ${v.UF} × ${v.MF}) = ${fmt(Nr,3)} ⇒ ${N}`));
  st.push(ltr(`E = ${N} × ${fmt(v.phi,0)} × ${v.UF} × ${v.MF} ÷ ${fmt(A,2)} = ${fmt(Ea,1)}`)+" lx");
  warn.push("UF من جدول مصنّع الوحدة بدلالة K وانعكاسات السقف والجدران والأرضية");
  return {out:{K,Nr,N,Ea},steps:st,warn};
 },
 cases:[
  {n:"مكتب 6×5 م لـ 500 lx بوحدات 3600 lm",src:"حساب يدوي: K = 30 ÷ (2.15×11) = 1.268 ؛ N = 15000 ÷ 1728 = 8.68 ⇒ 9 ؛ E = 9×1728÷30 = 518.4 lx",in:{L:6,W:5,Hm:2.15,E:500,phi:3600,UF:0.6,MF:0.8},out:{K:1.26850,Nr:8.68056,N:9,Ea:518.4},tol:1e-5},
  {n:"غرفة 4×3 م لـ 300 lx بوحدات 2000 lm",src:"حساب يدوي: K = 12 ÷ 14 = 0.857 ؛ N = 3600 ÷ 800 = 4.5 ⇒ 5 ؛ E = 4000 ÷ 12 = 333.3 lx",in:{L:4,W:3,Hm:2,E:300,phi:2000,UF:0.5,MF:0.8},out:{K:0.857143,Nr:4.5,N:5,Ea:333.333},tol:1e-5},
  {n:"قاعة 10×8 م لـ 500 lx بوحدات 4000 lm",src:"حساب يدوي: K = 80 ÷ 43.2 = 1.852 ؛ N = 40000 ÷ 1950 = 20.51 ⇒ 21 ؛ E = 21×1950÷80 = 511.9 lx",in:{L:10,W:8,Hm:2.4,E:500,phi:4000,UF:0.65,MF:0.75},out:{K:1.85185,Nr:20.5128,N:21,Ea:511.875},tol:1e-5}
 ]
};
