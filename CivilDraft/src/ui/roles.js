/* ═══ مساحاتُ العمل حسب الدور ═══ المرحلة ٢ من خطّة التطوير
   مرشِّحٌ فوق الشريط الفعّال (الأساس + تخصيص المستخدم) كوضع المبتدئ
   تماماً — لا شريطٌ ثانٍ. الدورُ يقول **أيَّ الألواح تظهر** في كلّ
   تبويب، والأدواتُ المخفيّة لا تُعطَّل: تبقى في البحث (Ctrl+K) وسطر
   الأوامر واختصاراتها. والدورُ تفضيلُ نافذةٍ (UIS.role) لا بياناتُ
   مشروع: لا يدخل pack() ولا التاريخ.

   كلُّ دورٍ: n اسمُه · s وصفُه · show {تبويب: "*" | [ألواح]} (غيرُ
   المذكور يُخفى) · tpl قوالبُه المقترحة أوّلاً · les دروسُه المقترحة ·
   beg يفرض وضعَ المبتدئ عند الاختيار (الطالب).
   و"" (كل الأدوات) غيابُ المرشِّح لا دورٌ سابع. */
export const ROLES={
 arch:{n:"معماري",s:"مخطّطات وفتحات وأثاث وواجهات",ico:"wall",
  show:{draw:"*",edit:"*",annt:"*",serv:["vert","san","elec","furn"],
   view:"*",out:["sht","vp","exp","hand"],mng:"*"},
  tpl:["villa","apt3","showcase","studio"],les:["l1","l3","l4","l13","l14"]},
 str:{n:"إنشائي",s:"محاور وأعمدة وكمرات وقواعد وبلاطات",ico:"col",
  show:{draw:["shapes","ref"],edit:["xform","ends","arr"],
   annt:["dims","txt","tbl","axg"],serv:["stru","vert"],
   view:"*",out:["sht","vp","exp","qty","hand"],mng:"*"},
  tpl:["grid10x9","showcase","villa"],les:["l3","l6","l13","l8"]},
 srv:{n:"مساح / طرق",s:"خطوط ومناسيب ومرجع DXF وأبعاد",ico:"pline",
  show:{draw:["shapes","free","areas","ref"],edit:"*",
   annt:["dims","txt","tbl","axg"],view:"*",out:["sht","vp","exp"],mng:"*"},
  tpl:["room"],les:["l3","l5","l16"]},
 site:{n:"مهندس موقع",s:"مراجعة وملاحظات وحصر وتسليم",ico:"inspect",
  show:{draw:["shapes","opens","areas","ref"],edit:["xform","ends"],
   annt:["dims","txt","rev"],serv:["stru","vert","san","elec"],
   view:["lays","look","aids"],out:["sht","exp","qty","hand"],mng:["set","fil","pan"]},
  tpl:["villa","apt3"],les:["l1","l8","l15"]},
 qs:{n:"مقدّر كميات",s:"حصر وتسعير وجداول وتقارير",ico:"boq",
  show:{draw:["shapes","opens","areas","ref"],edit:["xform","ends"],
   annt:["dims","tbl"],serv:["stru","vert","san"],
   view:["lays","look","aids"],out:["qty","exp","hand","sht"],mng:"*"},
  tpl:["villa","apt3","twin15"],les:["l8","l15","l16"]},
 stu:{n:"طالب",s:"الأدوات الأساسية مع الدروس",ico:"help",beg:1,
  show:null,tpl:["room","studio","showcase"],les:["l1","l2","l3","l9"]}
};
export const ROLE_IDS=Object.keys(ROLES);
export const ALL_NAME="كل الأدوات";
export const isRole=id=>Object.prototype.hasOwnProperty.call(ROLES,String(id||""));
export const roleOf=id=>isRole(id)?ROLES[id]:null;
export const roleName=id=>isRole(id)?ROLES[id].n:ALL_NAME;

/* المرشِّح — نقيٌّ: لا يمسّ الأساس، ولا يُرجِع شريطاً فارغاً أبداً */
export function roleRibbon(tabs,id){
 const r=roleOf(id);
 if(!r||!r.show)return tabs||[];
 const out=[];
 (tabs||[]).forEach(t=>{
  const sp=r.show[t.id];
  if(!sp)return;
  if(sp==="*"){out.push(t); return}
  const panels=(t.panels||[]).filter(p=>sp.includes(p.id));
  if(panels.length)out.push({...t,panels});
 });
 return out.length?out:(tabs||[]).slice();
}
/* ترتيبُ القوالب: المقترحةُ للدور أوّلاً ثم الباقي كما هو */
export function roleOrder(list,id,key){
 const r=roleOf(id), k=key||(x=>x);
 if(!r||!r.tpl)return (list||[]).slice();
 const pos=x=>{const i=r.tpl.indexOf(k(x)); return i<0?1e6:i};
 return (list||[]).slice().sort((a,b)=>pos(a)-pos(b));
}

/* ═══ اختيارُ الدور في أوّل تشغيل ═══ (v2.6.0)
   «مساحاتُ عملٍ تُختار عند أوّل تشغيل وتُبدَّل في أيّ وقت».
   خالصٌ: يُسأل مرّةً واحدة فقط — لا في الوضع الآمن، ولا على قشرة
   الهاتف (الكتالوج هناك مرتّبٌ بالفئة لا بالشريط)، ولا لمن اختار دوراً. */
export function shouldAskRole(uis,o){
 const u=uis||{}, q=o||{};
 if(q.safe||q.mobile)return false;
 if(u.roleAsked)return false;
 if(isRole(u.role))return false;
 return true;
}
/* رموزُ البطاقات — مصدرٌ واحدٌ لشاشة البداية ومركز المشروع */
export const ROLE_ICON={arch:"🏛️",str:"🧱",srv:"📐",site:"🦺",qs:"🧮",stu:"🎓"};
