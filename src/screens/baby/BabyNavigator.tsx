import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BabyCalendarScreen from './BabyCalendarScreen';
import BabyDayScreen from './BabyDayScreen';
import BabySummaryScreen from './BabySummaryScreen';
import BabySettingsScreen from './BabySettingsScreen';
import BabyHeader from './BabyHeader';
import { BabyDateProvider } from './BabyDateContext';
import { colors, spacing, radius, shadow } from '../../config/theme';

const Tab = createBottomTabNavigator();

// Rendered left-to-right around the center "+" button.
// Ionicons instead of emoji so icons render identically on every device —
// the team review flagged the mixed emoji/icon language.
// "חודש" (not "בית") so the label doesn't collide with the app's real Home.
type TabDef = { name: string; icon: keyof typeof Ionicons.glyphMap; label: string };
const LEFT_TABS: TabDef[] = [
  { name: 'BabySettings', icon: 'settings-outline', label: 'הגדרות' },
  { name: 'BabySummary', icon: 'stats-chart-outline', label: 'סיכום' },
];
const RIGHT_TABS: TabDef[] = [
  { name: 'BabyDay', icon: 'book-outline', label: 'יומן' },
  { name: 'BabyCalendar', icon: 'calendar-outline', label: 'חודש' },
];

function BabyTabBar({ state, navigation, onAddPress }: any) {
  const insets = useSafeAreaInsets();

  const renderTab = (t: TabDef) => {
    const focused = state.routes[state.index].name === t.name;
    return (
      <TouchableOpacity
        key={t.name}
        style={[styles.tabItem, focused && styles.tabItemActive]}
        onPress={() => navigation.navigate(t.name)}
      >
        <Ionicons name={t.icon} size={22} color={focused ? colors.pinkAccent : colors.textMuted} />
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
    <BabyDateProvider>
    <Tab.Navigator
      tabBar={(props) => (
        <BabyTabBar
          {...props}
          onAddPress={() =>
            // merge:true keeps BabyDay's current dateStr, so adding from the
            // tab bar logs to the day being viewed instead of jumping to today
            props.navigation.navigate({
              name: 'BabyDay',
              params: { openAdd: true },
              merge: true,
            } as never)
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
    </BabyDateProvider>
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
  tabLabel: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  tabLabelActive: { color: colors.text, fontWeight: '600' },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...shadow.raised,
  },
  fabText: { fontSize: 26, color: colors.white, lineHeight: 28, fontWeight: '600' },
});
