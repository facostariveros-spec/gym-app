# Apple Health y Rutina Gym

## Instalar la lectura corregida

1. Instala el atajo desde el enlace de iCloud que muestra la app. No abras el archivo `.shortcut` directamente desde GitHub Pages: Safari muestra ese archivo binario como texto.
2. Déjalo con el nombre exacto **Rutina Gym - Leer Salud v2**. La app abre ese nombre al sincronizar.
3. Desde la app, toca **Sincronizar con Apple Health** y autoriza la lectura de sueño y frecuencia cardíaca en reposo cuando iOS lo solicite.
4. Al regresar, la app muestra el sueño de las **últimas 24 horas**, incluidas las siestas. No es necesariamente el total de la última noche que muestra Salud.

El atajo anterior medía la distancia entre el inicio más antiguo y el final más reciente. Eso incluía las horas despierto entre una siesta y la noche siguiente. No es posible corregir ese dato escalar una vez recibido: es necesario actualizar el atajo.

## Cálculo y límites

El atajo consulta dos días de muestras para incluir intervalos que cruzan el comienzo de la ventana. Envía inicio, final (ISO 8601 con zona horaria) y fase en `sleepSamplesTSV`, con `schemaVersion: 2`. La app recorta a las últimas 24 horas, une intervalos dormidos superpuestos, omite tiempo en cama y resta períodos explícitamente despierto. No suma registros duplicados de diferentes dispositivos.

No reproduce la prioridad de fuentes configurada dentro de Salud: si dos fuentes discrepan, los intervalos despierto prevalecen. Los nombres de fase en español e inglés y los códigos HealthKit 0–5 están soportados. Una fase desconocida o una fecha inválida invalida el total, en vez de mostrar una suma parcial. Sin muestras se muestra «—», no cero horas. Los totales del atajo anterior y datos sincronizados hace 24 horas o más no se usan para calcular intensidad.

La app conserva el resumen local; no almacena la lista de intervalos en localStorage. El transporte sigue siendo el callback de Atajos usado por la app.

`Leer-Salud-v2.plist` es el flujo editable. `Leer-Salud-v2.shortcut` está firmado mediante la herramienta oficial de Apple. Firma y pruebas automáticas no sustituyen la prueba en un iPhone con Salud: deben comprobarse los permisos, los nombres de fase y el retorno a Safari/PWA.

## Escritura

La app existente abre **Rutina Gym - Registrar Entrenamiento** para escribir entrenamientos mediante Atajos. Este cambio no modifica ese atajo ni escribe sueño calculado de vuelta a Salud. Para auditar la escritura y evitar duplicados al reintentar, se necesita también el atajo de registro.

## Verificación

Ejecutar desde la raíz del proyecto:

```sh
node --test tests/*.test.js
```

Incluye siestas separadas de la noche, duplicados, despertares, límites de ventana, zonas horarias, ausencia de muestras, entrada inválida, migración del contrato antiguo, callback, persistencia y selección de pelota de yoga.
