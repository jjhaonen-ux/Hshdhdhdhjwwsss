/* ═══ حقيبة المهندس · لوحة الحاسبات ═══ المرحلة ٣-أ
   نافذةٌ واحدة: اختيار الحاسبة ⇒ مدخلاتها بوحداتها ⇒ النتيجة مع المعادلة
   والخطوات والمرجع والتنبيه. لا منطقَ هنا: كلُّ حسابٍ في calc/engine.js.
   لا onclick ولا style مضمَّن (CSP): كلُّ ربطٍ بالتفويض. */
import {escapeHtml as esc} from "../core/escape.js";
import {rptOpen,rptBox,rptClose} from "./rpt.js";
import {HOOK} from "./bus.js";
import {S as PS} from "../core/state.js";
import {conflictNote} from "../core/projinfo.js";
import "../calc/index.js";   /* يسجّل كلّ الحاسبات (تعريفاتٌ لا تُحمَّل إلا هنا) */
import {calcById,calcList,GROUPS,runCalc,fixSel,optsOf,visible,

 outputRows,resultText,DISCLAIMER,parseNum,codeLine} from "../calc/engine.js";
import {unitList,unitName,convert} from "../calc/units.js";
import {linkFor,applyStair} from "../calc/link.js";
import {selList} from "./canvas.js";

let S=null;
/* الحالة: {id, raw:{k:نصّ}, units:{k:رمز}} — تبقى ما دامت النافذة مفتوحة */

/* قيمُ القوائم الصالحة: ما يُدخله المستخدم يُصحَّح بما يقترحه التعريف */
function normSel(d,raw){
 const v=Object.assign({},raw);
 d.inputs.forEach(i=>{if(i.type==="sel")v[i.k]=fixSel(i,Object.assign({},v))});
 return v;
}
const tplSelect=(d,raw)=>{
 const groups=GROUPS.map(g=>{
  const items=calcList().filter(x=>x.group===g.id).map(x=>
   `<option value="${esc(x.id)}"${x.id===d.id?" selected":""}>${esc(x.title)}</option>`).join("");
  return items?`<optgroup label="${esc(g.n)}">${items}</optgroup>`:"";
 }).join("");
 return `<select data-calc="id" aria-label="الحاسبة">${groups}</select>`;
};

function inputsHTML(d,v){
 const vv=v;
 return d.inputs.filter(i=>visible(i,vv)).map(i=>{
  if(i.type==="sel"){
   const o=optsOf(i,vv);
   return `<label class="cl-f"><span>${esc(i.n)}</span><select data-sel="${esc(i.k)}">${
    o.map(x=>`<option value="${esc(x.v)}"${String(x.v)===String(vv[i.k])?" selected":""}>${esc(x.n)}</option>`).join("")}</select></label>`;
  }
  const raw=S.raw[i.k]!=null?S.raw[i.k]:String(i.def);
  const list=i.kind?unitList(i.kind):[];
  const cur=S.units[i.k]||i.unit||"";
  const unitUI=list.length>1
   ?`<select data-unit="${esc(i.k)}" aria-label="وحدة ${esc(i.n)}">${list.map(u=>
      `<option value="${esc(u.v)}"${u.v===cur?" selected":""}>${esc(u.n)}</option>`).join("")}</select>`
   :(i.kind?`<span class="cl-u">${esc(unitName(i.kind,i.unit))}</span>`:"");
  return `<label class="cl-f"><span>${esc(i.n)}</span><span class="cl-row">`
   +`<input data-num="${esc(i.k)}" type="text" inputmode="decimal" value="${esc(raw)}">${unitUI}</span></label>`;
 }).join("");
}

function outHTML(d,v){
 const res=runCalc(d,v,S.units);
 if(!res.ok){
  return `<div class="cl-err" role="alert">${res.errs.map(e=>`<div>✗ ${esc(e.m)}</div>`).join("")}</div>`;
 }
 const outs=outputRows(res).map(r=>`<div class="cl-o${r.main?" main":""}"><span>${esc(r.n)}</span>`
  +`<b>${esc(r.val)}${r.unit?" "+esc(r.unit):""}</b></div>`).join("");
 const steps=res.steps.length?`<ol class="cl-steps">${res.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>`:"";
 const warn=res.warn.map(w=>`<div class="cl-warn">⚠ ${esc(w)}</div>`).join("");
 return `<div class="cl-outs">${outs}</div>${steps}${warn}`;
}

/* (v2.9.1) إن سُجِّل في معلومات المشروع كودٌ غيرُ BS 8110 فالتنبيهُ ظاهرٌ فوق الحساب */
function projCodeNote(){
 const n=conflictNote((PS&&PS.title&&PS.title.code)||"");
 return n?`<div class="cl-warn" role="note">⚠ ${esc(n)}</div>`:"";
}
function bodyHTML(d){
 const v=normSel(d,S.raw);
 return `<div class="cl-top">${tplSelect(d)}</div>`
  +`<p class="cl-desc">${esc(d.desc)}</p>`
  +projCodeNote()
  +`<details class="cl-fm"><summary>المعادلات والمرجع</summary>`
  +`<ul>${d.formula.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>`
  +`<p class="cl-ref">المرجع: ${esc(d.ref)}</p>`
  +`<p class="cl-ref">${esc(codeLine())}</p></details>`
  +`<div class="cl-in">${inputsHTML(d,v)}</div>`
  +`<div class="cl-out" aria-live="polite">${outHTML(d,v)}</div>`
  +`<p class="cl-disc">${esc(DISCLAIMER)}</p>`
  +`<div class="rpt-act">`
  /* (v2.11.0 · ٣-د) فُتحت من درجٍ محدَّد ⇒ النتيجةُ تُطبَّق عليه بزرٍّ صريح (والتراجعُ يُرجعها) */
  +(S.src&&S.src.k==="stair"&&d.id==="stairs"?`<button type="button" data-cl="apply">طبّق على ${esc(S.src.id)}</button>`:"")
  +`<button type="button" data-cl="copy">انسخ النتيجة</button>`
  +`<button type="button" data-cl="pdf">تنزيل PDF</button>`
  +`<button type="button" data-rpt="close">إغلاق</button></div>`;
}

/* إعادة بناء النافذة كلّها — عند تغيير الحاسبة أو قائمةٍ تُغيّر ما يظهر */
function rerender(){
 const b=rptBox(); if(!b)return;
 const d=calcById(S.id);
 const body=b.querySelector(".rpt-b"); if(!body)return;
 body.innerHTML=bodyHTML(d);
}
/* تحديثٌ خفيف للنتيجة وحدها — لا يفقد التركيز أثناء الكتابة */
function refreshOut(){
 const b=rptBox(); if(!b)return;
 const d=calcById(S.id);
 const v=normSel(d,S.raw);
 const o=b.querySelector(".cl-out"); if(o)o.innerHTML=outHTML(d,v);
}

function onInput(e){
 const el=e.target;
 if(el.dataset.num){ S.raw[el.dataset.num]=el.value; refreshOut(); }
}
function onChange(e){
 const el=e.target;
 if(el.dataset.calc){ S.id=el.value; S.raw={}; S.units={}; S.src=null; rerender(); return }
 if(el.dataset.sel){
  S.raw[el.dataset.sel]=el.value;
  /* قائمةٌ تُغيّر ما يظهر أو وحداتٍ تتبعها ⇒ إعادة البناء كلّها */
  rerender(); return;
 }
 if(el.dataset.unit){
  const k=el.dataset.unit, old=S.units[k];
  const d=calcById(S.id), inp=d.inputs.find(i=>i.k===k);
  /* تحويل القيمة المعروضة إلى الوحدة الجديدة حتى لا تتغيّر الكمية الفعلية */
  const cur=S.raw[k]!=null?S.raw[k]:String(inp.def);
  const from=old||inp.unit, to=el.value, x=parseNum(cur);
  if(isFinite(x)&&inp.kind)S.raw[k]=String(+convert(x,inp.kind,from,to).toPrecision(8));
  S.units[k]=to; rerender();
 }
}
function onClick(e){
 const b=e.target.closest&&e.target.closest("[data-cl]"); if(!b)return;
 const d=calcById(S.id), v=normSel(d,S.raw), res=runCalc(d,v,S.units);
 if(b.dataset.cl==="apply"){
  const r=applyStair(S.src,res,PS);
  HOOK.report(r.ok?"ok":"wr",r.msg);
  if(r.ok&&r.p&&!r.p.same&&HOOK.refresh)HOOK.refresh(1);
  return;
 }
 if(b.dataset.cl==="copy"){
  if(!navigator.clipboard?.writeText){HOOK.report("er","الحافظة غير متاحة");return}
  navigator.clipboard.writeText(resultText(res)).then(
   ()=>HOOK.report("ok","نُسخت النتيجة مع المدخلات والمرجع"),
   ()=>HOOK.report("er","تعذّر النسخ — المتصفّح منع الحافظة"));
 }else if(b.dataset.cl==="pdf"){
  if(!res.ok){HOOK.report("wr","أصلح المدخلات أوّلاً ثم نزّل الـPDF");return}
  HOOK.report("in","يُبنى PDF الحاسبة…");
  Promise.all([import("../calc/pdf.js"),import("../io/project.js")]).then(([P,pr])=>P.calcPDF(res).then(r=>{
   const nm=(d.id+"-حاسبة.pdf");
   pr.dl(nm,r.bytes,"application/pdf");
   HOOK.report("ok",`نُزّل ${nm}`+(r.over?` · المحتوى تجاوز الصفحة بـ ${r.over} مم`:""));
  })).catch(err=>HOOK.report("er","تعذّر بناء PDF الحاسبة: "+((err&&err.message)||err)));
 }
}

/* الفتح: id اختياري (من البحث أو الدليل)، وإلا أوّل حاسبة.
   pre اختياري (المرحلة ٣-د): {raw, units} يملأ الحقول من عنصر المخطّط (calc/link.js) */
/* عنصرُ التحديد ⇒ الحاسبة وتعبئتها: بلاطةٌ ⇒ حديدها، قاعدةٌ ⇒ أبعادها، درجٌ ⇒ تصميمه، غرفةٌ ⇒ تكييفها */
function selectionPre(){
 const L=selList(); const s=L[0];
 if(!s){HOOK.report("wr","حدِّد بلاطةً أو قاعدةً أو درجاً أو غرفةً أوّلاً");return null}
 const r=linkFor(s,PS);
 if(r)return Object.assign({sel:{k:s.k,id:s.id}},r);
 HOOK.report("wr","لا تنفع هذه الحاسبة لما حدّدته: جرّب بلاطة أو قاعدة أو درجاً أو غرفة");
 return null;
}
export function openCalcPanel(id,pre){
 let src=null;
 if(id==="sel"){const r=selectionPre(); if(!r)return null; id=r.id; pre=r.pre; src=r.sel}
 const d=calcById(id)||calcList()[0];
 if(!d){HOOK.report("er","لا حاسبات مسجّلة");return}
 const keep=S&&S.id===d.id&&!pre;
 if(!keep||!id)S={id:d.id,raw:(pre&&pre.raw)||{},units:(pre&&pre.units)||{},src};
 else S.id=d.id;
 rptOpen("حقيبة المهندس",bodyHTML(d));
 const box=rptBox();
 box.classList.add("calc");
 box.addEventListener("input",e=>{if(rptBox()===box)onInput(e)});
 box.addEventListener("change",e=>{if(rptBox()===box)onChange(e)});
 box.addEventListener("click",e=>{if(rptBox()===box)onClick(e)});
 return box;
}
export const calcPanelClose=()=>rptClose();
