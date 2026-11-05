/* زمن فكّ الشدّات — BS 8110-1:1997 الجدول 6.3 (v2.8.0: كان ACI 347) */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {BS8110_STRIKE as T} from "../tables.js";
const KEYS=["vert","slabS","slabP","beamS","beamP"];
export default {
 id:"formwork", group:"concrete", title:"زمن فكّ الشدّات",
 desc:"أقلّ مدّةٍ لفكّ الشدّات والدعامات وفق BS 8110-1 (الجدول 6.3) بحسب العنصر وحرارة سطح الخرسانة، لأسمنتٍ بورتلاندي عادي (OPC) أو مقاوم للكبريتات — ما لم يحدّد المهندس غير ذلك أو تُثبِت المكعّبات مقاومةً كافية.",
 aliases:"formwork striking stripping removal props bs8110 فك الشدات فك الطوبار فك القوالب شده طوبار دعامات قوائم مده عمر الخرسانه",
 ref:T.ref,
 formula:["المدة = k ÷ (t + 10) ، و t حرارة سطح الخرسانة °C",
  "شدّة رأسية: k = 300 (ساعات) ⇒ 12 ساعة عند 16°C و18 عند 7°C",
  "باطن البلاطات: k = 100 (أيام) ⇒ 4 / 6 · دعامات البلاطات: k = 250 ⇒ 10 / 15",
  "باطن الكمرات: k = 230 ⇒ 9 / 14 · دعامات الكمرات: k = 360 ⇒ 14 / 21"],
 inputs:[
  {k:"el",n:"العنصر",type:"sel",def:"slabS",opts:KEYS.map(v=>({v,n:T[v].n}))},
  {k:"t",n:"حرارة سطح الخرسانة (°C)",def:16,min:0,max:30,step:1},
  {k:"cem",n:"الأسمنت",type:"sel",def:"opc",opts:[{v:"opc",n:"بورتلاندي عادي OPC أو مقاوم للكبريتات SRPC"},{v:"other",n:"غيره (خبث، رماد متطاير، بطيء)"}]}
 ],
 outputs:[
  {k:"h",n:"أقلّ مدّة للفكّ",kind:"time",unit:"h",dp:1},
  {k:"d",n:"أقلّ مدّة للفكّ",kind:"time",unit:"d",dp:2,main:1},
  {k:"r",n:"بالتقريب كما في الجدول 6.3",unit:v=>T[v.el].u==="h"?"ساعة":"يوم",dp:0,main:1}
 ],
 compute(v){
  const E=T[v.el], x=E.k/(v.t+10), h=E.u==="h"?x:x*24;
  const warn=["المدد دنيا لعناصر لا تحمل إلا وزنها؛ الأحمال الإنشائية المبكرة أو البحور الكبيرة تحتاج قرار المهندس (البند 6.2.6.3)"];
  if(v.cem==="other")warn.push("الجدول 6.3 لـ OPC/SRPC: الأسمنتات الأخرى تحتاج مدداً أطول يحدّدها المهندس أو نتائج المكعّبات");
  if(v.t<5)warn.push("حرارة دون 5°C: احمِ الخرسانة من الصقيع ولا تعتمد على المعادلة وحدها");
  return {out:{h,d:h/24,r:Math.round(x)},steps:[
   `${E.n}: ${ltr(`k = ${E.k}`)} ${E.u==="h"?"ساعة":"يوم"}`,
   ltr(`${E.k} ÷ (${fmt(v.t,1)} + 10) = ${fmt(x,2)}`)+(E.u==="h"?" ساعة":" يوم")],warn};
 },
 cases:[
  {n:"شدّة عمود عند 16°C",src:"BS 8110-1 الجدول 6.3: Vertical formwork to columns, walls and large beams ⇒ 12 h (16°C)",in:{el:"vert",t:16},out:{r:12,h:11.538},tol:0.001},
  {n:"باطن بلاطة عند 16°C",src:"BS 8110-1 الجدول 6.3: Soffit formwork to slabs ⇒ 4 days (16°C)",in:{el:"slabS",t:16},out:{r:4},tol:1e-9},
  {n:"دعامات بلاطة عند 7°C",src:"BS 8110-1 الجدول 6.3: Props to slabs ⇒ 15 days (7°C)",in:{el:"slabP",t:7},out:{r:15},tol:1e-9},
  {n:"باطن كمرة عند 16°C",src:"BS 8110-1 الجدول 6.3: Soffit formwork to beams ⇒ 9 days (16°C)",in:{el:"beamS",t:16},out:{r:9},tol:1e-9},
  {n:"دعامات كمرة عند 7°C",src:"BS 8110-1 الجدول 6.3: Props to beams ⇒ 21 days (7°C)",in:{el:"beamP",t:7},out:{r:21},tol:1e-9}
 ]
};
