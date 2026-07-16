import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BabyCalendarScreen from './BabyCalendarScreen';
import BabyDayScreen from './BabyDayScreen';
import BabySummaryScreen from './BabySummaryScreen';
import BabySettingsScreen from './BabySettingsScreen';
import BabyHeader from './BabyHeader';
import { colors, spacing, radius, shadow } from '../../config/theme';

const Tab = createBottomTabNavigator();

// Rendered left-to-right around the center "+" button
const LEFT_TABS = [
  { name: 'BabySettings', emoji: '⚙️', label: 'הגדרות' },
  { name: 'BabySummary', emoji: '📊', label: 'סיכום' },
];
const RIGHT_TABS = [
  { name: 'BabyDay', emoji: '📓', label: 'יומן' },
  { name: 'BabyCalendar', emoji: '🏠', label: 'בית' },
];

function BabyTabBar({ state, navigation, onAddPress }: any) {
  const insets = useSafeAreaInsets();

  const renderTab = (t: { name: string; emoji: string; label: string }) => {
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
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: 8 + insets.bottom }]}>
      {LEFT_TABS.map(renderTab)}
      <TouchableOpacity style={styles.fab} onPress={onAddPress}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

// Wrapper components to inject navigation prop into screens that need it
function CalendarWithNav({ navigation }: any) {
  const handleSelectDay = (date: Date) => {
    navigation.navigate('BabyDay', { dateStr: date.toISOString() });
  };
  return (
    <View style={{ flex: 1 }}>
      <BabyHeader />
      <BabyCalendarScreen onSelectDay={handleSelectDay} />
    </View>
  );
}

export default function BabyNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <BabyTabBar
          {...props}
          onAddPress={() =>
            props.navigation.navigate('BabyDay', {
              dateStr: new Date().toISOString(),
              openAdd: true,
            })
          }
        />
      )}
      screenOptions={{ headerShown: false }}
      initialRouteName="BabyCalendar"
    >
      <Tab.Screen name="BabyCalendar" component={CalendarWithNav} />
      <Tab.Screen name="BabyDay" component={BabyDayScreen} />
      <Tab.Screen name="BabySummary" component={BabySummaryScreen} />
      <Tab.Screen name="BabySettings" component={BabySettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    margin: 4,
  },
  tabItemActive: { backgroundColor: colors.pink },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  tabLabelActive: { color: colors.text, fontWeight: '600' },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...shadow.soft,
  },
  fabText: { fontSize: 26, color: colors.white, lineHeight: 28, fontWeight: '600' },
});
