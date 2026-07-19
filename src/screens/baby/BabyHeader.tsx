import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useBabyProfile } from '../../hooks/useBabyProfile';
import BabyAvatar from '../../components/BabyAvatar';
import { colors, spacing } from '../../config/theme';

export default function BabyHeader() {
  const { profile } = useBabyProfile();
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.bell}>🔔</Text>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </View>
          <Text style={styles.subtitle}>יומן תינוקת שלי 💗</Text>
        </View>
      </View>
      <BabyAvatar size={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bell: { fontSize: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  chevron: { fontSize: 14, color: colors.textMuted },
  subtitle: { fontSize: 12, color: colors.textLight, marginTop: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
});
