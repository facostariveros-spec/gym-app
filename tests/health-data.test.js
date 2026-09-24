const {test} = require('node:test');
const assert = require('node:assert/strict');
const health = require('../health-data.js');
const now = Date.parse('2026-09-24T08:00:00-06:00');
const sample = (start,end,stage='Core') => `${start}\t${end}\t${stage}`;
const row = (start,end,stage) => sample(`2026-09-24T${start}:00-06:00`,`2026-09-24T${end}:00-06:00`,stage);
const parse = (...rows) => health.parse({schemaVersion:2,restingHR:'62',sleepSamplesTSV:rows.join('\n')},now);
test('siesta y noche: no cuenta el hueco entre ambas',()=>{
  const result = parse(sample('2026-09-23T14:00:00-06:00','2026-09-23T15:00:00-06:00'),sample('2026-09-23T23:00:00-06:00','2026-09-24T07:00:00-06:00'));
  assert.equal(result.sleepHours,9); // El atajo anterior devolvía 17.
});
test('elimina duplicados y solapamientos entre fuentes y fases',()=>assert.equal(parse(row('00:00','06:00','Asleep'),row('00:00','06:00','Asleep'),row('00:00','02:00','Deep'),row('02:00','07:00','REM')).sleepHours,7));
test('excluye en cama y descuenta despertares incluso de muestras amplias',()=>assert.equal(parse(row('00:00','08:00','In Bed'),row('00:00','07:00','Asleep'),row('03:00','04:00','Awake'),row('03:30','04:00','Awake')).sleepHours,6));
test('intervalos adyacentes, desordenados y con huecos',()=>assert.equal(parse(row('05:00','07:00'),row('00:00','02:00'),row('02:00','03:00')).sleepHours,5));
test('recorta a las últimas 24 horas y al momento actual',()=>assert.equal(parse(sample('2026-09-23T07:00:00-06:00','2026-09-23T09:00:00-06:00'),row('07:00','10:00')).sleepHours,2));
test('fechas con distintos offsets y cambio de horario',()=>assert.equal(parse(sample('2026-09-24T00:00:00-05:00','2026-09-24T03:00:00-06:00')).sleepHours,4));
test('sin muestras y solo en cama significan sin datos, no cero horas',()=>{
  assert.equal(parse().sleepHours,null);
  assert.equal(parse(row('00:00','07:00','En cama')).sleepHours,null);
  assert.equal(parse().sleepStatus,'no-data');
});
test('fases españolas y códigos HealthKit',()=>assert.equal(parse(row('00:00','01:00','Sueño profundo'),row('01:00','02:00','Esencial'),row('02:00','03:00','5')).sleepHours,3));
test('rechaza muestras desconocidas, invertidas o sin zona sin mostrar un total parcial',()=>{
  for(const bad of [row('00:00','02:00','Desconocido'),row('03:00','02:00'),sample('2026-09-24T00:00:00','2026-09-24T02:00:00')]){
    const result=parse(row('04:00','06:00'),bad);
    assert.equal(result.sleepHours,null); assert.equal(result.sleepStatus,'invalid-samples');
  }
});
test('el contrato anterior no influye aunque envíe muchas horas',()=>{
  const result=health.parse({sleepHours:17,restingHR:'062'},now);
  assert.equal(result.sleepHours,null);assert.equal(result.restingHR,62);assert.equal(result.sleepStatus,'update-shortcut');
});
test('lectura de almacenamiento invalida datos antiguos y vencidos',()=>{
  assert.equal(health.stored({sleepHours:17,syncedAt:new Date(now).toISOString()},now).sleepHours,null);
  const result=parse(row('00:00','07:00'));
  assert.equal(health.stored(result,now).sleepHours,7);
  assert.equal(health.stored(result,now+86400000).sleepHours,null);
});
test('no acepta FC parcial, infinita ni valor vacío',()=>{
  for(const restingHR of ['62abc','Infinity','',null,{},-1]) assert.equal(health.parse({restingHR},now).restingHR,null);
});
