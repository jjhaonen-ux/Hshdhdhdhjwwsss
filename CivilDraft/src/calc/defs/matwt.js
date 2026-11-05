/* أوزان المواد — المرحلة ٣-ج · BS 648 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {DENSITY} from "../tables.js";
const OPTS=Object.entries(DENSITY.list).map(([v,o])=>({v,n:`${o.n} — ${o.g} kN/م³`})).concat([{v:"custom",n:"وزنُ وحدةٍ من مواصفة المورّد"}]);
export const gOf=v=>v.mat==="custom"?v.gc:DENSITY.list[v.mat].g;
const G0=9.80665;
export default {
 id:"matwt", group:"loads", title:"أوزان المواد",
 desc:"وزن مادةٍ بحجمها، أو وزن طبقةٍ بمساحتها وسماكتها (حملاً مساحياً kN/م²)، من أوزان الوحدة المعيارية لمواد البناء.",
 aliases:"weight unit weight density materials concrete steel brick sand اوزان وزن مواد كثافه خرسانه حديد طوب رمل حصى تربه ماء وزن الوحده",
 ref:DENSITY.ref,
 formula:["الوزن W (kN) = الحجم (م³) × وزن الوحدة γ (kN/م³)","الطبقة: الحمل المساحي = السماكة (م) × γ ، والوزن = المساحة × الحمل المساحي","الكتلة (كجم) = W × 1000 ÷ 9.80665"],
 inputs:[
  {k:"mat",n:"المادة",type:"sel",def:"rc",opts:OPTS},
  {k:"gc",n:"وزن الوحدة",kind:"uw",unit:"kNm3",def:20,min:0.1,max:80,when:v=>v.mat==="custom"},
  {k:"mode",n:"الحساب بدلالة",type:"sel",def:"vol",opts:[{v:"vol",n:"الحجم"},{v:"area",n:"المساحة والسماكة"}]},
  {k:"V",n:"الحجم",kind:"vol",unit:"m3",def:1,min:0,when:v=>v.mode==="vol"},
  {k:"A",n:"المساحة",kind:"area",unit:"m2",def:10,min:0,when:v=>v.mode==="area"},
  {k:"t",n:"السماكة",kind:"len",unit:"mm",def:150,min:0.1,max:5000,when:v=>v.mode==="area"}
 ],
 outputs:[
  {k:"g",n:"وزن الوحدة",kind:"uw",unit:"kNm3",dp:2},
  {k:"p",n:"الحمل المساحي للطبقة",kind:"aload",unit:"kNm2",dp:3,when:v=>v.mode==="area"},
  {k:"W",n:"الوزن",kind:"force",unit:"kN",dp:3,main:1},
  {k:"m",n:"الكتلة",kind:"mass",unit:"kg",dp:1,main:1}
 ],
 compute(v){
  const g=gOf(v), st=[], o={g};
  if(v.mode==="area"){o.p=v.t/1000*g; o.W=v.A*o.p; st.push(ltr(`p = ${fmt(v.t/1000,4)} × ${fmt(g,2)} = ${fmt(o.p,4)}`)+" kN/م²");
   st.push(ltr(`W = ${fmt(v.A,3)} × ${fmt(o.p,4)} = ${fmt(o.W,3)}`)+" kN")}
  else{o.W=v.V*g; st.push(ltr(`W = ${fmt(v.V,3)} × ${fmt(g,2)} = ${fmt(o.W,3)}`)+" kN")}
  o.m=o.W*1000/G0;
  st.push(ltr(`m = ${fmt(o.W,3)} × 1000 ÷ ${G0} = ${fmt(o.m,1)}`)+" كجم");
  return {out:o,steps:st,warn:["أوزانُ الوحدة نموذجيةٌ — تُراجَع بمواصفة المورّد عند الحاجة"]};
 },
 cases:[
  {n:"2 م³ خرسانة مسلّحة",src:"BS 648: 24 kN/م³ ⇒ 2 × 24 = 48 kN",in:{mat:"rc",mode:"vol",V:2},out:{W:48},tol:1e-9},
  {n:"بلاطة مسلّحة 10 م² بسماكة 150 مم",src:"حساب يدوي: 0.15 × 24 = 3.6 kN/م² ⇒ 36 kN",in:{mat:"rc",mode:"area",A:10,t:150},out:{p:3.6,W:36},tol:1e-9},
  {n:"0.01 م³ حديد (77 kN/م³)",src:"حساب يدوي: 0.77 kN ⇒ 0.77 × 1000 ÷ 9.80665 = 78.5 كجم (الكتلة النوعية 7850)",in:{mat:"steel",mode:"vol",V:0.01},out:{W:0.77,m:78.5166},tol:1e-4}
 ]
};
