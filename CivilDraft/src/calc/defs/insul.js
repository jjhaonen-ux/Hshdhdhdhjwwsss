/* العزل (مائي بلفائف · حراري بألواح) — المرحلة ٣-ب */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
export default {
 id:"insul", group:"masonry", title:"العزل المائي والحراري",
 desc:"عدد لفائف العزل المائي مع التراكب والرفرفة على الجدران، أو عدد ألواح العزل الحراري ومقاومتها الحرارية R.",
 aliases:"insulation waterproofing membrane bitumen roll board xps eps عزل مائي حراري لفائف رولات ممبرين بيتومين ألواح فوم بوليسترين تراكب رفرفه",
 ref:"BS 8217:2005 (أغشية البيتومين المسلّحة للأسطح) · BS 8102:2022 (حماية الأقبية من الماء) · المقاومة الحرارية R = d/λ وفق BS EN ISO 6946:2017 · التراكب من نشرة المصنِّع",
 formula:["العزل المائي: المساحة الكلية = السطح + المحيط × ارتفاع الرفرفة",
  "المساحة الفعّالة للّفّة = (عرضها − التراكب الجانبي)(طولها − التراكب الطرفي)",
  "اللفائف = ⌈ المساحة الكلية × الطبقات × (1 + الهالك) ÷ الفعّالة ⌉",
  "الحراري: الألواح = ⌈ المساحة × الطبقات × (1 + الهالك) ÷ مساحة اللوح ⌉ ، R = الطبقات × d ÷ λ"],
 inputs:[
  {k:"mode",n:"النوع",type:"sel",def:"mem",opts:[{v:"mem",n:"عزل مائي (لفائف)"},{v:"board",n:"عزل حراري (ألواح)"}]},
  {k:"A",n:"مساحة السطح",kind:"area",unit:"m2",def:100,min:0},
  {k:"P",n:"المحيط (للرفرفة)",kind:"len",unit:"m",def:40,min:0,when:v=>v.mode==="mem"},
  {k:"up",n:"ارتفاع الرفرفة",kind:"len",unit:"m",def:0.3,min:0,max:2,when:v=>v.mode==="mem"},
  {k:"rw",n:"عرض اللفّة",kind:"len",unit:"m",def:1,min:0.2,when:v=>v.mode==="mem"},
  {k:"rl",n:"طول اللفّة",kind:"len",unit:"m",def:10,min:1,when:v=>v.mode==="mem"},
  {k:"sl",n:"التراكب الجانبي",kind:"len",unit:"mm",def:100,min:0,max:300,when:v=>v.mode==="mem"},
  {k:"el",n:"التراكب الطرفي",kind:"len",unit:"mm",def:150,min:0,max:300,when:v=>v.mode==="mem"},
  {k:"bw",n:"طول اللوح",kind:"len",unit:"mm",def:1200,min:100,when:v=>v.mode==="board"},
  {k:"bh",n:"عرض اللوح",kind:"len",unit:"mm",def:600,min:100,when:v=>v.mode==="board"},
  {k:"d",n:"سماكة اللوح",kind:"len",unit:"mm",def:50,min:5,max:300,when:v=>v.mode==="board"},
  {k:"lam",n:"الموصلية الحرارية λ (واط/م·ك)",def:0.034,min:0.015,max:0.2,step:0.001,when:v=>v.mode==="board"},
  {k:"ly",n:"عدد الطبقات",def:1,min:1,max:4,step:1},
  {k:"waste",n:"الهالك",kind:"pct",unit:"pct",def:5,min:0,max:30}
 ],
 outputs:[
  {k:"At",n:"المساحة الكلية",kind:"area",unit:"m2",dp:2},
  {k:"eff",n:"المساحة الفعّالة للّفّة",kind:"area",unit:"m2",dp:3,when:v=>v.mode==="mem"},
  {k:"rolls",n:"عدد اللفائف",dp:0,main:1,when:v=>v.mode==="mem"},
  {k:"boards",n:"عدد الألواح",dp:0,main:1,when:v=>v.mode==="board"},
  {k:"R",n:"المقاومة الحرارية R (م²·ك/واط)",dp:3,main:1,when:v=>v.mode==="board"}
 ],
 check(v){
  if(v.mode==="mem"&&(v.sl/1000>=v.rw||v.el/1000>=v.rl))return [{k:"sl",m:"التراكب أكبر من أبعاد اللفّة"}];
  return [];
 },
 compute(v){
  const ly=Math.round(v.ly), w=1+v.waste/100;
  if(v.mode==="mem"){
   const At=v.A+v.P*v.up, eff=(v.rw-v.sl/1000)*(v.rl-v.el/1000);
   const rolls=Math.ceil(At*ly*w/eff-1e-9);
   return {out:{At,eff,rolls},steps:[
    ltr(`${fmt(v.A,2)} + ${fmt(v.P,2)} × ${fmt(v.up,2)} = ${fmt(At,2)}`)+" م²",
    ltr(`(${fmt(v.rw,3)} − ${fmt(v.sl/1000,3)}) × (${fmt(v.rl,2)} − ${fmt(v.el/1000,3)}) = ${fmt(eff,4)}`)+" م²",
    ltr(`${fmt(At,2)} × ${ly} × ${fmt(w,2)} ÷ ${fmt(eff,4)} = ${fmt(At*ly*w/eff,2)} ⇒ ${rolls}`)],
    warn:["التراكب والرفرفة الدنيا من نشرة المصنِّع ومواصفة المشروع"]};
  }
  const ab=v.bw*v.bh/1e6, boards=Math.ceil(v.A*ly*w/ab-1e-9), R=ly*(v.d/1000)/v.lam;
  return {out:{At:v.A,boards,R},steps:[
   ltr(`${fmt(v.A,2)} × ${ly} × ${fmt(w,2)} ÷ ${fmt(ab,3)} = ${fmt(v.A*ly*w/ab,2)} ⇒ ${boards}`),
   ltr(`R = ${ly} × ${fmt(v.d/1000,3)} ÷ ${fmt(v.lam,3)} = ${fmt(R,3)}`)+" م²·ك/واط"],
   warn:["R للعازل وحده — قيمة U للعنصر كلّه تُحسب بطبقاته ومقاومات السطح (BS EN ISO 6946)"]};
 },
 cases:[
  {n:"سطح 100 م² ومحيط 40 م برفرفة 30 سم ولفائف 1 × 10 م",src:"حساب يدوي: 100 + 12 = 112 م² ، الفعّالة 0.9 × 9.85 = 8.865 م² ⇒ 12.63 ⇒ 13 لفّة",
   in:{mode:"mem",A:100,P:40,up:0.3,rw:1,rl:10,sl:100,el:150,waste:0},out:{At:112,eff:8.865,rolls:13},tol:1e-6},
  {n:"طبقتان على 50 م² بلا رفرفة",src:"حساب يدوي: 100 ÷ 8.865 = 11.28 ⇒ 12 لفّة",
   in:{mode:"mem",A:50,P:0,ly:2,waste:0},out:{rolls:12},tol:1e-9},
  {n:"ألواح XPS 1200×600×50 على 100 م² وهالك 5٪",src:"حساب يدوي: 105 ÷ 0.72 = 145.8 ⇒ 146 لوحاً ، R = 0.05 ÷ 0.034 = 1.471 م²·ك/واط",
   in:{mode:"board",A:100,bw:1200,bh:600,d:50,lam:0.034,waste:5},out:{boards:146,R:1.470588},tol:1e-5}
 ]
};
