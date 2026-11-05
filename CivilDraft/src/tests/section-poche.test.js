/* ═══ اختبار poché المقطع ═══ يثبت أن opt.poche اختياريٌّ لا يُغيّر
   السلوك الافتراضي، وأن "solid"/"hatch" يضيفان أوّليةً واحدةً لكل
   شكل جدارٍ (لا للفتحات) فوق الخطوط لا بدلاً منها.
   التشغيل: node src/tests/section-poche.test.js */
import {shim,shimCanvas,group,eq,ok,summary} from "./harness.js";
shim(); shimCanvas();

const {S,newState,ensureShape}=await import("../core/state.js");
const {addWall}=await import("../core/walls.js");
const {addOpen}=await import("../core/opens.js");
const {section,sectPrims,buildSect}=await import("../core/section.js");

const build=()=>{
 newState();
 addWall([0,0],[6000,0],250,"ext","c");
 addWall([6000,0],[6000,4000],250,"ext","c");
 addWall([6000,4000],[0,4000],250,"ext","c");
 addWall([0,4000],[0,0],250,"ext","c");
 const w5=addWall([3000,0],[3000,4000],150,"int","c");
 addOpen(w5,2000,"door",900,2100,0);
};
const A=[-1000,2000], B=[7000,2000];
/* ═══ تصحيحُ الاختبار (المرحلة ١ من خطة التطوير) ═══
   كُتب هذا الملفّ قبل «الفتحةُ المقطوعةُ فراغ» (المرحلة ٧ · sect-void.test.js):
   كان يفترض أوّليةً واحدةً لكل شكل. الآن الجدارُ قطعٌ صلبةٌ بين الفتحات
   النافذة، والبابُ فراغٌ لا يُرسَم. فالعدّ الصحيح يُشتقّ من السلوك المعتمد:
   «قطع الجدران» + «الفتحات المرسومة» — وpoche يضيف واحدةً لكل قطعة جدار. */
const drawnOpen=s=>s.role!=="wall"&&!(s.role==="open"&&s.kindOf!=="window"&&s.kindOf!=="fixed");
const base=t=>sectPrims(t,0,0);
const wallPieces=t=>base(t).length-t.shapes.filter(drawnOpen).length;

group("poche غائبٌ — السلوك القديم بلا تغيير",()=>{
 build();
 const t=section(A,B);
 const pr=sectPrims(t,0,0);
 eq(pr.length,wallPieces(t)+t.shapes.filter(drawnOpen).length,
  "عددها: قطعُ الجدران + الفتحاتُ المرسومة — بلا زيادة");
 ok(wallPieces(t)>=t.shapes.filter(s=>s.role==="wall").length-1,
  "والبابُ المقطوع لا يُرسَم (فراغ)");
 ok(pr.every(g=>g.t==="poly"),"كلُّها poly كما كانت");
});

group('poche:"none" صريحاً — نفس النتيجة',()=>{
 build();
 const t=section(A,B);
 const pr=sectPrims(t,0,0,{poche:"none"});
 eq(JSON.stringify(pr),JSON.stringify(base(t)),"لا زيادة — مطابقٌ للغياب حرفاً");
});

group('poche:"solid" — تسويدٌ خلف كل شكل جدارٍ وحده',()=>{
 build();
 const t=section(A,B);
 const wallShapes=t.shapes.filter(s=>s.role==="wall").length;
 const pr=sectPrims(t,0,0,{poche:"solid"});
 eq(pr.length,base(t).length+wallPieces(t),
  "أوّليةٌ إضافيّةٌ واحدة لكل قطعة جدارٍ فقط");
 const fills=pr.filter(g=>g.t==="fill");
 eq(fills.length,wallPieces(t),"عدد التسويدات كعدد قطع الجدران");
 ok(fills.every(g=>g.style==="solid"),"نمطُها solid");
 eq(JSON.stringify(pr.filter(g=>g.t==="poly")),JSON.stringify(base(t)),
  "الخطوطُ القديمة كلُّها باقيةٌ كما هي");
});

group('poche:"hatch" — هاشورٌ بدل التسويد',()=>{
 build();
 const t=section(A,B);
 const wallShapes=t.shapes.filter(s=>s.role==="wall").length;
 const pr=sectPrims(t,0,0,{poche:"hatch"});
 const hatches=pr.filter(g=>g.t==="hatch");
 eq(hatches.length,wallPieces(t),"عدد الهاشورات كعدد قطع الجدران");
 ok(hatches.every(g=>g.pat==="ANSI31"),"نمطُها ANSI31");
});

group("poche لا يمسّ الفتحات",()=>{
 build();
 const t=section(A,B);
 const openShapes=t.shapes.filter(s=>s.role!=="wall").length;
 ok(openShapes>0,"توجد فتحةٌ في هذا المقطع");
 const pr=sectPrims(t,0,0,{poche:"solid"});
 eq(pr.filter(g=>g.t==="fill").length,wallPieces(t),
  "التسويد للجدران وحدها — لا شيء منه للفتحة");
});

summary();
