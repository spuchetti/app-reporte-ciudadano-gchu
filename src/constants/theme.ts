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

export type ColorScheme = 'light' | 'dark';

export const Colors = {
  light: {
    text: Paleta.ink,
    background: Paleta.paperRaised,
    backgroundElement: Paleta.paper,
    backgroundSelected: Paleta.tealSoft,
    textSecondary: Paleta.inkSoft,

    // Design Tokens de Material Design 3 (Android)
    onBackground: Paleta.ink,
    surface: Paleta.paperRaised,
    onSurface: Paleta.ink,
    surfaceVariant: Paleta.paper,
    onSurfaceVariant: Paleta.inkSoft,
    primary: PaletaVecino.principal,
    onPrimary: '#FFFFFF',
    primaryContainer: PaletaVecino.suave,
    onPrimaryContainer: PaletaVecino.oscura,
    secondary: PaletaOperador.principal,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D6EAF8',
    onSecondaryContainer: PaletaOperador.oscura,
    outline: Paleta.line,
    error: Paleta.rojo,
    onError: '#FFFFFF',

    // Equivalentes dinámicos de Paleta para migrar pantallas sin cambiar nombres
    ink: Paleta.ink,
    inkSoft: Paleta.inkSoft,
    paper: Paleta.paper,
    paperRaised: Paleta.paperRaised,
    teal: Paleta.teal,
    tealDeep: Paleta.tealDeep,
    tealSoft: Paleta.tealSoft,
    operador: Paleta.operador,
    operadorDeep: Paleta.operadorDeep,
    orange: Paleta.orange,
    amarillo: Paleta.amarillo,
    azul: Paleta.azul,
    verde: Paleta.verde,
    rojo: Paleta.rojo,
    line: Paleta.line,
  },
  dark: {
    text: '#F1F5F9',
    background: '#0B121E',
    backgroundElement: '#162032',
    backgroundSelected: '#12353F',
    textSecondary: '#94A3B8',

    // Design Tokens de Material Design 3 (Android) en Modo Oscuro
    onBackground: '#F1F5F9',
    surface: '#162032',
    onSurface: '#F1F5F9',
    surfaceVariant: '#1E293B',
    onSurfaceVariant: '#94A3B8',
    primary: '#26C6DA',
    onPrimary: '#00363D',
    primaryContainer: '#004F58',
    onPrimaryContainer: '#A6EEFF',
    secondary: '#5499C7',
    onSecondary: '#0A2538',
    secondaryContainer: '#1B4F72',
    onSecondaryContainer: '#D6EAF8',
    outline: 'rgba(226,232,240,0.14)',
    error: '#F87171',
    onError: '#450A0A',

    // Equivalentes dinámicos de Paleta en Modo Oscuro
    ink: '#F1F5F9',
    inkSoft: '#94A3B8',
    paper: '#0B121E',
    paperRaised: '#162032',
    teal: '#26C6DA',
    tealDeep: '#00AFC1',
    tealSoft: '#12353F',
    operador: '#2471A3',
    operadorDeep: '#0F172A',
    orange: '#FB923C',
    amarillo: '#FACC15',
    azul: '#60A5FA',
    verde: '#4ADE80',
    rojo: '#F87171',
    line: 'rgba(226,232,240,0.14)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Palette = { [K in ThemeColor]: string };

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

export const ESTILO_MAPA_OSCURO = [
  { elementType: "geometry", stylers: [{ color: "#1d2c34" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e5c" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#163a34" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c6675" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
];
