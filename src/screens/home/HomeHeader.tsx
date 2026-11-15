import React from 'react';
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { c, t, r, space, shadow, TOUCH } from './theme';
import { Reveal } from './motion';

const PHOTO = 84;

/**
 * כתמי הצבע שמאחורי הכותרת.
 *
 * הם הסיבה שמשטח הזכוכית עובד: בלי משהו צבעוני מתחת, לבן שקוף נראה
 * בדיוק כמו לבן. הם דקורטיביים בלבד ולכן מוסתרים מקוראי מסך.
 */
function Blobs() {
  return (
    <View style={styles.blobs} pointerEvents="none" accessibilityElementsHidden>
      <View style={[styles.blob, styles.blobRose]} />
      <View style={[styles.blob, styles.blobLav]} />
      <View style={[styles.blob, styles.blobBlue]} />
    </View>
  );
}

// טשטוש אמיתי קיים רק ברשת. במקום להוסיף ספרייה נייטיב בשביל אפקט
// אחד, הזכוכית נשענת על שקיפות וגבול בהיר — ומקבלת טשטוש אמיתי
// בדפדפן, שזה המקום שבו המשפחות באמת פותחות את האפליקציה.
const glassBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)' } as any) : null;

interface Props {
  name: string;
  greeting: string;
  familyName?: string;
  ageText: string;
  dateText: string;
  photoUrl?: string;
  onPressProfile: () => void;
  onPressSettings: () => void;
}

export default function HomeHeader({
  name,
  greeting,
  familyName,
  ageText,
  dateText,
  photoUrl,
  onPressProfile,
  onPressSettings,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Blobs />
      <Reveal>
        <View style={[styles.card, glassBlur]}>
          <TouchableOpacity
            style={styles.settings}
            onPress={onPressSettings}
            accessibilityRole="button"
            accessibilityLabel="הגדרות"
          >
            <Ionicons name="settings-outline" size={19} color={c.textSoft} />
          </TouchableOpacity>

          <View style={styles.text}>
            <Text style={t.label} numberOfLines={1}>
              {familyName ? `${greeting}, משפחת ${familyName}` : greeting}
            </Text>
            <Text style={t.hero} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[t.body, styles.meta]} numberOfLines={1}>
              {ageText}
            </Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-clear-outline" size={12} color={c.textMuted} />
              <Text style={t.caption} numberOfLines={1}>
                {dateText}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onPressProfile}
            accessibilityRole="button"
            accessibilityLabel={`הפרופיל של ${name}`}
            activeOpacity={0.85}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoEmpty]}>
                <MaterialCommunityIcons name="baby-face-outline" size={40} color={c.rose} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.xl },
  blobs: { ...StyleSheet.absoluteFill, overflow: 'hidden', borderRadius: r.xxl },
  blob: { position: 'absolute', borderRadius: 999 },
  blobRose: { width: 190, height: 190, top: -70, right: -50, backgroundColor: c.roseSoft },
  blobLav: { width: 130, height: 130, bottom: -60, left: -30, backgroundColor: c.lavender },
  blobBlue: { width: 110, height: 110, top: 10, left: 70, backgroundColor: c.blue, opacity: 0.7 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: c.glass,
    borderRadius: r.xxl,
    borderWidth: 1,
    borderColor: c.glassEdge,
    padding: space.lg,
    ...shadow.card,
  },
  settings: {
    width: TOUCH - 4,
    height: TOUCH - 4,
    borderRadius: r.pill,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 1 },
  meta: { marginTop: 1 },
  dateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 3 },

  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    backgroundColor: c.roseSoft,
    borderWidth: 3,
    borderColor: c.white,
    ...shadow.card,
  },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
});
