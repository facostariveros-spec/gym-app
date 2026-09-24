/* Sleep is measured as covered intervals, never first start -> last end. */
(function(root){
  const HOUR = 3600000;
  function number(value){
    if(typeof value !== 'number' && typeof value !== 'string') return null;
    if(typeof value === 'string') value = value.trim().replace(',', '.');
    if(value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function stage(value){
    const key = String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(['1','3','4','5','asleep','asleepunspecified','asleepcore','asleepdeep','asleeprem','core','deep','rem','dormido','dormida','dormidos','esencial','ligero','profundo','suenoligero','suenoesencial','suenoprofundo','suenorem','dormidoesencial','dormidoprofundo','dormidorem','dormidosinespecificar'].includes(key)) return 'asleep';
    if(['2','awake','despierto','despierta','vigilia'].includes(key)) return 'awake';
    if(['0','inbed','encama'].includes(key)) return 'inBed';
    return null;
  }
  function union(intervals){
    const result = [];
    for(const [start,end] of intervals.sort((a,b)=>a[0]-b[0])){
      const last = result[result.length-1];
      if(last && start <= last[1]) last[1] = Math.max(last[1],end);
      else result.push([start,end]);
    }
    return result;
  }
  function timestamp(value){
    // Require an explicit timezone; never reinterpret localized dates as UTC/local.
    if(typeof value !== 'string' || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return NaN;
    return Date.parse(value);
  }
  function parse(data, now = Date.now()){
    if(!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Respuesta de Salud inválida');
    const hr = number(data.restingHR);
    const result = { sleepHours:null, restingHR:hr > 0 && hr <= 300 ? hr : null,
      syncedAt:new Date(now).toISOString(), sleepMethod:'intervals-v2', sleepStatus:'update-shortcut' };
    if(Number(data.schemaVersion) !== 2 || typeof data.sleepSamplesTSV !== 'string') return result;
    const rows = data.sleepSamplesTSV.trim() ? data.sleepSamplesTSV.trim().split(/\r?\n/) : [];
    const asleep = [], awake = [];
    const windowStart = now - 24*HOUR;
    for(const row of rows){
      const fields = row.split('\t');
      const kind = stage(fields[2]);
      const start = timestamp(fields[0]), end = timestamp(fields[1]);
      if(fields.length !== 3 || !kind || !Number.isFinite(start) || !Number.isFinite(end) || end <= start){
        result.sleepStatus = 'invalid-samples';
        return result; // Do not silently display a partial total.
      }
      if(kind === 'inBed' || end <= windowStart || start >= now) continue;
      (kind === 'asleep' ? asleep : awake).push([Math.max(start,windowStart),Math.min(end,now)]);
    }
    const sleeping = union(asleep), waking = union(awake);
    let total = 0;
    for(const [start,end] of sleeping){
      total += end-start;
      // Explicit awake intervals take precedence over broad asleep records.
      for(const [a,b] of waking) total -= Math.max(0, Math.min(end,b)-Math.max(start,a));
    }
    result.sleepHours = sleeping.length ? Math.round(total/HOUR*100)/100 : null;
    result.sleepStatus = sleeping.length ? 'ok' : 'no-data';
    result.sleepWindowStart = new Date(windowStart).toISOString();
    result.sleepWindowEnd = new Date(now).toISOString();
    return result;
  }
  function stored(data, now = Date.now()){
    if(!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const result = {...data};
    if(data.sleepMethod !== 'intervals-v2'){
      result.sleepHours = null;
      result.sleepStatus = 'update-shortcut';
    }
    const age = now - Date.parse(data.syncedAt);
    if(!Number.isFinite(age) || age < 0 || age >= 24*HOUR){
      result.sleepHours = null;
      result.restingHR = null;
      result.sleepStatus = 'stale';
    }
    return result;
  }
  const api = {parse, stored};
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GymHealth = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
