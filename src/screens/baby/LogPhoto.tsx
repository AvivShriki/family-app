import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font } from '../../config/theme';
import { useHousehold } from '../../context/HouseholdContext';
import { loadPhoto } from '../../services/logPhotos';

/**
 * התמונה המצורפת לרישום, ביומן.
 *
 * נטענת רק כשהשורה מוצגת ולא עם הרישום עצמו — זו כל הסיבה שהתמונה
 * יושבת במסמך נפרד. שורה בלי תמונה לא עולה כלום.
 *
 * תצוגה מוקטנת בשורה, ולחיצה פותחת אותה בגודל מלא: בתמונה של חיתול
 * הפרטים הם כל העניין, ו-56 פיקסלים לא מספיקים לשום החלטה.
 */
export default function LogPhoto({ logId }: { logId: string }) {
  const { householdId } = useHousehold();
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    let alive = true;
    loadPhoto(householdId, logId)
      .then((d) => alive && (d ? setUri(d) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [householdId, logId]);

  if (failed) return null;

  if (!uri) {
    return (
      <View style={styles.thumb}>
        <ActivityIndicator size="small" color={colors.pinkDark} />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="פתיחת התמונה"
        activeOpacity={0.8}
      >
        <Image source={{ uri }} style={styles.thumb} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.close}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="סגירה"
          >
            <Ionicons name="close" size={22} color={colors.white} />
          </TouchableOpacity>
          <Image source={{ uri }} style={styles.full} resizeMode="contain" />
          <Text style={styles.hint}>לחיצה על הרקע סוגרת</Text>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="סגירה"
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.creamDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  // מעל שכבת הסגירה, אחרת הוא נבלע בה
  close: {
    position: 'absolute',
    top: 44,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  full: { width: '100%', height: '75%', zIndex: 1 },
  hint: {
    marginTop: spacing.md,
    fontSize: font.small,
    color: 'rgba(255,255,255,0.65)',
    zIndex: 1,
  },
});
