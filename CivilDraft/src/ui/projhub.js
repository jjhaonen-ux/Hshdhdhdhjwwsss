/* ═══ مركز المشروع ═══ المرحلة ٢ من خطّة التطوير
   نافذةٌ واحدة بأربعة أقسام: البدء (المشاريعُ الأخيرة والقوالب) · الدور
   (مساحة العمل) · معلومات المشروع (تُقرأ في البلوك والتقارير والتسعير) ·
   بلوك العنوان (الشعار والختم وسجلّ المراجعات).
   كسولةٌ: لا تدخل الإقلاع. لا style="" ولا معالجَ مضمَّن (CSP)،
   والأنماطُ في css/hub.css.

   v2.6.0 — ما أكمله هذا الإصدار من المرحلة ٢:
   • «البدء» صار شاشةَ بدايةٍ حقيقية: المشاريعُ الأخيرة (io/recents.js)
     تُفتَح بنقرة، والقوالبُ مرتّبةٌ بدور المستخدم (roleOrder).
   • قسمُ «بلوك العنوان»: شعارُ المكتب المتّجه، وختمُ الاعتماد، وسجلُّ
     المراجعات (جدول الإصدارات) بإضافةٍ وحذف — كلُّ تعديلٍ خطوةُ تراجع.
   • الوصول: حصرُ التركيز (focustrap)، وأسهمُ لوحة المفاتيح بين الأقسام،
     وإعلانُ «محفوظ» لقارئ الشاشة (role=status). */
import {S,edit} from "../core/state.js";
import {escapeHtml as esc} from "../core/escape.js";
import {ROLES,ROLE_IDS,ROLE_ICON,roleName,roleOrder} from "./roles.js";
import {CODES,CODE_NOTE,DESIGN_CODE,SIGS,STAMPF,LOGO_SHAPES,monogramOf,revAdd,revDel,REV_ALL} from "../core/projinfo.js";
import {UIS} from "./store.js";
import {HOOK} from "./bus.js";
import {tr,lang} from "./i18n.js";
import {trapFocus} from "./focustrap.js";

let root=null, SEC="start", REL=null, FIRST=false;

export const SECS=["start","role","info","tb"];
const TXT_FIELDS=[["proj","اسم المشروع"],["owner","المالك"],["loc","الموقع"],
 ["office","اسم المكتب"],["lic","رقم الرخصة"],["by","المصمّم"],["chk","المدقّق"],["apr","المعتمِد"]];
/* القوالبُ المعروضة في البدء — الأسماءُ نفسُها في لوحة الأوامر وشاشة الترحيب */
export const HUB_TPLS=[
 {id:"showcase",n:"فيلا العرض",s:"كل الأدوات · 16 × 12 م"},
 {id:"villa",n:"فيلا دور أرضي",s:"14 × 10 م"},
 {id:"apt3",n:"شقة ٣ غرف",s:"12 × 10 م"},
 {id:"grid10x9",n:"بيت بمحاور ١٠×٩",s:"شبكة محاور"},
 {id:"twin15",n:"عمارة شقّتين",s:"10 × 15 م"},
 {id:"studio",n:"استوديو",s:"شقة صغيرة"},
 {id:"office",n:"مكتب",s:"بابان وشباك"},
 {id:"room",n:"غرفة سريعة",s:"مستطيل"}];
export const hubTemplates=role=>roleOrder(HUB_TPLS,role,x=>x.id);

const today=()=>{const d=new Date(); const p=n=>String(n).padStart(2,"0");
 return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
const empty=()=>!S.walls.length&&!S.areas.length&&!(S.cols||[]).length;

function roleCards(){
 return ROLE_IDS.map(id=>{
  const r=ROLES[id], on=UIS.role===id;
  return `<button type="button" class="hbRole${on?" on":""}" data-role="${esc(id)}"
   aria-pressed="${on?"true":"false"}">
   <span class="hbIc" aria-hidden="true">${ROLE_ICON[id]||""}</span>
   <b>${esc(tr(r.n))}</b><small>${esc(tr(r.s))}</small></button>`;
 }).concat([`<button type="button" class="hbRole${!UIS.role?" on":""}" data-role=""
   aria-pressed="${!UIS.role?"true":"false"}">
   <span class="hbIc" aria-hidden="true">🧰</span>
   <b>${esc(tr("كل الأدوات"))}</b><small>${esc(tr("بلا تصفية — كل ما في الشريط"))}</small></button>`]).join("");
}
function field(attr,k,label,val,max,extra){
 return `<label class="hbF"><span>${esc(tr(label))}</span>
  <input ${attr}="${esc(k)}" type="text" maxlength="${max}" value="${esc(val||"")}"${extra||""}></label>`;
}
function infoForm(){
 const T=S.title||{};
 const txt=TXT_FIELDS.map(([k,l])=>field("data-t",k,l,T[k],60)).join("");
 /* (v2.9.1) الفارغُ يُعرَض «BS 8110 (الافتراضيّ)»: كودُ التصميم واحدٌ في المشروع */
 const codeLab=k=>(k===""?CODES.bs8110:CODES[k])+" — "+tr(CODE_NOTE[k]||"");
 /* (v2.11.0) المشروعُ على BS 8110 وحده: القائمةُ تعرضه والافتراضيّ فقط، وكودٌ قديمٌ
    محفوظٌ في المشروع يظهر وحدَه (تسميةً) حتى يُبدَّل، ولا يُختار كودٌ آخر من جديد */
 const codes=Object.keys(CODES).filter(k=>k===""||k===DESIGN_CODE||k===(T.code||"")).map(k=>`<option value="${esc(k)}"${(T.code||"")===k?" selected":""}>${esc(codeLab(k))}</option>`).join("");
 const cur=field("data-t","cur","العملة",T.cur,8,` placeholder="ر.س"`);
 const vat=`<label class="hbF"><span>${esc(tr("الضريبة %"))}</span>
  <input data-t="vat" type="number" min="0" max="100" step="0.5" value="${T.vat==null?"":esc(T.vat)}" placeholder="15"></label>`;
 const sigs=SIGS.map(([k,l])=>field("data-sig",k,l,(T.sig||{})[k],30)).join("");
 return `<div class="hbGrid">${txt}</div>
  <div class="hbGrid"><label class="hbF"><span>${esc(tr("الكود المعتمد"))}</span>
   <select data-t="code">${codes}</select></label>${cur}${vat}</div>
  <h4>${esc(tr("خانات التواقيع"))}</h4><div class="hbGrid">${sigs}</div>
  <p class="hbNote">${esc(tr("الحقول الفارغة لا تُرسَم. تظهر في بلوك العنوان والتقارير والتسعير."))}</p>`;
}
/* قسمُ بلوك العنوان: الشعار · الختم · سجلّ المراجعات */
function tbForm(){
 const T=S.title||{};
 const shp=Object.keys(LOGO_SHAPES).map(k=>`<option value="${esc(k)}"${(T.logoShape||"circle")===k?" selected":""}>${esc(tr(LOGO_SHAPES[k]))}</option>`).join("");
 const sug=monogramOf(T.office);
 const logo=`<div class="hbGrid">
  ${field("data-t","logoTxt","حروف الشعار",T.logoTxt,4,sug?` placeholder="${esc(sug)}"`:"")}
  <label class="hbF"><span>${esc(tr("شكل الشعار"))}</span><select data-t="logoShape">${shp}</select></label>
  <div class="hbF hbLogoAct">${sug&&!T.logoTxt?`<button type="button" data-logo-sug="${esc(sug)}">${esc(tr("استعمل"))} «${esc(sug)}»</button>`:""}</div></div>`;
 const stamp=STAMPF.map(([k,l])=>field("data-stamp",k,l,(T.stamp||{})[k],30)).join("");
 const R=Array.isArray(T.revs)?T.revs:[];
 const rows=R.map((r,i)=>`<tr><td><input data-rev="${i}" data-rk="n" maxlength="6" value="${esc(r.n)}" aria-label="${esc(tr("رقم المراجعة"))}"></td>
  <td><input data-rev="${i}" data-rk="d" maxlength="12" value="${esc(r.d)}" aria-label="${esc(tr("التاريخ"))}"></td>
  <td><input data-rev="${i}" data-rk="t" maxlength="60" value="${esc(r.t)}" aria-label="${esc(tr("الوصف"))}"></td>
  <td><button type="button" class="hbDel" data-revdel="${i}" aria-label="${esc(tr("احذف المراجعة"))} ${esc(r.n||String(i+1))}">✕</button></td></tr>`).join("");
 return `<h4>${esc(tr("شعار المكتب"))}</h4>
  <p class="hbNote">${esc(tr("شعارٌ متّجه (حروف داخل شكل) يخرج في DXF وPDF وSVG وPNG كما هو."))}</p>${logo}
  <h4>${esc(tr("ختم الاعتماد"))}</h4><div class="hbGrid">${stamp}</div>
  <h4>${esc(tr("سجلّ المراجعات"))}</h4>
  <table class="hbRevs"><thead><tr><th>${esc(tr("المراجعة"))}</th><th>${esc(tr("التاريخ"))}</th><th>${esc(tr("الوصف"))}</th><th></th></tr></thead>
  <tbody>${rows||`<tr><td colspan="4" class="hbNone">${esc(tr("لا مراجعات بعد"))}</td></tr>`}</tbody></table>
  <div class="hbBtns"><button type="button" data-revadd${R.length>=REV_ALL?" disabled":""}>${esc(tr("أضف مراجعة"))}</button></div>
  <p class="hbNote">${esc(tr("البلوك الجانبي يعرض آخر ٤ مراجعات، والطراز العمودي يعرض الشعار في صفّ المكتب."))}</p>`;
}
function recentHtml(L){
 if(!L)return `<p class="hbNote" data-recent-wait>${esc(tr("جارٍ تحميل المشاريع الأخيرة…"))}</p>`;
 if(!L.length)return `<p class="hbNote">${esc(tr("لا مشاريع أخيرة بعد — كل مشروع تحفظه أو تفتحه يظهر هنا."))}</p>`;
 return `<ul class="hbRecent" role="list">${L.map(r=>`<li>
  <button type="button" class="hbRec" data-recent="${esc(r.id)}"><b>${esc(r.n)}</b>
   <small>${esc(r.ago||"")} · ${r.w} ${esc(tr("جدار"))} · ${r.o} ${esc(tr("فتحة"))}</small></button>
  <button type="button" class="hbDel" data-recentdel="${esc(r.id)}" aria-label="${esc(tr("أزِل من القائمة"))}: ${esc(r.n)}">✕</button></li>`).join("")}</ul>`;
}
function startHtml(){
 const T=hubTemplates(UIS.role).slice(0,6).map(x=>`<button type="button" class="hbTpl" data-tpl="${esc(x.id)}">
  <b>${esc(tr(x.n))}</b><small>${esc(tr(x.s))}</small></button>`).join("");
 return `<div class="hbStart">
  <span>${esc(tr("المشروع الحالي"))}: <b>${esc((S.title&&S.title.proj)||S.meta.name||"—")}</b></span>
  <div class="hbBtns">
   <button type="button" data-go="role">${esc(tr("اختر مساحة العمل"))}: ${esc(tr(roleName(UIS.role)))}</button>
   <button type="button" data-go="info">${esc(tr("أكمل معلومات المشروع"))}</button>
   <button type="button" data-go="tour">${esc(tr("جولة سريعة"))}</button>
  </div>
  <h4>${esc(tr("المشاريع الأخيرة"))}</h4><div data-recents>${recentHtml(null)}</div>
  <h4>${esc(tr("قوالب مقترحة لدورك"))}</h4><div class="hbTpls">${T}</div>
 </div>`;
}
function shell(){
 const tab=(k,l)=>`<button type="button" role="tab" id="hbT-${k}" aria-controls="hbBody" data-sec="${k}">${esc(tr(l))}</button>`;
 return `<div class="hb" role="dialog" aria-modal="true" aria-labelledby="hbTitle">
 <div class="hbHead"><b id="hbTitle">${esc(tr("مركز المشروع"))}</b>
  <button type="button" class="hbX" data-x="close" aria-label="${esc(tr("إغلاق"))}">✕</button></div>
 <nav class="hbTabs" role="tablist" aria-label="${esc(tr("أقسام مركز المشروع"))}">
  ${tab("start","البدء")}${tab("role","مساحة العمل")}${tab("info","معلومات المشروع")}${tab("tb","بلوك العنوان")}
 </nav>
 <div class="hbBody" id="hbBody" role="tabpanel" data-body></div>
 <div class="hbFoot"><span class="hbSaved" data-saved role="status" aria-live="polite"></span>
  <button type="button" data-x="close">${esc(tr("تم"))}</button></div>
</div>`;
}
function body(){
 const b=root.querySelector("[data-body]");
 root.querySelectorAll("[data-sec]").forEach(t=>{
  const on=t.dataset.sec===SEC;
  t.setAttribute("aria-selected",on?"true":"false"); t.tabIndex=on?0:-1; t.classList.toggle("on",on);
 });
 b.setAttribute("aria-labelledby","hbT-"+SEC);
 if(SEC==="role")b.innerHTML=(FIRST?`<p class="hbFirst" role="note">${esc(tr("أهلاً! اختر مساحة عملك لتظهر أدواتك فقط. تقدر تغيّرها في أي وقت من زر «مساحة العمل» في الشريط."))}</p>`:"")+`<p class="hbNote">${esc(tr("الدور يحدّد الأدوات الظاهرة في الشريط. كل أداة تبقى في البحث Ctrl+K."))}</p>
  <div class="hbRoles">${roleCards()}</div>`;
 else if(SEC==="info")b.innerHTML=infoForm();
 else if(SEC==="tb")b.innerHTML=tbForm();
 else{b.innerHTML=startHtml(); loadRecents()}
}
/* المشاريعُ الأخيرة كسولةٌ داخل الكسول — لا تُحمَّل إلا حين يُرى قسمُ البدء */
function loadRecents(){
 import("../io/recents.js").then(M=>{
  const box=root&&root.querySelector("[data-recents]");
  if(!box)return;
  const en=lang()==="en", now=Date.now();
  box.innerHTML=recentHtml(M.recentList().map(r=>({...r,ago:M.agoText(r.t,now,en)})));
 }).catch(()=>{
  const box=root&&root.querySelector("[data-recents]");
  if(box)box.innerHTML=recentHtml([]);
 });
}
function flash(msg){
 const s=root&&root.querySelector("[data-saved]"); if(s)s.textContent=msg;
}
/* كتابةُ حقلٍ من حقول العنوان داخل edit() — خطوةُ تراجعٍ لكلّ تغيير */
function setTitle(fn,label){
 if(!S.title)return;
 edit(()=>fn(S.title),label||"معلومات المشروع",{bump:"view"});
 flash(tr("محفوظ"));
 HOOK.refresh(0);
}
function onChange(e){
 const t=e.target; if(!t||!t.dataset)return;
 const v=String(t.value==null?"":t.value).trim();
 if(t.dataset.t){
  const k=t.dataset.t;
  setTitle(T=>{
   if(k==="vat"){
    const n=+v;
    if(v===""||!isFinite(n)||n<0||n>100)delete T.vat; else T.vat=Math.round(n*100)/100;
   }else if(k==="code"){
    if(CODES[v]&&v)T.code=v; else delete T.code;
   }else if(k==="cur"){
    if(v)T.cur=v.slice(0,8); else delete T.cur;
   }else if(k==="logoTxt"){
    if(v)T.logoTxt=v.slice(0,4); else delete T.logoTxt;
   }else if(k==="logoShape"){
    if(LOGO_SHAPES[v]&&v!=="circle")T.logoShape=v; else delete T.logoShape;
   }else T[k]=v.slice(0,60);
  });
  if(k==="office"&&SEC==="tb")body();
 }else if(t.dataset.sig){
  setTitle(T=>{T.sig=T.sig||{};
   if(v)T.sig[t.dataset.sig]=v.slice(0,30); else delete T.sig[t.dataset.sig];
   if(!Object.keys(T.sig).length)delete T.sig});
 }else if(t.dataset.stamp){
  setTitle(T=>{T.stamp=T.stamp||{};
   if(v)T.stamp[t.dataset.stamp]=v.slice(0,30); else delete T.stamp[t.dataset.stamp];
   if(!Object.keys(T.stamp).length)delete T.stamp});
 }else if(t.dataset.rev!=null&&t.dataset.rk){
  const i=+t.dataset.rev, rk=t.dataset.rk;
  const lim={n:6,d:12,t:60}[rk]; if(!lim)return;
  setTitle(T=>{const L=(T.revs||[]).map(x=>({...x})); if(!L[i])return;
   L[i][rk]=v.slice(0,lim); T.revs=L},"سجلّ المراجعات");
 }
}
function close(){
 if(!root)return;
 root.hidden=true;
 if(REL){try{REL()}catch(e){} REL=null}
}
function onClick(e){
 if(e.target===root){close();return}
 const s=e.target.closest("[data-sec]");
 if(s){SEC=s.dataset.sec; body(); s.focus(); return}
 const g=e.target.closest("[data-go]");
 if(g){const k=g.dataset.go; if(k==="tour"){close(); HOOK.report("in","الجولة السريعة من قائمة التطبيق")} else {SEC=k; body()} return}
 const r=e.target.closest("[data-role]");
 if(r){
  const id=r.dataset.role;
  import("./ribbon/wire.js").then(W=>{W.setRole(id,false); body(); flash(tr("مساحة العمل")+": "+tr(roleName(id)))});
  return;
 }
 const tp=e.target.closest("[data-tpl]");
 if(tp){
  if(!empty()&&!confirm(tr("القالب يُضاف فوق الرسم الحالي. تابع؟")))return;
  const id=tp.dataset.tpl;
  close();
  import("./palette.js").then(P=>P.paletteTemplate(id)).catch(()=>{});
  return;
 }
 const rc=e.target.closest("[data-recent]");
 if(rc){
  if(!empty()&&!confirm(tr("فتح مشروع؟ سيُفقد غير المحفوظ.")))return;
  const id=rc.dataset.recent;
  import("../io/recents.js").then(M=>M.recentOpen(id)).then(res=>{
   if(res&&res.ok){close(); HOOK.report("ok",`فُتح «${res.n}» · ${res.w} جدار`); HOOK.refresh(1)}
   else HOOK.report("wr","تعذّر فتح المشروع الأخير: "+((res&&res.err)||"خطأ"));
  }).catch(()=>{});
  return;
 }
 const rd=e.target.closest("[data-recentdel]");
 if(rd){
  import("../io/recents.js").then(M=>M.recentDrop(rd.dataset.recentdel)).then(()=>loadRecents()).catch(()=>{});
  return;
 }
 const sg=e.target.closest("[data-logo-sug]");
 if(sg){const v=sg.dataset.logoSug; setTitle(T=>{T.logoTxt=String(v).slice(0,4)}); body(); return}
 if(e.target.closest("[data-revadd]")){
  setTitle(T=>{T.revs=revAdd(T.revs,null,today())},"سجلّ المراجعات"); body();
  const L=root.querySelectorAll('[data-rk="t"]'); if(L.length)L[L.length-1].focus();
  return;
 }
 const del=e.target.closest("[data-revdel]");
 if(del){
  const i=+del.dataset.revdel;
  setTitle(T=>{const L=revDel(T.revs,i); if(L.length)T.revs=L; else delete T.revs},"سجلّ المراجعات"); body();
  return;
 }
 if(e.target.closest('[data-x="close"]'))close();
}
/* الأسهمُ بين الأقسام (نمطُ ARIA للتبويبات) — RTL: اليمينُ يرجع */
export function nextSec(cur,key,rtl){
 const i=Math.max(0,SECS.indexOf(cur)), n=SECS.length;
 if(key==="Home")return SECS[0];
 if(key==="End")return SECS[n-1];
 const fwd=key==="ArrowDown"||(rtl?key==="ArrowLeft":key==="ArrowRight");
 const back=key==="ArrowUp"||(rtl?key==="ArrowRight":key==="ArrowLeft");
 if(fwd)return SECS[(i+1)%n];
 if(back)return SECS[(i-1+n)%n];
 return cur;
}
function onKey(e){
 if(e.key==="Escape"){e.stopPropagation(); close(); return}
 const tab=e.target&&e.target.closest&&e.target.closest('[role="tab"]');
 if(!tab)return;
 const nx=nextSec(SEC,e.key,lang()!=="en");
 if(nx!==SEC){e.preventDefault(); SEC=nx; body(); const b=root.querySelector(`[data-sec="${nx}"]`); if(b)b.focus()}
}
export function openHub(sec,o){
 FIRST=!!(o&&o.first);
 if(!root){
  root=document.createElement("div");
  root.id="projHub"; root.className="hbWrap";
  root.hidden=true;
  document.body.appendChild(root);
  root.addEventListener("click",onClick);
  root.addEventListener("change",onChange);
  root.addEventListener("keydown",onKey);
 }
 /* اللغةُ قد تبدّلت منذ آخر فتح: الهيكلُ يُبنى من جديد في كلّ فتح */
 root.setAttribute("dir",lang()==="en"?"ltr":"rtl");
 root.innerHTML=shell();
 SEC=SECS.includes(sec)?sec:"start";
 root.hidden=false;
 body();
 if(REL){try{REL()}catch(e){}}
 REL=trapFocus(root.querySelector(".hb"),{onEsc:close});
 const f=root.querySelector('[role="tab"][aria-selected="true"]')||root.querySelector("button");
 if(f)f.focus();
}
export const hubOpen=()=>!!root&&!root.hidden;
export const ROLE_CARDS_FOR_TEST=roleCards;
export const INFO_FOR_TEST=infoForm;
export const TB_FOR_TEST=tbForm;
export const START_FOR_TEST=startHtml;
export const RECENT_FOR_TEST=recentHtml;
