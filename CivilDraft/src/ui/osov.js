/* ═══ م٢أ · شرائح التجاوز المؤقّت للمس ═══ (تُحمَّل عند أول ضغطةٍ مطوّلة على ⚙)
   كلمةُ النمط في سطر الإدخال (end · تقاطع …) هي الطريق نفسه على الحاسوب:
   كلاهما ينادي R.osOverride فيصير النمط وحده فعّالاً للنقطة التالية. */
import * as R from "../tools/registry.js";
import {MODES} from "../core/osnap.js";
import {escapeHtml as esc} from "../core/escape.js";
import {haptic} from "../platform/index.js";
import {S,touch,autosave} from "../core/state.js";
export const OV_K=["end","mid","int","cen","per","par","nod","near"];
export function chipsHtml(cur){
 return `<div class="tbPop tbOv" role="group" aria-label="التقاطٌ لنقطةٍ واحدة">`
  +MODES.filter(m=>OV_K.includes(m.k)).map(m=>`<button type="button" data-tb="ov:${m.k}"`
   +` aria-pressed="${cur===m.k}">${esc(m.n)}</button>`).join("")
  +`<button type="button" data-tb="pick" class="tbPick" aria-pressed="${S.os.pick==="near"}">الأقرب يفوز</button></div>`;
}
/* os.pick من اللمس (البند ٢): الإعدادُ نفسُه الذي يبدّله مربّعُ «الأقرب يفوز» في لوحة الالتقاط */
export function togglePick(){
 S.os.pick=S.os.pick==="near"?"order":"near";
 touch(); autosave();
 const b=document.querySelector("#touchBar .tbPick");
 if(b)b.setAttribute("aria-pressed",String(S.os.pick==="near"));
 return S.os.pick;
}
export function chips(){
 const box=document.querySelector("#touchBar");
 if(!box||box.querySelector(".tbOv"))return false;
 box.insertAdjacentHTML("afterbegin",chipsHtml(R.T.osOv));
 try{haptic("tap")}catch(_){}
 return true;
}
