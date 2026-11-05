/* تركيبات الأحمال — المرحلة ٣-ج · BS 8110-1 الجدول 2.1 */
import {ltr} from "../../core/units.js";
import {fmt} from "../engine.js";
import {BS8110_GF as T} from "../tables.js";
export default {
 id:"combos", group:"loads", title:"تركيبات الأحمال (BS 8110)",
 desc:"أحمال التصميم النهائية من الأحمال المميِّزة الميتة Gk والحية Qk والرياح Wk بمعاملات الأمان الجزئية لـ BS 8110-1 الجدول 2.1، وتحديد التركيب الحاكم، وحمل الخدمة لفحص الهبوط والتربة.",
 aliases:"load combinations factored ultimate service 1.4 1.6 wind تركيبات احمال معاملات امان نهائي خدمه رياح حاكم حمل التصميم",
 ref:T.ref,
 formula:["التركيب (1): 1.4 Gk + 1.6 Qk","التركيب (2): 1.0 Gk + 1.4 Wk (الميّت نافع)","التركيب (3): 1.4 Gk + 1.4 Wk","التركيب (4): 1.2 (Gk + Qk + Wk)","الخدمة: Gk + Qk"],
 inputs:[
  {k:"G",n:"الحمل الميّت المميِّز Gk",kind:"force",unit:"kN",def:600,min:0},
  {k:"Q",n:"الحمل الحيّ المميِّز Qk",kind:"force",unit:"kN",def:300,min:0},
  {k:"W",n:"حمل الرياح المميِّز Wk (0 = لا رياح)",kind:"force",unit:"kN",def:0,min:0}
 ],
 outputs:[
  {k:"c1",n:"(1) 1.4 Gk + 1.6 Qk",kind:"force",unit:"kN",dp:2},
  {k:"c2",n:"(2) 1.0 Gk + 1.4 Wk",kind:"force",unit:"kN",dp:2,when:v=>v.W>0},
  {k:"c3",n:"(3) 1.4 Gk + 1.4 Wk",kind:"force",unit:"kN",dp:2,when:v=>v.W>0},
  {k:"c4",n:"(4) 1.2 (Gk + Qk + Wk)",kind:"force",unit:"kN",dp:2,when:v=>v.W>0},
  {k:"Nu",n:"الحمل النهائي الحاكم",kind:"force",unit:"kN",dp:2,main:1},
  {k:"which",n:"التركيب الحاكم",dp:0,u:"",main:1},
  {k:"Ns",n:"حمل الخدمة Gk + Qk",kind:"force",unit:"kN",dp:2,main:1}
 ],
 compute(v){
  const F=T.uls, st=[], c={
   1:F.dq.g*v.G+F.dq.q*v.Q, 2:F.dw.gb*v.G+F.dw.w*v.W,
   3:F.dw.g*v.G+F.dw.w*v.W, 4:F.dqw.g*(v.G+v.Q+v.W)};
  const use=v.W>0?[1,2,3,4]:[1];
  let best=1; use.forEach(i=>{if(c[i]>c[best])best=i});
  st.push(ltr(`(1) ${F.dq.g} × ${fmt(v.G,2)} + ${F.dq.q} × ${fmt(v.Q,2)} = ${fmt(c[1],3)}`)+" kN");
  if(v.W>0){
   st.push(ltr(`(2) ${F.dw.gb} × ${fmt(v.G,2)} + ${F.dw.w} × ${fmt(v.W,2)} = ${fmt(c[2],3)}`)+" kN");
   st.push(ltr(`(3) ${F.dw.g} × ${fmt(v.G,2)} + ${F.dw.w} × ${fmt(v.W,2)} = ${fmt(c[3],3)}`)+" kN");
   st.push(ltr(`(4) ${F.dqw.g} × (${fmt(v.G,2)} + ${fmt(v.Q,2)} + ${fmt(v.W,2)}) = ${fmt(c[4],3)}`)+" kN");
  }
  st.push(ltr(`الحاكم: (${best}) = ${fmt(c[best],3)}`)+" kN");
  return {out:{c1:c[1],c2:c[2],c3:c[3],c4:c[4],Nu:c[best],which:best,Ns:v.G+v.Q},steps:st,
   warn:v.W>0?["التركيب (2) نافعٌ للقلب والانقلاب؛ والقيمة هنا للأثر الضارّ نفسه — تحقّق من اتجاه الرياح عند فحص الاستقرار"]:[]};
 },
 cases:[
  {n:"Gk 600 و Qk 300 بلا رياح",src:"حساب يدوي: 1.4×600 + 1.6×300 = 840 + 480 = 1320 ؛ الخدمة 900",in:{G:600,Q:300,W:0},out:{c1:1320,Nu:1320,which:1,Ns:900},tol:1e-9},
  {n:"Gk 500 و Qk 200 ورياح 150",src:"حساب يدوي: (1) 700 + 320 = 1020 ؛ (2) 500 + 210 = 710 ؛ (3) 700 + 210 = 910 ؛ (4) 1.2×850 = 1020",in:{G:500,Q:200,W:150},out:{c1:1020,c2:710,c3:910,c4:1020,Nu:1020},tol:1e-9},
  {n:"Gk 100 و Qk 0 ورياح 400",src:"حساب يدوي: (1) 140 ؛ (2) 100 + 560 = 660 ؛ (3) 140 + 560 = 700 ؛ (4) 1.2×500 = 600 ⇒ الحاكم (3)",in:{G:100,Q:0,W:400},out:{c2:660,c3:700,c4:600,Nu:700,which:3},tol:1e-9}
 ]
};
