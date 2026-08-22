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

const DriveSync = {
  tokenClient: null,
  accessToken: null,
  tokenExpiresAt: 0,
  fileId: null,
  connected: false,
  lastSync: null,

  init(onReady){
    try{ DriveSync.connected = localStorage.getItem(DRIVE_CONNECTED_KEY) === '1'; }catch(e){}
    // Espera a que la librería de Google esté cargada
    const check = setInterval(()=>{
      if(window.google && google.accounts && google.accounts.oauth2){
        clearInterval(check);
        DriveSync.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: DRIVE_SCOPE,
          callback: (resp)=>{
            if(resp.error){
              console.error('Auth error', resp);
              DriveSync.connected = false;
              try{ localStorage.removeItem(DRIVE_CONNECTED_KEY); }catch(e){}
              DriveSync._pendingAction = null;
              return;
            }
            DriveSync.accessToken = resp.access_token;
            DriveSync.tokenExpiresAt = Date.now() + (resp.expires_in*1000);
            DriveSync.connected = true;
            try{ localStorage.setItem(DRIVE_CONNECTED_KEY, '1'); }catch(e){}
            if(DriveSync._pendingAction){
              const action = DriveSync._pendingAction;
              DriveSync._pendingAction = null;
              action();
            }
          }
        });
        // Si algo llamó a connect() antes de que esta librería terminara de cargar
        // (pasa justo al volver de un Shortcut, donde el callback corre casi al instante),
        // ya no quedó tronando — retoma la solicitud ahora que el cliente ya existe.
        if(DriveSync._requestPending){
          DriveSync._requestPending = false;
          DriveSync.tokenClient.requestAccessToken({ prompt: DriveSync.connected ? '' : 'consent' });
        }
        if(onReady) onReady();
      }
    }, 200);
  },

  isTokenValid(){
    return DriveSync.accessToken && Date.now() < DriveSync.tokenExpiresAt - 5000;
  },

  // Pide el token (muestra popup de Google la primera vez)
  connect(callback){
    if(DriveSync.isTokenValid()){ if(callback) callback(); return; }
    DriveSync._pendingAction = callback || function(){};
    if(!DriveSync.tokenClient){
      // La librería de Google todavía no cargó — no truena, espera a que init() la retome.
      DriveSync._requestPending = true;
      return;
    }
    DriveSync.tokenClient.requestAccessToken({ prompt: DriveSync.connected ? '' : 'consent' });
  },

  disconnect(){
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
