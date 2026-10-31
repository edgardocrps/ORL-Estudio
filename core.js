export const DAY = 86400000;
export const LEVELS = {basic:'Básico',intermediate:'Intermedio',advanced:'Avanzado'};
export const ROLES = {general:'Médico/a general',student:'Estudiante de Medicina',resident:'Residente',specialist:'Especialista',applicant:'Aspirante a ORL'};
export const blankState = () => ({schema:1,records:{},history:[],activity:{},goal:20,session:null,profile:{name:'',role:'',institution:''},profileOnboarded:false});
export function normalizeProfile(value={}) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Los datos del perfil no son válidos.');
 const read=(key,max)=>{const raw=value[key]??'';if(typeof raw!=='string')throw Error('Los datos del perfil no son válidos.');const clean=raw.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();if(clean.length>max)throw Error('El nombre o el centro de formación es demasiado largo.');return clean;};
 const name=read('name',80),institution=read('institution',120),role=read('role',30);
 if(role&&!Object.hasOwn(ROLES,role))throw Error('Selecciona una etapa de formación válida.');
 return {name,role,institution};
}
export function resetStudyProgress(previous) {return {...blankState(),profile:normalizeProfile(previous.profile),profileOnboarded:previous.profileOnboarded===true,goal:previous.goal};}

export function localDate(time=Date.now()) { const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function shuffle(items, random=Math.random) { const result=[...items]; for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result; }
export function filterBank(questions, records, {block='all',level='all',format='all',pool='all',search=''}={}, now=Date.now()) {
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); const term=normalize(search);
 return questions.filter(q=>{const r=records[q.id];return (block==='all'||q.block===Number(block))&&(level==='all'||q.level===level)&&(format==='all'||q.type===format)&&(!term||normalize(q.prompt+' '+q.topic).includes(term))&&(pool==='all'||(pool==='new'&&!r?.reviews)||(pool==='errors'&&r?.needsReview)||(pool==='saved'&&r?.saved)||(pool==='due'&&r?.reviews&&r.due<=now));});
}
export function nextReview(previous={}, {kind='card',correct=null,rating='good'}, now=Date.now()) {
 const r={reviews:0,mcqAttempts:0,mcqCorrect:0,interval:0,...previous};r.reviews++;r.lastReviewed=now;
 const failed=kind==='mcq'?!correct:rating==='again';
 const days=failed?0:kind==='card'&&rating==='hard'?1:Math.min(60,Math.max(kind==='card'&&rating==='easy'?7:3,(r.interval||0)*(kind==='card'&&rating==='easy'?2.5:2)));
 r.interval=days;r.due=now+(failed?600000:days*DAY);r.needsReview=failed||(kind==='card'&&rating==='hard');r.lastKind=kind;r.lastRating=kind==='mcq'?(correct?'good':'again'):rating;
 if(kind==='mcq'){r.mcqAttempts++;if(correct)r.mcqCorrect++;r.lastCorrect=Boolean(correct);}
 return r;
}
export function scoreExam(ids,answers,questions) {
 const byId=new Map(questions.map(q=>[q.id,q]));let correct=0,wrong=0,skipped=0;
 const results=ids.map(id=>{const q=byId.get(id);if(!q)throw Error('Pregunta desconocida');const answer=answers[id]??null;const answered=q.options.some(o=>o.key===answer);const ok=answered&&answer===q.correct;if(!answered)skipped++;else if(ok)correct++;else wrong++;return {id,answer:answered?answer:null,correct:ok,answered};});
 return {total:ids.length,correct,wrong,skipped,percentage:ids.length?Math.round(correct/ids.length*100):0,results};
}
export function summarize(questions,state, now=Date.now()) {
 const records=Object.values(state.records);const attempts=records.reduce((s,r)=>s+(r.mcqAttempts||0),0);const correct=records.reduce((s,r)=>s+(r.mcqCorrect||0),0);
 return {reviewed:questions.filter(q=>state.records[q.id]?.reviews>0).length,errors:questions.filter(q=>state.records[q.id]?.needsReview).length,saved:records.filter(r=>r.saved).length,due:records.filter(r=>r.reviews&&r.due<=now).length,attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):null,today:state.activity[localDate(now)]||0};
}
export function parseBackup(input,questions) {
 if(!input||input.app!=='orl-estudio'||input.schema!==1||!input.state||typeof input.state.records!=='object'||!input.state.records||Array.isArray(input.state.records))throw Error('Este archivo no es una copia válida de ORL Estudio.');
 const result=blankState();
 if(input.state.profile!==undefined)result.profile=normalizeProfile(input.state.profile);
 result.profileOnboarded=input.state.profileOnboarded===true||Boolean(result.profile.name);
 const validIds=new Set(questions.map(q=>String(q.id)));
 const finite=(v,min=0,max=1e14)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 for(const [id,r]of Object.entries(input.state.records)){
  if(!validIds.has(id)||!r||typeof r!=='object'||Array.isArray(r))throw Error('La copia contiene preguntas o registros desconocidos.');
  const clean={};
  for(const k of ['reviews','mcqAttempts','mcqCorrect','interval','lastReviewed','due'])if(k in r){if(!finite(r[k]))throw Error('La copia contiene valores de progreso inválidos.');clean[k]=r[k];}
  if((clean.mcqCorrect||0)>(clean.mcqAttempts||0))throw Error('El número de aciertos no es válido.');
  for(const k of ['saved','needsReview','lastCorrect'])if(k in r){if(typeof r[k]!=='boolean')throw Error('Registro inválido.');clean[k]=r[k];}
  if(['card','mcq'].includes(r.lastKind))clean.lastKind=r.lastKind;
  if(['again','hard','good','easy'].includes(r.lastRating))clean.lastRating=r.lastRating;
  result.records[id]=clean;
 }
 if(input.state.activity&&typeof input.state.activity==='object'&&!Array.isArray(input.state.activity))for(const [date,v]of Object.entries(input.state.activity)){if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isInteger(v)&&finite(v,0,100000))result.activity[date]=v;}
 if(Number.isInteger(input.state.goal)&&finite(input.state.goal,5,200))result.goal=input.state.goal;
 if(Array.isArray(input.state.history))result.history=input.state.history.filter(h=>h&&finite(h.ended)&&Number.isInteger(h.total)&&finite(h.total,1,questions.length)&&Number.isInteger(h.correct)&&finite(h.correct,0,h.total)&&Number.isInteger(h.wrong)&&finite(h.wrong,0,h.total)&&Number.isInteger(h.skipped)&&h.correct+h.wrong+h.skipped===h.total&&finite(h.skipped,0,h.total)&&h.percentage===Math.round(h.correct/h.total*100)).slice(-100).map(h=>({ended:h.ended,total:h.total,correct:h.correct,wrong:h.wrong,skipped:h.skipped,percentage:h.percentage}));
 return result;
}
