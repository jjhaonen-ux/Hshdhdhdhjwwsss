/* محوّل الوحدات — طول · مساحة · حجم · قوة · ضغط · عزم · كتلة */
import {ltr} from "../../core/units.js";
import {KINDS,unitList,convert,unitName} from "../units.js";
import {fmt} from "../engine.js";
const Q=["len","area","vol","force","press","moment","mass"];
const DEF={len:["m","ft"],area:["m2","ft2"],vol:["m3","L"],force:["kN","tf"],
 press:["MPa","kgcm2"],moment:["kNm","tm"],mass:["kg","t"]};
export default {
 id:"units", group:"general", title:"محوّل الوحدات",
 desc:"يحوّل بين وحدات الطول والمساحة والحجم والقوة والضغط والعزم والكتلة — متري وبريطاني وعملي (كجم/سم² وطن/م²).",
 aliases:"units convert conversion وحدات تحويل حول محول متر قدم بوصه نيوتن طن psi",
 ref:"NIST SP 811 (2008) الملحق B · kgf = 9.80665 N تعريفاً",
 formula:["القيمة المحوَّلة = القيمة × معامل (من) ÷ معامل (إلى)","المعاملات إلى وحدة الأساس SI من NIST SP 811"],
 inputs:[
  {k:"q",n:"النوع",type:"sel",def:"len",opts:Q.map(v=>({v,n:KINDS[v].n}))},
  {k:"x",n:"القيمة",def:1,step:"any"},
  {k:"from",n:"من",type:"sel",opts:v=>unitList(v.q||"len"),def:"m",follow:v=>DEF[v.q||"len"][0]},
  {k:"to",n:"إلى",type:"sel",opts:v=>unitList(v.q||"len"),def:"ft",follow:v=>DEF[v.q||"len"][1]}
 ],
 outputs:[{k:"y",n:"النتيجة",dp:6,main:1,unit:v=>unitName(v.q,v.to)},
  {k:"f",n:"معامل التحويل",dp:8,unit:v=>`${unitName(v.q,v.to)} لكل 1 ${unitName(v.q,v.from)}`}],
 compute(v){
  const y=convert(v.x,v.q,v.from,v.to), f=convert(1,v.q,v.from,v.to);
  return {out:{y,f},steps:[`${ltr(fmt(v.x,6))} ${unitName(v.q,v.from)} ⇐ ${ltr(`${fmt(v.x,6)} × ${fmt(f,8)} = ${fmt(y,6)}`)} ${unitName(v.q,v.to)}`]};
 },
 cases:[
  {n:"قدمٌ واحد بالمتر",src:"NIST SP 811 · 1 ft = 0.3048 m (تعريفاً)",in:{q:"len",x:1,from:"ft",to:"m"},out:{y:0.3048},tol:1e-9},
  {n:"١ كجم/سم² بالميجاباسكال",src:"NIST SP 811 · 1 kgf/cm² = 98.0665 kPa",in:{q:"press",x:1,from:"kgcm2",to:"MPa"},out:{y:0.0980665},tol:1e-9},
  {n:"٣٠٠٠ psi بالميجاباسكال",src:"NIST SP 811 · 1 psi = 6.894757 kPa ⇒ 20.684 MPa",in:{q:"press",x:3000,from:"psi",to:"MPa"},out:{y:20.684272},tol:1e-6},
  {n:"١ طن·م بالكيلونيوتن·م",src:"NIST SP 811 · 1 tf·m = 9.80665 kN·m",in:{q:"moment",x:1,from:"tm",to:"kNm"},out:{y:9.80665},tol:1e-9}
 ]
};
