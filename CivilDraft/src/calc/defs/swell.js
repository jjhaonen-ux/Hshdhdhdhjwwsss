/* معامل الانتفاش والدمك — المرحلة ٣-ب */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {SOILS as T} from "../tables.js";
const OPTS=Object.entries(T.list).map(([v,o])=>({v,n:`${o.n} (انتفاش ${o.sw}٪ · ${o.sh>=0?"انكماش":"زيادة"} ${Math.abs(o.sh)}٪)`})).concat([{v:"custom",n:"قيمٌ من تقرير التربة"}]);
/* معاملا التربة المختارة: من الجدول أو من المدخلات */
export const soilOf=v=>v.soil==="custom"?{sw:v.sw,sh:v.sh}:T.list[v.soil];
export default {
 id:"swell", group:"earth", title:"الانتفاش والدمك",
 desc:"تحويل حجم التربة بين حالاتها الثلاث: طبيعية في الموقع (Bank) ومفكَّكة بعد الحفر (Loose) ومدموكة (Compacted)، بمعاملَي الانتفاش والانكماش.",
 aliases:"swell shrinkage bulking compaction bank loose compacted load factor انتفاش انكماش دمك تفكك تربه حجم طبيعي سائب مدموك معامل التحميل",
 ref:T.ref,
 formula:["المفكَّك = الطبيعي × (1 + الانتفاش)","المدموك = الطبيعي × (1 − الانكماش)",
  "معامل التحميل = 1 ÷ (1 + الانتفاش) ، ومعامل الدمك = 1 − الانكماش"],
 inputs:[
  {k:"V",n:"الحجم المعلوم",kind:"vol",unit:"m3",def:100,min:0},
  {k:"st",n:"حالة الحجم المعلوم",type:"sel",def:"bank",opts:[{v:"bank",n:"طبيعي في الموقع (Bank)"},{v:"loose",n:"مفكَّك (Loose)"},{v:"comp",n:"مدموك (Compacted)"}]},
  {k:"soil",n:"نوع التربة",type:"sel",def:"earth",opts:OPTS},
  {k:"sw",n:"الانتفاش",kind:"pct",unit:"pct",def:25,min:0,max:100,when:v=>v.soil==="custom"},
  {k:"sh",n:"الانكماش (سالبٌ إن زاد المدموك)",kind:"pct",unit:"pct",def:10,min:-50,max:50,when:v=>v.soil==="custom"}
 ],
 outputs:[
  {k:"Vb",n:"الحجم الطبيعي",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"Vl",n:"الحجم المفكَّك",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"Vc",n:"الحجم المدموك",kind:"vol",unit:"m3",dp:3,main:1},
  {k:"LF",n:"معامل التحميل",dp:3},
  {k:"CF",n:"معامل الدمك",dp:3}
 ],
 compute(v){
  const s=soilOf(v), fl=1+s.sw/100, fc=1-s.sh/100;
  const Vb=v.st==="bank"?v.V:(v.st==="loose"?v.V/fl:v.V/fc);
  return {out:{Vb,Vl:Vb*fl,Vc:Vb*fc,LF:1/fl,CF:fc},steps:[
   ltr(`الانتفاش ${s.sw}٪ ، الانكماش ${s.sh}٪`),
   ltr(`Vb = ${fmt(Vb,3)}`)+" م³ ⇒ "+ltr(`Vl = ${fmt(Vb,3)} × ${fmt(fl,3)} = ${fmt(Vb*fl,3)}`)+" ، "+ltr(`Vc = ${fmt(Vb,3)} × ${fmt(fc,3)} = ${fmt(Vb*fc,3)}`)],
   warn:["المعاملات إرشادية؛ القيمُ الحاكمة من تقرير التربة واختبار الدمك (بروكتور)"]};
 },
 cases:[
  {n:"100 م³ طبيعي من تربة عادية",src:"Peurifoy (تربة عادية): انتفاش 25٪ ⇒ 125 م³ مفكَّك ، انكماش 10٪ ⇒ 90 م³ مدموك ، معامل التحميل 0.8",
   in:{V:100,st:"bank",soil:"earth"},out:{Vl:125,Vc:90,LF:0.8},tol:1e-9},
  {n:"120 م³ مفكَّك من الطين",src:"حساب يدوي: انتفاش 35٪ ⇒ 120 ÷ 1.35 = 88.889 م³ طبيعي",
   in:{V:120,st:"loose",soil:"clay"},out:{Vb:88.8889},tol:1e-6},
  {n:"50 م³ مدموك بقيمٍ من التقرير (انتفاش 15٪ وانكماش 12٪)",src:"حساب يدوي: 50 ÷ 0.88 = 56.818 طبيعي ⇒ × 1.15 = 65.341 مفكَّك",
   in:{V:50,st:"comp",soil:"custom",sw:15,sh:12},out:{Vb:56.8182,Vl:65.3409},tol:1e-6}
 ]
};
