/* طول التثبيت والوصلة — BS 8110-1:1997 البند 3.12.8 (v2.8.0: كان ACI 318-19) */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {BS8110 as T} from "../tables.js";
import {DIAS} from "./rebarwt.js";
const BARS=Object.entries(T.beta).map(([v,o])=>({v,n:`${o.n} (β شدّ ${o.t} · ضغط ${o.c})`}));
export default {
 id:"lapdev", group:"steel", title:"طول التثبيت والوصلة",
 desc:"طول التثبيت في الشدّ والضغط وطول الوصلة بالتراكب لحديد التسليح وفق BS 8110-1 (البند 3.12.8 والجدولان 3.26 و3.27)، بإجهاد الحديد التصميمي الكامل 0.87 fy.",
 aliases:"development length anchorage lap splice bs8110 bs 8110 طول التثبيت طول الوصله وصله تراكب رباط تشريك اوفرلاب 40d 40φ تماسك bond",
 ref:T.ref,
 formula:["fbu = β √fcu (الجدول 3.26) ، و fcu ≤ 40 N/mm² في التماسك (الجدول 3.27)",
  "fs = fy ÷ γm = fy ÷ 1.15 ≈ 0.87 fy",
  "طول التثبيت: l = fs φ ÷ (4 fbu) (المعادلة 48، البند 3.12.8.4)",
  "وصلة الشدّ = المعامل × l ، والمعامل 1.0 أو 1.4 أو 2.0 (البند 3.12.8.13)",
  "وصلة الضغط = 1.25 × طول تثبيت الضغط (البند 3.12.8.15)",
  "كلُّ وصلة ≥ 15φ و ≥ 300 مم (البند 3.12.8.4)"],
 inputs:[
  {k:"d",n:"قطر السيخ φ",type:"sel",def:"16",opts:DIAS.map(d=>({v:String(d),n:`Ø${d} مم`}))},
  {k:"fcu",n:"رتبة الخرسانة fcu (مكعّب)",kind:"press",unit:"MPa",def:30,min:20,max:60},
  {k:"fy",n:"إجهاد خضوع الحديد fy",type:"sel",def:"460",opts:T.fy.map(f=>({v:String(f),n:`${f} N/mm²${f===250?" (طريّ)":" (عالي المقاومة)"}`}))},
  {k:"bar",n:"نوع السيخ",type:"sel",def:"type2",opts:BARS},
  {k:"pos",n:"موضع الوصلة",type:"sel",def:"std",opts:[
   {v:"std",n:"الحالة العامة (× 1.0)"},
   {v:"k14",n:"أعلى المقطع وغطاء < 2φ ، أو ركن بغطاء < 2φ ، أو تباعد صافٍ < 75 مم أو 6φ (× 1.4)"},
   {v:"k20",n:"اجتماع الحالتين: أعلى/ركن بغطاء < 2φ مع تباعد صافٍ < 75 مم أو 6φ (× 2.0)"}]}
 ],
 outputs:[
  {k:"ld",n:"طول التثبيت في الشدّ",kind:"len",unit:"mm",dp:0,main:1},
  {k:"ldb",n:"طول التثبيت بمضاعفات القطر",u:"φ",dp:1},
  {k:"lap",n:"طول وصلة الشدّ",kind:"len",unit:"mm",dp:0,main:1},
  {k:"lapd",n:"وصلة الشدّ بمضاعفات القطر",u:"φ",dp:1},
  {k:"ldc",n:"طول التثبيت في الضغط",kind:"len",unit:"mm",dp:0},
  {k:"lapc",n:"طول وصلة الضغط",kind:"len",unit:"mm",dp:0}
 ],
 compute(v){
  const db=+v.d, fy=+v.fy, B=T.beta[v.bar], K=T.lapK[v.pos], st=[], warn=[];
  let fcu=v.fcu;
  if(fcu>T.fcuMaxBond){fcu=T.fcuMaxBond; warn.push("fcu أُخذت 40 N/mm² في حساب التماسك (الجدول 3.27: «40 فأكثر»)")}
  const rf=Math.sqrt(fcu), fbt=B.t*rf, fbc=B.c*rf, fs=fy/T.gm.s;
  st.push(ltr(`fbu (شدّ) = ${B.t} × √${fmt(fcu,1)} = ${fmt(fbt,3)} N/mm² ، fbu (ضغط) = ${B.c} × √${fmt(fcu,1)} = ${fmt(fbc,3)} N/mm²`));
  st.push(ltr(`fs = ${fy} ÷ ${T.gm.s} = ${fmt(fs,1)} N/mm²`));
  const ld=fs*db/(4*fbt), ldc=fs*db/(4*fbc);
  st.push(ltr(`l = ${fmt(fs,1)} × ${db} ÷ (4 × ${fmt(fbt,3)}) = ${fmt(ld,1)}`)+` مم (${ltr(fmt(ld/db,1))}φ)`);
  const mn=Math.max(T.lapMinD*db,T.lapMin);
  let lap=K*ld;
  st.push(ltr(`وصلة الشدّ = ${K} × ${fmt(ld,1)} = ${fmt(lap,1)}`)+" مم");
  if(lap<mn){lap=mn; st.push(`الحدّ الأدنى ${ltr(`max(15φ , 300) = ${fmt(mn,0)}`)} مم يحكم`)}
  let lapc=T.compLap*ldc;
  st.push(ltr(`وصلة الضغط = 1.25 × ${fmt(ldc,1)} = ${fmt(lapc,1)}`)+" مم");
  if(lapc<mn)lapc=mn;
  if(v.bar==="plain")warn.push("الأسياخ الملساء في الشدّ تُنهى عادةً بخطّاف أو ثنية (البند 3.12.8.7)");
  if(v.bar==="fabric")warn.push("وصلات الشبك الملحوم لها قواعدُ إضافية بعدد الأسلاك العرضية (البند 3.12.8.5)");
  if(fy===250&&v.bar!=="plain")warn.push("fy = 250 يخصّ الحديد الطريّ الأملس عادةً — راجع نوع السيخ");
  if(db>40)warn.push("الأقطار فوق 40 مم: لا تُوصل بالتراكب إلا بموافقة المهندس (البند 3.12.8.9)");
  return {out:{ld,ldb:ld/db,lap,lapd:lap/db,ldc,lapc},steps:st,warn};
 },
 cases:[
  {n:"Ø16 مشرشر نوع 2 · fy 460 · C25",src:"BS 8110-1 الجدول 3.27 (fcu 25): تثبيت ووصلة الشدّ 40φ ، تثبيت الضغط 32φ ، وصلة الضغط 40φ",
   in:{d:"16",fcu:25,fy:"460",bar:"type2"},out:{ldb:40,lapd:40,ld:640,ldc:512,lapc:640},tol:0.02},
  {n:"Ø20 مشرشر نوع 2 · fy 460 · C30 · وصلة × 1.4",src:"BS 8110-1 الجدول 3.27 (fcu 30): التثبيت 37φ والوصلة × 1.4 = 52φ",
   in:{d:"20",fcu:30,fy:"460",bar:"type2",pos:"k14"},out:{ldb:37,lapd:52},tol:0.02},
  {n:"Ø25 مشرشر نوع 2 · fy 460 · C40 · وصلة × 2.0",src:"BS 8110-1 الجدول 3.27 (fcu 40 فأكثر): التثبيت 32φ والوصلة × 2.0 = 64φ",
   in:{d:"25",fcu:40,fy:"460",bar:"type2",pos:"k20"},out:{ldb:32,lapd:64},tol:0.02},
  {n:"Ø12 أملس · fy 250 · C25",src:"BS 8110-1 الجدول 3.27 (أسياخ ملساء، fcu 25): التثبيت والوصلة 39φ",
   in:{d:"12",fcu:25,fy:"250",bar:"plain"},out:{ldb:39},tol:0.02}
 ]
};
