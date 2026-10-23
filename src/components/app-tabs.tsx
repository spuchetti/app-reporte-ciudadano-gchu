import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { Fonts, Paleta } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Paleta.paperRaised}
      indicatorColor={Paleta.tealSoft}
      labelStyle={{
        default: { fontFamily: Fonts.medium, color: Paleta.inkSoft },
        selected: { fontFamily: Fonts.semiBold, color: Paleta.tealDeep },
      }}>
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
