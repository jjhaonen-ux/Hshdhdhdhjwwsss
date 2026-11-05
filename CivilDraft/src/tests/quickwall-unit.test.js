/* ═══ م١أ · وحدة «جدار سريع» ═══
   كان الرقم المجرّد مليمتراً فيُرفض 3.6 بـ«الطول أقل من 5 سم».
   الآن الرقم المجرّد متر، والتعبير الحسابي يعمل في الطول. */
import assert from "node:assert/strict";
import {normalizeDimension,INPUT_UNIT,BIG_BARE} from "../core/dimension-input.js";
assert.equal(INPUT_UNIT,"m","وحدة إدخال المشروع: المتر");
assert.equal(BIG_BARE,100000,"عتبة التنبيه 100 م");
import {exLoad} from "../core/exq.js";
/* الرقم البسيط لا ينتظر المحلّل */
assert.equal(normalizeDimension("3.6","m"),3600);
await exLoad();
assert.equal(normalizeDimension("3.6","m"),3600);
assert.equal(normalizeDimension("3.6",'m'),3600);
assert.equal(normalizeDimension("3.6+0.15","m"),3750);
assert.equal(normalizeDimension("3600mm","m"),3600);
assert.equal(normalizeDimension("٣٫٦","m"),3600);
assert.equal(normalizeDimension("1200"),1200,"الافتراضي للدالّة نفسها ما زال مليمتر");
console.log("quickwall unit: ok");

/* الأداة نفسها: 3.6 تُقرأ 3.6 م، والمجرّد الكبير يُنبَّه عليه */
{
 const {shim,shimCanvas,shimDOM,toolRig,group,ok}=await import("./harness.js");
 shim(); shimCanvas(); shimDOM();
 const {readdirSync}=await import("node:fs");
 const {fileURLToPath}=await import("node:url");
 const HERE=fileURLToPath(new URL(".",import.meta.url));
 const ST=await import("../core/state.js");
 for(const f of readdirSync(HERE+"../tools").filter(f=>f.endsWith(".js")))await import(`../tools/${f}`);
 const R=await import("../tools/registry.js");
 const RN=await import("../core/render.js");
 const EN=await import("../core/ents.js");
 const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,150,k),invalidate:()=>RN.invalidate()});
 ST.newState(); ST.ensureShape(); rig.clear();
 R.begin("quickwall"); rig.at(0,0); rig.type("3.6"); rig.type("0");
 assert.equal(ST.S.walls.length,1,"جدار واحد");
 assert.equal(Math.round(Math.hypot(ST.S.walls[0].b[0]-ST.S.walls[0].a[0],ST.S.walls[0].b[1]-ST.S.walls[0].a[1])),3600,"طوله 3.6 م");
 /* المجرّد الكبير يُقبل بوحدة المشروع مع تنبيه يذكر البديل */
 if(R.active())R.cancel(true);
 ST.newState(); ST.ensureShape(); rig.clear();
 R.begin("quickwall"); rig.at(0,0); rig.type("3600"); rig.type("0");
 assert.ok(rig.said(/فُسّر 3600 م؟ اكتب 3600mm/),`التنبيه: ${rig.last()}`);
 if(R.active())R.cancel(true); rig.clear();
 R.begin("quickwall"); rig.at(0,5000); rig.type("3600mm"); rig.type("90");
 assert.ok(!rig.said(/فُسّر/),"3600mm بلا تنبيه");
 console.log("quickwall tool: ok");
}
