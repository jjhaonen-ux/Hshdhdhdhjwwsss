/* الحفر والردم البسيط — المرحلة ٣-ب · BS 6031 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
/* حجمُ منشورٍ مستطيلٍ بميولٍ جانبيةٍ متساوية — المعادلة المنشورية
   (دقيقةٌ لهذا الشكل): V = D/6 × (A1 + 4Am + A2) */
export function prismoid(Lb,Wb,D,k){
 const Lt=Lb+2*k*D, Wt=Wb+2*k*D, Lm=(Lb+Lt)/2, Wm=(Wb+Wt)/2;
 return {Lt,Wt,A1:Lb*Wb,Am:Lm*Wm,A2:Lt*Wt,V:D/6*(Lb*Wb+4*Lm*Wm+Lt*Wt)};
}
export default {
 id:"excav", group:"earth", title:"الحفر والردم",
 desc:"حجم حفر قاعدةٍ أو خندقٍ بمسافة عملٍ وميولٍ جانبية بالمعادلة المنشورية، وحجم الردم بعد خصم المنشأ، والفائض الواجب ترحيله — كلّها بالحجم الطبيعي (في الموقع).",
 aliases:"excavation backfill earthwork pit trench حفر ردم حفريات خندق قاعده ميول مسافه عمل اتربه فائض ترحيل",
 ref:"BS 6031:2009 (الأعمال الترابية — دليل الممارسة) · المعادلة المنشورية (Prismoidal formula)",
 formula:["قاع الحفر: Lb = L + 2 × مسافة العمل ، Wb = W + 2 × مسافة العمل",
  "سطح الحفر: Lt = Lb + 2kD ، Wt = Wb + 2kD (k الميل أفقي : رأسي)",
  "V = D/6 × (A1 + 4Am + A2) ، و Am مساحة المقطع في منتصف العمق",
  "الردم = (V − حجم المنشأ) × العدد ، والفائض = حجم المنشأ × العدد"],
 inputs:[
  {k:"L",n:"طول المنشأ (القاعدة أو الخندق)",kind:"len",unit:"m",def:2,min:0},
  {k:"W",n:"عرض المنشأ",kind:"len",unit:"m",def:2,min:0},
  {k:"D",n:"عمق الحفر",kind:"len",unit:"m",def:1.5,min:0,max:10},
  {k:"ws",n:"مسافة العمل لكل جانب",kind:"len",unit:"m",def:0.5,min:0,max:3},
  {k:"k",n:"الميل الجانبي (أفقي لكل 1 رأسي)",def:0,min:0,max:3,step:0.1},
  {k:"Vs",n:"حجم المنشأ تحت منسوب الردم",kind:"vol",unit:"m3",def:0,min:0},
  {k:"n",n:"العدد",def:1,min:1,step:1}
 ],
 outputs:[
  {k:"Lt",n:"طول سطح الحفر",kind:"len",unit:"m",dp:2},
  {k:"Wt",n:"عرض سطح الحفر",kind:"len",unit:"m",dp:2},
  {k:"V1",n:"حجم الحفر للواحد",kind:"vol",unit:"m3",dp:3},
  {k:"V",n:"حجم الحفر الكلّي",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"B",n:"حجم الردم",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"X",n:"الفائض للترحيل",kind:"vol",unit:"m3",dp:3,main:1}
 ],
 compute(v){
  const n=Math.round(v.n), Lb=v.L+2*v.ws, Wb=v.W+2*v.ws, P=prismoid(Lb,Wb,v.D,v.k);
  const warn=[];
  if(v.Vs>P.V)warn.push("حجم المنشأ أكبر من الحفر — الردم صفر");
  if(v.D>1.2&&v.k===0)warn.push("حفرٌ رأسي أعمق من 1.2 م يحتاج سنداً أو ميولاً وفق BS 6031 وتقرير التربة");
  const B=Math.max(0,P.V-v.Vs)*n, X=Math.min(v.Vs,P.V)*n;
  return {out:{Lt:P.Lt,Wt:P.Wt,V1:P.V,V:P.V*n,B,X},steps:[
   ltr(`Lb × Wb = ${fmt(Lb,3)} × ${fmt(Wb,3)} = ${fmt(P.A1,4)}`)+" م²",
   ltr(`Lt × Wt = ${fmt(P.Lt,3)} × ${fmt(P.Wt,3)} = ${fmt(P.A2,4)}`)+" م² ، "+ltr(`Am = ${fmt(P.Am,4)}`)+" م²",
   ltr(`V = ${fmt(v.D,3)}/6 × (${fmt(P.A1,4)} + 4 × ${fmt(P.Am,4)} + ${fmt(P.A2,4)}) = ${fmt(P.V,4)}`)+" م³",
   ltr(`الردم = (${fmt(P.V,4)} − ${fmt(v.Vs,3)}) × ${n} = ${fmt(B,3)}`)+" م³"],warn};
 },
 cases:[
  {n:"خندق 10 × 5 م بعمق 2 م رأسي",src:"قياس مباشر: 10 × 5 × 2 = 100 م³",in:{L:10,W:5,D:2,ws:0,k:0},out:{V:100,B:100,X:0},tol:1e-9},
  {n:"حفرة قاعها 2 × 2 م بعمق 1 م وميل 1:1",src:"جذع الهرم: h/3 × (A1 + A2 + √(A1·A2)) = 1/3 × (4 + 16 + 8) = 9.333 م³",in:{L:2,W:2,D:1,ws:0,k:1},out:{V:9.33333,Lt:4},tol:1e-6},
  {n:"أربع قواعد 1.5 × 1.5 م بمسافة عمل 0.5 وعمق 1.5 وميل 0.5 ومنشأ 1.2 م³",src:"حساب يدوي: القاع 2.5² = 6.25 ، الوسط 3.25² = 10.5625 ، السطح 4² = 16 ⇒ 1.5/6 × 64.5 = 16.125 × 4 = 64.5 م³ ، الردم 64.5 − 4.8 = 59.7",
   in:{L:1.5,W:1.5,D:1.5,ws:0.5,k:0.5,Vs:1.2,n:4},out:{V1:16.125,V:64.5,B:59.7,X:4.8},tol:1e-9}
 ]
};
