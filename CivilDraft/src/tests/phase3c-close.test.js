/* ═══ إغلاق ٣-ج وتثبيت BS 8110 كوداً وحيداً للمشروع (v2.9.1) ═══
   قبل هذا الإصدار: الحاسباتُ على BS 8110 لكنّ معلومات المشروع تتيح اختيار
   ACI/SBC/ECP/«BS-Eurocode» كأنها كودُ حسابٍ ثانٍ — تناقضٌ يراه المستخدم.
   الآن:
   ١ · المصدرُ واحد: DESIGN_CODE في projinfo = CODE.id في calc/tables
   ٢ · الأكوادُ القديمة تبقى تسميةً (لا يضيع محفوظ) وكلٌّ منها بتلميح
   ٣ · الاسمُ المطبوع على الورقة نظيفٌ لا يحمل تلميح القائمة
   ٤ · التناقضُ يُكشَف صراحةً، والفارغُ ليس تناقضاً
   ٥ · الواجهة: القائمة بتلميحاتها، واللوحةُ تنبّه، وبلا إنترنت وبلا تغيير في الإقلاع
   ٦ · لا تغيير في مخرجات المشاريع القديمة (الفارغُ لا يُطبَع)
   التشغيل:  node src/tests/phase3c-close.test.js */
import {shim,group,ok,eq,summary} from "./harness.js";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
shim();
const PI=await import("../core/projinfo.js");
const T=await import("../calc/tables.js");
const E=await import("../calc/engine.js");
const C=await import("../calc/index.js");
const ROOT=join(fileURLToPath(new URL(".",import.meta.url)),"..","..");
const src=f=>readFileSync(join(ROOT,f),"utf8");

group("١ · مصدرٌ واحد لكود التصميم",()=>{
 eq(PI.DESIGN_CODE,"bs8110","DESIGN_CODE = bs8110");
 eq(PI.DESIGN_CODE,T.CODE.id,"يطابق CODE.id الذي تقرؤه الحاسبات");
 ok(PI.CODES[PI.DESIGN_CODE],"وهو من قائمة الأكواد");
 ok(/BS 8110/.test(E.codeLine()),"وكلُّ نتيجةٍ تطبع BS 8110");
});

group("٢ · الأكواد القديمة تبقى تسميةً وبتلميح",()=>{
 ["","bs8110","aci","sbc","ecp","bs"].forEach(k=>{
  ok(k in PI.CODES,`«${k||"فارغ"}» ما زال في CODES`);
  ok(typeof PI.CODE_NOTE[k]==="string"&&PI.CODE_NOTE[k].length>5,`ولها تلميحٌ «${k||"فارغ"}»`);
 });
 ["aci","sbc","ecp","bs"].forEach(k=>{
  eq(PI.normTitleExt({code:k}).code,k,`مشروعٌ محفوظٌ بـ«${k}» لا يفقد قيمته`);
  ok(/تسميةٌ فقط/.test(PI.CODE_NOTE[k])&&/BS 8110/.test(PI.CODE_NOTE[k]),`وتلميحُ «${k}» يقول إن الحساب BS 8110`);
 });
 eq(PI.normTitleExt({code:"bs8110"}).code,"bs8110","وbs8110 يُحفَظ");
 eq(PI.normTitleExt({code:"zzz"}).code,undefined,"والمجهول يُحذَف كما كان");
 ok(/الافتراضيّ/.test(PI.CODE_NOTE[""])&&/BS 8110/.test(PI.CODE_NOTE[""]),"والفارغ = افتراضيّ BS 8110");
});

group("٣ · الاسمُ المطبوع نظيف",()=>{
 const n=PI.codeName("bs8110");
 ok(/^BS 8110/.test(n),"يبدأ بـ BS 8110");
 ok(!/الحاسبات|الكود المعتمد|يُطبَع|تسميةٌ/.test(n),"بلا تلميح القائمة (يخرج على الورقة)");
 Object.keys(PI.CODES).filter(Boolean).forEach(k=>
  ok(!/تسميةٌ|يُطبَع|الافتراضيّ/.test(PI.codeName(k)),`«${k}» مطبوعاً بلا تلميح`));
 eq(PI.codeName(""),"","والفارغ لا اسم له");
});

group("٤ · كشف التناقض",()=>{
 eq(PI.codeConflict(""),false,"الفارغ ليس تناقضاً");
 eq(PI.codeConflict(undefined),false,"ولا غير المضبوط");
 eq(PI.codeConflict("bs8110"),false,"ولا BS 8110 نفسه");
 ["aci","sbc","ecp","bs"].forEach(k=>eq(PI.codeConflict(k),true,`«${k}» تناقضٌ مع كود التصميم`));
 eq(PI.codeConflict("zzz"),false,"والمجهول لا يُنبَّه (يُحذَف عند التطبيع)");
 eq(PI.conflictNote(""),"","لا تنبيه عند الفارغ");
 eq(PI.conflictNote("bs8110"),"","ولا عند BS 8110");
 const w=PI.conflictNote("sbc");
 ok(/SBC 304/.test(w)&&/BS 8110 وحده/.test(w),"والتنبيه يسمّي المسجَّل ويقول إن الحساب BS 8110 وحده");
});

group("٥ · لا تغيير في مخرجات المشاريع القديمة",()=>{
 const L=PI.infoLines({proj:"فيلا",owner:"س"});
 ok(!L.some(r=>r[0]==="الكود المعتمد"),"الفارغ لا يُطبَع في infoLines");
 const M=PI.infoLines({proj:"فيلا",code:"aci"});
 ok(M.some(r=>r[0]==="الكود المعتمد"&&r[1]==="ACI 318"),"والمسجَّل يُطبَع باسمه النظيف");
 const N=PI.infoLines({proj:"فيلا",code:"bs8110"});
 ok(N.some(r=>r[0]==="الكود المعتمد"&&r[1]==="BS 8110 (البريطاني)"),"وBS 8110 باسمه النظيف");
});

group("٦ · الواجهة وبلا إنترنت والإقلاع",()=>{
 const hub=src("src/ui/projhub.js"), cp=src("src/ui/calcPanel.js");
 ok(/CODE_NOTE/.test(hub)&&/codeLab/.test(hub),"المركز يعرض تلميح كل كود");
 ok(/CODES\.bs8110/.test(hub),"ويعرض الفارغ «BS 8110» لا «—»");
 ok(/conflictNote/.test(cp)&&/projCodeNote\(\)/.test(cp),"واللوحة تنبّه عند التناقض");
 ok(/from "\.\.\/core\/state\.js"/.test(cp)&&/from "\.\.\/core\/projinfo\.js"/.test(cp),"وتقرأ حالة المشروع من core");
 ok(/escapeHtml/.test(cp)&&!/innerHTML\s*=\s*[^;]*conflictNote/.test(cp),"والتنبيه مُهرَّب");
 const sw=src("sw.js");
 ok(sw.includes("./src/core/projinfo.js")&&sw.includes("./src/ui/calcPanel.js"),"sw.js يخزّنهما — بلا اتصال");
 ok(/VERSION="2\.(9|1\d)\.\d+"/.test(sw)&&/"version": "2\.(9|1\d)\./.test(src("package.json"))
  &&/VERSION="2\.(9|1\d)\./.test(src("src/core/version.js")),"الإصدار متّسق 2.9.x أو أحدث");
 ok(/"test:phase3c-close"/.test(src("package.json")),"npm run test:phase3c-close");
});

group("٧ · الخلطةُ: لا استثناءَ بعد اليوم (v2.11.0)",()=>{
 const mix=C.calcList().find(d=>d.id==="mixdesign");
 const r=E.runCalc(mix,E.defaults(mix),{});
 ok(r.ok,"تصميم الخلطة يعمل");
 ok(/DoE/.test(mix.ref)&&/BS 8110/.test(mix.ref),"بطريقة DoE/BRE وقيود الديمومة من BS 8110");
 ok(C.calcList().every(d=>!/ACI|ADA/.test(d.ref)),"لا حاسبةَ تستند مرجعها إلى ACI أو ADA");
});
summary();
