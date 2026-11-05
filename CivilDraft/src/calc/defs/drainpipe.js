/* سعة ماسورة الصرف بالانحدار — المرحلة ٣-د · مانينغ لمقطعٍ دائريٍّ ممتلئٍ جزئياً */
import {ltr} from "../../core/units.js";
import {fmt,PI} from "../engine.js";
import {MANNING as M} from "../tables.js";
/* مقطعٌ دائريّ بقطر D (م) ونسبة امتلاء y = h/D: المساحة والمحيط المبلول */
export function circSeg(D,y){
 const th=2*Math.acos(1-2*y);
 return {A:D*D/8*(th-Math.sin(th)), P:D*th/2, th};
}
export const NOPTS=Object.entries(M.list).map(([v,o])=>({v,n:`${o.t} — n = ${o.n}`}));
export default {
 id:"drainpipe", group:"water", title:"سعة ماسورة الصرف",
 desc:"سعة ماسورة صرفٍ بالانحدار وسرعة الجريان عند نسبة امتلاء معلومة بمعادلة مانينغ، ونسبة استغلالها لتدفّقٍ تصميميّ، مع فحص سرعة التنظيف الذاتي.",
 aliases:"drain pipe capacity manning sewer gravity flow ماسوره صرف سعه مانينج انحدار مجاري امتلاء سرعه تنظيف ذاتي قطر الصرف",
 ref:M.ref,
 formula:["θ = 2 acos(1 − 2 h/D) ، A = D²(θ − sin θ) ÷ 8 ، P = D θ ÷ 2 ، R = A ÷ P","Q = (1 ÷ n) A R^(2/3) S^(1/2)","v = Q ÷ A ، الاستغلال = Q التصميمي ÷ Q السعة"],
 inputs:[
  {k:"D",n:"القطر الداخلي",kind:"len",unit:"mm",def:100,min:32,max:3000},
  {k:"S",n:"الميل",kind:"pct",unit:"pct",def:1,min:0.05,max:20},
  {k:"m",n:"مادّة الماسورة",type:"sel",def:"upvc",opts:NOPTS},
  {k:"y",n:"نسبة الامتلاء h/D",kind:"pct",unit:"pct",def:50,min:5,max:100,hint:"BS EN 12056-2: 50٪ للفروع و70٪ للخطوط"},
  {k:"Q",n:"التدفّق التصميمي (0 = تجاهل)",kind:"flow",unit:"Ls",def:2,min:0}
 ],
 outputs:[
  {k:"Qc",n:"السعة عند نسبة الامتلاء",kind:"flow",unit:"Ls",dp:2,main:1},
  {k:"v",n:"سرعة الجريان",kind:"vel",unit:"ms",dp:2,main:1},
  {k:"use",n:"نسبة الاستغلال",kind:"pct",unit:"pct",dp:1,when:v=>v.Q>0},
  {k:"Qf",n:"السعة ممتلئةً",kind:"flow",unit:"Ls",dp:2}
 ],
 compute(v){
  const d=v.D/1000, n=M.list[v.m].n, s=v.S/100, g=circSeg(d,v.y/100), R=g.A/g.P, st=[], warn=[];
  const Qc=g.A*Math.pow(R,2/3)*Math.sqrt(s)/n*1000, vel=Qc/1000/g.A;
  const Af=PI*d*d/4, Qf=Af*Math.pow(d/4,2/3)*Math.sqrt(s)/n*1000, o={Qc,v:vel,Qf};
  st.push(ltr(`θ = ${fmt(g.th,4)} ، A = ${fmt(g.A,6)} ، P = ${fmt(g.P,4)} ، R = ${fmt(R,5)}`));
  st.push(ltr(`Q = ${fmt(g.A,6)} × ${fmt(R,5)}^(2/3) × √${fmt(s,5)} ÷ ${n} = ${fmt(Qc,3)}`)+" لتر/ث ، "+ltr(`v = ${fmt(vel,3)}`)+" م/ث");
  if(v.Q>0){o.use=v.Q/Qc*100; if(o.use>100)warn.push(`التدفّق التصميمي يتجاوز السعة (${fmt(o.use,0)}٪): كبّر القطر أو زِد الميل`)}
  if(vel<M.vClean)warn.push(`السرعة ${fmt(vel,2)} م/ث أقلّ من سرعة التنظيف الذاتي ${M.vClean} م/ث`);
  return {out:o,steps:st,warn};
 },
 cases:[
  {n:"uPVC 100 مم بميل 1٪ نصف ممتلئة لتدفّق 2 لتر/ث",src:"حساب يدوي: A = 0.003927 ، R = D/4 = 0.025 ⇒ Q = 3.731 لتر/ث ، v = 0.950 م/ث ، الاستغلال 53.6٪ ، ممتلئة 7.461",in:{D:100,S:1,m:"upvc",y:50,Q:2},out:{Qc:3.73059,v:0.949987,use:53.6108,Qf:7.46118},tol:1e-5},
  {n:"خرسانة 150 مم بميل 0.5٪ وامتلاء 70٪",src:"حساب يدوي: θ = 3.9646 ، A = 0.013213 ، R = 0.04450 ⇒ Q = 9.016 لتر/ث ، v = 0.682 م/ث (< 0.7)",in:{D:150,S:0.5,m:"conc",y:70,Q:5},out:{Qc:9.01606,v:0.682380,use:55.4566,Qf:10.7688},tol:1e-5},
  {n:"200 مم بميل 2٪ ممتلئة",src:"حساب يدوي: A = 0.031416 ، R = 0.05 ⇒ Q = 46.384 لتر/ث = السعة ممتلئةً ، v = 1.476 م/ث",in:{D:200,S:2,m:"clay",y:100,Q:40},out:{Qc:46.3840,v:1.47645,Qf:46.3840,use:86.2366},tol:1e-5}
 ]
};
