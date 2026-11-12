import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, type, TOUCH, shadow, CONTENT_MAX } from '../config/theme';

/**
 * המגירה התחתונה — המשטח של כל בורר וטופס באפליקציה.
 *
 * כל הבוררים (תאריך, שעה, כמות) וחלון הוספת הפעילות השתמשו עד כה
 * בהעתק של אותו overlay, אותו רדיוס ואותו כפתור סגירה, שכולם נכתבו
 * שלוש פעמים ונבדלו בפרטים. כאן זה מוגדר פעם אחת.
 *
 * הערה חשובה: ב-react-native-web מודל בתוך מודל לא נפרס נכון, ולכן
 * בורר שנפתח מעל מגירה אחרת חייב להיות אח שלה בעץ ולא ילד.
 */
interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** כפתור חזרה בקצה ההפוך לכותרת, לטפסים דו-שלביים */
  onBack?: () => void;
  /** גלילה פנימית. טופס ארוך צריך, בורר קצר לא. */
  scroll?: boolean;
}

export default function BottomSheet({
  visible,
  title,
  onClose,
  children,
  onBack,
  scroll = true,
}: Props) {
  const Body: any = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* נגיעה ברקע סוגרת — הדרך שהמשתמש מצפה לצאת ממגירה */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="סגירה"
          activeOpacity={1}
        />
        <View style={styles.sheet}>
          <View style={styles.grip} />
          <View style={styles.header}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.headerBtn}
                accessibilityRole="button"
                accessibilityLabel="חזרה"
              >
                <Ionicons name="chevron-forward" size={22} color={colors.sage} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerBtn} />
            )}
            <Text style={[type.h3, styles.title]} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="סגירה"
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Body
            style={scroll ? styles.bodyScroll : undefined}
            contentContainerStyle={scroll ? styles.body : undefined}
            {...(scroll ? { keyboardShouldPersistTaps: 'handled' as const } : {})}
          >
            {!scroll ? <View style={styles.body}>{children}</View> : children}
          </Body>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '88%',
    paddingTop: spacing.sm,
    ...shadow.raised,
  },
  grip: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  header: {
    // row-reverse: בעברית החזרה יושבת בימין — הצד שממנו מתחילים לקרוא
    // וממנו מחליקים אחורה — והסגירה בשמאל
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: TOUCH,
    height: TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center' },
  bodyScroll: { flexGrow: 0 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
