/* ═══ أساسيات البحث العربي — وحدة مشتركة ═══
   كانت norm/toLat/score منسوخةً في palette.js وأخرى في searchIndex.js،
   فهدفُ «بحثٍ عربيٍّ موحَّد» لم يتحقّق. هذه الورقة مصدرُهما الوحيد:
   لا تستورد شيئاً (فلا دورة)، (searchIndex.js حُذف في المرحلة ١ من خطّة الهاتف)،
   وpalette.js يستوردها من هنا. */

/* ═══ التطبيع العربي ═══ يوحّد الهمزات والتاء المربوطة والألف
   المقصورة والتشكيل، فلا يفرّق البحث بين "انشئ" و"أنشئ". */
export const norm=s=>String(s==null?"":s).toLowerCase()
 .replace(/[\u064B-\u0652\u0670\u0640]/g,"")   /* تشكيل وتطويل */
 .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
 .replace(/\s+/g," ").trim();

/* ═══ لوحة مفاتيح عربية→لاتينية ═══ يسمح بالبحث بالحرف الفيزيائي
   نفسه لو تبدّل تخطيط الكيبورد وسط الكتابة. */
const KB={ض:"q",ص:"w",ث:"e",ق:"r",ف:"t",غ:"y",ع:"u",ه:"i",
 خ:"o",ح:"p",ش:"a",س:"s",ي:"d",ب:"f",ل:"g",ا:"h",ت:"j",
 ن:"k",م:"l",ئ:"z",ء:"x",ؤ:"c",ر:"v",ى:"n",ة:"m",
 ج:"[",د:"]",ك:";",ط:"'",و:",",ز:".",ظ:"/"};
export const toLat=s=>[...String(s||"")].map(c=>KB[c]===undefined?c:KB[c]).join("");

/* ═══ التسجيل ═══ مطابقة بادئة/احتواء ثم متتالية ضبابية.
   يُعيد -1 عند عدم التطابق، و0 لاستعلامٍ فارغ. */
export function score(hay,q){
 if(!q)return 0;
 hay=norm(hay); q=norm(q);
 if(hay.startsWith(q))return 1000-hay.length;
 const i=hay.indexOf(q);
 if(i>=0)return 700-i-hay.length*.1;
 let s=0,j=0,run=0;
 for(const ch of q){
  const k=hay.indexOf(ch,j);
  if(k<0)return -1;
  run=(k===j)?run+1:0;
  s+=10+run*6-Math.min(k-j,20)*.5;
  j=k+1;
 }
 return s;
}

/* ═══ البحثُ الذكيّ ═══ المرحلة ٢ من خطّة التطوير
   «بحثٌ موحَّد يفهم الأخطاء الإملائية العربية والعامية». ثلاثُ طبقاتٍ
   فوق score() لا بدلها — فكلُّ ما كان يُوجَد ما زال يُوجَد بالدرجة نفسها،
   والجديدُ يُضاف تحته:
   ١. تطبيعٌ أوسع (normx): الأرقامُ الهندية · «ال» التعريف · الحرفُ المكرَّر
      سهواً («جدااار») · ؤ/ئ · ـه/ـة آخرَ الكلمة.
   ٢. مرادفاتٌ عامّيّة (SYN): «حيطة» ⇒ جدار، «شبّاك» ⇒ نافذة/شباك،
      «بيبان» ⇒ باب… كلُّ مرادفٍ يُعيد صياغةَ الاستعلام بالاسم المعتمد.
   ٣. تسامحٌ إملائيّ (typo): مسافةُ تحريرٍ (حذف/إضافة/استبدال/تبديل
      متجاورَين) ≤ ١ للكلمة القصيرة و≤ ٢ للطويلة، على مستوى الكلمة.
   والدرجاتُ مرتّبة: المطابقُ الحرفيّ (≥ ٧٠٠) فوق المرادف (٦٥٠ فما دون)
   فوق الخطأ الإملائيّ (≤ ٣٠٠) — فلا يزاحم التخمينُ الجوابَ الصحيح. */
const AR_DIG="٠١٢٣٤٥٦٧٨٩", FA_DIG="۰۱۲۳۴۵۶۷۸۹";
export const normx=s=>norm(s)
 .replace(/[٠-٩]/g,d=>String(AR_DIG.indexOf(d)))
 .replace(/[۰-۹]/g,d=>String(FA_DIG.indexOf(d)))
 .replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ء/g,"")
 .replace(/[«»"'`.,،؛:!؟?()\[\]{}]/g," ")
 .replace(/(\p{L})\1{2,}/gu,"$1")                 /* جدااار ⇒ جدار */
 .split(" ").filter(Boolean)
 .map(w=>w.length>4&&w.startsWith("ال")?w.slice(2):w)    /* الجدار ⇒ جدار */
 .map(w=>w.length>3&&/^(وال|بال|فال|كال)/.test(w)?w.slice(3):w)
 .join(" ");

/* المرادفات: المفتاحُ الاسمُ المعتمد في الشريط/الفهرس، والقيمةُ ما يكتبه
   الناس فعلاً (عامّيّ · مصريّ · خليجيّ · شاميّ · إنجليزيّ مُعرَّب). */
export const SYN={
 "جدار":["حيطه","حيط","حايط","حائط","جدران","حيطان","طوب","wall"],
 "شباك":["نافذه","نوافذ","شبابيك","طاقه","دريشه","window"],
 "باب":["ابواب","بيبان","بوابه","مدخل","door"],
 "بعد":["مقاس","قياسات","ابعاد","مقاسات","دايمنشن","dimension","dim"],
 "قياس":["قيس","مسافه","طول","measure"],
 "منطقه":["غرفه","اوضه","حجره","فراغ","room","area"],
 "حذف":["امسح","مسح","شيل","اشطب","ازاله","delete","erase"],
 "نسخ":["كوبي","انسخ","تكرار","copy"],
 "نقل":["حرك","حرّك","زحزح","انقل","move"],
 "دوران":["لف","دور","تدوير","rotate"],
 "مرآه":["عكس","انعكاس","مرايه","mirror"],
 "ازاحه":["اوفست","موازي","offset"],
 "درج":["سلم","سلالم","دروج","stairs","stair"],
 "عمود":["عامود","اعمده","عواميد","column","col"],
 "كمره":["جسر","بيم","جسور","beam"],
 "قاعده":["قواعد","فوتنج","اساس","footing"],
 "بلاطه":["سقف خرساني","سلاب","slab"],
 "دش":["دوش","شاور","shower"],
 "مغسله":["حوض","لافابو","مغسل","sink","basin"],
 "كرسي":["مرحاض","تواليت","كرسي افرنجي","wc","toilet"],
 "مكيف":["تكييف","مكيّف","سبليت","تبريد","ac"],
 "اناره":["لمبه","نور","اضاءه","ضو","light"],
 "فيشه":["بريزه","مقبس","فيش","socket","outlet"],
 "مفتاح":["سويتش","مفاتيح","switch"],
 "سرير":["تخت","سراير","bed"],
 "كنبه":["كنب","صوفا","كنبايه","sofa"],
 "مطبخ":["كيتشن","kitchen"],
 "تصدير":["طلع","اطبع","حفظ باسم","export"],
 "طباعه":["اطبع","print","plot"],
 "حفظ":["سيف","احفظ","save"],
 "تراجع":["رجوع","ارجع","undo"],
 "تكبير":["زووم","كبر","zoom"],
 "ملاءمه":["ملائمه","اعرض الكل","fit"],
 "تهشير":["هاتش","تظليل","hatch"],
 "نص":["كتابه","كلام","text"],
 "طبقات":["لير","ليرات","layers","layer"],
 "طوابق":["دور","ادوار","طابق","levels","floor"],
 "كميات":["حصر","بوق","boq","quantities"],
 "تسعير":["اسعار","سعر","تكلفه","تكاليف","price","cost"],
 "تباين":["contrast","وضوح"],
 "خط":["font","حجم الخط","كبر الخط"],
 "لغه":["انجليزي","english","language","عربي"],
 "قالب":["نموذج","تمبليت","template"],
 "درس":["دروس","تعليم","شرح","tutorial","lesson"],
 "اعدادات":["ضبط","خيارات","settings","options"],
 "مساحه عمل":["دور","تخصص","role","workspace"],
 "مقطع":["قطاع","سكشن","section"],
 "واجهه":["فساد","elevation","facade"],
 "ثلاثي":["3d","مجسم","ثري دي"],
 "التقاط":["سناب","snap","osnap"],
 "شبكه":["جريد","grid"],
 "محاور":["محور","axes","axis"]
};
/* فهرسٌ عكسيّ يُبنى مرّةً: الكلمةُ العامّيّة ⇒ الأسماءُ المعتمدة */
let SYNIX=null;
function synIndex(){
 if(SYNIX)return SYNIX;
 SYNIX=new Map();
 Object.entries(SYN).forEach(([k,L])=>{
  const kk=normx(k);
  L.forEach(v=>{
   const vv=normx(v); if(!vv)return;
   if(!SYNIX.has(vv))SYNIX.set(vv,new Set());
   SYNIX.get(vv).add(kk);
  });
 });
 return SYNIX;
}
/* صياغاتٌ بديلةٌ للاستعلام — العبارةُ كلُّها أوّلاً ثم كلُّ كلمة.
   الأصلُ ليس منها (يُبحث به أولاً بالدرجة الكاملة). */
export function expand(raw){
 const q=normx(raw); if(!q)return [];
 const IX=synIndex(), out=new Set();
 if(IX.has(q))IX.get(q).forEach(k=>out.add(k));
 const W=q.split(" ");
 W.forEach((w,i)=>{
  const alt=IX.get(w); if(!alt)return;
  alt.forEach(k=>{const c=W.slice(); c[i]=k; out.add(c.join(" "))});
 });
 out.delete(q);
 return [...out].slice(0,8);
}
/* مسافةُ التحرير (Damerau المقيَّدة) مع سقفٍ يقطع الحساب مبكراً */
export function editDist(a,b,max=2){
 a=String(a||""); b=String(b||"");
 if(a===b)return 0;
 if(Math.abs(a.length-b.length)>max)return max+1;
 const n=a.length, m=b.length;
 let p2=null, p=Array.from({length:m+1},(_,j)=>j);
 for(let i=1;i<=n;i++){
  const c=[i]; let low=i;
  for(let j=1;j<=m;j++){
   const cost=a[i-1]===b[j-1]?0:1;
   let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+cost);
   if(p2&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,p2[j-2]+1);
   c.push(v); if(v<low)low=v;
  }
  if(low>max)return max+1;
  p2=p; p=c;
 }
 return p[m];
}
/* السماحُ بحسب الطول: كلمةٌ من ٣ أحرف تحتمل خطأً واحداً، ومن ٦ فأكثر خطأين */
export const tolOf=len=>len<3?0:(len<6?1:2);
/* درجةُ التسامح: كلُّ كلمةٍ في الاستعلام تجد أقربَ كلمةٍ في الكومة.
   -1 إن تعذّرت كلمةٌ واحدة. */
export function typoScore(hay,q){
 const Q=normx(q).split(" ").filter(Boolean);
 if(!Q.length)return -1;
 const H=normx(hay).split(" ").filter(Boolean);
 if(!H.length)return -1;
 let tot=0;
 for(const w of Q){
  const tol=tolOf(w.length);
  let best=tol+1;
  for(const h of H){
   /* بادئةٌ من الكلمة («جدا» ⇐ «جدار») تُعامَل كالكلمة كاملة */
   const hh=h.length>w.length+tol?h.slice(0,w.length+1):h;
   const d=Math.min(editDist(w,h,tol),editDist(w,hh,tol));
   if(d<best)best=d;
   if(!best)break;
  }
  if(best>tol)return -1;
  tot+=best;
 }
 return Math.max(1,300-tot*60-H.length);
}
/* الدرجةُ الموحَّدة: الحرفيّ ثم لوحةُ المفاتيح ثم المرادف ثم الإملاء.
   ما وجده score() يبقى كما هو بلا تغيير ⇒ لا يتراجع ترتيبٌ قائم. */
export function smartScore(hay,raw){
 const q=norm(raw); if(!q)return 0;
 let s=score(hay,q);
 const la=norm(toLat(raw));
 if(la!==q)s=Math.max(s,score(hay,la));
 if(s>=600)return s;
 const qx=normx(raw), hx=normx(hay);
 if(qx&&qx!==q)s=Math.max(s,score(hx,qx));
 for(const e of expand(raw)){
  const v=score(hx,e);
  if(v>0)s=Math.max(s,Math.min(650,v-20));
 }
 if(s>=150)return s;
 const t=typoScore(hay,raw);
 return Math.max(s,t);
}
