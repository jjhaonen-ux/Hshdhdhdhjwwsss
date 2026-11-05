/* مقطع الكابل وهبوط الجهد — المرحلة ٣-د · BS 7671 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {CABLE as T} from "../tables.js";
export const SYS=[{v:"1",n:"أحادي الطور 230 V"},{v:"3",n:"ثلاثي الطور 400 V"}];
export const volts=s=>s==="3"?T.v3:T.v1;
/* تيار التصميم Ib (أمبير) من القدرة (kW) */
export const ibOf=(s,kW,pf)=>kW*1000/((s==="3"?Math.sqrt(3):1)*volts(s)*pf);
export const mcbFor=I=>T.mcb.find(x=>x>=I-1e-9);
export default {
 id:"cable", group:"mep", title:"مقطع الكابل وهبوط الجهد",
 desc:"تيار التصميم من القدرة، والقاطع القياسي، وأصغر مقطع كابلٍ يحقّق السعة بعد معاملات التصحيح وحدَّ هبوط الجهد (جدول BS 7671 4D5)، أو فحص كابلٍ معلوم من نشرة مصنّعه.",
 aliases:"cable size voltage drop current breaker mcb bs7671 كابل مقطع هبوط جهد تيار قاطع سلك اسلاك امبير ملي مربع",
 ref:T.ref,
 formula:["Ib = P ÷ (V cosφ) للأحادي ، Ib = P ÷ (√3 V cosφ) للثلاثي","In = أقرب قاطعٍ قياسيّ ≥ Ib ، والشرط Iz × Ca·Cg ≥ In","هبوط الجهد = (mV/A/m) × Ib × L ÷ 1000 (فولت) ، ونسبته من V"],
 inputs:[
  {k:"sys",n:"النظام",type:"sel",def:"1",opts:SYS},
  {k:"P",n:"القدرة",kind:"power",unit:"kW",def:3,min:0.01,max:5000},
  {k:"pf",n:"معامل القدرة cosφ",def:0.9,min:0.5,max:1,step:0.01},
  {k:"L",n:"طول الكابل (اتجاهٌ واحد)",kind:"len",unit:"m",def:25,min:0.5,max:2000},
  {k:"vd",n:"أقصى هبوط جهد",kind:"pct",unit:"pct",def:4,min:0.5,max:10,hint:"BS 7671: 3٪ للإنارة و5٪ لغيرها"},
  {k:"cf",n:"معاملات التصحيح Ca × Cg",def:1,min:0.3,max:1,step:0.01},
  {k:"tb",n:"الكابل",type:"sel",def:"te",opts:[{v:"te",n:"توأم وأرضي PVC — جدول 4D5 (طريقة C)"},{v:"man",n:"كابلٌ معلوم من نشرة المصنّع"}]},
  {k:"S",n:"المقطع",kind:"xsec",unit:"mm2c",def:6,min:0.5,max:1000,when:v=>v.tb==="man"},
  {k:"Iz",n:"سعة الكابل Iz",kind:"curr",unit:"A",def:47,min:1,when:v=>v.tb==="man"},
  {k:"mv",n:"هبوط الجهد (mV/A/m)",def:7.3,min:0.05,max:100,when:v=>v.tb==="man"}
 ],
 check(v){
  if(v.tb==="te"&&v.sys==="3")return [{k:"sys",m:"جدول 4D5 للتوأم والأرضي أحاديّ الطور: للثلاثي اختر «كابلٌ معلوم من نشرة المصنّع»"}];
  return [];
 },
 outputs:[
  {k:"Ib",n:"تيار التصميم Ib",kind:"curr",unit:"A",dp:2},
  {k:"In",n:"القاطع In",kind:"curr",unit:"A",dp:0,main:1},
  {k:"S",n:"مقطع الكابل",kind:"xsec",unit:"mm2c",dp:1,main:1},
  {k:"Iz",n:"سعة الكابل Iz",kind:"curr",unit:"A",dp:1},
  {k:"V",n:"هبوط الجهد",kind:"volt",unit:"V",dp:2},
  {k:"pc",n:"نسبة هبوط الجهد",kind:"pct",unit:"pct",dp:2,main:1}
 ],
 compute(v){
  const Vn=volts(v.sys), Ib=ibOf(v.sys,v.P,v.pf), In=mcbFor(Ib), st=[], warn=[];
  st.push(ltr(`Ib = ${fmt(v.P*1000,0)} ÷ (${v.sys==="3"?"√3 × ":""}${Vn} × ${v.pf}) = ${fmt(Ib,2)}`)+" A ⇒ "+ltr(`In = ${In}`)+" A");
  if(In==null)throw new Error(`تيارٌ ${fmt(Ib,0)} A فوق أكبر قاطعٍ في الجدول`);
  const drop=(mv)=>mv*Ib*v.L/1000;
  let S,Iz,mv;
  if(v.tb==="te"){
   const row=T.te.find(([s,iz,m])=>iz*v.cf>=In-1e-9&&drop(m)/Vn*100<=v.vd+1e-9);
   if(!row)throw new Error("لا مقطعَ حتى 16 مم² في جدول 4D5 يحقّق الشرطين: استعمل كابلاً آخر من نشرة المصنّع");
   [S,Iz,mv]=row;
   st.push(ltr(`${S} mm²: Iz × ${v.cf} = ${fmt(Iz*v.cf,1)} ≥ ${In}`)+" ، "+ltr(`ΔV = ${mv} × ${fmt(Ib,2)} × ${fmt(v.L,1)} ÷ 1000`));
  }else{
   S=v.S; Iz=v.Iz; mv=v.mv;
   if(Iz*v.cf<In-1e-9)warn.push(`سعة الكابل بعد التصحيح ${fmt(Iz*v.cf,1)} A أقلّ من القاطع ${In} A: كبّر المقطع`);
  }
  const V=drop(mv), pc=V/Vn*100;
  st.push(ltr(`ΔV = ${fmt(V,2)} V = ${fmt(pc,2)}%`));
  if(pc>v.vd+1e-9)warn.push(`هبوط الجهد ${fmt(pc,2)}٪ يتجاوز ${fmt(v.vd,1)}٪`);
  warn.push("تحقّق كذلك من حماية القصر ومعاوقة حلقة الخطأ Zs (BS 7671 الفصل 41)");
  return {out:{Ib,In,S,Iz,V,pc},steps:st,warn};
 },
 cases:[
  {n:"3 kW أحادي على 25 م وحدّ 4٪",src:"حساب يدوي: Ib = 3000 ÷ 207 = 14.49 A ⇒ 16 A ؛ 1.5 مم²: 29×14.49×25 = 10.51 V = 4.57٪ ✗ ؛ 2.5 مم²: 6.52 V = 2.84٪ ✓",in:{sys:"1",P:3,pf:0.9,L:25,vd:4,cf:1,tb:"te"},out:{Ib:14.4928,In:16,S:2.5,Iz:27,V:6.52174,pc:2.83554},tol:1e-5},
  {n:"سخّان 7.2 kW على 15 م وحدّ 5٪",src:"حساب يدوي: Ib = 7200 ÷ 230 = 31.30 A ⇒ 32 A ؛ 4 مم² (37 A): 11×31.30×15 = 5.165 V = 2.25٪",in:{sys:"1",P:7.2,pf:1,L:15,vd:5,cf:1,tb:"te"},out:{Ib:31.3043,In:32,S:4,Iz:37,V:5.16522,pc:2.24575},tol:1e-5},
  {n:"2 kW على 40 م وحدّ 3٪ ومعامل تصحيح 0.8",src:"حساب يدوي: Ib = 9.66 A ⇒ 10 A ؛ 2.5 مم²: 18×9.66×40 = 6.96 V = 3.02٪ ✗ ؛ 4 مم²: 4.251 V = 1.85٪ ✓",in:{sys:"1",P:2,pf:0.9,L:40,vd:3,cf:0.8,tb:"te"},out:{Ib:9.66184,In:10,S:4,V:4.25121,pc:1.84835},tol:1e-5}
 ]
};
