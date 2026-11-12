import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import BabyCalendarScreen from '../screens/baby/BabyCalendarScreen';
import BabySummaryScreen from '../screens/baby/BabySummaryScreen';
import BabySettingsScreen from '../screens/baby/BabySettingsScreen';
import PressScale from '../components/PressScale';
import { colors, spacing, radius, shadow, type, TOUCH, CONTENT_MAX } from '../config/theme';

const Tab = createBottomTabNavigator();

/**
 * סרגל הניווט של האפליקציה.
 *
 * עד כה היו שני עולמות: דף הבית בלי סרגל בכלל, ומדור התינוקת עם סרגל
 * משלו — ולכן הדרך היחידה להגיע להגדרות עברה דרך היומן. עכשיו יש
 * סרגל אחד שבו גם הבית, וכל יעד נמצא במרחק נגיעה מכל מקום.
 *
 * "חודש" ו"יומן" התאחדו ל"יומן" אחד: מסך הלוח כבר מציג את סיכום היום
 * הנבחר ואת אירועיו, והציר המלא נפתח ממנו. שתי תוויות לאותו עולם היו
 * מבלבלות מספיק כדי שנצטרך להסביר אותן בהערה בקוד.
 */
type TabDef = { name: string; icon: keyof typeof Ionicons.glyphMap; label: string };

// נפרסים משמאל לימין סביב כפתור ההוספה המרכזי
const LEFT_TABS: TabDef[] = [
  { name: 'Settings', icon: 'person-circle-outline', label: 'פרופיל' },
  { name: 'Summary', icon: 'stats-chart-outline', label: 'סיכום' },
];
const RIGHT_TABS: TabDef[] = [
  { name: 'Calendar', icon: 'calendar-outline', label: 'יומן' },
  { name: 'Home', icon: 'home-outline', label: 'בית' },
];

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index].name;

  const renderTab = (t: TabDef) => {
    const focused = current === t.name;
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
        {/* הטאב הנבחר מסומן גם בצבע, גם במילוי האייקון וגם במשקל
            התווית — לא בצבע בלבד */}
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
    <View style={styles.bar}>
      <View style={[styles.inner, { paddingBottom: spacing.sm + insets.bottom }]}>
        {LEFT_TABS.map(renderTab)}
        <View style={styles.fabSlot}>
          <PressScale
            to={0.92}
            // ההוספה נפתחת על היום שנצפה כרגע, דרך הציר היומי —
            // merge:true שומר על הפרמטרים הקיימים שלו
            onPress={() => navigation.navigate('BabyDay', { openAdd: true })}
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
    </View>
  );
}

/** הלוח צריך לדעת לנווט אל הציר היומי, והוא יושב מעל הטאבים */
function CalendarTab({ navigation }: any) {
  return (
    <BabyCalendarScreen
      onSelectDay={(date: Date) => navigation.navigate('BabyDay', { dateStr: date.toISOString() })}
    />
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarTab} />
      <Tab.Screen name="Summary" component={BabySummaryScreen} />
      <Tab.Screen name="Settings" component={BabySettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inner: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.sm + 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    minHeight: TOUCH,
    gap: 3,
  },
  tabLabel: { ...type.caption, textAlign: 'center' },
  tabLabelActive: { color: colors.sage, fontWeight: '700' },

  // הכפתור יוצא מעל הסרגל, ולכן הוא צריך מקום משלו כדי לא לדחוס טאבים
  fabSlot: { width: 76, alignItems: 'center' },
  fabOuter: { width: 58, height: 58, marginTop: -28 },
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
