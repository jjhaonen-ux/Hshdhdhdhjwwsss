/* ═══ عقبُ الأدوات المدنية الكسولة ═══ مولَّد من السجلّ — لا يُحرَّر يدوياً
   npm run lazy:gen · يحرسه lazy-civil.test.js (إكمال م١ · ب٠-٣).
   الاسمُ والخياراتُ هنا، والوحدةُ الحقيقية تُحمَّل عند أول استعمال وتستبدل
   العقب (defTool يكتب فوق المعرّف نفسه). التحميلُ المسبق في الخمول يجعل
   الأداةَ جاهزةً غالباً قبل أول نقرة. */
import {defTool,TOOLS} from "../tools/registry.js";
const L=(d,f)=>{const o=TOOLS[d.id]; if(!o||o.lazy)defTool(Object.assign(d,{lazy:f}))};
const roof=()=>import("../tools/roof.js");
L({"id":"roof","alias":"rf سقف","label":"سقف","hint":"نقاط الحلقة · Enter أو C يُغلق · Esc يلغي · U يتراجع","opts":[{"k":"type","label":"النوع","type":"sel","items":[["flat","مسطح"],["gable","جمالون"],["hip","هرمي"],["shed","مائل"]],"def":"flat"},{"k":"slope","label":"الميل %","type":"num","def":5}]},roof);
const boqreport=()=>import("../tools/boqreport.js");
L({"id":"report","stay":1,"alias":"report تقرير","label":"تقرير العميل","hint":"يولّد تقرير HTML وجدول فتحات CSV ويُنزّلهما — قراءةٌ لا تعديل","opts":[{"k":"html","label":"نزّل تقرير HTML","type":"chk","def":1},{"k":"csv","label":"نزّل جدول الفتحات","type":"chk","def":1},{"k":"pdf","label":"نزّل جداول PDF","type":"chk","def":1}]},boqreport);
const elev=()=>import("../tools/elev.js");
L({"id":"elev","stay":1,"alias":"واجهة الواجهة elevation","label":"واجهة","arg":1,"hint":"يفرد الجدران الخارجية المواجهة · ELEV S أو ELEV 315 — ولا تتحدّث تلقائياً بعدها","opts":[{"k":"view","label":"الاتجاه","type":"sel","def":"S","items":[["S","جنوبية"],["N","شمالية"],["E","شرقية"],["W","غربية"],["ang","زاوية حرّة"]]},{"k":"ang","label":"الزاوية (°)","type":"num","def":"0"},{"k":"gap","label":"فاصل بين الفرود","type":"len","def":"0"},{"k":"fmt","label":"التصدير","type":"sel","def":"none","items":[["none","لا شيء"],["svg","SVG"],["dxf","DXF"],["pdf","PDF"]]},{"k":"save","label":"نزّل الملفّ","type":"chk","def":1}]},elev);
const section=()=>import("../tools/section.js");
L({"id":"section","alias":"مقطع قطاع sect","label":"مقطع","hint":"نقطتان لخطّ القطع · يُقطَع ما يعبره الخطّ بنطاقه — ولا يتحدّث تلقائياً بعدها","opts":[{"k":"tol","label":"نطاق القطع","type":"len","def":"0.30"},{"k":"back","label":"النظر من الجهة الأخرى","type":"chk","def":0},{"k":"unfold","label":"فرد تراكميّ بدل الموضع الحقيقي","type":"chk","def":0},{"k":"mark","label":"رمز المقطع (A-A)","def":""},{"k":"fmt","label":"التصدير","type":"sel","def":"none","items":[["none","لا شيء"],["svg","SVG"],["dxf","DXF"],["pdf","PDF"]]},{"k":"save","label":"نزّل الملفّ","type":"chk","def":1}]},section);
const sheet=()=>import("../tools/sheet.js");
L({"id":"vport","alias":"vp منفذ منفذ_ورقه","label":"منفذ ورقة","hint":"ركنا المستطيل في النموذج — يُسقَط على الورقة بمقياس المنفذ","ico":"sheet","opts":[{"k":"scale","type":"sel","label":"مقياس المنفذ","def":"0","items":[["0","تلقائي"],["50","1:50"],["100","1:100"],["200","1:200"],["500","1:500"],["1000","1:1000"]]}]},sheet);
L({"id":"detail","alias":"dc detail تفصيله وسم","label":"وسم تفصيلة","hint":"معرّف منفذ المصدر · معرّف الهدف · موضع الرمز على النموذج"},sheet);
L({"id":"addsheet","arg":1,"alias":"shnew ورقه_جديده اضف_ورقه","label":"ورقة جديدة","hint":"تُضاف ورقةٌ بالمقاس الافتراضي وتصير الجارية","ico":"sheet","own":1},sheet);
L({"id":"renamesheet","arg":1,"alias":"shren سم_الورقه اعد_تسميه","label":"إعادة تسمية الورقة","hint":"الاسمُ الجديد للورقة الجارية — يقبل وسيطاً بعد الأمر","ico":"sheet","own":1},sheet);
L({"id":"delsheet","alias":"shdel احذف_ورقه","label":"حذف ورقة","hint":"تُحذَف الورقةُ الجارية بمنافذها — ولا تُحذَف الأخيرة","ico":"del","own":1},sheet);
L({"id":"nextsheet","alias":"shnext الورقه_التاليه","label":"الورقة التالية","hint":"تنقّلٌ دوريٌّ إلى الورقة التالية","ico":"redo","own":1},sheet);
L({"id":"prevsheet","alias":"shprev الورقه_السابقه","label":"الورقة السابقة","hint":"تنقّلٌ دوريٌّ إلى الورقة السابقة","ico":"undo","own":1},sheet);
L({"id":"vpclip","alias":"vpc قص_المنفذ حد_المنفذ","label":"قص المنفذ","hint":"انقر خطّاً متعدّداً مغلقاً ليكون حدَّ المنفذ · «انزع» يُعيده مستطيلاً","ico":"sheet","opts":[{"k":"off","label":"انزع الحدّ","type":"chk","def":0,"hint":"يُعيد المنفذَ مستطيلاً — ثم انقر المنفذ"}]},sheet);
const clouds=()=>import("../tools/clouds.js");
L({"id":"cloud","alias":"rcl cloud سحابه مراجعه غيمه","label":"سحابة مراجعة","hint":"نقاط الحلقة · C أو Enter يغلق · نصف قطر الفَلَقة في الخيارات","opts":[{"k":"r","label":"نصف قطر الفَلَقة م","type":"len","def":"0.5"}]},clouds);
L({"id":"cloude","alias":"rcle سحابه_التحديد","label":"سحابة حول التحديد","hint":"حدّد عناصر مغلقة ثم شغّل الأمر · نصف القطر: rcle r=0.3","opts":[{"k":"r","label":"نصف قطر الفَلَقة م","type":"len","def":"0.5"}]},clouds);
const macros=()=>import("../tools/macros.js");
L({"id":"macrorec","arg":1,"alias":"rec سجل_ماكرو تسجيل_ماكرو","label":"تسجيل ماكرو","hint":"يبدأ تسجيل أوامرك · مرّةً ثانية يوقفه ويحفظه","own":1,"nojr":1,"noplan":1},macros);
L({"id":"macroplay","arg":1,"alias":"play شغل_ماكرو ماكرو","label":"تشغيل ماكرو","hint":"play <اسم> — خطوة تراجعٍ واحدة، وأيّ فشلٍ يُرجِع الكلّ","own":1,"nojr":1,"noplan":1},macros);
L({"id":"macrodel","arg":1,"alias":"delmacro احذف_ماكرو","label":"حذف ماكرو","hint":"delmacro <اسم>","own":1,"nojr":1,"noplan":1},macros);
L({"id":"macrolist","alias":"macros ماكروهات","label":"قائمة الماكروهات","hint":"يعرض الماكروهات المحفوظة","own":1,"nojr":1,"noplan":1},macros);
if(typeof document!=="undefined"){
 const idle=globalThis.requestIdleCallback||(f=>setTimeout(f,3000));
 idle(()=>{[roof,boqreport,elev,section,sheet,clouds,macros].forEach(f=>f().catch(()=>{}))});
}
