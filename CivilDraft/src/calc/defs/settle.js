/* الهبوط التقريبي — المرحلة ٣-ج · فوريّ (مرن) وتماسكيّ (أودومتر) */
import {ltr} from "../../core/units.js";
import {fmt,interp} from "../engine.js";
import {SETTLE as T} from "../tables.js";
const IW=pos=>T.iw.map(r=>[r[0],r[pos]]);
/* معامل التأثير: عند المركز أو المتوسّط، بالاستكمال الخطّي على L/B (1 … 100) */
export const iwOf=(ratio,avg)=>interp(IW(avg?2:1),Math.min(Math.max(ratio,1),100));
export default {
 id:"settle", group:"soil", title:"الهبوط التقريبي للقاعدة",
 desc:"هبوطٌ تقريبي لقاعدةٍ سطحية: الفوريّ بالمرونة للرمل والتربة الحبيبية (قاعدة مرنة عند المركز أو متوسّطاً)، أو هبوط تماسك الطين بمعادلة أودومتر مع توزيع الحمل 2:1.",
 aliases:"settlement immediate elastic consolidation clay oedometer Cc هبوط فوري مرن تماسك طين رمل معامل المرونه Es اودومتر قاعده",
 ref:T.ref,
 formula:["الفوريّ: Se = q·B·(1 − ν²)·Iw ÷ Es (Iw من L/B والموضع)",
  "التماسك: Δσ = q·B·L ÷ ((B + z)(L + z)) (توزيع 2:1 عند منتصف الطبقة)",
  "Sc = Cc·H ÷ (1 + e0) × log10((σ'0 + Δσ) ÷ σ'0) (طينٌ عاديّ التماسك)"],
 inputs:[
  {k:"mo",n:"نوع الهبوط",type:"sel",def:"el",opts:[{v:"el",n:"فوريّ مرن (رمل · تربة حبيبية)"},{v:"co",n:"تماسك طين (أودومتر)"}]},
  {k:"q",n:"الإجهاد الصافي تحت القاعدة q",kind:"press",unit:"kPa",def:150,min:1,max:1000},
  {k:"B",n:"العرض B",kind:"len",unit:"m",def:2,min:0.3,max:30},
  {k:"L",n:"الطول L (للشريطية أدخل 100 × B)",kind:"len",unit:"m",def:2,min:0.3,max:3000},
  {k:"Es",n:"معامل مرونة التربة Es",kind:"press",unit:"MPa",def:20,min:1,max:500,when:v=>v.mo==="el"},
  {k:"nu",n:"نسبة بواسون ν",def:0.3,min:0,max:0.5,step:0.05,when:v=>v.mo==="el"},
  {k:"pos",n:"موضع الحساب",type:"sel",def:"c",opts:[{v:"c",n:"عند المركز"},{v:"a",n:"المتوسّط على القاعدة"}],when:v=>v.mo==="el"},
  {k:"H",n:"سماكة طبقة الطين H",kind:"len",unit:"m",def:2,min:0.1,max:30,when:v=>v.mo==="co"},
  {k:"z",n:"عمق منتصف الطبقة تحت القاعدة z",kind:"len",unit:"m",def:3,min:0,max:60,when:v=>v.mo==="co"},
  {k:"Cc",n:"معامل الانضغاط Cc",def:0.3,min:0.01,max:3,step:0.01,when:v=>v.mo==="co"},
  {k:"e0",n:"نسبة الفراغات الابتدائية e0",def:0.9,min:0.2,max:4,step:0.05,when:v=>v.mo==="co"},
  {k:"s0",n:"الإجهاد الفعّال σ'0 عند منتصف الطبقة",kind:"press",unit:"kPa",def:60,min:1,max:2000,when:v=>v.mo==="co"}
 ],
 check(v){return v.L<v.B?[{k:"L",m:"الطول L يجب ألّا يقلّ عن العرض B"}]:[]},
 outputs:[
  {k:"rt",n:"النسبة L ÷ B",dp:2,when:v=>v.mo==="el"},
  {k:"Iw",n:"معامل التأثير Iw",dp:3,when:v=>v.mo==="el"},
  {k:"ds",n:"زيادة الإجهاد Δσ عند منتصف الطبقة",kind:"press",unit:"kPa",dp:2,when:v=>v.mo==="co"},
  {k:"S",n:"الهبوط",kind:"len",unit:"mm",dp:1,main:1}
 ],
 compute(v){
  const st=[], warn=[], o={};
  if(v.mo==="el"){
   const rt=v.L/v.B, Iw=iwOf(rt,v.pos==="a");
   const S=v.q*v.B*(1-v.nu*v.nu)*Iw/(v.Es*1000)*1000;
   o.rt=rt; o.Iw=Iw; o.S=S;
   st.push(ltr(`L ÷ B = ${fmt(rt,2)} ⇒ Iw = ${fmt(Iw,3)}`));
   st.push(ltr(`Se = ${fmt(v.q,1)} × ${fmt(v.B,2)} × (1 − ${fmt(v.nu,2)}²) × ${fmt(Iw,3)} ÷ ${fmt(v.Es*1000,0)} = ${fmt(S/1000,5)}`)+" م = "+ltr(fmt(S,2))+" مم");
   if(rt>100)warn.push("L ÷ B > 100: حُسب بقيمة 100 (شريطية)");
  }else{
   const ds=v.q*v.B*v.L/((v.B+v.z)*(v.L+v.z));
   const S=v.Cc*v.H/(1+v.e0)*Math.log10((v.s0+ds)/v.s0)*1000;
   o.ds=ds; o.S=S;
   st.push(ltr(`Δσ = ${fmt(v.q,1)} × ${fmt(v.B,2)} × ${fmt(v.L,2)} ÷ ((${fmt(v.B,2)} + ${fmt(v.z,2)})(${fmt(v.L,2)} + ${fmt(v.z,2)})) = ${fmt(ds,3)}`)+" kPa");
   st.push(ltr(`Sc = ${fmt(v.Cc,2)} × ${fmt(v.H,2)} ÷ ${fmt(1+v.e0,2)} × log10((${fmt(v.s0,1)} + ${fmt(ds,2)}) ÷ ${fmt(v.s0,1)}) = ${fmt(S/1000,5)}`)+" م = "+ltr(fmt(S,2))+" مم");
   warn.push("طينٌ عاديّ التماسك فقط؛ ولا يشمل الهبوط الثانوي ولا الزائد التماسك");
   warn.push("الهبوط التماسكي يحدث على أشهرٍ أو سنين — لا فور التحميل");
  }
  if(o.S>T.limitIsolated)warn.push(`الهبوط > ${T.limitIsolated} مم: تجاوزٌ للحدّ الإرشادي للقواعد المنفصلة — راجع تقرير التربة وحدود المنشأ`);
  warn.push("تقديرٌ أوّليّ بمعاملاتٍ من تقرير التربة؛ لا يغني عن دراسة هبوطٍ كاملة للمنشآت الحسّاسة");
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"قاعدة مربّعة 2 م بإجهاد 150 kPa على رمل Es = 20 MPa (عند المركز)",src:"حساب يدوي: Iw (مربّع، مركز) = 1.12 ⇒ Se = 150×2×(1−0.09)×1.12 ÷ 20000 = 15.288 مم",in:{mo:"el",q:150,B:2,L:2,Es:20,nu:0.3,pos:"c"},out:{Iw:1.12,S:15.288},tol:1e-9},
  {n:"قاعدة 1.5×3 م (L/B = 2) بإجهاد 200 kPa ومتوسّط الهبوط",src:"حساب يدوي: Iw (L/B = 2، متوسّط) = 1.30 ⇒ Se = 200×1.5×(1−0.35²)×1.30 ÷ 30000 = 11.4075 مم",in:{mo:"el",q:200,B:1.5,L:3,Es:30,nu:0.35,pos:"a"},out:{Iw:1.3,S:11.4075},tol:1e-9},
  {n:"طين: H = 2 م و Cc = 0.3 و e0 = 0.9 و σ'0 = 60 kPa تحت قاعدة 2×2 م بإجهاد 100 kPa وz = 3 م",src:"حساب يدوي: Δσ = 100×4 ÷ (5×5) = 16 kPa ؛ Sc = 0.3×2÷1.9 × log10(76÷60) = 0.31579 × 0.10266 = 32.42 مم",in:{mo:"co",q:100,B:2,L:2,H:2,z:3,Cc:0.3,e0:0.9,s0:60},out:{ds:16,S:32.4195},tol:2e-4}
 ]
};
