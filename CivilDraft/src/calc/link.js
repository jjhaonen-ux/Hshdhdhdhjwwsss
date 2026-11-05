/* ربط الحاسبات بعناصر المخطّط — المرحلة ٣-د (v2.11.0: + القاعدة ⇒ أبعادها)
   كلُّ دالّةٍ تأخذ عنصراً من S وتُعيد {raw, units} جاهزاً لحقول الحاسبة
   (والعكسُ applyStair أسفل الملفّ: الكاتبةُ الوحيدة، عبر applyField والتراجع)
   (تتطابق مع openCalcPanel(id, pre)). خالصةٌ كلّها عدا applyStair: لا تكتب ولا تقرأ DOM.
   الوحدات: هندسة المشروع بالمليمتر، والحاسبات تقبل ما يُعطى بوحدته المعلَنة. */
import {S,edit,editFailed} from "../core/state.js";
import {applyField} from "../core/batch.js";
import {stGeoms} from "../core/stairs.js";
import {strPoly,strKind} from "../core/struct.js";
import {pArea,bboxOf} from "../core/geom.js";

const r3=x=>String(+(x/1000).toFixed(4));   /* مم ⇒ م بأربع منازل */
const pre=(raw,units)=>({raw,units:units||{}});

/* مساحة الغرفة (منطقة) ⇒ حاسبة التكييف والإضاءة: الطول والعرض من الصندوق المحيط */
export function areaPre(a){
 const ring=a&&a.ring;
 if(!Array.isArray(ring)||ring.length<3)return null;
 const bb=bboxOf(ring); if(!bb)return null;
 const L=bb.x1-bb.x0, W=bb.y1-bb.y0;
 const A=Math.abs(pArea(ring))/1e6;
 return {A:pre({A:String(+A.toFixed(3))},{A:"m2"}), lux:pre({L:r3(L),W:r3(W)})};
}
/* بلاطة مستطيلة ⇒ حاسبة حديد البلاطة: البُعدان من الصندوق والسماكة من البلاطة */
export function slabPre(e){
 const p=strPoly(e);
 if(!p||strKind(e)!=="slab")return null;
 const bb=bboxOf(p); if(!bb)return null;
 const Lx=bb.x1-bb.x0, Ly=bb.y1-bb.y0;
 return pre({Lx:r3(Lx),Ly:r3(Ly),th:String(e.th||150)},{Lx:"m",Ly:"m",th:"mm"});
}
/* درج ⇒ حاسبة تصميم الدرج: الارتفاع الكلّي والرحلات، والقائمة الحالية هي المستهدفة */
export function stairPre(st){
 const gs=stGeoms(st);
 if(!gs.length)return null;
 const N=gs.reduce((s,g)=>s+g.n,0), H=st.h||S.meta.wallH;
 return pre({H:String(Math.round(H)),mode:"free",r0:String(+(H/N).toFixed(1)),
  F:String(Math.min(2,gs.length)),b:"630"},{H:"mm",r0:"mm",b:"mm"});
}
/* (v2.11.0) قاعدة ⇒ حاسبة أبعادها المبدئية: الشكل والنسبة من القاعدة المرسومة،
   وأبعادُها تدخل «القاعدة المرسومة» فتُفحَص مقابل المطلوب. الأحمال لا تُستنتج
   من الرسم (لا تحليل إنشائيّ هنا) فتبقى للمهندس. */
export function footingPre(e){
 if(!e||strKind(e)!=="footing")return null;
 const a=+e.w, b=+(e.h||e.w);
 if(!(a>0&&b>0))return null;
 const B=Math.min(a,b), L=Math.max(a,b), r=L/B;
 const sq=r<1.0005;
 const raw={sh:sq?"sq":"rect",Bd:r3(B),Ld:r3(L)};
 if(!sq)raw.ratio=String(+Math.min(3,r).toFixed(2));
 return pre(raw,{Bd:"m",Ld:"m"});
}
export const LINKABLE={slab:slabPre,footing:footingPre,stair:stairPre,area:areaPre};
/* عنصرٌ من التحديد ⇒ {id الحاسبة, pre} أو null — مصدرٌ واحدٌ للوحة الحاسبات
   ولوحة الخصائص. sel = {k, id} كما في selList(). */
export function linkFor(sel,P){
 const St=P||S;
 if(!sel)return null;
 if(sel.k==="struct"){
  const e=(St.struct||[]).find(x=>x.id===sel.id); if(!e)return null;
  if(strKind(e)==="slab"){const p=slabPre(e); return p?{id:"slabbar",pre:p}:null}
  if(strKind(e)==="footing"){const p=footingPre(e); return p?{id:"footing",pre:p}:null}
  return null;
 }
 if(sel.k==="stair"){const t=(St.stairs||[]).find(x=>x.id===sel.id); const p=t&&stairPre(t); return p?{id:"stairs",pre:p}:null}
 if(sel.k==="area"){const a=(St.areas||[]).find(x=>x.id===sel.id); const p=a&&areaPre(a); return p?{id:"hvac",pre:p.A}:null}
 return null;
}


/* ═══ العكس (v2.11.0 · ٣-د): نتيجةُ حاسبة الدرج ⇒ الدرجُ المحدَّد ═══
   «حاسبة الدرج ← أداة الدرج الموجودة»: كانت الحاسبةُ تقرأ الدرجَ ولا تكتب فيه،
   فيعيد المستخدمُ كتابةَ العدد بيده. stairPlan خالصة: تقول ما سيُكتَب ولماذا.
   applyStair هي الكاتبةُ الوحيدة في هذا الملفّ، وتكتب عبر applyField نفسِه
   (المُدقِّق · حدودُ الحقول · التراجع) في معاملةٍ واحدة: الارتفاعُ ثم عددُ القوائم.
   ‏«لا يتحرّك إحداثيٌّ إلا بأمرك»: لا تُنادى إلا من زرٍّ صريح. */
export function stairPlan(res,st){
 if(!res||!res.ok)return {ok:0,why:"أصلح مدخلات الحاسبة أوّلاً"};
 if(!st)return {ok:0,why:"الدرج المحدَّد لم يعد موجوداً"};
 const N=Math.round(+res.out.N), H=Math.round(+res.v.H);
 if(!(N>=2&&N<=80))return {ok:0,why:`عدد القوائم ${N} خارج حدود أداة الدرج (2 – 80)`};
 if(!(H>=200&&H<=8000))return {ok:0,why:"ارتفاع الدور خارج حدود أداة الدرج (0.2 – 8 م)"};
 const curN=(st.flights||[]).reduce((s,f)=>s+(+f.n||0),0), curH=Math.round(st.h!=null?st.h:S.meta.wallH);
 return {ok:1,N,H,curN,curH,same:N===curN&&H===curH};
}
export function applyStair(sel,res,P){
 const St=P||S;
 if(!sel||sel.k!=="stair")return {ok:0,msg:"حدِّد درجاً أوّلاً"};
 const st=(St.stairs||[]).find(x=>x.id===sel.id);
 const p=stairPlan(res,st);
 if(!p.ok)return {ok:0,msg:p.why};
 if(p.same)return {ok:1,msg:"الدرج مطابقٌ للحاسبة أصلاً — لا تغيير",p};
 let bad="";
 edit(()=>{
  const s={k:"stair",id:sel.id};
  if(p.H!==p.curH){const r=applyField("stair",[s],"h",String(p.H/1000)); if(!r.done)bad=(r.refused[0]&&r.refused[0].msg)||"رُفض الارتفاع"}
  if(!bad){const r=applyField("stair",[s],"n",String(p.N)); if(!r.done)bad=(r.refused[0]&&r.refused[0].msg)||"رُفض عدد القوائم"}
  if(bad)throw new Error(bad);
 },"تطبيق حاسبة الدرج");
 if(bad||editFailed())return {ok:0,msg:bad||"تعذّر التطبيق"};
 return {ok:1,p,msg:`طُبِّق على ${sel.id}: ${p.N} قائمة لارتفاع ${(p.H/1000).toFixed(2)} م (كان ${p.curN} قائمة)`};
}
