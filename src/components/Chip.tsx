import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import PressScale from './PressScale';
import { colors, spacing, radius, type, TOUCH } from '../config/theme';
import { MCIcon } from '../config/activity';

/**
 * שבב בחירה. משמש לבחירה מרובה (תרופות שניתנו בארוחה), לבחירה יחידה,
 * ולשבב להסרה (שעות בטופס התרופה).
 *
 * המצב הנבחר מסומן גם במשטח וגם בסימן וי — לא בצבע בלבד.
 */
interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: MCIcon;
  /** וי כשנבחר (בחירה מרובה) או ✕ תמיד (שבב להסרה) */
  mode?: 'check' | 'remove' | 'plain';
}

export default function Chip({ label, selected, onPress, icon, mode = 'plain' }: Props) {
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
    >
      <View style={[styles.chip, selected && styles.selected]}>
        {mode === 'check' && selected ? (
          <Ionicons name="checkmark-circle" size={17} color={colors.sage} />
        ) : icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={17}
            color={selected ? colors.sage : colors.textMuted}
          />
        ) : null}
        <Text style={[type.smallStrong, !selected && { color: colors.textSecondary }]}>
          {label}
        </Text>
        {mode === 'remove' ? <Ionicons name="close" size={15} color={colors.textMuted} /> : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: TOUCH,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.sage, backgroundColor: colors.sageSoft },
});
