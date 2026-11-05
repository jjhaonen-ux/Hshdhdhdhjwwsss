/* المنحدر: الطول والرحلات والبسطات — المرحلة ٣-د · Approved Document M */
import {ltr} from "../../core/units.js";
import {fmt,interp} from "../engine.js";
import {RAMP as T} from "../tables.js";
export default {
 id:"ramp", group:"stairs", title:"المنحدر (ذوي الإعاقة)",
 desc:"طول المنحدر من الارتفاع والميل، وأقصى ارتفاعٍ للرحلة الواحدة حسب الميل، وعدد الرحلات والبسطات الوسطية والطول الكلّي — وفق جدول Approved Document M.",
 aliases:"ramp accessible wheelchair gradient 1:12 1:20 landing منحدر رامب ذوي الاعاقه كرسي متحرك ميل 1:12 بسطه",
 ref:T.ref,
 formula:["أقصى طول رحلة G(X) بالاستكمال: 1:12 ⇒ 2 م · 1:15 ⇒ 5 م · 1:20 ⇒ 10 م","أقصى ارتفاع رحلة = G ÷ X","الرحلات = ⌈H ÷ أقصى ارتفاع⌉ ، الطول الأفقي = H × X","الكلّي = الطول الأفقي + (الرحلات − 1) × طول البسطة"],
 inputs:[
  {k:"H",n:"الارتفاع الكلّي",kind:"len",unit:"mm",def:600,min:10,max:5000},
  {k:"X",n:"الميل 1 : X",def:20,min:12,max:20,step:0.5,hint:"أشدّ ميلٍ مسموح 1:12"},
  {k:"La",n:"طول البسطة الوسطية",kind:"len",unit:"m",def:T.landing,min:1.2,max:5}
 ],
 outputs:[
  {k:"G",n:"أقصى طول للرحلة",kind:"len",unit:"m",dp:2},
  {k:"Rf",n:"أقصى ارتفاع للرحلة",kind:"len",unit:"mm",dp:0},
  {k:"nF",n:"عدد الرحلات",dp:0,main:1},
  {k:"rpf",n:"ارتفاع كلّ رحلة",kind:"len",unit:"mm",dp:0},
  {k:"go",n:"الطول الأفقي للمنحدر",kind:"len",unit:"m",dp:3},
  {k:"tot",n:"الطول الكلّي مع البسطات",kind:"len",unit:"m",dp:3,main:1}
 ],
 compute(v){
  const G=interp(T.going,v.X), Rf=G*1000/v.X, nF=Math.ceil(v.H/Rf-1e-9), go=v.H*v.X/1000, tot=go+(nF-1)*v.La, st=[], warn=[];
  st.push(ltr(`G(1:${fmt(v.X,1)}) = ${fmt(G,2)} م ⇒ Rmax = ${fmt(G*1000,0)} ÷ ${fmt(v.X,1)} = ${fmt(Rf,1)}`)+" مم");
  st.push(ltr(`n = ⌈${fmt(v.H,0)} ÷ ${fmt(Rf,1)}⌉ = ${nF}`)+" ، "+ltr(`${fmt(v.H/1000,3)} × ${fmt(v.X,1)} = ${fmt(go,3)}`)+" م ، "+ltr(`+ ${nF-1} × ${fmt(v.La,2)} = ${fmt(tot,3)}`)+" م");
  if(v.H>2000)warn.push("ارتفاعٌ كبير (> 2 م): Approved Document M يشترط بديلاً (مصعداً أو رافعة)");
  warn.push("أضِف بسطتين في البداية والنهاية (≥ 1.2 م خالية من أرجحة الأبواب) ودرابزيناً على الجانبين");
  return {out:{G,Rf,nF,rpf:v.H/nF,go,tot},steps:st,warn};
 },
 cases:[
  {n:"ارتفاع 600 مم بميل 1:20",src:"AD M الجدول 2: 1:20 ⇒ 10 م و500 مم للرحلة ⇒ رحلتان ؛ 0.6 × 20 = 12 م + 1.5 = 13.5 م",in:{H:600,X:20,La:1.5},out:{G:10,Rf:500,nF:2,rpf:300,go:12,tot:13.5},tol:1e-9},
  {n:"ارتفاع 300 مم بميل 1:15",src:"AD M الجدول 2: 1:15 ⇒ 5 م و333 مم ⇒ رحلة واحدة ؛ 0.3 × 15 = 4.5 م",in:{H:300,X:15,La:1.5},out:{G:5,Rf:333.3333,nF:1,go:4.5,tot:4.5},tol:1e-6},
  {n:"ارتفاع 450 مم بميل 1:13.5 (استكمال)",src:"استكمال خطّي: G = 2 + 3 × 1.5 ÷ 3 = 3.5 م ⇒ Rmax = 259.26 مم ⇒ رحلتان ؛ 0.45 × 13.5 = 6.075 + 1.5 = 7.575 م",in:{H:450,X:13.5,La:1.5},out:{G:3.5,Rf:259.2593,nF:2,rpf:225,go:6.075,tot:7.575},tol:1e-6}
 ]
};
