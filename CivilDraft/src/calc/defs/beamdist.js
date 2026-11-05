/* توزيع حمل البلاطة على الكمرات — المرحلة ٣-ج · BS 8110 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
/* لوحٌ على أربع كمرات: قاعدةٌ مثلّثية/شبه منحرفة بخطوط 45° (ly ≥ lx، r = ly/lx).
   صفوفُ الحمل على كمرة: القمّة والمعادل للانحناء والمعادل للقصّ. */
export function dist(lx,ly,w,two){
 const r=ly/lx;
 if(!two||r>2){                        /* اتجاهٌ واحد: الكمرتان الطويلتان تحملان w·lx/2 */
  const p=w*lx/2;
  return {r,one:true,sPeak:0,sBend:0,sShear:0,lPeak:p,lBend:p,lShear:p};
 }
 const p=w*lx/2;
 return {r,one:false,
  sPeak:p, sBend:w*lx/3, sShear:w*lx/4,
  lPeak:p, lBend:p*(1-1/(3*r*r)), lShear:p*(1-1/(2*r))};
}
export default {
 id:"beamdist", group:"loads", title:"توزيع الحمل على الكمرات",
 desc:"أحمال الكمرات الحاملة للوح بلاطة: القمّة والحمل المنتظم المكافئ للانحناء وللقصّ لكلٍّ من الكمرة القصيرة والطويلة (بلاطة باتجاهين أو باتجاه واحد)، مع إضافة حمل جدار.",
 aliases:"beam load distribution triangular trapezoidal two way one way slab كمره كمرة جسر توزيع احمال كمرات مثلثي شبه منحرف بلاطه اتجاهين اتجاه واحد حمل خطي مكافئ",
 ref:"قاعدة الخطوط 45° الشائعة في كتب التصميم (التوزيع المثلّثي وشبه المنحرف) · وبديلها في BS 8110-1:1997 البند 3.5.3.7 والجدول 3.15 (معاملات القصّ)",
 formula:["r = ly ÷ lx ، القمّة = w·lx ÷ 2","الكمرة القصيرة (مثلّث): الانحناء w·lx ÷ 3 ، القصّ w·lx ÷ 4","الكمرة الطويلة (شبه منحرف): الانحناء (w·lx ÷ 2)(1 − 1 ÷ 3r²) ، القصّ (w·lx ÷ 2)(1 − 1 ÷ 2r)","اتجاه واحد: كلُّ كمرةٍ طويلةٍ تحمل w·lx ÷ 2 ولا حمل على القصيرتين"],
 inputs:[
  {k:"lx",n:"البحر القصير lx",kind:"len",unit:"m",def:4,min:0.5,max:15},
  {k:"ly",n:"البحر الطويل ly",kind:"len",unit:"m",def:6,min:0.5,max:30},
  {k:"w",n:"حمل البلاطة w",kind:"aload",unit:"kNm2",def:10,min:0.1,max:100,hint:"أدخل الحمل النهائي n لتحصل على أحمال نهائية"},
  {k:"dir",n:"عمل البلاطة",type:"sel",def:"two",opts:[{v:"two",n:"باتجاهين (ly ÷ lx ≤ 2)"},{v:"one",n:"باتجاه واحد"}]},
  {k:"wall",n:"حمل جدار فوق الكمرة",kind:"lload",unit:"kNm",def:0,min:0,max:200}
 ],
 outputs:[
  {k:"r",n:"النسبة ly ÷ lx",dp:2},
  {k:"sPeak",n:"الكمرة القصيرة — قمّة التوزيع",kind:"lload",unit:"kNm",dp:2,when:(v,o)=>o.sPeak>0},
  {k:"sBend",n:"الكمرة القصيرة — معادل الانحناء",kind:"lload",unit:"kNm",dp:2,main:1,when:(v,o)=>o.sPeak>0||v.wall>0},
  {k:"sShear",n:"الكمرة القصيرة — معادل القصّ",kind:"lload",unit:"kNm",dp:2,when:(v,o)=>o.sPeak>0||v.wall>0},
  {k:"lPeak",n:"الكمرة الطويلة — قمّة التوزيع",kind:"lload",unit:"kNm",dp:2},
  {k:"lBend",n:"الكمرة الطويلة — معادل الانحناء",kind:"lload",unit:"kNm",dp:2,main:1},
  {k:"lShear",n:"الكمرة الطويلة — معادل القصّ",kind:"lload",unit:"kNm",dp:2},
  {k:"chk",n:"مجموع أحمال الكمرات ÷ حمل اللوح",dp:3}
 ],
 compute(v){
  /* (v2.11.0) كان إدخالُ ly < lx يعطي r < 1 فأحمالاً سالبة على الكمرة الطويلة.
     القصيرُ هو الأصغر دائماً: يُبدَّلان ويُقال ذلك. */
  const lx=Math.min(v.lx,v.ly), ly=Math.max(v.lx,v.ly);
  const two=v.dir==="two", d=dist(lx,ly,v.w,two), warn=[], st=[];
  if(v.ly<v.lx)warn.push("أُدخل البحر الطويل أقصرَ من القصير — بُدِّلا: lx هو الأصغر دائماً");
  if(two&&d.r>2)warn.push("ly ÷ lx > 2: البلاطة تعمل باتجاهٍ واحد — حُسب التوزيع كذلك");
  if(!two&&d.r<=2)warn.push("البلاطة باتجاه واحد يُفترض لها ly ÷ lx > 2 عادةً — راجع الاختيار");
  const o={r:d.r,sPeak:d.sPeak,sBend:d.sBend+v.wall,sShear:d.sShear+v.wall,
   lPeak:d.lPeak,lBend:d.lBend+v.wall,lShear:d.lShear+v.wall};
  const tot=2*d.sShear*lx+2*d.lShear*ly;
  /* مجموع ما تحمله الكمرات الأربع من اللوح (دون جدار) ÷ w·lx·ly = 1 دائماً */
  o.chk=tot/(v.w*lx*ly);
  if(d.one){o.sBend=v.wall; o.sShear=v.wall}
  st.push(ltr(`r = ${fmt(ly,2)} ÷ ${fmt(lx,2)} = ${fmt(d.r,3)}`)+" ، "+ltr(`القمّة = ${fmt(v.w,2)} × ${fmt(lx,2)} ÷ 2 = ${fmt(d.lPeak,3)}`)+" kN/م");
  if(!d.one){
   st.push(ltr(`القصيرة: ${fmt(v.w*lx,3)} ÷ 3 = ${fmt(d.sBend,3)} (انحناء) ، ÷ 4 = ${fmt(d.sShear,3)} (قصّ)`)+" kN/م");
   st.push(ltr(`الطويلة: ${fmt(d.lPeak,3)} × (1 − 1 ÷ (3 × ${fmt(d.r*d.r,3)})) = ${fmt(d.lBend,3)} ، × (1 − 1 ÷ ${fmt(2*d.r,3)}) = ${fmt(d.lShear,3)}`)+" kN/م");
  }else st.push(ltr(`الكمرة الطويلة = ${fmt(v.w,2)} × ${fmt(lx,2)} ÷ 2 = ${fmt(d.lPeak,3)}`)+" kN/م");
  warn.push("تقريبٌ بخطوط 45° لبلاطةٍ على أربع كمرات؛ وBS 8110 الجدول 3.15 يعطي قصّاً بمعاملاتٍ تتبع الاستمرارية — راجعه عند الحاجة");
  if(v.wall>0)st.push(ltr(`أُضيف حمل الجدار ${fmt(v.wall,2)}`)+" kN/م إلى معادلات الكمرتين");
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"لوح 4×6 م بحمل 10 kN/م² باتجاهين",src:"حساب يدوي: r = 1.5 ، القمّة 20 ؛ القصيرة 13.333 (انحناء) و10 (قصّ) ؛ الطويلة 20×(1−1/6.75) = 17.037 و20×(1−1/3) = 13.333 ؛ ويتحقّق التوازن 2×10×4 + 2×13.333×6 = 240 = 10×4×6",in:{lx:4,ly:6,w:10,dir:"two",wall:0},out:{r:1.5,sPeak:20,sBend:40/3,sShear:10,lBend:17.037037,lShear:40/3,chk:1},tol:1e-6},
  {n:"لوح مربّع 5×5 م بحمل 8 kN/م²",src:"حساب يدوي: r = 1 ، القمّة 20 ؛ كلتاهما: انحناء 8×5/3 = 13.333 ، وقصّ 10 (أي 20×(1−1/2))",in:{lx:5,ly:5,w:8,dir:"two"},out:{sPeak:20,sBend:40/3,sShear:10,lBend:20*(1-1/3),lShear:10,chk:1},tol:1e-9},
  {n:"لوح 3×7 م باتجاه واحد وحمل جدار 6 kN/م على الكمرة الطويلة",src:"حساب يدوي: r = 2.333 > 2 ⇒ الطويلة 12×3/2 = 18 + 6 = 24 ، وبلا حمل على القصيرتين",in:{lx:3,ly:7,w:12,dir:"one",wall:6},out:{lPeak:18,lBend:24,lShear:24,chk:1},tol:1e-9},
  {n:"البحران مقلوبان (lx = 6 ، ly = 4) يُبدَّلان",src:"حساب يدوي: كالحالة الأولى تماماً بعد التبديل: r = 1.5 ، الطويلة 17.037 و13.333",in:{lx:6,ly:4,w:10,dir:"two",wall:0},out:{r:1.5,sBend:40/3,lBend:17.037037,lShear:40/3,chk:1},tol:1e-6}
 ]
};
