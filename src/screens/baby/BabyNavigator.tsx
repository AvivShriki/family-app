import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BabyCalendarScreen from './BabyCalendarScreen';
import BabyDayScreen from './BabyDayScreen';
import BabySummaryScreen from './BabySummaryScreen';
import { colors, spacing, radius } from '../../config/theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'BabyCalendar', emoji: '🏠', label: 'בית' },
  { name: 'BabyDay',      emoji: '📓', label: 'יומן' },
  { name: 'BabySummary',  emoji: '📊', label: 'סיכום' },
];

function BabyTabBar({ state, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((t) => {
        const focused = state.routes[state.index].name === t.name;
        return (
          <TouchableOpacity
            key={t.name}
            style={[styles.tabItem, focused && styles.tabItemActive]}
            onPress={() => navigation.navigate(t.name)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Wrapper components to inject navigation prop into screens that need it
function CalendarWithNav({ navigation }: any) {
  const handleSelectDay = (date: Date) => {
    navigation.navigate('BabyDay', { dateStr: date.toISOString() });
  };
  return <BabyCalendarScreen onSelectDay={handleSelectDay} />;
}

export default function BabyNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BabyTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="BabyCalendar"
    >
      <Tab.Screen name="BabyCalendar" component={CalendarWithNav} />
      <Tab.Screen name="BabyDay"      component={BabyDayScreen} />
      <Tab.Screen name="BabySummary"  component={BabySummaryScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.md, margin: 4,
  },
  tabItemActive: { backgroundColor: colors.pink },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  tabLabelActive: { color: colors.text, fontWeight: '600' },
});
