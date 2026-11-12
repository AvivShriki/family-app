import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BabyCalendarScreen from './BabyCalendarScreen';
import BabyDayScreen from './BabyDayScreen';
import BabySummaryScreen from './BabySummaryScreen';
import BabySettingsScreen from './BabySettingsScreen';
import { BabyDateProvider } from './BabyDateContext';
import PressScale from '../../components/PressScale';
import { colors, spacing, radius, shadow, type, TOUCH, CONTENT_MAX } from '../../config/theme';

const Tab = createBottomTabNavigator();

// נפרסים משמאל לימין סביב כפתור ההוספה המרכזי.
// אייקונים ולא אימוג'ים, כדי שייראו זהה בכל מכשיר.
// "חודש" ולא "בית", כדי שהתווית לא תתנגש בדף הבית האמיתי של האפליקציה.
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
        style={styles.tabItem}
        onPress={() => navigation.navigate(t.name)}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t.label}
        activeOpacity={0.7}
      >
        {/* הסימון הנבחר הוא גם צבע וגם פס מעל האייקון — לא צבע בלבד */}
        <View style={[styles.indicator, focused && styles.indicatorActive]} />
        <Ionicons
          name={focused ? (t.icon.replace('-outline', '') as any) : t.icon}
          size={22}
          color={focused ? colors.sage : colors.textMuted}
        />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{t.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: spacing.sm + insets.bottom }]}>
      {LEFT_TABS.map(renderTab)}
      <View style={styles.fabSlot}>
        <PressScale
          to={0.92}
          onPress={onAddPress}
          accessibilityRole="button"
          accessibilityLabel="הוספת תיעוד"
          style={styles.fabOuter}
        >
          <View style={styles.fab}>
            <Ionicons name="add" size={30} color={colors.white} />
          </View>
        </PressScale>
      </View>
      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

// עטיפה שמחברת את הלוח לניווט אל היומן
function CalendarWithNav({ navigation }: any) {
  const handleSelectDay = (date: Date) => {
    navigation.navigate('BabyDay', { dateStr: date.toISOString() });
  };
  return (
    <View style={{ flex: 1 }}>
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
              // merge:true שומר על התאריך שהיומן מציג, כך שהוספה מסרגל
              // הטאבים נרשמת ליום שצופים בו ולא קופצת להיום
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
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    minHeight: TOUCH + 6,
    paddingTop: spacing.xs,
    gap: 2,
  },
  indicator: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  indicatorActive: { backgroundColor: colors.sage },
  tabLabel: { ...type.caption, textAlign: 'center' },
  tabLabelActive: { color: colors.sage, fontWeight: '700' },

  // הכפתור יוצא מעל הסרגל, ולכן הוא צריך מקום משלו כדי לא לדחוס טאבים
  fabSlot: { width: 76, alignItems: 'center' },
  fabOuter: { width: 58, height: 58, marginTop: -26 },
  fab: {
    flex: 1,
    borderRadius: 29,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
    ...shadow.raised,
  },
});
