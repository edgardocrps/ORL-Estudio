import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {filterFigures,relatedFigures,atlasFiles,mediaCacheName} from '../atlas.js';
import {blankState,parseBackup,summarize,resetStudyProgress} from '../core.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url));
const atlas=JSON.parse(read('atlas.json')),bank=JSON.parse(read('bank.json'));
test('Every one of the 49 source figures is intact, attributed and linked to real bank questions',()=>{
 assert.equal(atlas.pages,224);assert.equal(atlas.figures.length,49);assert.equal(new Set(atlas.figures.map(f=>f.id)).size,49);
 let originals=0;
 for(const f of atlas.figures){const bytes=read(f.image);assert.equal(bytes.length,f.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.ok(f.caption&&f.page>=1&&f.page<=224);assert.ok(f.width>0&&f.height>0);assert.ok(f.questions.length);for(const id of f.questions)assert.ok(bank.questions.some(q=>q.id===id));originals+=bytes.length;}
 assert.equal(originals,10374238);assert.equal(atlas.references.length,14);assert.ok(atlas.references[0].startsWith('Alanís Ibarra'));assert.ok(atlas.references.some(r=>r.startsWith('Netter')));
 assert.equal(atlas.mediaBytes,atlasFiles(atlas).reduce((s,p)=>s+read(p).length,0));
});
test('Legends remain separate, with the continuation on page 224 and source orientation caveats',()=>{
 const larynx=atlas.figures.find(f=>f.id==='fig-049');assert.ok(larynx.guides.some(g=>g.page===224));
 for(const f of atlas.figures)for(const g of f.guides){const bytes=read(g.image);assert.equal(bytes.subarray(1,4).toString(),'PNG');}
 for(const id of ['fig-035','fig-036','fig-037','fig-038'])assert.ok(atlas.figures.find(f=>f.id===id).notes[0].includes('intercambian'));
 assert.equal(atlas.figures.find(f=>f.id==='fig-029').modality,'tc');assert.equal(atlas.figures.find(f=>f.id==='fig-030').modality,'rm');
});
test('Atlas filtering combines region, modality, accents, favorites and review flags',()=>{
 const records={'fig-032':{saved:true,rating:'again'},'fig-035':{saved:true,rating:'good'}};
 assert.deepEqual(filterFigures(atlas.figures,{region:'nariz',modality:'tc',search:'osteomeatal',pool:'again'},records).map(f=>f.id),['fig-032']);
 assert.equal(filterFigures(atlas.figures,{search:'TIMPANICA'}).length>=1,true);
 assert.equal(filterFigures(atlas.figures,{pool:'saved'},records).length,2);
 assert.ok(relatedFigures(atlas.figures,63).some(f=>f.id==='fig-008'));
});
test('Old backups gain an empty visual record; new visual backups preserve objective accuracy and daily counts',()=>{
 const old=blankState();delete old.atlasRecords;old.profile={name:'Prueba',role:'general',institution:''};
 const migrated=parseBackup({app:'orl-estudio',schema:1,state:old},bank.questions);assert.deepEqual(migrated.atlasRecords,{});
 const before=summarize(bank.questions,migrated);migrated.atlasRecords['fig-008']={rating:'good',saved:true,reviewedAt:1000};
 const roundtrip=parseBackup({app:'orl-estudio',schema:1,state:migrated},bank.questions);assert.deepEqual(roundtrip.atlasRecords,migrated.atlasRecords);assert.deepEqual(summarize(bank.questions,roundtrip),before);
 assert.deepEqual(resetStudyProgress(roundtrip).atlasRecords,{});assert.equal(resetStudyProgress(roundtrip).profile.name,'Prueba');
 assert.throws(()=>parseBackup({app:'orl-estudio',schema:1,state:{...old,atlasRecords:{'fig-999':{saved:true}}}},bank.questions));
});
test('Media manifests are local and scope-specific; all downloadable images exist',()=>{
 assert.notEqual(mediaCacheName('https://example.github.io/ORL-Estudio/'),mediaCacheName('https://example.github.io/another/'));
 assert.equal(atlasFiles(atlas).length,76);for(const path of atlasFiles(atlas)){assert.ok(path.startsWith('assets/atlas/')||path.startsWith('assets/examination/'));assert.ok(!path.includes('..'));assert.ok(read(path).length>0);}
});
