import { LogBox, Platform } from "react-native";

/**
 * Tras apagar/prender pantalla (o al cerrar el prompt biométrico), Expo DevTools
 * llama a keep-awake y a veces falla con una promesa sin catch. Eso abre LogBox
 * y parece que la app se rompió aunque el desbloqueo ya haya terminado.
 *
 * Importar este módulo al inicio del layout.
 */

const TEXTO_KEEP_AWAKE = "Unable to activate keep awake";

function esErrorKeepAwake(error: unknown): boolean {
  if (!error) {
    return false;
  }
  if (typeof error === "string") {
    return error.includes(TEXTO_KEEP_AWAKE);
  }
  if (error instanceof Error) {
    return error.message.includes(TEXTO_KEEP_AWAKE);
  }
  try {
    return String(error).includes(TEXTO_KEEP_AWAKE);
  } catch {
    return false;
  }
}

if (Platform.OS !== "web") {
  LogBox.ignoreLogs([TEXTO_KEEP_AWAKE]);
}

try {
  // useKeepAwake de DevTools termina en ExpoKeepAwake.activate.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExpoKeepAwake = require("expo-keep-awake/src/ExpoKeepAwake").default as {
    activate?: (tag: string) => Promise<void> | void;
  };
  if (ExpoKeepAwake && typeof ExpoKeepAwake.activate === "function") {
    const originalActivate = ExpoKeepAwake.activate.bind(ExpoKeepAwake);
    ExpoKeepAwake.activate = async (tag: string) => {
      try {
        await originalActivate(tag);
      } catch (error) {
        if (!esErrorKeepAwake(error)) {
          throw error;
        }
      }
    };
  }
} catch {
  // Tests / web / binario sin el nativo.
}

try {
  // Filtra el rechazo si alguna promesa previa ya quedó pending sin catch.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tracking = require("promise/setimmediate/rejection-tracking") as {
    enable: (config: {
      allRejections: boolean;
      onUnhandled: (id: number, error: unknown) => void;
      onHandled: (id: number) => void;
    }) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const opcionesRn = require("react-native/Libraries/promiseRejectionTrackingOptions");
  const base = (opcionesRn?.default ?? opcionesRn) as {
    onUnhandled?: (id: number, error: unknown) => void;
    onHandled?: (id: number) => void;
  };

  tracking.enable({
    allRejections: true,
    onUnhandled: (id, error) => {
      if (esErrorKeepAwake(error)) {
        return;
      }
      base.onUnhandled?.(id, error);
    },
    onHandled: (id) => {
      base.onHandled?.(id);
    },
  });
} catch {
  // Sin tracker: LogBox + parche alcanzan en la mayoría de los casos.
}
