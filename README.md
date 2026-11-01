# App Reporte Ciudadano — Gualeguaychú

Aplicación móvil para que los vecinos reporten problemas urbanos (baches, luminarias, residuos, etc.) y el municipio los gestione desde una bandeja de operador.

Construida con **Expo SDK 54**, **React Native** y **Expo Router**. Consume la API `api-reporte-ciudadano` (proyecto hermano).

---

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| **Vecino** | Crear reportes en pasos, adherirse a reportes cercanos, ver Mis reportes e historial, recibir push al cambiar el estado |
| **Operador** | Bandeja, filtros, asignar cuadrilla, cambiar estado, corregir zona, marcar duplicado, escanear QR |
| **Invitado** | Explorar el mapa y flujos públicos limitados |

---

## Stack

- **Expo ~54** · React Native 0.81 · React 19 · TypeScript
- **Expo Router** (navegación por archivos)
- **Axios** hacia la API
- **Persistencia:** `expo-sqlite` (borradores y cola offline), `expo-sqlite/kv-store` (preferencias), `expo-secure-store` (sesión / tokens)
- **Mapas:** `react-native-maps` + Google Maps (Android)
- **Push:** `expo-notifications` + FCM (solo en *development build*)
- **Red:** `expo-network` (sincronizar cola al recuperar internet)

---

## Requisitos

- Node.js **20+**
- npm
- Cuenta Expo / EAS (para builds nativos)
- API local o remota levantada (`api-reporte-ciudadano` con Docker Compose)
- Teléfono físico recomendado para mapa Android, cámara, biometría y **push**

---

## Configuración

1. Clonar el repositorio e instalar dependencias:

```bash
npm ci
```

2. Crear un archivo `.env` en la raíz (no se versiona) con las URLs de la API:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL_EMULADOR=http://10.0.2.2:3000
EXPO_PUBLIC_API_URL_TELEFONO=http://<IP-DE-TU-PC>:3000
```

La app elige la URL según plataforma: PC/web → `EXPO_PUBLIC_API_URL`; emulador Android → `EXPO_PUBLIC_API_URL_EMULADOR`; teléfono físico → `EXPO_PUBLIC_API_URL_TELEFONO`.

3. Tener la API accesible desde el dispositivo (misma Wi‑Fi; en el teléfono no uses `localhost`).

4. Android: `google-services.json` en la raíz (FCM) y clave de Maps configurada en `app.json` / Google Cloud.

---

## Cómo correrla

### Development build (recomendado)

Mapa nativo, SQLite, notificaciones push y cámara completa requieren un **dev client**, no Expo Go.

```bash
# Generar APK de desarrollo (EAS)
eas build --profile development --platform android

# Instalar el APK en el teléfono y luego:
npx expo start --dev-client
```

Escaneá el QR con la app del development build.

### Web / emulador (limitado)

```bash
npm start
# o
npm run web
```

En web no hay push ni SQLite nativo completo; la persistencia offline queda en memoria.

### Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm start` | Metro / Expo |
| `npx expo start --dev-client` | Metro apuntando al development build |
| `npm test` | Jest (una corrida) |
| `npm run test:watch` | Jest en watch |
| `npm run lint` | ESLint (config Expo) |
| `npm run android` / `npm run ios` | `expo run:*` nativo local |

---

## Estructura del proyecto

```
src/
  app/           Pantallas (Expo Router)
    (publico)/   Login, registro, mapa público
    (tabs)/      Home, Mis reportes, etc. (vecino)
    (operador)/  Bandeja, detalle, zonas
    reclamo/     Detalle de reclamo (vecino / gestión)
    reporte/     Asistente de alta
  components/    UI, mapa, sheets del operador, pasos del reporte
  servicios/     API, auth, reportes, bandeja, persistencia, notificaciones
  contexto/      Sesión y origen de navegación
  mocks/         Datos de demo / pruebas
  tipos/         Tipos TypeScript
assets/          Branding e íconos
```

---

## Persistencia

| Dato | Dónde |
| --- | --- |
| Preferencias de ingreso, flags no sensibles | `expo-sqlite/kv-store` |
| Sesión y tokens | `expo-secure-store` |
| Borrador del reporte en curso | SQLite (`borradores_reporte`) |
| Reportes creados sin red | SQLite (`cola_reportes`), sync al volver internet o al abrir Mis reportes |

---

## Notificaciones push

- Se registran al **ingresar** (`POST /dispositivos` con el Expo Push Token).
- Llegan al **vecino autor** del reporte cuando cambia el estado o hay adhesiones (si `avisosActivos` es `true`).
- El **operador no recibe** esas push.
- Al tocar la notificación se abre el detalle del reclamo.
- Requieren **teléfono físico** + development build con FCM.

Prueba rápida (con sesión de vecino): `POST /dispositivos/prueba` en la API.

---

## Flujo de trabajo Git

1. Partir de `develop`.
2. Rama `feature/...` o `fix/...`.
3. Abrir PR hacia `develop`.
4. CI verde + review → merge.

Mensajes de commit en español, enfocados en el *porqué*.

---

## API relacionada

Backend: **api-reporte-ciudadano** (Docker Compose, seeds de zonas/cuadrillas/reportes).

La app no incluye el compose de la API; levantala en ese repositorio y apuntá el `.env` a su URL.

---

## Licencia

Ver [LICENSE](./LICENSE).
