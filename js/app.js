import { login, logout, watchAuth, finishRedirect, userBackend } from "./firebase.js";

const ic=n=>`<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const MEALS=[["desayuno","Desayuno"],["almuerzo","Almuerzo"],["merienda","Merienda"],["cena","Cena"],["extra","Extra"]];
const DEFAULT_TARGETS={gym:{kcal:1900,p:175,c:160,g:60},rest:{kcal:1700,p:175,c:125,g:55}};
const CHECKS=[["prot","Proteína","egg"],["crea","Creatina","pill"],["pasos","Pasos","steps"],["agua","Agua","drop"],["sueno","Sueño","moon"]];
const PLAN_START="2026-10-24";
const DEFAULT_GOAL=80;
function calcTargets(o){const w=o.weight||80,h=o.height||170,a=o.age||30;const bmr=10*w+6.25*h-5*a+(o.sex==="f"?-161:5);const tdee=bmr*(parseFloat(o.activity)||1.55);
  const adj=o.goal==="perder"?0.8:o.goal==="ganar"?1.1:1;const rest=Math.round(tdee*adj/10)*10;const gym=rest+200;
  const mk=k=>{const p=Math.round(Math.min(2.2*w,k*0.35/4));const g=Math.round(Math.max(0.6*w,k*0.25/9));const c=Math.max(50,Math.round((k-p*4-g*9)/4));return{kcal:k,p,c,g}};return{gym:mk(gym),rest:mk(rest)}}

/* Rutinas por defecto. step = salto de peso (kg); rest = descanso en segundos (grandes 180, chicos 90). */
const DEFAULT_ROUTINES=[
 {id:"upA",name:"Upper A",day:2,goal:"Empuje: pecho y tríceps",ex:[
  ["chestpress","Chest press máquina",3,8,10,2.5,180],["incl","Press inclinado máquina",3,10,12,2.5,180],["shpress","Press de hombros máquina",3,10,12,2.5,90],
  ["pushdown","Pushdown en polea (barra)",3,12,15,2.5,90],["ohext","Extensión tríceps sobre cabeza (polea)",3,12,15,2.5,90],["latraise","Elevaciones laterales",3,15,15,2.5,90]]},
 {id:"lowA",name:"Lower A",day:3,goal:"Cuádriceps y core (moderado)",ex:[
  ["legpress","Prensa 45°",3,10,12,5,180],["legext","Extensión de cuádriceps",3,12,15,2.5,90],["lyingcurl","Curl femoral acostado",3,12,12,2.5,90],
  ["calfpress","Gemelos en prensa",3,15,15,5,90],["plank","Plancha (segundos)",3,40,40,0,60]]},
 {id:"upB",name:"Upper B",day:5,goal:"Tracción: espalda y bíceps",ex:[
  ["latpull","Jalón al pecho",3,10,12,2.5,180],["rowm","Remo en máquina",3,10,12,2.5,180],["rowc","Remo polea baja (neutro)",3,12,12,2.5,180],
  ["reardelt","Posterior de hombro (pec-deck inverso)",3,15,15,2.5,90],["curlm","Curl de bíceps en máquina",3,12,12,2.5,90],["rope","Tríceps en polea con soga",2,15,15,2.5,90]]},
 {id:"lowB",name:"Lower B",day:6,goal:"Posterior y glúteo",ex:[
  ["hipthrust","Hip thrust en máquina",3,10,12,5,180],["seatcurl","Curl femoral sentado",3,12,15,2.5,90],["hack","Sentadilla hack",3,10,12,5,180],
  ["abd","Abductores en máquina",3,15,15,2.5,90],["calfstand","Gemelos de pie",3,15,15,5,90],["cableab","Abdominales en polea",3,15,15,2.5,90]]}
].map(r=>({...r,ex:r.ex.map(e=>({id:e[0],name:e[1],sets:e[2],lo:e[3],hi:e[4],step:e[5],rest:e[6]}))}));

/* Oraciones breves para ofrecer el entrenamiento (rotan por día). */
const PRAYERS=[
 "Señor, que este esfuerzo no sea para mirarme a mí, sino para servirte mejor. Dame disciplina en lo pequeño y humildad en lo que logre.",
 "Padre, te ofrezco este cuerpo que me diste. Que lo cuide con templanza y no con vanidad, y que cada repetición sea un sí a tu voluntad.",
 "Jesús, manso y humilde de corazón, haz mi corazón semejante al tuyo. Que trabaje en silencio y no busque ser visto.",
 "Señor, dame constancia cuando no tenga ganas y mesura cuando me vaya bien. Que mi fuerza sirva para cargar con los demás.",
 "Dios mío, que ordene mi cuerpo para ordenar mi alma. Líbrame de la pereza y de la vanagloria, y guárdame en tu paz."
];
const LENT_DINNERS=["Merluza al horno con puré de calabaza","Tortilla de acelga y ricota","Lentejas guisadas con verduras","Atún al natural con arroz y huevo duro","Tarta de verdura con ensalada","Omelette de champiñones y queso","Garbanzos salteados con espinaca","Pejerrey a la plancha con batata"];
const MEAT=/pollo|carne|nalga|cuadril|peceto|lomo|bife|asado|vac[ií]o|matambre|entra[ñn]a|paleta|roast|osobuco|h[ií]gado|picada|milanesa|hamburguesa|cerdo|bondiola|costillitas|matambrito|panceta|chorizo|morcilla|salchicha|jam[oó]n|salame|mortadela|lomito|pavo|pavita|alitas|chorip[aá]n|empanada de carne|carr[eé]|guiso|seit[aá]n/i;

/* La base de alimentos compartida se carga de data/foods.json */
let BASE=[],userFoods=[],hidden=new Set();

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const fmt=n=>Math.round(n||0).toLocaleString("es-AR");
const r1=n=>Math.round(n*10)/10;
const f1=n=>r1(n).toLocaleString("es-AR");
const pad=n=>String(n).padStart(2,"0");
const dstr=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split("-").map(Number);return new Date(a,b-1,c)};
const today=()=>dstr(new Date());
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return dstr(d)};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const defType=s=>{const w=parse(s).getDay();return (w===0||w===1)?"rest":"gym"};
const newId=p=>p+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const mmss=s=>Math.floor(s/60)+":"+pad(Math.max(0,s%60));
const DOW=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const DOWS=["dom","lun","mar","mié","jue","vie","sáb"];

/* ---------- Calendario litúrgico ---------- */
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return dstr(new Date(y,mo-1,da))}
function liturgy(s){
  const d=parse(s),y=d.getFullYear(),w=d.getDay(),E=easter(y);
  const ash=addDays(E,-46),holyThu=addDays(E,-3),goodFri=addDays(E,-2),palm=addDays(E,-7),pent=addDays(E,49);
  const xmas=y+"-12-25";let adv=parse(y+"-12-24");adv.setDate(adv.getDate()-adv.getDay());for(let i=0;i<3;i++)adv.setDate(adv.getDate()-7);const advent=dstr(adv);
  let epi=parse(y+"-01-06");let bap=new Date(epi);bap.setDate(bap.getDate()+((7-bap.getDay())%7||7));const baptism=dstr(bap);
  const r={season:"Tiempo Ordinario",ayuno:false,abstinencia:false,domingo:w===0,color:null};
  if(s>=ash&&s<palm)r.season="Cuaresma";else if(s>=palm&&s<E)r.season="Semana Santa";else if(s>=E&&s<=pent)r.season="Pascua";
  else if(s>=advent&&s<xmas)r.season="Adviento";else if(s>=xmas||s<=baptism)r.season="Navidad";
  if(s===ash||s===goodFri){r.ayuno=true;r.abstinencia=true}
  else if(w===5&&(s>=ash&&s<E))r.abstinencia=true;
  if(s===E)r.season="Pascua de Resurrección";
  return r;
}

let view="hoy",foods=[],combos=[],targets=DEFAULT_TARGETS,routines=DEFAULT_ROUTINES,loads={},bodyRows=[],tracks=[],intents=[],goal=DEFAULT_GOAL,
    cur=today(),day=null,workout=null,wcur=today(),routineSel=null,backend=null,ready=false,offerSkip=false;

/* ---------- Almacenamiento: ver firebase.js ---------- */
let statusTxt="Conectando…",statusErr=false;
function setStatus(t,err){statusTxt=t;statusErr=!!err;const s=$("#status");if(s){s.textContent=t;s.classList.toggle("err",!!err)}}
function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2000)}
async function write(p,okMsg){try{await p;if(okMsg)toast(okMsg)}catch(e){toast(e&&e.code==="quota_exceeded"?"La base está llena: borrá lo que no uses.":"No se pudo guardar. Probá de nuevo.")}}

/* ---------- Día ---------- */
const dayType=()=> (day&&day.type)||defType(cur);
const entries=()=> (day&&day.entries)||[];
const checks=()=> (day&&day.check)||{};
function saveDay(mut,msg){const d={date:cur,type:dayType(),entries:entries().map(e=>({...e})),check:{...checks()}};mut(d);day=d;render();write(backend.setDoc("days/"+cur,d),msg)}
let dayUnsub=null;
function openDay(d){cur=d;day=null;render();if(!backend)return;if(dayUnsub)dayUnsub();dayUnsub=backend.watchDoc("days/"+d,v=>{if(cur===d){day=v;render()}})}
function totals(list){return list.reduce((a,e)=>({kcal:a.kcal+e.kcal,p:a.p+e.p,c:a.c+e.c,g:a.g+e.g}),{kcal:0,p:0,c:0,g:0})}
function macrosFor(f,grams){const k=grams/100;return{kcal:f.kcal*k,p:f.p*k,c:f.c*k,g:f.g*k}}
function sortedFoods(){return foods.slice().sort((a,b)=>a.name.localeCompare(b.name,"es"))}
function searchFoods(q){q=norm(q);if(!q)return sortedFoods();const words=q.split(/\s+/);return sortedFoods().filter(f=>{const n=norm(f.name);return words.every(w=>n.includes(w))})}
/* Medidas caseras por tipo de alimento (aproximadas). */
const PORTIONS=[
 [/pan lactal|rebanada/i,[["rebanada",25]]],[/pan franc|mign|flauta|baguette/i,[["mignón",60],["medio",30]]],[/pan casero|pan de campo|pan integral|pan árabe|pan de hamb/i,[["rodaja",35],["pan chico",60]]],
 [/arroz cocido|fideos cocidos|ravioles|ñoquis|polenta|quinoa|lentejas cocidas|garbanzos cocidos|porotos cocidos|guiso|ensalada rusa|puré/i,[["cucharada colmada",40],["taza",150],["plato",250]]],
 [/arroz \(|arroz integral|arroz yamaní|fideos secos|fideos integrales|avena|salvado|harina|granola|copos|maicena|rebozador|quinoa \(seca/i,[["cucharada",10],["media taza",45],["taza",90]]],
 [/aceite|mayonesa|manteca|crema|queso crema|casancrem|queso blanco|ricota|dulce de leche|mermelada|miel|pasta de maní/i,[["cucharadita",5],["cucharada",15],["cucharada colmada",25]]],
 [/azúcar|sal\b|cacao|café/i,[["cucharadita",5],["cucharada",12]]],
 [/pechuga|pata-muslo|pollo|carne|nalga|cuadril|peceto|lomo|bife|asado|vacío|matambre|entraña|paleta|roast|osobuco|hígado|cerdo|bondiola|costillitas|merluza|salmón|pejerrey|pescado|milanesa|hamburguesa casera/i,[["palma de la mano",120],["bife chico",150],["bife grande",220]]],
 [/queso|mozzarella|port salut|sardo|cremoso/i,[["feta fina",20],["cubo",30],["porción",50]]],
 [/maní|almendra|nuez|nueces|castaña|avellana|semilla|pasas|coco rallado/i,[["puñado chico",20],["puñado",30]]],
 [/espinaca|acelga|lechuga|rúcula|brócoli|coliflor|repollo|zapallito|zucchini|berenjena|pepino|champiñ|chaucha|remolacha|apio|puerro|zanahoria|tomate|cebolla|morrón|zapallo|calabaza|verdura|ensalada/i,[["taza",100],["plato",200]]],
 [/leche|yogur|chocolatada|jugo|gaseosa|cerveza|vino|bebida|mate|té|agua/i,[["vaso chico",150],["vaso",200],["taza",250]]],
 [/papa|batata|mandioca|choclo/i,[["unidad chica",120],["unidad mediana",180],["taza en cubos",150]]],
 [/empanada|tarta|pizza|tostado|sándwich|panqueque|medialuna|factura|alfajor|barrita|galletita|bizcocho/i,[["unidad",0]]],
 [/fiambre|jamón|salame|mortadela|lomito|pavita|paleta cocida/i,[["feta",20],["feta gruesa",35]]]
];
function portionsFor(f){if(!f||f.unitG)return [];const out=[];for(const [re,list] of PORTIONS){if(re.test(f.name)){list.forEach(([name,g])=>{if(g>0&&!out.some(o=>o.name===name))out.push({name,g})})}}return out}
let recipeDraft=null,pendingDel=null;
function entryFor(f,q,unit,meal){const grams=unit?q*f.unitG:q;const m=macrosFor(f,grams);const qtyTxt=unit?f1(q)+" "+(f.unitName||"u")+" ("+fmt(grams)+" g)":fmt(grams)+" g";
  return{id:newId("e"),meal,foodId:f.id,name:f.name,grams:r1(grams),qtyTxt,kcal:r1(m.kcal),p:r1(m.p),c:r1(m.c),g:r1(m.g)}}

/* ---------- Entreno ---------- */
let wUnsub=null;
function openWorkout(d){wcur=d;workout=null;offerSkip=false;render();if(!backend)return;if(wUnsub)wUnsub();wUnsub=backend.watchDoc("workouts/"+d,v=>{if(wcur===d){workout=v;render()}})}
function routineFor(d){const w=parse(d).getDay();return routines.find(r=>r.day===w)||null}
function curRoutine(){const id=(workout&&workout.routineId)||routineSel||(routineFor(wcur)||{}).id;return routines.find(r=>r.id===id)||null}
function wsets(exId){return (workout&&workout.sets&&workout.sets[exId])||[]}
function restOf(ex){return ex.rest>0?ex.rest:(ex.step>=5?180:90)}
function saveWorkout(mut,msg,quiet){const r=curRoutine();if(!r)return;
  const w={date:wcur,routineId:r.id,sets:JSON.parse(JSON.stringify((workout&&workout.sets)||{})),done:!!(workout&&workout.done),intention:(workout&&workout.intention)||"",offered:!!(workout&&workout.offered)};
  mut(w);workout=w;if(!quiet)render();write(backend.setDoc("workouts/"+wcur,w),msg)}
function suggest(ex){const L=loads[ex.id];if(!L||!(L.w>0))return{w:null,why:"Primera vez: elegí un peso que te deje 2 reps en el tanque."};
  if(ex.step===0)return{w:L.w,why:"Último registro: "+L.w+"."};
  if(L.hard)return{w:L.w,why:"Mantener "+f1(L.w)+" kg: la última vez una serie costó.",hold:true};
  if(L.top)return{w:r1(L.w+ex.step),why:"Subís +"+f1(ex.step)+" kg: cumpliste el rango con RIR ≥ 2."};
  return{w:L.w,why:"Mantener "+f1(L.w)+" kg hasta cumplir el rango en todas las series.",hold:true}}
function finishWorkout(){const r=curRoutine();if(!r||!workout)return;const nl={...loads};
  r.ex.forEach(ex=>{const ss=wsets(ex.id).filter(s=>s.w>0&&s.r>0);if(!ss.length)return;const w=Math.max(...ss.map(s=>s.w));
    const top=ss.length>=ex.sets&&ss.every(s=>s.r>=ex.hi&&(s.rir==null||s.rir>=2));nl[ex.id]={w,date:wcur,top,hard:ss.some(s=>s.hard),reps:ss.map(s=>s.r)}});
  loads=nl;stopTimer();saveWorkout(w=>w.done=true,workout.intention?"Ofrecido por "+workout.intention:"Ofrecido");write(backend.setDoc("settings/loads",nl))}
const needsOffer=()=>!offerSkip&&!(workout&&(workout.offered||workout.done||Object.keys(workout.sets||{}).length));

/* ---------- Temporizador de descanso ---------- */
let timer=null,timerTick=null;
function startTimer(ex){stopTimer(false);const total=restOf(ex);timer={end:Date.now()+total*1000,total,name:ex.name};timerTick=setInterval(tick,500);tick()}
function stopTimer(rerender=true){if(timerTick)clearInterval(timerTick);timerTick=null;timer=null;$("#timerpill").hidden=true;if(rerender&&view==="entreno")paintTimer()}
function tick(){if(!timer)return;const left=Math.ceil((timer.end-Date.now())/1000);
  if(left<=0){const n=timer.name;stopTimer();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}toast("Descanso listo · "+n);return}
  paintTimer(left)}
function paintTimer(left){if(timer&&left==null)left=Math.ceil((timer.end-Date.now())/1000);
  const ring=$("#restRing");if(ring){const t=ring.querySelector("b"),c=ring.querySelector("circle.p"),l=$(".rl");
    if(timer){t.textContent=mmss(left);c.style.strokeDashoffset=(182*(1-left/timer.total)).toFixed(1);if(l)l.textContent="Descanso"}else{t.textContent=mmss(0);c.style.strokeDashoffset=182;if(l)l.textContent="Listo"}}
  const pill=$("#timerpill");if(timer&&view!=="entreno"){pill.hidden=false;pill.innerHTML=ic("today")+mmss(left)+" · "+esc(timer.name)}else pill.hidden=true}

/* ---------- Render ---------- */
const typing=()=>{const a=document.activeElement;return !!(a&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"))};
let dirty=false,sheetDirty=false;
document.addEventListener("focusout",()=>{setTimeout(()=>{if(typing())return;if(dirty){dirty=false;render()}if(sheetDirty){sheetDirty=false;if(sheet)renderSheetNow()}},80)});
function render(){if(typing()){dirty=true;return}renderNow()}
function renderSheet(){if(typing()){sheetDirty=true;return}renderSheetNow()}
function renderNow(){
  if(!user){renderLogin();return}
  document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.view===view?"page":"false"));
  const app=$("#app");
  if(view==="hoy")app.innerHTML=renderHoy();else if(view==="entreno")app.innerHTML=renderEntreno();else if(view==="cuerpo")app.innerHTML=renderCuerpo();else app.innerHTML=renderMas();
  afterRender();paintTimer();
}
function dateLabel(d){const dt=parse(d);return (d===today()?"Hoy · ":"")+dt.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"short"}).replace(/^\w/,c=>c.toUpperCase())}
function nextIdeas(){const own=recipes.filter(r=>r.lent).map(r=>r.name);const pool=own.length?own.concat(LENT_DINNERS):LENT_DINNERS;return pool[Math.abs(daysBetween(PLAN_START,cur))%pool.length]}

function renderHoy(){
  const type=dayType();const t=(targets&&targets[type])||DEFAULT_TARGETS[type];const tot=totals(entries());const left=t.kcal-tot.kcal;
  const L=liturgy(cur);const ck=checks();const protOk=tot.p>=t.p;
  const planDay=daysBetween(PLAN_START,cur)+1;
  const eyebrow=dateLabel(cur)+(L.season!=="Tiempo Ordinario"?" · "+L.season:"")+(planDay>=1&&planDay<=90?" · día "+planDay+" de 90":"");
  const chips=(L.ayuno?`<span class="chip">Ayuno</span>`:L.abstinencia?`<span class="chip">Abstinencia</span>`:L.domingo?`<span class="chip muted">${ic("sun")}Día del Señor</span>`:"");
  const M=[["Prot","p","var(--accent)",true],["Carb","c","var(--carb)"],["Grasa","g","var(--fat)"]];
  return `
  <div class="top"><div class="l"><span class="eyebrow">${esc(eyebrow)}</span><h1 class="title">Hoy</h1></div>
    <div class="r">${chips}<button class="chip off" id="tType" aria-label="Tipo de día">${type==="gym"?"Gym":"Descanso"}</button></div></div>
  <section class="card" aria-label="Resumen del día">
    <div class="kcal"><div class="stat"><span class="eyebrow">${left>=0?"Restantes":"Te pasaste"}</span><span class="big${left<0?" over":""}">${fmt(Math.abs(left))}</span><small class="d">de ${fmt(t.kcal)} kcal · consumidas ${fmt(tot.kcal)}</small></div>
      <div class="r"><button class="iconbtn inset" id="prev" aria-label="Día anterior">${ic("left")}</button><button class="iconbtn inset" id="next" aria-label="Día siguiente">${ic("right")}</button>${cur!==today()?`<button class="iconbtn inset" id="todayBtn" aria-label="Ir a hoy">${ic("today")}</button>`:""}</div></div>
    <div class="bar${left<0?" over":""}" style="margin-top:16px"><i style="width:${Math.min(100,tot.kcal/t.kcal*100)}%"></i></div>
    <div class="macros">${M.map(([n,k,col,isP])=>{const v=tot[k],tg=t[k],over=!isP&&v>tg*1.08;
      return `<div><span class="eyebrow">${n}</span><span class="v">${fmt(v)}<small> /${fmt(tg)}</small></span><div class="bar3"><i style="width:${Math.min(100,v/tg*100)}%;background:${over?"var(--over)":col}"></i></div></div>`}).join("")}</div>
  </section>
  <div class="check" role="group" aria-label="Checklist del día">${CHECKS.map(([k,n,i])=>{const on=k==="prot"?protOk:!!ck[k];return `<button data-check="${k}" aria-pressed="${on}" ${k==="prot"?"disabled":""} aria-label="${n}${on?" cumplido":""}">${ic(i)}</button>`}).join("")}</div>
  <section class="card tight list" id="meals">${MEALS.map(([k,n])=>{const list=entries().filter(e=>e.meal===k),mt=totals(list);
    const sub=list.length?list.map(e=>esc(e.name)).join(" · "):(k==="cena"&&L.abstinencia?`<span class="acc">Sugerido: ${esc(nextIdeas())}</span>`:"");
    return `<div class="row"><div class="n"><b${list.length?"":' class="muted"'} style="${list.length?"":"font-weight:500"}">${n}</b>${sub?`<small${k==="cena"&&!list.length&&L.abstinencia?' class="acc"':""}>${sub}</small>`:""}</div>
      <div class="acts">${list.length?`<span class="k">${fmt(mt.kcal)}<small>${fmt(mt.p)} g P</small></span><button class="sm" data-fav="${k}" aria-label="Guardar ${n} como favorito">${ic("star")}</button><button class="sm" data-open="${k}" aria-label="Ver ${n}">${ic("down")}</button>`:""}
      <button class="iconbtn ${list.length?"inset":"acc"}" data-add="${k}" aria-label="Agregar a ${n}">${ic("plus")}</button></div></div>`}).join("")}</section>
  <div class="top" style="align-items:center"><span class="hint" id="status" style="${statusErr?"color:var(--over)":""}">${esc(statusTxt)}</span>
    ${entries().length?"":`<button class="ghost g" id="copyY">${ic("copy")}Copiar ayer</button>`}</div>`;
}

function renderEntreno(){
  const r=curRoutine();const weekNo=Math.min(13,Math.max(1,Math.floor(daysBetween(PLAN_START,wcur)/7)+1));
  const rt=`<div class="rtabs" role="group" aria-label="Rutina">${routines.map(x=>`<button data-rsel="${x.id}" aria-pressed="${!!(r&&r.id===x.id)}">${esc(x.name)}</button>`).join("")}</div>`;
  const nav=`<div class="r"><button class="iconbtn inset" id="wprev" aria-label="Día anterior">${ic("left")}</button><button class="iconbtn inset" id="wnext" aria-label="Día siguiente">${ic("right")}</button>${wcur!==today()?`<button class="iconbtn inset" id="wtoday" aria-label="Ir a hoy">${ic("today")}</button>`:""}</div>`;
  if(!r)return `<div class="top"><div class="l"><span class="eyebrow">${esc(dateLabel(wcur))} · semana ${weekNo} de 13</span><h1 class="title">Descanso</h1></div>${nav}</div><p class="hint">Hoy no hay rutina asignada. Elegí una si querés entrenar igual.</p>${rt}`;
  if(needsOffer()){const pr=PRAYERS[daysBetween(PLAN_START,wcur)%PRAYERS.length];
    return `<div class="offer"><div class="top"><span class="eyebrow">${esc(DOW[parse(wcur).getDay()])} · ${esc(r.name)}</span><button class="iconbtn ghost" id="offerSkip" aria-label="Saltar">${ic("x")}</button></div>
      <div style="display:flex;flex-direction:column;gap:28px"><span class="dot"></span><p class="pr">${esc(pr)}</p><p class="sub">Ordenar el cuerpo desde la templanza, no desde la vanagloria.</p></div>
      <div style="display:flex;flex-direction:column;gap:12px"><label for="intencion" class="eyebrow">Lo ofrezco por</label><input id="intencion" type="text" placeholder="una persona, una intención…" autocomplete="off">
        ${intents.length?`<div class="chips">${intents.slice(0,6).map(i=>`<button data-intent="${esc(i)}">${esc(i)}</button>`).join("")}</div>`:""}
        <button class="primary" id="offer" style="margin-top:8px">${ic("cross")}Ofrecer</button></div></div>`}
  const done=!!(workout&&workout.done);const intention=workout&&workout.intention;
  const cur_track=tracks[trackIdx];
  return `
  <div class="top"><div class="l"><span class="eyebrow">${intention?"Ofrecido por "+esc(intention):esc(DOW[parse(wcur).getDay()])} · semana ${weekNo}</span><h1 class="title">${esc(r.name)}</h1><small class="hint">${esc(r.goal)} · RIR 2</small></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div class="ring" id="restRing"><svg viewBox="0 0 68 68" aria-hidden="true"><circle cx="34" cy="34" r="29" fill="none" stroke="var(--track)" stroke-width="5"/><circle class="p" cx="34" cy="34" r="29" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="182" stroke-dashoffset="182"/></svg><b>0:00</b></div><span class="eyebrow rl" style="font-size:10px">Listo</span></div></div>
  <div class="top" style="align-items:center">${rt}${nav}</div>
  ${r.ex.map(ex=>{const ss=wsets(ex.id);const sg=suggest(ex);const L=loads[ex.id];const rows=[];
    for(let i=0;i<Math.max(ex.sets,ss.length);i++){const s=ss[i]||{};const prev=ss[i-1]||{};const w=s.w!=null?s.w:(prev.w!=null?prev.w:(sg.w!=null?sg.w:""));const done=s.w>0&&s.r>0;
      rows.push(`<span class="no">${i+1}</span>
        <input type="number" inputmode="decimal" step="any" class="${done?"":"empty"}" data-set="${ex.id}" data-i="${i}" data-k="w" value="${esc(s.w!=null?s.w:"")}" placeholder="${esc(w)}" aria-label="Peso serie ${i+1}">
        <input type="number" inputmode="numeric" class="${done?"":"empty"}" data-set="${ex.id}" data-i="${i}" data-k="r" value="${esc(s.r!=null?s.r:"")}" placeholder="${ex.lo}" aria-label="Reps serie ${i+1}">
        <input type="number" inputmode="numeric" class="${done?"":"empty"}" data-set="${ex.id}" data-i="${i}" data-k="rir" value="${esc(s.rir!=null?s.rir:"")}" placeholder="2" aria-label="RIR serie ${i+1}">
        <button class="mini hard" data-hard="${ex.id}" data-i="${i}" aria-pressed="${!!s.hard}" aria-label="Me costó">${ic("flame")}</button>
        <button class="mini ok" data-ok="${ex.id}" data-i="${i}" aria-pressed="${done}" aria-label="Serie lista">${ic("check")}</button>`)}
    return `<section class="ex"><div class="hd"><div><b>${esc(ex.name)}</b><small>${ex.sets} × ${ex.lo}${ex.hi!==ex.lo?"–"+ex.hi:""}${ex.step===0?" s":""} · descanso ${mmss(restOf(ex))}</small></div>
      <div class="sug${sg.hold?" hold":""}"><span class="eyebrow">Sugerido</span><span class="v">${sg.w!=null?f1(sg.w):"—"}<small> ${ex.step===0?"s":"kg"}</small></span></div></div>
      <div class="sets"><span></span><span class="th">${ex.step===0?"seg":"kg"}</span><span class="th">reps</span><span class="th">rir</span><span></span><span></span>${rows.join("")}</div>
      <div class="next">${esc(sg.why)}${L?" Última: "+f1(L.w)+" × "+(L.reps||[]).join("/")+".":""}</div></section>`}).join("")}
  <button class="primary" id="finish" ${done?"disabled":""}>${ic("flag")}${done?"Ofrecido":"Terminar"}</button>
  <button class="nowbar" id="openListen" style="text-align:left;width:100%"><div class="n"><b>${cur_track?esc(cur_track.name):"Escuchar"}</b><small>${cur_track?(playing?"Sonando":"En pausa")+" · música "+(trackIdx+1)+" de "+tracks.length:"Música y rosario para el entreno"}</small></div>
    <div class="acts">${cur_track?`<span class="iconbtn ink" data-pp="1" role="button" aria-label="${playing?"Pausar":"Reproducir"}" style="width:36px;height:36px">${ic(playing?"pause":"play")}</span>`:""}<span class="iconbtn" style="width:36px;height:36px;color:var(--muted)" aria-hidden="true">${ic("rosary")}</span></div></button>`;
}

function weekAvgs(){const by={};bodyRows.forEach(r=>{if(r.weight>0)by[r.date]=r.weight});const out=[];
  for(let w=0;w<13;w++){let s=0,n=0;for(let i=0;i<7;i++){const d=addDays(PLAN_START,w*7+i);if(by[d]){s+=by[d];n++}}out.push(n?s/n:null)}return out}
function renderCuerpo(){
  const rows=bodyRows.slice().sort((a,b)=>a.date<b.date?-1:1);const byDate={};rows.forEach(r=>byDate[r.date]=r);
  const tdy=byDate[today()]||{};const avg7=d=>{let s=0,n=0;for(let i=0;i<7;i++){const r=byDate[addDays(d,-i)];if(r&&r.weight>0){s+=r.weight;n++}}return n?s/n:null};
  const a=avg7(today()),aPrev=avg7(addDays(today(),-7)),aPrev2=avg7(addDays(today(),-14));
  const diff=a!=null&&aPrev!=null?a-aPrev:null,diff2=aPrev!=null&&aPrev2!=null?aPrev-aPrev2:null;
  let advice="Cargá el peso todos los días; mirá el promedio de 7 días, no el número de hoy.",acc=false;
  if(diff!=null&&diff2!=null){if(diff>-0.4&&diff2>-0.4)advice="Dos semanas bajando menos de 0,4 kg: bajá 100–150 kcal de carbos o grasas en días de descanso.";
    else if(diff<-1&&diff2<-1)advice="Más de 1 kg por semana dos semanas seguidas: subí 100 kcal para cuidar el músculo.";else{advice="Correcto. No tocar calorías.";acc=true}}
  else if(diff!=null){advice=diff<=-0.4?"Buena primera semana. Seguí igual.":"Primera semana floja; esperá una más antes de ajustar.";acc=diff<=-0.4}
  const first=rows.find(r=>r.weight>0);const lost=first&&a!=null?a-first.weight:null;
  const waist=rows.filter(r=>r.waist>0);const lastW=waist[waist.length-1],firstW=waist[0];
  const planDay=Math.min(90,Math.max(1,daysBetween(PLAN_START,today())+1)),weekNo=Math.min(13,Math.floor((planDay-1)/7)+1);
  const W=weekAvgs();const vals=W.filter(v=>v!=null);const hasData=vals.length>0;
  const lo=Math.floor(Math.min(goal,...(hasData?vals:[goal])))-1,hi=Math.ceil(Math.max(goal+2,...(hasData?vals:[goal+9])))+1;
  const Y=v=>22+(1-(v-lo)/(hi-lo))*124;const curW=weekNo-1;
  const bars=W.map((v,i)=>{const x=2+i*25;if(v==null)return `<rect x="${x}" y="${Y(hasData?vals[vals.length-1]:goal+5).toFixed(1)}" width="20" height="${(146-Y(hasData?vals[vals.length-1]:goal+5)).toFixed(1)}" rx="6" fill="none" stroke="var(--track)" stroke-width="1" stroke-dasharray="3 3"/>`;
    const y=Y(v);return `<rect x="${x}" y="${y.toFixed(1)}" width="20" height="${(146-y).toFixed(1)}" rx="6" fill="${i===curW?"var(--accent)":"var(--track)"}"/><text x="${x+10}" y="${(y-8).toFixed(1)}" text-anchor="middle" fill="${i===curW?"var(--accent)":"var(--muted)"}" font-size="10" font-weight="${i===curW?600:400}" font-family="Bricolage Grotesque, sans-serif">${f1(v)}</text>`}).join("");
  const gy=Y(goal);
  return `
  <div class="top"><div class="l"><span class="eyebrow">Semana ${weekNo} de 13 · día ${planDay} de 90</span><h1 class="title">Cuerpo</h1></div>${lost!=null?`<span class="chip">${lost<=0?"":"+"}${f1(lost)} kg</span>`:""}</div>
  <section class="card">
    <div class="kcal"><div class="stat"><span class="eyebrow">Promedio 7 días</span><span class="big">${a!=null?f1(a):"—"}<small style="font-size:18px;color:var(--muted);font-weight:400"> kg</small></span></div>
      <div class="stat" style="align-items:flex-end"><span class="eyebrow">Hoy</span><span class="v" style="font-size:22px">${tdy.weight>0?f1(tdy.weight):"—"}</span></div></div>
    <div class="wk"><div class="lbl"><span>Promedio por semana</span><span>Meta ${f1(goal)} kg</span></div>
      <svg viewBox="0 0 330 150" role="img" aria-label="Peso promedio por semana del plan"><line x1="0" y1="${gy.toFixed(1)}" x2="330" y2="${gy.toFixed(1)}" stroke="var(--accent)" stroke-width="1" stroke-dasharray="4 4" opacity=".7"/><text x="330" y="${(gy-5).toFixed(1)}" text-anchor="end" fill="var(--accent)" font-size="10" font-family="Bricolage Grotesque, sans-serif">${f1(goal)}</text>${bars}</svg>
      <div class="ax"><span>S1</span><span>S4</span><span>S7</span><span>S10</span><span>S13</span></div></div>
  </section>
  <div class="grid2">
    <section class="card pad stat"><span class="eyebrow">Cintura</span><span class="v">${lastW?f1(lastW.waist):"—"}<small> cm</small></span><small class="d">${lastW&&firstW&&lastW!==firstW?(lastW.waist-firstW.waist<=0?"":"+")+f1(lastW.waist-firstW.waist)+" desde el inicio":"Medila una vez por semana"}</small></section>
    <section class="card pad stat"><span class="eyebrow">Ritmo</span><span class="v">${diff!=null?(diff<=0?"":"+")+f1(diff):"—"}<small> kg/sem</small></span><small class="d${acc?" acc":""}">${advice}</small></section>
  </div>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Registrar hoy</span>
    <div style="display:grid;grid-template-columns:1fr 1fr 48px;gap:8px;align-items:center"><input type="number" class="inset c" id="bw" inputmode="decimal" step="0.1" value="${tdy.weight>0?tdy.weight:""}" placeholder="kg" aria-label="Peso en kg"><input type="number" class="inset c" id="bwa" inputmode="decimal" step="0.5" value="${tdy.waist>0?tdy.waist:""}" placeholder="cm" aria-label="Cintura en cm"><button class="iconbtn acc" id="saveBody" style="width:48px;height:48px" aria-label="Guardar">${ic("check")}</button></div>
    <p class="hint">Pesate en ayunas; la cintura, una vez por semana a la altura del ombligo.</p></section>
  ${rows.length?`<section class="card tight list">${rows.slice(-7).reverse().map(r=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(parse(r.date).toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short"}))}</b></div><div class="acts"><span class="k">${r.weight>0?f1(r.weight)+" kg":""}${r.waist>0?" · "+f1(r.waist)+" cm":""}</span><button class="sm" data-delbody="${r.date}" aria-label="Borrar registro">${ic("x")}</button></div></div>`).join("")}</section>`:""}`;
}

function renderMas(){
  const t=targets||DEFAULT_TARGETS;
  const light=document.documentElement.getAttribute("data-theme")==="light";
  const own=userFoods.filter(f=>!f.recipeId).length;
  return `
  <div class="top"><div class="l"><span class="eyebrow">${esc(user&&(user.displayName||user.email)||"")}</span><h1 class="title">Más</h1></div><div class="r"><button class="chip off" id="theme">${light?"Oscuro":"Claro"}</button><button class="iconbtn" id="logout" aria-label="Salir">${ic("out")}</button></div></div>
  <section class="card tight list"><div class="row"><span class="eyebrow">Recetas (${recipes.length})</span><button class="ghost" id="newRecipe" style="height:32px;font-size:12px">${ic("plus")}Nueva</button></div>
    ${recipes.length?recipes.map(r=>`<div class="row"><div class="n"><b>${esc(r.name)}</b><small>${r.items.length} ingredientes · ${r.portions} ${r.portions===1?"porción":"porciones"} · ${fmt(totals(r.items).kcal/(r.portions||1))} kcal c/u${r.lent?" · abstinencia":""}</small></div><div class="acts"><button class="sm" data-edrec="${r.id}" aria-label="Editar receta">${ic("edit")}</button><button class="sm" data-delrec="${r.id}" aria-label="Borrar receta">${ic("trash")}</button></div></div>`).join(""):`<p class="empty">Tus comidas caseras con sus macros exactos: cargás los ingredientes y cuántas porciones salen.</p>`}</section>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Alimentos</span>
    <p class="hint">${BASE.length} de la base argentina${hidden.size?" ("+hidden.size+" ocultos)":""} · ${own} propios · ${recipes.length} recetas.</p>
    <div class="r"><button class="ghost g" id="openFoods">${ic("edit")}Editar</button><button class="ghost g" id="newFood">${ic("plus")}Nuevo</button></div></section>
  <section class="card pad"><form id="tf"><span class="eyebrow">Objetivos diarios</span>
    ${["gym","rest"].map(k=>`<div><p class="hint" style="margin:6px 0 6px;font-weight:600;color:var(--ink)">${k==="gym"?"Gym / fútbol":"Descanso"}</p><div class="grid4">${[["kcal","kcal"],["p","Prot"],["c","Carb"],["g","Grasa"]].map(([f,l])=>`<label class="f" for="t_${k}_${f}">${l}<input class="inset" type="number" id="t_${k}_${f}" inputmode="numeric" value="${(t[k]||DEFAULT_TARGETS[k])[f]}"></label>`).join("")}</div></div>`).join("")}
    <label class="f" for="goalIn" style="margin-top:4px">Meta de peso (kg)<input class="inset" type="number" id="goalIn" inputmode="decimal" step="0.5" value="${goal}"></label>
    <div class="r"><button class="ghost" type="submit">${ic("check")}Guardar</button><button class="ghost g" type="button" id="recalc">${ic("scale")}Recalcular</button></div></form></section>
  <section class="card tight list"><div class="row"><span class="eyebrow">Favoritos (${combos.length})</span></div>
    ${combos.length?combos.map(c=>`<div class="row"><div class="n"><b>${esc(c.name)}</b><small>${MEALS.find(m=>m[0]===c.meal)[1]} · ${c.items.length} ítems · ${fmt(totals(c.items).kcal)} kcal</small></div><button class="sm" data-delcombo="${c.id}" aria-label="Borrar favorito">${ic("trash")}</button></div>`).join(""):`<p class="empty">Guardá una comida con la estrella en Hoy.</p>`}</section>
  <section class="card tight list"><div class="row"><span class="eyebrow">Rutinas</span><button class="ghost g" id="resetR" style="height:32px;font-size:12px">${ic("copy")}Restaurar</button></div>
    ${routines.map(r=>`<div class="row" style="flex-direction:column;align-items:stretch;gap:0"><div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0 8px"><b style="font-weight:600">${esc(r.name)}</b><small class="hint">${DOWS[r.day]} · ${esc(r.goal)}</small></div>
      ${r.ex.map(e=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><div class="n"><b style="font-weight:500;font-size:14px">${esc(e.name)}</b><small>${e.sets} × ${e.lo}${e.hi!==e.lo?"–"+e.hi:""} · +${f1(e.step)} kg · ${mmss(restOf(e))}</small></div><button class="sm" data-edex="${r.id}/${e.id}" aria-label="Editar ${esc(e.name)}">${ic("edit")}</button></div>`).join("")}</div>`).join("")}</section>
  <section class="card tight list"><div class="row"><span class="eyebrow">Intenciones recientes</span></div>${intents.length?intents.map(i=>`<div class="row"><b style="font-weight:500">${esc(i)}</b><button class="sm" data-delint="${esc(i)}" aria-label="Borrar">${ic("x")}</button></div>`).join(""):`<p class="empty">Aparecen al ofrecer un entrenamiento.</p>`}</section>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Tus datos</span>
    <p class="hint">Exportá una copia de todo en un archivo, o importá el archivo de la versión anterior de la app.</p>
    <div class="r"><button class="ghost g" id="exportData">${ic("db")}Exportar</button><label class="ghost g" for="importFile">${ic("upload")}Importar<input id="importFile" type="file" accept="application/json,.json" hidden></label></div>
    <p class="hint" id="status" style="${statusErr?"color:var(--over)":""}">${esc(statusTxt)}</p></section>`;
}

function afterRender(){
  const imp=$("#importFile");if(imp)imp.onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const dump=JSON.parse(await f.text());const cols=["days","workouts","body","combos","recipes","foods","tracks","settings"];const clean={};cols.forEach(c=>{if(dump[c]&&typeof dump[c]==="object")clean[c]=dump[c]});
      if(!Object.keys(clean).length)return toast("El archivo no tiene datos de Scaeli Fit");toast("Importando…");const n=await backend.importAll(clean);toast("Importados "+n+" registros")}catch(err){toast("No se pudo importar: "+(err&&err.message||""))}e.target.value=""};
  const tf=$("#tf");if(tf)tf.onsubmit=e=>{e.preventDefault();const nt={};["gym","rest"].forEach(k=>{nt[k]={};["kcal","p","c","g"].forEach(f=>nt[k][f]=parseFloat($("#t_"+k+"_"+f).value)||0)});
    targets=nt;const g=parseFloat($("#goalIn").value);if(g>0)goal=g;write(backend.setDoc("settings/targets",{...nt,goal}),"Objetivos guardados");render()};
}

/* ---------- Panel ---------- */
let sheet=null;
function openSheet(s){sheet=s;$("#scrim").hidden=false;const sh=$("#sheet");sh.hidden=false;sh.classList.toggle("short",!!s.short);renderSheetNow()}
function closeSheet(){sheet=null;$("#scrim").hidden=true;$("#sheet").hidden=true;$("#sheetIn").innerHTML=""}
const X=`<button class="iconbtn ghost" id="x" aria-label="Cerrar">${ic("x")}</button>`;
function renderSheetNow(){
  const el=$("#sheetIn");if(!sheet)return;const mealName=sheet.meal?MEALS.find(m=>m[0]===sheet.meal)[1]:"";
  if(sheet.view==="search"){const L=liturgy(cur);const list=searchFoods(sheet.q||"");const favs=(sheet.q||sheet.target)?[]:combos.filter(c=>c.meal===sheet.meal);const title=sheet.target==="recipe"?"Ingrediente":mealName;
    el.innerHTML=`<h3>${esc(title)}${X}</h3><input type="search" id="q" placeholder="Buscar alimento…" value="${esc(sheet.q||"")}" autocomplete="off" enterkeyhint="search">
      ${L.abstinencia&&!sheet.target?`<p class="hint">Día de abstinencia: la carne aparece atenuada.</p>`:""}
      <div class="scroll" id="flist">${favs.map(c=>`<button class="fav" data-combo="${c.id}"><span><b>${esc(c.name)}</b><br><small>${c.items.map(i=>esc(i.name)).join(" · ")}</small></span><small>${fmt(totals(c.items).kcal)} kcal · ${fmt(totals(c.items).p)} P</small></button>`).join("")}
        ${list.length?list.map(f=>`<button class="food${L.abstinencia&&!sheet.target&&MEAT.test(f.name)&&!f.lent?" dim":""}" data-pick="${f.id}"><b>${esc(f.name)}${f.recipeId?' <span class="eyebrow" style="font-size:9px">receta</span>':""}</b><small>${fmt(f.kcal)} kcal · ${f1(f.p)} P ${f.unitG?"/ "+esc(f.unitName||"u"):"/100 g"}</small></button>`).join(""):`<p class="empty">${foods.length?"No hay coincidencias.":"Cargando la base de alimentos…"}</p>`}</div>`;
    const q2=$("#q");q2.oninput=e=>{sheet.q=e.target.value;const pos=e.target.selectionStart;renderSheetNow();const n=$("#q");n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}};
    if(!sheet.q)setTimeout(()=>{const n=$("#q");n&&n.focus()},50);
  } else if(sheet.view==="qty"){const f=foods.find(x=>x.id===sheet.foodId);if(!f){sheet.view="search";return renderSheetNow()}
    const ports=portionsFor(f);const mode=sheet.mode||(f.unitG?"unit":"g");const per=mode==="unit"?f.unitG:mode==="portion"&&sheet.portion?sheet.portion.g:1;
    const qty=parseFloat(sheet.qty)||0;const grams=qty*per;const m=macrosFor(f,grams);
    const unitLbl=mode==="unit"?(f.unitName||"u"):mode==="portion"&&sheet.portion?sheet.portion.name:"g";
    el.innerHTML=`<h3>${esc(f.name)}${X}</h3>
      <div class="r"><input type="number" class="inset" id="qty" inputmode="decimal" min="0" step="any" value="${esc(sheet.qty)}" style="flex:1"><span class="muted" style="min-width:5em">${esc(unitLbl)}</span></div>
      <div class="seg"><button data-mode="g" aria-pressed="${mode==="g"}">Gramos</button>${f.unitG?`<button data-mode="unit" aria-pressed="${mode==="unit"}">${esc(f.unitName||"Unidad")}</button>`:""}${ports.length?`<button data-mode="portion" aria-pressed="${mode==="portion"}">Porción</button>`:""}</div>
      ${mode==="portion"?`<div class="offer" style="min-height:0;padding:0"><div class="chips">${ports.map((p,i)=>`<button data-portion="${i}" aria-pressed="${!!(sheet.portion&&sheet.portion.name===p.name)}" style="${sheet.portion&&sheet.portion.name===p.name?"border-color:var(--accent-line);background:var(--accent-dim);color:var(--accent)":""}">${esc(p.name)} · ${fmt(p.g)} g</button>`).join("")}</div></div><p class="hint">Medidas caseras aproximadas (±20 %). Con balanza es más exacto.</p>`:
        `<p class="hint">${mode==="unit"?"1 "+esc(f.unitName||"u")+" = "+fmt(f.unitG)+" g. ":""}${f.recipeId?"Receta propia: los valores salen de tus ingredientes.":"Pesá en crudo / seco, salvo que el nombre diga otra cosa."}</p>`}
      <div class="preview"><div><b id="pk">${fmt(m.kcal)}</b><span>kcal</span></div><div><b id="pp">${fmt(m.p)}</b><span>Prot</span></div><div><b id="pc">${fmt(m.c)}</b><span>Carb</span></div><div><b id="pg">${fmt(m.g)}</b><span>Grasa</span></div></div>
      <div class="r"><button class="iconbtn" id="back" aria-label="Volver" style="width:56px;height:56px">${ic("left")}</button><button class="primary" id="addIt" ${grams>0?"":"disabled"}>${ic("plus")}Agregar</button></div>`;
    const qi=$("#qty");if(!sheet.keepFocus)setTimeout(()=>{qi.focus();qi.select()},50);sheet.keepFocus=false;
    qi.oninput=e=>{sheet.qty=e.target.value;const q=parseFloat(sheet.qty)||0;const mm=macrosFor(f,q*per);$("#pk").textContent=fmt(mm.kcal);$("#pp").textContent=fmt(mm.p);$("#pc").textContent=fmt(mm.c);$("#pg").textContent=fmt(mm.g);$("#addIt").disabled=!(q*per>0)};
  } else if(sheet.view==="meal"){const list=entries().filter(e=>e.meal===sheet.meal);
    el.innerHTML=`<h3>${esc(mealName)}${X}</h3><div class="scroll list">${list.map(e=>`<div class="row"><div class="n"><b>${esc(e.name)}</b><small>${esc(e.qtyTxt)} · C ${fmt(e.c)} · G ${fmt(e.g)}</small></div><div class="acts"><span class="k">${fmt(e.kcal)}<small>${fmt(e.p)} g P</small></span><button class="sm" data-del="${e.id}" aria-label="Borrar ${esc(e.name)}">${ic("x")}</button></div></div>`).join("")||`<p class="empty">Nada cargado.</p>`}</div><button class="primary ink" data-add="${sheet.meal}">${ic("plus")}Agregar</button>`;
  } else if(sheet.view==="favname"){
    el.innerHTML=`<h3>Nuevo favorito${X}</h3><p class="hint">Se guardan los ${sheet.items.length} ítems de ${esc(mealName.toLowerCase())}. Después aparecen arriba al agregar.</p><input type="text" id="favn" placeholder="Ej: desayuno colegio" autocomplete="off"><button class="primary" id="favSave">${ic("star")}Guardar</button>`;
    setTimeout(()=>{const n=$("#favn");n&&n.focus()},50);
  } else if(sheet.view==="foods"){
    el.innerHTML=`<h3>Alimentos (${foods.length})${X}</h3><input type="search" id="q" placeholder="Buscar…" value="${esc(sheet.q||"")}" autocomplete="off">
      <div class="scroll list">${searchFoods(sheet.q||"").map(f=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(f.name)}</b><small>${fmt(f.kcal)} kcal · P ${f1(f.p)} · C ${f1(f.c)} · G ${f1(f.g)}${f.unitG?" · 1 "+esc(f.unitName||"u")+" = "+fmt(f.unitG)+" g":""}</small></div><button class="sm" data-delf="${f.id}" aria-label="Borrar ${esc(f.name)}">${sheet.confirm===f.id?ic("check"):ic("trash")}</button></div>`).join("")}</div>`;
    $("#q").oninput=e=>{sheet.q=e.target.value;const pos=e.target.selectionStart;renderSheetNow();const n=$("#q");n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}};
  } else if(sheet.view==="newfood"){
    el.innerHTML=`<h3>Nuevo alimento${X}</h3><p class="hint">Copiá la porción y sus valores tal cual la etiqueta; se pasa a 100 g.</p><div class="scroll"><form id="nf">
      <label class="f" for="nfName">Nombre<input class="inset" type="text" id="nfName" required placeholder="Queso blanco"></label>
      <div class="grid2"><label class="f" for="nfPor">Porción (g o ml)<input class="inset" type="number" id="nfPor" inputmode="decimal" step="any" required placeholder="30"></label><label class="f" for="nfK">Calorías<input class="inset" type="number" id="nfK" inputmode="decimal" step="any" required placeholder="57"></label></div>
      <div class="grid3"><label class="f" for="nfP">Prot<input class="inset" type="number" id="nfP" inputmode="decimal" step="any" required></label><label class="f" for="nfC">Carb<input class="inset" type="number" id="nfC" inputmode="decimal" step="any" required></label><label class="f" for="nfG">Grasa<input class="inset" type="number" id="nfG" inputmode="decimal" step="any" required></label></div>
      <div class="grid2"><label class="f" for="nfU">Gramos por unidad<input class="inset" type="number" id="nfU" inputmode="decimal" step="any" placeholder="50"></label><label class="f" for="nfUN">Unidad<input class="inset" type="text" id="nfUN" placeholder="bolsita"></label></div>
      <button class="primary" type="submit">${ic("plus")}Guardar</button></form></div>`;
    $("#nf").onsubmit=e=>{e.preventDefault();const v=id=>parseFloat($(id).value);const por=v("#nfPor");if(!(por>0))return;const k=100/por;
      const f={name:$("#nfName").value.trim(),kcal:r1(v("#nfK")*k),p:r1(v("#nfP")*k),c:r1(v("#nfC")*k),g:r1(v("#nfG")*k)};const u=v("#nfU");if(u>0){f.unitG=u;f.unitName=$("#nfUN").value.trim()||"u"}
      if(!f.name||[f.kcal,f.p,f.c,f.g].some(isNaN))return;closeSheet();write(saveFood(newId("f"),f),"Guardado: "+f.name)};
  } else if(sheet.view==="edex"){const r=routines.find(x=>x.id===sheet.rid);const e=r&&r.ex.find(x=>x.id===sheet.eid);if(!e)return closeSheet();
    el.innerHTML=`<h3>Ejercicio${X}</h3><label class="f" for="exn">Nombre<input class="inset" type="text" id="exn" value="${esc(e.name)}"></label>
      <div class="grid4"><label class="f" for="exs">Series<input class="inset" type="number" id="exs" inputmode="numeric" value="${e.sets}"></label><label class="f" for="exlo">Reps mín<input class="inset" type="number" id="exlo" inputmode="numeric" value="${e.lo}"></label><label class="f" for="exhi">Reps máx<input class="inset" type="number" id="exhi" inputmode="numeric" value="${e.hi}"></label><label class="f" for="exst">Salto kg<input class="inset" type="number" id="exst" inputmode="decimal" step="any" value="${e.step}"></label></div>
      <label class="f" for="exrest">Descanso (segundos)<input class="inset" type="number" id="exrest" inputmode="numeric" value="${restOf(e)}"></label>
      <button class="primary" id="exSave">${ic("check")}Guardar</button>`;
  } else if(sheet.view==="recipe"){const r=recipeDraft;const tot=totals(r.items);const raw=r.items.reduce((a,i)=>a+(i.grams||0),0);const baseW=r.cookedG>0?r.cookedG:raw;const por=Math.max(1,parseInt(r.portions)||1);
    el.innerHTML=`<h3>${r.id?"Receta":"Nueva receta"}${X}</h3><div class="scroll" style="display:flex;flex-direction:column;gap:12px">
      <label class="f" for="rname">Nombre<input class="inset" type="text" id="rname" value="${esc(r.name||"")}" placeholder="Muffins proteicos de casa" autocomplete="off"></label>
      <section class="card tight list"><div class="row"><span class="eyebrow">Ingredientes (${r.items.length})</span><button class="ghost" id="raddItem" style="height:32px;font-size:12px">${ic("plus")}Agregar</button></div>
        ${r.items.map((i,k)=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(i.name)}</b><small>${esc(i.qtyTxt)} · ${fmt(i.kcal)} kcal · P ${fmt(i.p)}</small></div><button class="sm" data-rdel="${k}" aria-label="Quitar">${ic("x")}</button></div>`).join("")||`<p class="empty">Buscá cada ingrediente y cargalo en gramos o unidades, como pesás al cocinar.</p>`}</section>
      <div class="grid2"><label class="f" for="rport">Salen (porciones)<input class="inset" type="number" id="rport" inputmode="numeric" min="1" value="${esc(r.portions||"")}" placeholder="12"></label><label class="f" for="rcooked">Peso total cocido (g, opcional)<input class="inset" type="number" id="rcooked" inputmode="decimal" value="${esc(r.cookedG||"")}" placeholder="${raw?fmt(raw):"900"}"></label></div>
      <p class="hint">Si pesás la fuente al salir del horno, la app calcula los valores por 100 g (sirve para guisos y arroces). Si no, usa el peso crudo total (${fmt(raw)} g).</p>
      <button class="chip ${r.lent?"":"off"}" id="rlent" style="width:max-content">${r.lent?"Apta para abstinencia":"¿Apta para abstinencia?"}</button>
      <div class="preview"><div><b>${fmt(tot.kcal/por)}</b><span>kcal / porción</span></div><div><b>${fmt(tot.p/por)}</b><span>Prot</span></div><div><b>${fmt(tot.c/por)}</b><span>Carb</span></div><div><b>${fmt(tot.g/por)}</b><span>Grasa</span></div></div>
      <p class="hint">1 porción = ${baseW&&por?fmt(baseW/por):"—"} g · Total de la tanda: ${fmt(tot.kcal)} kcal · ${fmt(tot.p)} P · ${fmt(tot.c)} C · ${fmt(tot.g)} G.</p>
      <button class="primary" id="rsave" ${r.items.length&&(r.name||"").trim()?"":"disabled"}>${ic("check")}Guardar</button></div>`;
    const bind=(id,k,num)=>{const n=$(id);if(n)n.oninput=e=>{r[k]=num?(parseFloat(e.target.value)||0):e.target.value;const sv=$("#rsave");if(sv)sv.disabled=!(r.items.length&&(r.name||"").trim())}};
    bind("#rname","name");bind("#rport","portions",true);bind("#rcooked","cookedG",true);
    $("#rport").onchange=()=>renderSheetNow();$("#rcooked").onchange=()=>renderSheetNow();
  } else if(sheet.view==="onboarding"){const p=profile||{};const o=sheet.o||(sheet.o={sex:p.sex||"m",age:p.age||27,height:p.height||170,weight:p.weight||(bodyRows.length?bodyRows[bodyRows.length-1].weight:85),activity:p.activity||1.55,goal:p.goal||"perder",scale:p.scale!==false,goalW:goal});
    el.innerHTML=`<h3>${profile&&Object.keys(profile).length?"Tus datos":"Bienvenido"}${profile&&Object.keys(profile).length?X:""}</h3><div class="scroll" style="display:flex;flex-direction:column;gap:12px">
      <p class="hint">Con esto calculo tus calorías y macros para días de entrenamiento y de descanso. Después los podés ajustar a mano en Más.</p>
      <div class="seg"><button data-ob="sex" data-v="m" aria-pressed="${o.sex==="m"}">Hombre</button><button data-ob="sex" data-v="f" aria-pressed="${o.sex==="f"}">Mujer</button></div>
      <div class="grid3"><label class="f" for="obAge">Edad<input class="inset" type="number" id="obAge" inputmode="numeric" value="${o.age}"></label><label class="f" for="obH">Altura (cm)<input class="inset" type="number" id="obH" inputmode="numeric" value="${o.height}"></label><label class="f" for="obW">Peso (kg)<input class="inset" type="number" id="obW" inputmode="decimal" step="0.1" value="${o.weight}"></label></div>
      <span class="eyebrow">Actividad fuera del gym</span>
      <div class="offer" style="min-height:0;padding:0"><div class="chips">${[[1.2,"Sedentario"],[1.375,"Camino un poco"],[1.55,"10 mil pasos / deporte"],[1.725,"Trabajo físico"]].map(([v,l])=>`<button data-ob="activity" data-v="${v}" style="${o.activity==v?"border-color:var(--accent-line);background:var(--accent-dim);color:var(--accent)":""}">${l}</button>`).join("")}</div></div>
      <span class="eyebrow">Objetivo</span>
      <div class="seg"><button data-ob="goal" data-v="perder" aria-pressed="${o.goal==="perder"}">Perder grasa</button><button data-ob="goal" data-v="mantener" aria-pressed="${o.goal==="mantener"}">Mantener</button><button data-ob="goal" data-v="ganar" aria-pressed="${o.goal==="ganar"}">Ganar músculo</button></div>
      <label class="f" for="obGW">Peso meta (kg)<input class="inset" type="number" id="obGW" inputmode="decimal" step="0.5" value="${o.goalW}"></label>
      <span class="eyebrow">¿Tenés balanza de cocina?</span>
      <div class="seg"><button data-ob="scale" data-v="1" aria-pressed="${o.scale}">Sí</button><button data-ob="scale" data-v="0" aria-pressed="${!o.scale}">No</button></div>
      <p class="hint">${o.scale?"Vas a cargar en gramos: es lo más exacto.":"Vas a poder cargar en porciones caseras (taza, cucharada, palma). Es una aproximación; cuando puedas, pesá."}</p>
      ${(()=>{const t=calcTargets(o);return `<div class="preview"><div><b>${fmt(t.gym.kcal)}</b><span>kcal gym</span></div><div><b>${fmt(t.rest.kcal)}</b><span>kcal descanso</span></div><div><b>${fmt(t.gym.p)}</b><span>Prot</span></div><div><b>${fmt(t.gym.g)}</b><span>Grasa</span></div></div>`})()}
      <button class="primary" id="obSave">${ic("check")}Guardar</button></div>`;
    [["#obAge","age"],["#obH","height"],["#obW","weight"],["#obGW","goalW"]].forEach(([id,k])=>{const n=$(id);n.oninput=e=>{o[k]=parseFloat(e.target.value)||0};n.onchange=()=>renderSheetNow()});
  } else if(sheet.view==="listen"){renderListen(el)}
}

/* ---------- Escuchar: música y rosario ---------- */
let trackIdx=0,playing=false,listenTab="musica",rosaryStep=0;
const player=$("#player");
player.addEventListener("ended",()=>{if(tracks.length>1){playTrack((trackIdx+1)%tracks.length)}else{playing=false;refreshPlayerUI()}});
player.addEventListener("pause",()=>{playing=false;refreshPlayerUI()});player.addEventListener("play",()=>{playing=true;refreshPlayerUI()});
player.addEventListener("timeupdate",()=>{const p=$("#pbar");if(p&&player.duration)p.style.width=(player.currentTime/player.duration*100)+"%"});
function trackSrc(t){return t.url||""}
function playTrack(i){if(!tracks.length)return;trackIdx=i;player.src=trackSrc(tracks[i]);player.play().catch(()=>toast("No se pudo reproducir esta pista"))}
function togglePlay(){if(!tracks.length)return;if(!player.src)return playTrack(trackIdx);if(player.paused)player.play().catch(()=>{});else player.pause()}
function refreshPlayerUI(){if(sheet&&sheet.view==="listen")renderSheetNow();if(view==="entreno"&&!typing())renderNow()}
/* Misterios con cita, fruto tradicional y una meditación breve. */
const MYST={
 gozosos:[
  {t:"La Anunciación del Ángel a María",ref:"Lc 1, 26-38",fruit:"Humildad",med:"María dice que sí sin entenderlo todo. Pedí esa disposición para lo que hoy te cuesta."},
  {t:"La Visitación de María a su prima Isabel",ref:"Lc 1, 39-56",fruit:"Caridad con el prójimo",med:"Recién embarazada, María sale de prisa a servir. Pensá a quién podés servir hoy con lo que te sobra de fuerza."},
  {t:"El Nacimiento de Jesús en Belén",ref:"Lc 2, 1-20",fruit:"Pobreza de espíritu",med:"Dios elige un pesebre. Pedí no necesitar más de lo que necesitás, también en la mesa."},
  {t:"La Presentación de Jesús en el Templo",ref:"Lc 2, 22-38",fruit:"Obediencia",med:"José y María cumplen la ley sin excepciones. Pedí fidelidad en lo pequeño de cada día."},
  {t:"El Niño Jesús perdido y hallado en el Templo",ref:"Lc 2, 41-52",fruit:"Buscar a Dios en todo",med:"Tres días de búsqueda. Pedí perseverancia cuando el fruto tarda en verse."}],
 dolorosos:[
  {t:"La Oración de Jesús en el Huerto",ref:"Lc 22, 39-46",fruit:"Dolor de los pecados",med:"Jesús tiene miedo y aun así dice: no mi voluntad sino la tuya. Ofrecé lo que hoy no tenés ganas de hacer."},
  {t:"La Flagelación del Señor",ref:"Jn 19, 1",fruit:"Mortificación",med:"Jesús carga en su cuerpo el peso del pecado. Pedí templanza: dominar el cuerpo para que no te domine."},
  {t:"La Coronación de espinas",ref:"Mt 27, 27-31",fruit:"Humildad",med:"Se burlan de su realeza. Pedí no buscar ser visto ni admirado en lo que hacés."},
  {t:"Jesús con la Cruz a cuestas",ref:"Lc 23, 26-32",fruit:"Paciencia en las pruebas",med:"Cae y se levanta. Cuando falles en la dieta o el entreno, hacé lo mismo: levantate sin dramas."},
  {t:"La Crucifixión y Muerte de Jesús",ref:"Jn 19, 25-30",fruit:"Perseverancia final",med:"Todo está cumplido. Pedí llegar al final de cada cosa que empezás, también de este plan."}],
 gloriosos:[
  {t:"La Resurrección del Señor",ref:"Mt 28, 1-10",fruit:"Fe",med:"La tumba vacía cambia todo. Pedí fe para creer que el esfuerzo escondido tiene sentido."},
  {t:"La Ascensión del Señor a los Cielos",ref:"Hch 1, 6-11",fruit:"Esperanza",med:"Jesús sube y nos manda a la misión. Pedí poner la mirada en lo alto y no en el espejo."},
  {t:"La Venida del Espíritu Santo",ref:"Hch 2, 1-13",fruit:"Amor a Dios",med:"Los apóstoles pierden el miedo. Pedí fortaleza para sostener lo que te propusiste."},
  {t:"La Asunción de María a los Cielos",ref:"Ap 12, 1",fruit:"Gracia de una buena muerte",med:"El cuerpo de María es llevado al cielo: el cuerpo también está llamado a la gloria. Cuidalo como lo que es."},
  {t:"La Coronación de María como Reina",ref:"Ap 12, 1",fruit:"Confianza en María",med:"La más humilde es coronada. Pedí a María que te enseñe a servir sin buscar corona."}],
 luminosos:[
  {t:"El Bautismo de Jesús en el Jordán",ref:"Mt 3, 13-17",fruit:"Fidelidad al bautismo",med:"Este es mi Hijo amado. Recordá quién sos antes de medir cuánto pesás."},
  {t:"Las Bodas de Caná",ref:"Jn 2, 1-11",fruit:"Confianza en la intercesión de María",med:"Hagan lo que Él les diga. Pedí hacer bien lo que te toca, sin discutir."},
  {t:"El Anuncio del Reino de Dios",ref:"Mc 1, 14-15",fruit:"Conversión",med:"Conviértanse y crean. Pedí cambiar un hábito concreto, no todos a la vez."},
  {t:"La Transfiguración",ref:"Mt 17, 1-8",fruit:"Deseo de santidad",med:"Jesús deja ver su gloria un momento. Pedí no quedarte en el monte: bajar y seguir trabajando."},
  {t:"La Institución de la Eucaristía",ref:"Lc 22, 14-20",fruit:"Adoración",med:"Él se hace pan. Que cada comida te recuerde quién te alimenta de verdad."}]
};
function mysteriesFor(d){const w=parse(d).getDay();return w===1||w===6?"gozosos":w===2||w===5?"dolorosos":w===4?"luminosos":"gloriosos"}
const PN="Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu Reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.";
const AM="Dios te salve, María, llena eres de gracia, el Señor es contigo; bendita Tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.";
const GL="Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.";
const JES="Oh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu misericordia.";
const SALVE="Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A Ti llamamos los desterrados hijos de Eva; a Ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce Virgen María! Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.";
function rosarySteps(d){const k=mysteriesFor(d);const S=[{t:"Señal de la cruz",x:"En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén."},{t:"Acto de contrición",x:"Señor mío Jesucristo, Dios y Hombre verdadero, me pesa de todo corazón haberte ofendido. Propongo firmemente no pecar más. Amén."},{t:"Padre nuestro",x:PN}];
  for(let i=1;i<=3;i++)S.push({t:"Ave María "+i+" de 3",x:AM,bead:i,of:3});S.push({t:"Gloria",x:GL});
  MYST[k].forEach((m,mi)=>{S.push({t:(mi+1)+"º misterio "+k[0].toUpperCase()+k.slice(1,-1)+"o",x:m.t,sub:"Fruto: "+m.fruit+" · "+m.ref,med:m.med,myst:true});S.push({t:"Padre nuestro",x:PN});for(let i=1;i<=10;i++)S.push({t:"Ave María "+i+" de 10",x:AM,bead:i,of:10});S.push({t:"Gloria",x:GL});S.push({t:"Oh Jesús mío",x:JES})});
  S.push({t:"Salve",x:SALVE});S.push({t:"Fin",x:"Por las intenciones del Santo Padre: Padre nuestro, Ave María y Gloria. En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén."});return S}
function renderListen(el){const t=tracks[trackIdx];const canUp=!!backend;
  const head=`<h3>Escuchar${X}</h3><div class="seg"><button data-ltab="musica" aria-pressed="${listenTab==="musica"}">Música</button><button data-ltab="rosario" aria-pressed="${listenTab==="rosario"}">Rosario</button></div>`;
  if(listenTab==="musica"){
    el.innerHTML=head+`<div class="scroll" style="display:flex;flex-direction:column;gap:12px">
      <section class="card" style="display:flex;flex-direction:column;gap:14px"><div class="top"><div class="l"><span class="eyebrow">${t?(playing?"Sonando":"En pausa"):"Sin pistas"}</span><b style="font-size:22px;font-weight:500;line-height:1.1">${t?esc(t.name):"Agregá tu música"}</b><small class="hint">${t?"Instrumental · pista "+(trackIdx+1)+" de "+tracks.length:"Subí un archivo o pegá un enlace."}</small></div><span class="iconbtn inset" style="border-radius:12px;color:var(--accent)" aria-hidden="true">${ic("music")}</span></div>
        <div class="bar" style="height:4px"><i id="pbar" style="width:${player.duration?player.currentTime/player.duration*100:0}%"></i></div>
        <div style="display:flex;justify-content:center;gap:18px;align-items:center"><button class="iconbtn" data-tprev="1" aria-label="Anterior" ${tracks.length?"":"disabled"}>${ic("prev")}</button><button class="iconbtn acc" data-pp="1" style="width:60px;height:60px" aria-label="${playing?"Pausar":"Reproducir"}" ${tracks.length?"":"disabled"}>${ic(playing?"pause":"play")}</button><button class="iconbtn" data-tnext="1" aria-label="Siguiente" ${tracks.length?"":"disabled"}>${ic("next")}</button></div></section>
      <section class="card tight list">${tracks.map((x,i)=>`<div class="row"><button class="food" data-tsel="${i}" style="border:0;padding:0;flex:1"><b style="${i===trackIdx?"color:var(--accent);font-weight:600":""}">${esc(x.name)}</b></button><button class="sm" data-tdel="${x.id}" aria-label="Borrar pista">${sheet.confirm===x.id?ic("check"):ic("trash")}</button></div>`).join("")}
        <div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><span class="eyebrow">Agregar pista</span>
          ${canUp?`<label class="ghost g" for="tfile" style="justify-content:center">${ic("plus")}Subir archivo<input id="tfile" type="file" accept="audio/*,video/mp4,.m4a,.mp3,.wav,.ogg" hidden></label>`:``}
          <div class="r"><input type="url" class="inset" id="turl" placeholder="https://… enlace a un .mp3" style="flex:1;height:44px;border-radius:12px"><button class="iconbtn" id="taddurl" aria-label="Agregar enlace">${ic("link")}</button></div></div></section>
      <p class="hint">Probá que siga sonando con la pantalla bloqueada: si se corta, avisame y buscamos otra forma.</p></div>`;
    const tf=$("#tfile");if(tf)tf.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)uploadTrack(f)};
  } else {const S=rosarySteps(wcur);rosaryStep=Math.min(rosaryStep,S.length-1);const s=S[rosaryStep];const k=mysteriesFor(wcur);
    el.innerHTML=head+`<div class="scroll rosary"><span class="eyebrow" style="text-align:center">Misterios ${k} · ${esc(DOW[parse(wcur).getDay()])}</span>
      <div style="text-align:center"><b style="font-size:20px;font-weight:600">${esc(s.t)}</b></div>
      ${s.bead?`<div class="beads" aria-label="Cuenta ${s.bead} de ${s.of}">${Array.from({length:s.of},(_,i)=>`<i class="${i<s.bead?"on":""}"></i>`).join("")}</div>`:""}
      <p class="txt" style="${s.myst?"font-size:24px;font-weight:400;text-align:center;min-height:0":""}">${esc(s.x)}</p>${s.myst?`<p class="hint" style="text-align:center">${esc(s.sub)}</p><p style="margin:0;font-size:15px;line-height:1.5;text-align:center;color:var(--ink)">${esc(s.med)}</p>`:""}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><button class="iconbtn" data-rprev="1" aria-label="Anterior" ${rosaryStep?"":"disabled"} style="width:56px;height:56px">${ic("left")}</button><span class="hint">${rosaryStep+1} / ${S.length}</span><button class="primary" data-rnext="1" style="flex:1">${rosaryStep===S.length-1?"Amén":"Siguiente"}</button></div>
      <p class="hint" style="text-align:center">Tocá Siguiente al terminar cada oración; podés ir rezando entre series con la música de fondo.</p></div>`}
}
async function uploadTrack(file){if(!backend)return;toast("Subiendo "+file.name+"…");const id=newId("t");
  try{const r=await backend.uploadTrack(file,id);const tr={name:file.name.replace(/\.[^.]+$/,""),url:r.url,path:r.path,order:Date.now()};await backend.setDoc("tracks/"+id,tr);toast("Pista guardada")}
  catch(e){toast(e&&e.code==="storage/unauthorized"?"Storage rechazó la subida: revisá las reglas (README).":"No se pudo subir el archivo")}}

/* ---------- Eventos ---------- */
function setInput(exId,i,k,val){saveWorkout(w=>{const arr=w.sets[exId]=w.sets[exId]||[];while(arr.length<=i)arr.push({});const s=arr[i];if(k==="hard"){s.hard=!s.hard}else{const n=parseFloat(String(val).replace(",","."));s[k]=isNaN(n)?null:n}},null,k!=="hard");
  if(k!=="hard"){const s=wsets(exId)[i]||{};const ok=document.querySelector(`button[data-ok="${exId}"][data-i="${i}"]`);if(ok)ok.setAttribute("aria-pressed",!!(s.w>0&&s.r>0))}}
function saveIntents(list){intents=list.slice(0,12);write(backend.setDoc("settings/intents",{list:intents}))}
document.addEventListener("click",e=>{
  const b=e.target.closest("button,[role=button]");if(!b)return;const d=b.dataset;
  if(d.view){view=d.view;closeSheet();if(view==="entreno"&&!workout)openWorkout(wcur);else render();return}
  if(b.id==="timerpill"){view="entreno";render();return}
  if(b.id==="prev")openDay(addDays(cur,-1));else if(b.id==="next")openDay(addDays(cur,1));else if(b.id==="todayBtn")openDay(today());
  else if(b.id==="tType"){const t=dayType()==="gym"?"rest":"gym";saveDay(x=>x.type=t)}
  else if(d.check){const k=d.check;saveDay(x=>{x.check[k]=!x.check[k]})}
  else if(d.add){if(!ready)return;openSheet({view:"search",meal:d.add,q:""})}
  else if(d.open){openSheet({view:"meal",meal:d.open,short:true})}
  else if(d.del){saveDay(x=>x.entries=x.entries.filter(y=>y.id!==d.del),"Borrado");if(sheet&&sheet.view==="meal")renderSheetNow()}
  else if(d.fav){const items=entries().filter(x=>x.meal===d.fav).map(({id,meal,...r})=>r);openSheet({view:"favname",meal:d.fav,items,short:true})}
  else if(b.id==="favSave"){const name=$("#favn").value.trim();if(!name)return;const c={name,meal:sheet.meal,items:sheet.items};closeSheet();write(backend.setDoc("combos/"+newId("c"),c),"Favorito guardado")}
  else if(d.combo){const c=combos.find(x=>x.id===d.combo);if(!c)return;const meal=sheet.meal;closeSheet();saveDay(x=>{c.items.forEach(it=>x.entries.push({...it,id:newId("e"),meal}))},"Agregado: "+c.name)}
  else if(d.delcombo){write(backend.delDoc("combos/"+d.delcombo),"Favorito borrado")}
  else if(b.id==="copyY"){const y=addDays(cur,-1);let once=false;const un=backend.watchDoc("days/"+y,v=>{if(once)return;once=true;setTimeout(()=>un&&un(),0);
      if(!v||!v.entries||!v.entries.length){toast("Ayer no hay nada cargado");return}saveDay(x=>{x.type=v.type||x.type;x.entries=v.entries.map(it=>({...it,id:newId("e")}))},"Copiado de ayer")})}
  else if(b.id==="openFoods"){if(!ready)return;openSheet({view:"foods",q:""})}
  else if(b.id==="newFood"){openSheet({view:"newfood"})}
  else if(b.id==="x")closeSheet();
  else if(d.pick){const f=foods.find(x=>x.id===d.pick);const ports=portionsFor(f);const noScale=profile&&profile.scale===false&&sheet.target!=="recipe";const mode=f.unitG?"unit":(noScale&&ports.length?"portion":"g");sheet={...sheet,view:"qty",foodId:f.id,mode,portion:mode==="portion"?ports[0]:null,qty:mode==="g"?"100":"1"};renderSheetNow()}
  else if(d.mode&&sheet&&sheet.view==="qty"){const f=foods.find(x=>x.id===sheet.foodId);const ports=portionsFor(f);sheet.mode=d.mode;if(d.mode==="portion"){sheet.portion=sheet.portion||ports[0];sheet.qty="1"}else if(d.mode==="unit")sheet.qty="1";else sheet.qty="100";renderSheetNow()}
  else if(d.portion!==undefined&&sheet&&sheet.view==="qty"){const f=foods.find(x=>x.id===sheet.foodId);sheet.portion=portionsFor(f)[+d.portion];sheet.qty=sheet.qty||"1";renderSheetNow()}
  else if(b.id==="back"){sheet.view="search";sheet.q="";renderSheetNow()}
  else if(b.id==="addIt"){const f=foods.find(x=>x.id===sheet.foodId);const q=parseFloat(sheet.qty)||0;if(!(q>0))return;
    const mode=sheet.mode||(f.unitG?"unit":"g");const per=mode==="unit"?f.unitG:mode==="portion"&&sheet.portion?sheet.portion.g:1;const grams=q*per;const m=macrosFor(f,grams);
    const qtyTxt=mode==="g"?fmt(grams)+" g":f1(q)+" "+(mode==="unit"?(f.unitName||"u"):sheet.portion.name)+" ("+fmt(grams)+" g)";
    const entry={id:newId("e"),meal:sheet.meal||"",foodId:f.id,name:f.name,grams:r1(grams),qtyTxt,kcal:r1(m.kcal),p:r1(m.p),c:r1(m.c),g:r1(m.g)};
    if(sheet.target==="recipe"){recipeDraft.items.push(entry);sheet={view:"recipe"};renderSheetNow();return}
    closeSheet();saveDay(x=>x.entries.push(entry),"Agregado")}
  else if(d.delf){const id=d.delf;if(sheet.confirm===id){sheet.confirm=null;write(deleteFood(id),"Alimento borrado")}else{sheet.confirm=id;renderSheetNow()}}
  else if(b.id==="theme"){const h=document.documentElement;const light=h.getAttribute("data-theme")!=="light";if(light)h.setAttribute("data-theme","light");else h.removeAttribute("data-theme");try{localStorage.setItem("balanza_theme",light?"light":"dark")}catch(x){}render()}
  /* Entreno */
  else if(b.id==="wprev")openWorkout(addDays(wcur,-1));else if(b.id==="wnext")openWorkout(addDays(wcur,1));else if(b.id==="wtoday")openWorkout(today());
  else if(d.rsel){routineSel=d.rsel;if(workout&&workout.routineId!==d.rsel){saveWorkout(w=>{w.routineId=d.rsel;w.sets={};w.done=false})}else render()}
  else if(b.id==="offerSkip"){offerSkip=true;saveWorkout(w=>{w.offered=true})}
  else if(d.intent){const i=$("#intencion");if(i){i.value=d.intent;i.focus()}}
  else if(b.id==="offer"){const txt=($("#intencion").value||"").trim();saveWorkout(w=>{w.offered=true;w.intention=txt},txt?"Ofrecido por "+txt:"Ofrecido");if(txt)saveIntents([txt,...intents.filter(x=>x!==txt)])}
  else if(d.delint){saveIntents(intents.filter(x=>x!==d.delint));render()}
  else if(d.hard){setInput(d.hard,+d.i,"hard")}
  else if(d.ok){const ex=curRoutine().ex.find(x=>x.id===d.ok);const ss=wsets(d.ok);const i=+d.i;const s=ss[i]||{};const prev=ss[i-1]||{};const sg=suggest(ex);
    if(!(s.w>0)&&!(prev.w>0)&&!(sg.w>0)&&!(s.r>0)){const inp=document.querySelector(`input[data-set="${d.ok}"][data-i="${i}"][data-k="w"]`);if(inp){inp.focus();toast("Cargá el peso primero")}return}
    let completed=false;saveWorkout(w=>{const arr=w.sets[d.ok]=w.sets[d.ok]||[];while(arr.length<=i)arr.push({});const t=arr[i];if(t.w>0&&t.r>0){arr[i]={}}else{t.w=s.w>0?s.w:(prev.w>0?prev.w:sg.w);t.r=s.r>0?s.r:ex.lo;if(t.rir==null)t.rir=2;completed=true}});
    if(completed)startTimer(ex);else stopTimer()}
  else if(b.id==="finish")finishWorkout();
  else if(b.id==="openListen"&&!e.target.closest("[data-pp]")){openSheet({view:"listen"})}
  else if(d.pp){togglePlay()}else if(d.tprev){playTrack((trackIdx-1+tracks.length)%tracks.length)}else if(d.tnext){playTrack((trackIdx+1)%tracks.length)}
  else if(d.tsel){playTrack(+d.tsel)}
  else if(d.tdel){const id=d.tdel;if(sheet.confirm===id){sheet.confirm=null;const t=tracks.find(x=>x.id===id);write(backend.delDoc("tracks/"+id),"Pista borrada");if(t&&t.path)backend.deleteTrackFile(t.path)}else{sheet.confirm=id;renderSheetNow()}}
  else if(b.id==="taddurl"){const u=($("#turl").value||"").trim();if(!/^https?:\/\//.test(u))return toast("Pegá un enlace que empiece con https://");const name=decodeURIComponent(u.split("/").pop()||"Pista").replace(/\.[^.]+$/,"")||"Pista";write(backend.setDoc("tracks/"+newId("t"),{name,url:u,order:Date.now()}),"Pista agregada")}
  else if(d.ltab){listenTab=d.ltab;renderSheetNow()}
  else if(d.rnext){const S=rosarySteps(wcur);if(rosaryStep>=S.length-1){rosaryStep=0;closeSheet();toast("Amén")}else{rosaryStep++;renderSheetNow()}}
  else if(d.rprev){rosaryStep=Math.max(0,rosaryStep-1);renderSheetNow()}
  /* Recetas */
  else if(b.id==="newRecipe"){recipeDraft={id:null,name:"",items:[],portions:"",cookedG:0,lent:false};openSheet({view:"recipe"})}
  else if(d.edrec){const r=recipes.find(x=>x.id===d.edrec);if(!r)return;recipeDraft=JSON.parse(JSON.stringify(r));openSheet({view:"recipe"})}
  else if(d.delrec){const r=recipes.find(x=>x.id===d.delrec);if(!r)return;if(pendingDel===r.id){pendingDel=null;write(Promise.all([backend.delDoc("recipes/"+r.id),backend.delDoc("foods/rec-"+r.id)]),"Receta borrada")}else{pendingDel=r.id;toast("Tocá otra vez para borrar "+r.name);setTimeout(()=>{if(pendingDel===r.id)pendingDel=null},3500)}}
  else if(b.id==="raddItem"){openSheet({view:"search",target:"recipe",q:""})}
  else if(d.rdel){recipeDraft.items.splice(+d.rdel,1);renderSheetNow()}
  else if(b.id==="rlent"){recipeDraft.lent=!recipeDraft.lent;renderSheetNow()}
  else if(b.id==="rsave"){const r=recipeDraft;if(!r.items.length||!(r.name||"").trim())return;const id=r.id||newId("r");const por=Math.max(1,parseInt(r.portions)||1);const raw=r.items.reduce((a,i)=>a+(i.grams||0),0);const baseW=r.cookedG>0?r.cookedG:raw;const tot=totals(r.items);const k=100/baseW;
    const food={name:r.name.trim(),kcal:r1(tot.kcal*k),p:r1(tot.p*k),c:r1(tot.c*k),g:r1(tot.g*k),unitG:r1(baseW/por),unitName:"porción",recipeId:id,lent:!!r.lent};
    const rec={name:r.name.trim(),items:r.items,portions:por,cookedG:r.cookedG||0,lent:!!r.lent};closeSheet();write(Promise.all([backend.setDoc("recipes/"+id,rec),backend.setDoc("foods/rec-"+id,food)]),"Receta guardada: "+rec.name)}
  /* Onboarding */
  else if(d.ob){const o=sheet.o;o[d.ob]=d.ob==="scale"?d.v==="1":(d.ob==="activity"?parseFloat(d.v):d.v);renderSheetNow()}
  else if(b.id==="obSave"){const o=sheet.o;const t=calcTargets(o);const prof={sex:o.sex,age:o.age,height:o.height,weight:o.weight,activity:o.activity,goal:o.goal,scale:!!o.scale,updated:today()};closeSheet();
    targets=t;if(o.goalW>0)goal=o.goalW;write(Promise.all([backend.setDoc("settings/profile",prof),backend.setDoc("settings/targets",{...t,goal})]),"Objetivos calculados");if(o.weight>0&&!bodyRows.length)backend.setDoc("body/"+today(),{date:today(),weight:r1(o.weight)});render()}
  else if(b.id==="recalc"){openSheet({view:"onboarding"})}
  /* Datos */
  else if(b.id==="exportData"){toast("Preparando la copia…");backend.exportAll(["days","workouts","body","combos","recipes","foods","tracks","settings"]).then(dump=>{const blob=new Blob([JSON.stringify(dump,null,1)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="scaeli-fit-"+today()+".json";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}).catch(()=>toast("No se pudo exportar"))}
  /* Cuerpo */
  else if(b.id==="saveBody"){const w=parseFloat(($("#bw").value||"").replace(",","."));const wa=parseFloat(($("#bwa").value||"").replace(",","."));if(!(w>0)&&!(wa>0))return;const rec={date:today()};if(w>0)rec.weight=r1(w);if(wa>0)rec.waist=r1(wa);write(backend.setDoc("body/"+today(),rec),"Guardado")}
  else if(d.delbody){write(backend.delDoc("body/"+d.delbody),"Borrado")}
  /* Más */
  else if(d.edex){const[rid,eid]=d.edex.split("/");openSheet({view:"edex",rid,eid,short:true})}
  else if(b.id==="exSave"){const r=routines.find(x=>x.id===sheet.rid);const ex=r.ex.find(x=>x.id===sheet.eid);ex.name=$("#exn").value.trim()||ex.name;ex.sets=parseInt($("#exs").value)||ex.sets;ex.lo=parseInt($("#exlo").value)||ex.lo;ex.hi=Math.max(ex.lo,parseInt($("#exhi").value)||ex.lo);ex.step=parseFloat($("#exst").value)||0;ex.rest=parseInt($("#exrest").value)||restOf(ex);
    closeSheet();write(backend.setDoc("settings/routines",{list:routines}),"Rutina guardada")}
  else if(b.id==="resetR"){routines=JSON.parse(JSON.stringify(DEFAULT_ROUTINES));write(backend.setDoc("settings/routines",{list:routines}),"Rutinas restauradas")}
});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset&&t.dataset.set){setInput(t.dataset.set,+t.dataset.i,t.dataset.k,t.value)}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sheet)closeSheet();if(e.key==="Enter"&&e.target.id==="intencion"){e.preventDefault();$("#offer").click()}});
$("#scrim").addEventListener("click",closeSheet);

/* ---------- Arranque: login, datos y sincronización ---------- */
let user=null,unsubs=[],profile=null,recipes=[];
const DEFAULT_RULES_MSG="La base de datos rechazó la operación. Si sos quien administra la app, revisá que las reglas de Firestore estén publicadas (ver README).";
function mergeFoods(){foods=BASE.filter(f=>!hidden.has(f.id)).concat(userFoods);if(sheet)renderSheet();if(view==="mas"&&!typing())render()}
function saveFood(id,f){return backend.setDoc("foods/"+id,f)}
function deleteFood(id){if(BASE.some(f=>f.id===id)){hidden.add(id);return backend.setDoc("settings/hidden",{list:[...hidden]})}return backend.delDoc("foods/"+id)}
function renderLogin(){
  $("#nav").hidden=true;
  $("#app").innerHTML=`<div class="offer" style="justify-content:center;gap:36px;text-align:center;align-items:center">
    <div style="display:flex;flex-direction:column;align-items:center;gap:16px"><span class="dot"></span><h1 class="title" style="font-size:44px">Scaeli Fit</h1><p class="sub" style="font-size:15px">Ordenar el cuerpo desde la templanza.</p></div>
    <p class="pr" style="font-size:20px;max-width:28ch">Comidas, entrenamiento ofrecido y descanso, con tus datos guardados en tu cuenta.</p>
    <button class="primary" id="login" style="max-width:320px">${ic("user")}Entrar</button>
    <p class="hint" id="status">${esc(statusTxt)}</p></div>`;
}
function startSession(u){
  user=u;unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[];
  backend=userBackend(u.uid,e=>{if(e&&e.code==="permission-denied")setStatus(DEFAULT_RULES_MSG,true);else setStatus("Sin conexión: los cambios se guardan y se sincronizan después.",false)});
  setStatus("Sincronizado · "+(u.displayName||u.email||""));
  $("#nav").hidden=false;
  const w=(fn)=>{const un=fn();if(typeof un==="function")unsubs.push(un)};
  w(()=>backend.watchCol("foods",list=>{userFoods=list;mergeFoods()}));
  w(()=>backend.watchDoc("settings/hidden",v=>{hidden=new Set((v&&v.list)||[]);mergeFoods()}));
  w(()=>backend.watchCol("combos",list=>{combos=list;if(sheet&&sheet.view==="search")renderSheet();if(view==="mas")render()}));
  w(()=>backend.watchCol("recipes",list=>{recipes=list.slice().sort((a,b)=>a.name.localeCompare(b.name,"es"));if(sheet&&(sheet.view==="recipes"||sheet.view==="recipe"))renderSheet();if(view==="mas")render()}));
  w(()=>backend.watchCol("body",list=>{bodyRows=list;if(view==="cuerpo")render()}));
  w(()=>backend.watchCol("tracks",list=>{tracks=list.slice().sort((a,b)=>(a.order||0)-(b.order||0));if(trackIdx>=tracks.length)trackIdx=0;if(sheet&&sheet.view==="listen")renderSheet();if(view==="entreno")render()}));
  w(()=>backend.watchDoc("settings/targets",t=>{if(t&&t.gym&&t.rest)targets={gym:t.gym,rest:t.rest};if(t&&t.goal>0)goal=t.goal;render()}));
  w(()=>backend.watchDoc("settings/profile",p=>{const first=profile===null;profile=p||{};if(first&&!p)setTimeout(()=>openSheet({view:"onboarding"}),400);render()}));
  w(()=>backend.watchDoc("settings/routines",r=>{if(r&&r.list&&r.list.length)routines=r.list;if(view!=="hoy")render()}));
  w(()=>backend.watchDoc("settings/loads",l=>{loads=l||{};if(view==="entreno")render()}));
  w(()=>backend.watchDoc("settings/intents",v=>{intents=(v&&v.list)||[];if(view==="entreno"||view==="mas")render()}));
  ready=true;render();openDay(cur);openWorkout(wcur);
}
function endSession(){user=null;backend=null;ready=false;unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[];profile=null;foods=[];userFoods=[];combos=[];recipes=[];bodyRows=[];tracks=[];loads={};intents=[];day=null;workout=null;targets=DEFAULT_TARGETS;routines=DEFAULT_ROUTINES;closeSheet();renderLogin()}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.id==="login"){b.disabled=true;setStatus("Abriendo Google…");login().catch(err=>{setStatus("No se pudo entrar: "+(err&&err.message||""),true);b.disabled=false})}
  else if(b.id==="logout"){logout()}});
try{if(localStorage.getItem("balanza_theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}
fetch("data/foods.json").then(r=>r.json()).then(list=>{BASE=list;mergeFoods()}).catch(()=>setStatus("No se pudo cargar la base de alimentos.",true));
if(navigator.serviceWorker&&navigator.serviceWorker.register){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
renderLogin();
finishRedirect().then(()=>{watchAuth(u=>{if(u)startSession(u);else endSession()})});
