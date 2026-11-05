/* ═══ م١أ · التعابير الحسابية ═══ */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Ex,exParse,exHint} from '../core/expr.js';
import {parsePt} from '../core/coords.js';
import {normalizeDimension} from '../core/dimension-input.js';
import {exLoad} from '../core/exq.js';
await exLoad();   /* المحلّل كسول (core/exq.js): التعبير يمرّ به بعد تحميله */

let n=0;
const eq=(src,want,def)=>{assert.equal(Ex(src,def),want,`Ex(${src})`);n++};
const bad=(src,re)=>{const r=exParse(src);assert.ok(r.err,`يُرفض: ${src}`);assert.match(r.err,re,src);n++};

/* الجمع والطرح والأسبقية */
eq('3.6+0.15',3750);
eq('3.6-0.1',3500);
eq('2+3*4',14,'mm');              /* الافتراضي مم هنا: 2+12 = 14 */
eq('2*3+4',10,'mm');
eq('(12-0.2)/3',3933);
eq('((1+2))*2',6000);
eq('10-4-3',3000);
eq('12/3/2',2000);
eq('-3+5',2000);
eq('+3',3000);
eq('-(1+1)',-2000);
/* الوحدات المختلطة */
eq('4m+150mm',4150);
eq('4m+15cm',4150);
eq('3000mm+1m',4000);
eq('1m-50cm',500);
eq('2m*3',6000);
eq('3*2m',6000);
eq('6m/3',2000);
eq('6m/2m',3000);               /* نسبة طول إلى طول عددٌ مجرّد = 3، وفي الحقل المتر */
eq('2*1.2',2400);
eq('2*1.2m',2400);
eq('(2+1)*2m',6000);
/* الوحدة الافتراضية للحقل */
eq('3.6',3600,'m');
eq('3.6',4,'mm');                 /* الافتراضي مم: 3.6 مم تُقرَّب 4 */
eq('3.6+0.4',4000,'m');
eq('3.6+400',403600,'m'); /* 400 بلا وحدة = 400 م في حقل متري */
eq('3600',3600,'mm');
/* الأرقام العربية والفاصلة العشرية */
eq('٣٫٦+٠٫٢',3800);
eq('٣,٦+٠,٢',3800);
eq('3,6+0,2',3800);
eq('5.5',5500);
eq('.5',500);
/* ضبط المسافات */
eq(' 3.6 + 0.15 ',3750);
/* الرفض */
bad('3.6+',/غير مكتمل/);
bad('5/0',/قسمة على صفر/);
bad('(3+1',/أقواس غير متوازنة/);
bad('3+1)',/في غير موضعه/);
bad('2m*3m',/لا يُضرب طولٌ في طول/);
bad('3/2m',/لا يُقسَم عدد على طول/);
bad('3yd',/غير متوقع/);
bad('5.',/غير متوقع/);
bad('',/فارغ/);
bad('3..5',/غير متوقع/);
bad('*3',/في غير موضعه|غير مكتمل/);
bad('()',/في غير موضعه/);
bad('1e3',/غير متوقع/);
bad('2^3',/غير متوقع/);
assert.equal(Ex('3.6+'),null);
assert.equal(Ex(null),null);
assert.equal(Ex('5000000m'),null,'خارج الحدّ');
n+=3;
/* النواة (parsePt) تقبل التعبير بالصيغ كلها */
const P=(s,b,d)=>parsePt(s,b,d);
assert.deepEqual(P('3.6+0.15,0'),{k:'pt',p:[3750,0]});n++;
assert.deepEqual(P('@3.6+0.15<90',[0,0]),{k:'pt',p:[0,3750]});n++;
assert.deepEqual(P('@3.1<30',[0,0]),{k:'pt',p:[2685,1550]});n++;
assert.deepEqual(P('5/2,3'),{k:'pt',p:[2500,3000]});n++;
assert.deepEqual(P('(2+1),4'),{k:'pt',p:[3000,4000]});n++;
assert.deepEqual(P('3,4'),{k:'pt',p:[3000,4000]});n++;
assert.deepEqual(P('5<30'),{k:'pt',p:[4330,2500]});n++;
assert.deepEqual(P('<45'),{k:'ang',a:45});n++;
assert.deepEqual(P('3x4'),{k:'dim',w:3000,d:4000});n++;
assert.deepEqual(P('3000x4000mm'),{k:'dim',w:3000,d:4000});n++;
assert.deepEqual(P('3.6+0.4x4'),{k:'dim',w:4000,d:4000});n++;
assert.deepEqual(P('2*1.2'),{k:'dim',w:2000,d:1200});n++; /* 3*4 يبقى مقاساً كما كان */
assert.deepEqual(P('4m'),{k:'len',L:4000});n++;
assert.equal(P('3.6+').k,'err');n++;
assert.equal(parsePt('W7'),null,'الاسم ليس تعبيراً');n++;
assert.equal(parsePt('-'),null,'الشرطة وحدها ليست تعبيراً');n++;
assert.equal(parsePt('catwall'),null);n++;
/* الإدخال الصحيح لا يتغيّر بالتعبير: normalizeDimension */
assert.equal(normalizeDimension('3.6+0.15','m'),3750);n++;
assert.equal(normalizeDimension('3.6','m'),3600);n++;
assert.equal(normalizeDimension('1200'),1200);n++;
assert.throws(()=>normalizeDimension('3yd'),/غير صالح/);n++;
assert.throws(()=>normalizeDimension('3-5'),/موجباً/);n++;

/* المعاينة قبل Enter */
assert.equal(exHint('3.6+0.15').t,'= 3.750 م');n++;
assert.equal(exHint('90-12.5',1).t,'= 77.5°');n++;
assert.ok(exHint('(3.6').bad);n++;

/* حارس: Ex لا تُستورد في الذكاء ولا الملفات (النواة تقرأ الأوامر بـparsePt) */
const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..','..');
const walk=(d,o)=>{readdirSync(d).forEach(x=>{const p=join(d,x);if(statSync(p).isDirectory())walk(p,o);else if(x.endsWith('.js'))o.push(p)});return o};
const guarded=['src/ai','src/io'].flatMap(d=>walk(join(root,d),[]));
const offenders=guarded.filter(f=>{
 if(f.endsWith('expr.js'))return false;
 const s=readFileSync(f,'utf8');
 return /import\s*\{[^}]*\b(?:Ex|exParse|exAng)\b[^}]*\}\s*from\s*["'][^"']*(?:expr|exq)\.js["']/.test(s)||/import\(\s*["'][^"']*(?:expr|exq)\.js/.test(s);
});
assert.deepEqual(offenders.map(f=>relative(root,f)),[],'Ex/exParse ممنوعة في core/ai/io');n++;
console.log(`expr: ok (${n} حالة)`);
