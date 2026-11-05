/* ═══ محرّك الحاسبات ═══ المرحلة ٣-أ من خطّة التطوير
   «ملفُّ تعريفٍ صغيرٌ لكلّ حاسبة: مدخلاتٌ بوحدات + معادلات + مرجع + نتيجة».
   المحرّكُ خالصٌ (لا DOM ولا حالةَ مشروع): يقرأ التعريف، يحوّل المدخلات
   إلى وحدات التعريف، يتحقّق من الحدود، ثم يستدعي compute ويُعيد نتيجةً
   مفسَّرة. الواجهةُ (ui/calcPanel.js) والـPDF (calc/pdf.js) والدليلُ
   والبحثُ يقرؤون التعريفَ نفسَه — فحاسبةٌ جديدة لا تمسّ أيّاً منها.

   «يخبر ولا يقرّر»: كلُّ نتيجةٍ تحمل المعادلةَ والخطواتِ بالأرقام والمرجع،
   والتنبيهَ الإلزاميّ (DISCLAIMER) — لا قرارَ بدل المهندس.

   ═══ شكل التعريف ═══
   { id, group, title, desc, aliases?, ref, formula:[سطر…], inputs:[In…],
     outputs:[Out…], compute(v)→{out:{k:رقم}, steps?:[…], warn?:[…]},
     check?(v)→[خطأ…], cases:[{n, src, in:{…}, out:{…}, tol?}] (٣ على الأقل) }
   In  = {k, n, kind?, unit?, def, min?, max?, step?, type?:"num"|"sel",
          opts?:[{v,n}] | (v)=>[{v,n}], when?:(v)=>bool, hint?}
   Out = {k, n, kind?, unit?, dp?, when?:(v,out)=>bool, main?:1}
   ‏min/max بوحدة التعريف (unit). القيمةُ تدخل compute بوحدة التعريف
   مهما اختار المستخدمُ من وحدةٍ في الواجهة. */
import {kindOf,hasUnit,convert,unitName} from "./units.js";
import {CODE} from "./tables.js";

export const DISCLAIMER="النتيجة إرشادية وتتطلّب مراجعة واعتماد مهندس مرخّص.";
export const GROUPS=Object.freeze([
 {id:"general",n:"عامة",ico:"📐"},
 {id:"concrete",n:"الخرسانة",ico:"🧱"},
 {id:"steel",n:"الحديد",ico:"🔩"},
 /* المرحلة ٣-ب (v2.8.0) */
 {id:"masonry",n:"المباني والتشطيبات",ico:"🏗"},
 {id:"earth",n:"الحفر والردم",ico:"🚜"},
 /* المرحلة ٣-ج (v2.9.0) */
 {id:"loads",n:"الأحمال",ico:"⚖️"},
 {id:"soil",n:"التربة والأساسات",ico:"🌍"},
 /* المرحلة ٣-د (v2.10.0) */
 {id:"water",n:"المياه والصرف",ico:"🚰"},
 {id:"mep",n:"الكهرباء والميكانيكا",ico:"⚡"},
 {id:"stairs",n:"الدرج والمنحدرات",ico:"🪜"}
]);
/* الكودُ المعتمد في المشروع (v2.8.0): BS 8110 — يُطبَع مع كلّ نتيجة */
export const codeLine=()=>`الكود المعتمد: ${CODE.n} (${CODE.full})`;
export const groupName=id=>(GROUPS.find(g=>g.id===id)||{n:id}).n;

const REG=new Map();
export const calcList=()=>[...REG.values()];
export const calcById=id=>REG.get(String(id||""))||null;

/* ═══ تطبيعُ الأرقام ═══ أرقامٌ هندية/فارسية، وفاصلةٌ عربية (٫) أو لاتينية
   عشريّة، وفاصلُ آلافٍ عربيّ (٬). «1,5» تُقرأ ١٫٥ كما يكتبها كثيرون. */
export function parseNum(s){
 if(typeof s==="number")return s;
 let t=String(s==null?"":s).trim();
 if(!t)return NaN;
 t=t.replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))
  .replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d))
  .replace(/٬/g,"").replace(/٫/g,".").replace(/\s+/g,"");
 /* «1,234,567» فواصلُ آلاف (مجموعتان فأكثر من ثلاث خانات)، و«1,5» عشريّة */
 if(/^[-+]?\d{1,3}(,\d{3}){2,}(\.\d+)?$/.test(t))t=t.replace(/,/g,"");
 else if(/^[-+]?\d+,\d+$/.test(t))t=t.replace(",",".");
 if(!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t))return NaN;
 return Number(t);
}
/* تنسيقٌ بعددِ منازلَ ثابت، بلا أصفارٍ ذيليّة، وبأرقامٍ لاتينية
   (الأرقام في المخطّطات والتقارير لاتينيةٌ في المشروع كلّه) */
export function fmt(x,dp=3){
 if(typeof x!=="number")return String(x==null?"":x);
 if(!isFinite(x))return "—";
 const a=Math.abs(x);
 let d=dp;
 if(a>=1e6)d=Math.min(dp,0);
 const s=x.toFixed(Math.max(0,d));
 const r=s.indexOf(".")>=0?s.replace(/\.?0+$/,""):s;
 return r==="-0"?"0":r;             /* −0.0001 بثلاث منازل ⇒ 0 لا «-0» */
}

/* ═══ التحقّق من التعريف ═══ يخبر ولا يصلح — بروح validate.js */
export function validateDef(d){
 const e=[], w=(d&&d.id)||"?";
 if(!d||typeof d!=="object")return ["تعريفٌ ليس كائناً"];
 if(!/^[a-z][a-z0-9]{1,23}$/.test(String(d.id||"")))e.push(`${w}: id غير صالح`);
 if(!GROUPS.some(g=>g.id===d.group))e.push(`${w}: group غير معروف («${d.group}»)`);
 ["title","desc","ref"].forEach(k=>{if(typeof d[k]!=="string"||!d[k].trim())e.push(`${w}: ${k} فارغ`)});
 if(!Array.isArray(d.formula)||!d.formula.length)e.push(`${w}: formula فارغة`);
 if(typeof d.compute!=="function")e.push(`${w}: compute ليست دالّة`);
 const ks=new Set();
 (d.inputs||[]).forEach((i,n)=>{
  if(!i||!i.k)return e.push(`${w}.inputs[${n}]: بلا k`);
  if(ks.has(i.k))e.push(`${w}: مفتاحٌ مكرَّر «${i.k}»`); ks.add(i.k);
  if(!i.n)e.push(`${w}.${i.k}: بلا اسم`);
  if(i.type==="sel"){
   if(!i.opts)e.push(`${w}.${i.k}: قائمةٌ بلا opts`);
  }else{
   if(i.kind&&!hasUnit(i.kind,i.unit))e.push(`${w}.${i.k}: وحدة «${i.unit}» ليست من «${i.kind}»`);
   if(typeof i.def!=="number"||!isFinite(i.def))e.push(`${w}.${i.k}: def ليس رقماً`);
  }
 });
 if(!Array.isArray(d.inputs)||!d.inputs.length)e.push(`${w}: لا مدخلات`);
 if(!Array.isArray(d.outputs)||!d.outputs.length)e.push(`${w}: لا مخرجات`);
 (d.outputs||[]).forEach(o=>{
  if(!o||!o.k||!o.n)e.push(`${w}: مخرجٌ بلا k أو اسم`);
  else if(o.kind&&!hasUnit(o.kind,o.unit))e.push(`${w}.${o.k}: وحدة المخرج «${o.unit}» ليست من «${o.kind}»`);
 });
 if(!Array.isArray(d.cases)||d.cases.length<3)e.push(`${w}: أقلّ من ٣ حالات مرجعية`);
 (d.cases||[]).forEach((c,n)=>{
  if(!c||!c.src||!c.in||!c.out)e.push(`${w}.cases[${n}]: ناقصة (src/in/out)`);
 });
 return e;
}
/* التسجيل: تعريفٌ معطوبٌ يُرفض صراحةً لا يُسجَّل نصفه */
export function defCalc(d){
 const e=validateDef(d);
 if(e.length)throw new Error("تعريف حاسبة معطوب: "+e.join(" · "));
 if(REG.has(d.id))throw new Error(`حاسبةٌ مكرَّرة: ${d.id}`);
 REG.set(d.id,Object.freeze(d));
 return d;
}

/* خياراتُ قائمةٍ قد تتبع مدخلاً آخر (محوّل الوحدات: الوحدات تتبع النوع) */
export const optsOf=(inp,v)=>typeof inp.opts==="function"?(inp.opts(v||{})||[]):(inp.opts||[]);
export const visible=(inp,v)=>!inp.when||!!inp.when(v||{});

/* قيمةُ قائمةٍ صالحة: الحاليةُ إن كانت من خياراتها، وإلا ما يقترحه follow
   (محوّل الوحدات: «من/إلى» تتبع النوع) ثم أوّلُ خيار */
export function fixSel(i,v){
 const o=optsOf(i,v);
 if(!o.length||o.some(x=>String(x.v)===String(v[i.k])))return v[i.k];
 const f=i.follow?i.follow(v):null;
 return o.some(x=>x.v===f)?f:o[0].v;
}
/* ═══ القيم الافتراضية ═══ */
export function defaults(d){
 const v={};
 d.inputs.forEach(i=>{v[i.k]=i.type==="sel"?(i.def!=null?i.def:(optsOf(i,v)[0]||{}).v):i.def});
 /* قوائمُ تابعة: ما ليس من خياراتها يرجع إلى أوّلها */
 d.inputs.forEach(i=>{if(i.type==="sel")v[i.k]=fixSel(i,v)});
 return v;
}

/* ═══ التشغيل ═══
   raw: {k: قيمة} — نصٌّ أو رقم، بوحدة التعريف ما لم تُذكَر وحدةٌ أخرى في
   units: {k: رمز الوحدة}. يُعيد:
   {ok, v (بوحدة التعريف), out, steps, warn, errs:[{k,m}], def} */
export function runCalc(d,raw,units){
 const def=typeof d==="string"?calcById(d):d;
 if(!def)return {ok:false,errs:[{k:"",m:"حاسبةٌ غير معروفة"}],warn:[],steps:[],out:{},v:{}};
 const R=raw||{}, UN=units||{};
 const v=defaults(def), errs=[];
 /* القوائمُ أوّلاً — لأن ظهورَ الحقول الرقمية قد يتبعها */
 def.inputs.filter(i=>i.type==="sel").forEach(i=>{
  if(R[i.k]!=null)v[i.k]=R[i.k];
 });
 /* ما لم يُعطَ صراحةً يتبع ما أُعطي (النوعُ تغيّر ⇒ وحدتاه تتبعانه) */
 def.inputs.filter(i=>i.type==="sel"&&R[i.k]==null).forEach(i=>{v[i.k]=fixSel(i,v)});
 def.inputs.filter(i=>i.type==="sel").forEach(i=>{
  const o=optsOf(i,v);
  if(!o.some(x=>String(x.v)===String(v[i.k])))errs.push({k:i.k,m:`«${i.n}»: اختيارٌ غير معروف`});
  else v[i.k]=o.find(x=>String(x.v)===String(v[i.k])).v;
 });
 def.inputs.filter(i=>i.type!=="sel").forEach(i=>{
  if(!visible(i,v))return;
  let x=R[i.k]!=null?parseNum(R[i.k]):i.def;
  if(!isFinite(x)){errs.push({k:i.k,m:`«${i.n}»: اكتب رقماً`});return}
  const u=UN[i.k];
  if(u&&i.kind&&u!==i.unit){
   if(!hasUnit(i.kind,u)){errs.push({k:i.k,m:`«${i.n}»: وحدةٌ غير معروفة`});return}
   x=convert(x,i.kind,u,i.unit);
  }
  const un=i.kind?" "+unitName(i.kind,i.unit):"";
  if(i.min!=null&&x<i.min)errs.push({k:i.k,m:`«${i.n}» يجب ألّا يقلّ عن ${fmt(i.min,4)}${un}`});
  else if(i.max!=null&&x>i.max)errs.push({k:i.k,m:`«${i.n}» يجب ألّا يزيد عن ${fmt(i.max,4)}${un}`});
  v[i.k]=x;
 });
 if(!errs.length&&def.check){
  (def.check(v)||[]).forEach(m=>errs.push(typeof m==="string"?{k:"",m}:m));
 }
 if(errs.length)return {ok:false,def,v,errs,warn:[],steps:[],out:{}};
 let r;
 try{r=def.compute(v)||{}}
 catch(e){return {ok:false,def,v,errs:[{k:"",m:(e&&e.message)||String(e)}],warn:[],steps:[],out:{}}}
 const out=r.out||{};
 def.outputs.forEach(o=>{
  if(o.when&&!o.when(v,out))return;
  if(typeof out[o.k]==="number"&&!isFinite(out[o.k]))
   errs.push({k:o.k,m:`«${o.n}»: النتيجة غير محدّدة — راجع المدخلات`});
 });
 return {ok:!errs.length,def,v,out,steps:r.steps||[],warn:r.warn||[],errs};
}

/* ═══ صفوفُ العرض ═══ مصدرٌ واحدٌ للواجهة والـPDF والنسخ: ما يُرى هو ما
   يُطبَع حرفاً. */
export function inputRows(res){
 const d=res.def, v=res.v;
 return d.inputs.filter(i=>visible(i,v)).map(i=>{
  if(i.type==="sel"){
   const o=optsOf(i,v).find(x=>x.v===v[i.k]);
   return {k:i.k,n:i.n,val:o?o.n:String(v[i.k]),unit:""};
  }
  return {k:i.k,n:i.n,val:fmt(v[i.k],i.dp!=null?i.dp:4),unit:i.kind?unitName(i.kind,i.unit):""};
 });
}
export function outputRows(res){
 const d=res.def, out=res.out||{};
 return d.outputs.filter(o=>!o.when||o.when(res.v,out)).filter(o=>out[o.k]!=null).map(o=>{
  const x=out[o.k];
  const unit=typeof o.unit==="function"?o.unit(res.v,out):(o.kind?unitName(o.kind,o.unit):(o.u||""));
  return {k:o.k,n:o.n,val:typeof x==="number"?fmt(x,o.dp!=null?o.dp:3):String(x),
   unit:unit||"",main:!!o.main,raw:x};
 });
}
/* نصُّ النتيجة كاملاً — للنسخ إلى الحافظة أو رسالة واتساب */
export function resultText(res){
 const d=res.def, L=[`${d.title}`];
 L.push("المدخلات:");
 inputRows(res).forEach(r=>L.push(`• ${r.n}: ${r.val}${r.unit?" "+r.unit:""}`));
 if(res.ok){
  L.push("النتائج:");
  outputRows(res).forEach(r=>L.push(`• ${r.n}: ${r.val}${r.unit?" "+r.unit:""}`));
  if(res.steps.length){L.push("الخطوات:"); res.steps.forEach(s=>L.push("  "+s))}
  res.warn.forEach(w=>L.push("⚠ "+w));
 }else res.errs.forEach(e=>L.push("✗ "+e.m));
 L.push("المرجع: "+d.ref);
 L.push(codeLine());
 L.push(DISCLAIMER);
 return L.join("\n");
}

/* ═══ أدواتٌ صغيرة للتعريفات ═══ */
export const PI=Math.PI;
export const rad=a=>a*PI/180, deg=r=>r*180/PI;
export const barArea=d=>PI*d*d/4;           /* مم² لقطرٍ بالمم */
/* استكمالٌ خطّيّ في جدولٍ مرتّبٍ [[x,y]…] — خارج المدى ⇒ NaN (لا استقراء) */
export function interp(T,x){
 for(let i=0;i<T.length-1;i++){
  const [x0,y0]=T[i],[x1,y1]=T[i+1];
  const lo=Math.min(x0,x1), hi=Math.max(x0,x1);
  if(x>=lo-1e-9&&x<=hi+1e-9)return x1===x0?y0:y0+(y1-y0)*(x-x0)/(x1-x0);
 }
 return NaN;
}
