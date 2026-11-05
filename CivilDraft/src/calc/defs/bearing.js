/* قدرة التحمّل (ترزاكي / مايرهوف) — المرحلة ٣-ج · BS 8004 */
import {ltr} from "../../core/units.js";
import {fmt,interp,rad} from "../engine.js";
import {BEARING as T} from "../tables.js";
/* ═══ عوامل القدرة ═══ φ بالدرجات */
export function terzaghi(phi){
 if(phi<=0)return {Nc:T.terzNcZero,Nq:1,Ng:0};
 const f=rad(phi), a=Math.exp((0.75*Math.PI-f/2)*Math.tan(f));
 const Nq=a*a/(2*Math.pow(Math.cos(Math.PI/4+f/2),2));
 return {Nc:(Nq-1)/Math.tan(f),Nq,Ng:interp(T.terzNg,phi)};
}
export function meyerhof(phi){
 if(phi<=0)return {Nc:T.meyerNcZero,Nq:1,Ng:0,Kp:1};
 const f=rad(phi), Kp=Math.pow(Math.tan(Math.PI/4+f/2),2);
 const Nq=Math.exp(Math.PI*Math.tan(f))*Kp;
 return {Nc:(Nq-1)/Math.tan(f),Nq,Ng:(Nq-1)*Math.tan(1.4*f),Kp};
}
export default {
 id:"bearing", group:"soil", title:"قدرة تحمّل التربة",
 desc:"قدرة التحمّل النهائية والمسموحة (الصافية) لقاعدةٍ سطحية بمعادلة ترزاكي أو مايرهوف، لشريطية أو مربّعة أو مستطيلة أو دائرية، مع أثر منسوب الماء الجوفي ومعامل الأمان.",
 aliases:"bearing capacity terzaghi meyerhof footing allowable soil safe bearing قدره تحمل تربه ترزاكي مايرهوف قاعده مسموح ماء جوفي معامل امان",
 ref:T.ref,
 formula:["ترزاكي: qu = c·Nc·sc + q·Nq + ½·γ·B·Nγ·sγ (شريطية: sc = sγ = 1 ؛ مربّعة 1.3 و0.8 ؛ دائرية 1.3 و0.6)",
  "مايرهوف: qu = c·Nc·sc·dc + q·Nq·sq·dq + ½·γ·B·Nγ·sγ·dγ ، Kp = tan²(45 + φ/2)",
  "الصافية: qnet = qu − q ، والمسموحة الصافية qa = qnet ÷ FS ، والكلّية = qa + q (q = γ·Df)"],
 inputs:[
  {k:"me",n:"الطريقة",type:"sel",def:"terz",opts:[{v:"terz",n:"ترزاكي"},{v:"mey",n:"مايرهوف"}]},
  {k:"sh",n:"شكل القاعدة",type:"sel",def:"sq",opts:[{v:"strip",n:"شريطية"},{v:"sq",n:"مربّعة"},{v:"rect",n:"مستطيلة"},{v:"circ",n:"دائرية"}]},
  {k:"B",n:"العرض B (أو القطر)",kind:"len",unit:"m",def:2,min:0.3,max:20},
  {k:"L",n:"الطول L",kind:"len",unit:"m",def:3,min:0.3,max:50,when:v=>v.sh==="rect"},
  {k:"Df",n:"عمق التأسيس Df",kind:"len",unit:"m",def:1.5,min:0,max:10},
  {k:"c",n:"التماسك c",kind:"press",unit:"kPa",def:0,min:0,max:500},
  {k:"phi",n:"زاوية الاحتكاك φ",kind:"ang",unit:"deg",def:30,min:0,max:50},
  {k:"g",n:"وزن وحدة التربة γ",kind:"uw",unit:"kNm3",def:18,min:10,max:25},
  {k:"wt",n:"الماء الجوفي",type:"sel",def:"no",opts:[{v:"no",n:"لا يؤثّر"},{v:"yes",n:"موجود"}]},
  {k:"dw",n:"عمق الماء من سطح الأرض",kind:"len",unit:"m",def:3,min:0,max:30,when:v=>v.wt==="yes"},
  {k:"gs",n:"وزن وحدة التربة المشبعة γsat",kind:"uw",unit:"kNm3",def:20,min:12,max:25,when:v=>v.wt==="yes"},
  {k:"fs",n:"معامل الأمان FS",def:3,min:2,max:5,step:0.5}
 ],
 check(v){
  const e=[];
  if(v.sh==="rect"&&v.L<v.B)e.push({k:"L",m:"الطول L يجب ألّا يقلّ عن العرض B"});
  if(v.wt==="yes"&&v.gs<v.g)e.push({k:"gs",m:"وزن التربة المشبعة يجب ألّا يقلّ عن وزنها الرطب"});
  return e;
 },
 outputs:[
  {k:"Nc",n:"Nc",dp:2},{k:"Nq",n:"Nq",dp:2},{k:"Ng",n:"Nγ",dp:2},
  {k:"q",n:"إجهاد الردم عند القاعدة q",kind:"press",unit:"kPa",dp:1},
  {k:"qu",n:"قدرة التحمّل النهائية qu",kind:"press",unit:"kPa",dp:1,main:1},
  {k:"qnet",n:"النهائية الصافية qu − q",kind:"press",unit:"kPa",dp:1},
  {k:"qa",n:"المسموحة الصافية qa",kind:"press",unit:"kPa",dp:1,main:1},
  {k:"qg",n:"المسموحة الكلّية qa + q",kind:"press",unit:"kPa",dp:1}
 ],
 compute(v){
  const gw=T.gw, gp=v.g-gw, gs=v.wt==="yes"?v.gs:v.g, gpS=gs-gw, st=[], warn=[];
  /* إجهاد الردم q وγ الفعّال تحت القاعدة (Das) */
  let q=v.g*v.Df, ge=v.g;
  if(v.wt==="yes"){
   if(v.dw<=v.Df){q=v.g*v.dw+(gpS)*(v.Df-v.dw); ge=gpS}
   else if(v.dw<v.Df+v.B){ge=gpS+(v.dw-v.Df)/v.B*(v.g-gpS)}
  }
  const N=v.me==="terz"?terzaghi(v.phi):meyerhof(v.phi);
  const rect=v.sh==="rect"?v.B/v.L:(v.sh==="strip"?0:1), L=v.sh==="rect"?v.L:v.B;
  let qu;
  if(v.me==="terz"){
   const sc=v.sh==="strip"?1:(v.sh==="rect"?1+0.3*rect:1.3);
   const sg=v.sh==="strip"?1:(v.sh==="rect"?1-0.2*rect:(v.sh==="circ"?0.6:0.8));
   qu=v.c*N.Nc*sc+q*N.Nq+0.5*ge*v.B*N.Ng*sg;
   st.push(ltr(`Nc = ${fmt(N.Nc,2)} ، Nq = ${fmt(N.Nq,2)} ، Nγ = ${fmt(N.Ng,2)} ، sc = ${fmt(sc,2)} ، sγ = ${fmt(sg,2)}`));
  }else{
   const rB=v.sh==="strip"?0:rect, big=v.phi>10;
   const sc=1+0.2*N.Kp*rB, sq=big?1+0.1*N.Kp*rB:1, rt=Math.sqrt(N.Kp);
   const dc=1+0.2*rt*v.Df/v.B, dq=big?1+0.1*rt*v.Df/v.B:1;
   qu=v.c*N.Nc*sc*dc+q*N.Nq*sq*dq+0.5*ge*v.B*N.Ng*sq*dq;
   st.push(ltr(`Nc = ${fmt(N.Nc,2)} ، Nq = ${fmt(N.Nq,2)} ، Nγ = ${fmt(N.Ng,2)} ، Kp = ${fmt(N.Kp,3)}`));
   st.push(ltr(`sc = ${fmt(sc,3)} ، sq = sγ = ${fmt(sq,3)} ، dc = ${fmt(dc,3)} ، dq = dγ = ${fmt(dq,3)}`));
  }
  const qnet=qu-q, qa=qnet/v.fs, qg=qa+q;
  st.push(ltr(`q = ${fmt(q,2)} kPa ⇒ qu = ${fmt(qu,2)} kPa`));
  st.push(ltr(`qa = (${fmt(qu,2)} − ${fmt(q,2)}) ÷ ${fmt(v.fs,1)} = ${fmt(qa,2)}`)+" kPa");
  if(v.sh==="circ"&&v.me==="mey")warn.push("الدائرية بمايرهوف تُحسب كالمربّعة بقطرٍ مكافئ");
  if(v.Df>v.B)warn.push("Df > B: أساسٌ عميق — المعادلات للقواعد السطحية فقط");
  if(v.me==="terz"&&v.Df>v.B)warn.push("ترزاكي مصاغةٌ للقواعد السطحية Df ≤ B");
  if(v.phi===0&&v.c===0)warn.push("c = 0 و φ = 0: لا تماسك ولا احتكاك — تحقّق من تقرير التربة");
  warn.push("معامل الأمان 3 هو المعتاد للقدرة النهائية؛ ويُفحَص الهبوط بشكلٍ مستقلّ (حاسبة الهبوط)");
  warn.push("القيم من تقرير تربة معتمد فقط — لا تكفي قيمٌ مفترضة للتصميم");
  return {out:{Nc:N.Nc,Nq:N.Nq,Ng:N.Ng,q,qu,qnet,qa,qg},steps:st,warn};
 },
 cases:[
  {n:"ترزاكي: رمل φ = 30° وقاعدة شريطية B = 2 م و Df = 1 م",src:"عوامل ترزاكي المنشورة عند 30°: Nq = 22.5 و Nc = 37.2 و Nγ = 19.7 ؛ qu = 18×22.46 + ½×18×2×19.7 = 758.9 kPa",in:{me:"terz",sh:"strip",B:2,Df:1,c:0,phi:30,g:18,fs:3},out:{Nq:22.46,Nc:37.17,Ng:19.7,q:18,qu:758.9},tol:3e-3},
  {n:"مايرهوف: φ = 30° وقاعدة شريطية B = 2 م و Df = 1 م",src:"عوامل مايرهوف المنشورة عند 30°: Nq = 18.40 و Nc = 30.14 و Nγ = 15.67 ؛ dq = 1 + 0.1×√3×0.5 = 1.0866 ⇒ qu = 18×18.40×1.0866 + ½×18×2×15.67×1.0866 = 666.4 kPa",in:{me:"mey",sh:"strip",B:2,Df:1,c:0,phi:30,g:18,fs:3},out:{Nq:18.40,Nc:30.14,Ng:15.67,qu:666.4},tol:3e-3},
  {n:"ترزاكي: طين φ = 0 و c = 50 kPa وقاعدة مربّعة B = 2 م و Df = 1 م",src:"φ = 0: Nc = 5.7 و Nq = 1 و Nγ = 0 ⇒ qu = 1.3×50×5.7 + 18×1 = 388.5 kPa ⇒ qa = (388.5 − 18) ÷ 3 = 123.5 kPa",in:{me:"terz",sh:"sq",B:2,Df:1,c:50,phi:0,g:18,fs:3},out:{qu:388.5,qnet:370.5,qa:123.5,qg:141.5},tol:1e-9}
 ]
};
