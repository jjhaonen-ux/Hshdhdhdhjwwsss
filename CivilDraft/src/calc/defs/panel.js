/* حمل اللوحة الكهربائية — المرحلة ٣-د */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {SYS,ibOf,mcbFor} from "./cable.js";
const CATS=[["li","الإنارة",90],["so","المقابس",50],["ac","التكييف",100],["he","السخّانات",75],["ot","أحمال أخرى",75]];
export default {
 id:"panel", group:"mep", title:"حمل اللوحة الكهربائية",
 desc:"الحمل الموصول والحمل المطلوب لِلَوحةٍ بمعامل طلبٍ لكل فئة (إنارة · مقابس · تكييف · سخّانات · أخرى)، والقدرة الظاهرية والتيار مع احتياطي التوسّع، والقاطع الرئيسي القياسي.",
 aliases:"panel board load demand factor main breaker distribution board لوحه كهربائيه حمل موصول مطلوب معامل طلب قاطع رئيسي توزيع",
 ref:"معاملات الطلب مدخلاتٌ تحدّدها الجهة (BS 7671 دليل التركيب OSG الملحق A إرشاداً) · القواطع القياسية BS EN 60898 / 60947-2",
 formula:["الموصول = Σ أحمال الفئات","المطلوب = Σ (حمل الفئة × معامل طلبها)","kVA = المطلوب ÷ cosφ ، Ib = P ÷ (V cosφ) أو P ÷ (√3 V cosφ)","تيار التصميم = Ib × (1 + الاحتياطي) ⇒ أقرب قاطعٍ قياسيّ"],
 inputs:[
  {k:"sys",n:"النظام",type:"sel",def:"1",opts:SYS},
  ...CATS.map(([k,n])=>({k,n:`${n}`,kind:"power",unit:"kW",def:{li:1.5,so:4,ac:7,he:3,ot:1}[k],min:0})),
  ...CATS.map(([k,n,f])=>({k:"f"+k,n:`معامل طلب ${n}`,kind:"pct",unit:"pct",def:f,min:0,max:100})),
  {k:"pf",n:"معامل القدرة cosφ",def:0.9,min:0.5,max:1,step:0.01},
  {k:"sp",n:"احتياطي التوسّع",kind:"pct",unit:"pct",def:20,min:0,max:100}
 ],
 outputs:[
  {k:"con",n:"الحمل الموصول",kind:"power",unit:"kW",dp:2},
  {k:"dem",n:"الحمل المطلوب",kind:"power",unit:"kW",dp:2,main:1},
  {k:"kva",n:"القدرة الظاهرية (kVA)",dp:2},
  {k:"Ib",n:"تيار الحمل المطلوب",kind:"curr",unit:"A",dp:2},
  {k:"Id",n:"تيار التصميم مع الاحتياطي",kind:"curr",unit:"A",dp:2},
  {k:"In",n:"القاطع الرئيسي",kind:"curr",unit:"A",dp:0,main:1}
 ],
 compute(v){
  const con=CATS.reduce((s,[k])=>s+v[k],0), dem=CATS.reduce((s,[k])=>s+v[k]*v["f"+k]/100,0);
  if(dem<=0)throw new Error("لا حمل: أدخل حمل فئةٍ واحدة على الأقل بمعامل طلبٍ أكبر من صفر");
  const kva=dem/v.pf, Ib=ibOf(v.sys,dem,v.pf), Id=Ib*(1+v.sp/100), In=mcbFor(Id), st=[], warn=[];
  st.push(ltr(CATS.map(([k])=>`${fmt(v[k],2)}×${fmt(v["f"+k]/100,2)}`).join(" + ")+` = ${fmt(dem,3)}`)+" kW من "+ltr(fmt(con,2))+" kW موصول");
  st.push(ltr(`Ib = ${fmt(dem*1000,0)} ÷ (${v.sys==="3"?"√3 × 400":"230"} × ${v.pf}) = ${fmt(Ib,2)} A ⇒ × ${fmt(1+v.sp/100,2)} = ${fmt(Id,2)} A`));
  if(In==null)throw new Error(`تيارٌ ${fmt(Id,0)} A فوق أكبر قاطعٍ في الجدول`);
  if(v.sys==="3")warn.push("التيار لكل طور على افتراض توزيعٍ متوازن على الأطوار الثلاثة");
  else if(Id>63)warn.push("تيارٌ أحاديّ فوق 63 A: الأنسب تغذيةٌ ثلاثية الطور");
  warn.push("معاملات الطلب الافتراضية إرشادية: استعمل ما تعتمده شركة الكهرباء أو الجهة المختصّة");
  return {out:{con,dem,kva,Ib,Id,In},steps:st,warn};
 },
 cases:[
  {n:"شقّة أحادية الطور بالمعاملات الافتراضية",src:"حساب يدوي: الموصول 16.5 kW ؛ المطلوب 1.35 + 2 + 7 + 2.25 + 0.75 = 13.35 kW ؛ Ib = 13350 ÷ 207 = 64.49 A ⇒ × 1.2 = 77.39 ⇒ 80 A",in:{sys:"1",li:1.5,so:4,ac:7,he:3,ot:1,fli:90,fso:50,fac:100,fhe:75,fot:75,pf:0.9,sp:20},out:{con:16.5,dem:13.35,kva:14.8333,Ib:64.4928,Id:77.3913,In:80},tol:1e-5},
  {n:"فيلا ثلاثية الطور",src:"حساب يدوي: المطلوب 2.7 + 5 + 25 + 6.75 + 3.75 = 43.2 kW ؛ Ib = 43200 ÷ (√3×400×0.9) = 69.28 A ⇒ 83.14 ⇒ 100 A",in:{sys:"3",li:3,so:10,ac:25,he:9,ot:5,fli:90,fso:50,fac:100,fhe:75,fot:75,pf:0.9,sp:20},out:{con:52,dem:43.2,kva:48,Ib:69.2820,Id:83.1384,In:100},tol:1e-5},
  {n:"ملحق صغير بمعاملات 100٪ بلا احتياطي",src:"حساب يدوي: 0.8 + 2 + 3.5 = 6.3 kW ؛ Ib = 6300 ÷ 230 = 27.39 A ⇒ 32 A",in:{sys:"1",li:0.8,so:2,ac:3.5,he:0,ot:0,fli:100,fso:100,fac:100,fhe:100,fot:100,pf:1,sp:0},out:{con:6.3,dem:6.3,kva:6.3,Ib:27.3913,In:32},tol:1e-5}
 ]
};
