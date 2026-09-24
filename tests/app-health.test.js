const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function app(payload){
  const storage = new Map(), root = {innerHTML:''};
  const query = payload ? '?'+new URLSearchParams({xcb:'health_success',result:JSON.stringify(payload)}) : '';
  const context = vm.createContext({console,URLSearchParams,setTimeout,clearTimeout,setInterval,clearInterval,
    location:{origin:'https://example.com',pathname:'/gym-app/',search:query},
    history:{replaceState(){}},navigator:{},window:{addEventListener(){}},
    document:{getElementById:()=>root},driveLog(){},DRIVE_CONNECTED_KEY:'drive',
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
  for(const file of ['health-data.js','app.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
  return {context,storage,root};
}
test('callback calcula, guarda y muestra el sueño; permite volver a sincronizar',()=>{
  const now=Date.now();
  const data={schemaVersion:2,restingHR:61,sleepSamplesTSV:`${new Date(now-8*3600000).toISOString()}\t${new Date(now-3600000).toISOString()}\tCore`};
  const {storage,root}=app(data);
  assert.equal(JSON.parse(storage.get('rutina-gym:health')).sleepHours,7);
  assert.match(root.innerHTML,/7\.0h/);
  assert.match(root.innerHTML,/openHealthSyncShortcut/);
  assert.match(root.innerHTML,/Leer-Salud-v2.shortcut/);
});
test('callback antiguo pide actualizar y no usa sus 17 horas',()=>{
  const {storage,root}=app({sleepHours:17,restingHR:61});
  assert.equal(JSON.parse(storage.get('rutina-gym:health')).sleepHours,null);
  assert.match(root.innerHTML,/Actualiza el atajo/);
  assert.doesNotMatch(root.innerHTML,/17\.0h/);
});
test('pelota: catálogo completo, filtro de equipo e imágenes sin enlaces rotos',()=>{
  const {context}=app();
  vm.runInContext(`
    const ball = EXERCISES.filter(e=>e.equip.includes('yoga_ball'));
    if(ball.length !== 6) throw Error('Catálogo incompleto');
    const onlyBall = generateRoutine(['yoga_ball'],['piernas','core'],{minExercises:6}).routine;
    if(onlyBall.length !== 6) throw Error('Rutina incompleta');
    const noBall = generateRoutine(['bodyweight'],['piernas','core'],{minExercises:6}).routine;
    if(noBall.some(e=>e.equip.includes('yoga_ball'))) throw Error('Filtro incorrecto');
    for(const ex of ball){
      if(renderIllustration(ex).includes('<img')) throw Error('Imagen inexistente');
      if(!renderExerciseThumbnail(ex).includes('🔵')) throw Error('Miniatura incorrecta');
    }
    if(!COMPLETE_GYM_EQUIPMENT.includes('yoga_ball')) throw Error('Falta equipo en preset');
  `,context);
});
