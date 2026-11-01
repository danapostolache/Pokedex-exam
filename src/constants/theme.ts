import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0E0940',
    background: '#EDF6FF',
    backgroundElement: '#F6F6FF',
    backgroundSelected: '#E7E0FF',
    textSecondary: '#625F79',
    card: '#FFFFFF',
    badge: '#5631E8',
    badgeText: '#FFFFFF',
    border: '#DADAE5',
    backdrop: 'rgba(0,0,0,0.30)',
    sheet: '#F0F0F0',
    action: '#006DF8',
    shadow: '#303773',
    danger: '#A5213D',
    disabled: '#75718A',
  },
  dark: {
    text: '#F4F0FF',
    background: '#17152D',
    backgroundElement: '#27233E',
    backgroundSelected: '#3D3265',
    textSecondary: '#C0B9D2',
    card: '#211D36',
    badge: '#B4A0FF',
    badgeText: '#17152D',
    border: '#514A67',
    backdrop: 'rgba(0,0,0,0.55)',
    sheet: '#2C273E',
    action: '#A2C9FF',
    shadow: '#000000',
    danger: '#FFADBA',
    disabled: '#B0A9BF',
  },
};
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: 'Rubik-Regular',
  medium: 'Rubik-Medium',
  bold: 'Rubik-Bold',
  rounded: 'Rubik-Regular',
  serif: Platform.OS === 'ios' ? 'ui-serif' : 'serif',
  mono: Platform.OS === 'ios' ? 'ui-monospace' : 'monospace',
};
export const Spacing = { half: 2, one: 4, oneHalf: 6, two: 8, twoHalf: 12, three: 16, threeHalf: 20, four: 24, five: 32, six: 64 };
export const Radius = { xs: 4, s: 8, m: 12, l: 16 };
export const Typography = { tiny: 10, small: 12, caption: 14, body: 16, action: 18, subtitle: 20, title: 24 };
export const Layout = {
  icon: 24, touch: 48, maxWidth: 600, logoWidth: 216, logoHeight: 79,
  tabHeight: 60, imageRatio: 1, minReadableCardWidth: 144, sheetMaxWidth: 600,
  border: 1, shadowRadius: 15, shadowOffset: 2, shadowOpacity: 0.15,
  disabledOpacity: 0.65, pressedOpacity: 0.7,
};
export const Motion = { splashHold: 450, splashFade: 220 };
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const Brand = { link: '#3c87f7', splash: '#EDF6FF' };
export const TypeColors: Record<string, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
  steel: '#B7B7CE', fairy: '#D685AD',
};
