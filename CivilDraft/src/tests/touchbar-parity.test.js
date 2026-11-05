/* M3A — كل حرف خطوة له زر لمس ينفّذ المسار نفسه */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,summary} from "./harness.js";
shim();shimCanvas();
const DOC=shimDOM();
{const cv=DOC.createElement("canvas");cv.setAttribute("id","cv");DOC.body.appendChild(cv);}
const ST=await import("../core/state.js");
const {newState,clearHistory}=ST;
const EN=await import("../core/ents.js");
const R=await import("../tools/registry.js");
await import("../tools/draw.js");
const TB=await import("../ui/touchbar.js");
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k)});
const reset=()=>{
 if(R.active())R.cancel(true);
 newState();clearHistory();rig.clear();R.loadOpts();
 for(const id of ["wall","arcwall","rect","pline"])rig.defs(id);
};
function touchKey(id,step,key){
 const d=R.findTool(id), st=d.steps[step], btn=TB.barFor(d,st,0,{pt:false})
  .find(x=>x.k==="step:"+key);
 ok(!!btn,`${id}/${key}: يظهر الزر في خطوة الاستخدام`);
 return btn&&TB.runTouch(btn.k);
}
group("touchbar-parity — الجدار والمستطيل والخط المتعدد",()=>{
 reset();R.begin("wall");rig.at(0,0);
 ok(touchKey("wall",1,"f"),"F: اللمس ينفّذ خيار الخطوة");
 eq(R.OPT.wall.align,"l","F باللمس يغيّر محاذاة الجدار التالي");
 R.cancel(true);
 reset();R.begin("rect");
 ok(touchKey("rect",0,"e"),"E: اللمس ينفّذ خيار الخطوة");
 eq(R.OPT.rect.base,"center","E باللمس يبدّل نقطة الارتكاز إلى المركز");
 R.cancel(true);
 for(const [k,mode] of [["q","arc"],["l","line"],["s","3p"]]){
  reset();R.begin("pline");rig.at(0,0);rig.at(1000,0);
  ok(touchKey("pline",1,k),`${k.toUpperCase()}: يظهر وينفّذ زر اللمس`);
  eq(R.T.ctx.plMode,mode,`${k.toUpperCase()}: يضبط وضع الخط المتعدد`);
  R.cancel(true);
 }
});
process.exit(summary());