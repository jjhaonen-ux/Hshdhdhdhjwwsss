/* ميول المواسير ومناسيبها — المرحلة ٣-د */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {MANNING as M} from "../tables.js";
import {NOPTS} from "./drainpipe.js";
export default {
 id:"pipeslope", group:"water", title:"ميول المواسير والمناسيب",
 desc:"أقلّ ميلٍ يحقّق سرعة التنظيف الذاتي في ماسورة صرف (ممتلئة أو نصف ممتلئة، R = D/4 في الحالتين)، أو سرعة ميلٍ معلوم، مع الهبوط على الطول ومنسوب القاع في نهاية الخطّ.",
 aliases:"pipe slope gradient fall invert level self cleansing ميل المواسير ميول انحدار منسوب قاع هبوط صرف 1:100 سرعه تنظيف",
 ref:M.ref,
 formula:["R = D ÷ 4 (ممتلئة أو نصف ممتلئة)","أقلّ ميل S = (v n ÷ R^(2/3))²","v = (1 ÷ n) R^(2/3) S^(1/2)","الهبوط = S × الطول ، منسوب القاع النهائي = البدائي − الهبوط"],
 inputs:[
  {k:"mode",n:"المطلوب",type:"sel",def:"min",opts:[{v:"min",n:"أقلّ ميل لسرعة التنظيف"},{v:"given",n:"ميلٌ معلوم"}]},
  {k:"D",n:"القطر الداخلي",kind:"len",unit:"mm",def:100,min:32,max:3000},
  {k:"m",n:"مادّة الماسورة",type:"sel",def:"upvc",opts:NOPTS},
  {k:"vm",n:"سرعة التنظيف الذاتي",kind:"vel",unit:"ms",def:M.vClean,min:0.3,max:3,when:v=>v.mode==="min"},
  {k:"S",n:"الميل",kind:"pct",unit:"pct",def:1,min:0.05,max:20,when:v=>v.mode==="given"},
  {k:"L",n:"طول الخطّ",kind:"len",unit:"m",def:20,min:0},
  {k:"IL",n:"منسوب القاع في البداية",kind:"len",unit:"m",def:0,min:-1000,max:10000}
 ],
 outputs:[
  {k:"S",n:"الميل",kind:"pct",unit:"pct",dp:3,main:1},
  {k:"X",n:"الميل بصيغة 1 : X",dp:0,u:"(X)"},
  {k:"v",n:"السرعة ممتلئةً",kind:"vel",unit:"ms",dp:2},
  {k:"fall",n:"الهبوط على الطول",kind:"len",unit:"m",dp:3,main:1},
  {k:"IL2",n:"منسوب القاع في النهاية",kind:"len",unit:"m",dp:3,main:1}
 ],
 compute(v){
  const n=M.list[v.m].n, R=v.D/1000/4, st=[], warn=[];
  const s=v.mode==="min"?Math.pow(v.vm*n/Math.pow(R,2/3),2):v.S/100;
  const vel=Math.pow(R,2/3)*Math.sqrt(s)/n, fall=s*v.L;
  if(v.mode==="min")st.push(ltr(`S = (${fmt(v.vm,2)} × ${n} ÷ ${fmt(R,4)}^(2/3))² = ${fmt(s,6)}`)+` = 1 : ${fmt(1/s,0)}`);
  st.push(ltr(`v = ${fmt(R,4)}^(2/3) × √${fmt(s,6)} ÷ ${n} = ${fmt(vel,3)}`)+" م/ث");
  st.push(ltr(`${fmt(s,6)} × ${fmt(v.L,2)} = ${fmt(fall,3)}`)+" م ⇒ "+ltr(`${fmt(v.IL,3)} − ${fmt(fall,3)} = ${fmt(v.IL-fall,3)}`));
  if(v.mode==="given"&&vel<M.vClean)warn.push(`السرعة ${fmt(vel,2)} م/ث أقلّ من سرعة التنظيف الذاتي ${M.vClean} م/ث: زِد الميل`);
  if(vel>3)warn.push("سرعةٌ عالية (> 3 م/ث): خطر النحر — قلّل الميل أو أضِف غرفة هدّار");
  return {out:{S:s*100,X:1/s,v:vel,fall,IL2:v.IL-fall},steps:st,warn};
 },
 cases:[
  {n:"uPVC 100 مم لسرعة 0.7 م/ث على 20 م",src:"حساب يدوي: R = 0.025 ؛ S = (0.7×0.009 ÷ 0.025^(2/3))² = 0.005430 = 1:184 ؛ الهبوط 0.1086 م",in:{mode:"min",D:100,m:"upvc",vm:0.7,L:20,IL:0},out:{S:0.542952,X:184.178,v:0.7,fall:0.108590,IL2:-0.108590},tol:1e-5},
  {n:"خرسانة 150 مم لسرعة 0.75 م/ث على 30 م من منسوب −1.2",src:"حساب يدوي: R = 0.0375 ؛ S = 0.007574 = 1:132 ؛ الهبوط 0.2272 ⇒ −1.4272 م",in:{mode:"min",D:150,m:"conc",vm:0.75,L:30,IL:-1.2},out:{S:0.757357,X:132.038,fall:0.227207,IL2:-1.42721},tol:1e-5},
  {n:"فخّار 200 مم بميل 1٪ على 40 م من −1.5",src:"حساب يدوي: R = 0.05 ؛ v = 0.05^(2/3) × 0.1 ÷ 0.013 = 1.044 م/ث ؛ الهبوط 0.40 ⇒ −1.90 م",in:{mode:"given",D:200,m:"clay",S:1,L:40,IL:-1.5},out:{S:1,X:100,v:1.04401,fall:0.4,IL2:-1.9},tol:1e-5}
 ]
};
