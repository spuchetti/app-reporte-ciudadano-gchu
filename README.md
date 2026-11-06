<p align="center">
  <img src="assets/branding/generated/icono-app.png" alt="Reporte Ciudadano Gualeguaychú" width="120" />
</p>

<h1 align="center">App Reporte Ciudadano - Gualeguaychú</h1>

<p align="center">
  Vecinos reportan problemas urbanos · Operadores los gestionan desde el celular
</p>

<p align="center">
  <a href="https://docs.expo.dev/versions/v54.0.0/"><img alt="Expo SDK" src="https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo&logoColor=white" /></a>
  <a href="https://reactnative.dev/"><img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black" /></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" /></a>
  <a href="https://github.com/spuchetti/app-reporte-ciudadano-gchu/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/spuchetti/app-reporte-ciudadano-gchu/ci.yml?branch=develop&style=flat-square&label=CI" /></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-green?style=flat-square" /></a>
</p>

---

Aplicación móvil para reportar baches, luminarias, residuos y otros reclamos ciudadanos, con bandeja de gestión municipal. Incluye modo claro/oscuro y una vista web limitada para demos.

**Stack principal:** Expo SDK 54 · React Native · Expo Router · TypeScript  
**Backend:** API hermana `api-reporte-ciudadano` (Docker Compose)

## Contenido

- [Roles](#roles)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Configuración](#configuración)
- [Cómo correrla](#cómo-correrla)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Persistencia](#persistencia)
- [Notificaciones push](#notificaciones-push)
- [Flujo de trabajo Git](#flujo-de-trabajo-git)
- [API relacionada](#api-relacionada)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Roles

| Rol | Qué puede hacer |
| :---: | --- |
| **Vecino** | Crear reportes en pasos, adherirse a reportes cercanos, ver Mis reportes e historial, recibir push al cambiar el estado |
| **Operador** | Bandeja, filtros, asignar cuadrilla, cambiar estado, corregir zona, marcar duplicado, escanear QR |
| **Invitado** | Explorar el mapa y flujos públicos limitados |

---

## Stack

| Área | Tecnología |
| --- | --- |
| App | Expo ~54 · React Native 0.81 · React 19 · TypeScript |
| Navegación | Expo Router (archivos) |
| HTTP | Axios |
| Persistencia | `expo-sqlite` · `expo-sqlite/kv-store` · `expo-secure-store` |
| Mapas | `react-native-maps` + Google Maps (Android) |
| Push | `expo-notifications` + FCM (*development build*) |
| Tema | Claro / oscuro (`TemaProvider`, preferencia en kv-store) |
| Red | `expo-network` (sync de cola offline) |
| Web | Stubs `*.web` (sin push ni SQLite nativo) |

---

## Requisitos

- Node.js **20+** y npm
- Cuenta Expo / EAS (builds nativos)
- API `api-reporte-ciudadano` levantada (Compose)
- Teléfono físico recomendado para mapa Android, cámara, biometría y **push**

> [!TIP]
> Push, SQLite nativo y mapa Android **no** se prueban bien en Expo Go: usá un *development build*.

---

## Configuración

```bash
npm ci
```

Copiá [`.env.example`](./.env.example) a `.env` *(no se versiona)* y ajustá las URLs:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL_EMULADOR=http://10.0.2.2:3000
EXPO_PUBLIC_API_URL_TELEFONO=http://<IP-DE-TU-PC>:3000
```

| Variable | Cuándo se usa |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | PC / web |
| `EXPO_PUBLIC_API_URL_EMULADOR` | Emulador Android (`10.0.2.2`) |
| `EXPO_PUBLIC_API_URL_TELEFONO` | Teléfono físico (IP de la PC en el Wi-Fi) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps en Android (`app.config.js`) |

**También necesitás:**

1. API accesible desde el dispositivo (misma red; en el teléfono no uses `localhost`).
2. `google-services.json` en la raíz **(no se versiona)**: descargalo de Firebase o copiá desde `google-services.json.example` y completalo. En EAS, subilo como archivo secreto del build.
3. Clave de Maps en `.env` (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`), restringida en Google Cloud (package + SHA-1).

---

## Cómo correrla

### Development build <kbd>recomendado</kbd>

```bash
# APK de desarrollo (EAS)
eas build --profile development --platform android

# Con el APK instalado:
npx expo start --dev-client
```

Escaneá el QR con la app del development build.

### Web / emulador <kbd>limitado</kbd>

```bash
npm start
# o
npm run web
```

En web hay pantallas y tema vía archivos `*.web`, pero no hay push ni SQLite nativo; la cola offline queda en memoria.

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` | Metro / Expo |
| `npx expo start --dev-client` | Metro + development build |
| `npm test` | Jest (una corrida) |
| `npm run test:watch` | Jest en watch |
| `npm run lint` | ESLint (Expo) |
| `npm run android` / `npm run ios` | `expo run:*` local |

---

## Estructura del proyecto

```text
src/
├── app/              # Pantallas (Expo Router)
│   ├── (publico)/    # Login, registro, mapa público
│   ├── (tabs)/       # Home, Mis reportes (vecino)
│   ├── (operador)/   # Bandeja, detalle, zonas
│   ├── reclamo/      # Detalle de reclamo
│   └── reporte/      # Asistente de alta
├── components/       # UI, mapa, sheets, pasos del reporte
├── servicios/        # API, auth, reportes, persistencia, push
├── contexto/         # Sesión y origen de navegación
├── mocks/            # Datos de demo / pruebas
└── tipos/            # TypeScript
assets/               # Branding e íconos
```

---

## Persistencia

| Dato | Dónde |
| --- | --- |
| Preferencias / flags no sensibles (incluye tema) | `expo-sqlite/kv-store` |
| Sesión y tokens | `expo-secure-store` |
| Borrador del reporte en curso | SQLite → `borradores_reporte` |
| Reportes creados sin red | SQLite → `cola_reportes` *(sync al volver internet o al abrir Mis reportes)* |

> [!IMPORTANT]
> Los **tokens no van** en el kv-store. Solo SecureStore (o `localStorage` en web).

---

## Notificaciones push

```text
Vecino inicia sesión
        │
        ▼
POST /dispositivos  (Expo Push Token)
        │
        ▼
Operador cambia estado / adhesión
        │
        ▼
Push al autor  →  toque abre /reclamo/:id
```

- Destinatario: **vecino autor** (con `avisosActivos: true`).
- El **operador no recibe** esas push.
- Requiere teléfono físico + development build con FCM.

**Prueba rápida:** con sesión de vecino, `POST /dispositivos/prueba` en la API.

---

## Flujo de trabajo Git

```text
develop ──► feature/… o fix/… ──► PR ──► CI + review ──► merge
```

Detalle en [CONTRIBUTING.md](./CONTRIBUTING.md). Resumen:

1. Partir de `develop`.
2. Rama `feature/...`, `fix/...`, `docs/...` o `chore/...`.
3. PR hacia `develop` (hay plantilla en `.github/`).
4. CI verde + review → merge.

Commits en español, enfocados en el *porqué*.

---

## API relacionada

Backend: **api-reporte-ciudadano** (Compose, seeds de zonas / cuadrillas / reportes).

Este repo **no** incluye el Compose de la API: levantala en ese proyecto y apuntá el `.env` a su URL.

---

## Contribuir

Leé [CONTRIBUTING.md](./CONTRIBUTING.md). Para bugs o ideas usá las plantillas de **Issues** en GitHub.

---

## Licencia

Distribuida bajo [MIT](./LICENSE).
