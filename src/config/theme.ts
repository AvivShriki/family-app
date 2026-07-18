export const colors = {
  pink: '#FADADD',
  pinkDark: '#F4A7B9',
  pinkAccent: '#E8789A',
  blue: '#BDE0FE',
  blueDark: '#A2C4F5',
  blueAccent: '#5BA4E8',
  cream: '#FFF8F0',
  creamDark: '#F5EDE0',
  white: '#FFFFFF',
  text: '#4A3728',
  textLight: '#8B6F5E',
  textMuted: '#B5998A',
  success: '#A8D5B5',
  danger: '#F4A7A7',
  border: '#EDE0D4',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

// Typographic scale — every fontSize in the app should come from here.
// Sizes step ~1.2x; roles, not raw numbers, so hierarchy stays consistent.
export const font = {
  caption: 11,   // tab labels, tiny meta
  small: 13,     // secondary text, field labels, chips
  body: 15,      // running text, list items, inputs
  bodyLg: 16,    // emphasized body, buttons
  title: 18,     // card/section titles, modal titles
  titleLg: 22,   // screen greetings, big numbers
  display: 32,   // login hero
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
};

// Two elevation levels: soft for resting cards, raised for floating
// action buttons and anything that should feel closest to the finger.
export const shadow = {
  soft: {
    shadowColor: colors.pinkDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: colors.pinkDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
};
