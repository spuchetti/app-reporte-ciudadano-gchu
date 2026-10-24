/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const PaletaVecino = {
  principal: '#00AFC1',
  oscura: '#007C8C',
  suave: '#E6F7F9',
} as const;

export const PaletaOperador = {
  principal: '#1B4F72',
  oscura: '#123B57',
} as const;

export const Paleta = {
  ink: '#0F172A',
  inkSoft: '#61707D',
  paper: '#F5F7FA',
  paperRaised: '#FFFFFF',
  teal: PaletaVecino.principal,
  tealDeep: PaletaVecino.oscura,
  tealSoft: PaletaVecino.suave,
  operador: PaletaOperador.principal,
  operadorDeep: PaletaOperador.oscura,
  orange: '#E8630C',
  amarillo: '#F2B705',
  azul: '#2E6E9E',
  verde: '#2F9E52',
  rojo: '#D64545',
  line: 'rgba(38,55,70,0.14)',
} as const;

const ALFA_FONDO = '22';

export function fondoSuave(color: string) {
  return `${color}${ALFA_FONDO}`;
}

export const Colors = {
  light: {
    text: Paleta.ink,
    background: Paleta.paperRaised,
    backgroundElement: Paleta.paper,
    backgroundSelected: Paleta.tealSoft,
    textSecondary: Paleta.inkSoft,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: Platform.select({
    ios: 'ui-monospace',
    web: 'var(--font-mono)',
    default: 'monospace',
  }),
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
