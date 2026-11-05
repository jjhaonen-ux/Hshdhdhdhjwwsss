/* M3A — دمج الخطوط المتعددة مع إبقاء اتجاه الأقواس */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,near,deep,summary} from "./harness.js";
shim();shimCanvas();shimDOM();
const ST=await import("../core/state.js");
const {S,newState,undo,clearHistory}=ST;
const EN=await import("../core/ents.js");
const PL=await import("../core/plines.js");
const R=await import("../tools/registry.js");
await import("../tools/draw.js");
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k)});
const reset=()=>{
 if(R.active())R.cancel(true);
 newState();clearHistory();rig.clear();R.loadOpts();rig.defs("pjoin");
};
group("pjoin — تقارب النهايات والتراجع",()=>{
 reset();
 const a=PL.addPline([[0,0],[1000,0]],{bulge:[0.2,0]});
 const b=PL.addPline([[1001,0],[2000,0]],{bulge:[0.35,0]});
 R.begin("pjoin");rig.type(a.id);rig.type(b.id);
 eq(S.plines.length,1,"طرفان ضمن 2 مم يندمجان");
 deep(S.plines[0].pts,[[0,0],[1000,0],[2000,0]],"تُطابق نقطة الالتقاء دون ضلع قصير");
 near(S.plines[0].bulge[0],0.2,1e-8,"قوس الخط الأول محفوظ");
 near(S.plines[0].bulge[1],0.35,1e-8,"قوس الخط الثاني محفوظ");
 undo();eq(S.plines.length,2,"خطوة تراجع واحدة تعيد الخطين");
 reset();
 const left=PL.addPline([[0,0],[1000,0]],{bulge:[0.2,0]});
 const rev=PL.addPline([[2000,0],[1001,0]],{bulge:[0.35,0]});
 R.begin("pjoin");rig.type(left.id);rig.type(rev.id);
 deep(S.plines[0].pts,[[0,0],[1000,0],[2000,0]],"يُعكس اتجاه الخط الثاني عند الحاجة");
 near(S.plines[0].bulge[1],-0.35,1e-8,"قوس الخط المعكوس يحفظ اتجاهه الصحيح");
 reset();
 const x=PL.addPline([[0,0],[1000,0]]),y=PL.addPline([[1150,0],[2000,0]]);
 R.begin("pjoin");rig.type(x.id);rig.type(y.id);
 eq(S.plines.length,2,"المسافة الأكبر من 2 مم ترفض الدمج");
 ok(rig.errs().some(e=>/الطرفان متباعدان.*الحد/.test(e)),"رسالة الرفض تذكر المسافة والحد");
});
process.exit(summary());