/* =========================================================
   SINCRONIZACIÓN CON GOOGLE DRIVE (appDataFolder)
   Requiere reemplazar GOOGLE_CLIENT_ID con tu propio Client ID
   (ver instrucciones al final de este archivo)
   ========================================================= */

const GOOGLE_CLIENT_ID = '6700070894-7t3k74dlu2htfek4ktmngrr52retralq.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILENAME = 'rutina-gym-backup.json';
// Google Identity Services no da refresh token en el navegador: el access token dura ~1h y
// vive solo en memoria. Lo único que persistimos es "el usuario ya dio consentimiento antes",
// para poder pedir un token nuevo en silencio (sin popup) en vez de mostrar "desconectado"
// cada vez que la página se recarga (cosa que ahora pasa seguido por los rebotes con Shortcuts).
const DRIVE_CONNECTED_KEY = 'rutina-gym:drive-connected';

// Logging de diagnóstico para el problema de reconexión silenciosa tras Shortcuts.
// Se deja encendido a propósito (no solo en debug) porque el bug es intermitente
// y depende del dispositivo/contexto real — hay que verlo en Safari Web Inspector
// desde un iPhone conectado a una Mac, no se puede reproducir de forma confiable local.
function driveLog(...args){
  const t = new Date().toISOString().slice(11,23);
  console.log(`[DriveSync ${t}]`, ...args);
}

const DriveSync = {
  tokenClient: null,
  accessToken: null,
  tokenExpiresAt: 0,
  fileId: null,
  connected: false,
  lastSync: null,
  // Cola de quienes están esperando el resultado de la solicitud de token EN CURSO.
  // Antes esto era una sola variable (_pendingAction/_pendingError) y si dos llamadas a
  // connect() llegaban casi al mismo tiempo (p.ej. el auto-sync al volver de Shortcuts y el
  // dashboard pidiendo datos de Drive a la vez), la segunda pisaba a la primera y esa
  // quedaba esperando para siempre. Con la cola, todas las llamadas que lleguen mientras
  // hay una solicitud en curso se resuelven juntas con el mismo resultado.
  _pendingQueue: [],
  _requestInFlight: false,
  _requestPending: false, // hay una solicitud esperando a que cargue la librería de Google

  init(onReady){
    const t0 = Date.now();
    let flagRaw = null, readError = null;
    try{ flagRaw = localStorage.getItem(DRIVE_CONNECTED_KEY); }catch(e){ readError = e; }
    DriveSync.connected = flagRaw === '1';
    if(readError){
      driveLog('init: no se pudo leer localStorage (¿modo privado?)', readError);
    } else {
      driveLog(`init: flag "${DRIVE_CONNECTED_KEY}" en localStorage = ${JSON.stringify(flagRaw)} -> connected = ${DriveSync.connected}`);
    }
    driveLog('init: esperando a que window.google.accounts.oauth2 esté disponible...');
    let ticks = 0;
    // Espera a que la librería de Google esté cargada
    const check = setInterval(()=>{
      ticks++;
      if(window.google && google.accounts && google.accounts.oauth2){
        clearInterval(check);
        driveLog(`init: librería de Google lista tras ${Date.now()-t0}ms (${ticks} intentos de 200ms)`);
        DriveSync.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: DRIVE_SCOPE,
          callback: (resp)=>{
            const elapsed = Date.now() - (DriveSync._lastRequestAt || t0);
            DriveSync._requestInFlight = false;
            const queue = DriveSync._pendingQueue;
            DriveSync._pendingQueue = [];
            if(resp.error){
              // GIS puede mandar error, error_description y a veces error_uri (formato OAuth2).
              // El código exacto (user_logged_out, consent_required, access_denied, etc.) es
              // lo que nos dice si es partición de cookies del WebView o algo distinto.
              driveLog(`respuesta de Google: ERROR tras ${elapsed}ms — código="${resp.error}" descripción="${resp.error_description||'(sin descripción)'}" objeto completo:`, resp);
              console.error('Auth error', resp);
              DriveSync.connected = false;
              try{
                localStorage.removeItem(DRIVE_CONNECTED_KEY);
                driveLog('flag de localStorage BORRADO porque la reconexión silenciosa falló de verdad');
              }catch(e){ driveLog('no se pudo borrar el flag de localStorage', e); }
              queue.forEach(p => p.onError(resp));
              return;
            }
            driveLog(`respuesta de Google: OK tras ${elapsed}ms — token expira en ${resp.expires_in}s`);
            DriveSync.accessToken = resp.access_token;
            DriveSync.tokenExpiresAt = Date.now() + (resp.expires_in*1000);
            DriveSync.connected = true;
            try{ localStorage.setItem(DRIVE_CONNECTED_KEY, '1'); }catch(e){ driveLog('no se pudo guardar el flag de localStorage', e); }
            queue.forEach(p => p.callback());
          }
        });
        // Si algo llamó a connect() antes de que esta librería terminara de cargar
        // (pasa justo al volver de un Shortcut, donde el callback corre casi al instante),
        // ya no quedó tronando — retoma la solicitud ahora que el cliente ya existe.
        if(DriveSync._requestPending){
          DriveSync._requestPending = false;
          DriveSync._requestInFlight = true;
          const prompt = DriveSync.connected ? '' : 'consent';
          DriveSync._lastRequestAt = Date.now();
          driveLog(`init: había una solicitud pendiente de antes — pidiendo token ahora con prompt: '${prompt}'`);
          DriveSync.tokenClient.requestAccessToken({ prompt });
        }
        if(onReady) onReady();
      }
    }, 200);
  },

  isTokenValid(){
    return DriveSync.accessToken && Date.now() < DriveSync.tokenExpiresAt - 5000;
  },

  // Pide el token (muestra popup de Google la primera vez). onError es opcional —
  // sin él, una renovación silenciosa que falla (común en iOS Safari) dejaba a quien
  // llamó esperando para siempre sin ningún aviso.
  connect(callback, onError){
    if(DriveSync.isTokenValid()){
      driveLog('connect(): token en memoria todavía válido, no se pide uno nuevo');
      if(callback) callback();
      return;
    }
    DriveSync._pendingQueue.push({ callback: callback || function(){}, onError: onError || function(){} });
    if(DriveSync._requestInFlight){
      driveLog(`connect(): ya hay una solicitud en curso, se encola (total esperando: ${DriveSync._pendingQueue.length})`);
      return; // ya hay una solicitud en curso, se resuelve con la cola de arriba
    }
    if(!DriveSync.tokenClient){
      // La librería de Google todavía no cargó — no truena, espera a que init() la retome.
      driveLog('connect(): la librería de Google todavía no está lista, se marca como pendiente');
      DriveSync._requestPending = true;
      return;
    }
    DriveSync._requestInFlight = true;
    const prompt = DriveSync.connected ? '' : 'consent';
    DriveSync._lastRequestAt = Date.now();
    driveLog(`connect(): pidiendo token con prompt: '${prompt}' (DriveSync.connected=${DriveSync.connected})`);
    DriveSync.tokenClient.requestAccessToken({ prompt });
  },

  disconnect(){
    driveLog('disconnect(): desconectando manualmente y borrando el flag de localStorage');
    if(DriveSync.accessToken){
      google.accounts.oauth2.revoke(DriveSync.accessToken, ()=>{});
    }
    DriveSync.accessToken = null;
    DriveSync.connected = false;
    DriveSync.fileId = null;
    try{ localStorage.removeItem(DRIVE_CONNECTED_KEY); }catch(e){}
  },

  async _findFileId(){
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${DriveSync.accessToken}` } }
    );
    const data = await res.json();
    if(data.files && data.files.length > 0) return data.files[0].id;
    return null;
  },

  // Sube (crea o actualiza) el backup en el appDataFolder
  async upload(jsonData){
    if(!DriveSync.isTokenValid()) throw new Error('No autenticado');
    if(!DriveSync.fileId) DriveSync.fileId = await DriveSync._findFileId();

    const metadata = DriveSync.fileId
      ? { name: BACKUP_FILENAME }
      : { name: BACKUP_FILENAME, parents: ['appDataFolder'] };

    const boundary = '-------rutinagym' + Date.now();
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(jsonData)}\r\n` +
      `--${boundary}--`;

    const url = DriveSync.fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${DriveSync.fileId}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const res = await fetch(url, {
      method: DriveSync.fileId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${DriveSync.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });
    const data = await res.json();
    if(data.id) DriveSync.fileId = data.id;
    DriveSync.lastSync = new Date().toISOString();
    return data;
  },

  // Descarga el backup guardado (para restaurar en un teléfono nuevo)
  async download(){
    if(!DriveSync.isTokenValid()) throw new Error('No autenticado');
    if(!DriveSync.fileId) DriveSync.fileId = await DriveSync._findFileId();
    if(!DriveSync.fileId) return null; // no hay backup todavía

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${DriveSync.fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${DriveSync.accessToken}` } }
    );
    if(!res.ok) return null;
    return await res.json();
  }
};

/* =========================================================
   CÓMO OBTENER TU GOOGLE_CLIENT_ID (una sola vez, gratis):

   1. Ve a https://console.cloud.google.com/ e inicia sesión
   2. Crea un proyecto nuevo (cualquier nombre, ej. "rutina-gym")
   3. Ve a "APIs y servicios" → "Biblioteca" → busca "Google Drive API" → Habilitar
   4. Ve a "APIs y servicios" → "Pantalla de consentimiento OAuth"
      - Tipo de usuario: Externo → Crear
      - Llena nombre de la app y tu correo → Guardar (puedes dejarlo en modo "Prueba")
      - En "Usuarios de prueba" agrega tu propio correo de Gmail
   5. Ve a "APIs y servicios" → "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth"
      - Tipo de aplicación: "Aplicación web"
      - En "Orígenes de JavaScript autorizados" agrega la URL donde publicaste tu app,
        ej: https://tuusuario.github.io
      - Crear
   6. Copia el "Client ID" (termina en .apps.googleusercontent.com)
   7. Pégalo arriba en GOOGLE_CLIENT_ID reemplazando 'REEMPLAZA_ESTO...'
   ========================================================= */
