import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon src={require('@/assets/images/tabIcons/home.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mis-reportes">
        <Label>Mis Reportes</Label>
        <Icon src={require('@/assets/images/tabIcons/explore.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="reportar" hidden>
        <Label>Reportar</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
