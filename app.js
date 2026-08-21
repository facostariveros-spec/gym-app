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

/* ---------- Plantillas de ilustración (poses reutilizables) ---------- */
const POSES = {
  squat: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="14" r="7" fill="${a}"/>
    <line x1="35" y1="21" x2="35" y2="50" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="15" y1="26" x2="55" y2="26" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="50" x2="22" y2="80" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="50" x2="48" y2="80" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="32" r="7" fill="${b}"/>
    <line x1="35" y1="39" x2="38" y2="60" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="17" y1="44" x2="57" y2="44" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="38" y1="60" x2="20" y2="62" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="20" y1="62" x2="24" y2="82" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="60" x2="55" y2="66" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="55" y1="66" x2="50" y2="84" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
  hinge: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="14" r="7" fill="${a}"/>
    <line x1="35" y1="21" x2="35" y2="55" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="55" x2="24" y2="80" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="55" x2="46" y2="80" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="20" cy="30" r="7" fill="${b}"/>
    <line x1="22" y1="36" x2="40" y2="52" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="40" y1="52" x2="30" y2="78" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="40" y1="52" x2="50" y2="78" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="22" y1="36" x2="10" y2="55" stroke="${b}" stroke-width="4" stroke-linecap="round"/></svg>`,
  press_overhead: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="20" r="7" fill="${a}"/>
    <line x1="35" y1="27" x2="35" y2="60" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="34" x2="18" y2="42" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="34" x2="52" y2="42" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="60" x2="26" y2="85" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="60" x2="44" y2="85" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="20" r="7" fill="${b}"/>
    <line x1="35" y1="27" x2="35" y2="60" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="30" x2="20" y2="8" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="30" x2="50" y2="8" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="60" x2="26" y2="85" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="60" x2="44" y2="85" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
  press_horizontal: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><ellipse cx="35" cy="55" rx="28" ry="6" fill="${a}" opacity="0.4"/>
    <circle cx="35" cy="30" r="7" fill="${a}"/>
    <line x1="35" y1="37" x2="35" y2="55" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="40" x2="15" y2="32" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="40" x2="55" y2="32" stroke="${a}" stroke-width="4" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><ellipse cx="35" cy="55" rx="28" ry="6" fill="${b}" opacity="0.4"/>
    <circle cx="35" cy="30" r="7" fill="${b}"/>
    <line x1="35" y1="37" x2="35" y2="55" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="42" x2="20" y2="55" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="42" x2="50" y2="55" stroke="${b}" stroke-width="4" stroke-linecap="round"/></svg>`,
  pull_vertical: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><line x1="10" y1="10" x2="60" y2="10" stroke="${a}" stroke-width="4"/>
    <circle cx="35" cy="24" r="7" fill="${a}"/>
    <line x1="35" y1="31" x2="35" y2="58" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="33" x2="18" y2="12" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="33" x2="52" y2="12" stroke="${a}" stroke-width="4" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><line x1="10" y1="10" x2="60" y2="10" stroke="${b}" stroke-width="4"/>
    <circle cx="35" cy="34" r="7" fill="${b}"/>
    <line x1="35" y1="41" x2="35" y2="64" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="38" x2="20" y2="16" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="38" x2="50" y2="16" stroke="${b}" stroke-width="4" stroke-linecap="round"/></svg>`,
  row: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="38" cy="18" r="7" fill="${a}"/>
    <line x1="38" y1="25" x2="38" y2="55" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="30" x2="55" y2="55" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="30" y2="82" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="46" y2="82" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="38" cy="18" r="7" fill="${b}"/>
    <line x1="38" y1="25" x2="38" y2="55" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="30" x2="18" y2="34" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="30" y2="82" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="38" y1="55" x2="46" y2="82" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
  curl: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="18" r="7" fill="${a}"/>
    <line x1="35" y1="25" x2="35" y2="55" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="32" x2="50" y2="55" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="55" x2="27" y2="82" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="55" x2="43" y2="82" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="18" r="7" fill="${b}"/>
    <line x1="35" y1="25" x2="35" y2="55" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="32" x2="48" y2="20" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="55" x2="27" y2="82" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="55" x2="43" y2="82" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
  extension: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><rect x="8" y="18" width="10" height="50" rx="2" fill="${a}" opacity="0.4"/>
    <circle cx="35" cy="20" r="6" fill="${a}"/>
    <line x1="35" y1="26" x2="32" y2="48" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="32" y1="48" x2="55" y2="48" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="55" y1="48" x2="58" y2="70" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><rect x="8" y="18" width="10" height="50" rx="2" fill="${b}" opacity="0.4"/>
    <circle cx="35" cy="20" r="6" fill="${b}"/>
    <line x1="35" y1="26" x2="32" y2="48" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="32" y1="48" x2="52" y2="50" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="52" y1="50" x2="60" y2="32" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
  plank: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="14" cy="40" r="7" fill="${a}"/>
    <line x1="20" y1="42" x2="60" y2="48" stroke="${a}" stroke-width="6" stroke-linecap="round"/>
    <line x1="20" y1="42" x2="14" y2="60" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="60" y1="48" x2="60" y2="65" stroke="${a}" stroke-width="4" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="14" cy="30" r="7" fill="${b}"/>
    <line x1="18" y1="34" x2="55" y2="55" stroke="${b}" stroke-width="6" stroke-linecap="round"/>
    <line x1="18" y1="34" x2="12" y2="55" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="55" y1="55" x2="58" y2="70" stroke="${b}" stroke-width="4" stroke-linecap="round"/></svg>`,
  core_dynamic: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="16" r="7" fill="${a}"/>
    <line x1="35" y1="23" x2="35" y2="50" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="50" x2="20" y2="45" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="50" x2="50" y2="70" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="35" cy="16" r="7" fill="${b}"/>
    <line x1="35" y1="23" x2="35" y2="50" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="35" y1="50" x2="52" y2="45" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="50" x2="18" y2="70" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
  cardio: (a,b)=>`
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="26" cy="20" r="7" fill="${a}"/>
    <line x1="26" y1="27" x2="30" y2="50" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="18" y2="45" stroke="${a}" stroke-width="4" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="45" y2="70" stroke="${a}" stroke-width="5" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="15" y2="75" stroke="${a}" stroke-width="5" stroke-linecap="round"/></svg>
    <svg width="64" height="80" viewBox="0 0 70 90"><circle cx="40" cy="20" r="7" fill="${b}"/>
    <line x1="40" y1="27" x2="34" y2="50" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="34" y1="50" x2="55" y2="42" stroke="${b}" stroke-width="4" stroke-linecap="round"/>
    <line x1="34" y1="50" x2="20" y2="72" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
    <line x1="34" y1="50" x2="50" y2="78" stroke="${b}" stroke-width="5" stroke-linecap="round"/></svg>`,
};

/* ---------- Base de ejercicios ---------- */
// equip: lista de equipo con el que se puede hacer (basta con tener UNO de la lista)
const EXERCISES = [
  { id:'squat_barbell', name:'Sentadilla con barra', group:'piernas', equip:['barbell_rack'], reps:'10 reps', pose:'squat',
    desc:'Pies al ancho de hombros, barra sobre la espalda alta. Baja hasta que los muslos queden paralelos al piso y empuja con los talones para subir.' },
  { id:'rdl_barbell', name:'Peso muerto rumano con barra', group:'piernas', equip:['barbell_rack'], reps:'10 reps', pose:'hinge',
    desc:'Rodillas semi-flexionadas, baja la barra pegada a las piernas manteniendo la espalda recta. Siente el estiramiento en isquiotibiales.' },
  { id:'ohp_barbell', name:'Press militar con barra', group:'hombros', equip:['barbell_rack'], reps:'8 reps', pose:'press_overhead',
    desc:'De pie, barra a la altura de clavícula. Empuja hacia arriba sin arquear la espalda, baja con control.' },
  { id:'row_barbell', name:'Remo con barra', group:'espalda', equip:['barbell_rack'], reps:'10 reps', pose:'row',
    desc:'Torso inclinado ~45°, jala la barra hacia el abdomen apretando los omóplatos, baja controlado.' },
  { id:'shoulder_press_db', name:'Press de hombro con mancuernas', group:'hombros', equip:['dumbbells'], reps:'10 reps', pose:'press_overhead',
    desc:'Sentado o de pie, mancuernas a la altura de los hombros. Empuja hacia arriba sin bloquear del todo los codos.' },
  { id:'curl_db', name:'Curl de bíceps con mancuernas', group:'brazos', equip:['dumbbells'], reps:'12 reps', pose:'curl',
    desc:'Codos pegados al torso, sube la mancuerna contrayendo el bíceps, baja lento sin balancear el cuerpo.' },
  { id:'bench_press_db', name:'Press de banca con mancuernas', group:'pecho', equip:['dumbbells','bench'], reps:'10 reps', pose:'press_horizontal',
    desc:'Acostado en la banca, empuja las mancuernas hacia arriba juntándolas ligeramente arriba, baja controlado.' },
  { id:'row_one_arm_db', name:'Remo a una mano con mancuerna', group:'espalda', equip:['dumbbells','bench'], reps:'10 reps c/lado', pose:'row',
    desc:'Apoya rodilla y mano en la banca, jala la mancuerna hacia la cadera apretando el omóplato.' },
  { id:'lunge_db', name:'Zancadas con mancuernas', group:'piernas', equip:['dumbbells'], reps:'10 reps c/pierna', pose:'squat',
    desc:'Da un paso al frente, baja la rodilla trasera casi al piso, empuja con el talón delantero para volver.' },
  { id:'rdl_db', name:'Peso muerto rumano con mancuernas', group:'piernas', equip:['dumbbells'], reps:'10 reps', pose:'hinge',
    desc:'Igual que con barra: cadera atrás, espalda recta, baja las mancuernas pegadas a las piernas.' },
  { id:'leg_curl_machine', name:'Curl femoral en máquina', group:'piernas', equip:['leg_machine'], reps:'12 reps', pose:'extension',
    desc:'Espalda apoyada, flexiona la rodilla llevando el rodillo hacia los glúteos, controla la bajada.' },
  { id:'leg_ext_machine', name:'Extensión de cuádriceps en máquina', group:'piernas', equip:['leg_machine'], reps:'12 reps', pose:'extension',
    desc:'Extiende la rodilla contra el rodillo, aprieta arriba un segundo y baja despacio.' },
  { id:'cable_row', name:'Remo en polea', group:'espalda', equip:['cable_machine'], reps:'10 reps', pose:'row',
    desc:'Espalda recta, jala hacia el abdomen apretando los omóplatos entre sí, evita balancear el torso.' },
  { id:'lat_pulldown', name:'Jalón al pecho en polea', group:'espalda', equip:['cable_machine'], reps:'10 reps', pose:'pull_vertical',
    desc:'Agarre ancho, jala la barra hacia la parte alta del pecho llevando los codos hacia abajo y atrás.' },
  { id:'cable_chest_press', name:'Press de pecho en polea', group:'pecho', equip:['cable_machine'], reps:'10 reps', pose:'press_horizontal',
    desc:'Poleas a la altura del pecho, empuja hacia el frente juntando las manos, controla el regreso.' },
  { id:'cable_curl', name:'Curl de bíceps en polea', group:'brazos', equip:['cable_machine'], reps:'12 reps', pose:'curl',
    desc:'Codos fijos a los costados, sube la cuerda o barra contrayendo el bíceps.' },
  { id:'cable_tricep', name:'Extensión de tríceps en polea', group:'brazos', equip:['cable_machine'], reps:'12 reps', pose:'extension',
    desc:'Codos pegados al torso, empuja la cuerda hacia abajo extendiendo el codo por completo.' },
  { id:'face_pull', name:'Face pull en polea', group:'hombros', equip:['cable_machine'], reps:'12 reps', pose:'pull_vertical',
    desc:'Jala la cuerda hacia la cara separando las manos, codos altos, aprieta omóplatos.' },
  { id:'kb_swing', name:'Swing con kettlebell', group:'piernas', equip:['kettlebell'], reps:'15 reps', pose:'hinge',
    desc:'Bisagra de cadera explosiva, el impulso viene de glúteos y caderas, no de los brazos.' },
  { id:'goblet_squat', name:'Sentadilla goblet con kettlebell', group:'piernas', equip:['kettlebell'], reps:'12 reps', pose:'squat',
    desc:'Sostén la kettlebell frente al pecho, baja en sentadilla manteniendo el torso erguido.' },
  { id:'band_row', name:'Remo con banda elástica', group:'espalda', equip:['resistance_band'], reps:'12 reps', pose:'row',
    desc:'Ancla la banda al frente, jala hacia el abdomen apretando los omóplatos.' },
  { id:'band_chest_press', name:'Press de pecho con banda', group:'pecho', equip:['resistance_band'], reps:'12 reps', pose:'press_horizontal',
    desc:'Banda anclada detrás, empuja hacia el frente extendiendo los brazos con control.' },
  { id:'pull_up', name:'Dominadas', group:'espalda', equip:['pull_up_bar'], reps:'6-8 reps', pose:'pull_vertical',
    desc:'Agarre firme, jala llevando el pecho hacia la barra, baja con control total.' },
  { id:'elliptical', name:'Elíptica', group:'cardio', equip:['elliptical_cardio'], reps:'2 min', pose:'cardio',
    desc:'Ritmo moderado-alto, mantén el torso erguido y usa brazos y piernas por igual.' },
  { id:'pushup', name:'Flexiones', group:'pecho', equip:['bodyweight'], reps:'12 reps', pose:'press_horizontal',
    desc:'Cuerpo recto de cabeza a talones, baja el pecho casi al piso y empuja de vuelta arriba.' },
  { id:'bw_squat', name:'Sentadilla sin peso', group:'piernas', equip:['bodyweight'], reps:'15 reps', pose:'squat',
    desc:'Pies al ancho de hombros, baja como sentándote en una silla, rodillas alineadas con los pies.' },
  { id:'plank', name:'Plancha', group:'core', equip:['bodyweight'], reps:'30-40 seg', pose:'plank',
    desc:'Cuerpo alineado en línea recta, abdomen contraído, evita que la cadera caiga o suba.' },
  { id:'bw_lunge', name:'Zancadas sin peso', group:'piernas', equip:['bodyweight'], reps:'12 reps c/pierna', pose:'squat',
    desc:'Paso al frente, baja la rodilla trasera casi al piso, vuelve empujando con el talón delantero.' },
  { id:'burpee', name:'Burpees', group:'cardio', equip:['bodyweight'], reps:'10 reps', pose:'cardio',
    desc:'De pie a plancha, flexión opcional, salta los pies hacia las manos y salta arriba.' },
  { id:'mountain_climber', name:'Mountain climbers', group:'core', equip:['bodyweight'], reps:'30 seg', pose:'core_dynamic',
    desc:'En posición de plancha, lleva las rodillas al pecho alternando rápido, cadera estable.' },
  { id:'glute_bridge', name:'Puente de glúteo', group:'piernas', equip:['bodyweight'], reps:'15 reps', pose:'hinge',
    desc:'Acostado boca arriba, empuja la cadera hacia arriba apretando los glúteos, baja con control.' },
  { id:'superman', name:'Superman', group:'core', equip:['bodyweight'], reps:'12 reps', pose:'core_dynamic',
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
function loadHealth(){
  try{
    const raw = localStorage.getItem(LS_HEALTH);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function saveHealth(h){
  try{ localStorage.setItem(LS_HEALTH, JSON.stringify(h)); }catch(e){}
}

/* ================= GENERADOR DE RUTINA (evita repetir) ================= */
function lastUsedDate(exId, history){
  for(const session of history){
    if(session.exerciseIds && session.exerciseIds.includes(exId)) return session.date;
  }
  return null; // nunca usado
}

function generateRoutine(equipment, muscleGroups){
  const history = loadHistory();
  const lastSession = history[0];
  const lastSessionIds = lastSession ? (lastSession.exerciseIds||[]) : [];

  const picked = [];
  const order = ['piernas','pecho','espalda','hombros','brazos','core','cardio'];
  const groupsToUse = order.filter(g => muscleGroups.includes(g));

  groupsToUse.forEach(group=>{
    let candidates = EXERCISES.filter(ex =>
      ex.group === group && ex.equip.some(eq => equipment.includes(eq))
    );
    if(candidates.length === 0) return; // no hay equipo para ese grupo hoy

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

    picked.push(pool[0]);
  });

  return picked;
}

/* ================= ESTADO DE LA APP ================= */
let state = {
  tab: 'rutina',            // 'rutina' | 'historial' | 'nube'
  screen: 'equip',          // equip -> muscles -> overview -> workout -> rest -> done
  equipment: [],
  muscleGroups: [],
  routine: [],
  step: 0,
  secondsLeft: WORK,
  workSeconds: WORK,        // segundos de trabajo de la sesión (se ajusta según Apple Health)
  intensityNote: '',
  startedAt: null,
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

function initState(){
  const settings = loadSettings();
  state.equipment = settings.equipment.length ? settings.equipment : ['bodyweight'];
  state.muscleGroups = MUSCLE_GROUPS.map(m=>m.id); // por defecto todo marcado, el usuario desmarca
  state.screen = 'equip';
  state.health = loadHealth();
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
  const payload = { durationMinutes: s.durationMinutes, esCardio: s.esCardio, fecha: s.date };
  window.location.href = buildHealthLogUrl(payload);
}
function testHealthLogShortcut(){
  // Botón temporal de prueba (tab Historial): manda datos fijos sin necesidad
  // de completar una rutina real. Quitar cuando el Shortcut ya funcione bien.
  const payload = { durationMinutes: 20, esCardio: false, fecha: new Date().toISOString().slice(0,10) };
  window.location.href = buildHealthLogUrl(payload);
}
function computeIntensity(health){
  if(!health) return { workSeconds: WORK, note: '' };
  const lowSleep = typeof health.sleepHours === 'number' && health.sleepHours < 6;
  const highHR = typeof health.restingHR === 'number' && health.restingHR > 75;
  if(!lowSleep && !highHR) return { workSeconds: WORK, note: '' };
  const reasons = [];
  if(lowSleep) reasons.push(`dormiste ${health.sleepHours.toFixed(1)}h`);
  if(highHR) reasons.push(`tu FC en reposo (${health.restingHR} bpm) está algo alta`);
  return {
    workSeconds: Math.max(25, WORK - 10),
    note: `Intensidad ajustada hoy: ${reasons.join(' y ')}. Agrega 5 min de calentamiento extra antes de empezar.`
  };
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
    state.healthLogStatus = 'ok';
  }
  history.replaceState(null, '', appBaseUrl());
}

function clearTimer(){ if(state.timerId){ clearInterval(state.timerId); state.timerId=null; } }

function fmt(s){
  const m = Math.floor(s/60);
  const ss = (s%60).toString().padStart(2,'0');
  return `${m}:${ss}`;
}

/* ---------- Navegación entre pasos ---------- */
function toggleEquip(id){
  const i = state.equipment.indexOf(id);
  if(i>=0) state.equipment.splice(i,1); else state.equipment.push(id);
  render();
}
function confirmEquip(){
  saveSettings({ equipment: state.equipment });
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
  state.routine = generateRoutine(state.equipment, state.muscleGroups);
  const intensity = computeIntensity(state.health);
  state.workSeconds = intensity.workSeconds;
  state.intensityNote = intensity.note;
  state.screen = 'overview';
  render();
}
function regenerate(){
  state.routine = generateRoutine(state.equipment, state.muscleGroups);
  render();
}
function backToEquip(){ state.screen='equip'; render(); }
function backToMuscles(){ state.screen='muscles'; render(); }

function startWorkout(){
  if(state.routine.length === 0) return;
  state.screen = 'workout';
  state.step = 0;
  state.secondsLeft = state.workSeconds;
  state.startedAt = Date.now();
  clearTimer();
  state.timerId = setInterval(tick, 1000);
  render();
}

function tick(){
  state.secondsLeft--;
  if(state.secondsLeft < 0){
    if(state.screen === 'workout'){
      if(state.step === state.routine.length-1){
        clearTimer();
        finishWorkout();
      } else {
        state.screen = 'rest';
        state.secondsLeft = REST;
      }
    } else if(state.screen === 'rest'){
      state.step++;
      state.screen = 'workout';
      state.secondsLeft = state.workSeconds;
    }
  }
  render();
}
function skipStep(){
  if(state.screen === 'workout'){
    if(state.step === state.routine.length-1){ clearTimer(); finishWorkout(); }
    else { state.screen='rest'; state.secondsLeft=REST; }
  } else if(state.screen === 'rest'){
    state.step++; state.screen='workout'; state.secondsLeft=state.workSeconds;
  }
  render();
}
function finishWorkout(){
  const today = new Date().toISOString().slice(0,10);
  const durationMinutes = state.startedAt
    ? Math.max(1, Math.round((Date.now()-state.startedAt)/60000))
    : Math.round(state.routine.length*(state.workSeconds+REST)/60);
  const groupCounts = {};
  state.routine.forEach(e=>{ groupCounts[e.group] = (groupCounts[e.group]||0)+1; });
  const esCardio = (groupCounts.cardio||0) >= state.routine.length/2;
  const session = {
    date: today,
    exerciseIds: state.routine.map(e=>e.id),
    exerciseNames: state.routine.map(e=>e.name),
    durationMinutes,
    esCardio,
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
  state.screen = 'equip';
  state.step = 0;
  render();
}
function goTab(tab){
  state.tab = tab;
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
    </div>`;
}

function renderContent(){
  if(state.tab === 'historial') return renderHistorial();
  if(state.tab === 'nube') return renderNube();
  // tab rutina
  switch(state.screen){
    case 'equip': return renderEquip();
    case 'muscles': return renderMuscles();
    case 'overview': return renderOverview();
    case 'workout': return renderWorkout();
    case 'rest': return renderRest();
    case 'done': return renderDone();
    default: return renderEquip();
  }
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
      <div class="eyebrow">Paso 1 de 2</div>
      <h1>¿Qué equipo tienes hoy?</h1>
      <div class="sub">Marca o desmarca según lo que tengas disponible</div>
    </header>
    <div class="equip-grid">${items}</div>
    <button class="btn-primary btn-block" onclick="confirmEquip()">Continuar</button>
  `;
}

function renderMuscles(){
  const items = MUSCLE_GROUPS.map(m=>{
    const sel = state.muscleGroups.includes(m.id);
    return `<div class="equip-item ${sel?'selected':''}" onclick="toggleMuscle('${m.id}')">
      <span class="icon">${m.icon}</span><span class="label">${m.label}</span>
    </div>`;
  }).join('');
  const healthStatus = state.health
    ? `🍏 Sueño ${state.health.sleepHours!=null?state.health.sleepHours.toFixed(1)+'h':'—'} · FC reposo ${state.health.restingHR!=null?state.health.restingHR+' bpm':'—'} <span style="opacity:.6;">(${timeAgo(state.health.syncedAt)})</span>`
    : 'Aún no sincronizado hoy';
  return `
    <header>
      <div class="eyebrow">Paso 2 de 2</div>
      <h1>¿Qué te sientes en condición de trabajar?</h1>
      <div class="sub">Desmarca zonas con fatiga o molestia</div>
    </header>
    <div class="equip-grid">${items}</div>
    <button class="btn-ghost btn-block" onclick="openHealthSyncShortcut()">🍏 Sincronizar con Apple Health</button>
    <p style="text-align:center;font-size:12.5px;color:var(--chalk-dim);margin:8px 0 4px;">${healthStatus}</p>
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
  const rows = state.routine.map(ex=>`
    <div class="ex-row"><span>${ex.name}<br><span class="tag">${ex.group}</span></span><span class="reps">${ex.reps}</span></div>
  `).join('');
  const intensityBanner = state.intensityNote
    ? `<div class="card" style="border-color:var(--accent);"><p style="font-size:13px;color:var(--chalk-dim);margin:0;">🍏 ${state.intensityNote}</p></div>`
    : '';
  return `
    <header>
      <div class="eyebrow">Tu rutina de hoy</div>
      <h1>${state.routine.length} ejercicios</h1>
      <div class="sub">${state.workSeconds}s trabajo / 15s descanso por estación</div>
    </header>
    ${intensityBanner}
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
  for(let i=0;i<state.routine.length;i++){
    const doneCls = i<state.step ? 'done':'';
    let pct=0;
    if(i===state.step){ pct = state.screen==='workout' ? Math.round(((state.workSeconds-state.secondsLeft)/state.workSeconds)*100) : 100; }
    segs += `<div class="seg ${doneCls}"><div class="fill" style="width:${pct}%"></div></div>`;
  }
  return `<div class="progress-track">${segs}</div>`;
}

function renderWorkout(){
  const ex = state.routine[state.step];
  return `
    <header>
      <div class="eyebrow">Entrenamiento</div>
      <h1>Estación ${state.step+1} de ${state.routine.length}</h1>
    </header>
    ${renderProgress()}
    <div class="card">
      <div class="stage-label"><span>En curso</span><span class="round">${ex.group}</span></div>
      <div class="ex-name">${ex.name}</div>
      <div class="ex-reps-big">${ex.reps}</div>
      <div class="illus" style="display:flex;gap:8px;align-items:center;justify-content:center;background:var(--plate);border-radius:10px;padding:10px 6px;margin-bottom:14px;">
        ${POSES[ex.pose]('#eae6dd','#ffb020')}
      </div>
      <ul class="cues"><li>${ex.desc}</li></ul>
      <div class="timer">${fmt(state.secondsLeft<0?0:state.secondsLeft)}</div>
      <button class="btn-ghost btn-block" onclick="skipStep()">Saltar</button>
    </div>
  `;
}

function renderRest(){
  const next = state.step < state.routine.length-1 ? state.routine[state.step+1] : null;
  return `
    <header><div class="eyebrow">Entrenamiento</div><h1>Descanso</h1></header>
    ${renderProgress()}
    <div class="card rest-screen">
      <div class="big">${fmt(state.secondsLeft<0?0:state.secondsLeft)}</div>
      ${next ? `<div class="next-label">Sigue</div><div class="next-name">${next.name}</div>` : `<div class="next-label">Última estación completada</div>`}
      <button class="btn-ghost btn-block" style="margin-top:14px;" onclick="skipStep()">Saltar descanso</button>
    </div>
  `;
}

function renderDone(){
  const groupsWorked = [...new Set(state.routine.map(e=>e.group))];
  const stretchItems = groupsWorked.filter(g=>STRETCHES[g]).map(g=>`
    <div class="ex-row"><span><b style="text-transform:capitalize">${g}</b><br><span class="tag">${STRETCHES[g]}</span></span></div>
  `).join('');
  return `
    <header><div class="eyebrow">¡Terminaste!</div><h1>Buen trabajo 💪</h1></header>
    <div class="card done-screen">
      <div class="big-num">${state.routine.length}/${state.routine.length}</div>
      <p>Ejercicios completados y guardados en tu historial.</p>
    </div>
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

  const sessionsHtml = history.length === 0
    ? `<div class="empty-state">Aún no hay entrenamientos guardados.<br>Completa tu primera rutina para verla aquí.</div>`
    : history.map(h=>`
      <div class="session-item">
        <div class="date">${h.date}</div>
        <div class="list">${h.exerciseNames.join(' · ')}</div>
      </div>
    `).join('');

  return `
    <header><div class="eyebrow">Tu progreso</div><h1>Historial</h1></header>
    <div class="stat-row">
      <div class="stat"><div class="num">${totalSessions}</div><div class="lbl">Total</div></div>
      <div class="stat"><div class="num">${thisWeek}</div><div class="lbl">Esta semana</div></div>
      <div class="stat"><div class="num">${streak}</div><div class="lbl">Racha (días)</div></div>
    </div>
    <div class="card">${sessionsHtml}</div>
    <div class="card">
      <div class="eyebrow" style="margin-bottom:8px;">🧪 Prueba de Apple Health (temporal)</div>
      <p style="color:var(--chalk-dim);font-size:12.5px;margin:0 0 10px;">Manda datos de ejemplo (20 min, no-cardio) al Shortcut "Rutina Gym - Registrar Entrenamiento" sin completar una rutina real. Revisa la consola del navegador para ver el JSON/URL exactos que se envían.</p>
      <button class="btn-ghost btn-block" onclick="testHealthLogShortcut()">Probar "Registrar en Apple Health"</button>
    </div>
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

/* ================= INICIO ================= */
handleShortcutCallback();
render();

/* Registrar service worker para funcionamiento offline */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
