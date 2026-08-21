/* =========================================================
   MI RUTINA GYM — lógica principal
   Todo se guarda en localStorage: funciona 100% offline
   ========================================================= */

const WORK = 40;   // segundos de trabajo por ejercicio
const REST = 15;   // segundos de descanso entre ejercicios

/* ---------- Equipo disponible (marca/desmarca cada día) ---------- */
const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight',        label: 'Peso corporal',        icon: '🤸' },
  { id: 'dumbbells',         label: 'Mancuernas',           icon: '🏋️' },
  { id: 'barbell_rack',      label: 'Barra + Rack',         icon: '🏗️' },
  { id: 'bench',             label: 'Banca',                icon: '🛋️' },
  { id: 'cable_machine',     label: 'Polea / Cable',        icon: '🪢' },
  { id: 'leg_machine',       label: 'Máquina de pierna',    icon: '🦵' },
  { id: 'kettlebell',        label: 'Kettlebell',           icon: '🔔' },
  { id: 'resistance_band',   label: 'Banda elástica',       icon: '➰' },
  { id: 'pull_up_bar',       label: 'Barra de dominadas',   icon: '➖' },
  { id: 'elliptical_cardio', label: 'Elíptica / Cardio',    icon: '🚴' },
];

/* ---------- Grupos musculares (qué te sientes list @  para trabajar hoy) ---------- */
const MUSCLE_GROUPS = [
  { id: 'piernas',  label: 'Piernas',        icon: '🦵' },
  { id: 'pecho',    label: 'Pecho',          icon: '💪' },
  { id: 'espalda',  label: 'Espalda',        icon: '🔙' },
  { id: 'hombros',  label: 'Hombros',        icon: '🤷' },
  { id: 'brazos',   label: 'Brazos',         icon: '💪' },
  { id: 'core',     label: 'Core',           icon: '🧘' },
  { id: 'cardio',   label: 'Cardio',         icon: '🚴' },
];

/* ---------- Check-in: cómo te sientes + dolor por zona ---------- */
const FEELING_OPTIONS = [
  { id: 'cansado',  label: 'Cansado',      icon: '😞' },
  { id: 'normal',   label: 'Normal',       icon: '😐' },
  { id: 'energico', label: 'Con energía',  icon: '😊' },
];
const PAIN_ZONES = [
  { id: 'piernas',      label: 'Piernas',       icon: '🦵' },
  { id: 'espalda_baja', label: 'Espalda baja',  icon: '🔙' },
  { id: 'hombros',      label: 'Hombros',       icon: '🤷' },
  { id: 'rodillas',     label: 'Rodillas',      icon: '🦴' },
  { id: 'muñecas',      label: 'Muñecas',       icon: '✋' },
  { id: 'cuello',       label: 'Cuello',        icon: '🙆' },
  { id: 'ninguno',      label: 'Ninguno',       icon: '✅' },
];
// Ejercicios que se excluyen de la rutina si hay dolor marcado en esa zona
// (criterio biomecánico general, no una recomendación clínica).
const PAIN_EXERCISE_EXCLUSIONS = {
  rodillas:      ['squat_barbell','lunge_db','bw_squat','bw_lunge','goblet_squat','burpee'],
  espalda_baja:  ['rdl_barbell','rdl_db','row_barbell','kb_swing','burpee','superman'],
  hombros:       ['ohp_barbell','shoulder_press_db','pull_up','lat_pulldown'],
  muñecas:       ['pushup','plank','mountain_climber','burpee','bench_press_db'],
  cuello:        ['ohp_barbell','pull_up'],
};
// Mapeo más amplio zona -> grupo, solo para el aviso visual en la pantalla de grupos
// (la exclusión real de ejercicios ya la garantiza PAIN_EXERCISE_EXCLUSIONS).
const PAIN_GROUP_WARNING = {
  rodillas: ['piernas'],
  espalda_baja: ['espalda'],
  hombros: ['hombros'],
  muñecas: ['brazos','pecho'],
  cuello: ['hombros'],
};

/* ---------- Ilustración: fotos reales (free-exercise-db, dominio público) ---------- */
// Cada ejercicio con foto tiene exercises/<id>/0.jpg (inicio) y 1.jpg (final).
// Los 3 ejercicios sin match confiable en la base de fotos usan el dibujo SVG de respaldo.
const NO_PHOTO = new Set(['band_row', 'band_chest_press', 'burpee']);

// Dirección del movimiento para la flecha, por ejercicio (solo los que tienen foto).
const EX_DIRECTION = {
  squat_barbell:'down', rdl_barbell:'down', ohp_barbell:'up', row_barbell:'pull',
  shoulder_press_db:'up', curl_db:'up', bench_press_db:'up', row_one_arm_db:'pull',
  lunge_db:'down', rdl_db:'down', leg_curl_machine:'pull', leg_ext_machine:'up',
  cable_row:'pull', lat_pulldown:'pull', cable_chest_press:'push', cable_curl:'up',
  cable_tricep:'down', face_pull:'pull', kb_swing:'up', goblet_squat:'down',
  pull_up:'up', pushup:'up', bw_squat:'down', bw_lunge:'down',
  glute_bridge:'up', superman:'up',
  // elliptical, plank, mountain_climber: sin flecha (movimiento cíclico o sostenido)
};

function arrowIcon(dir){
  const c = 'var(--accent)';
  if(dir==='down') return `<svg viewBox="0 0 22 64"><path d="M8 4 C 18 18, 18 46, 10 60" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M3 51 L10 62 L17 50" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  if(dir==='up') return `<svg viewBox="0 0 22 64"><path d="M10 60 C 18 46, 18 18, 8 4" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M17 14 L10 2 L3 14" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  if(dir==='push') return `<svg viewBox="0 0 22 64"><path d="M4 14 C 16 24, 16 40, 4 50" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 42 L18 54 L8 60" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<svg viewBox="0 0 22 64"><path d="M18 14 C 6 24, 6 40, 18 50" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14 42 L4 54 L14 60" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`; // pull
}

function renderIllustration(ex){
  const dir = EX_DIRECTION[ex.id];
  const arrow = dir ? `<div class="illus-arrow">${arrowIcon(dir)}</div>` : `<div class="illus-arrow"></div>`;
  let frameA, frameB;
  if(NO_PHOTO.has(ex.id)){
    const svgs = FALLBACK_POSES[ex.pose]('#eae6dd', '#ffb020');
    const parts = svgs.trim().split('</svg>').filter(s=>s.trim()).map(s=>s+'</svg>');
    frameA = parts[0] || ''; frameB = parts[1] || '';
  } else {
    frameA = `<img src="exercises/${ex.id}/0.jpg" alt="${ex.name} - inicio" loading="lazy">`;
    frameB = `<img src="exercises/${ex.id}/1.jpg" alt="${ex.name} - final" loading="lazy">`;
  }
  return `
    <div class="photo-pair">
      <div class="photo-frame">${frameA}<div class="pose-tag">Inicio</div></div>
      ${arrow}
      <div class="photo-frame final">${frameB}<div class="pose-tag final">Final</div></div>
    </div>`;
}

/* ---------- Respaldo SVG: solo para ejercicios sin foto confiable disponible ---------- */
const FALLBACK_POSES = {
  press_horizontal: (a,b)=>`
    <svg viewBox="0 0 70 90"><ellipse cx="35" cy="55" rx="28" ry="6" fill="${a}" opacity="0.4"/>
    <circle cx="35" cy="30" r="7" fill="${a}"/>
    <line x1="35" y1="37" x2="35" y2="55" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="40" x2="15" y2="32" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="40" x2="55" y2="32" stroke="${a}" stroke-width="4" stroke-linecap="round"/></svg>
    <svg viewBox="0 0 70 90"><ellipse cx="35" cy="55" rx="28" ry="6" fill="${b}" opacity="0.4"/>
    <circle cx="35" cy="30" r="7" fill="${b}"/>
    <line x1="35" y1="37" x2="35" y2="55" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="42" x2="20" y2="55" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="42" x2="50" y2="55" stroke="${b}" stroke-width="4" stroke-linecap="round"/></svg>`,
  row: (a,b)=>`
    <svg viewBox="0 0 70 90"><circle cx="38" cy="18" r="7" fill="${a}"/>
    <line x1="38" y1="25" x2="38" y2="55" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="30" x2="55" y2="55" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="30" y2="82" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="46" y2="82" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg viewBox="0 0 70 90"><circle cx="38" cy="18" r="7" fill="${b}"/>
    <line x1="38" y1="25" x2="38" y2="55" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="30" x2="18" y2="34" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="30" y2="82" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="46" y2="82" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
  cardio: (a,b)=>`
    <svg viewBox="0 0 70 90"><circle cx="26" cy="20" r="7" fill="${a}"/>
    <line x1="26" y1="27" x2="30" y2="50" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="18" y2="45" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="45" y2="70" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="15" y2="75" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg viewBox="0 0 70 90"><circle cx="40" cy="20" r="7" fill="${b}"/>
    <line x1="40" y1="27" x2="34" y2="50" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="34" y1="50" x2="55" y2="42" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="34" y1="50" x2="20" y2="72" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="34" y1="50" x2="50" y2="78" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
};

/* ---------- Base de ejercicios ---------- */
// equip: lista de equipo con el que se puede hacer (basta con tener UNO de la lista)
const EXERCISES = [
  { id:'squat_barbell', name:'Sentadilla con barra', group:'piernas', equip:['barbell_rack'], sets:3, reps:'10 reps', pose:'squat',
    desc:'Pies al ancho de hombros, barra sobre la espalda alta. Baja hasta que los muslos queden paralelos al piso y empuja con los talones para subir.' },
  { id:'rdl_barbell', name:'Peso muerto rumano con barra', group:'piernas', equip:['barbell_rack'], sets:3, reps:'10 reps', pose:'hinge',
    desc:'Rodillas semi-flexionadas, baja la barra pegada a las piernas manteniendo la espalda recta. Siente el estiramiento en isquiotibiales.' },
  { id:'ohp_barbell', name:'Press militar con barra', group:'hombros', equip:['barbell_rack'], sets:3, reps:'8 reps', pose:'press_overhead',
    desc:'De pie, barra a la altura de clavícula. Empuja hacia arriba sin arquear la espalda, baja con control.' },
  { id:'row_barbell', name:'Remo con barra', group:'espalda', equip:['barbell_rack'], sets:3, reps:'10 reps', pose:'row',
    desc:'Torso inclinado ~45°, jala la barra hacia el abdomen apretando los omóplatos, baja controlado.' },
  { id:'shoulder_press_db', name:'Press de hombro con mancuernas', group:'hombros', equip:['dumbbells'], sets:3, reps:'10 reps', pose:'press_overhead',
    desc:'Sentado o de pie, mancuernas a la altura de los hombros. Empuja hacia arriba sin bloquear del todo los codos.' },
  { id:'curl_db', name:'Curl de bíceps con mancuernas', group:'brazos', equip:['dumbbells'], sets:3, reps:'12 reps', pose:'curl',
    desc:'Codos pegados al torso, sube la mancuerna contrayendo el bíceps, baja lento sin balancear el cuerpo.' },
  { id:'bench_press_db', name:'Press de banca con mancuernas', group:'pecho', equip:['dumbbells','bench'], sets:3, reps:'10 reps', pose:'press_horizontal',
    desc:'Acostado en la banca, empuja las mancuernas hacia arriba juntándolas ligeramente arriba, baja controlado.' },
  { id:'row_one_arm_db', name:'Remo a una mano con mancuerna', group:'espalda', equip:['dumbbells','bench'], sets:3, reps:'10 reps c/lado', pose:'row',
    desc:'Apoya rodilla y mano en la banca, jala la mancuerna hacia la cadera apretando el omóplato.' },
  { id:'lunge_db', name:'Zancadas con mancuernas', group:'piernas', equip:['dumbbells'], sets:3, reps:'10 reps c/pierna', pose:'squat',
    desc:'Da un paso al frente, baja la rodilla trasera casi al piso, empuja con el talón delantero para volver.' },
  { id:'rdl_db', name:'Peso muerto rumano con mancuernas', group:'piernas', equip:['dumbbells'], sets:3, reps:'10 reps', pose:'hinge',
    desc:'Igual que con barra: cadera atrás, espalda recta, baja las mancuernas pegadas a las piernas.' },
  { id:'leg_curl_machine', name:'Curl femoral en máquina', group:'piernas', equip:['leg_machine'], sets:3, reps:'12 reps', pose:'extension',
    desc:'Espalda apoyada, flexiona la rodilla llevando el rodillo hacia los glúteos, controla la bajada.' },
  { id:'leg_ext_machine', name:'Extensión de cuádriceps en máquina', group:'piernas', equip:['leg_machine'], sets:3, reps:'12 reps', pose:'extension',
    desc:'Extiende la rodilla contra el rodillo, aprieta arriba un segundo y baja despacio.' },
  { id:'cable_row', name:'Remo en polea', group:'espalda', equip:['cable_machine'], sets:3, reps:'10 reps', pose:'row',
    desc:'Espalda recta, jala hacia el abdomen apretando los omóplatos entre sí, evita balancear el torso.' },
  { id:'lat_pulldown', name:'Jalón al pecho en polea', group:'espalda', equip:['cable_machine'], sets:3, reps:'10 reps', pose:'pull_vertical',
    desc:'Agarre ancho, jala la barra hacia la parte alta del pecho llevando los codos hacia abajo y atrás.' },
  { id:'cable_chest_press', name:'Press de pecho en polea', group:'pecho', equip:['cable_machine'], sets:3, reps:'10 reps', pose:'press_horizontal',
    desc:'Poleas a la altura del pecho, empuja hacia el frente juntando las manos, controla el regreso.' },
  { id:'cable_curl', name:'Curl de bíceps en polea', group:'brazos', equip:['cable_machine'], sets:3, reps:'12 reps', pose:'curl',
    desc:'Codos fijos a los costados, sube la cuerda o barra contrayendo el bíceps.' },
  { id:'cable_tricep', name:'Extensión de tríceps en polea', group:'brazos', equip:['cable_machine'], sets:3, reps:'12 reps', pose:'extension',
    desc:'Codos pegados al torso, empuja la cuerda hacia abajo extendiendo el codo por completo.' },
  { id:'face_pull', name:'Face pull en polea', group:'hombros', equip:['cable_machine'], sets:3, reps:'12 reps', pose:'pull_vertical',
    desc:'Jala la cuerda hacia la cara separando las manos, codos altos, aprieta omóplatos.' },
  { id:'kb_swing', name:'Swing con kettlebell', group:'piernas', equip:['kettlebell'], sets:3, reps:'15 reps', pose:'hinge',
    desc:'Bisagra de cadera explosiva, el impulso viene de glúteos y caderas, no de los brazos.' },
  { id:'goblet_squat', name:'Sentadilla goblet con kettlebell', group:'piernas', equip:['kettlebell'], sets:3, reps:'12 reps', pose:'squat',
    desc:'Sostén la kettlebell frente al pecho, baja en sentadilla manteniendo el torso erguido.' },
  { id:'band_row', name:'Remo con banda elástica', group:'espalda', equip:['resistance_band'], sets:3, reps:'12 reps', pose:'row',
    desc:'Ancla la banda al frente, jala hacia el abdomen apretando los omóplatos.' },
  { id:'band_chest_press', name:'Press de pecho con banda', group:'pecho', equip:['resistance_band'], sets:3, reps:'12 reps', pose:'press_horizontal',
    desc:'Banda anclada detrás, empuja hacia el frente extendiendo los brazos con control.' },
  { id:'pull_up', name:'Dominadas', group:'espalda', equip:['pull_up_bar'], sets:3, reps:'6-8 reps', pose:'pull_vertical',
    desc:'Agarre firme, jala llevando el pecho hacia la barra, baja con control total.' },
  { id:'elliptical', name:'Elíptica', group:'cardio', equip:['elliptical_cardio'], sets:1, reps:'2 min', pose:'cardio',
    desc:'Ritmo moderado-alto, mantén el torso erguido y usa brazos y piernas por igual.' },
  { id:'pushup', name:'Flexiones', group:'pecho', equip:['bodyweight'], sets:3, reps:'12 reps', pose:'press_horizontal',
    desc:'Cuerpo recto de cabeza a talones, baja el pecho casi al piso y empuja de vuelta arriba.' },
  { id:'bw_squat', name:'Sentadilla sin peso', group:'piernas', equip:['bodyweight'], sets:3, reps:'15 reps', pose:'squat',
    desc:'Pies al ancho de hombros, baja como sentándote en una silla, rodillas alineadas con los pies.' },
  { id:'plank', name:'Plancha', group:'core', equip:['bodyweight'], sets:3, reps:'30-40 seg', pose:'plank',
    desc:'Cuerpo alineado en línea recta, abdomen contraído, evita que la cadera caiga o suba.' },
  { id:'bw_lunge', name:'Zancadas sin peso', group:'piernas', equip:['bodyweight'], sets:3, reps:'12 reps c/pierna', pose:'squat',
    desc:'Paso al frente, baja la rodilla trasera casi al piso, vuelve empujando con el talón delantero.' },
  { id:'burpee', name:'Burpees', group:'cardio', equip:['bodyweight'], sets:3, reps:'10 reps', pose:'cardio',
    desc:'De pie a plancha, flexión opcional, salta los pies hacia las manos y salta arriba.' },
  { id:'mountain_climber', name:'Mountain climbers', group:'core', equip:['bodyweight'], sets:3, reps:'30 seg', pose:'core_dynamic',
    desc:'En posición de plancha, lleva las rodillas al pecho alternando rápido, cadera estable.' },
  { id:'glute_bridge', name:'Puente de glúteo', group:'piernas', equip:['bodyweight'], sets:3, reps:'15 reps', pose:'hinge',
    desc:'Acostado boca arriba, empuja la cadera hacia arriba apretando los glúteos, baja con control.' },
  { id:'superman', name:'Superman', group:'core', equip:['bodyweight'], sets:3, reps:'12 reps', pose:'core_dynamic',
    desc:'Boca abajo, levanta brazos y piernas a la vez apretando la espalda baja, baja despacio.' },
];

/* ---------- Estiramientos sugeridos según grupo trabajado ---------- */
const STRETCHES = {
  piernas: 'Estira cuádriceps de pie (30s c/pierna) y isquiotibiales sentado con pierna extendida (30s c/lado).',
  pecho: 'Estira el pecho apoyando el antebrazo en un marco de puerta, gira el torso suavemente (30s c/lado).',
  espalda: 'Estiramiento de gato-camello y jalón de brazos cruzados frente al pecho (30s c/lado).',
  hombros: 'Cruza un brazo frente al pecho sujetándolo con el otro brazo (30s c/lado).',
  brazos: 'Extiende el brazo y jala los dedos hacia atrás para estirar antebrazo, tríceps por encima de la cabeza (20s c/lado).',
  core: 'Postura de niño o cobra suave para descomprimir la zona lumbar (30-40s).',
  cardio: 'Camina 1-2 min a paso lento para bajar el ritmo cardiaco antes de estirar.',
};

/* ================= STORAGE (localStorage, offline) ================= */
const LS_SETTINGS = 'rutina-gym:settings';
const LS_HISTORY  = 'rutina-gym:history';
const LS_HEALTH   = 'rutina-gym:health';

function loadSettings(){
  try{
    const raw = localStorage.getItem(LS_SETTINGS);
    return raw ? JSON.parse(raw) : { equipment: ['bodyweight','dumbbells'] };
  }catch(e){ return { equipment: ['bodyweight','dumbbells'] }; }
}
function saveSettings(s){
  try{ localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); }catch(e){}
}
function loadHistory(){
  try{
    const raw = localStorage.getItem(LS_HISTORY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveHistorySession(session){
  const h = loadHistory();
  h.unshift(session); // más reciente primero
  try{ localStorage.setItem(LS_HISTORY, JSON.stringify(h.slice(0,200))); }catch(e){}
}
// Identificador estable de una sesión, aunque sea vieja y no tenga completedAt.
function sessionKey(s){
  return (s.completedAt || s.date || '') + '|' + (s.exerciseIds||[]).join(',');
}
// Borra una sesión local y, si Drive está conectado, vuelve a subir el historial
// ya sin ella (Drive guarda el respaldo completo, no hay borrado por-entrada en su API).
function deleteHistorySession(key){
  const h = loadHistory().filter(s => sessionKey(s) !== key);
  try{ localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }catch(e){}
  state.confirmDeleteKey = null;
  if(typeof DriveSync !== 'undefined' && DriveSync.connected){
    state.syncStatus = 'syncing'; render();
    DriveSync.connect(async ()=>{
      try{
        const payload = { settings: loadSettings(), history: h, savedAt: new Date().toISOString() };
        await DriveSync.upload(payload);
        state.syncStatus = 'ok';
      }catch(e){ console.error('No se pudo borrar la sesión en Drive', e); state.syncStatus = 'error'; }
      render();
    });
  } else {
    render();
  }
}
function requestDeleteSession(key){
  state.confirmDeleteKey = key;
  render();
}
function cancelDeleteSession(){
  state.confirmDeleteKey = null;
  render();
}
function loadHealth(){
  try{
    const raw = localStorage.getItem(LS_HEALTH);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function saveHealth(h){
  try{ localStorage.setItem(LS_HEALTH, JSON.stringify(h)); }catch(e){}
}

/* ---------- Calorías estimadas: fórmula MET estándar ----------
   kcal/min = MET x 3.5 x peso(kg) / 200 (fórmula estándar de gasto energético)
   Valores MET aproximados del Compendium of Physical Activities, por categoría:
   ------------------------------------------------------------- */
const MET_FUERZA = 5.0;  // entrenamiento de fuerza con pesas/máquina/banda, esfuerzo moderado-vigoroso
const MET_CARDIO = 7.0;  // cardio moderado-vigoroso (elíptica, burpees)
const MET_CORE   = 3.8;  // core / abdominales, esfuerzo moderado
const MET_REST   = 1.3;  // de pie, descanso ligero entre estaciones

function metForGroup(group){
  if(group === 'cardio') return MET_CARDIO;
  if(group === 'core') return MET_CORE;
  return MET_FUERZA;
}
function computeCalories(exerciseLog, restSeconds, weightKg){
  if(!weightKg || weightKg <= 0) return null;
  let cal = 0;
  (exerciseLog||[]).forEach(e=>{
    const minutes = e.seconds / 60;
    cal += metForGroup(e.group) * 3.5 * weightKg / 200 * minutes;
  });
  cal += MET_REST * 3.5 * weightKg / 200 * ((restSeconds||0) / 60);
  return Math.round(cal);
}

/* ---------- Helpers de historial: grupos musculares, timestamps, recuperación ---------- */
const RECOVERY_HOURS = 24; // debajo de esto, avisamos que el grupo quizás no se ha recuperado

function sessionGroups(session){
  if(session.groups) return session.groups;
  // sesiones viejas sin campo "groups": lo derivamos de los ejercicios (mejor esfuerzo)
  if(!session.exerciseIds) return [];
  const set = new Set();
  session.exerciseIds.forEach(id=>{
    const ex = EXERCISES.find(e=>e.id===id);
    if(ex) set.add(ex.group);
  });
  return [...set];
}
function sessionTimestamp(session){
  if(session.completedAt) return new Date(session.completedAt).getTime();
  if(session.date) return new Date(session.date + 'T12:00:00').getTime(); // sesiones viejas: solo fecha, sin hora
  return null;
}
function hoursSinceGroupTrained(group, history){
  let best = null;
  for(const s of history){
    if(sessionGroups(s).includes(group)){
      const ts = sessionTimestamp(s);
      if(ts != null && (best === null || ts > best)) best = ts;
    }
  }
  return best === null ? null : (Date.now() - best) / 3600000;
}
function formatHoursAgo(h){
  if(h == null) return null;
  if(h < 1) return 'hace <1h';
  if(h < 48) return `hace ${Math.round(h)}h`;
  return `hace ${Math.round(h/24)}d`;
}
function mergeHistories(localHist, driveHist){
  const map = new Map();
  (driveHist||[]).forEach(s=> map.set(sessionKey(s), s));
  (localHist||[]).forEach(s=> map.set(sessionKey(s), s)); // local gana en empate
  return [...map.values()].sort((a,b)=> (sessionTimestamp(b)||0) - (sessionTimestamp(a)||0));
}
function analyzeForRecommendation(history){
  if(!history || history.length < 4) return null; // no hay suficiente histórico todavía
  const stats = MUSCLE_GROUPS.map(m=>{
    const h = hoursSinceGroupTrained(m.id, history);
    return { id: m.id, label: m.label, daysSince: h == null ? Infinity : h / 24 };
  });
  stats.sort((a,b)=> b.daysSince - a.daysSince);
  let picks = stats.filter(s => s.daysSince >= 2).slice(0, 3);
  if(picks.length < 2) picks = stats.slice(0, 2);
  const finiteDays = picks.map(p=>p.daysSince).filter(d=>isFinite(d));
  const allNever = finiteDays.length === 0;
  let detail;
  if(allNever){
    detail = 'nunca los has trabajado en tu historial';
  } else {
    const minDays = Math.floor(Math.min(...finiteDays));
    detail = minDays <= 0 ? 'llevas menos de 1 día sin trabajarlos' : `llevas ${minDays} día${minDays===1?'':'s'} sin trabajarlos`;
  }
  return { groups: picks.map(p=>p.id), labels: picks.map(p=>p.label), detail };
}

/* ================= GENERADOR DE RUTINA (evita repetir) ================= */
function lastUsedDate(exId, history){
  for(const session of history){
    if(session.exerciseIds && session.exerciseIds.includes(exId)) return session.date;
  }
  return null; // nunca usado
}

function generateRoutine(equipment, muscleGroups, opts){
  opts = opts || {};
  const excludeIds = opts.excludeIds || [];
  const setsAdjust = opts.setsAdjust || 0;
  const history = loadHistory();
  const lastSession = history[0];
  const lastSessionIds = lastSession ? (lastSession.exerciseIds||[]) : [];

  const picked = [];
  const skippedGroups = []; // grupos elegidos pero sin ningún ejercicio seguro (todo excluido por dolor)
  const order = ['piernas','pecho','espalda','hombros','brazos','core','cardio'];
  let groupsToUse = order.filter(g => muscleGroups.includes(g));
  if(opts.maxStations) groupsToUse = groupsToUse.slice(0, opts.maxStations);

  groupsToUse.forEach(group=>{
    const allCandidates = EXERCISES.filter(ex =>
      ex.group === group && ex.equip.some(eq => equipment.includes(eq))
    );
    if(allCandidates.length === 0) return; // no hay equipo para ese grupo hoy

    const candidates = allCandidates.filter(ex => !excludeIds.includes(ex.id));
    if(candidates.length === 0){ skippedGroups.push(group); return; } // todo lo disponible está excluido por dolor

    // evita repetir el ejercicio exacto de la sesión inmediatamente anterior si hay alternativa
    const notLastSession = candidates.filter(c => !lastSessionIds.includes(c.id));
    const pool = notLastSession.length > 0 ? notLastSession : candidates;

    // entre los candidatos, prioriza el que lleva más tiempo sin usarse
    pool.sort((c1,c2)=>{
      const d1 = lastUsedDate(c1.id, history);
      const d2 = lastUsedDate(c2.id, history);
      if(d1 === null && d2 === null) return 0;
      if(d1 === null) return -1;
      if(d2 === null) return 1;
      return new Date(d1) - new Date(d2);
    });

    // copia superficial: el usuario puede editar series/reps de la rutina de hoy sin tocar EXERCISES
    const ex = { ...pool[0] };
    if(setsAdjust) ex.sets = Math.min(6, Math.max(1, (ex.sets||1) + setsAdjust));
    picked.push(ex);
  });

  return { routine: picked, skippedGroups };
}

// Arma la lista real de estaciones a recorrer (una por cada serie de cada ejercicio),
// según el estilo elegido: 'circuito' rota entre ejercicios por ronda, 'porEjercicio'
// completa todas las series de un ejercicio antes de pasar al siguiente.
function buildPlan(routine, style){
  const plan = [];
  if(style === 'porEjercicio'){
    routine.forEach(ex=>{
      const totalSets = ex.sets || 1;
      for(let s=1; s<=totalSets; s++) plan.push({ exercise: ex, setNumber: s, totalSets });
    });
  } else {
    const maxSets = routine.reduce((m,ex)=> Math.max(m, ex.sets || 1), 1);
    for(let round=1; round<=maxSets; round++){
      routine.forEach(ex=>{
        const totalSets = ex.sets || 1;
        if(round <= totalSets) plan.push({ exercise: ex, setNumber: round, totalSets });
      });
    }
  }
  return plan;
}

/* ================= ESTADO DE LA APP ================= */
let state = {
  tab: 'rutina',            // 'rutina' | 'historial' | 'nube'
  screen: 'checkin',        // checkin -> equip -> muscles -> overview -> workout -> rest -> done
  feeling: 'normal',        // 'cansado' | 'normal' | 'energico'
  painZones: [],            // ids de PAIN_ZONES marcados (excluye 'ninguno' de la lógica real)
  intensityOverride: null,  // 'suave' | 'normal' | 'desafiante' | null — forzado manual en check-in
  intensityResult: null,    // { level, note, workSeconds, maxStations, setsAdjust, excludeIds }
  equipment: [],
  muscleGroups: [],
  routine: [],
  skippedGroups: [],        // grupos seleccionados que se omitieron por no tener alternativa sin dolor
  workoutStyle: 'circuito', // 'circuito' | 'porEjercicio' — se carga desde settings al iniciar
  plan: [],                 // estaciones reales a recorrer (una por cada serie), armadas al empezar
  step: 0,
  secondsLeft: WORK,
  workSeconds: WORK,        // segundos de trabajo de la sesión (viene del check-in de intensidad)
  maxStations: null,        // límite de estaciones si la intensidad está reducida
  intensityNote: '',
  driveRecommendation: null,  // { groups, labels, detail } basado en historial completo de Drive
  driveRecStatus: 'idle',     // idle | loading | ready | unavailable
  startedAt: null,
  segmentStartedAt: null,   // timestamp del inicio de la estación/descanso actual (para tiempo real)
  exerciseLog: [],          // [{ id, group, seconds }] segundos reales trabajados por ejercicio
  restSecondsTotal: 0,      // segundos reales de descanso acumulados
  weightSaveStatus: 'idle', // idle | ok | error
  confirmDeleteKey: null,   // sessionKey() de la sesión de historial pendiente de confirmar borrado
  confirmEndEarly: false,   // true mientras se muestra el aviso de "¿terminar antes de tiempo?"
  lastSession: null,
  healthLogStatus: 'idle',  // idle | ok
  health: null,             // { sleepHours, restingHR, syncedAt }
  timerId: null,
  syncStatus: 'idle',       // idle | syncing | ok | error
};

/* ---------- Google Drive: inicializar y auto-sync ---------- */
if(typeof DriveSync !== 'undefined'){
  DriveSync.init(()=>{ /* listo para usarse */ });
}
function connectDrive(){
  state.syncStatus = 'syncing'; render();
  DriveSync.connect(()=>{
    state.syncStatus = 'ok';
    render();
  });
}
function disconnectDrive(){
  DriveSync.disconnect();
  state.syncStatus = 'idle';
  render();
}
function syncNow(){
  state.syncStatus = 'syncing'; render();
  DriveSync.connect(async ()=>{
    try{
      const payload = { settings: loadSettings(), history: loadHistory(), savedAt: new Date().toISOString() };
      await DriveSync.upload(payload);
      state.syncStatus = 'ok';
    }catch(e){ console.error(e); state.syncStatus = 'error'; }
    render();
  });
}
function restoreFromDrive(){
  state.syncStatus = 'syncing'; render();
  DriveSync.connect(async ()=>{
    try{
      const data = await DriveSync.download();
      if(data){
        if(data.settings) saveSettings(data.settings);
        if(data.history) localStorage.setItem(LS_HISTORY, JSON.stringify(data.history));
        initState();
      }
      state.syncStatus = 'ok';
    }catch(e){ console.error(e); state.syncStatus = 'error'; }
    render();
  });
}
function autoSyncIfConnected(){
  if(typeof DriveSync === 'undefined' || !DriveSync.connected) return;
  const payload = { settings: loadSettings(), history: loadHistory(), savedAt: new Date().toISOString() };
  DriveSync.upload(payload).catch(e=>console.error('auto-sync falló', e));
}
function fetchDriveRecommendation(){
  if(typeof DriveSync === 'undefined' || !DriveSync.connected) return;
  if(state.driveRecStatus === 'loading' || state.driveRecStatus === 'ready') return; // ya en curso o ya lista
  state.driveRecStatus = 'loading';
  DriveSync.connect(async ()=>{
    try{
      const data = await DriveSync.download();
      const driveHist = (data && data.history) || [];
      const merged = mergeHistories(loadHistory(), driveHist);
      const rec = analyzeForRecommendation(merged);
      state.driveRecommendation = rec;
      state.driveRecStatus = rec ? 'ready' : 'unavailable';
      if(rec) state.muscleGroups = [...rec.groups]; // pre-selección real, no solo sugerencia
    }catch(e){
      console.error('No se pudo traer historial de Drive para la recomendación', e);
      state.driveRecStatus = 'unavailable';
    }
    render();
  });
}
function useRecommendation(){
  if(!state.driveRecommendation) return;
  state.muscleGroups = [...state.driveRecommendation.groups];
  render();
}

function initState(){
  const settings = loadSettings();
  state.equipment = settings.equipment.length ? settings.equipment : ['bodyweight'];
  state.muscleGroups = MUSCLE_GROUPS.map(m=>m.id); // por defecto todo marcado; el check-in lo pre-ajusta si hay Drive
  state.screen = 'checkin';
  state.health = loadHealth();
  state.workoutStyle = settings.workoutStyle === 'porEjercicio' ? 'porEjercicio' : 'circuito';
  state.feeling = 'normal';
  state.painZones = [];
  state.intensityOverride = null;
  state.intensityResult = null;
}
initState();

/* ---------- Puente con Apple Health vía Apple Shortcuts ---------- */
const HEALTH_SYNC_SHORTCUT = 'Rutina Gym - Leer Salud';
const HEALTH_LOG_SHORTCUT  = 'Rutina Gym - Registrar Entrenamiento';

function appBaseUrl(){
  return location.origin + location.pathname;
}
function timeAgo(iso){
  if(!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime())/60000);
  if(mins < 1) return 'justo ahora';
  if(mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins/60);
  if(hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.round(hrs/24)} d`;
}
function openHealthSyncShortcut(){
  const successUrl = encodeURIComponent(appBaseUrl() + '?xcb=health_success');
  const cancelUrl  = encodeURIComponent(appBaseUrl() + '?xcb=health_cancel');
  const url = `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(HEALTH_SYNC_SHORTCUT)}`
    + `&x-success=${successUrl}&x-cancel=${cancelUrl}`;
  window.location.href = url;
}
function buildHealthLogUrl(payload){
  const text = encodeURIComponent(JSON.stringify(payload));
  const successUrl = encodeURIComponent(appBaseUrl() + '?xcb=log_success');
  const cancelUrl  = encodeURIComponent(appBaseUrl() + '?xcb=log_cancel');
  const url = `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(HEALTH_LOG_SHORTCUT)}`
    + `&input=text&text=${text}&x-success=${successUrl}&x-cancel=${cancelUrl}`;
  console.log('[Apple Health] JSON enviado:', JSON.stringify(payload));
  console.log('[Apple Health] URL completa:', url);
  return url;
}
function openHealthLogShortcut(){
  const s = state.lastSession;
  if(!s) return;
  const restingHR = state.health ? state.health.restingHR : null;
  const payload = {
    durationMinutes: s.durationMinutes,
    esCardio: s.esCardio,
    fecha: s.date,
    baselineCalories: s.calories || 0,
    restingHR: restingHR || 0,
  };
  window.location.href = buildHealthLogUrl(payload);
}
// Consolida las 3 señales del check-in (cómo te sientes, dolor por zona, Apple Health)
// en UN nivel de intensidad para toda la sesión. "Suave" gana si hay conflicto entre
// señales (lectura conservadora): basta una sola señal negativa para bajar el nivel,
// pero "Desafiante" necesita que TODAS las señales sean positivas.
function computeIntensityLevel(feeling, painZones, health){
  const realPainZones = (painZones||[]).filter(z => z !== 'ninguno');
  const lowSleep = !!(health && typeof health.sleepHours === 'number' && health.sleepHours < 6);
  // "bien dormido" es permisivo si no hay dato: la falta de info de salud no debe bloquear "Desafiante"
  const goodSleep = !health || typeof health.sleepHours !== 'number' || health.sleepHours >= 7;
  const highHR = !!(health && typeof health.restingHR === 'number' && health.restingHR > 75);
  const tired = feeling === 'cansado';
  const energetic = feeling === 'energico';
  const manyPain = realPainZones.length >= 2;
  const noPain = realPainZones.length === 0;

  let level;
  if(tired || lowSleep || highHR || manyPain) level = 'suave';
  else if(energetic && goodSleep && noPain) level = 'desafiante';
  else level = 'normal';

  const excludeIds = new Set();
  realPainZones.forEach(zone=>{
    (PAIN_EXERCISE_EXCLUSIONS[zone]||[]).forEach(id=>excludeIds.add(id));
  });

  const setsAdjust = level === 'suave' ? -1 : level === 'desafiante' ? 1 : 0;
  const workSeconds = level === 'suave' ? Math.max(25, WORK - 10) : WORK;
  const maxStations = level === 'suave' ? 4 : null;

  const hasGoodSleepData = !!(health && typeof health.sleepHours === 'number' && health.sleepHours >= 7);
  const reasons = [];
  if(tired) reasons.push('te sientes cansado');
  if(lowSleep) reasons.push(`dormiste ${health.sleepHours.toFixed(1)}h`);
  if(highHR) reasons.push(`tu FC en reposo (${health.restingHR} bpm) está algo alta`);
  if(manyPain) reasons.push(`dolor en ${realPainZones.length} zonas`);
  if(level === 'desafiante'){
    reasons.push('te sientes con energía');
    if(hasGoodSleepData) reasons.push('dormiste bien'); // solo lo afirmamos si de verdad tenemos el dato
  }

  const levelLabel = { suave:'Suave', normal:'Normal', desafiante:'Desafiante' }[level];
  let note = `Hoy: rutina ${levelLabel}`;
  if(reasons.length) note += ` — ajustada por ${reasons.join(', ')}`;
  note += '.';
  if(realPainZones.length){
    const zoneLabels = realPainZones.map(z => ((PAIN_ZONES.find(p=>p.id===z)||{}).label || z).toLowerCase());
    note += ` Evitamos ejercicios de ${zoneLabels.join(', ')}.`;
  }
  if(level === 'desafiante') note += ' Si puedes, sube un poco el peso.';

  return { level, note, workSeconds, maxStations, setsAdjust, excludeIds: [...excludeIds] };
}
function handleShortcutCallback(){
  const params = new URLSearchParams(location.search);
  const xcb = params.get('xcb');
  if(!xcb) return;
  if(xcb === 'health_success'){
    const raw = params.get('result');
    if(raw){
      try{
        const data = JSON.parse(raw);
        const sleepHours = typeof data.sleepHours === 'number' ? data.sleepHours : parseFloat(data.sleepHours);
        const restingHR = typeof data.restingHR === 'number' ? data.restingHR : parseInt(data.restingHR, 10);
        const health = {
          sleepHours: isNaN(sleepHours) ? null : sleepHours,
          restingHR: isNaN(restingHR) ? null : restingHR,
          syncedAt: new Date().toISOString(),
        };
        saveHealth(health);
        state.health = health;
      }catch(e){ console.error('No se pudo leer el resultado del Shortcut', e); }
    }
  } else if(xcb === 'log_success'){
    restoreLastSessionForDone();
    const raw = params.get('result');
    if(raw && state.lastSession){
      try{
        const data = JSON.parse(raw);
        let cal = typeof data.calorias === 'number' ? data.calorias : parseFloat(data.calorias);
        if(!isNaN(cal) && cal > 0){
          // límite de seguridad ante datos de FC atípicos: no dejar que se dispare fuera de un rango razonable
          const baseline = state.lastSession.calories || cal;
          cal = Math.round(Math.min(baseline * 3, Math.max(baseline * 0.5, cal)));
          state.lastSession.calories = cal;
          updateLastHistorySessionCalories(cal);
          autoSyncIfConnected();
        }
      }catch(e){ console.error('No se pudo leer las calorías ajustadas por FC', e); }
    }
    state.healthLogStatus = 'ok';
  }
  history.replaceState(null, '', appBaseUrl());
}
function restoreLastSessionForDone(){
  const h = loadHistory();
  if(h.length && h[0].completedAt){
    const ageMin = (Date.now() - new Date(h[0].completedAt).getTime()) / 60000;
    if(ageMin < 120){ // solo si es una sesión reciente, evita saltar al "done" de algo viejo
      state.lastSession = h[0];
      state.screen = 'done';
      state.tab = 'rutina';
    }
  }
}
function updateLastHistorySessionCalories(cal){
  const h = loadHistory();
  if(h.length && state.lastSession && h[0].completedAt === state.lastSession.completedAt){
    h[0].calories = cal;
    try{ localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }catch(e){}
  }
}

function clearTimer(){ if(state.timerId){ clearInterval(state.timerId); state.timerId=null; } }

function fmt(s){
  const m = Math.floor(s/60);
  const ss = (s%60).toString().padStart(2,'0');
  return `${m}:${ss}`;
}

/* ---------- Navegación entre pasos ---------- */
function selectFeeling(id){
  state.feeling = id;
  render();
}
function togglePainZone(id){
  if(id === 'ninguno'){
    state.painZones = state.painZones.includes('ninguno') ? [] : ['ninguno'];
  } else {
    state.painZones = state.painZones.filter(z => z !== 'ninguno');
    const i = state.painZones.indexOf(id);
    if(i>=0) state.painZones.splice(i,1); else state.painZones.push(id);
  }
  render();
}
function setIntensityOverride(level){
  state.intensityOverride = state.intensityOverride === level ? null : level;
  render();
}
function confirmCheckin(){
  const computed = computeIntensityLevel(state.feeling, state.painZones, state.health);
  let result = computed;
  if(state.intensityOverride && state.intensityOverride !== computed.level){
    // el usuario forzó un nivel distinto al calculado: las exclusiones por dolor
    // se mantienen siempre (son un tema de seguridad, no de energía subjetiva)
    const lvl = state.intensityOverride;
    const setsAdjust = lvl === 'suave' ? -1 : lvl === 'desafiante' ? 1 : 0;
    const workSeconds = lvl === 'suave' ? Math.max(25, WORK - 10) : WORK;
    const maxStations = lvl === 'suave' ? 4 : null;
    const levelLabel = { suave:'Suave', normal:'Normal', desafiante:'Desafiante' }[lvl];
    let note = `Hoy: rutina ${levelLabel} (ajustado manualmente).`;
    if(computed.excludeIds.length){
      const realPainZones = state.painZones.filter(z => z !== 'ninguno');
      const zoneLabels = realPainZones.map(z => ((PAIN_ZONES.find(p=>p.id===z)||{}).label || z).toLowerCase());
      note += ` Evitamos ejercicios de ${zoneLabels.join(', ')}.`;
    }
    result = { level: lvl, note, workSeconds, maxStations, setsAdjust, excludeIds: computed.excludeIds };
  }
  state.intensityResult = result;
  state.screen = 'equip';
  fetchDriveRecommendation();
  render();
}
function backToCheckin(){ state.screen = 'checkin'; render(); }
function toggleEquip(id){
  const i = state.equipment.indexOf(id);
  if(i>=0) state.equipment.splice(i,1); else state.equipment.push(id);
  render();
}
function confirmEquip(){
  saveSettings({ ...loadSettings(), equipment: state.equipment });
  state.screen = 'muscles';
  render();
}
function toggleMuscle(id){
  const i = state.muscleGroups.indexOf(id);
  if(i>=0) state.muscleGroups.splice(i,1); else state.muscleGroups.push(id);
  render();
}
function confirmMuscles(){
  if(state.muscleGroups.length === 0){ return; }
  const intensity = state.intensityResult || { workSeconds: WORK, maxStations: null, setsAdjust: 0, excludeIds: [], note: '' };
  state.workSeconds = intensity.workSeconds;
  state.maxStations = intensity.maxStations;
  state.intensityNote = intensity.note;
  const result = generateRoutine(state.equipment, state.muscleGroups, {
    maxStations: state.maxStations, excludeIds: intensity.excludeIds, setsAdjust: intensity.setsAdjust,
  });
  state.routine = result.routine;
  state.skippedGroups = result.skippedGroups;
  state.screen = 'overview';
  render();
}
function regenerate(){
  const intensity = state.intensityResult || { maxStations: state.maxStations, setsAdjust: 0, excludeIds: [] };
  const result = generateRoutine(state.equipment, state.muscleGroups, {
    maxStations: state.maxStations, excludeIds: intensity.excludeIds, setsAdjust: intensity.setsAdjust,
  });
  state.routine = result.routine;
  state.skippedGroups = result.skippedGroups;
  render();
}
function adjustSets(i, delta){
  const ex = state.routine[i];
  if(!ex) return;
  ex.sets = Math.min(6, Math.max(1, (ex.sets||1) + delta));
  render();
}
function setWorkoutStyle(style){
  state.workoutStyle = style;
  saveSettings({ ...loadSettings(), workoutStyle: style });
  render();
}
function backToEquip(){ state.screen='equip'; render(); }
function backToMuscles(){ state.screen='muscles'; render(); }

function startWorkout(){
  if(state.routine.length === 0) return;
  state.plan = buildPlan(state.routine, state.workoutStyle);
  if(state.plan.length === 0) return;
  state.screen = 'workout';
  state.step = 0;
  state.secondsLeft = state.workSeconds;
  state.startedAt = Date.now();
  state.segmentStartedAt = Date.now();
  state.exerciseLog = [];
  state.restSecondsTotal = 0;
  clearTimer();
  state.timerId = setInterval(tick, 1000);
  render();
}

// Cierra el segmento actual (serie de trabajo o descanso) y registra el tiempo REAL transcurrido,
// para que las calorías se calculen sobre duración real y no sobre los segundos nominales.
function closeSegment(kind){
  if(!state.segmentStartedAt) return;
  const elapsed = Math.max(0, (Date.now() - state.segmentStartedAt) / 1000);
  if(kind === 'workout'){
    const entry = state.plan[state.step];
    if(entry) state.exerciseLog.push({ id: entry.exercise.id, group: entry.exercise.group, seconds: elapsed });
  } else {
    state.restSecondsTotal += elapsed;
  }
}

function tick(){
  state.secondsLeft--;
  if(state.secondsLeft < 0){
    if(state.screen === 'workout'){
      closeSegment('workout');
      if(state.step === state.plan.length-1){
        clearTimer();
        finishWorkout();
      } else {
        state.screen = 'rest';
        state.secondsLeft = REST;
        state.segmentStartedAt = Date.now();
      }
    } else if(state.screen === 'rest'){
      closeSegment('rest');
      state.step++;
      state.screen = 'workout';
      state.secondsLeft = state.workSeconds;
      state.segmentStartedAt = Date.now();
    }
  }
  render();
}
function skipStep(){
  if(state.screen === 'workout'){
    closeSegment('workout');
    if(state.step === state.plan.length-1){ clearTimer(); finishWorkout(); }
    else { state.screen='rest'; state.secondsLeft=REST; state.segmentStartedAt = Date.now(); }
  } else if(state.screen === 'rest'){
    closeSegment('rest');
    state.step++; state.screen='workout'; state.secondsLeft=state.workSeconds; state.segmentStartedAt = Date.now();
  }
  render();
}
function requestEndEarly(){
  state.confirmEndEarly = true;
  render();
}
function cancelEndEarly(){
  state.confirmEndEarly = false;
  render();
}
function endWorkoutEarly(){
  closeSegment(state.screen === 'rest' ? 'rest' : 'workout');
  clearTimer();
  state.confirmEndEarly = false;
  finishWorkout();
}
function finishWorkout(){
  const today = new Date().toISOString().slice(0,10);
  const completedAt = new Date().toISOString();
  const durationMinutes = state.startedAt
    ? Math.max(1, Math.round((Date.now()-state.startedAt)/60000))
    : Math.round(state.plan.length*(state.workSeconds+REST)/60);

  // ejercicios REALMENTE trabajados (importante si se terminó antes de tiempo: no asumir toda la rutina)
  const doneIds = [...new Set(state.exerciseLog.map(e=>e.id))];
  const doneExercises = doneIds.map(id => state.routine.find(e=>e.id===id)).filter(Boolean);
  const groupCounts = {};
  doneExercises.forEach(e=>{ groupCounts[e.group] = (groupCounts[e.group]||0)+1; });
  const esCardio = doneExercises.length ? (groupCounts.cardio||0) >= doneExercises.length/2 : false;

  const weightKg = loadSettings().weightKg || null;
  const calories = computeCalories(state.exerciseLog, state.restSecondsTotal, weightKg);

  const stationsPlanned = state.plan.length;
  const stationsCompleted = Math.min(stationsPlanned, state.step + 1);

  const session = {
    date: today,
    completedAt,
    exerciseIds: doneExercises.map(e=>e.id),
    exerciseNames: doneExercises.map(e=>`${e.name} (${e.sets}×${e.reps})`),
    groups: [...new Set(doneExercises.map(e=>e.group))],
    workoutStyle: state.workoutStyle,
    stationsCompleted,
    stationsPlanned,
    finishedEarly: stationsCompleted < stationsPlanned,
    durationMinutes,
    esCardio,
    calories,
  };
  saveHistorySession(session);
  autoSyncIfConnected();
  state.lastSession = session;
  state.healthLogStatus = 'idle';
  state.screen = 'done';
  render();
}
function newRoutine(){
  clearTimer();
  state.screen = 'checkin';
  state.step = 0;
  state.feeling = 'normal';
  state.painZones = [];
  state.intensityOverride = null;
  state.intensityResult = null;
  // el historial cambió (se acaba de guardar/subir una sesión) — refresca la recomendación de Drive
  state.driveRecommendation = null;
  state.driveRecStatus = 'idle';
  render();
}
function goTab(tab){
  state.tab = tab;
  render();
}
function saveWeight(){
  const input = document.getElementById('weightInput');
  const val = input ? parseFloat(input.value) : NaN;
  if(!isNaN(val) && val >= 30 && val <= 300){
    saveSettings({ ...loadSettings(), weightKg: val });
    state.weightSaveStatus = 'ok';
  } else {
    state.weightSaveStatus = 'error';
  }
  render();
}

/* ================= RENDER ================= */
function render(){
  const app = document.getElementById('app');
  app.innerHTML = renderContent() + renderTabbar();
}

function renderTabbar(){
  return `
    <div class="tabbar">
      <button class="tab ${state.tab==='rutina'?'active':''}" onclick="goTab('rutina')">
        <span class="ic">🏋️</span>Rutina
      </button>
      <button class="tab ${state.tab==='historial'?'active':''}" onclick="goTab('historial')">
        <span class="ic">📅</span>Historial
      </button>
      <button class="tab ${state.tab==='nube'?'active':''}" onclick="goTab('nube')">
        <span class="ic">☁️</span>Nube
      </button>
      <button class="tab ${state.tab==='ajustes'?'active':''}" onclick="goTab('ajustes')">
        <span class="ic">⚙️</span>Ajustes
      </button>
    </div>`;
}

function renderContent(){
  if(state.tab === 'historial') return renderHistorial();
  if(state.tab === 'nube') return renderNube();
  if(state.tab === 'ajustes') return renderAjustes();
  // tab rutina
  switch(state.screen){
    case 'checkin': return renderCheckin();
    case 'equip': return renderEquip();
    case 'muscles': return renderMuscles();
    case 'overview': return renderOverview();
    case 'workout': return renderWorkout();
    case 'rest': return renderRest();
    case 'done': return renderDone();
    default: return renderCheckin();
  }
}

function renderCheckin(){
  const feelingItems = FEELING_OPTIONS.map(f=>{
    const sel = state.feeling === f.id;
    return `<div class="equip-item ${sel?'selected':''}" onclick="selectFeeling('${f.id}')">
      <span class="icon">${f.icon}</span><span class="label">${f.label}</span>
    </div>`;
  }).join('');

  const painItems = PAIN_ZONES.map(z=>{
    const sel = state.painZones.includes(z.id);
    return `<div class="equip-item ${sel?'selected':''}" onclick="togglePainZone('${z.id}')">
      <span class="icon">${z.icon}</span><span class="label">${z.label}</span>
    </div>`;
  }).join('');

  const healthSection = state.health
    ? `<p style="text-align:center;font-size:12.5px;color:var(--chalk-dim);margin:10px 0 0;">🍏 Sueño ${state.health.sleepHours!=null?state.health.sleepHours.toFixed(1)+'h':'—'} · FC reposo ${state.health.restingHR!=null?state.health.restingHR+' bpm':'—'} <span style="opacity:.6;">(${timeAgo(state.health.syncedAt)})</span></p>`
    : `<button class="btn-ghost btn-block" style="margin-top:10px;" onclick="openHealthSyncShortcut()">🍏 Sincronizar con Apple Health</button>`;

  const computed = computeIntensityLevel(state.feeling, state.painZones, state.health);
  const effectiveLevel = state.intensityOverride || computed.level;
  const levelIcons = { suave:'😌', normal:'👍', desafiante:'💪' };
  const levelLabels = { suave:'Suave', normal:'Normal', desafiante:'Desafiante' };

  let displayNote;
  if(state.intensityOverride && state.intensityOverride !== computed.level){
    displayNote = `Hoy: rutina ${levelLabels[effectiveLevel]} (ajustado manualmente).`;
    const realPainZones = state.painZones.filter(z => z !== 'ninguno');
    if(realPainZones.length){
      const zoneLabels = realPainZones.map(z => ((PAIN_ZONES.find(p=>p.id===z)||{}).label || z).toLowerCase());
      displayNote += ` Evitamos ejercicios de ${zoneLabels.join(', ')}.`;
    }
  } else {
    displayNote = computed.note;
  }

  const overridePills = ['suave','normal','desafiante'].map(lvl=>`
    <button class="style-opt ${effectiveLevel===lvl?'active':''}" onclick="setIntensityOverride('${lvl}')">${levelIcons[lvl]} ${levelLabels[lvl]}</button>
  `).join('');

  return `
    <header>
      <div class="eyebrow">Paso 1 de 3</div>
      <h1>¿Cómo te sientes hoy?</h1>
      <div class="sub">Esto ajusta la intensidad de toda la rutina</div>
    </header>
    <div class="equip-grid">${feelingItems}</div>

    <header style="margin-top:22px;">
      <div class="eyebrow">Dolor o molestia</div>
      <h1 style="font-size:19px;">¿Alguna zona te está molestando?</h1>
      <div class="sub">Puedes marcar más de una — evitamos ejercicios que la carguen</div>
    </header>
    <div class="equip-grid">${painItems}</div>

    ${healthSection}

    <div class="card" style="border-color:var(--accent);margin-top:16px;">
      <div class="eyebrow" style="margin-bottom:6px;">${levelIcons[effectiveLevel]} Nivel calculado</div>
      <p style="font-size:14px;margin:0 0 12px;line-height:1.5;">${displayNote}</p>
      <div class="style-toggle">${overridePills}</div>
    </div>

    <button class="btn-primary btn-block" style="margin-top:14px;" onclick="confirmCheckin()">Continuar</button>
  `;
}

function renderEquip(){
  const items = EQUIPMENT_OPTIONS.map(eq=>{
    const sel = state.equipment.includes(eq.id);
    return `<div class="equip-item ${sel?'selected':''}" onclick="toggleEquip('${eq.id}')">
      <span class="icon">${eq.icon}</span><span class="label">${eq.label}</span>
    </div>`;
  }).join('');
  return `
    <header>
      <div class="eyebrow">Paso 2 de 3</div>
      <h1>¿Qué equipo tienes hoy?</h1>
      <div class="sub">Marca o desmarca según lo que tengas disponible</div>
    </header>
    <div class="equip-grid">${items}</div>
    <button class="btn-primary btn-block" onclick="confirmEquip()">Continuar</button>
    <div style="text-align:center;margin-top:10px;">
      <button class="btn-ghost" style="background:none;border:none;color:var(--chalk-dim);font-size:12.5px;text-decoration:underline;" onclick="backToCheckin()">← Volver al check-in</button>
    </div>
  `;
}

function renderDriveRecommendation(){
  if(state.driveRecStatus === 'loading'){
    return `<div class="card" style="padding:12px 14px;"><p style="font-size:12.5px;color:var(--chalk-dim);margin:0;">📊 Revisando tu historial en Drive...</p></div>`;
  }
  if(state.driveRecStatus === 'ready' && state.driveRecommendation){
    const rec = state.driveRecommendation;
    return `
      <div class="card" style="border-color:var(--accent);padding:14px;">
        <p style="font-size:11.5px;letter-spacing:1px;text-transform:uppercase;color:var(--chalk-dim);margin:0 0 8px;">📊 Basado en tu historial (Drive)</p>
        <p style="font-size:17px;font-weight:800;margin:0 0 4px;">Pre-seleccionamos: ${rec.labels.join(' y ')}</p>
        <p style="font-size:12.5px;color:var(--chalk-dim);margin:0 0 10px;">${rec.detail}. Ajusta libremente los tiles de abajo si no estás de acuerdo.</p>
        <button class="btn-ghost" style="border:none;background:none;color:var(--accent);font-size:12px;text-decoration:underline;padding:0;" onclick="useRecommendation()">🔁 Volver a esta recomendación</button>
      </div>`;
  }
  return '';
}

function renderMuscles(){
  const history = loadHistory();
  const realPainZones = state.painZones.filter(z => z !== 'ninguno');
  const groupsWithPainWarning = new Set();
  realPainZones.forEach(z => (PAIN_GROUP_WARNING[z]||[]).forEach(g => groupsWithPainWarning.add(g)));

  const items = MUSCLE_GROUPS.map(m=>{
    const sel = state.muscleGroups.includes(m.id);
    const hrs = hoursSinceGroupTrained(m.id, history);
    const recoveryWarn = hrs != null && hrs < RECOVERY_HOURS;
    const painWarn = groupsWithPainWarning.has(m.id);
    let badge = '';
    if(painWarn) badge = `<div class="recovery-badge">⚠️ dolor marcado</div>`;
    else if(recoveryWarn) badge = `<div class="recovery-badge">⚠️ ${formatHoursAgo(hrs)}</div>`;
    return `<div class="equip-item ${sel?'selected':''}" onclick="toggleMuscle('${m.id}')">
      <span class="icon">${m.icon}</span><span class="label">${m.label}</span>${badge}
    </div>`;
  }).join('');

  const selectedWarnings = MUSCLE_GROUPS.filter(m=>{
    if(!state.muscleGroups.includes(m.id)) return false;
    const hrs = hoursSinceGroupTrained(m.id, history);
    return hrs != null && hrs < RECOVERY_HOURS && !groupsWithPainWarning.has(m.id);
  });
  const recoveryNote = selectedWarnings.length
    ? `<div class="card" style="border-color:var(--bad);padding:12px 14px;">
        <p style="font-size:12.5px;color:var(--chalk-dim);margin:0;">⚠️ ${selectedWarnings.map(m=>`${m.label} ${formatHoursAgo(hoursSinceGroupTrained(m.id,history))}`).join(', ')} — quizás no se ha recuperado del todo. Puedes continuar si te sientes bien.</p>
      </div>`
    : '';

  return `
    <header>
      <div class="eyebrow">Paso 3 de 3</div>
      <h1>¿Qué te sientes en condición de trabajar?</h1>
      <div class="sub">Desmarca zonas con fatiga o molestia</div>
    </header>
    ${renderDriveRecommendation()}
    <div class="equip-grid">${items}</div>
    ${recoveryNote}
    <button class="btn-primary btn-block" style="margin-top:10px;" onclick="confirmMuscles()">Generar rutina</button>
    <div style="text-align:center;margin-top:10px;">
      <button class="btn-ghost" style="background:none;border:none;color:var(--chalk-dim);font-size:12.5px;text-decoration:underline;" onclick="backToEquip()">← Cambiar equipo</button>
    </div>
  `;
}

function renderOverview(){
  if(state.routine.length === 0){
    return `
      <header><div class="eyebrow">Rutina</div><h1>No hay ejercicios posibles</h1></header>
      <div class="card"><p style="color:var(--chalk-dim);font-size:13.5px;">No tienes equipo marcado que combine con los grupos musculares elegidos. Ajusta tu selección.</p>
      <button class="btn-ghost btn-block" onclick="backToMuscles()">← Ajustar selección</button></div>
    `;
  }
  const rows = state.routine.map((ex,i)=>`
    <div class="ex-row">
      <span>${ex.name}<br><span class="tag">${ex.group}</span></span>
      <span class="sets-editor">
        <button class="stepper" onclick="adjustSets(${i},-1)">−</button>
        <span class="sets-val">${ex.sets}×${ex.reps}</span>
        <button class="stepper" onclick="adjustSets(${i},1)">+</button>
      </span>
    </div>
  `).join('');
  const skippedNote = state.skippedGroups && state.skippedGroups.length
    ? ' ⚠️ ' + state.skippedGroups.map(g=>{
        const label = (MUSCLE_GROUPS.find(m=>m.id===g)||{}).label || g;
        return `${label}: sin alternativa segura para tu dolor con el equipo de hoy, se omitió.`;
      }).join(' ')
    : '';
  const intensityBanner = state.intensityNote
    ? `<div class="card" style="border-color:var(--accent);"><p style="font-size:13px;color:var(--chalk-dim);margin:0;">${state.intensityNote}${skippedNote}</p></div>`
    : '';
  const totalStations = buildPlan(state.routine, state.workoutStyle).length;
  const styleCard = `
    <div class="card">
      <div class="eyebrow" style="margin-bottom:8px;">Estilo de entrenamiento</div>
      <div class="style-toggle">
        <button class="style-opt ${state.workoutStyle==='circuito'?'active':''}" onclick="setWorkoutStyle('circuito')">🔄 Circuito combinado</button>
        <button class="style-opt ${state.workoutStyle==='porEjercicio'?'active':''}" onclick="setWorkoutStyle('porEjercicio')">📋 Por ejercicio</button>
      </div>
      <p style="color:var(--chalk-dim);font-size:12px;margin-top:8px;">
        ${state.workoutStyle==='circuito'
          ? 'Rota entre ejercicios por ronda: una serie de cada uno, y repite.'
          : 'Completa todas las series de un ejercicio antes de pasar al siguiente.'}
      </p>
    </div>`;
  return `
    <header>
      <div class="eyebrow">Tu rutina de hoy</div>
      <h1>${state.routine.length} ejercicios · ${totalStations} series</h1>
      <div class="sub">${state.workSeconds}s trabajo / 15s descanso por serie</div>
    </header>
    ${intensityBanner}
    ${styleCard}
    <div class="card">${rows}</div>
    <button class="btn-primary btn-block" onclick="startWorkout()">Empezar entrenamiento</button>
    <div style="display:flex;gap:10px;margin-top:10px;">
      <button class="btn-ghost" style="flex:1;font-size:13px;" onclick="regenerate()">🔄 Regenerar</button>
      <button class="btn-ghost" style="flex:1;font-size:13px;" onclick="backToMuscles()">← Ajustar</button>
    </div>
  `;
}

function renderProgress(){
  let segs='';
  for(let i=0;i<state.plan.length;i++){
    const doneCls = i<state.step ? 'done':'';
    let pct=0;
    if(i===state.step){ pct = state.screen==='workout' ? Math.round(((state.workSeconds-state.secondsLeft)/state.workSeconds)*100) : 100; }
    segs += `<div class="seg ${doneCls}"><div class="fill" style="width:${pct}%"></div></div>`;
  }
  return `<div class="progress-track">${segs}</div>`;
}

function renderEndEarlyControl(){
  if(state.confirmEndEarly){
    return `
      <div style="margin-top:10px;padding:12px;background:var(--plate);border-radius:10px;">
        <p style="font-size:12.5px;color:var(--chalk-dim);margin:0 0 10px;">¿Terminar la rutina ahora? Se guarda lo que llevas hasta aquí, con las calorías calculadas sobre lo que en verdad trabajaste.</p>
        <div style="display:flex;gap:8px;">
          <button class="btn-ghost" style="flex:1;color:var(--bad);border-color:var(--bad);" onclick="endWorkoutEarly()">Sí, terminar</button>
          <button class="btn-ghost" style="flex:1;" onclick="cancelEndEarly()">Seguir entrenando</button>
        </div>
      </div>`;
  }
  return `<button class="btn-ghost btn-block" style="margin-top:10px;color:var(--chalk-dim);font-size:12.5px;" onclick="requestEndEarly()">Terminar rutina antes de tiempo</button>`;
}

function renderWorkout(){
  const entry = state.plan[state.step];
  const ex = entry.exercise;
  return `
    <header>
      <div class="eyebrow">Entrenamiento</div>
      <h1>Estación ${state.step+1} de ${state.plan.length}</h1>
    </header>
    ${renderProgress()}
    <div class="card">
      <div class="stage-label"><span>En curso</span><span class="round">${ex.group}</span></div>
      <div class="ex-name">${ex.name}</div>
      <div class="ex-reps-big">Serie ${entry.setNumber} de ${entry.totalSets} · ${ex.reps}</div>
      ${renderIllustration(ex)}
      <ul class="cues"><li>${ex.desc}</li></ul>
      <div class="timer">${fmt(state.secondsLeft<0?0:state.secondsLeft)}</div>
      <button class="btn-ghost btn-block" onclick="skipStep()">Saltar</button>
      ${renderEndEarlyControl()}
    </div>
  `;
}

function renderRest(){
  const nextEntry = state.step < state.plan.length-1 ? state.plan[state.step+1] : null;
  return `
    <header><div class="eyebrow">Entrenamiento</div><h1>Descanso</h1></header>
    ${renderProgress()}
    <div class="card rest-screen">
      <div class="big">${fmt(state.secondsLeft<0?0:state.secondsLeft)}</div>
      ${nextEntry
        ? `<div class="next-label">Sigue · Serie ${nextEntry.setNumber} de ${nextEntry.totalSets}</div><div class="next-name">${nextEntry.exercise.name}</div>`
        : `<div class="next-label">Última estación completada</div>`}
      <button class="btn-ghost btn-block" style="margin-top:14px;" onclick="skipStep()">Saltar descanso</button>
      ${renderEndEarlyControl()}
    </div>
  `;
}

function renderDone(){
  const s = state.lastSession;
  const groupsWorked = s ? (s.groups||[]) : [...new Set(state.routine.map(e=>e.group))];
  const stretchItems = groupsWorked.filter(g=>STRETCHES[g]).map(g=>`
    <div class="ex-row"><span><b style="text-transform:capitalize">${g}</b><br><span class="tag">${STRETCHES[g]}</span></span></div>
  `).join('');
  const calories = s ? s.calories : null;
  const caloriesCard = calories != null
    ? `<div class="card" style="text-align:center;">
        <div class="eyebrow" style="margin-bottom:4px;">Estimado</div>
        <div style="font-size:32px;font-weight:800;color:var(--accent);">🔥 ${calories} kcal</div>
        <p style="color:var(--chalk-dim);font-size:11.5px;margin-top:4px;">Estimación aproximada (MET estándar × tu peso × duración real). Toca "Registrar en Apple Health" para afinarla con tu frecuencia cardíaca real si usaste Apple Watch.</p>
      </div>`
    : `<div class="card" style="text-align:center;">
        <p style="color:var(--chalk-dim);font-size:13px;margin:0 0 10px;">Agrega tu peso en Ajustes para ver las calorías estimadas de esta rutina.</p>
        <button class="btn-ghost btn-block" onclick="goTab('ajustes')">⚙️ Ir a Ajustes</button>
      </div>`;
  const completedNum = s ? s.stationsCompleted : state.routine.length;
  const plannedNum = s ? s.stationsPlanned : state.routine.length;
  const earlyNote = s && s.finishedEarly
    ? `<p style="color:var(--accent);font-size:12.5px;margin-top:4px;">Terminaste antes de tiempo — se guardó lo que alcanzaste a hacer.</p>`
    : '';
  return `
    <header><div class="eyebrow">¡Terminaste!</div><h1>Buen trabajo 💪</h1></header>
    <div class="card done-screen">
      <div class="big-num">${completedNum}/${plannedNum}</div>
      <p>Estaciones completadas y guardadas en tu historial.</p>
      ${earlyNote}
    </div>
    ${caloriesCard}
    <div class="card">
      <div class="eyebrow" style="margin-bottom:8px;">Estiramientos sugeridos</div>
      ${stretchItems}
    </div>
    <button class="btn-ghost btn-block" onclick="openHealthLogShortcut()">🍎 Registrar en Apple Health</button>
    ${state.healthLogStatus==='ok' ? '<p style="text-align:center;font-size:13px;margin-top:8px;color:var(--good);">✅ Enviado a Shortcuts</p>' : ''}
    <div style="height:10px;"></div>
    <button class="btn-primary btn-block" onclick="newRoutine()">Nueva rutina</button>
  `;
}

function renderHistorial(){
  const history = loadHistory();
  const totalSessions = history.length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
  const thisWeek = history.filter(h => new Date(h.date) >= weekAgo).length;

  // racha: días consecutivos con sesión hasta hoy
  let streak = 0;
  const daysSet = new Set(history.map(h=>h.date));
  let cursor = new Date();
  while(true){
    const key = cursor.toISOString().slice(0,10);
    if(daysSet.has(key)){ streak++; cursor.setDate(cursor.getDate()-1); }
    else break;
  }

  const syncMsg = {
    idle: '', syncing: '⏳ Borrando en Drive...',
    ok: '✅ Historial actualizado en Drive', error: '⚠️ No se pudo actualizar Drive, se borró solo en este teléfono'
  }[state.syncStatus] || '';

  const sessionsHtml = history.length === 0
    ? `<div class="empty-state">Aún no hay entrenamientos guardados.<br>Completa tu primera rutina para verla aquí.</div>`
    : history.map(h=>{
        const key = sessionKey(h);
        const early = h.finishedEarly ? ` · terminada antes de tiempo (${h.stationsCompleted}/${h.stationsPlanned})` : '';
        const deleteControl = state.confirmDeleteKey === key
          ? `<span class="del-confirm">
               <button class="del-yes" onclick="deleteHistorySession('${key}')">Sí, borrar</button>
               <button class="del-no" onclick="cancelDeleteSession()">Cancelar</button>
             </span>`
          : `<button class="del-btn" onclick="requestDeleteSession('${key}')">🗑️</button>`;
        return `
      <div class="session-item">
        <div class="session-item-head">
          <div class="date">${h.date}${h.calories!=null ? ` · 🔥 ${h.calories} kcal` : ''}${early}</div>
          ${deleteControl}
        </div>
        <div class="list">${h.exerciseNames.join(' · ')}</div>
      </div>
    `;
      }).join('');

  return `
    <header><div class="eyebrow">Tu progreso</div><h1>Historial</h1></header>
    <div class="stat-row">
      <div class="stat"><div class="num">${totalSessions}</div><div class="lbl">Total</div></div>
      <div class="stat"><div class="num">${thisWeek}</div><div class="lbl">Esta semana</div></div>
      <div class="stat"><div class="num">${streak}</div><div class="lbl">Racha (días)</div></div>
    </div>
    <div class="card">${sessionsHtml}</div>
    ${syncMsg ? `<p style="text-align:center;font-size:12.5px;color:var(--chalk-dim);margin-top:-4px;">${syncMsg}</p>` : ''}
  `;
}

function renderNube(){
  const connected = typeof DriveSync !== 'undefined' && DriveSync.connected;
  const lastSync = (typeof DriveSync !== 'undefined' && DriveSync.lastSync)
    ? new Date(DriveSync.lastSync).toLocaleString('es', {dateStyle:'short', timeStyle:'short'})
    : 'Nunca';

  const statusMsg = {
    idle: '', syncing: '⏳ Sincronizando...',
    ok: '✅ Listo', error: '⚠️ Hubo un error, intenta de nuevo'
  }[state.syncStatus];

  if(!connected){
    return `
      <header><div class="eyebrow">Respaldo</div><h1>Google Drive</h1>
      <div class="sub">Tu historial se guarda en un archivo privado de tu Drive</div></header>
      <div class="card">
        <p style="color:var(--chalk-dim);font-size:13.5px;line-height:1.5;margin-bottom:14px;">
          Solo se guarda tu historial de rutinas — no compartimos ni leemos ningún otro archivo de tu Drive.
        </p>
        <button class="btn-primary btn-block" onclick="connectDrive()">Conectar con Google Drive</button>
        ${statusMsg?`<p style="text-align:center;font-size:13px;margin-top:10px;">${statusMsg}</p>`:''}
      </div>
    `;
  }

  return `
    <header><div class="eyebrow">Respaldo</div><h1>Google Drive</h1></header>
    <div class="card">
      <div class="ex-row"><span>Estado</span><span style="color:var(--good);font-weight:700;">Conectado ✓</span></div>
      <div class="ex-row"><span>Última sincronización</span><span>${lastSync}</span></div>
    </div>
    <button class="btn-primary btn-block" onclick="syncNow()">Sincronizar ahora</button>
    <div style="height:10px;"></div>
    <button class="btn-ghost btn-block" onclick="restoreFromDrive()">Restaurar desde Drive</button>
    <div style="height:10px;"></div>
    <button class="btn-ghost btn-block" style="color:var(--bad);" onclick="disconnectDrive()">Desconectar</button>
    ${statusMsg?`<p style="text-align:center;font-size:13px;margin-top:10px;">${statusMsg}</p>`:''}
  `;
}

function renderAjustes(){
  const settings = loadSettings();
  const weightMsg = {
    ok: '<p style="text-align:center;font-size:13px;margin-top:10px;color:var(--good);">✅ Peso guardado</p>',
    error: '<p style="text-align:center;font-size:13px;margin-top:10px;color:var(--bad);">⚠️ Ingresa un peso válido (30-300 kg)</p>',
  }[state.weightSaveStatus] || '';
  return `
    <header><div class="eyebrow">Ajustes</div><h1>Tu perfil</h1></header>
    <div class="card">
      <label style="display:block;font-size:12.5px;color:var(--chalk-dim);margin-bottom:8px;">Peso corporal aproximado (kg)</label>
      <input id="weightInput" type="number" inputmode="decimal" min="30" max="300" step="0.5"
        placeholder="ej. 70" value="${settings.weightKg || ''}"
        style="width:100%;background:var(--plate);border:1px solid var(--line);border-radius:10px;color:var(--chalk);font-size:16px;padding:12px 14px;margin-bottom:12px;">
      <button class="btn-primary btn-block" onclick="saveWeight()">Guardar peso</button>
      ${weightMsg}
      <p style="color:var(--chalk-dim);font-size:12px;line-height:1.5;margin:14px 0 0;">
        Se usa solo para estimar las calorías quemadas por rutina (fórmula MET estándar). No se comparte ni se sube a ningún lado excepto tu propio respaldo de Drive.
      </p>
    </div>
  `;
}

/* ================= INICIO ================= */
handleShortcutCallback();
render();

/* Registrar service worker para funcionamiento offline */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
