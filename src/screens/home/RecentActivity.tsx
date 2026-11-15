import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BabyLog } from '../../types';
import { fmtTime } from '../../utils/dates';
import { c, t, r, space, shadow, TOUCH } from './theme';
import { Reveal, Press } from './motion';
import SoftIcon from './SoftIcon';
import { metaOf, titleOf, detailOf } from './activity';

/**
 * הפעילויות האחרונות.
 *
 * רק חמש — מעבר לזה המסך הופך ליומן שני, ויש כבר יומן. הקישור
 * "לכל הפעילויות" מוביל אליו.
 *
 * כל כרטיס נכנס באיחור קטן אחרי קודמו, כך שהרשימה נפרשת ולא קופצת.
 */
interface Props {
  logs: BabyLog[];
  medName: (id?: string) => string | undefined;
  onPressAll: () => void;
  onPressLog: (log: BabyLog) => void;
}

export default function RecentActivity({ logs, medName, onPressAll, onPressLog }: Props) {
  return (
    <View style={styles.wrap}>
      <Reveal delay={300}>
        <View style={styles.head}>
          <Text style={t.title}>הפעילויות האחרונות</Text>
          <TouchableOpacity
            style={styles.all}
            onPress={onPressAll}
            accessibilityRole="button"
            accessibilityLabel="לכל הפעילויות"
          >
            <Text style={styles.allText}>לכל הפעילויות</Text>
            <Ionicons name="chevron-back" size={13} color={c.rose} />
          </TouchableOpacity>
        </View>
      </Reveal>

      {logs.length === 0 ? (
        <Reveal delay={340}>
          <View style={styles.empty}>
            <SoftIcon icon="baby-carriage" tint={c.rose} surface={c.roseSoft} size={52} />
            <Text style={[t.cardTitle, styles.center]}>עוד לא תועד כלום היום</Text>
            <Text style={[t.body, styles.center]}>
              כפתור ההוספה ביומן רושם ארוחה, שינה, חיתול או הערה
            </Text>
          </View>
        </Reveal>
      ) : (
        <View style={styles.list}>
          {logs.map((log, i) => {
            const meta = metaOf(log.type);
            const title = titleOf(log, medName(log.medicationId));
            const detail = detailOf(log);
            return (
              <Reveal key={log.id} delay={340 + i * 60}>
                <Press
                  onPress={() => onPressLog(log)}
                  accessibilityRole="button"
                  accessibilityLabel={`${title} ב-${fmtTime(log.timestamp)}${detail ? `, ${detail}` : ''}. פתיחת היומן`}
                  to={0.99}
                >
                  <View style={styles.row}>
                    {/* פס הצבע הוא הסימן המהיר ביותר לסוג הפעילות */}
                    <View style={[styles.stripe, { backgroundColor: meta.tint }]} />
                    <SoftIcon icon={meta.icon} tint={meta.tint} surface={meta.surface} size={40} />
                    <View style={styles.body}>
                      <Text style={t.cardTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      {detail ? (
                        <Text style={t.caption} numberOfLines={1}>
                          {detail}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.timeBox}>
                      <Text style={styles.time}>{fmtTime(log.timestamp)}</Text>
                    </View>
                  </View>
                </Press>
              </Reveal>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.xl },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  all: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    minHeight: TOUCH - 10,
    paddingHorizontal: space.sm,
  },
  allText: { ...t.caption, color: c.rose, fontWeight: '700' },

  list: { gap: space.sm },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: c.white,
    borderRadius: r.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    paddingRight: space.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  stripe: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4 },
  body: { flex: 1, gap: 1 },
  timeBox: {
    backgroundColor: c.bg,
    borderRadius: r.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  time: { ...t.caption, color: c.textSoft, fontWeight: '700', fontVariant: ['tabular-nums'] },

  empty: {
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: c.white,
    borderRadius: r.xxl,
    paddingVertical: space.xl,
    paddingHorizontal: space.xl,
    ...shadow.card,
  },
  center: { textAlign: 'center' },
});
