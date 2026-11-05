/* ═══ الترجمة ═══ المرحلة ٢ من خطّة التطوير — الواجهة الإنجليزية (اختيارية)
   النصُّ العربيُّ نفسُه هو المفتاح: tr("جدار") ⇒ "Wall" في الإنجليزية،
   وفي العربية يعود كما هو بلا بحثٍ ولا كلفة. فلا جدولُ معرّفاتٍ ثانٍ
   يتخلّف عن المخطّط، ونصٌّ بلا ترجمةٍ يبقى عربياً لا فارغاً.

   القاموسُ ملفٌّ منفصلٌ (src/i18n/en.js) يُحمَّل عند الطلب فلا يثقل
   الإقلاع العربي. واللغةُ تفضيلُ نافذةٍ (UIS.lang) لا بياناتُ مشروع. */
import {UIS} from "./store.js";

export const LANGS={ar:"العربية",en:"English"};
let DICT=null, DLANG="";
export const lang=()=>(UIS.lang==="en"?"en":"ar");
export const dictReady=()=>lang()==="ar"||(DICT&&DLANG===lang());
export function setDict(l,d){DLANG=l; DICT=(d&&typeof d==="object")?d:null}
export function tr(s){
 if(lang()==="ar"||!DICT||DLANG!==lang())return s;
 const v=DICT[s];
 return (typeof v==="string"&&v)?v:s;
}
/* يُحمّل قاموسَ اللغة الجارية مرّةً — ويُرجع وعداً يُحَلّ حين يصير جاهزاً */
let LOADING=null;
export function loadDict(){
 if(dictReady())return Promise.resolve(true);
 if(!LOADING)LOADING=import("../i18n/en.js")
  .then(M=>{setDict("en",M.EN); LOADING=null; return true})
  .catch(()=>{LOADING=null; return false});
 return LOADING;
}
/* اتجاهُ الصفحة ولغتُها — والقماشُ يبقى ltr كما هو في index.html */
export function applyLang(){
 const el=typeof document!=="undefined"&&document.documentElement;
 if(!el)return lang();
 const l=lang();
 el.setAttribute("lang",l);
 el.setAttribute("dir",l==="en"?"ltr":"rtl");
 return l;
}
