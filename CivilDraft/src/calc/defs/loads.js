/* الأحمال الميتة والحية للبلاطة حسب الاستخدام — المرحلة ٣-ج · BS 8110 + BS 6399-1 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {IMPOSED,DENSITY,BS8110_GF} from "../tables.js";
const OPTS=Object.entries(IMPOSED.list).map(([v,o])=>({v,n:`${o.n} — ${o.q} kN/م²`})).concat([{v:"custom",n:"قيمةٌ يحدّدها المشروع أو العميل"}]);
export const qOf=v=>v.use==="custom"?v.qc:IMPOSED.list[v.use].q;
export default {
 id:"loads", group:"loads", title:"أحمال البلاطة (ميتة وحية)",
 desc:"الحمل الميّت الكلّي لبلاطةٍ (وزنها وطبقات التشطيب والتسوية واللياسة والخدمات والقواطع) والحمل الحيّ حسب الاستخدام، وحمل التصميم النهائي بمعاملات BS 8110.",
 aliases:"loads dead live imposed slab floor load احمال حمل ميت حي بلاطه سقف استخدام تشطيبات قواطع حمل التصميم نهائي",
 ref:`${IMPOSED.ref} · ${DENSITY.ref} · ${BS8110_GF.ref}`,
 formula:["الوزن الذاتي = السماكة × 24 kN/م³ ، والتسوية واللياسة = السماكة × 22 kN/م³",
  "Gk = الوزن الذاتي + التسوية + التشطيب + اللياسة + الخدمات (+ القواطع إن كانت ثابتة)",
  "Qk = الحمل الحيّ حسب الاستخدام (+ القواطع المتحرّكة إن اختيرت كحمل حيّ)",
  "حمل التصميم النهائي n = 1.4 Gk + 1.6 Qk (BS 8110-1 الجدول 2.1)"],
 inputs:[
  {k:"use",n:"الاستخدام",type:"sel",def:"office",opts:OPTS},
  {k:"qc",n:"الحمل الحيّ المحدَّد",kind:"aload",unit:"kNm2",def:3,min:0,max:20,when:v=>v.use==="custom"},
  {k:"h",n:"سماكة البلاطة",kind:"len",unit:"mm",def:200,min:50,max:1000},
  {k:"scr",n:"سماكة طبقة التسوية",kind:"len",unit:"mm",def:50,min:0,max:200},
  {k:"fin",n:"وزن التشطيب الأرضي (بلاط أو رخام)",kind:"aload",unit:"kNm2",def:0.5,min:0,max:5,hint:"بلاط سيراميك ≈ 0.4–0.6 kN/م²"},
  {k:"pl",n:"سماكة لياسة السقف",kind:"len",unit:"mm",def:15,min:0,max:50},
  {k:"svc",n:"خدمات وسقف مستعار",kind:"aload",unit:"kNm2",def:0.25,min:0,max:3},
  {k:"part",n:"حمل القواطع المكافئ",kind:"aload",unit:"kNm2",def:1,min:0,max:5,hint:"BS 6399-1 يسمح بحملٍ منتظمٍ مكافئ للقواطع الخفيفة المتحرّكة"},
  {k:"pt",n:"تُحسب القواطع",type:"sel",def:"imposed",opts:[{v:"imposed",n:"حملاً حيّاً (متحرّكة)"},{v:"dead",n:"حملاً ميّتاً (ثابتة)"}],when:v=>v.part>0}
 ],
 outputs:[
  {k:"sw",n:"الوزن الذاتي للبلاطة",kind:"aload",unit:"kNm2",dp:2},
  {k:"sc",n:"طبقة التسوية",kind:"aload",unit:"kNm2",dp:2},
  {k:"pl",n:"اللياسة",kind:"aload",unit:"kNm2",dp:2},
  {k:"Gk",n:"الحمل الميّت Gk",kind:"aload",unit:"kNm2",dp:2,main:1},
  {k:"Qk",n:"الحمل الحيّ Qk",kind:"aload",unit:"kNm2",dp:2,main:1},
  {k:"n",n:"حمل التصميم النهائي n",kind:"aload",unit:"kNm2",dp:2,main:1},
  {k:"ratio",n:"النسبة Qk ÷ Gk",dp:2}
 ],
 compute(v){
  const g=DENSITY.list.rc.g, m=DENSITY.list.mortar.g, F=BS8110_GF.uls.dq, warn=[];
  const sw=v.h/1000*g, sc=v.scr/1000*m, pl=v.pl/1000*m, dead=v.pt==="dead"&&v.part>0;
  const Gk=sw+sc+v.fin+pl+v.svc+(dead?v.part:0);
  const q0=qOf(v), Qk=q0+(!dead&&v.part>0?v.part:0);
  const n=F.g*Gk+F.q*Qk;
  if(Qk>1.25*Gk||q0>5)warn.push("Qk > 1.25 Gk أو Qk > 5 kN/م²: لا تصحّ معاملاتُ BS 8110 المبسَّطة للبلاطات المستمرّة — يلزم تحليلٌ كامل");
  warn.push("الأحمال المركّزة وتخفيض الأحمال الحيّة بعدد الطوابق تؤخذ من نصّ BS 6399-1");
  return {out:{sw,sc,pl,Gk,Qk,n,ratio:Qk/Gk},steps:[
   ltr(`sw = ${fmt(v.h/1000,3)} × ${g} = ${fmt(sw,3)}`)+" kN/م² ، "+ltr(`التسوية ${fmt(sc,3)} ، اللياسة ${fmt(pl,3)}`),
   ltr(`Gk = ${fmt(sw,2)} + ${fmt(sc,2)} + ${fmt(v.fin,2)} + ${fmt(pl,2)} + ${fmt(v.svc,2)}${dead?" + "+fmt(v.part,2):""} = ${fmt(Gk,3)}`)+" kN/م²",
   ltr(`Qk = ${fmt(q0,2)}${!dead&&v.part>0?" + "+fmt(v.part,2):""} = ${fmt(Qk,3)}`)+" kN/م²",
   ltr(`n = ${F.g} × ${fmt(Gk,3)} + ${F.q} × ${fmt(Qk,3)} = ${fmt(n,3)}`)+" kN/م²"],warn};
 },
 cases:[
  {n:"مكتب: بلاطة 200 مم وقواطع متحرّكة 1 kN/م²",src:"حساب يدوي: sw 4.8 + تسوية 1.1 + تشطيب 0.5 + لياسة 0.33 + خدمات 0.25 = 6.98 ؛ Qk 2.5 + 1 = 3.5 ؛ n = 1.4×6.98 + 1.6×3.5 = 15.372",in:{use:"office",h:200,scr:50,fin:0.5,pl:15,svc:0.25,part:1,pt:"imposed"},out:{sw:4.8,Gk:6.98,Qk:3.5,n:15.372},tol:1e-9},
  {n:"سكن: بلاطة 150 مم وقواطع ثابتة 1 kN/م²",src:"حساب يدوي: 3.6 + 1.1 + 0.5 + 0.33 + 0.25 + 1.0 = 6.78 ؛ Qk = 1.5 ؛ n = 9.492 + 2.4 = 11.892",in:{use:"dwell",h:150,scr:50,fin:0.5,pl:15,svc:0.25,part:1,pt:"dead"},out:{Gk:6.78,Qk:1.5,n:11.892},tol:1e-9},
  {n:"حمل حيّ محدَّد 5 kN/م² وبلاطة 250 مم بلا تشطيبات",src:"حساب يدوي: Gk = 6.0 + 1.0 = 7.0 ؛ n = 1.4×7 + 1.6×5 = 17.8",in:{use:"custom",qc:5,h:250,scr:0,fin:1,pl:0,svc:0,part:0},out:{Gk:7,Qk:5,n:17.8,ratio:5/7},tol:1e-9}
 ]
};
