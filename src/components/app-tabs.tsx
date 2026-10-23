import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

      <NativeTabs.Trigger name="reportar">
        <Label>Reportar</Label>
        <Icon src={<VectorIcon family={MaterialCommunityIcons} name="plus-circle-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mis-reportes">
        <Label>Mis Reportes</Label>
        <Icon src={require('@/assets/images/tabIcons/explore.png')} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
