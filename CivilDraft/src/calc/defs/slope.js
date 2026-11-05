/* الميول والانحدارات */
import {ltr} from "../../core/units.js";
import {fmt,rad,deg} from "../engine.js";
export default {
 id:"slope", group:"general", title:"الميول والانحدارات",
 desc:"يحوّل الميل بين النسبة المئوية والزاوية ونسبة 1:n، ويحسب الفرقَ في المنسوب وطولَ السطح المائل — للمنحدرات والأسطح والمواسير والطرق.",
 aliases:"slope grade gradient ramp ميل ميول انحدار منحدر نسبه مئويه زاويه منسوب",
 ref:"تعريف الميل: الارتفاع ÷ المسافة الأفقية · Approved Document M Vol 2 (2015) الجدول 2 (أقصى منحدر 1:12 لرحلة ≤ 2 م) — والتصميم الكامل في حاسبة المنحدر",
 formula:["الميل ٪ = (الارتفاع ÷ المسافة الأفقية) × 100","الزاوية θ = tan⁻¹(الارتفاع ÷ المسافة)","النسبة 1:n حيث n = المسافة ÷ الارتفاع","طول السطح المائل = √(الارتفاع² + المسافة²)"],
 inputs:[
  {k:"mode",n:"المعلوم",type:"sel",def:"rr",opts:[{v:"rr",n:"الارتفاع والمسافة"},{v:"pct",n:"الميل ٪ والمسافة"},{v:"ang",n:"الزاوية والمسافة"},{v:"n",n:"النسبة 1:n والمسافة"}]},
  {k:"rise",n:"الارتفاع (فرق المنسوب)",kind:"len",unit:"m",def:1,min:0,when:v=>v.mode==="rr"},
  {k:"pct",n:"الميل",kind:"pct",unit:"pct",def:2,min:0,max:10000,when:v=>v.mode==="pct"},
  {k:"ang",n:"الزاوية",kind:"ang",unit:"deg",def:30,min:0,max:89.99,when:v=>v.mode==="ang"},
  {k:"n",n:"n في النسبة 1:n",def:12,min:0.0001,when:v=>v.mode==="n"},
  {k:"run",n:"المسافة الأفقية",kind:"len",unit:"m",def:100,min:0.0001}
 ],
 outputs:[
  {k:"pct",n:"الميل",kind:"pct",unit:"pct",dp:3,main:1},
  {k:"ang",n:"الزاوية",kind:"ang",unit:"deg",dp:4},
  {k:"n",n:"النسبة 1:n — قيمة n",dp:3},
  {k:"rise",n:"الارتفاع",kind:"len",unit:"m",dp:4},
  {k:"len",n:"طول السطح المائل",kind:"len",unit:"m",dp:4}
 ],
 compute(v){
  const run=v.run; let rise;
  if(v.mode==="rr")rise=v.rise;
  else if(v.mode==="pct")rise=v.pct/100*run;
  else if(v.mode==="ang")rise=Math.tan(rad(v.ang))*run;
  else rise=run/v.n;
  const t=rise/run, o={pct:t*100,ang:deg(Math.atan(t)),n:rise>0?run/rise:Infinity,rise,len:Math.hypot(rise,run)};
  const st=[`الميل = ${ltr(`${fmt(rise,4)} ÷ ${fmt(run,4)} = ${fmt(t,6)}`)} = ${ltr(fmt(o.pct,3))}٪`,
   ltr(`θ = tan⁻¹(${fmt(t,6)}) = ${fmt(o.ang,4)}°`)];
  const warn=[];
  if(rise===0){o.n="—";warn.push("الارتفاع صفر: السطح أفقيّ ولا نسبة 1:n له")}
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"منحدر بنسبة 1:12",src:"Approved Document M Vol 2 الجدول 2: أقصى ميل 1:12 = 8.33٪ (4.76°)",in:{mode:"n",n:12,run:12},out:{pct:8.333333,ang:4.763642,rise:1},tol:1e-5},
  {n:"ميلٌ واحد في المئة",src:"تعريف: 1 م على 100 م = 1٪ = 0.5729°",in:{mode:"rr",rise:1,run:100},out:{pct:1,ang:0.572939,n:100},tol:1e-5},
  {n:"زاوية ٤٥°",src:"tan 45° = 1 ⇒ 100٪ و1:1 وطول السطح √2",in:{mode:"ang",ang:45,run:1},out:{pct:100,n:1,len:1.414214},tol:1e-5}
 ]
};
