/* ═══ فهرس الحاسبات ═══ المرحلة ٣-أ و٣-ب و٣-ج و٣-د (42 حاسبة · الكود المعتمد BS 8110)
   حاسبةٌ جديدة = ملفُّ تعريفٍ في defs/ + سطرٌ هنا. لا شيءَ في الواجهة:
   اللوحةُ (ui/calcPanel.js) وCtrl+K والدليلُ والـPDF تقرأ calcList()
   فتظهر الحاسبةُ فيها كلّها تلقائياً — ويحرس ذلك phase3a-calc.test.js.
   هذا الملفّ والمحرّك كسولان: لا يدخلان رسمَ الإقلاع. */
import {defCalc,calcList,calcById,GROUPS,groupName} from "./engine.js";
import units from "./defs/units.js";
import shapes from "./defs/shapes.js";
import slope from "./defs/slope.js";
import triangle from "./defs/triangle.js";
import mixdesign from "./defs/mixdesign.js";
import concmat from "./defs/concmat.js";
import concvol from "./defs/concvol.js";
import formwork from "./defs/formwork.js";
import rebarwt from "./defs/rebarwt.js";
import barsarea from "./defs/barsarea.js";
import lapdev from "./defs/lapdev.js";
import spacing from "./defs/spacing.js";
/* المرحلة ٣-ب (v2.8.0): المباني والتشطيبات · الحفر والردم */
import masonry from "./defs/masonry.js";
import plaster from "./defs/plaster.js";
import paint from "./defs/paint.js";
import tiles from "./defs/tiles.js";
import insul from "./defs/insul.js";
import ceiling from "./defs/ceiling.js";
import excav from "./defs/excav.js";
import swell from "./defs/swell.js";
import trucks from "./defs/trucks.js";
/* المرحلة ٣-ج (v2.9.0): الأحمال · التربة والأساسات */
import loads from "./defs/loads.js";
import matwt from "./defs/matwt.js";
import beamdist from "./defs/beamdist.js";
import combos from "./defs/combos.js";
import wallload from "./defs/wallload.js";
import bearing from "./defs/bearing.js";
import footing from "./defs/footing.js";
import settle from "./defs/settle.js";
import earthp from "./defs/earthp.js";
/* المرحلة ٣-د (v2.10.0): المياه والصرف · الكهرباء والميكانيكا · الدرج والمنحدرات · حديد البلاطة */
import tank from "./defs/tank.js";
import septic from "./defs/septic.js";
import supplypipe from "./defs/supplypipe.js";
import drainpipe from "./defs/drainpipe.js";
import pipeslope from "./defs/pipeslope.js";
import hvac from "./defs/hvac.js";
import lux from "./defs/lux.js";
import cable from "./defs/cable.js";
import panel from "./defs/panel.js";
import stairs from "./defs/stairs.js";
import ramp from "./defs/ramp.js";
import slabbar from "./defs/slabbar.js";

export const DEFS=[units,shapes,slope,triangle,
 mixdesign,concmat,concvol,formwork,
 rebarwt,barsarea,lapdev,spacing,
 masonry,plaster,paint,tiles,insul,ceiling,
 excav,swell,trucks,
 loads,matwt,beamdist,combos,wallload,
 bearing,footing,settle,earthp,
 tank,septic,supplypipe,drainpipe,pipeslope,
 hvac,lux,cable,panel,
 stairs,ramp,slabbar];
DEFS.forEach(d=>{if(!calcById(d.id))defCalc(d)});

export {calcList,calcById,GROUPS,groupName};
export {CODE} from "./tables.js";

/* ═══ مداخلُ البحث (Ctrl+K) ═══ تُحقَن في palette.js بـ extendPalette */
export function paletteEntries(){
 const out=calcList().map(d=>({id:d.id,title:"حاسبة: "+d.title,sub:"حقيبة المهندس · "+groupName(d.group),
  hay:`${d.title} ${d.aliases||""} ${groupName(d.group)} حاسبه حاسبات حساب calculator calc حقيبه المهندس`}));
 /* المرحلة ٣-د: حاسبةٌ للعنصر المحدَّد على المخطّط (بلاطة · درج · غرفة) */
 out.push({id:"sel",title:"حاسبة للعنصر المحدَّد",sub:"حقيبة المهندس · بلاطة · قاعدة · درج · غرفة",
  hay:"حاسبه العنصر المحدد المحدّد بلاطه قاعده اساس درج غرفه تكييف لوكس حديد البلاطه calc selection slab footing stair room"});
 return out;
}
/* ═══ دروسُ الدليل ═══ درسٌ مولَّدٌ لكلّ حاسبة من تعريفها نفسِه */
export function calcLessons(){
 return calcList().map(d=>({
  id:"calc."+d.id, kind:"calc", calcId:d.id,
  title:"شرح حاسبة: "+d.title,
  level:1, minutes:2, prereqs:[], related:[],
  icon:"boq", placement:null,
  goals:[d.desc], why:d.formula.slice(),
  script:[], exercises:[], mistakes:[],
  faq:d.cases.slice(0,3).map(c=>({q:"مثال: "+c.n,a:c.src})),
  fixture:null,
  body:"المرجع: "+d.ref+"\nالنتيجة إرشادية وتتطلّب مراجعة واعتماد مهندس مرخّص.",
  aliases:String(d.aliases||"").split(/\s+/).filter(Boolean),
  hint:d.desc, destructive:false
 }));
}
