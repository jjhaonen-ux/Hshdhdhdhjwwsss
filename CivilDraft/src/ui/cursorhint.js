/* ═══ التلميحُ بجانب المؤشّر ═══ المرحلة ٢ من خطّة التطوير
   «تلميحاتٌ سياقيةٌ بجانب المؤشّر»: الخطوةُ التالية للأداة النشطة
   (promptText().p — «حدّد النقطة التالية»…) تُكتَب فوق المؤشّر مباشرةً،
   فلا تنتقل العينُ إلى سطر الأوامر أسفل الشاشة مع كلّ نقرة.

   · نصٌّ لا حقل: لا يأخذ التركيز ولا النقر (pointer-events:none).
   · مكانُه فوق الشبح (R.T.ghost) لا تحته: حقلا القياس (#dynBox) تحته.
   · لا يظهر على اللمس: الإصبعُ يغطّيه، وشريطُ الإبهام يقول الخطوة.
   · بصمةٌ تُقارَن: syncPrompt تُنادى مع كلّ حركة مؤشّر، فلا كتابةَ في
     DOM إلّا إن تغيّر النصّ، والموضعُ transform وحدَه (لا تخطيط).
   · UIS.hint=0 يطفئه («التلميح بجانب المؤشّر» في قائمة التطبيق). */
import * as R from "../tools/registry.js";
import {V,W2S} from "./canvas.js";
import {UIS} from "./store.js";
import {tr} from "./i18n.js";

let EL=null, TXT="";
const $=s=>(typeof document!=="undefined"?document.querySelector(s):null);

/* خالصٌ: ما يُكتب في التلميح لخطوةٍ ما — "" إن لا شيء */
export function hintText(q,active){
 if(!active||!q)return "";
 const p=String(q.p||"").trim();
 if(!p)return "";
 return p.length>64?p.slice(0,63)+"…":p;
}
/* خالصٌ: الموضعُ بعد الحصر داخل القماش (فوق الشبح بـ٣٠ بكسلاً) */
export function hintPos(s,w,h,vw,vh){
 const x=Math.max(2,Math.min(s[0]+16,Math.max(2,vw-w-4)));
 let y=s[1]-h-12;
 if(y<2)y=s[1]+44;               /* أعلى الشاشة ⇒ تحتَ حقلَي القياس */
 return [Math.round(x),Math.round(Math.min(y,Math.max(2,vh-h-4)))];
}
function el(){
 if(EL&&EL.isConnected)return EL;
 const st=$("#stage"); if(!st)return null;
 EL=document.createElement("div");
 EL.id="curHint"; EL.className="curHint";
 EL.setAttribute("aria-hidden","true");     /* سطرُ الأوامر هو ما يُقرأ */
 EL.hidden=true;
 st.appendChild(EL);
 return EL;
}
export function hideHint(){
 if(EL&&!EL.hidden)EL.hidden=true;
}
export function syncHint(){
 if(!UIS.hint||typeof document==="undefined"){hideHint(); return}
 const coarse=typeof matchMedia==="function"&&matchMedia("(pointer:coarse)").matches;
 if(coarse||document.documentElement.getAttribute("data-shell-active")==="mobile"){hideHint(); return}
 const g=R.T&&R.T.ghost;
 const t=hintText(R.active()?R.promptText():null,R.active());
 if(!t||!g){hideHint(); return}
 const e=el(); if(!e)return;
 const v=tr(t);
 if(v!==TXT||e.textContent!==v){TXT=v; e.textContent=v}
 e.hidden=false;
 const [x,y]=hintPos(W2S(g[0],g[1]),e.offsetWidth||160,e.offsetHeight||22,V.w,V.h);
 e.style.transform=`translate(${x}px,${y}px)`;
}
