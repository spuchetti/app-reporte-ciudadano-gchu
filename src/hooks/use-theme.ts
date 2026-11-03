/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ColorScheme, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContext } from 'react';
import { TemaContext } from '@/contexto/tema';

export function useTheme(): Palette & {
  theme: ColorScheme;
  esOscuro: boolean;
  setTheme: (tema: ColorScheme) => void;
  alternarTema: () => void;
} {
  const context = useContext(TemaContext);
  const scheme = useColorScheme();
  const fallback: ColorScheme = scheme === 'dark' ? 'dark' : 'light';

  if (context) {
    return {
      ...context.palette,
      theme: context.theme,
      esOscuro: context.esOscuro,
      setTheme: context.setTheme,
      alternarTema: context.alternarTema,
    };
  }

  return {
    ...Colors[fallback],
    theme: fallback,
    esOscuro: fallback === 'dark',
    setTheme: () => {},
    alternarTema: () => {},
  };
}