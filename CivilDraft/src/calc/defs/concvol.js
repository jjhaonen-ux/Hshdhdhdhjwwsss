/* حجم الخرسانة للعناصر */
import {fmt,PI} from "../engine.js";
import {ltr} from "../../core/units.js";
const EL=[{v:"slab",n:"بلاطة"},{v:"beam",n:"كمرة / ميدة"},{v:"colr",n:"عمود مستطيل"},{v:"colc",n:"عمود دائري"},
 {v:"foot",n:"قاعدة منفصلة"},{v:"wall",n:"حائط خرساني"},{v:"strip",n:"قاعدة شريطية / خرسانة عادية"}];
export default {
 id:"concvol", group:"concrete", title:"حجم الخرسانة للعناصر",
 desc:"حجم الصبّ لبلاطةٍ أو كمرةٍ أو عمودٍ (مستطيل/دائري) أو قاعدةٍ أو حائط، بعدد العناصر ونسبة الهالك، ومساحة الشدّة التقريبية.",
 aliases:"concrete volume صب حجم خرسانه كميه خرسانه بلاطه عمود قاعده كمره ميده متر مكعب شده",
 ref:"الحجم الصافي بأبعاد الرسم · الهالك حسب ممارسة الموقع (2–5٪ عادةً، قرارٌ للمهندس)",
 formula:["مستطيل: V = الطول × العرض × السماكة (أو الارتفاع)","عمود دائري: V = π D²/4 × H","الحجم الكلي = V × العدد × (1 + الهالك)"],
 inputs:[
  {k:"el",n:"العنصر",type:"sel",def:"slab",opts:EL},
  {k:"a",n:"الطول",kind:"len",unit:"m",def:5,min:0,when:v=>!["colr","colc"].includes(v.el)},
  {k:"b",n:"العرض",kind:"len",unit:"m",def:4,min:0,when:v=>!["colc","wall"].includes(v.el)},
  {k:"t",n:"السماكة / العمق",kind:"len",unit:"m",def:0.15,min:0,when:v=>!["colr","colc"].includes(v.el)},
  {k:"bh",n:"البُعد الثاني للقطاع",kind:"len",unit:"m",def:0.5,min:0,when:v=>v.el==="colr"},
  {k:"D",n:"القطر",kind:"len",unit:"m",def:0.4,min:0,when:v=>v.el==="colc"},
  {k:"H",n:"الارتفاع",kind:"len",unit:"m",def:3,min:0,when:v=>["colr","colc","wall"].includes(v.el)},
  {k:"n",n:"عدد العناصر",def:1,min:1,step:1},
  {k:"waste",n:"الهالك",kind:"pct",unit:"pct",def:0,min:0,max:30}
 ],
 outputs:[
  {k:"V1",n:"حجم العنصر الواحد",kind:"vol",unit:"m3",dp:4},
  {k:"Vn",n:"الحجم الصافي",kind:"vol",unit:"m3",dp:3},
  {k:"Vg",n:"الحجم المطلوب مع الهالك",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"F",n:"مساحة الشدّة التقريبية",kind:"area",unit:"m2",dp:2}
 ],
 /* الشدّة: ما يلامس الخشبَ فعلاً — البلاطة باطنُها وحوافّها، والكمرةُ
    باطنُها وجانباها، والحائطُ وجهاه (لا حافّتاه العلويّتان)، والقاعدةُ
    جوانبُها الأربعة. التصحيح (٣-أ): كان الحائط يحسب 2 × الطول × السماكة. */
 compute(v){
  let V1,F,st;
  switch(v.el){
   case "colr": V1=v.b*v.bh*v.H; F=2*(v.b+v.bh)*v.H; st=ltr(`${fmt(v.b)} × ${fmt(v.bh)} × ${fmt(v.H)}`); break;
   case "colc": V1=PI*v.D*v.D/4*v.H; F=PI*v.D*v.H; st=ltr(`π × ${fmt(v.D)}²/4 × ${fmt(v.H)}`); break;
   case "slab": V1=v.a*v.b*v.t; F=v.a*v.b+2*(v.a+v.b)*v.t; st=ltr(`${fmt(v.a)} × ${fmt(v.b)} × ${fmt(v.t)}`); break;
   case "beam": V1=v.a*v.b*v.t; F=v.a*(v.b+2*v.t); st=ltr(`${fmt(v.a)} × ${fmt(v.b)} × ${fmt(v.t)}`); break;
   case "wall": V1=v.a*v.H*v.t; F=2*v.a*v.H; st=ltr(`${fmt(v.a)} × ${fmt(v.H)} × ${fmt(v.t)}`); break;
   default: V1=v.a*v.b*v.t; F=2*(v.a+v.b)*v.t; st=ltr(`${fmt(v.a)} × ${fmt(v.b)} × ${fmt(v.t)}`);
  }
  const n=Math.round(v.n), Vn=V1*n, Vg=Vn*(1+v.waste/100);
  const warn=[];
  if(n!==v.n)warn.push(`عدد العناصر قُرِّب إلى ${n}`);
  if(v.el==="beam")warn.push("شدّة الكمرة: الباطن والجانبان بعمقها الكلّي — اطرح سماكة البلاطة إن صُبّتا معاً");
  return {out:{V1,Vn,Vg,F:F*n},steps:[ltr(`V = ${st} = ${fmt(V1,4)}`)+" م³",
   ltr(`${fmt(V1,4)} × ${n}${v.waste?` × ${fmt(1+v.waste/100,3)}`:""} = ${fmt(Vg,3)}`)+" م³"],warn};
 },
 cases:[
  {n:"بلاطة 5 × 4 × 0.15 م",src:"قياس مباشر: 5 × 4 × 0.15 = 3.000 م³",in:{el:"slab",a:5,b:4,t:0.15},out:{Vg:3},tol:1e-9},
  {n:"عشرة أعمدة 30 × 50 سم بارتفاع 3 م",src:"قياس مباشر: 0.3 × 0.5 × 3 × 10 = 4.5 م³ ، الشدّة 2(0.8)(3)(10) = 48 م²",in:{el:"colr",b:0.3,bh:0.5,H:3,n:10},out:{Vg:4.5,F:48},tol:1e-9},
  {n:"حائط 6 م × 3 م × 0.2 م",src:"قياس مباشر: 6 × 3 × 0.2 = 3.6 م³ ، الشدّة للوجهين 2 × 6 × 3 = 36 م²",in:{el:"wall",a:6,H:3,t:0.2},out:{Vg:3.6,F:36},tol:1e-9},
  {n:"أربعة أعمدة دائرية Ø40 سم بارتفاع 3 م + 5٪ هالك",src:"π × 0.4²/4 × 3 = 0.37699 ؛ × 4 = 1.50796 ؛ × 1.05 = 1.58336 م³",in:{el:"colc",D:0.4,H:3,n:4,waste:5},out:{Vn:1.507964,Vg:1.583363},tol:1e-5}
 ]
};
