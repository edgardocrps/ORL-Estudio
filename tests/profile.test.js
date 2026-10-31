import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {blankState,normalizeProfile,parseBackup,resetStudyProgress} from '../core.js';
const questions=JSON.parse(fs.readFileSync(new URL('../bank.json',import.meta.url),'utf8')).questions;
test('Older progress is preserved when the optional profile is introduced',()=>{
 const old={schema:1,records:{4:{reviews:3,mcqAttempts:3,mcqCorrect:2,saved:true,due:5000}},activity:{'2026-10-31':3},history:[],goal:30};
 const restored=parseBackup({app:'orl-estudio',schema:1,state:old},questions);
 assert.deepEqual(restored.records,old.records);assert.deepEqual(restored.activity,old.activity);assert.equal(restored.goal,30);
 assert.deepEqual(restored.profile,{name:'',role:'',institution:''});assert.equal(restored.profileOnboarded,false);
});
test('An exported profile can be restored along with its study records',()=>{
 const state=blankState();state.profile=normalizeProfile({name:'  Perfil   de prueba ',role:'general',institution:' Centro\tde prueba '});state.profileOnboarded=true;state.records[1]={reviews:2,saved:true};
 const restored=parseBackup(JSON.parse(JSON.stringify({app:'orl-estudio',schema:1,state})),questions);
 assert.deepEqual(restored.profile,{name:'Perfil de prueba',role:'general',institution:'Centro de prueba'});assert.equal(restored.profileOnboarded,true);assert.deepEqual(restored.records,state.records);
});
test('Resetting study progress keeps the local profile and chosen daily goal',()=>{
 const state=blankState();state.profile={name:'Alias de prueba',role:'student',institution:''};state.profileOnboarded=true;state.goal=50;state.records[4]={reviews:5,saved:true};state.activity={'2026-10-31':5};
 const reset=resetStudyProgress(state);assert.deepEqual(reset.profile,state.profile);assert.equal(reset.profileOnboarded,true);assert.equal(reset.goal,50);assert.deepEqual(reset.records,{});assert.deepEqual(reset.activity,{});
});
test('Profile validation rejects malformed backups without accepting arbitrary roles',()=>{
 for(const profile of [{name:123},{name:'x'.repeat(81)},{institution:'x'.repeat(121)},{role:'toString'},[],null])assert.throws(()=>normalizeProfile(profile));
 const restored=parseBackup({app:'orl-estudio',schema:1,state:{...blankState(),profile:{name:'',role:'',institution:''},profileOnboarded:true}},questions);assert.equal(restored.profileOnboarded,true);
 const first=blankState(),second=blankState();first.profile.name='Otra persona';assert.equal(second.profile.name,'');
});
