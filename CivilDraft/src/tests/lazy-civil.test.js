/* ═══ الأدوات المدنية الكسولة ═══ إكمال م١ (ب٠-٣ · شروط الشحن من نتائج م٠)
   العقبُ (ui/lazy-civil.js) يحمل اسمَ الأداة وخياراتِها ويحمّل وحدتَها عند أول
   استعمال. الخطرُ المقيس في م٠: المشغّلاتُ المتزامنة (قالبٌ · ماكرو · خطة)
   تبدأ الأداةَ وتغذّيها في الدقيقة نفسها، فقالبُ «فيلا العرض» فشل كاملاً
   والعقبُ وحده محمّل. هنا:
     ١ · الآلية على أداةٍ تركيبية: بدءٌ مؤجَّل، وطابورُ الإدخال بترتيبه، وإلغاءٌ
         أثناء التحميل، ورفضٌ في وضع الدفعة بسببه.
     ٢ · «فيلا العرض» والعقبُ وحده محمّل: تُرفَض قبل أن يُمَسّ شيء، ثم تنجح
         بعد التحميل مطابقةً للأصل (المحتوى نفسُه كما في showcase.test.js).
     ٣ · خطةٌ (trial) فيها أداةٌ كسولة: رفضٌ بسببه بلا أثر، ثم نجاح.
     ٤ · بيانات العقب = تعريف الأداة الحقيقي (الاسم · البدائل · الخيارات · الأعلام).
   التشغيل:  node src/tests/lazy-civil.test.js                             */
import {shim,shimCanvas,shimDOM,toolRig,group,ok,eq,summary} from "./harness.js";
import {readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
shim(); shimCanvas(); shimDOM();
const HERE=fileURLToPath(new URL(".",import.meta.url));
const ST=await import("../core/state.js");
const EN=await import("../core/ents.js");
const RN=await import("../core/render.js");
/* كلُّ وحدات الأدوات عدا السبع الكسولة — كما يُقلع التطبيق */
const LAZY=["roof","boqreport","elev","section","sheet","clouds","macros"];
for(const f of readdirSync(HERE+"../tools").filter(f=>f.endsWith(".js")&&!LAZY.includes(f.slice(0,-3))))
 await import(`../tools/${f}`);
const R=await import("../tools/registry.js");
const TP=await import("../core/templates.js");
await import("../tools/showcase.js");
await import("../tools/tplscript.js");
const RUN=await import("../ai/run.js");
/* لا تحميلَ مسبقاً في الخمول داخل الاختبار: يُستورَد العقبُ والمستند غائب
   (الشرطُ نفسُه الذي يمنع التحميل المسبق خارج المتصفّح) */
{const doc=globalThis.document; delete globalThis.document;
 await import("../ui/lazy-civil.js"); globalThis.document=doc}
const rig=toolRig(R,{hit:(x,y,k)=>EN.hitTest(x,y,250,k),invalidate:()=>RN.invalidate()});
const S=ST.S;
const fresh=()=>{ST.newState(); ST.ensureShape(); ST.clearHistory(); TP.installDefaults(); rig.clear()};
const n=k=>(S[k]||[]).length;
const tick=()=>new Promise(r=>setTimeout(r,0));
const IDS=["roof","report","elev","section","vport","detail","addsheet","renamesheet",
 "delsheet","nextsheet","prevsheet","vpclip","cloud","cloude","macrorec","macroplay","macrodel","macrolist"];
/* لقطةُ بيانات العقب قبل أن يستبدلها الحقيقيّ — للمطابقة في ٤ */
const plain=d=>{const o={}; Object.keys(d).forEach(k=>{
 if(typeof d[k]!=="function"&&k!=="steps"&&k!=="lazy")o[k]=d[k]}); return JSON.stringify(o)};
const STUB={}; IDS.forEach(id=>{const d=R.findTool(id); STUB[id]=d&&d.lazy?plain(d):null});

/* ═══ ١ · الآلية على أداةٍ تركيبية ═══ */
const mk=(id,log)=>({id,alias:id,label:"تجريبية "+id,hint:"x",
 steps:[{p:"نقطة",loop:1,each(ctx,p){log.push(p.join(","))}}],
 done(ctx){log.push("done:"+ctx.n)}});
const stubOf=(id,log,gate)=>({id,alias:id,label:"تجريبية "+id,hint:"x",
 lazy:()=>gate.then(()=>{R.defTool(mk(id,log))})});
let open1, gate1=new Promise(r=>open1=r);
const L1=[];
R.defTool(stubOf("lzt1",L1,gate1));
let mech={};
{
 fresh();
 mech.began=R.begin("lzt1");
 mech.active=R.active(); mech.stub=!!(R.T.def&&R.T.def.lazy);
 mech.prompt=R.promptText();
 mech.p1=R.feedPoint([1,2]); mech.p2=R.feedPoint([3,4]); mech.fin=R.finish();
 mech.before=L1.slice();                    /* لا شيءَ نُفِّذ قبل وصول الوحدة */
 open1(); await tick(); await tick();
 mech.after=L1.slice();
 mech.def=R.T.def&&R.T.def.lazy;
}
group("١ · بدءٌ مؤجَّل من الواجهة، وإدخالٌ بترتيبه",()=>{
 ok(mech.began===true&&mech.active&&mech.stub,"begin(عقب) يُرجِع true والأداةُ فعّالةٌ بصفة «تُحمَّل»");
 ok(/يُحمَّل/.test(mech.prompt.p),"والسطرُ يقول إنها تُحمَّل");
 ok(mech.p1===true&&mech.p2===true&&mech.fin!==false,"والنقراتُ وfinish تُقبَل ولا تُرفَض");
 eq(mech.before.length,0,"ولا يُنفَّذ شيءٌ قبل وصول الوحدة");
 eq(mech.after.join("|"),"1,2|3,4|done:2","وبعد الوصول تُعاد بترتيبها على الأداة الحقيقية");
 ok(!mech.def,"والجلسةُ للأداة الحقيقية لا للعقب");
 ok(!R.findTool("lzt1").lazy,"والعقبُ استُبدل في السجلّ");
});

let open2, gate2=new Promise(r=>open2=r);
const L2=[];
R.defTool(stubOf("lzt2",L2,gate2));
let canc={};
{
 fresh();
 const j0=n("walls");
 R.begin("lzt2"); R.feedPoint([9,9]);
 R.cancel(true);
 canc.active=R.active();
 open2(); await tick(); await tick();
 canc.log=L2.slice(); canc.active2=R.active(); canc.walls=n("walls")-j0;
}
group("١ب · الإلغاءُ أثناء التحميل",()=>{
 ok(!canc.active,"Esc يُنهي الجلسةَ المعلَّقة فوراً");
 eq(canc.log.length,0,"ولا يُنفَّذ بعد وصول الوحدة شيءٌ مما أُدخل");
 ok(!canc.active2,"ولا تنبعث الأداةُ من تلقاء نفسها");
});

let open3, gate3=new Promise(r=>open3=r);
const L3=[];
R.defTool(stubOf("lzt3",L3,gate3));
let bat={};
{
 fresh(); rig.clear();
 R.setBatch(1);
 try{bat.r=R.begin("lzt3")}finally{R.setBatch(0)}
 bat.errs=rig.errs(); bat.active=R.active();
 bat.guard=R.lazyGuard(["lzt3","wall"]); bat.noGuard=R.lazyGuard(["wall","door"]);
 open3(); await tick(); await tick();
 bat.loaded=!R.findTool("lzt3").lazy;
}
group("١ج · وضعُ الدفعة لا يُؤجِّل",()=>{
 eq(bat.r,false,"begin(عقب) داخل الدفعة يُرجِع false");
 ok(bat.errs.length===1&&/تُحمَّل الآن/.test(bat.errs[0]),"برسالةٍ تذكر السبب");
 ok(!bat.active,"ولا جلسةَ معلَّقة");
 ok(typeof bat.guard==="string"&&/تجريبية lzt3/.test(bat.guard),"وlazyGuard يسمّي الأداةَ الكسولة");
 eq(bat.noGuard,null,"ولا حارسَ على أدواتٍ محمّلة");
 ok(bat.loaded,"والتحميلُ بدأ فاكتمل");
});

/* ═══ ٢ · «فيلا العرض» والعقبُ وحده محمّل ═══ */
let cold={};
{
 fresh();
 const need=["roof","cloud","addsheet","vport"];   /* vport تُستدعى بدالةٍ مساعدة في showcase.js */
 cold.stubs=R.stubsOf(need).map(d=>d.id);
 const before=ST.snapshot();
 try{TP.apply("showcase"); cold.threw=false}
 catch(e){cold.threw=true; cold.msg=String(e&&e.message); cold.ids=e&&e.lazyIds}
 cold.untouched=ST.snapshot()===before;
 cold.counts0=n("walls")+n("opens")+n("roofs")+n("clouds")+n("sheets");
 cold.noActive=!R.active();
 await Promise.all((cold.ids||[]).map(R.ensureTool));
 rig.clear();
 R.setOpt("wall","t","0.3"); S.rb.ortho=1;
 try{cold.r=TP.apply("showcase")}catch(e){cold.err2=String(e&&e.message)}
 cold.errs=rig.errs();
 cold.n={walls:n("walls"),opens:n("opens"),areas:n("areas"),roofs:n("roofs"),clouds:n("clouds"),sheets:n("sheets")};
 cold.noActive2=!R.active();
 ST.undo(); cold.afterUndo=n("walls")+n("cols")+n("fixt");
 R.setOpt("wall","t","0.15");
}
group("٢ · فيلا العرض والعقبُ وحده محمّل",()=>{
 ok(cold.stubs.length===4,"الأدواتُ الأربع (سقف · سحابة · ورقة جديدة · منفذ ورقة) عقبٌ قبل التشغيل");
 ok(cold.threw,"القالبُ يُرفَض بدل أن يفشل في منتصفه");
 ok(/تُحمَّل الآن/.test(cold.msg||""),"برسالةٍ تذكر السبب لا «رُفض الإدخال»");
 eq((cold.ids||[]).slice().sort().join(" "),"addsheet cloud roof vport","ويحمل معرّفاتِ ما يُنتظَر (وجدها الحارسُ من النصّ كلِّه لا من قائمةٍ يدوية)");
 ok(cold.untouched&&cold.counts0===0,"ولا يُمَسّ المشروع (لا جدارَ ولا نصفَ قالب)");
 ok(cold.noActive,"ولا أداةٌ معلّقة");
 ok(cold.r&&cold.r.ok,"وبعد وصول الوحدات يكتمل");
 eq(cold.errs.length,0,"بلا رسالة خطأ من أيّ أداة");
 eq(JSON.stringify(cold.n),JSON.stringify({walls:11,opens:16,areas:7,roofs:1,clouds:1,sheets:1}),
  "ومحتواه مطابقٌ للأصل (11 جداراً · 16 فتحة · 7 مناطق · سقف · سحابة · ورقة)");
 ok(cold.noActive2,"ولا أداةٌ معلّقة بعده");
 eq(cold.afterUndo,0,"وتراجعٌ واحد يُرجِع المشروع فارغاً");
});

/* ═══ ٣ · خطةٌ (trial) فيها أداةٌ كسولة ═══ */
let plan={};
{
 fresh();
 /* أداةٌ كسولةٌ لم تُحمَّل بعد: «section» (لم يلمسها أيُّ مما سبق) */
 plan.stub=R.stubsOf(["section"]).length===1;
 const lines=[{kind:"tool",tool:"wall",s:"wall",i:1},{kind:"text",s:"0,0",i:2},{kind:"text",s:"3,0",i:3},
  {kind:"esc",i:4},{kind:"tool",tool:"section",s:"section",i:5}];
 const before=ST.snapshot();
 const r=RUN.trial(lines,{stopOnError:1});
 plan.errs=r.errs; plan.ran=r.ran; plan.made=r.made;
 plan.err=(r.res.find(x=>x.err)||{}).err||"";
 plan.at=(r.res.find(x=>x.err)||{}).tool;
 plan.untouched=ST.snapshot()===before&&n("walls")===0;
 await R.ensureTool("section");
 const r2=RUN.trial(lines.slice(0,4).concat([{kind:"tool",tool:"section",s:"section",i:5},{kind:"esc",i:6}]),{stopOnError:1});
 plan.errs2=r2.errs; plan.made2=r2.made;
 RUN.rollback(r2);
}
group("٣ · خطةٌ فيها أداةٌ كسولة",()=>{
 ok(plan.stub,"«section» عقبٌ قبل الخطة");
 eq(plan.errs,1,"تُرفَض الخطةُ بخطأٍ واحد");
 eq(plan.ran,0,"قبل أن يُنفَّذ أيُّ سطر");
 ok(/تُحمَّل الآن/.test(plan.err)&&plan.at==="section","والسببُ على سطر الأداة الكسولة");
 ok(plan.untouched,"ولا أثرَ في المشروع");
 eq(plan.errs2,0,"وبعد التحميل تنجح الخطةُ نفسُها");
 ok(plan.made2>=1,"وتُنشئ جداراً");
});

/* ═══ ٤ · بيانات العقب = تعريف الأداة الحقيقي ═══ */
let drift={};
{
 await R.ensureAllLazy();
 drift.left=R.stubsOf(IDS).length;
 drift.bad=[]; drift.alias=[];
 IDS.forEach(id=>{
  const d=R.findTool(id);
  if(!d||d.lazy||STUB[id]===null){drift.bad.push(id+": لم يُحمَّل/لم يكن عقباً"); return}
  if(plain(d)!==STUB[id])drift.bad.push(id+": بيانات العقب تخالف التعريف");
  String(d.alias||"").split(/\s+/).filter(Boolean).forEach(a=>{
   if(R.findTool(a)!==d)drift.alias.push(id+"/"+a);
  });
 });
}
group("٤ · العقبُ يطابق تعريفَ الأداة الحقيقي",()=>{
 eq(IDS.length,18,"ثماني عشرة أداةً في سبع وحدات");
 eq(drift.left,0,"بعد التحميل لا عقبَ باقٍ");
 eq(drift.bad.join(" ؛ "),"","الاسمُ والبدائلُ والتلميحُ والخياراتُ والأعلامُ مطابقة (وإلا شغّل: npm run lazy:gen)");
 eq(drift.alias.join(" "),"","وكلُّ بديلٍ يشير إلى الأداة الحقيقية لا إلى عقبٍ قديم");
});
summary();
