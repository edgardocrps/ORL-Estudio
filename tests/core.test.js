import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {blankState,filterBank,nextReview,scoreExam,summarize,parseBackup,shuffle,DAY} from '../core.js';
const bank=JSON.parse(fs.readFileSync(new URL('../bank.json',import.meta.url),'utf8'));
test('All 464 original questions have answers, sources, and valid selection keys',()=>{
 assert.equal(bank.questions.length,464);assert.equal(new Set(bank.questions.map(q=>q.id)).size,464);
 assert.equal(bank.questions.filter(q=>q.type==='mcq').length,94);assert.equal(bank.questions.filter(q=>q.type==='open').length,370);
 assert.deepEqual(bank.blocks.map(b=>b.count),[58,60,71,65,54,57,53,46]);
 for(const q of bank.questions){assert.ok(q.answer.length&&q.sources.length);if(q.type==='mcq'){assert.equal(q.options.length,4);assert.ok(q.options.some(o=>o.key===q.correct));}}
});
test('Exam scoring distinguishes incorrect answers, missing answers and correct answers',()=>{
 const qs=bank.questions.filter(q=>q.type==='mcq').slice(0,3);const bad=qs[1].options.find(o=>o.key!==qs[1].correct).key;
 const result=scoreExam(qs.map(q=>q.id),{[qs[0].id]:qs[0].correct,[qs[1].id]:bad},bank.questions);
 assert.deepEqual([result.correct,result.wrong,result.skipped,result.percentage],[1,1,1,33]);
 assert.equal(scoreExam([],{},bank.questions).percentage,0);
 const invalid=scoreExam([qs[0].id],{[qs[0].id]:'Z'},bank.questions);assert.equal(invalid.skipped,1);
});
test('Card confidence never inflates objective selection accuracy; progress retains favorites',()=>{
 const now=1000000;const r=nextReview({saved:true},{kind:'card',rating:'easy'},now);
 assert.equal(r.mcqAttempts,0);assert.equal(r.mcqCorrect,0);assert.equal(r.saved,true);assert.equal(r.due,now+7*DAY);
 const s=blankState();s.records[1]=r;const sums=summarize(bank.questions,s,now);assert.equal(sums.reviewed,1);assert.equal(sums.accuracy,null);
});
test('Failed answers and difficult cards enter review and can recover',()=>{
 let r=nextReview({}, {kind:'mcq',correct:false},1000);assert.equal(r.needsReview,true);assert.equal(r.due,601000);assert.equal(r.mcqAttempts,1);
 r=nextReview(r,{kind:'mcq',correct:true},2000);assert.equal(r.needsReview,false);assert.equal(r.mcqAttempts,2);assert.equal(r.mcqCorrect,1);
 const hard=nextReview({}, {kind:'card',rating:'hard'},1000);assert.equal(hard.needsReview,true);assert.equal(hard.due,1000+DAY);
});
test('Filters combine topic, difficulty, accents, format, errors, favorites and due time',()=>{
 const s=blankState();const q=bank.questions.find(q=>q.type==='mcq');s.records[q.id]={reviews:1,saved:true,needsReview:true,due:10};
 const filter={block:q.block,level:q.level,format:'mcq',pool:'saved'};assert.deepEqual(filterBank(bank.questions,s.records,filter).map(q=>q.id),[q.id]);
 assert.ok(filterBank(bank.questions,{}, {search:'craneo'}).some(q=>q.id===1));assert.equal(filterBank(bank.questions,s.records,{pool:'due'},9).length,0);assert.equal(filterBank(bank.questions,s.records,{pool:'due'},10).length,1);
 assert.equal(filterBank(bank.questions,s.records,{pool:'new'}).length,463);
});
test('Backup restores safe records, favorites and history without an unfinished session',()=>{
 const s=blankState();s.records[1]=nextReview({saved:true},{kind:'card',rating:'good'},1000);s.history=[{ended:5000,total:10,correct:6,wrong:3,skipped:1,percentage:60}];
 const restored=parseBackup(JSON.parse(JSON.stringify({app:'orl-estudio',schema:1,state:s})),bank.questions);
 assert.deepEqual(restored.records,s.records);assert.equal(restored.history.length,1);assert.equal(restored.session,null);
});
test('Malformed or incompatible backups are rejected instead of erasing progress',()=>{
 assert.throws(()=>parseBackup({app:'another-app'},bank.questions));
 const build=r=>({app:'orl-estudio',schema:1,state:{records:r}});
 assert.throws(()=>parseBackup(build({'9999':{reviews:1}}),bank.questions));
 assert.throws(()=>parseBackup(build({'1':{reviews:-1}}),bank.questions));
 assert.throws(()=>parseBackup(build({'1':{mcqAttempts:2,mcqCorrect:5}}),bank.questions));
 assert.throws(()=>parseBackup(build({'1':{saved:'yes'}}),bank.questions));
});
test('Shuffle does not mutate or drop questions',()=>{const input=[1,2,3,4];const out=shuffle(input,()=>.2);assert.deepEqual(input,[1,2,3,4]);assert.deepEqual([...out].sort(),input);});
test('Offline manifest has installable icons and every precached asset exists',()=>{
 const root=new URL('../',import.meta.url);const manifest=JSON.parse(fs.readFileSync(new URL('manifest.webmanifest',root),'utf8'));
 assert.equal(manifest.display,'standalone');assert.ok(manifest.icons.some(i=>i.sizes==='192x192'));assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
 for(const i of manifest.icons)assert.ok(fs.statSync(new URL(i.src,root)).size>0);
 const sw=fs.readFileSync(new URL('sw.js',root),'utf8');const paths=JSON.parse(sw.match(/const FILES=(\[.*?\]);/s)[1]);
 for(const path of paths)assert.ok(fs.existsSync(new URL(path==='./'?'index.html':path,root)));
 assert.ok(sw.includes('event.request.method'));assert.ok(!fs.readFileSync(new URL('index.html',root),'utf8').includes('http://'));
});
