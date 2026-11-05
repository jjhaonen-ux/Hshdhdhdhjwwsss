/* ═══ وحدات الحاسبات ═══ المرحلة ٣-أ من خطّة التطوير
   مصدرٌ واحدٌ لمعاملات التحويل: كلُّ نوعٍ له وحدةُ أساسٍ (SI) وكلُّ وحدةٍ
   معاملُها إليها. المعاملاتُ من NIST SP 811 (2008) الملحق B، وkgf = 9.80665 N
   تعريفاً. خالصٌ: لا DOM ولا حالة — يُستورَد في node كما في المتصفّح.

   KINDS[kind] = {n:اسم النوع, base:وحدة الأساس, units:{رمز:{n,f}}}
   القيمةُ بالأساس = القيمة × f. */
const U=(n,f)=>Object.freeze({n,f});
export const KINDS=Object.freeze({
 len:{n:"طول",base:"m",units:{
  mm:U("مم",1e-3),cm:U("سم",1e-2),m:U("م",1),km:U("كم",1e3),
  in:U("بوصة (in)",0.0254),ft:U("قدم (ft)",0.3048),yd:U("ياردة (yd)",0.9144)}},
 area:{n:"مساحة",base:"m2",units:{
  mm2:U("مم²",1e-6),cm2:U("سم²",1e-4),m2:U("م²",1),ha:U("هكتار",1e4),
  km2:U("كم²",1e6),donum:U("دونم",1e3),in2:U("بوصة² (in²)",6.4516e-4),
  ft2:U("قدم² (ft²)",0.09290304)}},
 vol:{n:"حجم",base:"m3",units:{
  cm3:U("سم³",1e-6),L:U("لتر",1e-3),m3:U("م³",1),
  ft3:U("قدم³ (ft³)",0.028316846592),yd3:U("ياردة³ (yd³)",0.764554857984),
  gal:U("جالون أمريكي",0.003785411784)}},
 force:{n:"قوة",base:"N",units:{
  N:U("نيوتن N",1),kN:U("كيلونيوتن kN",1e3),kgf:U("كجم قوة kgf",9.80665),
  tf:U("طن قوة tf",9806.65),lbf:U("رطل قوة lbf",4.4482216152605),
  kip:U("كيب kip",4448.2216152605)}},
 press:{n:"ضغط / إجهاد",base:"Pa",units:{
  Pa:U("باسكال Pa",1),kPa:U("كيلوباسكال kPa",1e3),MPa:U("ميجاباسكال (MPa)",1e6),
  kgcm2:U("كجم/سم²",98066.5),tm2:U("طن/م²",9806.65),bar:U("بار",1e5),
  psi:U("psi",6894.757293168),ksi:U("ksi",6894757.293168),psf:U("psf",47.880258980)}},
 moment:{n:"عزم",base:"Nm",units:{
  Nm:U("نيوتن·م",1),kNm:U("كيلونيوتن·م",1e3),kgfm:U("كجم قوة·م",9.80665),
  tm:U("طن·م",9806.65),lbfft:U("رطل·قدم lbf·ft",1.3558179483314),
  kipft:U("كيب·قدم kip·ft",1355.8179483314)}},
 mass:{n:"كتلة",base:"kg",units:{
  g:U("جم",1e-3),kg:U("كجم",1),t:U("طن",1e3),lb:U("رطل lb",0.45359237)}},
 /* أنواعٌ بوحدةٍ واحدة — تُكتَب بجانب الحقل ولا تُختار */
 ang:{n:"زاوية",base:"deg",units:{deg:U("°",1)}},
 pct:{n:"نسبة",base:"pct",units:{pct:U("٪",1)}},
 dens:{n:"كثافة",base:"kgm3",units:{kgm3:U("كجم/م³",1)}},
 lin:{n:"كتلة الطول",base:"kgm",units:{kgm:U("كجم/م",1)}},
 apm:{n:"مساحة لكل متر",base:"mm2m",units:{mm2m:U("مم²/م",1)}},
 time:{n:"زمن",base:"h",units:{h:U("ساعة",1),d:U("يوم",24)}},
 /* المرحلة ٣-ج: الأحمال والتربة. الأساس kN (kN/m² · kN/m · kN/m³)؛ tf = 9.80665 kN و kgf = 9.80665e-3 kN */
 aload:{n:"حمل مساحي",base:"kNm2",units:{kNm2:U("kN/م²",1),tfm2:U("طن/م²",9.80665),kgfm2:U("كجم/م²",9.80665e-3)}},
 lload:{n:"حمل خطّي",base:"kNm",units:{kNm:U("kN/م",1),tfm:U("طن/م",9.80665),kgfm:U("كجم/م",9.80665e-3)}},
 uw:{n:"وزن الوحدة",base:"kNm3",units:{kNm3:U("kN/م³",1),tfm3:U("طن/م³",9.80665),kgfm3:U("كجم/م³",9.80665e-3)}},
 /* المرحلة ٣-د: المياه والكهرباء. التدفّق بالأساس لتر/ث (م³/ساعة = 1/3.6 · جالون أمريكي/دقيقة = 3.785411784/60)،
    والقدرة بالواط (BTU/h = 0.29307107 W · طن تبريد = 12000 BTU/h · hp ميكانيكي = 745.69987 W) */
 flow:{n:"تدفّق",base:"Ls",units:{Ls:U("لتر/ث",1),m3h:U("م³/ساعة",1/3.6),gpm:U("جالون أمريكي/دقيقة",3.785411784/60)}},
 vel:{n:"سرعة",base:"ms",units:{ms:U("م/ث",1)}},
 power:{n:"قدرة",base:"W",units:{W:U("واط W",1),kW:U("كيلوواط kW",1e3),btuh:U("BTU/h",0.29307107017),tr:U("طن تبريد TR",3516.8528420),hp:U("حصان hp",745.69987158)}},
 volt:{n:"جهد",base:"V",units:{V:U("فولت V",1)}},
 curr:{n:"تيار",base:"A",units:{A:U("أمبير A",1)}},
 illum:{n:"شدّة الإضاءة",base:"lx",units:{lx:U("لوكس lx",1)}},
 lum:{n:"فيض ضوئي",base:"lm",units:{lm:U("لومن lm",1)}},
 xsec:{n:"مقطع",base:"mm2c",units:{mm2c:U("مم²",1)}},
 cnt:{n:"عدد",base:"n",units:{n:U("",1)}},
 none:{n:"",base:"x",units:{x:U("",1)}}
});
export const kindOf=k=>KINDS[k]||KINDS.none;
export const hasUnit=(k,u)=>!!(KINDS[k]&&Object.prototype.hasOwnProperty.call(KINDS[k].units,u));
export const unitName=(k,u)=>hasUnit(k,u)?KINDS[k].units[u].n:"";
export const unitList=k=>Object.entries(kindOf(k).units).map(([v,o])=>({v,n:o.n}));
/* تحويلٌ مباشر بين وحدتين من النوع نفسه */
export function convert(x,kind,from,to){
 if(!hasUnit(kind,from)||!hasUnit(kind,to))throw new Error(`وحدةٌ غير معروفة: ${from} ⇒ ${to}`);
 const K=KINDS[kind].units;
 return x*K[from].f/K[to].f;
}
