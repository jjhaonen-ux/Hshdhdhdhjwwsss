/* ═══ PDF الحاسبة ═══ المرحلة ٣-أ: ورقةُ A4 عمودية بالمدخلات والنتائج
   والخطوات والمرجع والتنبيه الإلزامي — بالكاتب الموحَّد io/pdf.js نفسه
   (لا كاتبَ ثانٍ). كما في io/boqpdf.js: البناءُ خالصٌ ويُختبَر في node،
   والكتابةُ وحدها تحتاج متصفّحاً (قناع النصّ العربي).
   المقياس: toPDF يقسم على S.meta.scale، فنضرب مسبقاً (بنفس حيلة boqpdf). */
import {S} from "../core/state.js";
import {toPDFz} from "../io/pdf.js";
import {inputRows,outputRows,DISCLAIMER,codeLine} from "./engine.js";

const PW=210, PH=297, MRG=18, L="A-SHET";
const tex=(x,y,h,al,s)=>({t:"text",L,x,y,h,al,s:String(s==null?"":s)});
const ln=(a,b)=>({t:"line",L,a,b});
/* لفّ نصٍّ طويلٍ بعدد أحرفٍ تقريبيّ يناسب عرض الصفحة */
function wrap(s,n=78){
 const out=[]; let cur="";
 String(s||"").split(/\s+/).forEach(w=>{
  if((cur+" "+w).trim().length>n){out.push(cur);cur=w} else cur=(cur+" "+w).trim();
 });
 if(cur)out.push(cur);
 return out;
}

/* بناءُ الأوّليّات — دالّةٌ خالصة */
export function calcPDFPrims(res){
 const d=res.def, P=[];
 let y=PH-MRG;
 P.push(tex(PW/2,y,5,"mc",d.title)); y-=7;
 P.push(ln([MRG,y],[PW-MRG,y])); y-=6;
 wrap(d.desc).forEach(s=>{P.push(tex(PW/2,y,3,"mc",s)); y-=5});
 y-=3;
 const row=(a,b,unit)=>{
  P.push(tex(PW-MRG,y,3.2,"mr",a));
  P.push(tex(MRG+4,y,3.2,"ml",unit?`${b} ${unit}`:b)); y-=5.5;
 };
 P.push(tex(PW-MRG,y,3.8,"mr","المدخلات")); y-=6;
 inputRows(res).forEach(r=>row(r.n,r.val,r.unit));
 y-=3;
 if(res.ok){
  P.push(tex(PW-MRG,y,3.8,"mr","النتائج")); y-=6;
  outputRows(res).forEach(r=>row(r.n,r.val,r.unit));
  y-=3;
  if(res.steps.length){
   P.push(tex(PW-MRG,y,3.8,"mr","الخطوات")); y-=6;
   res.steps.forEach(s=>wrap(s,88).forEach(t=>{P.push(tex(PW-MRG,y,2.8,"mr",t)); y-=4.5}));
   y-=3;
  }
  if(res.warn.length){
   P.push(tex(PW-MRG,y,3.8,"mr","تنبيهات")); y-=6;
   res.warn.forEach(w=>wrap(w,88).forEach(t=>{P.push(tex(PW-MRG,y,2.8,"mr",t)); y-=4.5}));
   y-=3;
  }
 }else{
  P.push(tex(PW-MRG,y,3.8,"mr","تعذّر الحساب")); y-=6;
  res.errs.forEach(e=>{P.push(tex(PW-MRG,y,3.2,"mr",e.m)); y-=5.5});
  y-=3;
 }
 /* المرجع والتنبيه في أسفل الصفحة لا بعد آخر سطر */
 const fy=MRG+18;
 P.push(ln([MRG,fy+12],[PW-MRG,fy+12]));
 P.push(tex(PW-MRG,fy+8,2.8,"mr","المرجع: "+d.ref));
 P.push(tex(PW-MRG,fy+4,2.8,"mr",codeLine()));
 P.push(tex(PW-MRG,fy,2.8,"mr",DISCLAIMER));
 const over=y<fy+14?Math.round(fy+14-y):0;
 const k=Math.max(1,+S.meta.scale||100);
 const prims=P.map(g=>g.t==="text"
  ? {...g,x:g.x*k,y:g.y*k,h:g.h*k}
  : {...g,a:[g.a[0]*k,g.a[1]*k],b:[g.b[0]*k,g.b[1]*k]});
 return {prims, box:{x0:0,y0:0,x1:PW*k,y1:PH*k}, page:{w:PW,h:PH}, over};
}

/* التنفيذ الفعليّ (متصفّح): يُعيد البايتات */
export async function calcPDF(res){
 const r=calcPDFPrims(res);
 const out=await toPDFz(r.prims,r.box,{pad:0,page:r.page,showWarn:false,
  info:{title:res.def.title,sheet:res.def.title}});
 return {bytes:out.bytes, over:r.over};
}
