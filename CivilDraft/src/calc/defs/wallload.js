/* حمل الجدران الخطّي على الكمرة — المرحلة ٣-ج · BS 648 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {WALLS,DENSITY} from "../tables.js";
const OPTS=Object.entries(WALLS.list).map(([v,o])=>({v,n:`${o.n} — ${o.g} kN/م³`})).concat([{v:"custom",n:"وزنُ وحدةٍ من نشرة المصنّع"}]);
export const gOf=v=>v.u==="custom"?v.gc:WALLS.list[v.u].g;
export default {
 id:"wallload", group:"loads", title:"حمل الجدران على الكمرات",
 desc:"الحمل الخطّي (kN/م) لجدار بناءٍ فوق كمرة: من سماكته وارتفاعه ونوع الوحدة وسماكة اللياسة على الوجهين وخصم الفتحات، وما يكافئه موزَّعاً على مساحة بلاطة.",
 aliases:"wall load partition masonry block line load brick جدار حمل خطي كمره حائط بلوك طوب لياسه فتحات قواطع حمل جدران",
 ref:`${WALLS.ref} · لياسة المونة ${DENSITY.list.mortar.g} kN/م³`,
 formula:["وزن الجدار لكل م² = السماكة × γ الوحدة + 2 × سماكة اللياسة × 22","الحمل الخطّي w = وزن الم² × الارتفاع × (1 − نسبة الفتحات)","المكافئ المساحي = w × طول الجدار ÷ مساحة البلاطة"],
 inputs:[
  {k:"u",n:"نوع الوحدة",type:"sel",def:"hollow",opts:OPTS},
  {k:"gc",n:"وزن الوحدة",kind:"uw",unit:"kNm3",def:14,min:1,max:30,when:v=>v.u==="custom"},
  {k:"t",n:"سماكة الجدار (بلا لياسة)",kind:"len",unit:"mm",def:200,min:50,max:500},
  {k:"pl",n:"سماكة اللياسة للوجه الواحد",kind:"len",unit:"mm",def:20,min:0,max:50},
  {k:"H",n:"ارتفاع الجدار",kind:"len",unit:"m",def:3,min:0.5,max:8},
  {k:"op",n:"نسبة الفتحات (أبواب وشبابيك)",kind:"pct",unit:"pct",def:0,min:0,max:80},
  {k:"L",n:"طول الجدار (للمكافئ المساحي)",kind:"len",unit:"m",def:0,min:0},
  {k:"A",n:"مساحة البلاطة (للمكافئ المساحي)",kind:"area",unit:"m2",def:0,min:0}
 ],
 outputs:[
  {k:"m2",n:"وزن الجدار لكل م² (مع اللياسة)",kind:"aload",unit:"kNm2",dp:3},
  {k:"w",n:"الحمل الخطّي على الكمرة",kind:"lload",unit:"kNm",dp:3,main:1},
  {k:"eq",n:"المكافئ المساحي على البلاطة",kind:"aload",unit:"kNm2",dp:3,main:1,when:v=>v.L>0&&v.A>0}
 ],
 compute(v){
  const g=gOf(v), pm=DENSITY.list.mortar.g, st=[], warn=[];
  const m2=v.t/1000*g+2*v.pl/1000*pm, w=m2*v.H*(1-v.op/100), o={m2,w};
  st.push(ltr(`${fmt(v.t/1000,3)} × ${fmt(g,2)} + 2 × ${fmt(v.pl/1000,3)} × ${pm} = ${fmt(m2,3)}`)+" kN/م²");
  st.push(ltr(`w = ${fmt(m2,3)} × ${fmt(v.H,2)} × ${fmt(1-v.op/100,2)} = ${fmt(w,3)}`)+" kN/م");
  if(v.L>0&&v.A>0){o.eq=w*v.L/v.A; st.push(ltr(`${fmt(w,3)} × ${fmt(v.L,2)} ÷ ${fmt(v.A,2)} = ${fmt(o.eq,3)}`)+" kN/م²")}
  if(v.u==="hollow"||v.u==="aac")warn.push("الجدران الخفيفة: وزنُ الوحدة يختلف كثيراً بين المصانع — راجع نشرة المصنّع");
  warn.push("الجدران الثابتة تُحسب حملاً ميّتاً؛ والقواطع المتحرّكة تُعامَل وفق BS 6399-1");
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"بلوك مفرَّغ 200 مم وارتفاع 3 م بلا فتحات",src:"حساب يدوي: 0.2×12 + 2×0.02×22 = 2.4 + 0.88 = 3.28 kN/م² ⇒ ×3 = 9.84 kN/م",in:{u:"hollow",t:200,pl:20,H:3,op:0},out:{m2:3.28,w:9.84},tol:1e-9},
  {n:"طوب 215 مم وارتفاع 2.8 م وفتحات 20٪",src:"حساب يدوي: 0.215×19 + 0.88 = 4.965 kN/م² ⇒ × 2.8 × 0.8 = 11.1216 kN/م",in:{u:"brick",t:215,pl:20,H:2.8,op:20},out:{m2:4.965,w:11.1216},tol:1e-9},
  {n:"جدار بلوك مصمت 150 مم طوله 5 م على بلاطة 20 م²",src:"حساب يدوي: 0.15×20 + 0.88 = 3.88 ⇒ ×3 = 11.64 kN/م ⇒ ×5 ÷ 20 = 2.91 kN/م²",in:{u:"solid",t:150,pl:20,H:3,op:0,L:5,A:20},out:{m2:3.88,w:11.64,eq:2.91},tol:1e-9}
 ]
};
