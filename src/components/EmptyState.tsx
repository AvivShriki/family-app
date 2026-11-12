import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, type } from '../config/theme';
import { MCIcon } from '../config/activity';

/**
 * מצב ריק: מדליון רך, משפט שמסביר למה המסך ריק, ורמז שמוביל לפעולה
 * שתמלא אותו. מצב ריק בלי רמז משאיר את המשתמש בלי מושג מה לעשות.
 */
interface Props {
  icon: MCIcon;
  title: string;
  hint?: string;
}

export default function EmptyState({ icon, title, hint }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.medallion}>
        <MaterialCommunityIcons name={icon} size={34} color={colors.sage} />
      </View>
      <Text style={[type.h3, styles.center]}>{title}</Text>
      {hint ? <Text style={[type.body, styles.center, styles.hint]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  medallion: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  hint: { marginTop: spacing.xs, maxWidth: 300 },
});
