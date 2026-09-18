import React from 'react';
import { render } from '@testing-library/react-native';
import HomeVecinoScreen from '../src/app/(tabs)/index';

jest.mock('@/global.css', () => '');

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <View>{children}</View>,
    Marker: ({ children }: any) => <View>{children}</View>,
    Callout: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: ({ children }: any) => <View>{children}</View> };
});

jest.mock('@/contexto/sesion', () => ({
  useSesion: () => ({
    sesion: { esInvitado: false, usuario: { nombre: 'Mirko' } },
    cerrarSesion: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

test('renderiza la cabecera y el botón de cerrar sesión correctamente', async () => {

  const { getByText } = await render(<HomeVecinoScreen />);

  expect(getByText('Hola')).toBeTruthy();
  expect(getByText('Mirko')).toBeTruthy();
  expect(getByText('Cerrar sesión')).toBeTruthy();
});