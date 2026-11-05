/* حمل التكييف التقريبي للغرفة (طن تبريد) — المرحلة ٣-د */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {HVAC as H} from "../tables.js";
export default {
 id:"hvac", group:"mep", title:"حمل التكييف (طن تبريد)",
 desc:"تقديرٌ مبدئيّ لحمل التبريد لغرفة: حمل الغلاف لكل م² وحرارة الأشخاص والأجهزة والإنارة ومعامل أمان، بالواط وBTU/h وطن التبريد، وأقرب قدرة وحدةٍ قياسية أكبر.",
 aliases:"hvac cooling load air conditioning ton refrigeration btu تكييف حمل تبريد طن تبريد مكيف سبليت وحده btu غرفه",
 ref:H.ref,
 formula:["الحمل = (المساحة × حمل الغلاف + الأشخاص × حرارة الشخص + الأجهزة + المساحة × الإنارة) × (1 + معامل الأمان)","TR = الحمل (W) ÷ 3516.85 ، BTU/h = الحمل ÷ 0.293071"],
 inputs:[
  {k:"A",n:"مساحة الغرفة",kind:"area",unit:"m2",def:20,min:1,max:5000},
  {k:"qa",n:"حمل الغلاف (W/م²)",def:150,min:30,max:400,hint:"قيمةٌ تقديرية حسب العزل والتوجيه والسقف المكشوف"},
  {k:"p",n:"عدد الأشخاص",def:2,min:0,max:1000,step:1},
  {k:"qp",n:"حرارة الشخص (W)",def:H.person,min:60,max:600},
  {k:"eq",n:"الأجهزة",kind:"power",unit:"W",def:300,min:0},
  {k:"li",n:"الإنارة (W/م²)",def:10,min:0,max:50},
  {k:"sf",n:"معامل الأمان",kind:"pct",unit:"pct",def:10,min:0,max:50}
 ],
 outputs:[
  {k:"W",n:"حمل التبريد",kind:"power",unit:"W",dp:0},
  {k:"btu",n:"حمل التبريد",kind:"power",unit:"btuh",dp:0},
  {k:"tr",n:"طن التبريد",kind:"power",unit:"tr",dp:2,main:1},
  {k:"u",n:"قدرة الوحدة القياسية المقترحة",kind:"power",unit:"tr",dp:1,main:1}
 ],
 compute(v){
  const parts=[v.A*v.qa,v.p*v.qp,v.eq,v.A*v.li], base=parts.reduce((a,b)=>a+b,0), W=base*(1+v.sf/100);
  const tr=W/H.tr, btu=W/H.btu, u=H.units.find(x=>x>=tr-1e-9), st=[], warn=[];
  st.push(ltr(`${fmt(parts[0],0)} + ${fmt(parts[1],0)} + ${fmt(parts[2],0)} + ${fmt(parts[3],0)} = ${fmt(base,0)}`)+" W");
  st.push(ltr(`${fmt(base,0)} × ${fmt(1+v.sf/100,2)} = ${fmt(W,0)} W = ${fmt(tr,3)} TR = ${fmt(btu,0)} BTU/h`));
  const o={W,btu,tr};
  if(u!=null)o.u=u; else warn.push(`الحمل يتجاوز ${H.units[H.units.length-1]} TR: وزّعه على أكثر من وحدة`);
  warn.push("تقديرٌ مبدئيّ بالمعاملات لا حسابٌ تفصيليّ (CIBSE Guide A / ASHRAE): راجعه لمشاريع التصميم النهائي");
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"غرفة 20 م² بشخصين وأجهزة 300 W",src:"حساب يدوي: 3000 + 260 + 300 + 200 = 3760 W × 1.1 = 4136 W = 1.176 TR ⇒ وحدة 1.5 طن",in:{A:20,qa:150,p:2,qp:130,eq:300,li:10,sf:10},out:{W:4136,tr:1.17605,btu:14112.6,u:1.5},tol:1e-5},
  {n:"غرفة نوم 16 م² بلا معامل أمان",src:"حساب يدوي: 1920 + 130 + 200 + 128 = 2378 W = 0.676 TR ⇒ وحدة 1 طن",in:{A:16,qa:120,p:1,qp:130,eq:200,li:8,sf:0},out:{W:2378,tr:0.676173,u:1},tol:1e-5},
  {n:"مكتب 60 م² بعشرة أشخاص",src:"حساب يدوي: 10800 + 1300 + 1500 + 720 = 14320 × 1.15 = 16468 W = 4.683 TR ⇒ 5 طن",in:{A:60,qa:180,p:10,qp:130,eq:1500,li:12,sf:15},out:{W:16468,tr:4.68260,btu:56191.1,u:5},tol:1e-5}
 ]
};
