/* ═══ م٢ب · تتبّع الكائنات والامتداد ═══ (خطة تطوير أدوات الرسم · ف٤)
   · الاكتساب بالوقوف (DWELL) أو بالنقرة اللمسية، والوقوف الثاني يزيل، والحدّ MAX.
   · خطوط التتبّع أفقيّ/رأسيّ (وزيادات القطبي)، وتقاطع خطّين، والامتداد.
   · الالتقاط العاديّ يفوز دائماً، والتتبّع يُسأل حين لا مرشّح.
   · المسافة المباشرة على خطّ التتبّع («2.5» ثم Enter).
   · السيناريو ٦: محاذاةٌ مع طرفٍ بعيد بلا معرفة الإحداثي.
   · أمر track شفّاف · التهجير · شريط الحالة · شريحة اللمس · الكسل.
   التشغيل: node src/tests/otrack.test.js                              */
import {shim,shimCanvas,shimDOM,group,ok,eq,deep,summary,toolRig} from "./harness.js";
shim(); shimCanvas(); shimDOM();
const doc=globalThis.document;
for(const id of ["top","srchBtn","ribbon","tools","navbar","fabDock","thumb","qpCard","status",
 "touchBar","optbar","log","side","sideE","dynBox","cv"]){
 if(doc.getElementById&&doc.getElementById(id))continue;
 const e=doc.createElement(id==="cv"?"canvas":"div"); e.setAttribute("id",id); doc.body.appendChild(e);
}
if(!globalThis.window)globalThis.window={prompt:()=>null,confirm:()=>true};
const {readFileSync}=await import("node:fs");
const ST=await import("../core/state.js");
const RN=await import("../core/render.js");
const W=await import("../core/walls.js");
const PL=await import("../core/plines.js");
const STR=await import("../core/struct.js");
const R=await import("../tools/registry.js");
for(const f of await (await import("node:fs")).promises.readdir(new URL("../tools/",import.meta.url))){
 if(f.endsWith(".js"))await import(`../tools/${f}`);
}
const CV=await import("../ui/canvas.js");
const TB=await import("../ui/touchbar.js");
const SB=await import("../ui/statusbar.js");
const S=()=>ST.S;
const rig=toolRig(R);
const src=f=>readFileSync(new URL("../"+f,import.meta.url),"utf8");

group("م٢ب · الكسل: otrack.js خارج الإقلاع",()=>{
 ok(!/^\s*import[^;]*otrack\.js/m.test(src("ui/canvas.js")),"canvas.js لا يستورده ساكناً");
 ok(/import\("\.\.\/core\/otrack\.js"\)/.test(src("ui/canvas.js")),"بل حركياً عند أوّل تشغيل");
 ok(!/otrack\.js/.test(src("app.js")),"ولا app.js");
 eq(CV.otMod(),null,"لم يُحمَّل قبل أن يُشغَّل التتبّع");
});

await CV.otLoad();
const OT=await import("../core/otrack.js");   /* الوحدة نفسها التي حمّلها canvas */
ok(CV.otMod()===OT||CV.otMod().ACQ===OT.ACQ,"canvas حمّل الوحدة نفسها");
const setup=()=>{
 R.cancel(true); OT.clear();
 ST.newState(); ST.ensureShape(); RN.invalidate();
 W.addWall([0,0],[4000,0],150,"int","c");
 W.addWall([8000,3000],[8000,6000],150,"int","c");
 ST.touchGeom(); RN.invalidate();
 CV.V.k=0.05; S().rb.otrack=1; S().rb.ortho=0; S().rb.polar=0;
};

group("م٢ب · الاكتساب والإزالة والحدّ",()=>{
 setup();
 eq(OT.MAX,5,"الحدّ خمس نقاط"); eq(OT.DWELL,400,"والوقوف 400 م.ث");
 eq(OT.acquire({p:[0,0],m:"end"}),"add","الأولى تُكسَب");
 eq(OT.ACQ.length,1,"نقطةٌ واحدة");
 eq(OT.acquire({p:[0,0],m:"end"}),"del","الثانية على النقطة نفسها تزيلها");
 eq(OT.ACQ.length,0,"لا شيء");
 for(let i=0;i<6;i++)OT.acquire({p:[i*1000,0],m:"end"});
 eq(OT.ACQ.length,5,"السادسة لا تتجاوز الحدّ");
 deep(OT.ACQ[0].p,[1000,0],"وتُخرج أقدمَها");
 eq(OT.acquire(null),null,"لا مرشّح ⇒ لا شيء");
 eq(OT.stateOf().n,5,"stateOf يعدّ"); eq(OT.stateOf().on,true,"ويقرأ التشغيل");
 OT.clear(); eq(OT.ACQ.length,0,"clear يمسح");
});

group("م٢ب · الوقوف: 400 م.ث تكسب، وأقرب/موازٍ لا تُكسَبان",()=>{
 setup();
 const c={p:[4000,0],m:"end"};
 eq(OT.dwell(c,1000),null,"أوّلُ مرّة: يبدأ العدّ");
 eq(OT.dwell(c,1300),null,"300 م.ث لا تكفي");
 eq(OT.dwell(c,1400),"add","400 م.ث تكسب");
 eq(OT.dwell(c,2000),null,"البقاء نفسه لا يكسب مرّتين");
 eq(OT.dwell({p:[9,9],m:"near"},3000),null,"«أقرب» لا تُكسَب");
 eq(OT.dwell({p:[9,9],m:"par"},3000),null,"«موازٍ» لا تُكسَب");
 eq(OT.dwell(c,5000),null,"العودة تبدأ عدّاً جديداً");
 eq(OT.dwell(c,5400),"del","ووقوفٌ ثانٍ يزيلها");
 eq(OT.ACQ.length,0,"فلا نقطة");
});

group("م٢ب · اتجاهات الامتداد",()=>{
 setup();
 deep(OT.extOf([4000,0]),[0],"طرف الجدار الأيمن يمتدّ نحو 0°");
 deep(OT.extOf([0,0]),[180],"والأيسر نحو 180°");
 deep(OT.extOf([8000,6000]),[90],"والعلوي نحو 90°");
 PL.addPline([[10000,0],[12000,2000]]); STR.addBeam([20000,0],[20000,3000],300,600,"conc");
 ST.touchGeom(); RN.invalidate();
 deep(OT.extOf([12000,2000]),[45],"الخطّ المتعدّد المفتوح يمتدّ من طرفه");
 deep(OT.extOf([20000,0]),[270],"والكمرة من طرفها");
 deep(OT.extOf([50000,50000]),[],"لا كيان ⇒ لا امتداد");
});

group("م٢ب · خطوط التتبّع: إسقاطٌ وتقاطعٌ وشعاع",()=>{
 setup();
 OT.acquire({p:[8000,6000],m:"end"});
 let r=OT.trackSnap(2000,6100,320,{});
 deep(r.p,[2000,6000],"الأفقيّ من النقطة: إسقاط المؤشّر عليه");
 eq(r.m,"trk","نوعه تتبّع"); deep(r.dd.o,[8000,6000],"ومعه أصل المسافة المباشرة");
 eq(OT.label(r),"تتبّع 180°","والوسم");
 r=OT.trackSnap(8100,9000,320,{});
 eq(r&&r.lines[0].ext,1,"فوق الطرف: الامتداد (90°)"); ok(/^امتداد/.test(OT.label(r)),"ووسمه «امتداد»");
 eq(OT.trackSnap(8100,9000,50,{}),null,"خارج التفاوت لا شيء");
 OT.acquire({p:[0,0],m:"end"});
 r=OT.trackSnap(100,6100,320,{});
 eq(r.m,"trk2","قرب تقاطع خطّين: تقاطع تتبّع"); deep(r.p,[0,6000],"عند (0،6000)");
 eq(OT.label(r),"تقاطع تتبّع","ووسمه");
 r=OT.trackSnap(5000,6200,320,{base:[5000,0],ray:90});
 deep(r&&r.p,[5000,6000],"مع شعاع من الأساس: التقاطع على الشعاع نفسه");
 eq(OT.trackSnap(4000,-500,320,{mode:"polar",inc:45,extra:[]}),null,"خلف النقطة لا خطّ (شعاعٌ لا خطّ مزدوج)");
 r=OT.trackSnap(3000,3050,320,{mode:"polar",inc:45,extra:[]});
 ok(r&&r.lines.some(l=>Math.abs(l.a-45)<1e-6),"القطبي يضيف زياداته (45°)");
 OT.clear(); eq(OT.trackSnap(0,0,320,{}),null,"بلا نقاط لا سؤال");
});

group("م٢ب · في canvas: الالتقاط العاديّ يفوز، والتتبّع حين لا مرشّح",()=>{
 setup(); R.begin("wall");
 CV.snap(8000,6010,null,null);
 eq(CV.UI.osnap&&CV.UI.osnap.m,"end","طرف الجدار ملتقَط");
 eq(CV.otTapAt([8000,6010]),"add","النقرة المسلّحة تكسبه");
 eq(R.T.i,0,"ولا تضع نقطة (الخطوة كما هي)"); eq(S().walls.length,2,"ولا جدار");
 const p=CV.snap(2000,6100,null,null);
 deep(p,[2000,6000],"بعيداً عن أي مرشّح: على خطّ التتبّع");
 eq(CV.UI.track&&CV.UI.track.tag,"تتبّع 180°","والوسم في الشريط");
 ok(!!R.T.otk,"والمسافة المباشرة مسلّحة");
 CV.snap(4000,40,null,null);
 eq(CV.UI.osnap&&CV.UI.osnap.m,"end","قرب طرفٍ آخر: الالتقاط العاديّ يفوز");
 ok(!CV.UI.track,"ولا خطّ تتبّع");
 S().rb.otrack=0;
 deep(CV.snap(2000,6100,null,null),[2000,6100],"التتبّع مُوقف ⇒ لا خطوط");
 S().rb.otrack=1; R.cancel(true);
 CV.snap(0,0,null,null); eq(OT.ACQ.length,0,"بلا أداة فعّالة تُمسح النقاط المكتسبة");
});

group("م٢ب · المسافة المباشرة على خطّ التتبّع",()=>{
 setup(); R.begin("wall"); OT.acquire({p:[8000,6000],m:"end"});
 R.T.ghost=CV.snap(2000,6100,null,null);
 rig.clear(); R.feedText("2.5");
 deep(R.baseOf(),[5500,6000],"«2.5» ⇒ 2.5 م من النقطة المكتسبة على الخطّ");
 eq(rig.errs().length,0,"بلا خطأ");
 R.cancel(true);
});

group("م٢ب · السيناريو ٦: محاذاة مع طرفٍ بعيد بلا معرفة الإحداثي",()=>{
 setup(); R.begin("wall");
 R.feedPoint([0,0],[0,0]);                       /* أوّل الجدار عند الأصل */
 S().rb.ortho=1;
 CV.snap(8000,6010,R.osBase(),R.snapBase());
 eq(CV.UI.osnap,null,"مع التعامد يُسقَط الطرفُ البعيد عن الشعاع من الالتقاط");
 ok(!!CV.UI.osAcq,"لكنه يبقى مرشّحاً للاكتساب");
 eq(CV.otTapAt([8000,6010]),"add","فيُكسَب (نقرة اكتساب)");
 const p=CV.snap(30,5900,R.osBase(),R.snapBase());                       /* شعاع رأسيّ ∩ أفقيّ التتبّع */
 deep(p,[0,6000],"النقطة على الشعاع الرأسي وعلى منسوب الطرف البعيد");
 R.feedPoint(p,[30,5900]); R.enter();
 const w=S().walls[2];
 ok(!!w,"جدارٌ جديد"); deep(w&&[w.a,w.b],[[0,0],[0,6000]],"طرفه الثاني في محاذاةٍ تامة");
 S().rb.ortho=0; R.cancel(true);
});

group("م٢ب · أمر track شفّاف، وكلمته ليست أداة",()=>{
 setup();
 for(const w of ["track","تتبع","تتبّع"])ok(!R.findTool(w),`«${w}» ليست أداة ولا اسماً مستعاراً`);
 let n=0; const h=R.H.track; R.H.track=()=>{n++};
 R.begin("wall"); R.feedPoint([0,0],[0,0]);
 R.feedText("track"); R.feedText("تتبّع");
 eq(n,2,"يبدّل التتبّع"); ok(R.active()&&R.T.def.id==="wall","دون أن يقطع الأداة");
 deep(R.baseOf(),[0,0],"ولا يمسّ النقطة");
 R.H.track=h; R.cancel(true);
});

group("م٢ب · التهجير وشريط الحالة",()=>{
 ST.newState(); S().rb.otrack="x"; ST.ensureShape();
 eq(S().rb.otrack,1,"قيمة غير رقمية صادقة ⇒ 1");
 S().rb.otrack=undefined; ST.ensureShape(); eq(S().rb.otrack,0,"الغائبة ⇒ 0 (الافتراضي مُوقف)");
 const it=SB.ITEMS.find(x=>x.id==="otrack");
 ok(!!it&&it.rb==="otrack","مفتاحٌ في شريط الحالة (بلا مفتاح F جديد)");
 ok(!/F1[12]/.test(JSON.stringify(it)),"ولا يحجز F11/F12");
 ok(TB.AIDS.some(a=>a.k==="otrack"),"ومفتاحٌ في لوحة المساعدات (اللمس)");
 S().rb.otrack=0; eq(TB.toggleAid("otrack"),true,"يشغّله"); eq(TB.toggleAid("otrack"),false,"ويوقفه");
});

group("م٢ب · اللمس: شريحة «تتبّع» ثم نقرة",()=>{
 setup(); S().rb.otrack=0;
 const st={p:"نقطة"};
 ok(!TB.barFor({id:"wall"},st,0,{pt:1,trk:false}).some(c=>c.k==="trk"),"التتبّع مُوقف ⇒ لا شريحة");
 ok(TB.barFor({id:"wall"},st,0,{pt:1,trk:true}).some(c=>c.k==="trk"),"مُشغّل وخطوة نقطة ⇒ الشريحة");
 ok(!TB.barFor({id:"wall"},st,0,{pt:0,trk:true}).some(c=>c.k==="trk"),"خطوة غير نقطة ⇒ لا شريحة");
 R.begin("wall");
 ok(TB.runTouch("trk"),"الشريحة تعمل"); eq(S().rb.otrack,1,"وتشغّل التتبّع إن كان مُوقفاً");
 eq(R.T.otTap,1,"وتسلّح النقرة التالية");
 eq(CV.otTapAt([4000,30]),"add","النقرة تكسب"); eq(R.T.otTap,0,"والتسليح لمرّة");
 eq(R.T.i,0,"ولا تضع نقطة");
 eq(CV.otTapAt([60000,60000]),null,"لا نقطة التقاط ⇒ لا اكتساب");
 R.cancel(true); eq(R.T.otTap,0,"الإلغاء يمسح التسليح");
});

summary();
