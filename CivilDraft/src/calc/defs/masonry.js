/* عدد البلوك/الطوب ومونة البناء — المرحلة ٣-ب · BS 5628 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {MASONRY as T} from "../tables.js";
const UNITS=Object.entries(T.units).map(([v,o])=>({v,n:o.n}));
const MORT=Object.entries(T.mortar).map(([v,o])=>({v,n:o.n}));
/* مونةُ المتر المربّع (م³) = سماكة الجدار × (1 − مساحة الوجه ÷ مساحة الوحدة مع الفاصل) */
export function mortarPerM2(u,j){
 const f=(u.l*u.h)/((u.l+j)*(u.h+j));
 return u.t/1000*(1-f);
}
export default {
 id:"masonry", group:"masonry", title:"البلوك والطوب ومونة البناء",
 desc:"عدد البلوك أو الطوب لجدارٍ بعد خصم الفتحات، وحجم مونة البناء وموادّها (أسمنت ورمل) بدرجات المونة في BS 5628-1، مع الهالك.",
 aliases:"block brick masonry mortar بلوك طوب طابوق مباني مونه بناء جدار حائط عدد البلوك عدد الطوب اسمنت رمل",
 ref:T.ref+" · BS 5628-1 الجدول 1 (درجات المونة)",
 formula:["المساحة الصافية A = الطول × الارتفاع − الفتحات",
  "عدد الوحدات لكل م² = 1 ÷ ((l + j)(h + j)) ، و j سماكة الفاصل",
  "المونة لكل م² = t × (1 − l·h ÷ ((l + j)(h + j))) م³",
  "المونة الجافة = الرطبة × 1.27 ⇒ أسمنت = جاف ÷ (1 + s) × 1440 كجم ، رمل = جاف × s ÷ (1 + s)",
  "الكمّيات × (1 + الهالك)"],
 inputs:[
  {k:"u",n:"الوحدة",type:"sel",def:"blk400b",opts:UNITS},
  {k:"L",n:"طول الجدار",kind:"len",unit:"m",def:10,min:0},
  {k:"H",n:"ارتفاع الجدار",kind:"len",unit:"m",def:3,min:0},
  {k:"op",n:"مساحة الفتحات المخصومة",kind:"area",unit:"m2",def:0,min:0},
  {k:"j",n:"سماكة الفاصل",kind:"len",unit:"mm",def:10,min:3,max:20},
  {k:"mix",n:"درجة المونة",type:"sel",def:"iii",opts:MORT},
  {k:"waste",n:"الهالك",kind:"pct",unit:"pct",def:5,min:0,max:30},
  {k:"bag",n:"وزن كيس الأسمنت",kind:"mass",unit:"kg",def:50,min:1}
 ],
 outputs:[
  {k:"A",n:"المساحة الصافية",kind:"area",unit:"m2",dp:2},
  {k:"npm",n:"الوحدات لكل م²",dp:2},
  {k:"N",n:"عدد الوحدات (مع الهالك)",dp:0,main:1},
  {k:"Vm",n:"حجم المونة الرطبة",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"Ck",n:"أسمنت المونة",kind:"mass",unit:"kg",dp:1,main:1},
  {k:"bags",n:"أكياس الأسمنت",dp:1},
  {k:"Sv",n:"رمل المونة",kind:"vol",unit:"m3",dp:3,main:1}
 ],
 check(v){return v.op>v.L*v.H?[{k:"op",m:"مساحة الفتحات أكبر من مساحة الجدار"}]:[]},
 compute(v){
  const u=T.units[v.u], s=T.mortar[v.mix].s, w=1+v.waste/100;
  const A=v.L*v.H-v.op, npm=1e6/((u.l+v.j)*(u.h+v.j)), mpm=mortarPerM2(u,v.j);
  const N=Math.ceil(A*npm*w-1e-9), Vm=A*mpm*w, dry=Vm*T.dry;
  const Ck=dry/(1+s)*T.rc, Sv=dry*s/(1+s), warn=[];
  if(/^blk/.test(v.u))warn.push("البلوك المفرَّغ: المونة على الأوجه فقط فعلياً — الحساب للمقطع الكامل (أعلى قليلاً، في جانب الأمان)");
  return {out:{A,npm,N,Vm,Ck,bags:Ck/v.bag,Sv},steps:[
   ltr(`A = ${fmt(v.L,2)} × ${fmt(v.H,2)} − ${fmt(v.op,2)} = ${fmt(A,3)}`)+" م²",
   ltr(`1 ÷ (${fmt((u.l+v.j)/1000,4)} × ${fmt((u.h+v.j)/1000,4)}) = ${fmt(npm,3)}`)+" وحدة/م²",
   ltr(`${fmt(A,3)} × ${fmt(npm,3)} × ${fmt(w,2)} = ${fmt(A*npm*w,2)} ⇒ ${N}`),
   ltr(`المونة = ${fmt(A,3)} × ${fmt(mpm,5)} × ${fmt(w,2)} = ${fmt(Vm,4)}`)+" م³",
   ltr(`جاف = ${fmt(Vm,4)} × ${T.dry} = ${fmt(dry,4)} ؛ 1 : ${s}`)],warn};
 },
 cases:[
  {n:"طوب بريطاني لجدار نصف طوبة (1 م²)",src:"حساب هندسي مباشر: 1 ÷ (0.225 × 0.075) ≈ 59.3 طوبة لكل م² بفاصل 10 مم (يُقارَن بالتقريب 60 من ممارسة الحصر)",
   in:{u:"brick",L:1,H:1,op:0,waste:0},out:{npm:59.2593},tol:1e-3},
  {n:"بلوك 440×215 (1 م²)",src:"حساب هندسي مباشر: 1 ÷ (0.45 × 0.225) = 9.88 بلوكة لكل م² بفاصل 10 مم",
   in:{u:"blk440",L:1,H:1,op:0,waste:0},out:{npm:9.8765},tol:1e-3},
  {n:"جدار 10 × 3 م ببلوك 400×200×200 وفتحات 4.2 م² وهالك 5٪ ومونة (iii)",src:"حساب يدوي: A = 25.8 ، 1 ÷ (0.41 × 0.21) = 11.614/م² ⇒ 314.6 ⇒ 315 ، المونة 25.8 × 0.01417 × 1.05 = 0.3838 م³ ، الأسمنت 0.4875 ÷ 7 × 1440 = 100.3 كجم",
   in:{u:"blk400",L:10,H:3,op:4.2,j:10,mix:"iii",waste:5},out:{A:25.8,N:315,Vm:0.383848,Ck:100.276,Sv:0.417863},tol:0.001}
 ]
};
