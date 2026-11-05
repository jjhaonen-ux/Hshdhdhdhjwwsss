/* عدد الشاحنات (القلّابات) — المرحلة ٣-ب */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
export default {
 id:"trucks", group:"earth", title:"عدد الشاحنات",
 desc:"عدد النقلات لترحيل حجمٍ من التربة بعد الانتفاش، بحمولة الصندوق أو الوزن المسموح أيّهما أقلّ، وعدد الشاحنات اللازمة لإنهاء العمل في مدّةٍ معلومة بزمن الدورة.",
 aliases:"trucks dump truck haul trips cycle time شاحنات قلابات نقلات ترحيل نقل اتربه زمن الدوره حموله تريلات",
 ref:"Peurifoy & Schexnayder, Construction Planning, Equipment, and Methods (الإنتاجية وزمن الدورة) · BS 6031:2009",
 formula:["الحجم المفكَّك = الطبيعي × (1 + الانتفاش)",
  "حمولة النقلة = min(سعة الصندوق × معامل الملء ، الحمولة المسموحة ÷ كثافة المفكَّك)",
  "كثافة المفكَّك = كثافة الطبيعي ÷ (1 + الانتفاش)","النقلات = ⌈ المفكَّك ÷ حمولة النقلة ⌉",
  "نقلات الشاحنة يومياً = ⌊ ساعات العمل × 60 × الكفاءة ÷ زمن الدورة ⌋ ، والشاحنات = ⌈ النقلات ÷ (نقلاتها × الأيام) ⌉"],
 inputs:[
  {k:"Vb",n:"الحجم الطبيعي (في الموقع)",kind:"vol",unit:"m3",def:300,min:0},
  {k:"sw",n:"الانتفاش",kind:"pct",unit:"pct",def:25,min:0,max:100},
  {k:"cap",n:"سعة الصندوق",kind:"vol",unit:"m3",def:12,min:1},
  {k:"fill",n:"معامل الملء",kind:"pct",unit:"pct",def:100,min:50,max:130},
  {k:"pay",n:"الحمولة المسموحة (0 = تجاهل)",kind:"mass",unit:"t",def:0,min:0},
  {k:"rho",n:"كثافة التربة الطبيعية",kind:"dens",unit:"kgm3",def:1800,min:1000,max:2800,when:v=>v.pay>0},
  {k:"cyc",n:"زمن الدورة بالدقائق (0 = تجاهل)",def:0,min:0,max:600},
  {k:"hrs",n:"ساعات العمل يومياً",def:8,min:1,max:24,when:v=>v.cyc>0},
  {k:"eff",n:"الكفاءة",kind:"pct",unit:"pct",def:83,min:30,max:100,when:v=>v.cyc>0},
  {k:"days",n:"المدّة المستهدفة بالأيام",def:1,min:1,step:1,when:v=>v.cyc>0}
 ],
 outputs:[
  {k:"Vl",n:"الحجم المفكَّك",kind:"vol",unit:"m3",dp:2},
  {k:"load",n:"حمولة النقلة (مفكَّك)",kind:"vol",unit:"m3",dp:2},
  {k:"trips",n:"عدد النقلات",dp:0,main:1},
  {k:"tpd",n:"نقلات الشاحنة الواحدة يومياً",dp:0,when:v=>v.cyc>0},
  {k:"trucks",n:"الشاحنات اللازمة",dp:0,main:1,when:v=>v.cyc>0}
 ],
 compute(v){
  const fl=1+v.sw/100, Vl=v.Vb*fl, up=x=>Math.ceil(x-1e-9), st=[], warn=[];
  let load=v.cap*v.fill/100;
  st.push(ltr(`Vl = ${fmt(v.Vb,2)} × ${fmt(fl,3)} = ${fmt(Vl,2)}`)+" م³");
  if(v.pay>0){
   const rl=v.rho/fl, byW=v.pay*1000/rl;
   st.push(ltr(`كثافة المفكَّك = ${fmt(v.rho,0)} ÷ ${fmt(fl,3)} = ${fmt(rl,1)}`)+" كجم/م³ ⇒ "+ltr(`${fmt(v.pay,2)} t ÷ ${fmt(rl/1000,4)} = ${fmt(byW,2)}`)+" م³");
   if(byW<load){load=byW; warn.push("الوزن يحكم الحمولة لا حجم الصندوق")}
  }
  const trips=up(Vl/load), o={Vl,load,trips};
  st.push(ltr(`${fmt(Vl,2)} ÷ ${fmt(load,3)} = ${fmt(Vl/load,2)} ⇒ ${trips}`)+" نقلة");
  if(v.cyc>0){
   o.tpd=Math.floor(v.hrs*60*v.eff/100/v.cyc+1e-9);
   if(o.tpd<1){o.tpd=1; warn.push("زمن الدورة أطول من يوم العمل — نقلةٌ واحدة يومياً")}
   o.trucks=up(trips/(o.tpd*Math.round(v.days)));
   st.push(ltr(`⌊${fmt(v.hrs,1)} × 60 × ${fmt(v.eff/100,2)} ÷ ${fmt(v.cyc,1)}⌋ = ${o.tpd}`)+" نقلة/يوم ⇒ "+ltr(`⌈${trips} ÷ (${o.tpd} × ${Math.round(v.days)})⌉ = ${o.trucks}`));
  }
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"300 م³ طبيعي بانتفاش 25٪ وصندوق 12 م³",src:"حساب يدوي: 375 ÷ 12 = 31.25 ⇒ 32 نقلة",in:{Vb:300,sw:25,cap:12},out:{Vl:375,trips:32},tol:1e-9},
  {n:"الحجم نفسه بصندوق 16 م³ وحمولة 20 طناً وكثافة 1800",src:"حساب يدوي: كثافة المفكَّك 1440 ⇒ 20 ÷ 1.44 = 13.89 م³ < 16 ⇒ 375 ÷ 13.89 = 27 نقلة",in:{Vb:300,sw:25,cap:16,pay:20,rho:1800},out:{load:13.8889,trips:27},tol:1e-5},
  {n:"32 نقلة بدورة 30 دقيقة و8 ساعات وكفاءة 83٪ في يوم",src:"حساب يدوي: ⌊8 × 60 × 0.83 ÷ 30⌋ = 13 نقلة/يوم ⇒ ⌈32 ÷ 13⌉ = 3 شاحنات",in:{Vb:300,sw:25,cap:12,cyc:30,hrs:8,eff:83,days:1},out:{tpd:13,trucks:3},tol:1e-9}
 ]
};
