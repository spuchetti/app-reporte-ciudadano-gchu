# Cómo contribuir

Guía corta para trabajar en **app-reporte-ciudadano-gchu**.

## Antes de empezar

1. Leé el [README](./README.md).
2. Copiá [`.env.example`](./.env.example) a `.env` y apuntá a tu API.
3. Usá un **development build** si vas a probar mapa Android, SQLite, cámara o push.

## Ramas

| Prefijo | Uso |
| --- | --- |
| `feature/…` | Funcionalidad nueva |
| `fix/…` | Corrección |
| `docs/…` | Documentación |
| `chore/…` | Tooling, CI, meta del repo |

Base habitual: **`develop`**.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/mi-cambio
```

## Commits

- En **español**.
- Enfocados en el *porqué*, no en listar archivos.
- Un commit coherente por intención (evitar “wip” en `develop`).

Ejemplos:

```text
Persistir el borrador del reporte para recuperarlo al reabrir la app.
Corregir la sincronización de la cola cuando vuelve internet.
```

## Pull requests

1. PR hacia **`develop`**.
2. Título claro; body con **Summary** y **Test plan**.
3. CI verde (`npm test` / workflow).
4. Al menos una review (salvo bypass de admin).

Podés usar la plantilla de PR del repo.

## Qué no subir

- `.env` real, tokens, claves privadas.
- `google-services.json` real (usá `google-services.json.example` como plantilla).
- `node_modules/`, builds (`.expo/`, APK, etc.).

Para FCM: copiá el JSON de Firebase a la raíz (gitignored) o cargalo como secret de archivo en EAS (`GOOGLE_SERVICES_FILE` / `googleServicesFile`).

## Tests y lint

```bash
npm test
npm run lint
```

## Dudas

Abrí un issue o comentá en el PR. Para la API usá el repositorio hermano `api-reporte-ciudadano`.
