/* M3A — حروف الخطوات لا تحجب أسماء الأدوات */
import {shim,shimCanvas,shimDOM,group,ok,summary} from "./harness.js";
shim();shimCanvas();shimDOM();
for(const f of ["draw","sketch","openings","parts","roof","areas","modify",
 "annotate","ref","boq","boqreport","elev","section","sheet","clouds",
 "groups","macros"])await import(`../tools/${f}.js`);
const R=await import("../tools/registry.js");
const aliases=new Set();
R.toolList().forEach(d=>{
 aliases.add(String(d.id||"").toLowerCase());
 String(d.alias||"").split(/\s+/).filter(Boolean)
  .forEach(a=>aliases.add(a.toLowerCase()));
});
group("stepkey-collision — F/E/Q/L/S/B",()=>{
 for(const k of ["f","e","q","l","s","b"])
  ok(!aliases.has(k),`${k.toUpperCase()} غير محجوز كاسم أداة أو لقب`);
});
process.exit(summary());