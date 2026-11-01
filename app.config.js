/**
 * Extiende app.json. La clave de Maps sale del entorno, no del repo.
 * Copiá `.env.example` → `.env` y definí EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      },
    },
  },
});
