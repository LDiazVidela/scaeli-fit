import { login, logout, watchAuth, finishRedirect, userBackend, localBackend, gruposBackend, gruposLocal } from "./firebase.js";
import * as PJ from "./personaje.js";
import { ORACIONES, MISTERIOS, ROS_MED, ROS_FATIMA, ROS_DIAS_N } from "../data/rosario.js";
const LOGO_APPLE='<svg class="logo-a" viewBox="0 0 814 1000" aria-hidden="true"><path fill="currentColor" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>';
const LOGO_GOOGLE='<svg class="logo-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const DAILY_URL="https://ldiazvidela.github.io/scaeli-daily/";
/* Scaeli+ compartido con Daily (docs/SCAELI_PLUS_COMPARTIDO.md): equipo con acceso completo, y "ver como gratis" para probar. */
const PLUS_EQUIPO=["lorenzodiazvidela@gmail.com"];
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
let dprofile=null;
let wHist=[],grupo={gid:null,meta:null,L:null,unsub:null,err:""},grupoBE=null,gSyncT=null,gUlt="";   // el personaje, editado en Daily (users/{uid}/daily_settings/profile)
function personajeHTML(cls,tam){return '<canvas class="pj '+(cls||"")+'" data-pj="south" data-tam="'+(tam||160)+'" width="128" height="128" aria-label="Tu personaje"></canvas>'}
function pintarPersonajes(){if(!PJ.cargado())return;document.querySelectorAll("canvas[data-pj]").forEach(cv=>{const t=+cv.dataset.tam||160;PJ.pintar(cv,dprofile||{},"south",t);if(t<128){cv.style.width=t+"px";cv.style.height=t+"px"}})}

import { loadSprite, SpriteAnim, EJERCICIOS } from "./sprite.js";
import { CATALOGO } from "../data/catalogo.js";
import { ILUS } from "../data/ilus.js";
import { TECNICA } from "../data/tecnica.js";
import { CUERPO_FRENTE, CUERPO_ESPALDA } from "../data/cuerpo.js";

/* Sprite por id de ejercicio de la rutina (los ids viejos de la app se mapean por el catálogo). */
const SPRITE_BY_APP={};CATALOGO.forEach(c=>{const sp=EJERCICIOS[c.id]?c.id:(c.sprite&&EJERCICIOS[c.sprite]?c.sprite:null);if(sp){SPRITE_BY_APP[c.id]=sp;if(c.app)SPRITE_BY_APP[c.app]=sp}});
const spriteFor=ex=>SPRITE_BY_APP[ex.id]||null;
/* Dibujos de ejercicio (Everkinetic): dos poses que se alternan. Se buscan por id del catálogo o por id histórico (app). */
const CAT_BY_APP={};CATALOGO.forEach(c=>{if(c.app)CAT_BY_APP[c.app]=c.id});
const iluId=ex=>{const id=ex.id;if(ILUS.has(id))return id;const c=CAT_BY_APP[id];return c&&ILUS.has(c)?c:null};
const ILU_BASE=new URL("assets/ilus/ej/",document.baseURI).href; // url() dentro de una variable CSS se resuelve contra la hoja de estilos: por eso va absoluta
const iluHTML=(id,cls)=>`<span class="ilu ${cls||""}" aria-hidden="true"><i class="a" style="--m:url(${ILU_BASE}${id}-a.svg)"></i><i class="b" style="--m:url(${ILU_BASE}${id}-b.svg)"></i></span>`;

/* Niveles e insignias: subir de nivel como en el juego, sin ruido. */
const LEVELS=[["Principiante",0],["Intermedio",300],["Avanzado",900],["Experto",2000],["Maestro",4000]];
const XP={workout:50,offered:20,rosary:30,fast:15,meals:10,body:5};
/* Fondos del personaje: se eligen en Daily (daily_settings/profile.fondo) y acá solo se muestran. */
const FONDOS_FIT=["manana","mediodia","tarde","noche","horas","luminosos","gloriosos","gozosos","evangelio","dolorosos","santo","misa","oraciones"];
const fondoFit=()=>{const k=dprofile&&dprofile.fondo;return k&&FONDOS_FIT.includes(k)?k:null};
const BADGES=[
 ["w1","Primer entreno","gym",p=>p.counts.workouts>=1],["w10","10 entrenos","gym",p=>p.counts.workouts>=10],["w50","50 entrenos","gym",p=>p.counts.workouts>=50],
 ["o10","10 ofrecidos","cross",p=>p.counts.offered>=10],["r1","Primer rosario","rosary",p=>p.counts.rosaries>=1],["r10","10 rosarios","rosary",p=>p.counts.rosaries>=10],
 ["s7","7 días seguidos","candle",p=>p.best>=7],["s30","30 días seguidos","candle",p=>p.best>=30],["m30","30 días de comidas","egg",p=>p.counts.meals>=30],["b14","14 pesajes","scale",p=>p.counts.body>=14]
];
const FAST_PLANS=[["16:8",16],["18:6",18],["20:4",20],["OMAD",23],["Eclesiástico",0]];
let progress={xp:0,counts:{workouts:0,offered:0,rosaries:0,meals:0,body:0},days:[],best:0,badges:{}},plus=null,fast=null,fasts=[];
const FAST_FRASES=["«El que es fiel en lo poco, también es fiel en lo mucho.» (Lc 16, 10)","«No solo de pan vive el hombre.» (Mt 4, 4)","«Tu Padre, que ve en lo secreto, te recompensará.» (Mt 6, 18)"];
function levelOf(xp){let i=0;LEVELS.forEach((l,k)=>{if(xp>=l[1])i=k});const cur=LEVELS[i],next=LEVELS[i+1];return{i,name:cur[0],from:cur[1],to:next?next[1]:null,pct:next?Math.min(100,(xp-cur[1])/(next[1]-cur[1])*100):100}}
function streakOf(days,ref){const set=new Set(days);let n=0,d=ref;if(!set.has(d)){d=addDays(d,-1);if(!set.has(d))return{n:0,today:false}}while(set.has(d)){n++;d=addDays(d,-1)}return{n,today:set.has(ref)}}
const delEquipo=()=>!!(user&&user.email&&PLUS_EQUIPO.includes(String(user.email).toLowerCase()));
const isPlus=()=>{if(lsGet("fit_plus_como_gratis")==="1")return false;return delEquipo()||!!(plus&&plus.active&&(!plus.until||plus.until>=today()))};
function plusDoc(extra){return{active:true,since:today(),until:null,plan:null,code:null,source:"code",app:"fit",updated:Date.now(),...extra}}

const ic=n=>`<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const MEALS=[["desayuno","Desayuno"],["almuerzo","Almuerzo"],["merienda","Merienda"],["cena","Cena"],["extra","Extra"]];
const DEFAULT_TARGETS={gym:{kcal:1900,p:175,c:160,g:60},rest:{kcal:1700,p:175,c:125,g:55}};
const CHECKS=[["prot","Proteína","egg"],["crea","Creatina","pill"],["pasos","Pasos","steps"],["agua","Agua","drop"],["sueno","Sueño","moon"]];
/* «Tu día»: cada ítem muestra su número y su meta; tocarlo abre un panel que explica para qué sirve. */
const DIA={
 prot:{n:"Proteína",u:"g",why:"Es lo que reconstruye el músculo después de entrenar. Se suma sola con lo que cargás en las comidas.",auto:true},
 pasos:{n:"Pasos",u:"pasos",meta:10000,step:500,q:"¿Cuántos pasos llevás hoy?",why:"Caminar es la forma más simple de gastar energía sin cansar las piernas para el gym. Miralo en el contador de tu teléfono o reloj."},
 sueno:{n:"Sueño",u:"h",meta:8,step:.5,q:"¿Cuántas horas dormiste anoche?",why:"Dormir bien es lo que más cuida el músculo, el hambre y las ganas de entrenar."},
 agua:{n:"Agua",u:"L",meta:2.5,step:.25,q:"¿Cuánta agua tomaste hoy?",why:"Con agua suficiente rendís más, tenés menos hambre falsa y la creatina funciona mejor. Un vaso son 0,25 L."},
 crea:{n:"Creatina",u:"",why:"5 g por día, a cualquier hora, todos los días (también los de descanso). Ayuda a sumar fuerza y músculo.",tick:true}};
const diaVal=k=>{const d=day&&day.vals||{};return d[k]!=null?d[k]:null};
const nfmt=(v,u)=>u==="pasos"?fmt(v):f1(v);
const nfmtC=(v,u)=>u==="pasos"&&v>=1000?f1(v/1000)+" mil":nfmt(v,u); // corto, para que entre en la tarjeta
const PLAN_START="2026-10-24";
const DEFAULT_GOAL=80;
const OBJETIVOS=[
 ["perder","Definir · bajar grasa","Comés un 20 % menos de lo que gastás. Bajás de peso y entrenás para no perder músculo.","Para quien tiene grasa de sobra para bajar. Ritmo sano: 0,5–1 % del peso por semana."],
 ["recomp","Recomposición","Comés un poco menos los días de descanso y lo justo los días de gym. Bajás grasa y ganás músculo a la vez; el peso casi no se mueve.","Ideal si estás empezando o volviendo a entrenar. Se mide por la cintura y la fuerza, no por la balanza."],
 ["ganar","Volumen · ganar músculo","Comés un 10 % más de lo que gastás para construir músculo. Sumás algo de grasa, controlada.","Para quien ya está flaco o quiere crecer. Ritmo sano: subir 0,25–0,5 % del peso por semana."],
 ["mantener","Mantener","Comés lo que gastás. Sostenés tu peso y entrenás para estar fuerte y sano.","Para quien ya está conforme con su cuerpo."]];
const objNombre=g=>(OBJETIVOS.find(x=>x[0]===g)||OBJETIVOS[0])[1];
function calcTargets(o){const w=o.weight||80,h=o.height||170,a=o.age||30;const bmr=10*w+6.25*h-5*a+(o.sex==="f"?-161:5);const tdee=bmr*(parseFloat(o.activity)||1.55);
  // definición: déficit 20 % · recomposición: déficit chico en descanso y mantenimiento al entrenar · volumen: superávit 10 %
  let rest,gym;if(o.goal==="recomp"){rest=Math.round(tdee*0.9/10)*10;gym=Math.round(tdee*1.0/10)*10}else{const adj=o.goal==="perder"?0.8:o.goal==="ganar"?1.1:1;rest=Math.round(tdee*adj/10)*10;gym=rest+200}
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


/* ---------- Biblioteca de programas: rutinas preseteadas armadas con el catálogo ---------- */
function exDeCatalogo(cid,sets,lo,hi){const c=CATALOGO.find(x=>x.id===cid)||{};const tiempo=/plancha|bicho|farmer|soga|mountain/.test(cid);
  const e={id:cid,name:c.nombre||cid,sets:sets||3,lo:lo||(tiempo?30:10),hi:hi||(tiempo?30:12),step:tiempo?0:(c.equipo==="peso-corporal"?0:(c.paso!=null?c.paso:2.5)),rest:c.rest||90};if(tiempo)e.tiempo=true;return e}
const prog=(id,nombre,desc,nivel,lugar,rutinas)=>({id,nombre,desc,nivel,lugar,rutinas:rutinas.map(([rid,name,day,goal,ex])=>({id:rid,name,day,goal,ex:ex.map(e=>Array.isArray(e)?exDeCatalogo(...e):exDeCatalogo(e))}))});
const PROGRAMAS=[
 {id:"ul4",nombre:"Upper / Lower · 4 días",desc:"El plan base de Scaeli Fit: empuje, piernas, tracción y posterior, en máquinas.",nivel:"Intermedio",lugar:"Gym",rutinas:DEFAULT_ROUTINES},
 prog("fb3","Full body · 3 días","Todo el cuerpo tres veces por semana. Lo mejor para empezar en el gym.","Principiante","Gym",[
  ["fbA","Full body A",1,"Todo el cuerpo",[["sentadilla-goblet",3,8,12],["chest-press-maquina",3,8,12],["remo-maquina",3,10,12],["press-hombros-maquina",3,10,12],["curl-biceps-maquina",2,12,15],["plancha",3,30,30]]],
  ["fbB","Full body B",3,"Todo el cuerpo",[["prensa-45",3,10,12],["jalon-al-pecho",3,10,12],["press-inclinado-maquina",3,10,12],["curl-femoral-sentado",3,12,15],["triceps-polea-soga",2,12,15],["abdominales-polea",3,12,15]]],
  ["fbC","Full body C",5,"Todo el cuerpo",[["peso-muerto-rumano",3,8,10],["remo-polea-baja",3,10,12],["press-militar-mancuernas",3,10,12],["extension-cuadriceps",3,12,15],["elevaciones-laterales",3,12,15],["elevacion-piernas-piso",3,12,15]]]]),
 prog("ppl","Push / Pull / Legs","Empuje, tracción y piernas. Tres días, o seis repitiendo la vuelta.","Intermedio","Gym",[
  ["push","Push",1,"Pecho, hombros y tríceps",[["press-banca",4,6,10],["press-inclinado-mancuernas",3,8,12],["press-hombros-maquina",3,10,12],["elevaciones-laterales",3,12,15],["triceps-polea-soga",3,12,15],["extension-triceps-polea",2,12,15]]],
  ["pull","Pull",3,"Espalda y bíceps",[["jalon-al-pecho",4,8,12],["remo-barra",3,8,10],["remo-polea-baja",3,10,12],["face-pull",3,15,15],["curl-biceps-barra",3,10,12],["curl-martillo",2,12,15]]],
  ["legs","Legs",5,"Piernas y glúteo",[["sentadilla-barra",4,6,10],["peso-muerto-rumano",3,8,10],["prensa-45",3,10,12],["curl-femoral-sentado",3,12,15],["gemelos-de-pie",4,12,15],["plancha",3,40,40]]]]),
 prog("casa","En casa · sin equipo","Peso corporal, 25 minutos. Para los días sin gym o para empezar desde cero.","Principiante","Casa",[
  ["casaA","Casa A",1,"Piernas y empuje",[["sentadilla-sin-peso",3,12,15],["flexiones",3,8,12],["zancadas",3,10,12],["puente-gluteo",3,12,15],["plancha",3,30,30]]],
  ["casaB","Casa B",3,"Core y tracción",[["remo-invertido",3,8,12],["flexiones-rodillas",3,10,15],["bicho-muerto",3,10,12],["sentadilla-salto",3,10,10],["plancha-lateral",3,20,20]]],
  ["casaC","Casa C",5,"Completo",[["burpees",3,8,10],["saltos-tijera",3,30,30],["mountain-climbers",3,30,30],["abdominales-piso",3,15,20],["sentadilla-sin-peso",3,15,20]]]]),
 prog("gl3","Glúteos y piernas · 3 días","Tren inferior con un día de tren superior liviano.","Intermedio","Gym",[
  ["glA","Glúteo A",1,"Glúteo y posterior",[["hip-thrust-maquina",4,8,12],["peso-muerto-rumano",3,8,12],["abductores-maquina",3,15,20],["patada-gluteo-polea",3,12,15],["curl-femoral-acostado",3,12,15]]],
  ["glB","Superior",3,"Tren superior",[["jalon-al-pecho",3,10,12],["chest-press-maquina",3,10,12],["press-hombros-maquina",3,10,12],["remo-polea-baja",3,12,12],["triceps-polea-soga",2,12,15]]],
  ["glC","Piernas B",5,"Cuádriceps y glúteo",[["sentadilla-hack",4,8,12],["sentadilla-bulgara",3,10,12],["prensa-45",3,10,12],["extension-cuadriceps",3,12,15],["gemelos-en-prensa",4,12,15]]]]),
 prog("maq","Principiante en máquinas · 3 días","Solo máquinas, fáciles de aprender. Para la primera vez en un gym.","Principiante","Gym",[
  ["mqA","Máquinas A",1,"Empuje y piernas",[["prensa-45",3,10,12],["chest-press-maquina",3,10,12],["press-hombros-maquina",3,10,12],["extension-cuadriceps",3,12,15],["abdominales-maquina",3,12,15]]],
  ["mqB","Máquinas B",3,"Tracción y posterior",[["jalon-al-pecho",3,10,12],["remo-maquina",3,10,12],["curl-femoral-sentado",3,12,15],["curl-biceps-maquina",3,12,15],["gemelos-sentado",3,12,15]]],
  ["mqC","Máquinas C",5,"Completo",[["sentadilla-hack",3,10,12],["press-inclinado-maquina",3,10,12],["remo-polea-baja",3,12,12],["pec-deck",3,12,15],["posterior-hombro-pec-deck",3,15,15]]]])
];
/* ---------- Mi equipo: cada usuario marca lo que tiene y la app arma rutinas posibles ---------- */
const EQUIPOS=[["gym","Voy a un gimnasio","Máquinas, poleas y todo lo demás"],["mancuernas","Mancuernas","Fijas o ajustables"],["barra","Barra con discos",""],["rack","Soportes o rack","Para sentadilla y press con barra"],["banco","Banco plano",""],["inclinable","Banco inclinable","Se levanta el respaldo"],["dominadas","Barra de dominadas",""],["kettlebell","Kettlebell",""]];
let equipo=null; // null = sin configurar (se muestra todo)
const NEED_GYM=new Set(["fondos-paralelas","hiperextensiones","curl-predicador","elevacion-piernas-colgado","rueda-abdominal"]);
function reqDe(c){if(!c)return["gym"];const id=c.id,e=c.equipo;if(e==="maquina"||e==="polea"||NEED_GYM.has(id))return["gym"];
  const r=[];if(e==="mancuernas")r.push("mancuernas");if(e==="barra")r.push("barra");if(e==="kettlebell")r.push("kettlebell");
  if(/^dominadas/.test(id))r.push("dominadas");
  if(/inclinado|curl-inclinado/.test(id))r.push("inclinable");
  else if(/press-banca|press-declinado|press-cerrado|aperturas-mancuernas|pull-over|press-frances|extension-triceps-mancuerna|curl-concentrado|step-up|sentadilla-bulgara|remo-mancuerna|hip-thrust-maquina/.test(id))r.push("banco");
  if(/sentadilla-barra|sentadilla-frontal|press-banca$|press-inclinado-barra|press-declinado-barra|press-cerrado|press-militar-barra/.test(id))r.push("rack");
  return r}
const tieneEq=k=>!equipo||equipo.includes("gym")||equipo.includes(k)||(k==="banco"&&equipo.includes("inclinable"));
const puedo=c=>reqDe(c).every(k=>k==="gym"?(!equipo||equipo.includes("gym")):tieneEq(k));
const eqTxt=()=>!equipo?"Sin configurar":equipo.length?EQUIPOS.filter(e=>equipo.includes(e[0])).map(e=>e[1]).join(" · "):"Solo el cuerpo";
const porMancuerna=ex=>{const c=CATALOGO.find(x=>x.id===(CAT_BY_APP[ex.id]||ex.id));return !!(c&&c.equipo==="mancuernas"&&!/goblet|pull-over|extension-triceps-mancuerna|flexion-lateral/.test(c.id))};
/* Programas de casa: cada lugar de la rutina tiene opciones en orden de preferencia; se elige la primera que el equipo permite. */
const OPC={
 sent:["sentadilla-barra","sentadilla-goblet","sentadilla-sin-peso"],bulg:["sentadilla-bulgara","zancadas","sentadilla-sin-peso"],
 bisagra:["peso-muerto-rumano","kettlebell-swing","puente-gluteo"],gluteo:["hip-thrust-maquina","puente-gluteo"],
 pecho:["press-banca","press-banca-mancuernas","flexiones"],pechoInc:["press-inclinado-mancuernas","press-inclinado-barra","flexiones"],
 remo:["remo-barra","remo-mancuerna-un-brazo","remo-invertido"],remo2:["remo-mancuerna-un-brazo","remo-barra","remo-invertido"],tiron:["dominadas","remo-mancuerna-un-brazo","remo-invertido"],
 hombro:["press-militar-mancuernas","press-militar-barra","flexiones"],lateral:["elevaciones-laterales","pajaros"],post:["pajaros","remo-invertido"],
 biceps:["curl-biceps-mancuernas","curl-biceps-barra","curl-martillo"],martillo:["curl-martillo","curl-biceps-mancuernas"],triceps:["extension-triceps-mancuerna","press-frances","patada-triceps","fondos-banco"],
 core:["plancha","bicho-muerto"],core2:["elevacion-piernas-piso","abdominales-piso"],core3:["plancha-lateral","bicho-muerto"],
 aperturas:["aperturas-mancuernas","flexiones"],gemelo:["step-up","sentadilla-salto"]};
function pick(slot,usados){const c=OPC[slot].map(id=>CATALOGO.find(x=>x.id===id)).find(x=>x&&puedo(x)&&!usados.has(x.id))||OPC[slot].map(id=>CATALOGO.find(x=>x.id===id)).find(x=>x&&puedo(x));if(c)usados.add(c.id);return c&&c.id}
function rutinaCasa(rid,name,day,goal,slots){const u=new Set();const ex=[];slots.forEach(([sl,sets,lo,hi])=>{const id=pick(sl,u);if(id&&!ex.some(e=>e.id===id)){const e=exDeCatalogo(id,sets,lo,hi);const c=CATALOGO.find(x=>x.id===id);if(c&&c.equipo==="mancuernas")e.step=Math.min(e.step||2,2);ex.push(e)}});return{id:rid,name,day,goal,ex}}
function programasCasa(){return[
 {id:"casa-fb3",casa:true,nombre:"En casa · full body 3 días",desc:"Todo el cuerpo tres veces por semana con lo que tengas en casa.",nivel:"Principiante",lugar:"Casa",rutinas:[
  rutinaCasa("cfA","Casa A",1,"Todo el cuerpo",[["sent",3,8,12],["pecho",3,8,12],["remo",3,10,12],["hombro",3,10,12],["biceps",2,10,15],["core",3,30,40]]),
  rutinaCasa("cfB","Casa B",3,"Todo el cuerpo",[["bisagra",3,8,12],["pechoInc",3,8,12],["tiron",3,8,12],["lateral",3,12,15],["triceps",2,10,15],["core2",3,12,15]]),
  rutinaCasa("cfC","Casa C",5,"Todo el cuerpo",[["bulg",3,8,12],["gluteo",3,10,12],["pecho",3,10,12],["remo2",3,10,12],["martillo",2,12,15],["core3",3,10,12]])]},
 {id:"casa-tp4",casa:true,nombre:"En casa · torso / piernas 4 días",desc:"Cuatro días alternando torso y piernas. Ideal con mancuernas, banco y barra.",nivel:"Intermedio",lugar:"Casa",rutinas:[
  rutinaCasa("ctA","Torso A",1,"Pecho, espalda y brazos",[["pecho",4,6,10],["remo",4,8,10],["hombro",3,8,12],["aperturas",3,10,15],["biceps",3,10,12],["triceps",3,10,12]]),
  rutinaCasa("ctB","Piernas A",2,"Cuádriceps y core",[["sent",4,6,10],["bulg",3,8,12],["gemelo",3,12,15],["core",3,30,45],["core2",3,12,15]]),
  rutinaCasa("ctC","Torso B",4,"Espalda, hombros y brazos",[["tiron",4,6,10],["pechoInc",3,8,12],["remo2",3,10,12],["lateral",3,12,15],["post",3,12,15],["martillo",3,10,12]]),
  rutinaCasa("ctD","Piernas B",5,"Posterior y glúteo",[["bisagra",4,8,10],["gluteo",3,10,12],["bulg",3,10,12],["core3",3,10,12],["core",3,30,45]])]}]}
/* más rutinas de casa: solo mancuernas, 30 minutos y sin equipo (estas no dependen de Mi equipo) */
const fijo=(rid,name,day,goal,list)=>({id:rid,name,day,goal,ex:list.map(([id,sets,lo,hi])=>{const e=exDeCatalogo(id,sets,lo,hi);const c=CATALOGO.find(x=>x.id===id);if(c&&c.equipo==="mancuernas")e.step=Math.min(e.step||2,2);return e}).filter(Boolean)});
const CASA_EXTRA=[
 {id:"casa-man3",nombre:"Casa · solo mancuernas 3 días",desc:"Un par de mancuernas y el piso. Sin banco ni barra.",nivel:"Principiante",lugar:"Casa",rutinas:[
  fijo("cmA","Mancuernas A",1,"Todo el cuerpo",[["sentadilla-goblet",3,10,12],["press-militar-mancuernas",3,8,12],["remo-mancuerna-un-brazo",3,10,12],["flexiones",3,8,15],["curl-biceps-mancuernas",2,10,15],["plancha",3,30,45]]),
  fijo("cmB","Mancuernas B",3,"Todo el cuerpo",[["zancadas",3,10,12],["press-arnold",3,8,12],["pull-over",3,10,12],["elevaciones-laterales",3,12,15],["patada-triceps",2,12,15],["bicho-muerto",3,10,12]]),
  fijo("cmC","Mancuernas C",5,"Todo el cuerpo",[["sentadilla-goblet",3,12,15],["thruster",3,8,10],["remo-mancuerna-un-brazo",3,10,12],["pajaros",3,12,15],["curl-martillo",2,10,12],["farmer-walk",3,30,45]])]},
 {id:"casa-30",nombre:"Casa · 30 minutos",desc:"Para días apretados: cinco ejercicios, tres vueltas y listo. Con mancuernas.",nivel:"Principiante",lugar:"Casa",rutinas:[
  fijo("c30A","Express A",1,"Todo el cuerpo",[["sentadilla-goblet",3,10,15],["flexiones",3,8,15],["remo-mancuerna-un-brazo",3,10,12],["press-militar-mancuernas",3,10,12],["plancha",3,30,40]]),
  fijo("c30B","Express B",3,"Todo el cuerpo",[["zancadas",3,10,12],["press-banca-mancuernas",3,10,12],["remo-mancuerna-un-brazo",3,10,12],["elevaciones-laterales",3,12,15],["mountain-climbers",3,30,40]]),
  fijo("c30C","Express C",5,"Todo el cuerpo",[["thruster",3,10,12],["flexiones",3,8,15],["pull-over",3,10,12],["curl-martillo",3,10,12],["bicho-muerto",3,10,12]])]},
 {id:"casa-se4",nombre:"Casa · sin equipo 4 días",desc:"Solo el peso del cuerpo, cuatro días. Para viajes o para empezar.",nivel:"Principiante",lugar:"Casa",rutinas:[
  fijo("cs1","Torso 1",1,"Pecho, espalda y brazos",[["flexiones",4,8,15],["remo-invertido",3,8,12],["fondos-banco",3,10,15],["flexiones-rodillas",2,10,15],["plancha",3,30,45]]),
  fijo("cs2","Piernas 1",2,"Piernas y glúteo",[["sentadilla-sin-peso",4,15,20],["puente-gluteo",3,15,20],["sentadilla-salto",3,10,12],["plancha-lateral",3,30,40],["bicicleta",3,15,20]]),
  fijo("cs3","Torso 2",4,"Hombro y core",[["flexiones",4,8,15],["remo-invertido",3,10,12],["mountain-climbers",3,30,40],["elevacion-piernas-piso",3,12,15],["bicho-muerto",3,10,12]]),
  fijo("cs4","Piernas 2",5,"Piernas y cardio",[["sentadilla-sin-peso",4,15,20],["burpees",3,8,12],["puente-gluteo",3,15,20],["saltos-tijera",3,30,40],["russian-twist",3,15,20]])]}];
/* ---------- «Armame una rutina»: reglas de entrenamiento, sin IA (gratis, instantáneo, sin conexión) ---------- */
const AR_OBJ=[["musculo","Ganar músculo"],["fuerza","Más fuerza"],["grasa","Bajar grasa"],["salud","Salud"]];
const AR_PRIO=[["","Nada en especial"],["pecho","Pecho"],["espalda","Espalda"],["piernas","Piernas"],["gluteos","Glúteos"],["hombros","Hombros"],["biceps","Bíceps"],["triceps","Tríceps"]];
const AR_SLOTS={biceps:["biceps","martillo"],triceps:["triceps"],pecho:["pecho","pechoInc","aperturas"],espalda:["remo","tiron","remo2"],piernas:["sent","bulg","gemelo"],gluteos:["gluteo","bisagra"],hombros:["hombro","lateral","post"],brazos:["biceps","triceps","martillo"],core:["core","core2","core3"]};
const AR_TPL={full:["sent","pecho","remo","hombro","bisagra","biceps","core","triceps"],torso:["pecho","remo","hombro","pechoInc","tiron","biceps","triceps","lateral"],piernas:["sent","bisagra","bulg","gluteo","gemelo","core","core2"],
  empuje:["pecho","hombro","pechoInc","lateral","triceps","aperturas","core"],tiron:["remo","tiron","remo2","post","biceps","martillo","core"]};
const AR_DIAS={2:[1,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,4,5],6:[1,2,3,4,5,6]};
function arSplit(d){return d<=3?Array.from({length:d},(_,i)=>["full","Cuerpo completo "+"ABC"[i]]):d===4?[["torso","Torso A"],["piernas","Piernas A"],["torso","Torso B"],["piernas","Piernas B"]]:d===5?[["torso","Torso A"],["piernas","Piernas A"],["empuje","Empuje"],["tiron","Tirón"],["piernas","Piernas B"]]:[["empuje","Empuje A"],["tiron","Tirón A"],["piernas","Piernas A"],["empuje","Empuje B"],["tiron","Tirón B"],["piernas","Piernas B"]]}
function arEsquema(obj,principal){if(obj==="fuerza")return principal?[4,4,6]:[3,8,10];if(obj==="grasa")return[3,10,15];if(obj==="salud")return[2,10,15];return principal?[3,6,10]:[3,8,12]}
function armarPrograma(o){const n={30:4,45:5,60:6,75:7}[o.min]||5;const split=arSplit(o.dias);const dias=AR_DIAS[o.dias];
  const usados={};// cada plantilla comparte lo usado: la B elige variantes de lo que ya hizo la A
  const rutinas=split.map(([tpl,name],di)=>{let slots=AR_TPL[tpl].slice();
    let pos=1;(o.prios||[]).forEach(pg=>{const ps=AR_SLOTS[pg].filter(x=>!slots.slice(0,n).includes(x));const trabaja=tpl==="full"||AR_TPL[tpl].slice(0,n).some(x=>AR_SLOTS[pg].includes(x));if(trabaja&&ps.length)slots.splice(pos++,0,ps[di%ps.length])});
    slots=slots.slice(0,n);const u=usados[tpl]||(usados[tpl]=new Set());const ex=[];
    slots.forEach((sl,i)=>{const id=pick(sl,u);if(!id||ex.some(e=>e.id===id))return;const tiempo=/plancha|bicho|farmer|soga|mountain/.test(id);let [st,lo,hi]=arEsquema(o.obj,i<2);
      if((o.prios||[]).some(pg=>AR_SLOTS[pg].includes(sl)))st+=1;const e=exDeCatalogo(id,st,tiempo?30:lo,tiempo?45:hi);if(o.obj==="grasa")e.rest=Math.min(e.rest||90,75);const c=CATALOGO.find(x=>x.id===id);if(c&&c.equipo==="mancuernas")e.step=Math.min(e.step||2,2);ex.push(e)});
    return{id:"ar"+di+Date.now().toString(36).slice(-4),name,day:dias[di],goal:{full:"Todo el cuerpo",torso:"Pecho, espalda y brazos",piernas:"Piernas y glúteos",empuje:"Pecho, hombros y tríceps",tiron:"Espalda y bíceps"}[tpl],ex}});
  const obj=AR_OBJ.find(x=>x[0]===o.obj)[1].toLowerCase();const [s1,l1,h1]=arEsquema(o.obj,false);
  const why=`${o.dias} días (${o.dias<=3?"cuerpo completo":o.dias===4?"torso y piernas":o.dias===5?"torso, piernas, empuje y tirón":"empuje, tirón y piernas, dos veces"}), ${n} ejercicios para ${o.min} minutos, ${s1}×${l1}–${h1} para ${obj}${(o.prios||[]).length?"; "+prioTxt(o.prios)+" con ejercicios y series extra":""}.`;
  return{rutinas,why}}
const prioTxt=ps=>{const t=ps.map(k=>AR_PRIO.find(x=>x[0]===k)[1].toLowerCase());return t.length>1?t.slice(0,-1).join(", ")+" y "+t[t.length-1]:t[0]||""};
/* varios músculos en una sesión: el primero elegido lleva más ejercicios (peso 2, el resto 1); si sobran lugares, core al final */
const AR_MAS={pecho:["pecho","pechoInc","aperturas","pecho"],espalda:["remo","tiron","remo2","post"],piernas:["sent","bulg","gemelo","bisagra"],gluteos:["gluteo","bisagra","bulg"],hombros:["hombro","lateral","post"],brazos:["biceps","triceps","martillo"],biceps:["biceps","martillo"],triceps:["triceps"]};
function armarSesion(o){const u=new Set();const gs=(o.prios&&o.prios.length?o.prios:["pecho"]).slice(0,3);const n={30:4,45:5,60:6,75:7}[o.min]||5;
  const m=n>=6&&gs.length>1?n-1:n;const w=gs.map((_,i)=>i===0?2:1),W=w.reduce((a,b)=>a+b,0);const cnt=w.map(x=>Math.max(1,Math.floor(m*x/W)));let r=m-cnt.reduce((a,b)=>a+b,0);for(let i=cnt.length-1;r>0;i=(i-1+cnt.length)%cnt.length,r--)cnt[i]++;
  const slots=[];gs.forEach((g,gi)=>{const L=AR_MAS[g]||AR_SLOTS[g];for(let k=0;k<cnt[gi];k++)slots.push(L[k%L.length])});while(slots.length<n)slots.push(slots.length%2?"core2":"core");
  const ex=[];slots.forEach((sl,i)=>{const id=pick(sl,u);if(!id||ex.some(e=>e.id===id))return;const tiempo=/plancha|bicho|farmer|soga|mountain/.test(id);const [st,lo,hi]=arEsquema(o.obj,i<2);ex.push(exDeCatalogo(id,st,tiempo?30:lo,tiempo?45:hi))});
  return{id:"hoy-"+gs.join("-"),name:"Hoy · "+prioTxt(gs).replace(/^./,c=>c.toUpperCase()),day:-1,goal:"Sesión suelta",ex}}
const todosProgramas=()=>programasCasa().concat(CASA_EXTRA,PROGRAMAS);
const GRUPOS=[["pecho","Pecho"],["espalda","Espalda"],["hombros","Hombros"],["piernas","Piernas"],["gluteos","Glúteos"],["brazos","Brazos"],["core","Core"],["completo","Completo"]];
let rutDraft={name:"",day:-1,ex:[]},rosMini=false,rosMiniTxt=false,lastRestEx=null,prs={};
const e1rm=(w,r)=>r>0&&w>0?w*(1+r/30):0;
/* Una serie cuenta recién cuando se confirma con «Hecha» (ok:true). Las viejas, sin ese dato, cuentan si tienen reps. */
const hecha=x=>!!x&&(x.ok===true||(x.ok===undefined&&x.r>0));
function usarRutina(id){routineSel=id;if(workout&&workout.routineId!==id){saveWorkout(w=>{w.routineId=id;w.sets={};w.done=false;w.offered=false;w.intention=""})}else render();window.scrollTo(0,0)}
function saveRoutines(msg){write(backend.setDoc("settings/routines",{list:routines}),msg)}

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
const fecha=d=>{const dt=parse(d);return DOW[dt.getDay()].replace(/^./,c=>c.toUpperCase())+" "+dt.getDate()+" "+dt.toLocaleDateString("es-AR",{month:"short"}).replace(".","")};

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
let statusTxt="",statusErr=false;
function setStatus(t,err){statusTxt=t;statusErr=!!err;const s=$("#status");if(s){s.textContent=t;s.classList.toggle("err",!!err)}}
function toast(t){const el=$("#toast");el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2000)}
async function write(p,okMsg){try{await p;if(okMsg)toast(okMsg)}catch(e){toast(e&&e.code==="quota_exceeded"?"La base está llena: borrá lo que no uses.":"No se pudo guardar. Probá de nuevo.")}}

/* ---------- Día ---------- */
const dayType=()=> (day&&day.type)||defType(cur);
const entries=()=> (day&&day.entries)||[];
const checks=()=> (day&&day.check)||{};
function saveDay(mut,msg){const d={date:cur,type:dayType(),entries:entries().map(e=>({...e})),check:{...checks()},vals:{...((day&&day.vals)||{})}};mut(d);day=d;render();write(backend.setDoc("days/"+cur,d),msg);
  if(new Set(d.entries.map(e=>e.meal)).size>=3)award("meals",cur)}
let dayUnsub=null;
function openDay(d){cur=d;day=null;render();if(!backend)return;if(dayUnsub)dayUnsub();dayUnsub=backend.watchDoc("days/"+d,v=>{if(cur===d){day=v;render()}})}
function totals(list){return list.reduce((a,e)=>({kcal:a.kcal+e.kcal,p:a.p+e.p,c:a.c+e.c,g:a.g+e.g}),{kcal:0,p:0,c:0,g:0})}
function macrosFor(f,grams){const k=grams/100;return{kcal:f.kcal*k,p:f.p*k,c:f.c*k,g:f.g*k}}
/* La lista ordenada y los nombres normalizados se calculan una vez por cambio de base, no por tecla. */
let foodsSorted=[];
function sortedFoods(){return foodsSorted}
const MAX_RES=60;
function searchFoods(q,max){q=norm(q);const lim=max||MAX_RES;if(!q)return foodsSorted.slice(0,lim);const words=q.split(/\s+/);const out=[];
  for(const f of foodsSorted){const n=f._n||(f._n=norm(f.name));if(words.every(w=>n.includes(w))){out.push(f);if(out.length>=lim)break}}return out}
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
function curRoutineBase(){const ids=[workout&&workout.routineId,routineSel,(routineFor(wcur)||{}).id];for(const id of ids){const r=id&&routines.find(x=>x.id===id);if(r)return r}return null}
/* Cambios de ejercicio en medio del entreno (workout.cambios[idEnLaRutina] = {antes, nuevo}): el anterior queda con las series que ya hiciste y el nuevo sigue con las que faltan */
function curRoutine(){const r=curRoutineBase();const C=workout&&workout.routineId===(r&&r.id)&&workout.cambios;if(!r||!C||!Object.keys(C).length)return r;
  return{...r,ex:r.ex.flatMap(e=>{const c=C[e.id];if(!c)return[e];return(c.antes?[c.antes]:[]).concat([c.nuevo||e])})}}
function wsets(exId){return (workout&&workout.sets&&workout.sets[exId])||[]}
function restOf(ex){return ex.rest>0?ex.rest:(ex.step>=5?180:90)}
function saveWorkout(mut,msg,quiet){const r=curRoutine();if(!r)return;
  const w={date:wcur,routineId:r.id,sets:JSON.parse(JSON.stringify((workout&&workout.sets)||{})),done:!!(workout&&workout.done),intention:(workout&&workout.intention)||"",offered:!!(workout&&workout.offered),startedAt:(workout&&workout.startedAt)||null,pausedAt:(workout&&workout.pausedAt)||null,pausedMs:(workout&&workout.pausedMs)||0,extra:(workout&&workout.extra)||{},cambios:(workout&&workout.cambios)||{},autoPaused:!!(workout&&workout.autoPaused),summary:(workout&&workout.summary)||null};
  mut(w);workout=w;if(!quiet)render();write(backend.setDoc("workouts/"+wcur,w),msg)}
const esTiempo=ex=>!!(ex.tiempo||(ex.step===0&&/plancha|seg|hollow|farmer|soga|escalador|mountain/i.test(ex.name)));
function suggest(ex){const L=loads[ex.id];
  if(esAsist(ex)){if(!L||!L.asist)return{w:null,why:"Asistida: cargá los kg de ayuda que usaste. Cuanta menos ayuda, más fuerza."};const st=ex.step>0?ex.step:2.5;
    if(L.hard)return{w:L.w,why:"Mantené "+f1(L.w)+" kg de ayuda: la última vez costó.",hold:true};
    if(L.top)return{w:Math.max(0,r1(L.w-st)),why:L.w-st<=0?"¡Probá sin ayuda! Cumpliste el rango con la ayuda mínima.":"Bajá la ayuda a "+f1(Math.max(0,L.w-st))+" kg: cumpliste el rango."};
    return{w:L.w,why:"Mantené "+f1(L.w)+" kg de ayuda hasta cumplir el rango en todas las series.",hold:true}}
  if(!L||!(L.w>0))return{w:null,why:esTiempo(ex)?"Anotá los segundos que aguantaste con buena forma.":ex.step===0?"Peso corporal: anotá las reps; si agregás lastre, cargalo en kg.":(porMancuerna(ex)?"Primera vez: elegí el peso de cada mancuerna que te deje 2 reps en el tanque.":"Primera vez: elegí un peso que te deje 2 reps en el tanque.")};
  if(ex.step===0)return{w:L.w,why:"Último registro: "+L.w+"."};
  if(L.hard)return{w:L.w,why:"Mantener "+f1(L.w)+" kg: la última vez una serie costó.",hold:true};
  if(L.top)return{w:r1(L.w+ex.step),why:"Subís +"+f1(ex.step)+" kg"+(porMancuerna(ex)?" por mancuerna":"")+": cumpliste el rango con RIR ≥ 2."+(porMancuerna(ex)?" Si no tenés ese peso, usá el más cercano y sumá una repetición por serie.":"")};
  return{w:L.w,why:"Mantener "+f1(L.w)+" kg hasta cumplir el rango en todas las series.",hold:true}}
/* ---------- Rangos de fuerza: mejor marca estimada (1RM) de los básicos, comparada con el peso corporal ----------
   factor = cuánto «vale» ese ejercicio respecto del básico con barra (mancuernas: por mancuerna). */
const RANGOS=[["Hierro","#8A8F98"],["Bronce","#C27C4A"],["Plata","#C9D1DA"],["Oro","#F2B544"],["Platino","#7FD1C7"],["Diamante","#8AB4FF"]];
/* Umbrales (1RM / peso corporal) tomados de estándares de fuerza: Bronce = novato (meses entrenando), Plata = intermedio (1–2 años bien entrenados),
   Oro = avanzado, Platino = élite amateur, Diamante = competidor. Mancuernas: el factor pasa el peso de una mancuerna al equivalente con barra. */
const RGRUPOS=[
 ["pecho","Pecho",[.75,1.25,1.75,2,2.3],[["press-banca",1],["press-banca-mancuernas",2.5],["press-inclinado-barra",1.15],["press-inclinado-mancuernas",2.7],["chest-press-maquina",.9],["press-inclinado-maquina",1]]],
 ["espalda","Espalda",[.75,1,1.5,1.75,2],[["remo-barra",1],["remo-mancuerna-un-brazo",1.8],["jalon-al-pecho",.85],["remo-maquina",.85],["remo-polea-baja",.85],["remo-t",.9]]],
 ["piernas","Piernas",[1.25,1.5,2.25,2.75,3.1],[["sentadilla-barra",1],["sentadilla-frontal",1.2],["sentadilla-goblet",2.5],["prensa-45",.45],["sentadilla-hack",.7],["sentadilla-smith",.9],["sentadilla-bulgara",3]]],
 ["posterior","Posterior",[1.5,2,2.5,3,3.4],[["peso-muerto",1],["peso-muerto-sumo",1],["peso-muerto-rumano",1.25],["hip-thrust-maquina",.75]]],
 ["hombros","Hombros",[.55,.8,1.05,1.35,1.55],[["press-militar-barra",1],["press-militar-mancuernas",2.5],["press-hombros-maquina",.85],["press-arnold",2.7]]],
 ["brazos","Brazos",[.4,.6,.85,1.15,1.35],[["curl-biceps-barra",1],["curl-biceps-mancuernas",2],["curl-martillo",1.8],["curl-biceps-maquina",.9]]]];
const RANGO_DESC=["Recién empezás","Novato: algunos meses entrenando bien","Intermedio: uno o dos años de constancia","Avanzado: varios años y mucha disciplina","Élite amateur","Nivel de competencia"];
/* el 1RM para rangos se estima con hasta 10 reps (con más reps la fórmula exagera) */
const e1rmR=(w,r)=>w>0&&r>0?w*(1+Math.min(r,10)/30):0;
const pesoCorp=()=>{const r=bodyRows.filter(x=>x.weight>0).sort((a,b)=>a.date<b.date?1:-1)[0];return r?r.weight:((profile&&profile.weight)||75)};
function rangos(){const bw=pesoCorp(),fem=profile&&profile.sex==="f";const out=[];
  RGRUPOS.forEach(([k,n,th0,exs])=>{const th=th0.map(t=>t*(fem?.65:1));let best=null;
    Object.entries(prs||{}).forEach(([id,p])=>{const cid=CAT_BY_APP[id]||id;const f=exs.find(e=>e[0]===cid);if(!f||p.asist||!(p.e1rm>0))return;const e1=p.w>0&&p.r>0?Math.min(p.e1rm,e1rmR(p.w,p.r)||p.e1rm):p.e1rm;const eq=e1*f[1];if(!best||eq>best.eq)best={eq,id,cid,f:f[1],e1rm:e1}});
    if(!best){out.push({k,n,idx:-1});return}const ratio=best.eq/bw;let idx=0;th.forEach((t,i)=>{if(ratio>=t)idx=i+1});
    const nombre=(CATALOGO.find(c=>c.id===best.cid)||{}).nombre||best.id;let falta=null;if(idx<th.length){const kg=Math.max(1,Math.ceil((th[idx]*bw/best.f-best.e1rm)));falta={kg,ej:nombre,a:RANGOS[idx+1][0]}}
    out.push({k,n,idx,ratio,ej:nombre,falta})});
  const con=out.filter(x=>x.idx>=0);const gen=con.length?Math.floor(con.reduce((a,x)=>a+x.idx,0)/con.length):-1;return{grupos:out,gen}}
const escudo=(idx,sz=40)=>{const c=idx>=0?RANGOS[idx][1]:"var(--track)";return `<svg class="escudo" width="${sz}" height="${sz}" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l14 5v10c0 9.5-6.2 16.5-14 19-7.8-2.5-14-9.5-14-19V8z" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="2"/><path d="M20 11l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="${c}"/></svg>`};
function rangosCardHTML(){const R=rangos();const g=R.gen;
  return `<section class="card rangos"><div class="hd">${escudo(g,52)}<div class="n"><span class="eyebrow">Rango de fuerza</span><b>${g>=0?RANGOS[g][0]:"Sin rango todavía"}</b><small class="hint">${g>=0?esc(RANGO_DESC[g])+". Es el promedio de tus grupos.":"Se calcula con tus mejores marcas en los ejercicios básicos (press, remo, sentadilla, peso muerto, militar y curl)."}</small></div></div>
    <div class="rgl">${R.grupos.map(x=>`<div class="rg">${escudo(x.idx,28)}<div class="n"><b>${esc(x.n)} · <span style="color:${x.idx>=0?RANGOS[x.idx][1]:"var(--muted)"}">${x.idx>=0?RANGOS[x.idx][0]:"—"}</span></b><small>${x.idx<0?"Hacé un básico de "+esc(x.n.toLowerCase())+" para medirlo":x.falta?"Te faltan "+x.falta.kg+" kg en "+esc(x.falta.ej.toLowerCase())+" para "+x.falta.a:"Rango máximo"}</small></div></div>`).join("")}</div>
    <p class="hint" style="margin:0">Cómo se mide: tu mejor marca estimada (el peso que podrías levantar una vez) en los ejercicios básicos, dividida por tu peso corporal (${f1(pesoCorp())} kg). Así es justo para cualquier tamaño. Bronce es novato, Plata intermedio (1–2 años bien entrenados), Oro avanzado.</p></section>`}
/* ---------- Grupo de perseverancia (Fit): cada uno publica su semana; ranking y misión se calculan con lo de todos ---------- */
const lunDe=f=>{const d=parse(f);return addDays(f,-((d.getDay()+6)%7))};
const MISIONES=[["e","Entre todos, 3 entrenos por persona",3,"Cada miembro suma sus entrenos de la semana."],["m","Entre todos, 120 minutos por persona",120,"Los minutos entrenados de todos se suman."],["o","Entre todos, 2 entrenos ofrecidos por persona",2,"Ofrecé el entreno por una intención antes de empezar."]];
const misionDe=lun=>MISIONES[Math.floor((parse(lun)-parse("2024-01-01"))/6048e5)%MISIONES.length];
function semanaMia(lun){const o={e:0,m:0,o:0,x:0};wHist.forEach(w=>{if(w.id>=lun&&w.id<=addDays(lun,6)){o.e++;o.m+=Math.round(((w.summary||{}).dur||0)/6e4);if(w.offered&&w.intention)o.o++;o.x+=(w.summary||{}).xp||XP.workout}});return o}
function miFichaG(){const n=((dprofile&&dprofile.nombre)||(user&&user.displayName&&user.displayName.split(" ")[0])||"Atleta").slice(0,24);const sem={};for(let i=0;i<6;i++){const l=addDays(lunDe(today()),-7*i);sem[l]=semanaMia(l)}
  return{n,s:sem,hoy:{f:today(),ok:wHist.some(w=>w.id===today())},rg:rangos().gen}}
function grupoSync(){if(!grupo.gid||!grupoBE||!grupo.meta)return;clearTimeout(gSyncT);gSyncT=setTimeout(async()=>{const f=miFichaG(),k=JSON.stringify(f);if(k===gUlt)return;gUlt=k;try{await grupoBE.setMiembro(grupo.gid,f)}catch(e){}},600)}
function grupoCerrar(){if(grupo.unsub){try{grupo.unsub()}catch(e){}}grupo={gid:null,meta:null,L:null,unsub:null,err:""};gUlt=""}
function grupoAbrir(gid){grupoCerrar();if(!gid||!grupoBE){if(view==="mas")render();return}grupo={gid,meta:null,L:null,unsub:null,err:""};
  grupo.unsub=grupoBE.watch(gid,(meta,L,err)=>{if(err){grupo.err="No se pudo leer el grupo.";}else{grupo.meta=meta;grupo.L=L||[];}if(view==="mas")render();if(sheet&&sheet.view==="grupo")renderSheetNow();grupoSync()})}
function rankingG(lun){const L=(grupo.L||[]).map(x=>({...x,w:((x.s||{})[lun])||{e:0,m:0,o:0,x:0}})).sort((a,b)=>(b.w.x||0)-(a.w.x||0)||(b.w.e||0)-(a.w.e||0)||String(a.n).localeCompare(String(b.n)));let r=0,prev=null;L.forEach((x,i)=>{const k=(x.w.x||0)+"/"+(x.w.e||0);if(k!==prev){r=i+1;prev=k}x.rank=r});return L}
function misionEstado(lun){const M=misionDe(lun),L=grupo.L||[],n=Math.max(1,L.length),meta=M[2]*n;let tot=0;L.forEach(x=>{tot+=(((x.s||{})[lun])||{})[M[0]]||0});return{M,meta,tot,ok:tot>=meta}}
function grupoCardHTML(){if(!grupo.gid)return `<button class="card eqcard" data-gopen="1"><span class="ic">${ic("users")}</span><span class="n"><b>Grupo de perseverancia</b><small>Entrená con amigos: misión semanal, ranking y quién entrenó hoy.</small></span><span class="lnk">Unirme</span></button>`;
  if(!grupo.meta)return `<button class="card eqcard" data-gopen="1"><span class="ic">${ic("users")}</span><span class="n"><b>Grupo de perseverancia</b><small>${grupo.meta===false?"El grupo ya no existe.":"Cargando…"}</small></span></button>`;
  const lun=lunDe(today()),ME=misionEstado(lun),L=grupo.L||[],hoyN=L.filter(x=>x.hoy&&x.hoy.f===today()&&x.hoy.ok).length;
  return `<button class="card eqcard" data-gopen="1"><span class="ic">${ic("users")}</span><span class="n"><b>${esc(grupo.meta.n)}</b><small>Hoy entrenaron ${hoyN} de ${L.length} · misión ${Math.min(100,Math.round(ME.tot/ME.meta*100))}%</small></span><span class="lnk">Ver</span></button>`}
function grupoSheetHTML(X){if(!grupo.gid||grupo.meta===false){const m=sheet.m||"inicio";
    if(m==="crear")return `<h3>Nuevo grupo${X}</h3><div class="scroll gform"><p class="dialead">Ponele un nombre. Después compartís el código con tus amigos.</p><input class="inset" id="gNom" maxlength="40" placeholder="Los del gym de San Isidro" autocomplete="off"><button class="primary" id="gCrear">${ic("check")}Crear</button>${sheet.err?`<p class="hint err">${esc(sheet.err)}</p>`:""}</div>`;
    if(m==="codigo")return `<h3>Unirme${X}</h3><div class="scroll gform"><p class="dialead">Escribí el código de 8 letras que te pasaron.</p><input class="inset" id="gCod" maxlength="8" placeholder="ABCD2345" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em;text-align:center;font-size:22px"><button class="primary" id="gUnir">${ic("check")}Entrar</button>${sheet.err?`<p class="hint err">${esc(sheet.err)}</p>`:""}</div>`;
    return `<h3>Grupo de perseverancia${X}</h3><div class="scroll gform"><p class="dialead">Entrenar con otros ayuda a no aflojar. En el grupo ven quién entrenó hoy, tienen una misión en común cada semana y un ranking con la experiencia de Fit.</p>
      ${grupo.meta===false?`<p class="hint">El grupo en el que estabas ya no existe.</p>`:""}
      <button class="primary" data-gm="crear">${ic("plus")}Crear un grupo</button><button class="primary ink" data-gm="codigo">${ic("users")}Tengo un código</button>
      <p class="hint">Es aparte de los grupos de Scaeli Daily. ${user&&user.uid==="local"?"Sin cuenta, el grupo queda solo en este teléfono: para entrenar con amigos entrá con Google o Apple.":""}</p></div>`}
  if(!grupo.meta)return `<h3>Grupo${X}</h3><p class="empty">Cargando…</p>`;
  const lun=lunDe(today()),ME=misionEstado(lun),R=rankingG(lun),me=user&&user.uid;const pct=Math.min(100,Math.round(ME.tot/ME.meta*100));
  return `<h3>${esc(grupo.meta.n)}${X}</h3><div class="scroll gsheet">
    <section class="card pad gmision${ME.ok?" ok":""}"><span class="eyebrow">Misión de la semana</span><b>${esc(ME.M[1])}</b><small class="hint">${esc(ME.M[3])}</small>
      <div class="bar"><i style="width:${pct}%"></i></div><small class="hint">${ME.tot} de ${ME.meta}${ME.M[0]==="m"?" min":""} · ${ME.ok?"¡cumplida!":"faltan "+(ME.meta-ME.tot)+(ME.M[0]==="m"?" min":"")}</small></section>
    <section class="card tight list"><div class="row"><span class="eyebrow">Ranking de la semana</span><small class="hint">XP de Fit</small></div>
      ${R.map(x=>`<div class="row grow${x.uid===me?" yo":""}"><span class="rk">${x.rank}</span>${x.rg>=0?escudo(x.rg,24):""}<div class="n"><b>${esc(x.n||"Atleta")}${x.uid===me?" (vos)":""}${x.rg>=0?` <small style="color:${RANGOS[x.rg][1]}">${RANGOS[x.rg][0]}</small>`:""}</b><small>${x.w.e||0} ${(x.w.e||0)===1?"entreno":"entrenos"} · ${x.w.m||0} min${x.hoy&&x.hoy.f===today()&&x.hoy.ok?" · entrenó hoy":""}</small></div><span class="k">${x.w.x||0}<small>XP</small></span></div>`).join("")}</section>
    <section class="card pad gcod"><span class="eyebrow">Código para invitar</span><b class="cod">${esc(grupo.gid)}</b><button class="primary ink" id="gShare">${ic("upload")}Compartir</button></section>
    <button class="ghost g gsalir" id="gSalir">${sheet.confirm==="salir"?"Tocá de nuevo para salir":"Salir del grupo"}</button></div>`}
function finishWorkout(){const r=curRoutine();if(!r||!workout)return;const nl={...loads};const np=JSON.parse(JSON.stringify(prs||{}));
  if(workout.pausedAt){workout.pausedMs=(workout.pausedMs||0)+(Date.now()-workout.pausedAt);workout.pausedAt=null}const res={dur:sesElapsed(),sets:0,vol:0,ex:[],prs:[]};
  r.ex.forEach(ex=>{const all=wsets(ex.id).filter(hecha);if(!all.length)return;res.sets+=all.length;
    if(esAsist(ex)){const vol=Math.round(all.reduce((a,x)=>a+cargaEf(ex,x.w)*(x.r||0),0));res.vol+=vol;const wMin=Math.min(...all.map(x=>x.w||0));const bx=all.find(x=>(x.w||0)===wMin)||all[0];
      const item={id:ex.id,name:ex.name,sets:all.length,w:wMin,r:bx.r||0,vol,asist:true};const old=np[ex.id]||{};const e1=Math.max(...all.map(x=>e1rm(cargaEf(ex,x.w),x.r)));
      if(!old.asist||wMin<old.w||e1>(old.e1rm||0)*1.001){np[ex.id]={w:wMin,r:bx.r||0,e1rm:Math.max(e1,old.asist?old.e1rm||0:0),date:wcur,asist:true};if(old.asist){item.pr="peso";res.prs.push(ex.name)}else item.pr="primero"}
      res.ex.push(item);const top=all.length>=ex.sets&&all.every(x=>x.r>=ex.hi&&(x.rir==null||x.rir>=2));nl[ex.id]={w:wMin,date:wcur,top,hard:all.some(x=>x.hard),reps:all.map(x=>x.r),asist:true};return}
    const best=all.reduce((a,s)=>(s.w||0)*(s.r||0)>(a.w||0)*(a.r||0)||(s.w||0)>(a.w||0)?s:a,all[0]);const mult=porMancuerna(ex)?2:1;// mancuernas: se cargan por mancuerna, el volumen cuenta el par
    const vol=Math.round(all.reduce((a,x)=>a+cargaEf(ex,x.w)*mult*(x.r||0),0));res.vol+=vol;
    const item={id:ex.id,name:ex.name,sets:all.length,w:best.w||0,r:best.r||0,vol};
    const old=np[ex.id]||{};const w=Math.max(...all.map(s=>s.w||0));const bestE=Math.max(...all.map(s=>e1rm(s.w,s.r)));
    if(w>0&&(w>(old.w||0)||bestE>(old.e1rm||0)*1.001)){const tipo=w>(old.w||0)?"peso":"1RM";np[ex.id]={w:Math.max(w,old.w||0),r:(all.find(s=>s.w===w)||{}).r||0,e1rm:Math.max(bestE,old.e1rm||0),date:wcur};if(old.w||old.e1rm){item.pr=tipo;res.prs.push(ex.name)}else{item.pr="primero"}}
    res.ex.push(item);
    const ss=all.filter(s=>s.w>0);if(!ss.length)return;const top=ss.length>=ex.sets&&ss.every(s=>s.r>=ex.hi&&(s.rir==null||s.rir>=2));nl[ex.id]={w,date:wcur,top,hard:ss.some(s=>s.hard),reps:ss.map(s=>s.r)}});
  res.coach=coachResumen(r);
  {// calorías estimadas: MET de fuerza (3,5 suave · 5 moderado · 6 intenso según el RIR promedio) × peso × horas entrenadas
    const rirs=[];r.ex.forEach(ex=>wsets(ex.id).filter(hecha).forEach(x=>{if(x.rir!=null)rirs.push(x.rir)}));const avg=rirs.length?rirs.reduce((a,b)=>a+b,0)/rirs.length:2;const met=avg<=1?6:avg<=2.5?5:3.5;
    res.kcal=Math.round(met*pesoCorp()*(res.dur/36e5)/10)*10}const rAntes=rangos();loads=nl;prs=np;const rDesp=rangos();res.rangos=rDesp.grupos.filter(g=>{const a=rAntes.grupos.find(x=>x.k===g.k);return g.idx>(a?a.idx:-1)&&g.idx>=1}).map(g=>g.n+" · "+RANGOS[g.idx][0]);stopTimer();const offered=!!(workout.offered&&workout.intention);res.name=r.name;if(workout.intention)res.intention=workout.intention;
  const before=progress.xp||0;award("workout",wcur,offered?XP.offered:0);if(offered)award("offered",wcur);res.xp=(progress.xp||0)-before;
  saveWorkout(w=>{w.done=true;w.summary=res},null,true);write(backend.setDoc("settings/loads",nl));write(backend.setDoc("settings/prs",np));
  openSheet({view:"resumen",res,intention:workout.intention});render()}
const sesElapsed=w=>{w=w||workout;if(!w||!w.startedAt)return 0;return Math.max(0,(w.pausedAt||Date.now())-w.startedAt-(w.pausedMs||0))};
const dur=ms=>{const s=Math.floor(ms/1000);return s>=3600?Math.floor(s/3600)+":"+pad(Math.floor(s%3600/60))+":"+pad(s%60):mmss(s)};
const SES_MAX=3*36e5;
/* Un entreno que quedó abierto (por ejemplo desde la mañana) se frena solo a las 3 h, para no inflar la duración. */
function sesTope(){if(!workout||!workout.startedAt||workout.done||workout.pausedAt)return;if(sesElapsed()<SES_MAX)return;
  const any=Object.values(workout.sets||{}).some(a=>(a||[]).some(hecha));
  saveWorkout(w=>{if(any){w.pausedAt=w.startedAt+(w.pausedMs||0)+SES_MAX;w.autoPaused=true}else{w.startedAt=null;w.pausedAt=null;w.pausedMs=0}})}
function sesTick(){sesTope();const t=$("#sesT");if(t&&workout&&workout.startedAt&&!workout.done&&!workout.pausedAt)t.textContent=dur(sesElapsed())}
function durTxt(ms){const m=Math.round(ms/60000);if(m<1)return "menos de 1 min";return m>=60?Math.floor(m/60)+" h "+pad(m%60)+" min":m+" min"}
const needsOffer=()=>!offerSkip&&!(workout&&(workout.offered||workout.done||Object.keys(workout.sets||{}).length));

/* ---------- Progreso: XP, racha, insignias ---------- */
/* deshace la experiencia de un entreno borrado */
function unawardWorkout(date,xp){const p=JSON.parse(JSON.stringify(progress));p.done=p.done||{};p.counts=p.counts||{};let any=false;
  ["workout","offered"].forEach(k=>{const key=k+":"+date;if(p.done[key]){delete p.done[key];any=true;const ck={workout:"workouts",offered:"offered"}[k];p.counts[ck]=Math.max(0,(p.counts[ck]||0)-1)}});
  if(!any)return;p.xp=Math.max(0,(p.xp||0)-(xp!=null?xp:XP.workout));progress=p;write(backend.setDoc("settings/progress",p))}
function award(kind,date,extra){const p=JSON.parse(JSON.stringify(progress));p.counts=p.counts||{};p.days=p.days||[];p.badges=p.badges||{};
  const key=kind+":"+date;p.done=p.done||{};if(p.done[key])return;p.done[key]=1;
  p.xp=(p.xp||0)+(XP[kind]||0)+(extra||0);const ck={workout:"workouts",offered:"offered",rosary:"rosaries",meals:"meals",body:"body",fast:"fasts"}[kind];if(ck)p.counts[ck]=(p.counts[ck]||0)+1;
  if(kind==="workout"||kind==="meals"){if(!p.days.includes(date)){p.days.push(date);p.days.sort();if(p.days.length>400)p.days=p.days.slice(-400)}}
  const st=streakOf(p.days,today());p.best=Math.max(p.best||0,st.n);
  const before=levelOf(progress.xp||0).i;const newBadges=[];BADGES.forEach(([id,name,,test])=>{if(!p.badges[id]&&test(p)){p.badges[id]=today();newBadges.push(name)}});
  // limpiar el registro de hechos de hace más de 60 días para que el documento no crezca sin fin
  const cut=addDays(today(),-60);Object.keys(p.done).forEach(k=>{if(k.split(":")[1]<cut)delete p.done[k]});
  progress=p;write(backend.setDoc("settings/progress",p));
  const after=levelOf(p.xp).i;if(after>before)setTimeout(()=>openSheet({view:"levelup",name:LEVELS[after][0],short:true}),300);
  else if(newBadges.length)toast("Insignia: "+newBadges[0]);}

/* ---------- Temporizador de descanso ---------- */
let timer=null,timerTick=null,exIdx=0,focoOff=false,wakeLk=null;
/* Modo entreno: con la sesión en marcha, pantalla completa, un ejercicio por vez y la pantalla siempre encendida. */
const focoActivo=()=>view==="entreno"&&!!(workout&&workout.startedAt&&!workout.done)&&!focoOff&&!!curRoutine()&&!needsOffer();
function wakeAjustar(force){const on=focoActivo()&&document.visibilityState==="visible";
  if(on&&(!wakeLk||force)&&navigator.wakeLock){navigator.wakeLock.request("screen").then(l=>{wakeLk=l;l.addEventListener("release",()=>{wakeLk=null})}).catch(()=>{})}
  else if(!on&&wakeLk){try{wakeLk.release()}catch(e){}wakeLk=null}}
const nSerOf=ex=>Math.max(1,ex.sets+((workout&&workout.extra&&workout.extra[ex.id])||0));
const primerPendiente=r=>{const i=r.ex.findIndex(ex=>wsets(ex.id).filter(hecha).length<nSerOf(ex));return i<0?0:i};
/* El descanso se guarda en el teléfono: si el sistema cierra la app en segundo plano, al volver sigue con el tiempo real. */
const TKEY="scaeli-fit-timer";
const timerGuardar=()=>{try{timer?localStorage.setItem(TKEY,JSON.stringify(timer)):localStorage.removeItem(TKEY)}catch(e){}};
function timerRestaurar(){if(timer)return;let t=null;try{t=JSON.parse(localStorage.getItem(TKEY)||"null")}catch(e){}if(!t||!t.end)return;
  if(t.end>Date.now()){timer=t;if(!timerTick)timerTick=setInterval(tick,500);tick()}else{try{localStorage.removeItem(TKEY)}catch(e){}if(Date.now()-t.end<15*6e4)toast("Descanso listo · "+t.name)}}
function startTimer(ex){stopTimer(false);lastRestEx=ex;const total=restOf(ex);timer={end:Date.now()+total*1000,total,name:ex.name,exId:ex.id};timerGuardar();timerTick=setInterval(tick,500);tick();if(view==="entreno"&&!typing())render()}
function stopTimer(rerender=true){if(timerTick)clearInterval(timerTick);timerTick=null;const had=!!timer;timer=null;timerGuardar();$("#timerpill").hidden=true;if(rerender&&view==="entreno"){paintTimer();if(had&&!typing())render()}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="visible")return;timerRestaurar();if(timer)tick();sesTick();wakeAjustar(true)});
function tick(){if(!timer)return;const left=Math.ceil((timer.end-Date.now())/1000);
  if(left<=0){const n=timer.name;stopTimer();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}toast("Descanso listo · "+n);return}
  paintTimer(left)}
function paintTimer(left){if(timer&&left==null)left=Math.ceil((timer.end-Date.now())/1000);
  const ring=$("#ringBtn");if(ring){const t=ring.querySelector("b"),c=ring.querySelector("circle.p"),l=$(".rl");
    if(timer){t.textContent=mmss(left);c.style.strokeDashoffset=(182*(1-left/timer.total)).toFixed(1)}else{t.textContent=mmss(0);c.style.strokeDashoffset=182}}
  const big=$("#restBig");if(big&&timer)big.textContent=mmss(left);
  const pill=$("#timerpill");if(timer&&!focoActivo()&&(view!=="entreno"||window.scrollY>150)){pill.hidden=false;pill.innerHTML=ic("today")+mmss(left)+" · "+esc(timer.name)}else pill.hidden=true}
window.addEventListener("scroll",()=>{if(timer)paintTimer()},{passive:true});
function restCard(){if(!timer)return "";return `<section class="card restcard"><div class="l"><span class="eyebrow">Descanso</span>${timer.name!=="Descanso"?`<small class="rx">${esc(timer.name)}</small>`:""}<b class="big" id="restBig">${mmss(Math.ceil((timer.end-Date.now())/1000))}</b></div><div class="acts"><button class="chip off" id="rest30">+30 s</button><button class="chip off" id="restSkip">Saltar</button></div></section>`}
/* Rosario compacto para rezar entre series: usa el mismo avance compartido con Daily. */
function rosMiniHTML(){const act=rosario&&rosario.f===today()?rosario:null;const hk=misteriosHoy();const hecho=(progress.done||{})["rosary:"+today()];
  if(!act||act.fase==="intro"||act.fase==="fin")return `<section class="card rosmini"><img class="cv" src="${ilu(hk)}" alt=""><div class="n"><span class="eyebrow">Santo Rosario</span><b>${esc(MISTERIOS[hk].n)}</b><small>${hecho?"Hoy ya lo rezaste. Podés rezarlo de nuevo.":"Una cuenta por descanso: tocá para pasarla."}</small></div><div class="acts"><button class="iconbtn acc" data-rosempezar="${hk}" aria-label="Empezar">${ic("play")}</button><button class="sm" id="rosMiniX" aria-label="Cerrar">${ic("x")}</button></div></section>`;
  const r=act,M=MISTERIOS[r.set],i=r.mis,mis=M.m[i],fin=r.fase==="salve"||r.fase==="papa",ini=r.fase==="credo"||r.fase==="ini";let ora,n=0,c=0,glo=false,pad=false;
  if(r.fase==="anuncio")ora="Contemplá el misterio";else if(r.fase==="salve")ora="Salve";else if(r.fase==="credo")ora="Credo";
  else if(r.fase==="papa"||r.fase==="ini"){ora=r.c===0?"Padrenuestro":r.c<=3?"Avemaría":"Gloria";n=3;c=r.c>=1&&r.c<=3?r.c:(r.c>3?3:0);glo=r.c>3;pad=r.c===0}
  else{ora=r.fase==="padre"?"Padrenuestro":r.fase==="ave"?"Avemaría":"Gloria";n=10;c=r.fase==="ave"?r.c:r.fase==="gloria"?10:0;glo=r.fase==="gloria";pad=r.fase==="padre"}
  // la cuenta grande del Padrenuestro, las Avemarías y la del Gloria al final
  const beads=n?`<span class="beads"><i class="pn${pad?" on":""}"></i>${Array.from({length:n},(_,k)=>`<i class="${k<c?"on":""}"></i>`).join("")}<i class="gl${glo?" on":""}" title="Gloria"></i></span>`:"";
  const med=(ROS_MED[r.set]||[])[i];const contempla=ini?(r.fase==="credo"?"Creo en Dios Padre todopoderoso…":"Por la fe, la esperanza y la caridad."):fin?(r.fase==="papa"?"Por las intenciones del Santo Padre y por la Iglesia.":"Dios te salve, Reina y Madre."):(med?med[0].replace(/^«|»$/g,""):mis[1]);
  // solo la cuenta y la contemplación: el texto de la oración queda escondido, salvo que se pida con «Ver oración»
  const oracion=rosMiniTxt&&r.fase!=="anuncio"?`<small class="txt open">${esc(oraTxt(ora==="Credo"?"Credo de los Apóstoles":ora))}</small>`:"";
  return `<section class="card rosmini on"><button class="tap" data-rosav="1"><span class="n"><span class="eyebrow">${r.fase==="papa"?"Por el Papa y la Iglesia":fin?"Para terminar":ini?"Para empezar":"Misterio "+(i+1)+" de 5"}</span><b>${fin||ini?esc(ora==="Credo"?"Creo en Dios":ora):esc(mis[0])}</b><small class="med">${esc(contempla)}</small>${beads}<span class="cnt">${esc(ora)}${n?` · ${c} de ${n}`:""}</span>${oracion}<span class="go">${ic("right")}Tocá para pasar la cuenta</span></span></button>
    <div class="acts"><button class="sm" data-rosatras="1" aria-label="Atrás">${ic("left")}</button>${r.fase!=="anuncio"?`<button class="chip off" id="rosMiniTxt" aria-pressed="${rosMiniTxt}">${rosMiniTxt?"Ocultar":"Ver oración"}</button>`:""}<button class="sm" data-rosario="1" aria-label="Pantalla completa">${ic("up")}</button><button class="sm" id="rosMiniX" aria-label="Cerrar">${ic("x")}</button></div></section>`}
/* Al pasar una cuenta se redibuja solo la tarjeta del rosario, no la pantalla: los dibujos y el cronómetro no parpadean. */
function rosMiniRefresh(){const el=document.querySelector(".rosmini");if(!el)return false;const t=document.createElement("div");t.innerHTML=rosMiniHTML();el.replaceWith(t.firstElementChild);return true}

/* ---------- Render ---------- */
const typing=()=>{const a=document.activeElement;return !!(a&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"))};
let dirty=false,sheetDirty=false;
document.addEventListener("focusout",()=>{setTimeout(()=>{if(typing())return;if(dirty){dirty=false;render()}if(sheetDirty){sheetDirty=false;if(sheet)renderSheetNow()}},80)});
function render(){if(typing()){dirty=true;return}renderNow()}
function renderSheet(){if(typing()){sheetDirty=true;return}renderSheetNow()}
function renderNow(){
  if(!user){renderLogin();return}
  const sy=window.scrollY;
  document.querySelectorAll(".nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.view===view?"page":"false"));
  const app=$("#app");app.classList.toggle("entra",renderNow._view!==view);// la animación de entrada solo al cambiar de pestaña, no en cada toque
  if(view==="hoy")app.innerHTML=renderHoy();else if(view==="entreno")app.innerHTML=renderEntreno();else if(view==="cuerpo")app.innerHTML=renderCuerpo();else if(view==="escuchar")app.innerHTML=renderListen();else app.innerHTML=renderMas();
  afterRender();paintTimer();if(renderNow._view===view)window.scrollTo(0,sy);renderNow._view=view;
}
function dateLabel(d){const dt=parse(d);return (d===today()?"Hoy · ":"")+dt.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"short"}).replace(/^\w/,c=>c.toUpperCase())}
function nextIdeas(){const own=recipes.filter(r=>r.lent).map(r=>r.name);const pool=own.length?own.concat(LENT_DINNERS):LENT_DINNERS;return pool[Math.abs(daysBetween(PLAN_START,cur))%pool.length]}

function renderHoy(){
  const type=dayType();const t=(targets&&targets[type])||DEFAULT_TARGETS[type];const tot=totals(entries());const left=t.kcal-tot.kcal;
  const L=liturgy(cur);const ck=checks();const protOk=tot.p>=t.p;
  const planDay=daysBetween(PLAN_START,cur)+1;
  const eyebrow=fecha(cur);
  const chips=(L.ayuno?`<span class="chip">Ayuno</span>`:L.abstinencia?`<span class="chip">Abstinencia</span>`:L.domingo?`<span class="chip muted">${ic("sun")}Día del Señor</span>`:"")+(L.season!=="Tiempo Ordinario"?`<span class="chip muted">${esc(L.season)}</span>`:"")+(planDay>=1&&planDay<=90?`<span class="chip muted">Día ${planDay} de 90</span>`:"");
  const M=[["Prot","p","var(--accent)",true],["Carb","c","var(--carb)"],["Grasa","g","var(--fat)"]];
  const titulo=cur===today()?"Hoy":cur===addDays(today(),-1)?"Ayer":cur===addDays(today(),1)?"Mañana":DOW[parse(cur).getDay()].replace(/^./,c=>c.toUpperCase());
  return `
  <div class="top"><div class="l"><span class="eyebrow fecha">${esc(eyebrow)}</span><h1 class="title">${esc(titulo)}</h1>${chips?`<div class="r" style="margin-top:6px;flex-wrap:wrap">${chips}</div>`:""}</div>
    <div class="r" style="flex:none">${candleChip()}<button class="chip off" id="tType" aria-label="Tipo de día">${type==="gym"?"Gym":"Descanso"}</button></div></div>
  <section class="card" aria-label="Resumen del día">
    <div class="kcal"><div class="stat">${cur!==today()?`<button class="eyebrow lnkeb" id="todayBtn">${ic("left")}Volver a hoy · ${esc(parse(cur).toLocaleDateString("es-AR",{day:"numeric",month:"short"}))}</button>`:`<span class="eyebrow">Hoy · ${type==="gym"?"gym":"descanso"} · ${left>=0?"restantes":"te pasaste"}</span>`}<span class="big${left<0?" over":""}">${fmt(Math.abs(left))}</span><small class="d">de ${fmt(t.kcal)} kcal · consumidas ${fmt(tot.kcal)}</small></div>
      <div class="r"><button class="iconbtn inset" id="prev" aria-label="Día anterior">${ic("left")}</button><button class="iconbtn inset" id="next" aria-label="Día siguiente">${ic("right")}</button></div></div>
    <div class="bar${left<0?" over":""}" style="margin-top:16px"><i style="width:${Math.min(100,tot.kcal/t.kcal*100)}%"></i></div>
    <div class="macros">${M.map(([n,k,col,isP])=>{const v=tot[k],tg=t[k],over=!isP&&v>tg*1.08;
      return `<div><span class="eyebrow">${n}</span><span class="v">${fmt(v)}<small> /${fmt(tg)}</small></span><div class="bar3"><i style="width:${Math.min(100,v/tg*100)}%;background:${over?"var(--over)":col}"></i></div></div>`}).join("")}</div>
  </section>
  <section class="card tudia" aria-label="Tu día"><div class="hd"><span class="eyebrow">Tu día</span><small class="hint">Lo que suma además de comer bien. Tocá cada uno para cargarlo.</small></div>
    <div class="items">${[["prot","prot"],["pasos","steps"],["sueno","moon"],["agua","drop"],["crea","pill"]].map(([k,i])=>{const D=DIA[k];let val,meta,on,pct;
      if(k==="prot"){val=fmt(tot.p);meta=fmt(t.p)+" g";on=protOk;pct=Math.min(1,tot.p/t.p)}
      else if(D.tick){on=!!ck.crea;val=on?"Tomada":"Pendiente";meta="";pct=on?1:0}
      else{const v=diaVal(k);on=v!=null&&v>=D.meta;val=v!=null?nfmtC(v,D.u):"—";meta=nfmtC(D.meta,D.u)+(D.u==="pasos"?"":" "+D.u);pct=v?Math.min(1,v/D.meta):0}
      const vacio=!D.tick&&k!=="prot"&&diaVal(k)==null;
      return `<button class="it${on?" on":""}${vacio?" vacio":""}" data-dia="${k}" aria-label="${D.n}: ${vacio?"sin cargar":val}"><span class="ic">${ic(on?"check":i)}</span><span class="tx"><b>${D.n}</b><small>${vacio?"sin cargar":D.tick?val:val+(meta?" / "+meta:"")}</small></span><i class="pb"><i style="width:${Math.round(pct*100)}%"></i></i></button>`}).join("")}</div>
    <p class="hint pie">Cuando Scaeli Fit esté en las tiendas, pasos y sueño se cargan solos desde Apple Health o Google Fit.</p></section>
  <section class="card tight list" id="meals">${MEALS.map(([k,n])=>{const list=entries().filter(e=>e.meal===k),mt=totals(list);
    const sub=list.length?list.map(e=>esc(e.name)).join(" · "):(k==="cena"&&L.abstinencia?`<span class="acc">Sugerido: ${esc(nextIdeas())}</span>`:"");
    return `<div class="row"><div class="n"><b${list.length?"":' class="muted"'} style="${list.length?"":"font-weight:500"}">${n}</b>${sub?`<small${k==="cena"&&!list.length&&L.abstinencia?' class="acc"':""}>${sub}</small>`:""}</div>
      <div class="acts">${list.length?`<span class="k">${fmt(mt.kcal)}<small>${fmt(mt.p)} g P</small></span><button class="sm" data-fav="${k}" aria-label="Guardar ${n} como favorito">${ic("star")}</button><button class="sm" data-open="${k}" aria-label="Ver ${n}">${ic("down")}</button>`:""}
      <button class="iconbtn ${list.length?"inset":"acc"}" data-add="${k}" aria-label="Agregar a ${n}">${ic("plus")}</button></div></div>`}).join("")}</section>
  ${fastCard()}
  ${charCard()}
  <div class="top" style="align-items:center"><span class="hint" id="status" style="${statusErr?"color:var(--over)":""}">${esc(statusTxt)}</span>
    ${entries().length?"":`<button class="ghost g" id="copyY">${ic("copy")}Copiar ayer</button>`}</div>`;
}
/* Vela de racha: encendida, en riesgo (hoy todavía nada) o apagada. */
function candleChip(){const st=streakOf(progress.days||[],today());const cls=st.n?(st.today?"on":"risk"):"off";
  const flame=st.n?`<g class="fl"><ellipse cx="8" cy="4.5" rx="3.6" ry="4.5" fill="var(--accent)" opacity=".25"/><path d="M8 1c1.2 1.6 2.2 3 2.2 4.4A2.2 2.2 0 0 1 5.8 5.4C5.8 4 6.8 2.6 8 1z" fill="var(--accent)"/></g>`:`<path d="M8 1c.6 1 .2 2-.4 3s-.4 2 .4 3" fill="none" stroke="var(--muted)" stroke-width="1" stroke-linecap="round"/>`;
  return `<span class="candle ${cls}" title="Racha de días activos" aria-label="Racha: ${st.n} días"><svg viewBox="0 0 16 22" aria-hidden="true">${flame}<rect x="5" y="9" width="6" height="12" rx="1.2" fill="${st.n?"var(--ink)":"var(--muted)"}" opacity="${st.n?1:.5}"/></svg>${st.n}</span>`}
function charCard(){const L=levelOf(progress.xp||0);const nb=Object.keys(progress.badges||{}).length;
  return `<button class="hero-char" id="openChar" style="text-align:left;width:100%"><span class="av">${personajeHTML("",56)}</span>
    <span class="n"><span class="lvl">Nivel ${L.i+1} · ${esc(L.name)}</span><b>${fmt(progress.xp||0)} XP${L.to?` <small style="font-weight:400">· ${fmt(L.to-(progress.xp||0))} para ${esc(LEVELS[L.i+1][0])}</small>`:""}</b><span class="xp"><i style="width:${L.pct}%"></i></span><small>${nb} ${nb===1?"insignia":"insignias"} · ${progress.counts&&progress.counts.workouts||0} entrenos</small></span>${ic("right")}</button>`}
/* Ayuno (Plus): plan con ventana de alimentación; el eclesiástico sigue el calendario litúrgico. */
function fastState(){if(!fast||!fast.start)return null;const h=FAST_PLANS.find(p=>p[0]===fast.plan)||FAST_PLANS[0];const goal=h[1]*3600e3;const el=Date.now()-fast.start;return{plan:h[0],goalMs:goal,elapsed:el,done:goal>0&&el>=goal,endAt:fast.start+goal}}
function hms(ms){ms=Math.max(0,ms);const h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4),se=Math.floor(ms%6e4/1e3);return h+":"+pad(m)+":"+pad(se)}
const hora=t=>new Date(t).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",hour12:false});
const FAST_DESC={"16:8":"16 h de ayuno · 8 h para comer","18:6":"18 h de ayuno · 6 h para comer","20:4":"20 h de ayuno · 4 h para comer","OMAD":"Una comida al día","Eclesiástico":"Una comida fuerte y dos ligeras"};
const FAST_R=70,FAST_C=2*Math.PI*FAST_R;
function fastCard(){
  if(!isPlus())return `<button class="card lockcard" id="openPlus" style="text-align:left;width:100%"><span class="ic">${ic("fast")}</span><span class="n" style="flex:1"><b style="font-weight:600">Ayuno</b><br><small class="hint">Planes 16:8, 18:6, 20:4, OMAD y el ayuno eclesiástico, con tu ventana de comida.</small></span><span class="plus">Plus</span></button>`;
  const st=fastState();const L=liturgy(cur);const plan=(fast&&fast.plan)||"16:8";
  if(!st){const last=fast&&fast.last;
    return `<section class="card fast"><div class="top" style="align-items:center"><div class="l"><span class="eyebrow">Ayuno</span><b style="font-size:18px;font-weight:500">Elegí tu plan</b></div><span class="plus">Plus</span></div>
    <div class="fplanes">${FAST_PLANS.map(([n,h])=>`<button class="fplan" data-fplan="${n}" aria-pressed="${plan===n}"><b>${n}</b><small>${FAST_DESC[n]}</small></button>`).join("")}</div>
    <p class="hint">${plan==="Eclesiástico"?"Sin comer entre horas. Hoy "+(L.ayuno?"es día de ayuno obligatorio.":"no es obligatorio; podés ofrecerlo igual."):"Empezá cuando termines de comer: la app cuenta las horas y te muestra cuándo se abre la ventana."}${last&&last.ms?" Último ayuno: "+hms(last.ms).slice(0,-3)+" h.":""}</p>
    <button class="primary ink" id="fastStart">${ic("fast")}Empezar</button></section>`}
  const pct=st.goalMs?Math.min(1,st.elapsed/st.goalMs):0;const h=st.goalMs/36e5;
  return `<section class="card fast${st.done?" done":""}"><div class="top" style="align-items:center"><div class="l"><span class="eyebrow">Ayuno ${esc(st.plan)}</span><b style="font-size:18px;font-weight:500">${st.done?"Ventana abierta":"Ayunando"}</b></div><span class="plus">Plus</span></div>
    <div class="fring"><div class="fr"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="${FAST_R}" class="t"/><circle cx="80" cy="80" r="${FAST_R}" class="p" stroke-dasharray="${FAST_C.toFixed(1)}" stroke-dashoffset="${(FAST_C*(1-pct)).toFixed(1)}"/></svg><div class="c"><b id="fastT">${hms(st.elapsed)}</b><small>${st.goalMs?"de "+h+" h":"hasta la comida fuerte"}</small></div></div>
      <div class="fside"><button class="fedit" id="fastEdit" aria-label="Cambiar la hora de inicio"><span class="eyebrow">Empezó ${ic("edit")}</span><b>${(new Date(fast.start)).toDateString()===(new Date()).toDateString()?"":"ayer "}${hora(fast.start)}</b></button>${st.goalMs?`<div><span class="eyebrow">${st.done?"Abierta desde":"Se abre"}</span><b>${hora(st.endAt)}</b></div><div><span class="eyebrow">${st.done?"Para comer":"Faltan"}</span><b id="fastLeft">${st.done?(24-h)+" h":hms(st.goalMs-st.elapsed).slice(0,-3)}</b></div>`:`<div><span class="eyebrow">Hoy</span><b>${L.ayuno?"Ayuno obligatorio":"Ofrecido"}</b></div>`}</div></div>
    <button class="primary${st.done?"":" ink"}" id="fastStop">${ic("check")}${st.done?"Comer":"Cortar"}</button></section>`}
function fastTick(){const t=$("#fastT");if(!t)return;const st=fastState();if(!st)return;t.textContent=hms(st.elapsed);
  const c=document.querySelector(".fast .fr circle.p");if(c&&st.goalMs)c.style.strokeDashoffset=(FAST_C*(1-Math.min(1,st.elapsed/st.goalMs))).toFixed(1);
  const l=$("#fastLeft");if(l&&!st.done)l.textContent=hms(st.goalMs-st.elapsed).slice(0,-3);
  if(st.done&&!document.querySelector(".fast.done")&&!typing())render()}

function renderEntreno(){
  const r=curRoutine();const weekNo=Math.min(13,Math.max(1,Math.floor(daysBetween(PLAN_START,wcur)/7)+1));
  const rt=`<div class="rtabs scrollx" role="group" aria-label="Rutina">${routines.map(x=>`<button data-rsel="${x.id}" aria-pressed="${!!(r&&r.id===x.id)}">${esc(x.name)}</button>`).join("")}<button class="more" id="openRutinas" aria-label="Biblioteca de rutinas">${ic("plus")}</button></div>`;
  const nav=`<div class="r"><button class="iconbtn inset" id="wprev" aria-label="Día anterior">${ic("left")}</button><button class="iconbtn inset" id="wnext" aria-label="Día siguiente">${ic("right")}</button>${wcur!==today()?`<button class="iconbtn inset" id="wtoday" aria-label="Ir a hoy">${ic("today")}</button>`:""}</div>`;
  const rezar=`<button class="chip ${rosMini?"":"off"}" id="rosMiniT" aria-pressed="${rosMini}">${ic("rosary")}Rezar</button>`;
  if(!r)return `<div class="top"><div class="l"><span class="eyebrow fecha">${esc(fecha(wcur))} · semana ${weekNo} de 13</span><h1 class="title">Descanso</h1></div>${nav}</div><p class="hint">Hoy no hay rutina asignada. Elegí una si querés entrenar igual, o que la app te arme una.</p>${rt}${cuerpoCardHTML()}${armarCardHTML()}<div class="wacts">${rezar}</div>${rosMini?rosMiniHTML():""}`;
  if(needsOffer()){const pr=PRAYERS[daysBetween(PLAN_START,wcur)%PRAYERS.length];
    return `<div class="hero"><div class="offer"><div class="top"><span class="eyebrow">${esc(DOW[parse(wcur).getDay()])} · ${esc(r.name)}</span><button class="iconbtn ghost" id="offerSkip" aria-label="Saltar">${ic("x")}</button></div>
      <div style="display:flex;flex-direction:column;gap:28px"><span class="dot"></span><p class="pr">${esc(pr)}</p><p class="sub">Ordenar el cuerpo desde la templanza, no desde la vanagloria.</p></div>
      <div style="display:flex;flex-direction:column;gap:12px"><label for="intencion" class="eyebrow">Lo ofrezco por</label><input id="intencion" type="text" placeholder="una persona, una intención…" autocomplete="off">
        ${intents.length?`<div class="chips">${intents.slice(0,6).map(i=>`<button data-intent="${esc(i)}">${esc(i)}</button>`).join("")}</div>`:""}
        <button class="primary" id="offer" style="margin-top:8px">${ic("cross")}Ofrecer</button><button class="lnk" id="openRutinas" style="margin:4px auto 0">Elegir otra rutina</button></div></div></div>`}
  const done=!!(workout&&workout.done);const intention=workout&&workout.intention;const started=!!(workout&&workout.startedAt);const enCurso=!done&&(started||Object.keys((workout&&workout.sets)||{}).length>0);
  const nsets=r.ex.reduce((a,ex)=>a+wsets(ex.id).filter(hecha).length,0),tsets=r.ex.reduce((a,ex)=>a+nSerOf(ex),0);
  const cur_track=tracks[trackIdx];
  if(focoActivo()){if(exIdx>=r.ex.length)exIdx=Math.max(0,r.ex.length-1);const ex=r.ex[exIdx];const ndEx=ex?wsets(ex.id).filter(hecha).length:0;const fin=ex&&ndEx>=nSerOf(ex);const ult=exIdx>=r.ex.length-1;
    return `<div class="fbar"><button class="iconbtn ghost" id="focoSalir" aria-label="Salir de pantalla completa (el entreno sigue)">${ic("left")}</button>
      <div class="fses"><span class="eyebrow">${workout.pausedAt?"En pausa":esc(r.name)}</span><b id="sesT">${dur(sesElapsed())}</b><small>${nsets} de ${tsets} series</small></div>
      <button class="ring sm" id="ringBtn" aria-label="${timer?"Parar el descanso":"Empezar un descanso"}"><svg viewBox="0 0 68 68" aria-hidden="true"><circle cx="34" cy="34" r="29" fill="none" stroke="var(--track)" stroke-width="5"/><circle class="p" cx="34" cy="34" r="29" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="182" stroke-dashoffset="182"/></svg><b>0:00</b></button>
      <button class="iconbtn ${workout.pausedAt?"acc":"inset"}" id="pausar" aria-label="${workout.pausedAt?"Seguir":"Pausar"}">${ic(workout.pausedAt?"play":"pause")}</button>
      ${timer?`<div class="frest"><span class="eyebrow">Descanso</span><small>${esc(timer.name)}</small><button class="chip off sm2" id="rest30">+30 s</button><button class="chip off sm2" id="restSkip">Saltar</button></div>`:""}</div>
    ${rosMini?rosMiniHTML():""}
    <div class="fpos"><span class="eyebrow">${exIdx+1} de ${r.ex.length}</span><div class="fdots">${r.ex.map((x,i)=>`<button data-exir="${i}" class="${i===exIdx?"on":""}${wsets(x.id).filter(hecha).length>=nSerOf(x)?" ok":""}" aria-label="Ir a ${esc(x.name)}"></button>`).join("")}</div><button class="lnkb" id="exTodos">Ver todos</button></div>
    ${ex?exCardHTML(ex,true):""}
    <div class="fnav"><button class="primary ink" id="exPrev" ${exIdx===0?"disabled":""}>${ic("left")}Anterior</button>${ult&&fin?`<button class="primary" id="finish">${ic("flag")}Terminar</button>`:`<button class="primary${fin?"":" ink"}" id="exNext" ${ult?"disabled":""}>Siguiente${ic("right")}</button>`}</div>
    <div class="fextra"><button class="chip ${rosMini?"":"off"}" id="rosMiniT" aria-pressed="${rosMini}">${ic("rosary")}Rezar</button><button class="chip off" id="wDescartar">${ic("trash")}Descartar</button><button class="chip off" id="finish">${ic("flag")}Terminar</button></div>`}
  const sesion=done?`<section class="card wsession done"><div class="l"><span class="eyebrow">Entreno terminado</span><b>${workout.summary?durTxt(workout.summary.dur):"Listo"}</b><small class="hint">${workout.summary?workout.summary.sets+" series · "+fmt(workout.summary.vol)+" kg":""}</small></div><button class="chip off" id="verResumen">${ic("flag")}Resumen</button></section>`
    :started?`<section class="card wsession${workout.pausedAt?" paused":""}"><div class="l"><span class="eyebrow">${workout.pausedAt?"En pausa":"En curso"}</span><b id="sesT">${dur(sesElapsed())}</b><small class="hint">${nsets} de ${tsets} series${workout.autoPaused?" · lo frené en 3 h":""}</small></div><div class="acts"><button class="iconbtn inset" id="focoOn" aria-label="Pantalla completa">${ic("up")}</button><button class="iconbtn inset" id="wDescartar" aria-label="Descartar entreno">${ic("trash")}</button><button class="iconbtn ${workout.pausedAt?"acc":"inset"}" id="pausar" aria-label="${workout.pausedAt?"Seguir":"Pausar"}">${ic(workout.pausedAt?"play":"pause")}</button><button class="primary ink" id="finish">${ic("flag")}Terminar</button></div></section>`
    :`<button class="primary" id="comenzar">${ic("play")}Comenzar entrenamiento</button>`;
  return `
  <div class="top"><div class="l"><span class="eyebrow fecha">${esc(fecha(wcur))} · semana ${weekNo}</span><h1 class="title">${esc(r.name)}</h1><small class="hint">${esc(r.goal)} · RIR 2${intention?" · Por "+esc(intention):""}</small></div>
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><button class="ring" id="ringBtn" aria-label="${timer?"Parar el descanso":"Empezar un descanso"}"><svg viewBox="0 0 68 68" aria-hidden="true"><circle cx="34" cy="34" r="29" fill="none" stroke="var(--track)" stroke-width="5"/><circle class="p" cx="34" cy="34" r="29" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-dasharray="182" stroke-dashoffset="182"/></svg><b>0:00</b></button><span class="eyebrow rl" style="font-size:10px">Descanso</span></div></div>
  <div class="rrow">${rt}${nav}</div>
  <div class="wacts"><button class="chip off" id="wlater" aria-label="${enCurso?"Salir y seguir después":"Salir"}">${ic("out")}Salir</button><button class="chip off" id="openRutinas">${ic("edit")}Rutinas</button>${rezar}</div>
  ${sesion}${restCard()}${rosMini?rosMiniHTML():""}
  ${!started?avisoRutina(r)+cuerpoCardHTML():""}
  ${r.ex.map((ex,i)=>exCardHTML(ex,false,i===0)).join("")}
  <button class="ghost g" id="addToRoutine" style="justify-content:center">${ic("plus")}Agregar ejercicio</button>
  ${started&&!done?`<button class="primary" id="finish">${ic("flag")}Terminar</button>`:""}
  <button class="nowbar" id="openListen" style="text-align:left;width:100%"><div class="n"><b>${cur_track?esc(cur_track.name):"Escuchar"}</b><small>${cur_track?(playing?"Sonando":"En pausa")+" · música "+(trackIdx+1)+" de "+tracks.length:"Música y rosario para el entreno"}</small></div>
    <div class="acts">${cur_track?`<span class="iconbtn ink" data-pp="1" role="button" aria-label="${playing?"Pausar":"Reproducir"}" style="width:36px;height:36px">${ic(playing?"pause":"play")}</span>`:""}<span class="iconbtn" style="width:36px;height:36px;color:var(--muted)" aria-hidden="true">${ic("rosary")}</span></div></button>`;
}
/* ---------- Ejercicios con el peso del cuerpo: dominadas y fondos. Asistida = los kg que te ayudan (máquina o banda); si no, lastre ---------- */
const CORP=new Set(["dominadas","dominadas-supinas","fondos-paralelas"]);
let asist={},coachMsg={};
const esCorp=ex=>CORP.has(CAT_BY_APP[ex.id]||ex.id);
const esAsist=ex=>esCorp(ex)&&!!asist[ex.id];
const cargaEf=(ex,w)=>esCorp(ex)?(esAsist(ex)?Math.max(0,pesoCorp()-(w||0)):pesoCorp()+(w||0)):(w||0);
/* ---------- Tu cuerpo hoy: fatiga por músculo según el historial (estilo Gravl) ----------
   Cada serie confirmada carga fatiga a los músculos que trabaja (más si fue exigente) y se va recuperando:
   músculos chicos en ~48 h, grandes en ~72 h. Es una estimación para orientar, no una medición. */
const MUSC={chest:["Pecho",72],"front-deltoids":["Hombro delantero",48],"back-deltoids":["Hombro trasero",48],biceps:["Bíceps",48],triceps:["Tríceps",48],forearm:["Antebrazo",36],abs:["Abdomen",36],obliques:["Oblicuos",36],
  trapezius:["Trapecio",48],"upper-back":["Espalda",72],"lower-back":["Zona lumbar",72],gluteal:["Glúteos",72],quadriceps:["Cuádriceps",72],hamstring:["Isquios",72],adductor:["Aductores",48],abductors:["Abductores",48],calves:["Gemelos",48]};
function muscDe(id){const c=CATALOGO.find(x=>x.id===(CAT_BY_APP[id]||id))||{};const k=c.id||id,g=c.grupo||"";
  if(/encogimientos/.test(k))return{trapezius:1};if(/face-pull|pajaros|posterior-hombro/.test(k))return{"back-deltoids":1,trapezius:.4};
  if(/elevaciones-laterales/.test(k))return{"front-deltoids":.6,"back-deltoids":.4};if(/elevaciones-frontales/.test(k))return{"front-deltoids":1};if(/remo-al-menton/.test(k))return{trapezius:.6,"front-deltoids":.6};
  if(/aperturas|pec-deck/.test(k))return{chest:1,"front-deltoids":.3};if(/fondos-paralelas/.test(k))return{chest:.8,triceps:.8,"front-deltoids":.4};
  if(g==="pecho")return{chest:1,"front-deltoids":.5,triceps:.5};
  if(/peso-muerto$|peso-muerto-sumo/.test(k))return{hamstring:.8,gluteal:.8,"lower-back":.8,"upper-back":.4,trapezius:.4,quadriceps:.4};
  if(/hiperextensiones/.test(k))return{"lower-back":1,gluteal:.4,hamstring:.4};
  if(g==="espalda")return /pull-over/.test(k)?{"upper-back":1,chest:.4}:{"upper-back":1,biceps:.5,"back-deltoids":.4,trapezius:.3};
  if(g==="hombros")return{"front-deltoids":1,triceps:.4,"back-deltoids":.2};
  if(/curl-muneca/.test(k))return{forearm:1};if(/curl/.test(k)&&g==="brazos")return{biceps:1,forearm:.4};if(g==="brazos")return{triceps:1};
  if(/gemelos/.test(k))return{calves:1};if(/aductores/.test(k))return{adductor:1};if(/abductores/.test(k))return{abductors:1};
  if(/rumano|buenos-dias|curl-femoral/.test(k))return{hamstring:1,gluteal:.6,"lower-back":.4};if(/extension-cuadriceps/.test(k))return{quadriceps:1};
  if(g==="gluteos"||/hip-thrust|puente|patada|kettlebell-swing/.test(k))return{gluteal:1,hamstring:.5};
  if(g==="piernas")return{quadriceps:1,gluteal:.6,adductor:.3,hamstring:.2};
  if(/russian|lateral|flexion-lateral|pallof|bicicleta/.test(k))return{obliques:1,abs:.5};if(g==="core")return{abs:1,obliques:.4};
  if(/thruster/.test(k))return{quadriceps:.7,"front-deltoids":.7,triceps:.3};if(/farmer/.test(k))return{forearm:1,trapezius:.6};
  if(g==="completo")return{quadriceps:.4,chest:.3,abs:.3};return{}}
function fatiga(){const now=Date.now();const F={};const docs=wHist.slice(0,20).concat(workout&&workout.startedAt&&!workout.done?[{...workout,id:wcur}]:[]);
  docs.forEach(w=>{const t0=w.startedAt||parse(w.id).getTime()+18*36e5;const h=(now-t0)/36e5;if(h<0||h>96)return;
    Object.entries(w.sets||{}).forEach(([id,arr])=>{const M=muscDe(id);(arr||[]).forEach(x=>{if(!hecha(x))return;const int=(x.rir!=null&&x.rir<=1?1.3:x.rir!=null&&x.rir>=3?.7:1)+(x.hard?.2:0);
      Object.entries(M).forEach(([m,wt])=>{const R=(MUSC[m]||[,72])[1];const rest=Math.max(0,1-h/R);if(rest<=0)return;F[m]=(F[m]||0)+12*wt*int*rest})})})});
  const out={};Object.keys(MUSC).forEach(m=>{out[m]=Math.max(0,Math.round(100-Math.min(100,F[m]||0)))});return out}
function ultimaVez(m){for(const w of wHist){if(Object.entries(w.sets||{}).some(([id,arr])=>(muscDe(id)[m]||0)>=.5&&(arr||[]).some(hecha)))return w.id}return null}
const colRec=v=>v<50?"var(--over)":v<80?"var(--fe)":"var(--accent)";
function cuerpoSVG(rec){const pl=(items)=>items.map(([m,ps])=>{const v=m==="left-soleus"||m==="right-soleus"?rec.calves:rec[m];const deco=v==null;return ps.map(p=>`<polygon points="${p}" fill="${deco?"var(--track)":colRec(v)}" fill-opacity="${deco?.5:.9}" ${deco?"":`data-musc="${m==="left-soleus"||m==="right-soleus"?"calves":m}"`}/>`).join("")}).join("");
  return `<div class="cuerpo"><svg viewBox="0 0 100 200" aria-label="Frente">${pl(CUERPO_FRENTE)}</svg><svg viewBox="0 0 100 200" aria-label="Espalda">${pl(CUERPO_ESPALDA)}</svg></div>`}
const REC_GRUPOS=[["pecho",["chest"]],["espalda",["upper-back"]],["piernas",["quadriceps","hamstring"]],["gluteos",["gluteal"]],["hombros",["front-deltoids","back-deltoids"]],["biceps",["biceps"]],["triceps",["triceps"]]];
const PAREJA={pecho:"triceps",espalda:"biceps",piernas:"gluteos",gluteos:"piernas",hombros:"triceps",biceps:"espalda",triceps:"pecho"};
function recomendar(){const rec=fatiga();const sc=REC_GRUPOS.map(([g,ms])=>{const v=Math.min(...ms.map(m=>rec[m]));const u=ms.map(ultimaVez).filter(Boolean).sort()[0];const dias=u?Math.round((parse(today())-parse(u))/864e5):9;return{g,v,dias,score:v+Math.min(dias,7)*6}});
  const lista=sc.filter(x=>x.v>=80&&!["biceps","triceps"].includes(x.g)).sort((a,b)=>b.score-a.score);const pri=(lista[0]||sc.sort((a,b)=>b.score-a.score)[0]);
  const par=sc.find(x=>x.g===PAREJA[pri.g]);const prios=[pri.g].concat(par&&par.v>=70?[par.g]:[]);
  const nom=g=>AR_PRIO.find(x=>x[0]===g)[1].toLowerCase();const cans=sc.filter(x=>x.v<60).map(x=>nom(x.g)+" "+x.v+" %");
  const why=`Hoy toca ${prioTxt(prios)}: ${pri.v>=100?"están 100 % recuperados":"están al "+pri.v+" %"}${pri.dias<9?" y no los entrenás hace "+pri.dias+" "+(pri.dias===1?"día":"días"):""}.${cans.length?" Todavía cansados: "+cans.join(", ")+".":""}`;
  return{prios,why}}
function avisoRutina(r){if(!r||!r.ex.length)return "";const rec=fatiga();const prin={};r.ex.slice(0,3).forEach(ex=>{Object.entries(muscDe(ex.id)).forEach(([m,w])=>{if(w>=1)prin[m]=1})});
  const bajos=Object.keys(prin).filter(m=>rec[m]<60);if(!bajos.length)return "";return `<p class="coach">${ic("info")}<span>${bajos.map(m=>MUSC[m][0]).join(" y ")} ${bajos.length>1?"están":"está"} al ${Math.min(...bajos.map(m=>rec[m]))} %. Bajá una serie en esos ejercicios o tocá «Recomendame el de hoy».</span></p>`}
function cuerpoCardHTML(){const rec=fatiga();const cans=Object.entries(rec).filter(([m,v])=>v<80).sort((a,b)=>a[1]-b[1]).slice(0,4);
  return `<section class="card cuerpocard"><div class="hd"><span class="eyebrow">Tu cuerpo hoy</span><small class="hint">${cans.length?"Tocá un músculo para ver cuándo está listo.":"Todo recuperado: podés entrenar lo que quieras."}</small></div>
    ${cuerpoSVG(rec)}
    <div class="ley"><span><i style="background:var(--over)"></i>Cansado</span><span><i style="background:var(--fe)"></i>Casi listo</span><span><i style="background:var(--accent)"></i>Listo</span></div>
    ${cans.length?`<div class="cans">${cans.map(([m,v])=>`<button class="mchip" data-musc="${m}"><i style="background:${colRec(v)}"></i>${esc(MUSC[m][0])} ${v} %</button>`).join("")}</div>`:""}
    <button class="primary" id="recomendar">${ic("check")}Recomendame el de hoy</button>
    <p class="hint" style="margin:0">Es una estimación con tus series, el RIR y «Costó»: los músculos chicos se recuperan en unas 48 h y los grandes en 72 h.</p></section>`}
/* ---------- Cambiar un ejercicio: recomendados del mismo músculo, filtrables por lo que tenés a mano ---------- */
const CAMB_EQ=[["","Mi equipo"],["mancuernas","Mancuernas"],["barra","Barra"],["maquina","Máquina"],["polea","Polea"],["peso-corporal","Sin peso"]];
function alternativas(ex,eq,q){const cid=CAT_BY_APP[ex.id]||ex.id;const c0=CATALOGO.find(x=>x.id===cid)||{};const M0=muscDe(ex.id);const r=curRoutine();const usados=new Set((r?r.ex:[]).map(e=>CAT_BY_APP[e.id]||e.id));
  const sim=c=>{const M=muscDe(c.id);let s=0,n0=0;Object.entries(M0).forEach(([m,w])=>{n0+=w;s+=Math.min(w,M[m]||0)});return n0?s/n0:0};
  let L=CATALOGO.filter(c=>c.id!==cid&&!usados.has(c.id)).map(c=>({c,s:sim(c)+(c.grupo===c0.grupo?.2:0)}));
  if(q){const w=norm(q).split(/\s+/);L=L.filter(x=>w.every(t=>norm(x.c.nombre).includes(t)))}else L=L.filter(x=>x.s>=.45);
  if(eq)L=L.filter(x=>x.c.equipo===eq);else L=L.filter(x=>puedo(x.c));
  return L.sort((a,b)=>b.s-a.s).map(x=>x.c)}
function cambiarEj(exId,nuevoCid,siempre){const r=curRoutine(),base=curRoutineBase();const ex=r.ex.find(x=>x.id===exId);if(!ex||!base)return;
  const hechas=wsets(exId).filter(hecha).length;const tot=nSerOf(ex);const resto=Math.max(1,tot-hechas);const c=CATALOGO.find(x=>x.id===nuevoCid);
  const tiempo=/plancha|bicho|farmer|soga|mountain/.test(nuevoCid);const nuevo=exDeCatalogo(nuevoCid,resto,tiempo?30:ex.lo,tiempo?45:ex.hi);if(!nuevo)return;
  const antes=hechas?{...ex,sets:hechas,cambiado:true}:null;
  // la clave es el id que figura en la rutina base (si el ejercicio ya venía de un cambio, se reemplaza ese cambio)
  const key=Object.keys((workout&&workout.cambios)||{}).find(k=>{const cc=workout.cambios[k];return(cc.nuevo&&cc.nuevo.id===exId)})||exId;
  if(siempre){const rr=routines.find(x=>x.id===base.id);const i=rr.ex.findIndex(e=>e.id===key);if(i>=0){rr.ex[i]={...exDeCatalogo(nuevoCid,ex.sets,tiempo?30:ex.lo,tiempo?45:ex.hi)};saveRoutines()}
    saveWorkout(w=>{w.cambios=w.cambios||{};const prev=w.cambios[key];delete w.cambios[key];const ant=prev&&prev.antes?prev.antes:antes;w.cambios[nuevoCid]={antes:ant,nuevo:{...nuevo}}})}
  else saveWorkout(w=>{w.cambios=w.cambios||{};const prev=w.cambios[key];w.cambios[key]={antes:prev&&prev.antes?prev.antes:antes,nuevo}});
  const r2=curRoutine();const j=r2.ex.findIndex(e=>e.id===nuevoCid);if(j>=0)exIdx=j;coachMsg[nuevoCid]=null;toast("Cambiado por "+(c?c.nombre:nuevoCid))}
/* ---------- Coach: un consejo después de cada serie, según reps, RIR y «Costó» ---------- */
function coachSerie(ex,i,x){if(!x)return null;const ult=i>=nSerOf(ex)-1;const t=esTiempo(ex);
  if(x.rir===0&&!ult)return "Llegaste al fallo antes de la última serie. "+(esAsist(ex)?"Sumá un poco de ayuda":"Bajá un 5–10 % el peso")+" para las que quedan: así cuidás la técnica y el músculo rinde más.";
  if(x.hard&&i===0)return "Si la primera ya costó, mantené el peso y priorizá la técnica. La próxima vez no sube.";
  if(!t&&x.r>0&&x.r<ex.lo)return `No llegaste al mínimo (${ex.lo} reps). ${esAsist(ex)?"Sumá ayuda":"Bajá un escalón el peso"} en la próxima serie.`;
  if(!t&&x.r>ex.hi&&(x.rir==null||x.rir>=2))return `Te sobró: pasaste las ${ex.hi} reps. ${esAsist(ex)?"Bajá la ayuda":"Subí "+f1(ex.step||2.5)+" kg"} en la próxima serie.`;
  if(x.rir>=4)return "Te quedaron 4 o más reps en el tanque: la serie casi no estimula. Subí el peso o hacé más reps.";
  if(ult&&x.rir!=null&&x.rir<=2)return "Bien: última serie exigente y con técnica. Así se progresa.";
  return null}
function coachResumen(r){const tips=[];let hard=0,fallo=0,top=0,bajo=0;r.ex.forEach(ex=>{const all=wsets(ex.id).filter(hecha);if(all.some(x=>x.hard))hard++;fallo+=all.filter(x=>x.rir===0).length;if(all.length>=ex.sets&&all.every(x=>x.r>=ex.hi&&(x.rir==null||x.rir>=2)))top++;if(all.some(x=>x.r>0&&x.r<ex.lo&&!esTiempo(ex)))bajo++});
  if(fallo>=2)tips.push(`Fuiste al fallo ${fallo} veces. Para progresar alcanza con quedar a 1 o 2 reps: llegás mejor al próximo entreno.`);
  if(hard>=2)tips.push("Varios ejercicios costaron: dormí 7–8 h y llegá a tu proteína de hoy. La próxima vez esos pesos se mantienen.");
  if(bajo)tips.push("En algún ejercicio no llegaste al mínimo de reps: la próxima vez la app te deja el mismo peso o te conviene bajarlo un escalón.");
  if(top)tips.push(`En ${top} ${top===1?"ejercicio":"ejercicios"} te sobró resto: la próxima vez la app sube el peso.`);
  const tp=((targets&&targets.gym)||DEFAULT_TARGETS.gym||{}).p;tips.push(`Dejá 48 a 72 horas antes de volver a entrenar estos músculos.${tp?" Hoy apuntá a "+fmt(tp)+" g de proteína.":""}`);
  return tips.slice(0,3)}
const tecDe=ex=>TECNICA[CAT_BY_APP[ex.id]||ex.id]||TECNICA[iluId(ex)]||null;
let tecOpen=false;
const tecHTML=(ex,abierta)=>{const T=tecDe(ex);if(!T)return "";return `<div class="tec${abierta?" open":""}"><button class="tecbtn" data-tec="1" aria-expanded="${!!abierta}">${ic("info")}<span>Técnica</span>${ic("right")}</button><div class="tecin"><ol>${T.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join("")}</ol><p class="err">${ic("x")}<span>Evitá: ${esc(T[3])}</span></p></div></div>`};
/* valores sugeridos de cada serie: copian la última serie cargada (peso y reps), si no, lo sugerido */
function baseSerie(ex,i){const ss=wsets(ex.id);let w=null,r=null;for(let k=i-1;k>=0;k--){const x=ss[k]||{};if(w==null&&x.w>0)w=x.w;if(r==null&&x.r>0)r=x.r;if(w!=null&&r!=null)break}const sg=suggest(ex);return{w:w!=null?w:(sg.w!=null?sg.w:null),r:r!=null?r:ex.lo}}
function exCardHTML(ex,foco,first){const ss=wsets(ex.id);const sg=suggest(ex);const L=loads[ex.id];const rows=[];
    const nSer=Math.max(ex.sets+((workout&&workout.extra&&workout.extra[ex.id])||0),ss.filter(x=>x&&(x.r>0||x.w>0)).length,1);
    for(let i=0;i<nSer;i++){const s=ss[i]||{};const B=baseSerie(ex,i);const w=B.w!=null?B.w:"";const done=hecha(s);const ro="";
      rows.push(`<span class="no">${i+1}</span>
        <input type="number" inputmode="decimal" step="any" class="${done?"":"empty"}"${ro} data-set="${ex.id}" data-i="${i}" data-k="w" value="${esc(s.w!=null?s.w:"")}" placeholder="${esc(w)}" aria-label="Peso serie ${i+1}">
        <input type="number" inputmode="numeric" class="${done?"":"empty"}"${ro} data-set="${ex.id}" data-i="${i}" data-k="r" value="${esc(s.r!=null?s.r:"")}" placeholder="${esc(B.r)}" aria-label="Reps serie ${i+1}">
        <input type="number" inputmode="numeric" class="${done?"":"empty"}"${ro} data-set="${ex.id}" data-i="${i}" data-k="rir" value="${esc(s.rir!=null?s.rir:"")}" placeholder="2" aria-label="RIR serie ${i+1}">
        <button class="costo" data-hard="${ex.id}" data-i="${i}" aria-pressed="${!!s.hard}" aria-label="La serie me costó">Costó</button>
        <button class="hecha" data-ok="${ex.id}" data-i="${i}" aria-pressed="${done}" aria-label="${done?"Serie hecha: tocá para editarla":"Confirmar serie"}">${done?ic("check"):"Hecha"}</button>`)}
    const il=iluId(ex);const live=!!(timer&&timer.exId===ex.id);const pr=prs[ex.id];const nd=ss.filter(hecha).length;
    return `<section class="ex${foco?" foco":""}${nd>=nSerOf(ex)?" completo":""}"><div class="hd"><div class="ttl">${il?`<button class="exthumb${live?" live":""}" data-ficha="${ex.id}" aria-label="Ver ${esc(ex.name)}">${iluHTML(il)}</button>`:""}<div><b>${esc(ex.name)}${pr&&pr.w>=0&&(pr.w>0||pr.asist)?` <span class="prtag" title="Récord">${pr.asist?(pr.w>0?f1(pr.w)+" ayuda":"sin ayuda"):f1(pr.w)}</span>`:""}</b><small>${ex.sets} × ${ex.lo}${ex.hi!==ex.lo?"–"+ex.hi:""}${esTiempo(ex)?" s":""} · descanso ${mmss(restOf(ex))}</small>${esCorp(ex)?`<button class="chip asistbtn ${esAsist(ex)?"":"off"}" data-asist="${ex.id}" aria-pressed="${esAsist(ex)}">${esAsist(ex)?ic("check"):""}Asistida</button>`:""}</div></div>
      <div class="sug${sg.hold?" hold":""}"><span class="eyebrow">Sugerido</span>${sg.w!=null?`<span class="v">${f1(sg.w)}<small> ${esTiempo(ex)?"s":porMancuerna(ex)?"kg c/u":"kg"}</small></span>`:`<span class="v vacio">${esTiempo(ex)?"Anotá":"Elegí"}</span>`}</div></div>
      <div class="exherr">${tecHTML(ex,foco?tecOpen:false)}${ex.cambiado?`<span class="chip muted sm">Cambiado</span>`:`<button class="cambiar" data-cambiar="${ex.id}">${ic("swap")}Cambiar</button>`}</div>
      <div class="sets"><span></span><span class="th">${esTiempo(ex)?"seg":esCorp(ex)?(esAsist(ex)?"ayuda kg":"lastre kg"):porMancuerna(ex)?"kg c/u":"kg"}</span><span class="th">reps</span><span class="th">rir</span><span></span><span></span>${rows.join("")}</div>
      ${workout&&workout.startedAt&&!workout.done?`<div class="setsmas"><button class="chip off" data-smas="${ex.id}">${ic("plus")}Serie</button>${nSer>1?`<button class="chip off" data-smenos="${ex.id}">${ic("minus")}Serie</button>`:""}</div>`:""}
      ${porMancuerna(ex)?(()=>{const B=baseSerie(ex,ss.length?Math.min(ss.length,ex.sets-1):0);return B.w>0?`<p class="leyenda">${f1(B.w)} kg c/u = ${f1(B.w*2)} kg en total. Cargá el peso de cada mancuerna.</p>`:`<p class="leyenda">Cargá el peso de cada mancuerna (si usás 10 y 10, poné 10).</p>`})():""}
      ${coachMsg[ex.id]?`<p class="coach">${ic("info")}<span>${esc(coachMsg[ex.id])}</span></p>`:""}
      ${esAsist(ex)?`<p class="leyenda">Asistida: anotá los kg que te ayudan (máquina o banda). Cuanta menos ayuda, más fuerza: la app te va a pedir bajarla.</p>`:""}
      ${(foco||first)&&!wHist.length?`<p class="leyenda">Cargá peso y reps y tocá <b>Hecha</b> al terminar cada serie. <b>Costó</b>: la serie te dejó al límite, así la próxima vez el peso no sube.</p>`:""}
      ${foco&&!L&&!wHist.length?"":`<div class="next">${esc(sg.why)}${L?" Última: "+f1(L.w)+" × "+(L.reps||[]).join("/")+".":""}</div>`}</section>`}
function weekAvgs(){const by={};bodyRows.forEach(r=>{if(r.weight>0)by[r.date]=r.weight});const out=[];
  for(let w=0;w<13;w++){let s=0,n=0;for(let i=0;i<7;i++){const d=addDays(PLAN_START,w*7+i);if(by[d]){s+=by[d];n++}}out.push(n?s/n:null)}return out}
function renderCuerpo(){
  const rows=bodyRows.slice().sort((a,b)=>a.date<b.date?-1:1);const byDate={};rows.forEach(r=>byDate[r.date]=r);
  const tdy=byDate[today()]||{};const avg7=d=>{let s=0,n=0;for(let i=0;i<7;i++){const r=byDate[addDays(d,-i)];if(r&&r.weight>0){s+=r.weight;n++}}return n?s/n:null};
  const a=avg7(today()),aPrev=avg7(addDays(today(),-7)),aPrev2=avg7(addDays(today(),-14));
  const diff=a!=null&&aPrev!=null?a-aPrev:null,diff2=aPrev!=null&&aPrev2!=null?aPrev-aPrev2:null;
  let advice="Cargá el peso todos los días; mirá el promedio de 7 días, no el número de hoy.",acc=false;
  const G=(profile&&profile.goal)||"perder";
  if(G!=="perder"&&diff!=null){const two=diff2!=null;const lo={recomp:-0.7,ganar:0.1,mantener:-0.3}[G],hi={recomp:0.3,ganar:0.6,mantener:0.3}[G];
    if(two&&diff<lo&&diff2<lo){advice=G==="ganar"?"Dos semanas sin subir: sumá 150 kcal (más carbos) en todos los días.":"Bajás más rápido de lo buscado: subí 100 kcal para cuidar el músculo.";}
    else if(two&&diff>hi&&diff2>hi){advice=G==="ganar"?"Subís más de 0,6 kg por semana: bajá 100 kcal, estás sumando grasa de más.":"El peso sube dos semanas seguidas: bajá 100 kcal en días de descanso.";}
    else{advice=G==="recomp"?"Correcto: en recomposición el peso casi no se mueve. Mirá la cintura y que la fuerza suba.":G==="ganar"?"Correcto: subís a buen ritmo. No tocar calorías.":"Correcto: peso estable.";acc=true}}
  else if(diff!=null&&diff2!=null){if(diff>-0.4&&diff2>-0.4)advice="Dos semanas bajando menos de 0,4 kg: bajá 100–150 kcal de carbos o grasas en días de descanso.";
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
  if(!rows.length)return `<div class="top"><div class="l"><span class="eyebrow fecha">Semana ${weekNo} de 13 · día ${planDay} de 90</span><h1 class="title">Cuerpo</h1></div></div>
  <section class="card vacio-card"><span class="ic">${ic("scale")}</span><b>Cargá tu primer peso</b><p class="hint">Pesate en ayunas, después del baño. La app saca el promedio de 7 días y te dice si hay que ajustar las calorías: el número de un día solo no dice nada.</p></section>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Registrar hoy</span>
    <div style="display:grid;grid-template-columns:1fr 1fr 48px;gap:8px;align-items:center"><input type="number" class="inset c" id="bw" inputmode="decimal" step="0.1" placeholder="Peso (kg)" aria-label="Peso en kg"><input type="number" class="inset c" id="bwa" inputmode="decimal" step="0.5" placeholder="Cintura (cm)" aria-label="Cintura en cm"><button class="iconbtn acc" id="saveBody" style="width:48px;height:48px" aria-label="Guardar">${ic("check")}</button></div>
    <p class="hint">La cintura, una vez por semana a la altura del ombligo. Meta de peso: ${f1(goal)} kg (la cambiás en Yo).</p></section>`;
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
  const P=PJ.normal(dprofile||{});const nom=(dprofile&&dprofile.nombre)||(user&&user.displayName&&user.displayName.split(" ")[0])||(P.sx==="f"?"Peregrina":"Peregrino");
  const L=levelOf(progress.xp||0);const st=streakOf(progress.days||[],today());const c=progress.counts||{};const nb=Object.keys(progress.badges||{}).length;
  const local=backend&&backend.mode==="local";
  return `
  <div class="top"><div class="l"><span class="eyebrow">Tu personaje</span><h1 class="title">${esc(nom)}</h1></div><div class="r">${candleChip()}</div></div>
  <div class="card big${fondoFit()?" confondo":""}">${fondoFit()?`<img class="bg" src="${ilu(fondoFit())}" alt=""><span class="sh"></span>`:""}${personajeHTML("vivo",256)}</div>
  <a class="card eqcard" href="${DAILY_URL}#yo" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><span class="ic">${ic("edit")}</span><span class="n"><b>Personalizar en Scaeli Daily</b><small>Ropa, peinado, altura y fondo: es el mismo personaje en las dos apps.</small></span>${ic("right")}</a>
  <div class="card"><div class="eyebrow" style="margin-bottom:10px">Tu nivel</div>
    <div class="nivel"><span class="nv"><svg viewBox="0 0 60 60" aria-hidden="true"><circle class="t" cx="30" cy="30" r="26"/><circle class="p" cx="30" cy="30" r="26" stroke-dasharray="163.4" stroke-dashoffset="${(163.4*(1-L.pct/100)).toFixed(1)}"/></svg><b>${L.i+1}</b></span>
      <span class="nx"><b class="nt">${esc(L.name)} · nivel ${L.i+1}</b><small>${L.to?fmt(progress.xp||0)+" XP · "+fmt(L.to-(progress.xp||0))+" para "+esc(LEVELS[L.i+1][0]):fmt(progress.xp||0)+" XP · nivel máximo"}</small><span class="bar"><i style="width:${L.pct}%"></i></span></span></div>
    <p class="hint" style="margin:8px 0 0">Lo que más suma es entrenar: entreno terminado ${XP.workout} XP (+${XP.offered} si lo ofrecés). Rosario ${XP.rosary} · ayuno cumplido ${XP.fast} · tres comidas en el día ${XP.meals} · pesaje ${XP.body}.</p></div>
  ${isPlus()||fasts.length?`<section class="card tight list"><div class="row"><span class="eyebrow">Ayunos (${fasts.length})</span>${fasts.length?`<small class="hint">${fasts.filter(f=>f.done).length} cumplidos</small>`:""}</div>
    ${fasts.length?fasts.slice(0,10).map(f=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(fecha(f.date))}</b><small>${esc(f.plan)}${f.done?" · cumplido":" · cortado antes"}</small></div><span class="k">${hms(f.ms).slice(0,-3)}<small>horas</small></span></div>`).join(""):`<p class="empty">Acá quedan tus ayunos terminados, con las horas de cada uno.</p>`}</section>`:""}
  <div class="card"><div class="eyebrow" style="margin-bottom:10px">Tus insignias</div><div class="logros">${BADGES.map(([id,name,icon])=>`<span class="logro${progress.badges&&progress.badges[id]?" on":""}">${ic(icon)}<b>${esc(name)}</b></span>`).join("")}</div></div>
  <div class="card"><div class="eyebrow" style="margin-bottom:12px">Tu camino</div><div class="grid2">${[["Racha",st.n],["Mejor racha",progress.best||0],["Entrenos",c.workouts||0],["Rosarios",c.rosaries||0]].map(([n,v])=>`<div class="stat"><div class="v">${v}</div><small class="d">${n}</small></div>`).join("")}</div></div>
  <button class="card plusmas" id="openPlus" style="text-align:left;width:100%"><span class="plus-tag">Scaeli<b>+</b></span><span class="n"><b>${isPlus()?"Scaeli+ activo":"Scaeli+"}</b><small>${isPlus()?"Ayuno con planes, y todo lo de Daily":"Ayuno con planes y rutinas por objetivo · vale para Daily y Fit · desde USD 1,67 por mes"}</small></span></button>
  <div class="sect" style="margin-top:8px">Ajustes</div>
  <section class="card tight list"><div class="row"><div class="n"><b>${local?"Sin cuenta":esc(user&&(user.displayName||user.email)||"Tu cuenta")}</b><small>${local?"Guardado solo en este dispositivo":"Guardado en tu cuenta de Google"}</small></div><div class="acts"><button class="chip off" id="theme">${light?"Oscuro":"Claro"}</button>${local?`<button class="ghost" id="login">${LOGO_GOOGLE}Entrar</button>`:`<button class="ghost g" id="logout">${ic("out")}Salir</button>`}</div></div></section>
  <section class="card tight list"><div class="row"><span class="eyebrow">Recetas (${recipes.length})</span><button class="ghost" id="newRecipe" style="height:32px;font-size:12px">${ic("plus")}Nueva</button></div>
    ${recipes.length?recipes.map(r=>`<div class="row"><div class="n"><b>${esc(r.name)}</b><small>${r.items.length} ingredientes · ${r.portions} ${r.portions===1?"porción":"porciones"} · ${fmt(totals(r.items).kcal/(r.portions||1))} kcal c/u${r.lent?" · abstinencia":""}</small></div><div class="acts"><button class="sm" data-edrec="${r.id}" aria-label="Editar receta">${ic("edit")}</button><button class="sm" data-delrec="${r.id}" aria-label="Borrar receta">${ic("trash")}</button></div></div>`).join(""):`<p class="empty">Tus comidas caseras con sus macros exactos: cargás los ingredientes y cuántas porciones salen.</p>`}</section>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Alimentos</span>
    <p class="hint">${BASE.length} en la base (argentinos y USDA)${hidden.size?", "+hidden.size+" ocultos":""} · ${own} propios · ${recipes.length} recetas.</p>
    <div class="r"><button class="ghost g" id="openFoods">${ic("edit")}Editar</button><button class="ghost g" id="newFood">${ic("plus")}Nuevo</button></div></section>
  <section class="card pad"><form id="tf"><span class="eyebrow">Objetivos diarios</span>
    ${["gym","rest"].map(k=>`<div><p class="hint" style="margin:6px 0 6px;font-weight:600;color:var(--ink)">${k==="gym"?"Gym / fútbol":"Descanso"}</p><div class="grid4">${[["kcal","kcal"],["p","Prot"],["c","Carb"],["g","Grasa"]].map(([f,l])=>`<label class="f" for="t_${k}_${f}">${l}<input class="inset" type="number" id="t_${k}_${f}" inputmode="numeric" value="${(t[k]||DEFAULT_TARGETS[k])[f]}"></label>`).join("")}</div></div>`).join("")}
    <label class="f" for="goalIn" style="margin-top:4px">Meta de peso (kg)<input class="inset" type="number" id="goalIn" inputmode="decimal" step="0.5" value="${goal}"></label>
    <div class="r"><button class="ghost" type="submit">${ic("check")}Guardar</button><button class="ghost g" type="button" id="recalc">${ic("scale")}Recalcular</button></div></form></section>
  <section class="card tight list"><div class="row"><span class="eyebrow">Favoritos (${combos.length})</span></div>
    ${combos.length?combos.map(c=>`<div class="row"><div class="n"><b>${esc(c.name)}</b><small>${MEALS.find(m=>m[0]===c.meal)[1]} · ${c.items.length} ítems · ${fmt(totals(c.items).kcal)} kcal</small></div><button class="sm" data-delcombo="${c.id}" aria-label="Borrar favorito">${ic("trash")}</button></div>`).join(""):`<p class="empty">Guardá una comida con la estrella en Hoy.</p>`}</section>
  ${rangosCardHTML()}
  ${grupoCardHTML()}
  <section class="card tight list"><div class="row"><span class="eyebrow">Entrenamientos (${wHist.length})</span>${wHist.length>3?`<button class="lnkb" data-hall="1">Ver todos</button>`:""}</div>
    ${wHist.length?wHist.slice(0,3).map(histRow).join(""):`<p class="empty">Cuando termines un entreno, queda acá con su resumen.</p>`}</section>
  ${eqCardHTML()}
  <section class="card tight list"><div class="row"><span class="eyebrow">Rutinas</span><button class="ghost" id="openRutinas" style="height:32px;font-size:12px">${ic("plus")}Biblioteca</button></div>
    ${routines.map(r=>`<div class="row" style="flex-direction:column;align-items:stretch;gap:0"><div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0 8px"><b style="font-weight:600">${esc(r.name)}</b><small class="hint">${r.day>=0?DOWS[r.day]:"libre"} · ${esc(r.goal)}</small></div>
      ${r.ex.map(e=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><div class="n"><b style="font-weight:500;font-size:14px">${esc(e.name)}</b><small>${e.sets} × ${e.lo}${e.hi!==e.lo?"–"+e.hi:""} · +${f1(e.step)} kg · ${mmss(restOf(e))}</small></div><button class="sm" data-edex="${r.id}/${e.id}" aria-label="Editar ${esc(e.name)}">${ic("edit")}</button></div>`).join("")}</div>`).join("")}</section>
  <section class="card tight list"><div class="row"><span class="eyebrow">Intenciones recientes</span></div>${intents.length?intents.map(i=>`<div class="row"><b style="font-weight:500">${esc(i)}</b><button class="sm" data-delint="${esc(i)}" aria-label="Borrar">${ic("x")}</button></div>`).join(""):`<p class="empty">Aparecen al ofrecer un entrenamiento.</p>`}</section>
  <section class="card pad" style="display:flex;flex-direction:column;gap:10px"><span class="eyebrow">Tus datos</span>
    <p class="hint">Exportá una copia de todo en un archivo, o importá el archivo de la versión anterior de la app.</p>
    <p class="hint" style="font-size:11px">Dibujos de ejercicios: <a href="https://github.com/everkinetic/data" target="_blank" rel="noopener">Everkinetic</a>, CC BY-SA 4.0. Mapa de músculos: <a href="https://github.com/giavinh79/react-body-highlighter" target="_blank" rel="noopener">react-body-highlighter</a>, MIT.</p>
    <div class="r"><button class="ghost g" id="exportData">${ic("db")}Exportar</button><label class="ghost g" for="importFile">${ic("upload")}Importar<input id="importFile" type="file" accept="application/json,.json" hidden></label></div>
    <p class="hint" id="status" style="${statusErr?"color:var(--over)":""}">${esc(statusTxt)}</p></section>`;
}
let anims=[];
function mountSprites(root){anims.forEach(a=>a.stop());anims=[];
  (root||document).querySelectorAll("canvas[data-sprite]").forEach(cv=>{const id=cv.dataset.sprite;loadSprite(id).then(sp=>{if(!cv.isConnected)return;const live=cv.dataset.live==="1";const scale=+cv.dataset.scale||1;
    const a=new SpriteAnim(cv,sp,{scale,crop:true,start:live?undefined:(sp.cfg.quieto??sp.cfg.inicio??0),end:live?undefined:(sp.cfg.quieto??sp.cfg.inicio??0),autoplay:live});if(!live){a.frame=sp.cfg.quieto??sp.cfg.inicio??0;a.draw()}anims.push(a)}).catch(()=>{})})}
function afterRender(){
  document.body.classList.toggle("foco",focoActivo());document.body.classList.toggle("foco-ros",focoActivo()&&rosMini);wakeAjustar();
  {const fb=document.querySelector(".fbar");if(fb)document.documentElement.style.setProperty("--fbarh",fb.offsetHeight+"px")}
  mountSprites($("#app"));pintarPersonajes();
  const tfi=$("#tfile");if(tfi)tfi.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)uploadTrack(f)};
  const imp=$("#importFile");if(imp)imp.onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const dump=JSON.parse(await f.text());const cols=["days","workouts","body","combos","recipes","foods","tracks","settings"];const clean={};cols.forEach(c=>{if(dump[c]&&typeof dump[c]==="object")clean[c]=dump[c]});
      if(!Object.keys(clean).length)return toast("El archivo no tiene datos de Scaeli Fit");toast("Importando…");const n=await backend.importAll(clean);toast("Importados "+n+" registros")}catch(err){toast("No se pudo importar: "+(err&&err.message||""))}e.target.value=""};
  const tf=$("#tf");if(tf)tf.onsubmit=e=>{e.preventDefault();const nt={};["gym","rest"].forEach(k=>{nt[k]={};["kcal","p","c","g"].forEach(f=>nt[k][f]=parseFloat($("#t_"+k+"_"+f).value)||0)});
    targets=nt;const g=parseFloat($("#goalIn").value);if(g>0)goal=g;write(backend.setDoc("settings/targets",{...nt,goal}),"Objetivos guardados");render()};
}

/* ---------- Panel ---------- */
let sheet=null;
function openSheet(s){sheet=s;document.body.classList.add("sheet-open");$("#scrim").hidden=false;const sh=$("#sheet");sh.hidden=false;sh.classList.toggle("short",!!s.short);renderSheetNow()}
function closeSheet(){sheet=null;document.body.classList.remove("sheet-open");$("#scrim").hidden=true;const sh=$("#sheet");sh.hidden=true;sh.classList.remove("full");$("#sheetIn").innerHTML=""}
const X=`<button class="iconbtn ghost" id="x" aria-label="Cerrar">${ic("x")}</button>`;
function renderSheetNow(){renderSheetBody();if(sheet&&(sheet.view==="ficha"||sheet.view==="rutinas"))mountSprites($("#sheetIn"));pintarPersonajes();$("#sheet").classList.toggle("full",!!(sheet&&sheet.full))}
function searchListHTML(){const L=liturgy(cur);const q=sheet.q||"";const list=searchFoods(q);const favs=(q||sheet.target)?[]:combos.filter(c=>c.meal===sheet.meal);
  const manual=`<button class="food manual" data-manual="1">${ic("edit")}<span><b>Cargar a mano</b><small>${q.trim()?"«"+esc(q.trim())+"» con sus calorías y macros":"Un alimento que no está, con sus calorías y macros"}</small></span></button>`;
  return favs.map(c=>`<button class="fav" data-combo="${c.id}"><span><b>${esc(c.name)}</b><br><small>${c.items.map(i=>esc(i.name)).join(" · ")}</small></span><small>${fmt(totals(c.items).kcal)} kcal · ${fmt(totals(c.items).p)} P</small></button>`).join("")+
    (list.length?list.map(f=>`<button class="food${L.abstinencia&&!sheet.target&&MEAT.test(f.name)&&!f.lent?" dim":""}" data-pick="${f.id}"><b>${esc(f.name)}${f.recipeId?' <span class="eyebrow" style="font-size:9px">receta</span>':""}</b><small>${fmt(f.kcal)} kcal · ${f1(f.p)} P ${f.unitG?"/ "+esc(f.unitName||"u"):"/100 g"}</small></button>`).join("")+(list.length>=MAX_RES?`<p class="hint" style="text-align:center">Se muestran ${MAX_RES}: escribí más para afinar.</p>`:""):`<p class="empty">${foods.length?"No hay coincidencias.":"Cargando la base de alimentos…"}</p>`)+manual}
function foodsListHTML(){return searchFoods(sheet.q||"",120).map(f=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(f.name)}</b><small>${fmt(f.kcal)} kcal · P ${f1(f.p)} · C ${f1(f.c)} · G ${f1(f.g)}${f.unitG?" · 1 "+esc(f.unitName||"u")+" = "+fmt(f.unitG)+" g":""}</small></div><button class="sm" data-delf="${f.id}" aria-label="Borrar ${esc(f.name)}">${sheet.confirm===f.id?ic("check"):ic("trash")}</button></div>`).join("")}
function renderSheetBody(){
  const el=$("#sheetIn");if(!sheet)return;el.dataset.view=sheet.view||"";const mealName=sheet.meal?MEALS.find(m=>m[0]===sheet.meal)[1]:"";
  if(sheet.view==="search"){const title=sheet.target==="recipe"?"Ingrediente":mealName;const L=liturgy(cur);
    el.innerHTML=`<h3>${esc(title)}${X}</h3><input type="search" id="q" placeholder="Buscar alimento…" value="${esc(sheet.q||"")}" autocomplete="off" enterkeyhint="search">
      ${L.abstinencia&&!sheet.target?`<p class="hint">Día de abstinencia: la carne aparece atenuada.</p>`:""}
      <div class="scroll" id="flist">${searchListHTML()}</div>`;
    // al escribir solo se redibuja la lista de resultados, no el panel entero: así no se traba el teclado
    const q2=$("#q");q2.oninput=e=>{sheet.q=e.target.value;const fl=$("#flist");if(fl)fl.innerHTML=searchListHTML()};
    if(!sheet.q)setTimeout(()=>{const n=$("#q");n&&n.focus()},50);
  } else if(sheet.view==="manual"){const m=sheet.m||(sheet.m={name:sheet.q||"",por:"",k:"",p:"",c:"",g:"",save:true});
    el.innerHTML=`<h3>A mano${X}</h3><p class="hint">Cargá lo que dice la etiqueta o lo que calculás. Si ponés los gramos, se guarda por 100 g; si no, como una porción.</p><div class="scroll"><form id="mf" style="display:flex;flex-direction:column;gap:12px">
      <label class="f" for="mfName">Nombre<input class="inset" type="text" id="mfName" required value="${esc(m.name)}" placeholder="Tostada con queso" autocomplete="off"></label>
      <div class="grid2"><label class="f" for="mfPor">Gramos (opcional)<input class="inset" type="number" id="mfPor" inputmode="decimal" step="any" value="${esc(m.por)}" placeholder="1 porción"></label><label class="f" for="mfK">Calorías<input class="inset" type="number" id="mfK" inputmode="decimal" step="any" required value="${esc(m.k)}" placeholder="180"></label></div>
      <div class="grid3"><label class="f" for="mfP">Prot<input class="inset" type="number" id="mfP" inputmode="decimal" step="any" value="${esc(m.p)}" placeholder="0"></label><label class="f" for="mfC">Carb<input class="inset" type="number" id="mfC" inputmode="decimal" step="any" value="${esc(m.c)}" placeholder="0"></label><label class="f" for="mfG">Grasa<input class="inset" type="number" id="mfG" inputmode="decimal" step="any" value="${esc(m.g)}" placeholder="0"></label></div>
      <button type="button" class="chip ${m.save?"":"off"}" id="mfSave" aria-pressed="${!!m.save}" style="width:max-content">${ic("check")}Guardar en mis alimentos</button>
      <button class="primary" type="submit">${ic("plus")}Agregar</button></form></div>`;
    ["Name","Por","K","P","C","G"].forEach(k=>{$("#mf"+k).oninput=e=>{m[{Name:"name",Por:"por",K:"k",P:"p",C:"c",G:"g"}[k]]=e.target.value}});
    setTimeout(()=>{const n=$("#mf"+(m.name?"K":"Name"));n&&n.focus()},50);
    $("#mf").onsubmit=e=>{e.preventDefault();const v=x=>parseFloat(String(x||"").replace(",","."))||0;const name=(m.name||"").trim();const k=v(m.k),p=v(m.p),c=v(m.c),g=v(m.g),por=v(m.por);if(!name||!(k>0||p>0||c>0||g>0))return toast("Poné el nombre y las calorías");
      const entry={id:newId("e"),meal:sheet.meal||"",foodId:null,name,grams:por>0?r1(por):0,qtyTxt:por>0?fmt(por)+" g":"1 porción",kcal:r1(k),p:r1(p),c:r1(c),g:r1(g),manual:true};
      if(m.save){const f=por>0?{name,kcal:r1(k*100/por),p:r1(p*100/por),c:r1(c*100/por),g:r1(g*100/por)}:{name,kcal:r1(k),p:r1(p),c:r1(c),g:r1(g),unitG:100,unitName:"porción"};const fid=newId("f");entry.foodId=fid;write(saveFood(fid,f))}
      if(sheet.target==="recipe"){recipeDraft.items.push(entry);sheet={view:"recipe"};renderSheetNow();return}
      closeSheet();saveDay(x=>x.entries.push(entry),"Agregado: "+name)};
  } else if(sheet.view==="qty"){const f=foods.find(x=>x.id===sheet.foodId);if(!f){sheet.view="search";return renderSheetNow()}
    const ports=portionsFor(f);const mode=sheet.mode||(f.unitG?"unit":"g");const per=mode==="unit"?f.unitG:mode==="portion"&&sheet.portion?sheet.portion.g:1;
    const qty=parseFloat(sheet.qty)||0;const grams=qty*per;const m=macrosFor(f,grams);
    const unitLbl=mode==="unit"?(f.unitName||"u"):mode==="portion"&&sheet.portion?sheet.portion.name:"g";
    el.innerHTML=`<h3>${esc(f.name)}${X}</h3>
      <div class="r"><input type="number" class="inset" id="qty" inputmode="decimal" min="0" step="any" value="${esc(sheet.qty)}" style="flex:1"><span class="muted" style="min-width:5em">${esc(unitLbl)}</span></div>
      <div class="seg"><button data-mode="g" aria-pressed="${mode==="g"}">Gramos</button>${f.unitG?`<button data-mode="unit" aria-pressed="${mode==="unit"}">${esc(f.unitName||"Unidad")}</button>`:""}${ports.length?`<button data-mode="portion" aria-pressed="${mode==="portion"}">Porción</button>`:""}</div>
      ${mode==="portion"?`<div class="chips">${ports.map((p,i)=>`<button data-portion="${i}" aria-pressed="${!!(sheet.portion&&sheet.portion.name===p.name)}">${esc(p.name)} · ${fmt(p.g)} g</button>`).join("")}</div><p class="hint">Medidas caseras aproximadas (±20 %). Con balanza es más exacto.</p>`:
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
      <div class="scroll list" id="flist">${foodsListHTML()}</div>`;
    $("#q").oninput=e=>{sheet.q=e.target.value;sheet.confirm=null;const fl=$("#flist");if(fl)fl.innerHTML=foodsListHTML()};
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
      <div class="chips">${[[1.2,"Sedentario"],[1.375,"Camino un poco"],[1.55,"10 mil pasos / deporte"],[1.725,"Trabajo físico"]].map(([v,l])=>`<button data-ob="activity" data-v="${v}" aria-pressed="${o.activity==v}">${l}</button>`).join("")}</div>
      <span class="eyebrow">Objetivo</span>
      <div class="objs">${OBJETIVOS.map(([k,n,d,q])=>`<button class="obj" data-ob="goal" data-v="${k}" aria-pressed="${o.goal===k}"><span class="ck">${ic("check")}</span><span class="n"><b>${n}</b><small>${d}</small><small class="q">${q}</small></span></button>`).join("")}</div>
      <label class="f" for="obGW">Peso meta (kg)<input class="inset" type="number" id="obGW" inputmode="decimal" step="0.5" value="${o.goalW}"></label>
      <span class="eyebrow">¿Tenés balanza de cocina?</span>
      <div class="seg"><button data-ob="scale" data-v="1" aria-pressed="${o.scale}">Sí</button><button data-ob="scale" data-v="0" aria-pressed="${!o.scale}">No</button></div>
      <p class="hint">${o.scale?"Vas a cargar en gramos: es lo más exacto.":"Vas a poder cargar en porciones caseras (taza, cucharada, palma). Es una aproximación; cuando puedas, pesá."}</p>
      ${(()=>{const t=calcTargets(o);return `<div class="preview"><div><b>${fmt(t.gym.kcal)}</b><span>kcal gym</span></div><div><b>${fmt(t.rest.kcal)}</b><span>kcal descanso</span></div><div><b>${fmt(t.gym.p)}</b><span>Prot</span></div><div><b>${fmt(t.gym.g)}</b><span>Grasa</span></div></div>`})()}
      <button class="primary" id="obSave">${ic("check")}Guardar</button></div>`;
    [["#obAge","age"],["#obH","height"],["#obW","weight"],["#obGW","goalW"]].forEach(([id,k])=>{const n=$(id);n.oninput=e=>{o[k]=parseFloat(e.target.value)||0};n.onchange=()=>renderSheetNow()});
  } else if(sheet.view==="rosario"){el.innerHTML=shRosario()}
  else if(sheet.view==="ficha"){const ex=sheet.ex;const il=iluId(ex);const c=CATALOGO.find(x=>x.id===(il||CAT_BY_APP[ex.id]||ex.id))||{};const L=loads[ex.id];const pr=prs[ex.id];
    el.innerHTML=`<h3>${esc(ex.name)}${X}</h3><div class="scroll" style="display:flex;flex-direction:column;gap:14px">
      ${il?`<div class="ficha">${iluHTML(il,"big")}<small>${esc((c.musc||[]).join(" · ")||"técnica")}</small></div>`:""}
      ${tecHTML(ex,true)}
      <div class="preview"><div><b>${ex.sets}</b><span>series</span></div><div><b>${ex.lo}${ex.hi!==ex.lo?"–"+ex.hi:""}</b><span>${esTiempo(ex)?"seg":"reps"}</span></div><div><b>${mmss(restOf(ex))}</b><span>descanso</span></div><div><b>${L?f1(L.w):"—"}</b><span>última kg</span></div></div>
      ${pr?`<div class="preview"><div><b>${f1(pr.w)}</b><span>récord kg</span></div><div><b>${pr.r||"—"}</b><span>reps</span></div><div><b>${pr.e1rm?fmt(pr.e1rm):"—"}</b><span>1RM est.</span></div><div><b>${pr.date?pr.date.slice(5).split("-").reverse().join("/"):"—"}</b><span>fecha</span></div></div>`:""}
      <p class="hint">${esc(suggest(ex).why)} Dejá 2 repeticiones en el tanque; si una serie costó, marcá la llama y la app no te sube el peso.</p></div>`;
  } else if(sheet.view==="plus"){const activo=isPlus(),eq=delEquipo(),comoGratis=lsGet("fit_plus_como_gratis")==="1";
    const ben=[["Ayuno con planes","16:8, 18:6, 20:4, OMAD y el ayuno eclesiástico, con tu ventana de comida y aviso cuando se abre."],["Rutinas por objetivo","Elegís objetivo, días y equipo, y la app te arma la rutina con el personaje."],["Comidas por foto","Sacás la foto del plato o de la etiqueta y la app la carga por vos (próximamente)."],["Todo lo de Scaeli Daily","Tu progreso y tus virtudes, los caminos guiados y tu año con Dios. Una sola suscripción para las dos apps."],["Sostenés Scaeli","Un proyecto para acercar a los jóvenes a Dios, sin publicidad."]];
    el.innerHTML=`<h3><span>Scaeli+<small class="muted" style="display:block;font-size:12px;font-weight:400;letter-spacing:0">${activo?"Lo tenés activo":"Para ordenar el cuerpo y sostenerlo"}</small></span>${X}</h3><div class="scroll"><div class="plus-hero"><span class="plus-tag">Scaeli<b>+</b></span><p>La oración y el entrenamiento son gratis siempre. Scaeli+ te ayuda a ver tu camino y a sostenerlo, en Daily y en Fit.</p></div>
      <div class="list">${ben.map(b=>`<div class="benef">${ic("check")}<div><b>${b[0]}</b><small>${b[1]}</small></div></div>`).join("")}</div>
      ${activo?`<p class="hint" style="text-align:center;margin-top:14px">${eq&&!(plus&&plus.source==="store")?"Acceso del equipo activo.":"Gracias por sostener Scaeli."}</p>`:
      `<div class="planes"><div class="plan dest"><span class="ah">Ahorrás 44%</span><b>Anual</b><small>USD 19,99 por año</small></div><div class="plan"><b>Mensual</b><small>USD 2,99 por mes</small></div></div><p class="hint" style="text-align:center">Scaeli+ se activa desde la app de Scaeli Daily o Scaeli Fit para Android o iPhone, y vale para las dos.</p>
      <details class="codigo"><summary class="hint">¿Tenés un código?</summary><div class="r" style="margin-top:8px"><input type="text" id="plusCode" placeholder="CÓDIGO" autocomplete="off" autocapitalize="characters" style="flex:1;text-transform:uppercase;letter-spacing:.1em"><button class="iconbtn acc" id="plusRedeem" style="width:52px;height:52px;flex:none" aria-label="Canjear">${ic("check")}</button></div><p class="hint" id="plusMsg"></p></details>`}
      ${eq?`<button class="lnk" id="plusComoGratis" style="display:block;margin:12px auto 0">${comoGratis?"Volver a ver Scaeli+":"Ver la app como usuario gratis"}</button>`:""}
      <p class="legal">La suscripción se renueva sola al final de cada período, al mismo precio, salvo que la canceles al menos 24 horas antes desde tu cuenta de Google Play o del App Store. El pago se cobra en tu cuenta de la tienda. <a href="terminos.html" target="_blank" rel="noopener">Términos de uso</a> · <a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a></p>
      </div><button class="primary ink" id="x">${activo?"Volver":"Ahora no"}</button>`;
  } else if(sheet.view==="rutinas"){el.innerHTML=shRutinas();const q=$("#rq");if(q){q.oninput=e=>{sheet.q=e.target.value;const cl=$("#catlist");if(cl)cl.innerHTML=catListHTML()}}
    const nm=$("#rutName");if(nm)nm.oninput=e=>{rutDraft.name=e.target.value;const sv=$("#rutSave");if(sv)sv.disabled=!(rutDraft.name.trim()&&rutDraft.ex.length)};
  } else if(sheet.view==="resumen"){const R=sheet.res;const L=levelOf(progress.xp||0);
    el.innerHTML=`<div class="resumen scroll"><span class="eyebrow">${sheet.intention?"Ofrecido por "+esc(sheet.intention):"Entreno terminado"}</span><h2 class="fh" style="margin:0">Bien hecho.</h2>
      ${R.kcal>0?`<p class="kcalest">${ic("flame")}<span><b>≈ ${fmt(R.kcal)} kcal</b> quemadas · estimación según tu peso, el tiempo y la intensidad. Ya están contadas en tu meta de los días de gym: no sumes más comida por esto.</span></p>`:""}
      <div class="preview"><div><b>${R.dur?durTxt(R.dur):"—"}</b><span>duración</span></div><div><b>${R.sets}</b><span>series</span></div><div><b>${fmt(R.vol)}</b><span>kg movidos</span></div><div><b>${R.xp!=null?"+"+R.xp:"—"}</b><span>XP</span></div></div>
      ${R.rangos&&R.rangos.length?`<div class="prbox rangoup">${escudo(rangos().gen,34)}<div><b>¡Subiste de rango!</b><small>${R.rangos.map(esc).join(" · ")}</small></div></div>`:""}
      ${R.prs&&R.prs.length?`<div class="prbox">${ic("badge")}<div><b>${R.prs.length===1?"Récord personal":R.prs.length+" récords personales"}</b><small>${R.prs.map(esc).join(" · ")}</small></div></div>`:""}
      <section class="card tight list">${R.ex.map(e=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(e.name)}${e.pr==="peso"||e.pr==="1RM"?' <span class="prtag">Récord</span>':e.pr==="primero"?' <span class="prtag muted">Primera marca</span>':""}</b><small>${e.sets} ${e.sets===1?"serie":"series"}${e.asist?" · "+(e.w>0?f1(e.w)+" kg de ayuda":"sin ayuda")+" × "+e.r:e.w>0?" · mejor "+f1(e.w)+" kg × "+e.r:" · "+e.r+" reps"}</small></div>${e.vol>0?`<span class="k">${fmt(e.vol)}<small>kg</small></span>`:""}</div>`).join("")}</section>
      ${R.coach&&R.coach.length?`<section class="card pad coachbox"><span class="eyebrow">${ic("info")}Tu coach</span>${R.coach.map(t=>`<p>${esc(t)}</p>`).join("")}</section>`:""}
      <p class="hint" style="text-align:center">Nivel ${L.i+1} · ${esc(L.name)}${L.to?" · "+fmt(L.to-(progress.xp||0))+" XP para "+esc(LEVELS[L.i+1][0]):""}</p>
      <button class="primary" id="x">${ic("check")}Amén</button></div>`;
  } else if(sheet.view==="armar"){const o=sheet.o||(sheet.o={modo:"",obj:"musculo",dias:3,min:45,prios:[]});const ch=(k,v,t)=>`<button data-ar="${k}" data-v="${v}" aria-pressed="${k==="prio"?(v?o.prios.includes(v):!o.prios.length):String(o[k])===String(v)}">${esc(t)}</button>`;
    if(!o.modo)el.innerHTML=`<h3>Armame una rutina${X}</h3><div class="scroll gform"><p class="dialead">Respondé unas preguntas y la app arma el entreno con tu equipo. Sin vueltas.</p>
      <button class="card eqcard" data-ar="modo" data-v="prog"><span class="ic">${ic("edit")}</span><span class="n"><b>Un programa completo</b><small>Para toda la semana, con tus días y tu objetivo.</small></span>${ic("right")}</button>
      <button class="card eqcard" data-ar="modo" data-v="hoy"><span class="ic">${ic("gym")}</span><span class="n"><b>Solo la sesión de hoy</b><small>«Quiero trabajar pecho hoy»: te arma una sesión suelta.</small></span>${ic("right")}</button></div>`;
    else if(sheet.res){const R=sheet.res;el.innerHTML=`<h3>${o.modo==="hoy"?"Tu sesión":"Tu programa"}${X}</h3><div class="scroll gform">${R.why?`<p class="dialead">${esc(R.why)}</p>`:""}
      ${R.rutinas.map(rr=>`<section class="card tight list"><div class="row"><span class="eyebrow">${esc(rr.name)}</span><small class="hint">${rr.day>=0?esc(DOW[rr.day]):"hoy"}</small></div>${rr.ex.map(e=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(e.name)}</b><small>${e.sets} × ${e.lo}${e.hi!==e.lo?"–"+e.hi:""}${e.tiempo?" s":""}</small></div></div>`).join("")}</section>`).join("")}
      <p class="hint">${o.modo==="hoy"?"Se suma a tus rutinas y queda elegida para hoy.":"Reemplaza tus rutinas actuales; tus cargas y récords se conservan."}</p>
      <button class="primary" id="arUsar">${ic("check")}${o.modo==="hoy"?"Entrenar esto hoy":"Usar este programa"}</button><button class="ghost g" data-ar="rehacer" data-v="1" style="justify-content:center">Cambiar respuestas</button></div>`}
    else el.innerHTML=`<h3>${o.modo==="hoy"?"Sesión de hoy":"Programa completo"}${X}</h3><div class="scroll gform">
      ${o.modo==="prog"?`<span class="eyebrow">Objetivo</span><div class="chips">${AR_OBJ.map(([k,t])=>ch("obj",k,t)).join("")}</div>
      <span class="eyebrow">Días por semana</span><div class="chips">${[2,3,4,5,6].map(d=>ch("dias",d,d+" días")).join("")}</div>`:""}
      <span class="eyebrow">Minutos por sesión</span><div class="chips">${[30,45,60,75].map(m=>ch("min",m,m+" min")).join("")}</div>
      <span class="eyebrow">${o.modo==="hoy"?"Qué querés trabajar":"Qué querés priorizar"}</span><small class="hint" style="margin:-6px 0 0">Podés elegir hasta 3${o.prios.length>1?" · el primero lleva más ejercicios":""}.</small><div class="chips">${AR_PRIO.filter(x=>o.modo==="prog"||x[0]).map(([k,t])=>ch("prio",k,t)).join("")}</div>
      ${eqCardHTML(true)}
      <button class="primary" id="arGo">${ic("check")}Armar</button></div>`;
  } else if(sheet.view==="cambiar"){const ex=curRoutine().ex.find(x=>x.id===sheet.exId);if(!ex){closeSheet();return}const eq=sheet.eq||"";
    el.innerHTML=`<h3>Cambiar ejercicio${X}</h3><div class="scroll gform"><p class="dialead" style="font-size:15px">En lugar de <b>${esc(ex.name)}</b>. ${wsets(ex.id).filter(hecha).length?"Las series que ya hiciste quedan guardadas.":""}</p>
      <span class="eyebrow">Con qué contás ahora</span><div class="chips">${CAMB_EQ.map(([k,t])=>`<button data-ceq="${k}" aria-pressed="${eq===k}">${esc(t)}</button>`).join("")}</div>
      <input type="search" id="cq" placeholder="Buscar otro ejercicio…" value="${esc(sheet.q||"")}" autocomplete="off">
      <div id="clist">${cambListHTML()}</div>
      <button class="eqit" id="cSiempre" aria-pressed="${!!sheet.siempre}"><span class="ck">${ic("check")}</span><span class="n"><b>Usarlo siempre en esta rutina</b><small>Si no, el cambio vale solo para hoy.</small></span></button></div>`;
    $("#cq").oninput=e=>{sheet.q=e.target.value;const cl=$("#clist");if(cl)cl.innerHTML=cambListHTML()};
  } else if(sheet.view==="exlist"){const r=curRoutine();
    el.innerHTML=`<h3>Ejercicios${X}</h3><div class="scroll"><section class="card tight list">${(r?r.ex:[]).map((x,i)=>{const n=wsets(x.id).filter(hecha).length;return `<button class="row hrow" data-exir="${i}"><div class="n"><b>${i+1}. ${esc(x.name)}</b><small>${n} de ${nSerOf(x)} series${n>=nSerOf(x)?" · listo":""}</small></div>${n>=nSerOf(x)?ic("check"):ic("right")}</button>`}).join("")}</section>
      <button class="ghost g" id="addToRoutine" style="justify-content:center;width:100%;margin-top:12px">${ic("plus")}Agregar ejercicio</button></div>`;
  } else if(sheet.view==="descartar"){
    el.innerHTML=`<h3>Descartar entreno${X}</h3><p class="dialead">Se borran las series que cargaste hoy en «${esc(sheet.name||"")}». No suma experiencia ni récords.</p><button class="primary danger" id="wDiscard">${ic("trash")}Descartar</button><button class="primary ink" id="x">Seguir entrenando</button>`;
  } else if(sheet.view==="hist"){const H=wHist;
    el.innerHTML=`<h3>Entrenamientos${X}</h3><div class="scroll">${H.length?`<section class="card tight list">${H.map(histRow).join("")}</section>`:`<section class="card vacio-card"><span class="ic">${ic("gym")}</span><b>Todavía no terminaste ningún entreno</b><p class="hint">Cuando toques Terminar, cada entreno queda acá con su resumen.</p></section>`}</div>`;
  } else if(sheet.view==="histver"){const w=wHist.find(x=>x.id===sheet.id);if(!w){closeSheet();return}const R=w.summary;
    el.innerHTML=`<h3>${esc(fecha(w.id))}${X}</h3><div class="scroll resumen" style="gap:12px"><span class="eyebrow">${esc(R.name||"Entreno")}${R.intention?" · por "+esc(R.intention):""}</span>
      <div class="preview"><div><b>${R.dur?durTxt(R.dur):"—"}</b><span>duración</span></div><div><b>${R.sets||0}</b><span>series</span></div><div><b>${fmt(R.vol||0)}</b><span>kg movidos</span></div><div><b>${R.xp!=null?"+"+R.xp:"—"}</b><span>XP</span></div></div>
      ${R.prs&&R.prs.length?`<div class="prbox">${ic("badge")}<div><b>${R.prs.length===1?"Récord personal":R.prs.length+" récords personales"}</b><small>${R.prs.map(esc).join(" · ")}</small></div></div>`:""}
      <section class="card tight list">${(R.ex||[]).map(e=>`<div class="row"><div class="n"><b style="font-weight:500">${esc(e.name)}</b><small>${e.sets} ${e.sets===1?"serie":"series"}${e.asist?" · "+(e.w>0?f1(e.w)+" kg de ayuda":"sin ayuda")+" × "+e.r:e.w>0?" · mejor "+f1(e.w)+" kg × "+e.r:" · "+e.r+" reps"}</small></div>${e.vol>0?`<span class="k">${fmt(e.vol)}<small>kg</small></span>`:""}</div>`).join("")}</section>
      ${R.coach&&R.coach.length?`<section class="card pad coachbox"><span class="eyebrow">${ic("info")}Tu coach</span>${R.coach.map(t=>`<p>${esc(t)}</p>`).join("")}</section>`:""}
      <button class="ghost g gsalir" id="histDel" data-hid="${w.id}">${sheet.confirm==="del"?"Tocá de nuevo para borrar":"Borrar este entreno"}</button></div>`;
  } else if(sheet.view==="grupo"){el.innerHTML=grupoSheetHTML(X);
  } else if(sheet.view==="equipo"){const sel=sheet.sel||(sheet.sel=new Set(equipo||[]));
    el.innerHTML=`<h3>Mi equipo${X}</h3><div class="scroll" style="display:flex;flex-direction:column;gap:12px"><p class="dialead">Marcá lo que tenés. La app te muestra los ejercicios que podés hacer y arma los programas de casa con eso.</p>
      <div class="eqlist">${EQUIPOS.map(([k,n,d])=>`<button class="eqit" data-eq="${k}" aria-pressed="${sel.has(k)}"><span class="ck">${ic("check")}</span><span class="n"><b>${esc(n)}</b>${d?`<small>${esc(d)}</small>`:""}</span></button>`).join("")}</div>
      <p class="hint">Si no marcás nada, quedan los ejercicios con el peso del cuerpo.</p>
      <button class="primary" id="eqSave">${ic("check")}Guardar</button></div>`;
  } else if(sheet.view==="dia"){const k=sheet.k,D=DIA[k];const tg=((targets&&targets[dayType()])||DEFAULT_TARGETS[dayType()]);
    if(k==="prot"){const tp=totals(entries()).p;el.innerHTML=`<h3>${D.n}${X}</h3><p class="dialead">${esc(D.why)}</p><div class="preview"><div><b>${fmt(tp)}</b><span>llevás (g)</span></div><div><b>${fmt(tg.p)}</b><span>meta (g)</span></div><div><b>${fmt(Math.max(0,tg.p-tp))}</b><span>faltan</span></div></div><button class="primary ink" id="x">Entendido</button>`}
    else if(D.tick){const on=!!checks().crea;el.innerHTML=`<h3>${D.n}${X}</h3><p class="dialead">${esc(D.why)}</p><button class="primary${on?" ink":""}" data-check="crea">${ic("check")}${on?"Desmarcar":"La tomé"}</button>`}
    else{const v=diaVal(k);const cur=sheet.v!=null?sheet.v:(v!=null?v:0);
      el.innerHTML=`<h3>${D.n}${X}</h3><p class="dialead">${esc(D.why)}</p><span class="eyebrow">${esc(D.q)}</span>
      <div class="stepper"><button class="iconbtn" data-dstep="-1" aria-label="Menos">${ic("minus")}</button><label class="sv"><input type="number" id="diaV" inputmode="decimal" step="any" value="${cur||""}" placeholder="0"><span>${D.u}</span></label><button class="iconbtn" data-dstep="1" aria-label="Más">${ic("plus")}</button></div>
      <p class="hint" style="text-align:center;margin:0">Meta: ${nfmt(D.meta,D.u)} ${D.u}</p>
      <button class="primary" id="diaSave">${ic("check")}Guardar</button>`;
      $("#diaV").oninput=e=>{sheet.v=parseFloat(String(e.target.value).replace(",","."))||0}}
  } else if(sheet.view==="fastdone"){const R=sheet.rec;const L=levelOf(progress.xp||0);const fr=FAST_FRASES[fasts.length%FAST_FRASES.length];
    el.innerHTML=`<div class="resumen scroll"><span class="eyebrow">Ayuno cumplido</span><h2 class="fh" style="margin:0">Bien hecho.</h2>
      <div class="preview"><div><b>${hms(R.ms).slice(0,-3)}</b><span>horas</span></div><div><b>${esc(R.plan)}</b><span>plan</span></div><div><b>${sheet.xp?"+"+sheet.xp:"—"}</b><span>XP</span></div><div><b>${fasts.filter(f=>f.done).length}</b><span>cumplidos</span></div></div>
      ${(()=>{const m=fr.match(/^(.*»)\s*\((.*)\)$/);return `<p class="rmed" style="text-align:center;margin:4px 0">${esc(m?m[1]:fr)}</p>${m?`<p class="rcita" style="text-align:center;margin:0">${esc(m[2])}</p>`:""}`})()}
      <p class="hint" style="text-align:center">Comé con calma y sin apuro. Nivel ${L.i+1} · ${esc(L.name)}.</p>
      <button class="primary" id="x">${ic("check")}Amén</button></div>`;
  } else if(sheet.view==="fastedit"){const d=new Date(fast&&fast.start||Date.now());const v=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
    el.innerHTML=`<h3>¿Cuándo empezaste?${X}</h3><p class="hint">Si terminaste de comer anoche y recién lo anotás, poné esa hora: el anillo se recalcula.</p><label class="f" for="fastWhen">Última comida<input class="inset" type="datetime-local" id="fastWhen" value="${v}" max="${(()=>{const n=new Date();return n.getFullYear()+"-"+pad(n.getMonth()+1)+"-"+pad(n.getDate())+"T"+pad(n.getHours())+":"+pad(n.getMinutes())})()}"></label><button class="primary" id="fastSave">${ic("check")}Guardar</button>`;
  } else if(sheet.view==="levelup"){
    el.innerHTML=`<div style="display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;padding:12px 0 6px"><span class="eyebrow">Subiste de nivel</span><span class="bignum" style="font-size:64px">${esc(sheet.name)}</span><span class="av" style="width:112px;height:112px;background:var(--paper);border-radius:24px;display:grid;place-items:center">${personajeHTML("",96)}</span><p class="hint" style="max-width:30ch">No para mirarte vos: para servir mejor. Seguí.</p><button class="primary" id="x" style="max-width:240px">${ic("check")}Amén</button></div>`;
  } else if(sheet.view==="char"){const L=levelOf(progress.xp||0);const st=streakOf(progress.days||[],today());const c=progress.counts||{};
    el.innerHTML=`<h3>Personaje${X}</h3><div class="scroll" style="display:flex;flex-direction:column;gap:14px">
      <div class="hero-char" style="border:0;background:var(--inset)"><span class="av" style="width:80px;height:80px">${personajeHTML("",72)}</span><span class="n"><span class="lvl">Nivel ${L.i+1} · ${esc(L.name)}</span><b style="font-size:28px;font-weight:300">${fmt(progress.xp||0)} <small style="font-size:13px;font-weight:400;color:var(--muted)">XP</small></b><span class="xp"><i style="width:${L.pct}%"></i></span><small>${L.to?fmt(L.to-(progress.xp||0))+" XP para "+esc(LEVELS[L.i+1][0]):"Nivel máximo"}</small></span></div>
      <div class="grid4">${[["Racha",st.n],["Mejor",progress.best||0],["Entrenos",c.workouts||0],["Rosarios",c.rosaries||0]].map(([n,v])=>`<div class="stat"><span class="eyebrow">${n}</span><span class="v">${v}</span></div>`).join("")}</div>
      <span class="sect">Insignias</span>
      <div class="badges">${BADGES.map(([id,name,icon])=>`<div class="badge${progress.badges&&progress.badges[id]?" on":""}"><span class="ic">${ic(icon)}</span>${esc(name)}</div>`).join("")}</div>
      <span class="sect">Cómo se gana</span>
      <p class="hint">Lo que más suma es entrenar: entreno terminado ${XP.workout} XP (+${XP.offered} si lo ofreciste). Rosario completo ${XP.rosary} · ayuno cumplido ${XP.fast} · tres comidas cargadas en el día ${XP.meals} · pesaje ${XP.body}. Los niveles: ${LEVELS.map(l=>l[0]+" "+l[1]).join(" · ")}.</p></div>`;
  }
}


/* ---------- Rutinas: las mías, la biblioteca y armar una propia con el catálogo ---------- */
function exTxt(e){return e.sets+" × "+e.lo+(e.hi!==e.lo?"–"+e.hi:"")+(esTiempo(e)?" s":"")+" · "+mmss(restOf(e))}
function catListHTML(){const tab=sheet.tab||"mias";const q=norm(sheet.q||"");const g=sheet.g||"";const attr=tab==="cat"?"data-cadd":"data-radd";
  const list=CATALOGO.filter(c=>(!g||c.grupo===g)&&(!q||q.split(/\s+/).every(w=>norm(c.nombre).includes(w))));
  const item=(c,dim)=>`<button class="food${dim?" dim":""}" ${attr}="${c.id}" ${tab==="cat"&&sheet.catSel===c.id?'aria-pressed="true"':""}>${ILUS.has(c.id)?iluHTML(c.id,"mini"):`<span class="mini"></span>`}<span><b>${esc(c.nombre)}</b><small>${esc(GRUPOS.find(x=>x[0]===c.grupo)[1])} · ${esc(c.equipo.replace("-"," "))}${dim?" · necesita "+esc(reqDe(c).filter(k=>k==="gym"?!(equipo&&equipo.includes("gym")):!tieneEq(k)).map(k=>k==="gym"?"gimnasio":(EQUIPOS.find(e=>e[0]===k)||[,k])[1].toLowerCase()).join(", ")):""}</small></span>${ic("plus")}</button>`;
  if(!list.length)return `<p class="empty">No hay coincidencias.</p>`;
  if(!equipo)return list.map(c=>item(c)).join("");
  const si=list.filter(puedo),no=list.filter(c=>!puedo(c));
  return si.map(c=>item(c)).join("")+(no.length?`<p class="sect" style="margin:14px 0 4px">Con otro equipo</p>`+no.map(c=>item(c,true)).join(""):"")}
const armarCardHTML=()=>`<button class="card eqcard armar" data-armar="1"><span class="ic">${ic("plus")}</span><span class="n"><b>Armame una rutina</b><small>Contestás 4 preguntas y la app arma tu programa, o solo la sesión de hoy.</small></span>${ic("right")}</button>`;
function eqCardHTML(compacto){return `<button class="card eqcard" data-eqopen="1"><span class="ic">${ic("gym")}</span><span class="n"><b>Mi equipo</b><small>${esc(eqTxt())}</small></span><span class="lnk">${equipo?"Editar":"Configurar"}</span></button>`}
const histRow=w=>{const R=w.summary||{};return `<button class="row hrow" data-hver="${w.id}"><div class="n"><b>${esc(fecha(w.id))}</b><small>${esc(R.name||"Entreno")} · ${R.dur?durTxt(R.dur):"—"} · ${R.sets||0} series${R.prs&&R.prs.length?" · "+R.prs.length+" récord"+(R.prs.length>1?"s":""):""}</small></div>${ic("right")}</button>`};
function cambListHTML(){const ex=curRoutine().ex.find(x=>x.id===sheet.exId);if(!ex)return "";const L=alternativas(ex,sheet.eq||"",sheet.q||"");const top=sheet.q?L.slice(0,30):L.slice(0,6);
  if(!top.length)return `<p class="empty">${sheet.q?"No hay coincidencias.":"No hay alternativas con ese equipo. Probá otro o buscá por nombre."}</p>`;
  return `${sheet.q?"":`<span class="eyebrow">Recomendados</span>`}<div class="list">${top.map(c=>`<button class="food" data-cpick="${c.id}">${ILUS.has(c.id)?iluHTML(c.id,"mini"):`<span class="mini"></span>`}<span><b>${esc(c.nombre)}</b><small>${esc(c.equipo.replace("-"," "))}${(muscDe(c.id)&&Object.keys(muscDe(c.id))[0])?" · "+esc(MUSC[Object.keys(muscDe(c.id))[0]][0].toLowerCase()):""}</small></span>${ic("right")}</button>`).join("")}</div>`}
function shRutinas(){const tab=sheet.tab||"mias";const target=sheet.target?routines.find(x=>x.id===sheet.target):null;
  const tabs=`<div class="seg" style="margin-bottom:12px"><button data-rtab="mias" aria-pressed="${tab==="mias"}">Mías</button><button data-rtab="bib" aria-pressed="${tab==="bib"}">Programas</button><button data-rtab="cat" aria-pressed="${tab==="cat"||tab==="pick"}">${tab==="pick"?"Agregar":"Catálogo"}</button><button data-rtab="nueva" aria-pressed="${tab==="nueva"}">Nueva</button></div>`;
  let body="";
  if(tab==="mias"){const cr=curRoutine();
    body=`${armarCardHTML()}<section class="card tight list">${routines.map(x=>`<div class="row" style="flex-direction:column;align-items:stretch;gap:0"><div class="row" style="padding:4px 0 6px"><button class="food" data-ruse="${x.id}" style="border:0;padding:0;flex:1"><b style="${cr&&cr.id===x.id?"color:var(--accent)":""}">${esc(x.name)}</b><small>${x.day>=0&&x.day!=null?DOWS[x.day]:"sin día"} · ${esc(x.goal||"")} · ${x.ex.length} ejercicios</small></button><div class="acts"><button class="sm" data-addex="${x.id}" aria-label="Agregar ejercicio">${ic("plus")}</button><button class="sm" data-rdelr="${x.id}" aria-label="Borrar rutina">${sheet.confirm==="r:"+x.id?ic("check"):ic("trash")}</button></div></div>
      ${x.ex.map(e=>`<div class="exrow"><div class="n"><b>${esc(e.name)}</b><small>${exTxt(e)}</small></div><button class="sm" data-edex="${x.id}/${e.id}" aria-label="Editar">${ic("edit")}</button><button class="sm" data-delex="${x.id}/${e.id}" aria-label="Quitar">${sheet.confirm==="e:"+x.id+"/"+e.id?ic("check"):ic("x")}</button></div>`).join("")}</div>`).join("")||`<p class="empty">No tenés rutinas. Elegí un programa de la biblioteca o armá una nueva.</p>`}</section>
      <p class="hint">Tocá el nombre para entrenarla hoy. El día asignado es el que aparece solo al abrir Entreno.</p><button class="ghost g" id="resetR">${ic("copy")}Restaurar las rutinas base</button>`}
  else if(tab==="bib"){const pr=routines.find(r=>r.prog&&r.prog!=="armada");const upd=pr&&equipo&&pr.eq!==equipo.slice().sort().join(",")?todosProgramas().find(x=>x.id===pr.prog):null;
    body=`${armarCardHTML()}${eqCardHTML(true)}${upd?`<div class="card pad prbox upd">${ic("gym")}<div style="flex:1"><b>Tu equipo cambió</b><small>Actualizá «${esc(upd.nombre)}» para usar lo nuevo. Tus cargas se conservan.</small></div><button class="chip" data-puse="${upd.id}">${sheet.confirm==="p:"+upd.id?"Confirmar":"Actualizar"}</button></div>`:""}<p class="hint">Un programa reemplaza tus rutinas actuales (las cargas registradas se conservan). Los de casa se arman con tu equipo.</p><div class="progs">${todosProgramas().map(p=>`<div class="card prog"><div class="n"><b>${esc(p.nombre)}</b><small>${esc(p.desc)}</small><span class="ptags"><span class="chip muted sm">${p.nivel}</span><span class="chip ${p.casa?"":"muted "}sm">${p.lugar}</span><span class="chip muted sm">${p.rutinas.length} días</span></span></div>
      <details><summary class="hint">Ver ejercicios</summary>${p.rutinas.map(x=>`<p class="hint" style="margin:6px 0 0"><b style="color:var(--ink);font-weight:600">${esc(x.name)}</b> · ${x.ex.map(e=>esc(e.name)).join(", ")}</p>`).join("")}</details>
      <button class="primary ink" data-puse="${p.id}">${sheet.confirm==="p:"+p.id?ic("check")+"Confirmar":ic("check")+"Usar"}</button></div>`).join("")}</div>`}
  else{const d=rutDraft;const g=sheet.g||"";
    const sel=tab==="cat"&&sheet.catSel?CATALOGO.find(c=>c.id===sheet.catSel):null;
    const head=tab==="pick"?`<p class="hint">Agregás a <b style="color:var(--ink)">${esc(target?target.name:"")}</b>. Tocá un ejercicio y queda guardado.</p>`:
      tab==="cat"?(sel?`<section class="card pad catsel"><div class="cs-hd">${ILUS.has(sel.id)?iluHTML(sel.id,"mini"):""}<div class="n"><b>${esc(sel.nombre)}</b><small class="hint">¿A qué rutina lo agregás?</small></div><button class="iconbtn ghost" data-cadd="" aria-label="Cancelar">${ic("x")}</button></div><div class="chips" style="margin-top:10px">${routines.map(x=>`<button data-cto="${x.id}" ${x.ex.some(e=>e.id===sel.id)?'aria-pressed="true"':""}>${esc(x.name)}</button>`).join("")}</div></section>`:`${eqCardHTML(true)}<p class="hint">Todos los ejercicios, ${CATALOGO.length}. Tocá uno para agregarlo a una rutina tuya; arriba, los que podés hacer con tu equipo.</p>`):
      `<label class="f" for="rutName">Nombre<input class="inset" type="text" id="rutName" value="${esc(d.name)}" placeholder="Pecho y brazos" autocomplete="off"></label>
      <span class="eyebrow">Día</span><div class="chips">${[[-1,"Libre"],[1,"Lun"],[2,"Mar"],[3,"Mié"],[4,"Jue"],[5,"Vie"],[6,"Sáb"],[0,"Dom"]].map(([v,l])=>`<button data-rday="${v}" aria-pressed="${d.day===v}">${l}</button>`).join("")}</div>
      <section class="card tight list"><div class="row"><span class="eyebrow">Ejercicios (${d.ex.length})</span></div>${d.ex.map((e,k)=>`<div class="exrow"><div class="n"><b>${esc(e.name)}</b><small>${exTxt(e)}</small></div><button class="sm" data-rrm="${k}" aria-label="Quitar">${ic("x")}</button></div>`).join("")||`<p class="empty">Elegí abajo los ejercicios. Después podés ajustar series y descanso con el lápiz.</p>`}</section>
      <button class="primary" id="rutSave" ${d.name.trim()&&d.ex.length?"":"disabled"}>${ic("check")}Guardar rutina</button>`;
    body=head+`<span class="eyebrow">Catálogo</span><input type="search" id="rq" placeholder="Buscar ejercicio…" value="${esc(sheet.q||"")}" autocomplete="off">
      <div class="chips"><button data-rg="" aria-pressed="${!g}">Todos</button>${GRUPOS.map(([k,n])=>`<button data-rg="${k}" aria-pressed="${g===k}">${n}</button>`).join("")}</div>
      <div class="list" id="catlist">${catListHTML()}</div>`}
  return `<h3>Rutinas${X}</h3>${tabs}<div class="scroll" style="display:flex;flex-direction:column;gap:12px">${body}</div>`}

/* ---------- Escuchar: música y rosario ---------- */
let trackIdx=0,playing=false,listenTab="musica",rosaryStep=0,listenConfirm=null;
const player=$("#player");
player.addEventListener("ended",()=>{if(tracks.length>1){playTrack((trackIdx+1)%tracks.length)}else{playing=false;refreshPlayerUI()}});
player.addEventListener("pause",()=>{playing=false;refreshPlayerUI()});player.addEventListener("play",()=>{playing=true;refreshPlayerUI()});
player.addEventListener("timeupdate",()=>{const p=$("#pbar");if(p&&player.duration)p.style.width=(player.currentTime/player.duration*100)+"%"});
function trackSrc(t){return t.url||""}
function playTrack(i){if(!tracks.length)return;trackIdx=i;player.src=trackSrc(tracks[i]);player.play().catch(()=>toast("No se pudo reproducir esta pista"))}
function togglePlay(){if(!tracks.length)return;if(!player.src)return playTrack(trackIdx);if(player.paused)player.play().catch(()=>{});else player.pause()}
function refreshPlayerUI(){if((view==="entreno"||view==="escuchar")&&!typing())renderNow()}
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
/* ── Santo Rosario, a pantalla completa, idéntico al de Daily (el avance se guarda en daily_settings/rosario, compartido) ── */
let rosario=null;
const ilu=k=>"assets/ilus/daily_"+k+".png";
const oraTxt=n=>{const o=ORACIONES.find(x=>x.n===n);return o?o.es.join("\n"):""};
const misteriosHoy=(d)=>{const w=(d||new Date()).getDay();for(const k in MISTERIOS)if(MISTERIOS[k].d.includes(w))return k;return "gozosos"};
const intHTML=()=>intents.length?'<p class="hint">Por: '+intents.map(esc).join(" · ")+'</p>':'';
const ORD_M=["1.er","2.º","3.er","4.º","5.º"],ADJ={gozosos:"gozoso",luminosos:"luminoso",dolorosos:"doloroso",gloriosos:"glorioso"};
const diasMist=k=>MISTERIOS[k].d.map(w=>ROS_DIAS_N[w]).join(" y ");
function rosNuevo(set){return{set:set||misteriosHoy(),mis:0,fase:"intro",c:0,f:today()}}
async function rosGuardar(r){rosario=r;if(sheet)renderSheetNow();if(view==="entreno"&&rosMini&&!rosMiniRefresh()&&!typing())renderNow();await backend.setDoc("daily_settings/rosario",r)}
function rosIntro(act){const hk=misteriosHoy(),sel=sheet.rset||(act&&act.fase==="intro"&&MISTERIOS[act.set]?act.set:hk);const n=(progress.done||{})["rosary:"+today()]?1:0;
  return '<div class="ftop"><button class="iconbtn ghost g" id="x" aria-label="Salir">'+ic("x")+'</button><span style="flex:1"></span><span class="ft">'+(n?"Hoy ya rezaste el Rosario":"Santo Rosario")+'</span></div>'+
   '<div class="scroll fcuerpo rosin"><div class="fla">Santo Rosario</div><h2 class="fh">¿Qué misterios querés rezar?</h2><p class="fhint">Los de hoy, '+ROS_DIAS_N[new Date().getDay()]+', son los '+esc(MISTERIOS[hk].n.replace("Misterios ","").toLowerCase())+'. Podés rezarlo entre series, con la música de fondo.</p>'+
   '<div class="mgrid">'+Object.keys(MISTERIOS).map(k=>'<button class="mcard'+(k===sel?" on":"")+'" data-roselegir="'+k+'" aria-pressed="'+(k===sel)+'"><img src="'+ilu(k)+'" alt="" loading="lazy"><span class="g"></span><span class="c"><b>'+esc(MISTERIOS[k].n.replace("Misterios ",""))+'</b><small>'+(k===hk?"Los de hoy":esc(diasMist(k)))+'</small></span>'+(k===sel?'<span class="ok">'+ic("check")+'</span>':'')+'</button>').join("")+'</div>'+
   '<ol class="mlist">'+MISTERIOS[sel].m.map(m=>'<li>'+esc(m[0])+'</li>').join("")+'</ol>'+
   '<details class="rprep"><summary>Para empezar: la señal de la cruz y el acto de contrición</summary><p>'+esc(oraTxt("Señal de la cruz"))+'</p><p>'+esc(oraTxt("Acto de contrición"))+'</p></details>'+intHTML()+'</div>'+
   '<div class="fpie"><span></span><button class="primary" data-rosempezar="'+sel+'">Empezar</button></div>'}
function rosAnillo(n,hechos,actual,padre,centro,sub){const R=104,c=130,pos=k=>{const ang=(n===10?-60+k*30:[-30,90,210][k])*Math.PI/180;return[c+R*Math.cos(ang),c+R*Math.sin(ang)]};
  let s='<svg class="anillo" viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="'+R+'" class="hilo"/>';
  for(let k=0;k<n;k++){const[x,y]=pos(k),st=k<hechos?"ya":k===actual?"on":"";s+=(st==="on"?'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="17" class="halo"/>':'')+'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(st==="on"?10:8)+'" class="cu '+st+'"/>'}
  s+='<rect x="119" y="'+(c-R-11)+'" width="22" height="22" rx="6" class="cu p '+padre+'"/>'+(padre==="on"?'<rect x="111" y="'+(c-R-19)+'" width="38" height="38" rx="12" class="halo"/>':'');
  return s+'</svg><div class="acentro'+(centro?"":" solo")+'"><b>'+centro+'</b><span>'+sub+'</span></div>'}
function shRosario(){const act=rosario&&rosario.f===today()?rosario:null,r=act&&act.fase!=="fin"&&act.fase!=="intro"?act:null;if(!r)return rosIntro(act);
  const M=MISTERIOS[r.set],i=r.mis,mis=M.m[i],med=(ROS_MED[r.set]||[])[i],solo=!!(dprofile&&dprofile.rosSolo),fin=r.fase==="salve"||r.fase==="papa",ini=r.fase==="credo"||r.fase==="ini";
  const etiqueta=fin?"Para terminar":ORD_M[i]+" misterio "+(ADJ[r.set]||"");
  const top='<div class="ftop"><button class="iconbtn ghost g" id="x" aria-label="Salir">'+ic("x")+'</button><div class="fprog">'+[0,1,2,3,4].map(k=>'<i class="'+(k<i||fin?"ya":k===i?"on":"")+'"></i>').join("")+'</div><span class="ft">'+(fin?"Para terminar":ini?"Para empezar":"Misterio "+(i+1)+" de 5")+'</span></div>';
  const pie=(der)=>'<div class="fpie"><button class="lnk" data-rosatras="1">'+ic("left")+' Atrás</button>'+der+'</div>';
  if(r.fase==="anuncio")return top+'<div class="scroll fcuerpo ros2"><div class="rmis"><img src="'+ilu(r.set)+'" alt=""><span class="g"></span><div class="tx"><div class="fla">'+esc(etiqueta)+'</div><h2 class="fh">'+esc(mis[0])+'</h2></div></div>'+
     (med?'<p class="rmed">«'+esc(med[0].replace(/^«|»$/g,""))+'»</p><p class="rcita">'+esc(med[1])+'</p><p class="rfruto"><span>Fruto</span>'+esc(med[2])+'</p>':'<p class="rcita">'+esc(mis[1])+'</p>')+'<p class="fhint">Contemplá la escena un momento, en silencio, antes de empezar.</p></div>'+
     pie('<button class="primary" data-rosav="1">Comenzar la decena</button>');
  if(r.fase==="credo")return top.replace(/Misterio 1 de 5|Para terminar/,"Para empezar")+'<div class="scroll fcuerpo ros2"><div class="fla">Para empezar</div><h2 class="fh">Creo en Dios</h2><p class="rora">'+esc(oraTxt("Credo de los Apóstoles"))+'</p></div>'+pie('<button class="primary" data-rosav="1">Amén</button>');
  if(r.fase==="salve")return top+'<div class="scroll fcuerpo ros2"><div class="fla">Para terminar</div><h2 class="fh">Dios te salve, Reina y Madre</h2><p class="rora">'+esc(oraTxt("Salve"))+'</p></div>'+pie('<button class="primary" data-rosav="1">Amén</button>');
  let ora,anillo;
  if(r.fase==="papa"||r.fase==="ini"){const c=r.c;ora=c===0?"Padrenuestro":c<=3?"Avemaría":"Gloria";anillo=rosAnillo(3,c===0?0:Math.min(3,c-1+(c>3?1:0)),c>=1&&c<=3?c-1:-1,c===0?"on":"ya",c>=1&&c<=3?String(c):"",c>=1&&c<=3?"de 3 · Avemaría":ora)}
  else{ora=r.fase==="padre"?"Padrenuestro":r.fase==="ave"?"Avemaría":"Gloria";
    anillo=rosAnillo(10,r.fase==="ave"?r.c-1:r.fase==="gloria"?10:0,r.fase==="ave"?r.c-1:-1,r.fase==="padre"?"on":"ya",r.fase==="ave"?String(r.c):"",r.fase==="ave"?"de 10 · Avemaría":ora)}
  const texto=solo?'':'<p class="rora">'+esc(oraTxt(ora))+'</p>'+(ora==="Gloria"&&r.fase==="gloria"?'<p class="rora jac">'+esc(ROS_FATIMA)+'</p>':'');
  return top+'<div class="scroll fcuerpo ros2"><div class="rcab">'+(r.fase==="papa"?'Por el Papa y la Iglesia':r.fase==="ini"?'Por la fe, la esperanza y la caridad':esc(mis[0]))+'</div>'+
    '<button class="rtap'+(solo?" solo":"")+'" data-rosav="1" aria-label="Pasar la cuenta">'+anillo+'</button><p class="rhint">Tocá el rosario para pasar la cuenta</p>'+texto+
    '<button class="lnk solo-t" data-rossolo="1">'+(solo?"Mostrar las oraciones":"Solo el contador")+'</button></div>'+
    pie('<button class="lnk" id="x">Seguir después</button>')}
async function rosAvanzar(){let r={...(rosario||rosNuevo())};if(r.f!==today())r=rosNuevo(r.set);
  if(r.fase==="intro"){r.fase="credo";r.c=0}
  else if(r.fase==="credo"){if(dprofile&&dprofile.rosCorto){r.fase="anuncio";r.mis=0}else{r.fase="ini";r.c=0}}
  else if(r.fase==="ini"){if(r.c<4)r.c++;else{r.fase="anuncio";r.mis=0;r.c=0}}
  else if(r.fase==="anuncio"){r.fase="padre";r.c=0}
  else if(r.fase==="padre"){r.fase="ave";r.c=1}
  else if(r.fase==="ave"){if(r.c<10)r.c++;else r.fase="gloria"}
  else if(r.fase==="gloria"){if(r.mis<4){r.mis++;r.fase="anuncio";r.c=0}else{r.fase="salve"}}
  else if(r.fase==="salve"){r.fase="papa";r.c=0}
  else if(r.fase==="papa"){if(r.c<4)r.c++;else{r.fase="fin";toast("Rezaste el Santo Rosario");award("rosary",today());rosarioADaily()}}
  await rosGuardar(r);if(r.fase==="fin"&&sheet&&sheet.view==="rosario")closeSheet()}
async function rosAtras(){let r={...rosario};if(r.fase==="papa"){if(r.c>0)r.c--;else r.fase="salve"}else if(r.fase==="salve"){r.fase="gloria";r.mis=4}else if(r.fase==="ave"){if(r.c>1)r.c--;else r.fase="padre"}else if(r.fase==="gloria"){r.fase="ave";r.c=10}else if(r.fase==="padre"){r.fase="anuncio"}else if(r.fase==="anuncio"&&r.mis>0){r.mis--;r.fase="gloria"}else if(r.fase==="anuncio"){if(dprofile&&dprofile.rosCorto)r.fase="credo";else{r.fase="ini";r.c=4}}else if(r.fase==="ini"){if(r.c>0)r.c--;else r.fase="credo"}else if(r.fase==="credo"){r.fase="intro";if(sheet)sheet.rset=r.set}await rosGuardar(r)}
/* el Rosario terminado en Fit cuenta en Scaeli Daily: mismo registro que usa Daily (daily_days/{fecha}: r, rn, t) */
const leerUna=p=>new Promise(res=>{let u=null,listo=false;u=backend.watchDoc(p,v=>{if(listo)return;listo=true;res(v);setTimeout(()=>{try{u&&u()}catch(e){}},0)});setTimeout(()=>{if(!listo){listo=true;res(null);try{u&&u()}catch(e){}}},5000)});
async function rosarioADaily(){try{const k="daily_days/"+today();const d=(await leerUna(k))||{};const n=(d.rn||(d.r?1:0))+1;await backend.setDoc(k,{...d,r:1,rn:n,t:Date.now()})}catch(e){}}

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
/* Escuchar es una pestaña (no un panel): música propia y el Rosario, sin animaciones que molesten en el gym. */
function renderListen(){const t=tracks[trackIdx];const canUp=!!backend;const hk=misteriosHoy();
  return `<div class="top"><div class="l"><span class="eyebrow">Música y Rosario</span><h1 class="title">Escuchar</h1></div></div>
    ${!t?`<section class="card vacio-card"><span class="ic">${ic("music")}</span><b>Agregá tu primera pista</b><p class="hint">Tu música para entrenar, guardada en tu cuenta. Subí un archivo o pegá un enlace acá abajo.</p></section>`:`<section class="card" style="display:flex;flex-direction:column;gap:14px"><div class="top"><div class="l"><span class="eyebrow">${playing?"Sonando":"En pausa"}</span><b style="font-size:22px;font-weight:500;line-height:1.1">${t?esc(t.name):"Tu música"}</b><small class="hint">${t?"Pista "+(trackIdx+1)+" de "+tracks.length:"Todavía no agregaste ninguna pista."}</small></div><span class="iconbtn inset" style="border-radius:12px;color:var(--accent)" aria-hidden="true">${ic("music")}</span></div>
      <div class="bar" style="height:4px"><i id="pbar" style="width:${player.duration?player.currentTime/player.duration*100:0}%"></i></div>
      <div style="display:flex;justify-content:center;gap:18px;align-items:center"><button class="iconbtn" data-tprev="1" aria-label="Anterior" ${tracks.length?"":"disabled"}>${ic("prev")}</button><button class="iconbtn acc" data-pp="1" style="width:60px;height:60px" aria-label="${playing?"Pausar":"Reproducir"}" ${tracks.length?"":"disabled"}>${ic(playing?"pause":"play")}</button><button class="iconbtn" data-tnext="1" aria-label="Siguiente" ${tracks.length?"":"disabled"}>${ic("next")}</button></div></section>`}
    ${tracks.length?`<section class="card tight list">${tracks.map((x,i)=>`<div class="row"><button class="food" data-tsel="${i}" style="border:0;padding:0;flex:1"><b style="${i===trackIdx?"color:var(--accent);font-weight:600":""}">${esc(x.name)}</b></button><button class="sm" data-tdel="${x.id}" aria-label="Borrar pista">${listenConfirm===x.id?ic("check"):ic("trash")}</button></div>`).join("")}</section>`:""}
    <section class="card pad agregar"><span class="eyebrow">Agregar pista</span>
      ${canUp?`<label class="ghost g" for="tfile">${ic("upload")}Subir archivo<input id="tfile" type="file" accept="audio/*,video/mp4,.m4a,.mp3,.wav,.ogg" hidden></label><p class="hint">Un .mp3 o .m4a tuyo. Queda guardado en tu cuenta.</p>`:``}
      <span class="eyebrow">O pegá un enlace</span>
      <div class="r"><input type="url" class="inset" id="turl" placeholder="https://… enlace a un .mp3" style="flex:1;height:48px;border-radius:14px"><button class="iconbtn" id="taddurl" style="width:48px;height:48px;flex:none" aria-label="Agregar enlace">${ic("link")}</button></div>
      <p class="hint">Probá que siga sonando con la pantalla bloqueada: si se corta, avisame y buscamos otra forma.</p></section>
    <div class="sect">Rezar</div>
    <button class="cov w" data-rosario="1"><img src="${ilu(hk)}" alt="" loading="lazy"><span class="g"></span><span class="c"><b>Santo Rosario</b><small>${esc(MISTERIOS[hk].n)} · 20 min · entre series, con la música</small></span></button>`}
async function uploadTrack(file){if(!backend)return;toast("Subiendo "+file.name+"…");const id=newId("t");
  try{const r=await backend.uploadTrack(file,id);const tr={name:file.name.replace(/\.[^.]+$/,""),url:r.url,path:r.path,order:Date.now()};await backend.setDoc("tracks/"+id,tr);toast("Pista guardada")}
  catch(e){toast(e&&e.code==="storage/unauthorized"?"Storage rechazó la subida: revisá las reglas (README).":"No se pudo subir el archivo")}}

/* ---------- Eventos ---------- */
function setInput(exId,i,k,val){saveWorkout(w=>{if(!w.startedAt)w.startedAt=Date.now();const arr=w.sets[exId]=w.sets[exId]||[];while(arr.length<=i)arr.push({});const s=arr[i];if(s.ok===undefined)s.ok=false;if(k==="hard"){s.hard=!s.hard}else{const n=parseFloat(String(val).replace(",","."));s[k]=isNaN(n)?null:n}},null,k!=="hard")}
function saveIntents(list){intents=list.slice(0,12);write(backend.setDoc("settings/intents",{list:intents}))}
document.addEventListener("click",e=>{
  const b=e.target.closest("button,[role=button],[data-musc]");if(!b)return;const d=b.dataset;
  if(d.view){view=d.view;closeSheet();if(view==="entreno"&&!workout)openWorkout(wcur);else render();return}
  if(d.rosario){openSheet({view:"rosario",full:true});return}
  if(b.id==="rosMiniT"){rosMini=!rosMini;render();return}
  if(b.id==="rosMiniX"){rosMini=false;render();return}
  if(b.id==="rosMiniTxt"){rosMiniTxt=!rosMiniTxt;rosMiniRefresh();return}
  if(b.id==="ringBtn"){if(timer)stopTimer();else startTimer(lastRestEx||{id:"",name:"Descanso",rest:90,step:1});return}
  if(b.id==="rest30"&&timer){timer.end+=30000;timer.total+=30;timerGuardar();tick();return}
  if(b.id==="rest30"){if(timer){timer.end+=30000;timer.total+=30;paintTimer()}return}
  if(b.id==="restSkip"){stopTimer();return}
  if(b.id==="pausar"){saveWorkout(w=>{if(w.pausedAt){if(w.autoPaused){w.startedAt=Date.now()-(w.pausedAt-w.startedAt-(w.pausedMs||0));w.pausedMs=0;w.autoPaused=false}else w.pausedMs=(w.pausedMs||0)+(Date.now()-w.pausedAt);w.pausedAt=null}else w.pausedAt=Date.now()},workout&&workout.pausedAt?"Seguimos":"En pausa");return}
  if(b.id==="comenzar"){focoOff=false;const r=curRoutine();if(r)exIdx=primerPendiente(r);saveWorkout(w=>{w.startedAt=Date.now()},"Que sea para Él");window.scrollTo(0,0);return}
  if(b.id==="verResumen"){if(workout&&workout.summary)openSheet({view:"resumen",res:workout.summary,intention:workout.intention,xp:0});return}
  if(b.id==="wlater"){const enCurso=!!(workout&&!workout.done&&Object.keys(workout.sets||{}).length);view="hoy";closeSheet();render();window.scrollTo(0,0);if(enCurso)toast("Guardado: seguís después");return}
  if(b.id==="openRutinas"){rutDraft={name:"",day:-1,ex:[]};openSheet({view:"rutinas",tab:"mias"});return}
  if(b.id==="addToRoutine"){const r=curRoutine();if(!r)return;rutDraft={name:"",day:-1,ex:[]};openSheet({view:"rutinas",tab:"pick",target:r.id,q:""});return}
  if(d.rtab){sheet.tab=d.rtab;sheet.target=null;sheet.confirm=null;sheet.catSel=null;renderSheetNow();return}
  if(d.gopen){openSheet({view:"grupo",m:"inicio"});return}
  if(d.gm){sheet.m=d.gm;sheet.err="";renderSheetNow();setTimeout(()=>{const i=$("#gNom")||$("#gCod");i&&i.focus()},60);return}
  if(b.id==="gCrear"){const n=($("#gNom").value||"").trim().slice(0,40);if(!n){sheet.err="Poné un nombre.";renderSheetNow();return}(async()=>{try{const gid=await grupoBE.crear(n,miFichaG());await backend.setDoc("settings/grupo",{gid});toast("Grupo creado · código "+gid);sheet={view:"grupo"};renderSheetNow()}catch(e){sheet.err="No se pudo crear. Revisá la conexión.";renderSheetNow()}})();return}
  if(b.id==="gUnir"){const c=($("#gCod").value||"").trim().toUpperCase();if(c.length!==8){sheet.err="El código tiene 8 letras.";renderSheetNow();return}(async()=>{try{const g=await grupoBE.leer(c);if(!g||g.tipo!=="entreno"){sheet.err=g?"Ese es un grupo de Scaeli Daily: unite desde Daily.":"No existe un grupo con ese código.";renderSheetNow();return}await grupoBE.setMiembro(c,miFichaG());await backend.setDoc("settings/grupo",{gid:c});toast("Entraste a «"+g.n+"»");sheet={view:"grupo"};renderSheetNow()}catch(e){sheet.err="No se pudo entrar. Revisá la conexión.";renderSheetNow()}})();return}
  if(b.id==="gShare"){const t="Sumate a mi grupo «"+grupo.meta.n+"» en Scaeli Fit. Código: "+grupo.gid+" · https://ldiazvidela.github.io/scaeli-fit/";if(navigator.share)navigator.share({text:t}).catch(()=>{});else{try{navigator.clipboard.writeText(t);toast("Código copiado")}catch(e){toast("Código: "+grupo.gid)}}return}
  if(b.id==="gSalir"){if(sheet.confirm!=="salir"){sheet.confirm="salir";renderSheetNow();return}const gid=grupo.gid;(async()=>{try{await grupoBE.salir(gid)}catch(e){}await backend.setDoc("settings/grupo",{gid:null});closeSheet();toast("Saliste del grupo")})();return}
  if(d.hall){openSheet({view:"hist"});return}
  if(d.hver){openSheet({view:"histver",id:d.hver});return}
  if(b.id==="histDel"){if(sheet.confirm!=="del"){sheet.confirm="del";renderSheetNow();return}const id=d.hid;const w=wHist.find(x=>x.id===id);unawardWorkout(id,w&&w.summary&&w.summary.xp);write(backend.delDoc("workouts/"+id),"Entreno borrado");if(id===wcur){workout=null;stopTimer()}closeSheet();render();return}
  if(d.smas||d.smenos){const id=d.smas||d.smenos;const ex=curRoutine().ex.find(x=>x.id===id);saveWorkout(w=>{w.extra=w.extra||{};const cur=w.extra[id]||0;const ss=(w.sets[id]||[]);const usadas=ss.filter(x=>x&&(x.r>0||x.w>0)).length;
      if(d.smas)w.extra[id]=cur+1;else{const nuevo=cur-1;if(ex.sets+nuevo<usadas){toast("Esa serie ya tiene datos: borrá los números primero");return}if(ex.sets+nuevo<1)return;w.extra[id]=nuevo;if(ss.length>ex.sets+nuevo)ss.length=ex.sets+nuevo}});return}
  if(d.cambiar){openSheet({view:"cambiar",exId:d.cambiar,eq:"",q:"",siempre:false});return}
  if(d.ceq!==undefined){sheet.eq=d.ceq;renderSheetNow();return}
  if(b.id==="cSiempre"){sheet.siempre=!sheet.siempre;b.setAttribute("aria-pressed",sheet.siempre);return}
  if(d.cpick){const {exId,siempre}=sheet;closeSheet();cambiarEj(exId,d.cpick,siempre);render();window.scrollTo(0,0);return}
  if(d.musc){const m=d.musc;const v=fatiga()[m];const u=ultimaVez(m);const R=MUSC[m][1];const falta=v>=100?0:Math.ceil((100-v)/100*R);
    toast(`${MUSC[m][0]} ${v} % · ${falta?"listo en ~"+falta+" h":"listo"}${u?" · lo entrenaste "+(u===today()?"hoy":"el "+fecha(u).toLowerCase()):""}`);return}
  if(b.id==="recomendar"){const R=recomendar();const o={modo:"hoy",obj:(profile&&profile.goal==="ganar")?"musculo":"musculo",dias:3,min:45,prios:R.prios};openSheet({view:"armar",o,res:{rutinas:[armarSesion(o)],why:R.why}});return}
  if(d.asist){const id=d.asist;asist={...asist,[id]:!asist[id]};write(backend.setDoc("settings/asist",{map:asist}),asist[id]?"Asistida: anotá los kg de ayuda":"Con lastre o sin peso");render();return}
  if(d.tec){const t=b.closest(".tec");const o=!t.classList.contains("open");t.classList.toggle("open",o);b.setAttribute("aria-expanded",o);if(t.closest(".ex.foco"))tecOpen=o;return}
  if(b.id==="focoSalir"){focoOff=true;render();window.scrollTo(0,0);return}
  if(b.id==="focoOn"){focoOff=false;const r=curRoutine();if(r)exIdx=primerPendiente(r);render();window.scrollTo(0,0);return}
  if(b.id==="exPrev"){tecOpen=false;exIdx=Math.max(0,exIdx-1);render();window.scrollTo(0,0);return}
  if(b.id==="exNext"){tecOpen=false;const r=curRoutine();exIdx=Math.min(r.ex.length-1,exIdx+1);render();window.scrollTo(0,0);return}
  if(d.exir!==undefined){exIdx=+d.exir;closeSheet();render();window.scrollTo(0,0);return}
  if(b.id==="exTodos"){openSheet({view:"exlist"});return}
  if(b.id==="wDescartar"){const r=curRoutine();openSheet({view:"descartar",name:r?r.name:"",short:true});return}
  if(b.id==="wDiscard"){stopTimer();workout=null;offerSkip=false;write(backend.delDoc("workouts/"+wcur),"Entreno descartado");closeSheet();render();return}
  if(d.armar){openSheet({view:"armar"});return}
  if(d.ar){const o=sheet.o;if(d.ar==="modo"){o.modo=d.v}else if(d.ar==="rehacer"){sheet.res=null}
    else if(d.ar==="prio"){const v=d.v;if(!v)o.prios=[];else if(o.prios.includes(v)){o.prios=o.prios.filter(x=>x!==v)}else if(o.prios.length<3)o.prios.push(v);else toast("Hasta 3 músculos")}
    else o[d.ar]=/^\d+$/.test(d.v)?+d.v:d.v;renderSheetNow();return}
  if(b.id==="arGo"){const o=sheet.o;if(o.modo==="hoy"&&!o.prios.length){toast("Elegí al menos un músculo");return}sheet.res=o.modo==="hoy"?{rutinas:[armarSesion(o)],why:"Una sesión de "+o.min+" minutos para "+prioTxt(o.prios)+(o.prios.length>1?" (más ejercicios de "+prioTxt([o.prios[0]])+")":"")+", con lo que tenés en Mi equipo."}:armarPrograma(o);renderSheetNow();const sc=$("#sheetIn .scroll");if(sc)sc.scrollTop=0;return}
  if(b.id==="arUsar"){const o=sheet.o,R=sheet.res;if(o.modo==="hoy"){const rr=R.rutinas[0];routines=routines.filter(x=>x.id!==rr.id).concat([rr]);saveRoutines();usarRutina(rr.id);closeSheet();toast("Listo: "+rr.name)}else{routines=JSON.parse(JSON.stringify(R.rutinas)).map(r=>({...r,prog:"armada"}));saveRoutines("Programa armado");closeSheet();render()}return}
  if(d.eqopen){const back=sheet&&sheet.view==="rutinas"?{tab:sheet.tab}:null;openSheet({view:"equipo",back});return}
  if(d.eq){const k=d.eq;sheet.sel.has(k)?sheet.sel.delete(k):sheet.sel.add(k);b.setAttribute("aria-pressed",sheet.sel.has(k));return}
  if(b.id==="eqSave"){equipo=[...sheet.sel];write(backend.setDoc("settings/equipo",{list:equipo}),"Equipo guardado");const pr=routines.find(r=>r.prog);if(pr&&pr.eq!==equipo.slice().sort().join(","))setTimeout(()=>toast("Tu programa de casa se puede actualizar: Rutinas → Programas"),2200);const back=sheet.back;if(back){openSheet({view:"rutinas",tab:back.tab})}else closeSheet();render();return}
  if(d.cadd!==undefined){sheet.catSel=d.cadd||null;renderSheetNow();if(sheet.catSel){const sc=$("#sheetIn .scroll");if(sc)sc.scrollTop=0}return}
  if(d.cto){const rr=routines.find(x=>x.id===d.cto);const e=exDeCatalogo(sheet.catSel);if(!rr||!e)return;if(rr.ex.some(x=>x.id===e.id))return toast("Ya está en "+rr.name);rr.ex.push(e);saveRoutines("Agregado a "+rr.name);sheet.catSel=null;renderSheetNow();render();return}
  if(d.ruse){closeSheet();usarRutina(d.ruse);return}
  if(d.rdelr){if(sheet.confirm==="r:"+d.rdelr){sheet.confirm=null;routines=routines.filter(x=>x.id!==d.rdelr);if(routineSel===d.rdelr)routineSel=null;saveRoutines("Rutina borrada");renderSheetNow();render()}else{sheet.confirm="r:"+d.rdelr;renderSheetNow()}return}
  if(d.delex){if(sheet.confirm==="e:"+d.delex){sheet.confirm=null;const[rid,eid]=d.delex.split("/");const rr=routines.find(x=>x.id===rid);if(rr){rr.ex=rr.ex.filter(x=>x.id!==eid);saveRoutines("Quitado")}renderSheetNow();render()}else{sheet.confirm="e:"+d.delex;renderSheetNow()}return}
  if(d.addex){sheet.tab="pick";sheet.target=d.addex;sheet.q="";renderSheetNow();return}
  if(d.puse){const pp=todosProgramas().find(x=>x.id===d.puse);if(pp&&pp.casa&&!equipo){openSheet({view:"equipo",back:{tab:"bib"}});toast("Primero contá qué equipo tenés");return}
    if(sheet.confirm==="p:"+d.puse){sheet.confirm=null;const p=pp;routines=JSON.parse(JSON.stringify(p.rutinas)).map(r=>p.casa?{...r,prog:p.id,eq:(equipo||[]).slice().sort().join(",")}:r);saveRoutines("Programa cargado: "+p.nombre);closeSheet();usarRutina(((routineFor(wcur)||routines[0])||{}).id)}else{sheet.confirm="p:"+d.puse;renderSheetNow()}return}
  if(d.rg!==undefined&&sheet&&sheet.view==="rutinas"){sheet.g=d.rg;renderSheetNow();return}
  if(d.rday){rutDraft.day=+d.rday;renderSheetNow();return}
  if(d.rrm){rutDraft.ex.splice(+d.rrm,1);renderSheetNow();return}
  if(d.radd){const e=exDeCatalogo(d.radd);if(sheet.tab==="pick"){const rr=routines.find(x=>x.id===sheet.target);if(rr){if(rr.ex.some(x=>x.id===e.id))return toast("Ya está en la rutina");rr.ex.push(e);saveRoutines("Agregado: "+e.name);render()}}else{if(rutDraft.ex.some(x=>x.id===e.id))return toast("Ya está en la lista");rutDraft.ex.push(e);toast("Agregado: "+e.name);renderSheetNow()}return}
  if(b.id==="rutSave"){const d2=rutDraft;if(!(d2.name.trim()&&d2.ex.length))return;const id=newId("r");routines.push({id,name:d2.name.trim(),day:d2.day,goal:"Propia",ex:d2.ex});saveRoutines("Rutina guardada");closeSheet();usarRutina(id);return}
  if(d.roselegir){sheet.rset=d.roselegir;renderSheetNow();return}
  if(d.rosempezar){const r=rosNuevo(d.rosempezar);r.fase="credo";rosGuardar(r);return}
  if(d.rosav){rosAvanzar();return}
  if(d.rosatras){rosAtras();return}
  if(d.rossolo){dprofile={...(dprofile||{}),rosSolo:!(dprofile&&dprofile.rosSolo)};backend.setDoc("daily_settings/profile",dprofile);renderSheetNow();return}
  if(d.ficha){const r=curRoutine();const ex=r&&r.ex.find(x=>x.id===d.ficha);if(ex)openSheet({view:"ficha",ex});return}
  if(b.id==="openChar"){view="mas";closeSheet();render();window.scrollTo(0,0);return}
  if(b.id==="openPlus"){openSheet({view:"plus"});return}
  if(b.id==="plusComoGratis"){lsSet("fit_plus_como_gratis",lsGet("fit_plus_como_gratis")==="1"?null:"1");renderSheetNow();render();return}
  if(b.id==="plusRedeem"){const code=($("#plusCode").value||"").trim();const msg=$("#plusMsg");if(!code)return;b.disabled=true;msg.textContent="Verificando…";
    backend.redeemCode(code).then(r=>{if(!r.ok){msg.textContent=r.why;b.disabled=false;return}const until=r.days>0?addDays(today(),r.days):null;plus=plusDoc({source:"code",code:r.code,until,label:r.label});
      write(backend.setDoc("settings/plus",plus),"Plus activado");closeSheet();render()}).catch(()=>{msg.textContent="No se pudo verificar. Probá de nuevo.";b.disabled=false});return}
  if(d.fplan){fast={...(fast||{}),plan:d.fplan};write(backend.setDoc("settings/fast",fast));render();return}
  if(b.id==="fastStart"){fast={...(fast||{plan:"16:8"}),start:Date.now()};write(backend.setDoc("settings/fast",fast),"Ayuno iniciado");render();return}
  if(b.id==="fastEdit"){openSheet({view:"fastedit",short:true});return}
  if(b.id==="fastSave"){const v=$("#fastWhen").value;const t=v?new Date(v).getTime():NaN;if(!(t>0))return;if(t>Date.now())return toast("Esa hora todavía no llegó");fast={...(fast||{plan:"16:8"}),start:t};write(backend.setDoc("settings/fast",fast),"Hora corregida");closeSheet();render();return}
  if(b.id==="fastStop"){const st=fastState();if(!st)return;const done=st.done||(!st.goalMs&&st.elapsed>=36e5);const rec={plan:st.plan,ms:st.elapsed,date:today(),done};
    fast={...(fast||{}),start:null,last:rec};write(backend.setDoc("settings/fast",fast));
    fasts=[rec,...fasts].slice(0,60);write(backend.setDoc("settings/fasts",{list:fasts}));
    if(done){const before=progress.xp||0;award("fast",today());openSheet({view:"fastdone",rec,xp:(progress.xp||0)-before,short:true})}else toast("Ayuno cortado a las "+hms(st.elapsed).slice(0,-3)+" h. Mañana, un poco más.");
    render();return}
  if(b.id==="timerpill"){view="entreno";render();return}
  if(b.id==="prev")openDay(addDays(cur,-1));else if(b.id==="next")openDay(addDays(cur,1));else if(b.id==="todayBtn")openDay(today());
  else if(b.id==="tType"){const t=dayType()==="gym"?"rest":"gym";saveDay(x=>x.type=t)}
  else if(d.check){const k=d.check;saveDay(x=>{x.check[k]=!x.check[k]});if(sheet&&sheet.view==="dia")closeSheet()}
  else if(d.dia){openSheet({view:"dia",k:d.dia,short:true})}
  else if(d.dstep){const D=DIA[sheet.k];const inp=$("#diaV");const v=Math.max(0,r1((parseFloat(String(inp.value).replace(",","."))||0)+(+d.dstep)*D.step));sheet.v=v;inp.value=v}
  else if(b.id==="diaSave"){const k=sheet.k,D=DIA[k];const v=Math.max(0,parseFloat(String($("#diaV").value).replace(",","."))||0);closeSheet();saveDay(x=>{x.vals={...(x.vals||{}),[k]:v};x.check[k]=v>=D.meta},D.n+": "+nfmt(v,D.u)+" "+D.u)}
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
  else if(d.manual){sheet={...sheet,view:"manual",m:null};renderSheetNow()}
  else if(b.id==="mfSave"){sheet.m.save=!sheet.m.save;b.classList.toggle("off",!sheet.m.save);b.setAttribute("aria-pressed",sheet.m.save)}
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
  else if(d.ok){const ex=curRoutine().ex.find(x=>x.id===d.ok);const ss=wsets(d.ok);const i=+d.i;const s=ss[i]||{};const B=baseSerie(ex,i);const prev={w:B.w,r:B.r};const sg=suggest(ex);
    coachMsg[d.ok]=null;let completed=false;saveWorkout(w=>{if(!w.startedAt)w.startedAt=Date.now();const arr=w.sets[d.ok]=w.sets[d.ok]||[];while(arr.length<=i)arr.push({});const t=arr[i];if(hecha(t)){t.ok=false}else{const pw=s.w>0?s.w:(prev.w>0?prev.w:sg.w);if(pw>0)t.w=pw;t.r=s.r>0?s.r:(prev.r>0?prev.r:ex.lo);if(t.rir==null)t.rir=2;t.ok=true;completed=true}});
    if(completed){coachMsg[ex.id]=coachSerie(ex,i,wsets(d.ok)[i]);startTimer(ex);const all=wsets(d.ok).filter(hecha).length>=nSerOf(ex);if(all&&focoActivo())toast("Ejercicio completo · tocá Siguiente")}else stopTimer()}
  else if(b.id==="finish")finishWorkout();
  else if(b.id==="openListen"&&!e.target.closest("[data-pp]")){view="escuchar";closeSheet();render();window.scrollTo(0,0)}
  else if(d.pp){togglePlay()}else if(d.tprev){playTrack((trackIdx-1+tracks.length)%tracks.length)}else if(d.tnext){playTrack((trackIdx+1)%tracks.length)}
  else if(d.tsel){playTrack(+d.tsel)}
  else if(d.tdel){const id=d.tdel;if(listenConfirm===id){listenConfirm=null;const t=tracks.find(x=>x.id===id);write(backend.delDoc("tracks/"+id),"Pista borrada");if(t&&t.path)backend.deleteTrackFile(t.path)}else{listenConfirm=id;render()}}
  else if(b.id==="taddurl"){const u=($("#turl").value||"").trim();if(!/^https?:\/\//.test(u))return toast("Pegá un enlace que empiece con https://");const name=decodeURIComponent(u.split("/").pop()||"Pista").replace(/\.[^.]+$/,"")||"Pista";write(backend.setDoc("tracks/"+newId("t"),{name,url:u,order:Date.now()}),"Pista agregada")}
  else if(d.ltab){listenTab=d.ltab;renderSheetNow()}
  else if(d.rnext){const S=rosarySteps(wcur);if(rosaryStep>=S.length-1){rosaryStep=0;closeSheet();toast("Amén");award("rosary",today())}else{rosaryStep++;renderSheetNow()}}
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
  else if(b.id==="saveBody"){const w=parseFloat(($("#bw").value||"").replace(",","."));const wa=parseFloat(($("#bwa").value||"").replace(",","."));if(!(w>0)&&!(wa>0))return;const rec={date:today()};if(w>0)rec.weight=r1(w);if(wa>0)rec.waist=r1(wa);write(backend.setDoc("body/"+today(),rec),"Guardado");if(w>0)award("body",today())}
  else if(d.delbody){write(backend.delDoc("body/"+d.delbody),"Borrado")}
  /* Más */
  else if(d.edex){const[rid,eid]=d.edex.split("/");const back=!!(sheet&&sheet.view==="rutinas");openSheet({view:"edex",rid,eid,short:!back,back})}
  else if(b.id==="exSave"){const r=routines.find(x=>x.id===sheet.rid);const ex=r.ex.find(x=>x.id===sheet.eid);ex.name=$("#exn").value.trim()||ex.name;ex.sets=parseInt($("#exs").value)||ex.sets;ex.lo=parseInt($("#exlo").value)||ex.lo;ex.hi=Math.max(ex.lo,parseInt($("#exhi").value)||ex.lo);ex.step=parseFloat($("#exst").value)||0;ex.rest=parseInt($("#exrest").value)||restOf(ex);
    if(sheet.back){sheet={view:"rutinas",tab:"mias"};renderSheetNow()}else closeSheet();saveRoutines("Guardado");render()}
  else if(b.id==="resetR"){routines=JSON.parse(JSON.stringify(DEFAULT_ROUTINES));routineSel=null;saveRoutines("Rutinas restauradas");if(sheet)renderSheetNow();render()}
});
document.addEventListener("change",e=>{const t=e.target;if(t.dataset&&t.dataset.set){setInput(t.dataset.set,+t.dataset.i,t.dataset.k,t.value)}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sheet)closeSheet();if(e.key==="Enter"&&e.target.id==="intencion"){e.preventDefault();$("#offer").click()}});
$("#scrim").addEventListener("click",closeSheet);

/* ---------- Arranque: login, datos y sincronización ---------- */
let user=null,unsubs=[],profile=null,recipes=[];
const DEFAULT_RULES_MSG="La base de datos rechazó la operación. Si sos quien administra la app, revisá que las reglas de Firestore estén publicadas (ver README).";
function mergeFoods(){foods=BASE.filter(f=>!hidden.has(f.id)).concat(userFoods);foods.forEach(f=>{if(!f._n)f._n=norm(f.name)});foodsSorted=foods.slice().sort((a,b)=>a.name.localeCompare(b.name,"es"));if(sheet)renderSheet();if(view==="mas"&&!typing())render()}
function saveFood(id,f){return backend.setDoc("foods/"+id,f)}
function deleteFood(id){if(BASE.some(f=>f.id===id)){hidden.add(id);return backend.setDoc("settings/hidden",{list:[...hidden]})}return backend.delDoc("foods/"+id)}
function renderLogin(){
  $("#nav").hidden=true;
  $("#app").innerHTML=`<div class="login"><h1 class="logo"><img src="icons/fit-logo.png" alt="Scaeli Fit" style="width:220px;height:auto;border-radius:0"></h1><p class="hint" style="font-size:15px;margin-top:-10px">Ordenar el cuerpo.</p>
    <p style="margin:0;font-size:19px;font-weight:300;line-height:1.4;max-width:30ch">Comidas, entrenamiento ofrecido y descanso. Tu cuerpo al servicio de tu fe, guardado en tu cuenta.</p>
    <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px"><button class="entrar apple" id="loginApple" data-q="apple">${LOGO_APPLE}<span>Continuar con Apple</span></button><button class="entrar google" id="login" data-q="google">${LOGO_GOOGLE}<span>Continuar con Google</span></button><button class="ghost g" id="invitado" style="justify-content:center;height:48px;margin-top:4px">Probar sin cuenta</button></div>
    <p class="hint" id="status">${esc(statusTxt||"La misma cuenta que Scaeli Daily y el juego. Nada es público.")}</p><p class="hint"><a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a></p></div>`;
}
function startSession(u,local){setTimeout(timerRestaurar,600);
  user=u;unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[];
  backend=local?localBackend():userBackend(u.uid,e=>{if(e&&e.code==="permission-denied")setStatus(DEFAULT_RULES_MSG,true);else setStatus("Sin conexión: los cambios se guardan y se sincronizan después.",false)});
  setStatus(local?"Guardado solo en este dispositivo":"Sincronizado · "+(u.displayName||u.email||""));
  if(local){try{localStorage.setItem("fit_local","1")}catch(e){}}
  $("#nav").hidden=false;
  const w=(fn)=>{const un=fn();if(typeof un==="function")unsubs.push(un)};
  w(()=>backend.watchCol("foods",list=>{userFoods=list;mergeFoods()}));
  w(()=>backend.watchDoc("settings/hidden",v=>{hidden=new Set((v&&v.list)||[]);mergeFoods()}));
  w(()=>backend.watchCol("combos",list=>{combos=list;if(sheet&&sheet.view==="search")renderSheet();if(view==="mas")render()}));
  w(()=>backend.watchCol("recipes",list=>{recipes=list.slice().sort((a,b)=>a.name.localeCompare(b.name,"es"));if(sheet&&(sheet.view==="recipes"||sheet.view==="recipe"))renderSheet();if(view==="mas")render()}));
  w(()=>backend.watchCol("body",list=>{bodyRows=list;if(view==="cuerpo")render()}));
  w(()=>backend.watchCol("tracks",list=>{tracks=list.slice().sort((a,b)=>(a.order||0)-(b.order||0));if(trackIdx>=tracks.length)trackIdx=0;if(view==="entreno"||view==="escuchar")render()}));
  w(()=>backend.watchDoc("settings/targets",t=>{if(t&&t.gym&&t.rest)targets={gym:t.gym,rest:t.rest};if(t&&t.goal>0)goal=t.goal;render()}));
  w(()=>backend.watchDoc("settings/profile",p=>{const first=profile===null;profile=p||{};if(first&&!p)setTimeout(()=>openSheet({view:"onboarding"}),400);render()}));
  w(()=>backend.watchDoc("settings/routines",r=>{if(r&&r.list&&r.list.length)routines=r.list;if(view!=="hoy")render()}));
  w(()=>backend.watchDoc("settings/loads",l=>{loads=l||{};if(view==="entreno")render()}));
  w(()=>backend.watchDoc("settings/prs",v=>{prs=v||{};if(view==="entreno")render()}));
  w(()=>backend.watchDoc("settings/intents",v=>{intents=(v&&v.list)||[];if(view==="entreno"||view==="mas")render()}));
  w(()=>backend.watchDoc("settings/progress",v=>{if(v)progress={xp:0,counts:{},days:[],best:0,badges:{},done:{},...v};if(view==="hoy"||view==="mas")render()}));
  w(()=>backend.watchDoc("settings/plus",v=>{plus=v||null;if(view==="hoy"||view==="mas")render()}));
  w(()=>backend.watchDoc("settings/fast",v=>{fast=v||null;if(view==="hoy")render()}));
  w(()=>backend.watchCol("workouts",list=>{wHist=list.filter(x=>x.done&&x.summary).sort((a,b)=>b.id.localeCompare(a.id));grupoSync();if(view==="mas")render();if(sheet&&(sheet.view==="hist"||sheet.view==="grupo"))renderSheetNow()}));
  grupoBE=local?gruposLocal("local"):gruposBackend(u.uid);
  w(()=>backend.watchDoc("settings/grupo",v=>{const gid=v&&v.gid||null;if(gid!==grupo.gid)grupoAbrir(gid)}));
  w(()=>()=>grupoCerrar());
  w(()=>backend.watchDoc("settings/asist",v=>{asist=(v&&v.map)||{};if(view==="entreno")render()}));
  w(()=>backend.watchDoc("settings/equipo",v=>{equipo=v&&Array.isArray(v.list)?v.list:null;if(sheet&&sheet.view==="rutinas")renderSheetNow();if(view==="mas")render()}));
  w(()=>backend.watchDoc("settings/fasts",v=>{fasts=(v&&v.list)||[];if(view==="mas")render()}));
  w(()=>backend.watchDoc("daily_settings/profile",v=>{dprofile=v||{};pintarPersonajes()}));
  w(()=>backend.watchDoc("daily_settings/rosario",v=>{const nv=v||null;if(JSON.stringify(nv)===JSON.stringify(rosario))return;rosario=nv;if(sheet&&sheet.view==="rosario")renderSheetNow();else if(view==="entreno"&&rosMini)rosMiniRefresh()}));
  if(!local&&delEquipo()&&!(plus&&plus.active))backend.setDoc("settings/plus",plusDoc({source:"team"}));
  ready=true;render();openDay(cur);openWorkout(wcur);
}
function endSession(){user=null;backend=null;ready=false;unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[];profile=null;progress={xp:0,counts:{},days:[],best:0,badges:{}};plus=null;fast=null;fasts=[];equipo=null;dprofile=null;rosario=null;rosMini=false;lastRestEx=null;anims.forEach(a=>a.stop());anims=[];foods=[];userFoods=[];combos=[];recipes=[];bodyRows=[];tracks=[];loads={};prs={};intents=[];day=null;workout=null;targets=DEFAULT_TARGETS;routines=DEFAULT_ROUTINES;closeSheet();renderLogin()}
document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  if(b.id==="login"||b.id==="loginApple"){const q=b.dataset.q||"google";b.disabled=true;setStatus("Abriendo "+(q==="apple"?"Apple":"Google")+"…");try{localStorage.removeItem("fit_local")}catch(e){}login(q).then(()=>setStatus("Entrando…")).catch(err=>{setStatus(err&&err.message||"No se pudo entrar. Probá de nuevo.",true);b.disabled=false})}
  else if(b.id==="invitado"){startSession({uid:"local",displayName:""},true)}
  else if(b.id==="logout"){try{localStorage.removeItem("fit_local")}catch(e){}if(backend&&backend.mode==="local"){endSession()}else logout()}});
try{if(localStorage.getItem("balanza_theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}
setInterval(()=>{fastTick();sesTick()},1000);
Promise.all([fetch("data/foods.json").then(r=>r.json()),fetch("data/foods_extra.json").then(r=>r.ok?r.json():[]).catch(()=>[])])
  .then(([a,b])=>{const ids=new Set(a.map(f=>f.id));BASE=a.concat(b.filter(f=>!ids.has(f.id)).map(f=>({id:f.id,name:f.name,kcal:f.kcal,p:f.p,c:f.c,g:f.f!=null?f.f:(f.g||0),unitG:f.unitG,unitName:f.unitName,src:f.src})));mergeFoods()})
  .catch(()=>setStatus("No se pudo cargar la base de alimentos.",true));
if(navigator.serviceWorker&&navigator.serviceWorker.register){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
renderLogin();
/* Modo demo (?demo=1): sesión local en memoria, sin Google ni Firestore. Sirve para probar y mostrar la app. */
function memoryBackend(){const store={};const subs={};const key=p=>p;const col=p=>p.split("/")[0];const emit=p=>{(subs[p]||[]).forEach(cb=>cb(store[p]===undefined?null:store[p]));const c=col(p);(subs["col:"+c]||[]).forEach(cb=>cb(Object.keys(store).filter(k=>k.startsWith(c+"/")).map(k=>({id:k.split("/")[1],...store[k]}))))};
  const on=(k,cb)=>{(subs[k]=subs[k]||[]).push(cb);return()=>{subs[k]=subs[k].filter(f=>f!==cb)}};
  return{mode:"memory",uid:"demo",watchDoc(p,cb){const un=on(key(p),cb);setTimeout(()=>cb(store[p]===undefined?null:store[p]),0);return un},
    watchCol(c,cb){const un=on("col:"+c,cb);setTimeout(()=>cb(Object.keys(store).filter(k=>k.startsWith(c+"/")).map(k=>({id:k.split("/")[1],...store[k]}))),0);return un},
    async setDoc(p,d){store[p]=JSON.parse(JSON.stringify(d));emit(p)},async delDoc(p){delete store[p];emit(p)},async importAll(d){let n=0;for(const c in d)for(const id in d[c]){store[c+"/"+id]=d[c][id];n++;emit(c+"/"+id)}return n},
    async exportAll(cols){const o={};cols.forEach(c=>{o[c]={};Object.keys(store).filter(k=>k.startsWith(c+"/")).forEach(k=>o[c][k.split("/")[1]]=store[k])});return o},
    async uploadTrack(){throw new Error("demo")},deleteTrackFile(){},async redeemCode(code){return String(code).toUpperCase()==="DEMO"?{ok:true,code:"DEMO",days:0,label:"demo"}:{ok:false,why:"En el modo demo el código es DEMO."}}}}
PJ.cargar("assets/avatar/").then(()=>pintarPersonajes()).catch(()=>{});
if(/[?&]demo=1/.test(location.search)||lsGet("fit_local")==="1"){startSession({uid:"local",displayName:""},true)}
else if(false){const u={uid:"demo",displayName:"Demo"};user=u;backend=memoryBackend();profile={};const startDemo=()=>{const b=backend;unsubs=[];const w=fn=>{const un=fn();if(typeof un==="function")unsubs.push(un)};
    w(()=>b.watchCol("foods",l=>{userFoods=l;mergeFoods()}));w(()=>b.watchCol("combos",l=>{combos=l}));w(()=>b.watchCol("recipes",l=>{recipes=l}));w(()=>b.watchCol("body",l=>{bodyRows=l;if(view==="cuerpo")render()}));w(()=>b.watchCol("tracks",l=>{tracks=l}));
    w(()=>b.watchDoc("settings/progress",v=>{if(v)progress={xp:0,counts:{},days:[],best:0,badges:{},done:{},...v};render()}));w(()=>b.watchDoc("settings/plus",v=>{plus=v||null;render()}));w(()=>b.watchDoc("settings/fast",v=>{fast=v||null;render()}));w(()=>b.watchDoc("settings/loads",l=>{loads=l||{}}));
    ready=true;setStatus("Modo demo: nada se guarda.");$("#nav").hidden=false;render();openDay(cur);openWorkout(wcur)};startDemo()}
else finishRedirect().then(()=>{watchAuth(u=>{if(u)startSession(u);else{endSession();if(!statusTxt)setStatus("Guardado en tu cuenta de Google. Nada es público.")}})});
