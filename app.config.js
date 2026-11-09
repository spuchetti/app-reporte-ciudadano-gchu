/**
 * Extiende app.json. La clave de Maps sale del entorno, no del repo.
 * Copiá `.env.example` → `.env` y definí EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    },
  },
});
