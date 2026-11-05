/* حديد البلاطة: الأعداد والأطوال والوزن — المرحلة ٣-د (يُملأ من بلاطة المخطّط) */
import {ltr} from "../../core/units.js";
import {fmt,barArea} from "../engine.js";
import {DIAS} from "./rebarwt.js";
const RHO=7850;                          /* كجم/م³ كما في rebarwt */
export const wmOf=d=>RHO*barArea(d)*1e-6;
const DOPTS=DIAS.filter(d=>d<=25).map(d=>({v:String(d),n:`Ø${d} مم`}));
export default {
 id:"slabbar", group:"steel", title:"حديد البلاطة (كميات)",
 desc:"عدد الأسياخ وأطوالها ووزنها في الاتجاهين لبلاطةٍ مستطيلة من القطر والتباعد والغطاء، بطبقةٍ سفلية أو بطبقتين، ونسبة الحديد لكل م² ولكل م³ — وتُملأ أبعادها وسماكتها من البلاطة المحدَّدة على المخطّط.",
 aliases:"slab reinforcement rebar quantity bbs mesh حديد البلاطه تسليح البلاطه كميات حديد سقف اسياخ اتجاهين فرش غطاء",
 ref:"حساب كمّيات هندسيّ مباشر · كتلة المتر = 7850 × π d²/4 × 10⁻⁶ · الغطاء: BS 8110-1:1997 الجدول 3.3",
 formula:["أسياخ الاتجاه x (تمتدّ على Lx وتتوزّع على Ly): n = ⌊(Ly − 2c) ÷ s⌋ + 1 ، طول السيخ = Lx − 2c + 2 × الامتداد","ومثلها للاتجاه y بتبديل Lx وLy","الوزن = n × الطول × كتلة المتر × عدد الطبقات","أسياخ 12 م = ⌈الطول الكلّي ÷ 12⌉ لكل اتجاه (قبل الهالك والوصلات)"],
 inputs:[
  {k:"Lx",n:"البُعد Lx",kind:"len",unit:"m",def:5,min:0.3,max:100},
  {k:"Ly",n:"البُعد Ly",kind:"len",unit:"m",def:4,min:0.3,max:100},
  {k:"th",n:"سماكة البلاطة",kind:"len",unit:"mm",def:150,min:60,max:1200},
  {k:"c",n:"الغطاء عند الأطراف",kind:"len",unit:"mm",def:25,min:10,max:100},
  {k:"dx",n:"قطر حديد الاتجاه x",type:"sel",def:"10",opts:DOPTS},
  {k:"sx",n:"تباعد الاتجاه x",kind:"len",unit:"mm",def:150,min:50,max:500},
  {k:"dy",n:"قطر حديد الاتجاه y",type:"sel",def:"10",opts:DOPTS},
  {k:"sy",n:"تباعد الاتجاه y",kind:"len",unit:"mm",def:200,min:50,max:500},
  {k:"lay",n:"الطبقات",type:"sel",def:"1",opts:[{v:"1",n:"سفلية فقط"},{v:"2",n:"سفلية وعلوية بالتسليح نفسه"}]},
  {k:"ext",n:"امتداد كلّ طرف (رجل أو تثبيت)",kind:"len",unit:"mm",def:0,min:0,max:2000}
 ],
 outputs:[
  {k:"nx",n:"عدد أسياخ الاتجاه x (لكل طبقة)",dp:0},
  {k:"lx",n:"طول سيخ الاتجاه x",kind:"len",unit:"m",dp:3},
  {k:"ny",n:"عدد أسياخ الاتجاه y (لكل طبقة)",dp:0},
  {k:"ly",n:"طول سيخ الاتجاه y",kind:"len",unit:"m",dp:3},
  {k:"Wx",n:"وزن الاتجاه x",kind:"mass",unit:"kg",dp:2},
  {k:"Wy",n:"وزن الاتجاه y",kind:"mass",unit:"kg",dp:2},
  {k:"W",n:"الوزن الكلّي",kind:"mass",unit:"kg",dp:2,main:1},
  {k:"kgm2",n:"الحديد لكل م²",dp:2,u:"كجم/م²"},
  {k:"kgm3",n:"الحديد لكل م³ خرسانة",dp:1,u:"كجم/م³",main:1},
  {k:"n12",n:"أسياخ 12 م (نظرياً)",dp:0}
 ],
 check(v){
  const e=[];
  if(v.Lx*1000<=2*v.c)e.push({k:"Lx",m:"«البُعد Lx» أصغر من ضعف الغطاء"});
  if(v.Ly*1000<=2*v.c)e.push({k:"Ly",m:"«البُعد Ly» أصغر من ضعف الغطاء"});
  return e;
 },
 compute(v){
  const L=+v.lay, dx=+v.dx, dy=+v.dy, st=[], warn=[];
  const nx=Math.floor((v.Ly*1000-2*v.c)/v.sx+1e-9)+1, lx=(v.Lx*1000-2*v.c+2*v.ext)/1000;
  const ny=Math.floor((v.Lx*1000-2*v.c)/v.sy+1e-9)+1, ly=(v.Ly*1000-2*v.c+2*v.ext)/1000;
  const Tx=nx*lx*L, Ty=ny*ly*L, Wx=Tx*wmOf(dx), Wy=Ty*wmOf(dy), W=Wx+Wy, A=v.Lx*v.Ly;
  st.push(ltr(`x: ⌊(${fmt(v.Ly*1000,0)} − ${fmt(2*v.c,0)}) ÷ ${fmt(v.sx,0)}⌋ + 1 = ${nx} × ${fmt(lx,3)} م × ${L} = ${fmt(Tx,2)} م × ${fmt(wmOf(dx),4)} = ${fmt(Wx,2)}`)+" كجم");
  st.push(ltr(`y: ⌊(${fmt(v.Lx*1000,0)} − ${fmt(2*v.c,0)}) ÷ ${fmt(v.sy,0)}⌋ + 1 = ${ny} × ${fmt(ly,3)} م × ${L} = ${fmt(Ty,2)} م × ${fmt(wmOf(dy),4)} = ${fmt(Wy,2)}`)+" كجم");
  const kgm2=W/A, kgm3=W/(A*v.th/1000), n12=Math.ceil(Tx/12-1e-9)+Math.ceil(Ty/12-1e-9);
  st.push(ltr(`${fmt(W,2)} ÷ ${fmt(A,3)} = ${fmt(kgm2,2)}`)+" كجم/م² ، "+ltr(`÷ ${fmt(v.th/1000,3)} = ${fmt(kgm3,1)}`)+" كجم/م³");
  if(lx>12||ly>12)warn.push("سيخٌ أطول من 12 م: أضِف الوصلات (حاسبة التثبيت والوصلة) إلى الطول");
  warn.push("كمّياتٌ لا تصميم: القطر والتباعد من المصمّم الإنشائي (المرحلة ٤)، والكراسي والإضافات حول الفتحات غير محسوبة");
  return {out:{nx,lx,ny,ly,Wx,Wy,W,kgm2,kgm3,n12},steps:st,warn};
 },
 cases:[
  {n:"بلاطة 5×4 م: Ø10@150 و Ø10@200 سفلية",src:"حساب يدوي: x: ⌊3950÷150⌋+1 = 27 × 4.95 = 133.65 م ؛ y: ⌊4950÷200⌋+1 = 25 × 3.95 = 98.75 م ؛ Ø10 = 0.61654 كجم/م ⇒ 82.40 + 60.88 = 143.28 كجم",in:{Lx:5,Ly:4,th:150,c:25,dx:"10",sx:150,dy:"10",sy:200,lay:"1",ext:0},out:{nx:27,lx:4.95,ny:25,ly:3.95,Wx:82.4002,Wy:60.8831,W:143.283,kgm2:7.16417,kgm3:47.7611,n12:21},tol:1e-5},
  {n:"بلاطة 6×4.5 م بطبقتين: Ø12@150 و Ø10@200",src:"حساب يدوي: x: 30 × 5.94 × 2 = 356.4 م × 0.88779 = 316.42 ؛ y: 30 × 4.44 × 2 = 266.4 م × 0.61654 = 164.25 ⇒ 480.66 كجم = 89.01 كجم/م³",in:{Lx:6,Ly:4.5,th:200,c:30,dx:"12",sx:150,dy:"10",sy:200,lay:"2",ext:0},out:{nx:30,ny:30,W:480.663,kgm3:89.0116,n12:53},tol:1e-5},
  {n:"بلاطة 3.6×3 م Ø8@200 بامتداد 100 مم للطرف",src:"حساب يدوي: x: 15 × 3.76 = 56.4 م ؛ y: 18 × 3.16 = 56.88 م ؛ Ø8 = 0.39458 كجم/م ⇒ 22.25 + 22.44 = 44.70 كجم",in:{Lx:3.6,Ly:3,th:120,c:20,dx:"8",sx:200,dy:"8",sy:200,lay:"1",ext:100},out:{nx:15,lx:3.76,ny:18,ly:3.16,W:44.6985,kgm2:4.13875,n12:10},tol:1e-5}
 ]
};
