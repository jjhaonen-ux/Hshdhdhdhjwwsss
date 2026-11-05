/* ضغط التربة الجانبي (رانكين) — المرحلة ٣-ج · BS 8002 / BS 8110 */
import {ltr} from "../../core/units.js";
import {fmt,rad} from "../engine.js";
import {BS8110_GF as F} from "../tables.js";
export const kOf=(phi,st)=>{
 const s=Math.sin(rad(phi));
 return st==="a"?(1-s)/(1+s):(st==="p"?(1+s)/(1-s):1-s);
};
export default {
 id:"earthp", group:"soil", title:"ضغط التربة الجانبي",
 desc:"الضغط الجانبي لتربةٍ حبيبية على جدارٍ رأسي أملس بأرضٍ أفقية: معاملات رانكين النشط والسلبي والسكوني، والقوة المحصّلة لكل متر طول ونقطة تأثيرها مع حمل سطحي، وقوة التصميم النهائية.",
 aliases:"earth pressure rankine active passive at rest retaining wall lateral ka kp k0 ضغط تربه جانبي رانكين نشط سلبي سكوني جدار استناد ساند حائط",
 ref:"Rankine (1857) · Jaky (1944) للسكوني · BS 8002:2015 (جدران الاستناد) · "+F.ref,
 formula:["Ka = (1 − sinφ) ÷ (1 + sinφ) ، Kp = 1 ÷ Ka ، K0 = 1 − sinφ",
  "الإجهاد عند القاعدة σ = K·γ·H + K·q",
  "المحصّلة P = ½·K·γ·H² + K·q·H لكل متر طول",
  "نقطة التأثير فوق القاعدة y = (½Kγ H²·H÷3 + K q H·H÷2) ÷ P ، وPu = 1.4 P"],
 inputs:[
  {k:"st",n:"الحالة",type:"sel",def:"a",opts:[{v:"a",n:"نشط (الجدار يتحرّك مبتعداً)"},{v:"o",n:"سكوني (جدارٌ ثابت: قبو)"},{v:"p",n:"سلبي (مقاومة التربة)"}]},
  {k:"H",n:"ارتفاع الجدار H",kind:"len",unit:"m",def:3,min:0.3,max:15},
  {k:"phi",n:"زاوية الاحتكاك φ",kind:"ang",unit:"deg",def:30,min:20,max:45},
  {k:"g",n:"وزن وحدة التربة γ",kind:"uw",unit:"kNm3",def:18,min:10,max:25},
  {k:"q",n:"الحمل السطحي q",kind:"press",unit:"kPa",def:0,min:0,max:200}
 ],
 outputs:[
  {k:"Ka",n:"Ka (النشط)",dp:3},{k:"K0",n:"K0 (السكوني)",dp:3},{k:"Kp",n:"Kp (السلبي)",dp:3},
  {k:"sb",n:"الإجهاد الجانبي عند القاعدة",kind:"press",unit:"kPa",dp:2},
  {k:"P",n:"المحصّلة لكل متر طول",kind:"lload",unit:"kNm",dp:2,main:1},
  {k:"y",n:"نقطة التأثير فوق القاعدة",kind:"len",unit:"m",dp:3,main:1},
  {k:"Pu",n:"قوة التصميم النهائية 1.4 P",kind:"lload",unit:"kNm",dp:2,main:1,when:v=>v.st!=="p"}
 ],
 compute(v){
  const K=kOf(v.phi,v.st), a=0.5*K*v.g*v.H*v.H, b=K*v.q*v.H, P=a+b;
  const y=(a*v.H/3+b*v.H/2)/P, st=[], warn=[];
  st.push(ltr(`K = ${fmt(K,4)} ⇒ σ = ${fmt(K,4)} × ${fmt(v.g,1)} × ${fmt(v.H,2)} + ${fmt(K,4)} × ${fmt(v.q,1)} = ${fmt(K*v.g*v.H+K*v.q,2)}`)+" kPa");
  st.push(ltr(`P = ½ × ${fmt(K,4)} × ${fmt(v.g,1)} × ${fmt(v.H,2)}² + ${fmt(K,4)} × ${fmt(v.q,1)} × ${fmt(v.H,2)} = ${fmt(P,3)}`)+" kN/م ، "+ltr(`y = ${fmt(y,3)}`)+" م");
  const o={Ka:kOf(v.phi,"a"),K0:kOf(v.phi,"o"),Kp:kOf(v.phi,"p"),sb:K*v.g*v.H+K*v.q,P,y};
  if(v.st!=="p"){o.Pu=F.earth*P; st.push(ltr(`Pu = ${F.earth} × ${fmt(P,3)} = ${fmt(o.Pu,3)}`)+" kN/م")}
  else warn.push("المقاومة السلبية لا تُعتمد كاملةً في التصميم (تُخفَّض أو تُهمَل في الطبقة العليا) — راجع BS 8002");
  warn.push("تربةٌ حبيبية (c = 0) وسطحٌ أفقي وجدارٌ أملس رأسي؛ لا ماء جوفي — يلزم تصريفٌ خلف الجدار وإلا زاد الضغط كثيراً");
  warn.push("قيمة φ من تقرير تربة معتمد؛ الجدار الذي يتحرّك قليلاً فقط يبلغ الحالة النشطة");
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"نشط: φ = 30° و γ = 18 و H = 3 م بلا حمل سطحي",src:"حساب يدوي: Ka = 1/3 ⇒ P = ½×(1/3)×18×9 = 27 kN/م ؛ y = H/3 = 1 م ؛ Pu = 37.8 ؛ σ = 18 kPa",in:{st:"a",H:3,phi:30,g:18,q:0},out:{Ka:1/3,K0:0.5,Kp:3,sb:18,P:27,y:1,Pu:37.8},tol:1e-9},
  {n:"نشط مع حمل سطحي 10 kPa",src:"حساب يدوي: 27 + (1/3)×10×3 = 37 kN/م ؛ y = (27×1 + 10×1.5) ÷ 37 = 1.1351 م ؛ σ عند القاعدة = 18 + (1/3)×10 = 21.333 kPa",in:{st:"a",H:3,phi:30,g:18,q:10},out:{P:37,y:42/37,sb:64/3},tol:1e-9},
  {n:"سكوني: φ = 30° (قبو) و H = 3 م",src:"حساب يدوي (Jaky): K0 = 1 − 0.5 = 0.5 ⇒ P = ½×0.5×18×9 = 40.5 kN/م ؛ y = 1 م",in:{st:"o",H:3,phi:30,g:18,q:0},out:{P:40.5,y:1,Pu:56.7},tol:1e-9}
 ]
};
