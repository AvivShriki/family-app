import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { radius } from '../config/theme';
import { MCIcon } from '../config/activity';

/**
 * מדליון האייקון של פעילות: עיגול בגוון הפעילות עם האייקון שלה.
 *
 * זה הרכיב שמחליף את האימוג'ים. אימוג'י נראה שונה באייפון, באנדרואיד
 * ובדפדפן, ובגדלים קטנים הוא פשוט כתם — אייקון וקטורי זהה בכל מקום
 * ומקבל את צבע הפעילות.
 */
interface Props {
  icon: MCIcon;
  color: string;
  surface: string;
  size?: number;
  /** ריבוע מעוגל במקום עיגול — לאריחי התיעוד המהיר */
  square?: boolean;
}

export default function ActivityIcon({ icon, color, surface, size = 40, square }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: square ? radius.md : size / 2,
          backgroundColor: surface,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={Math.round(size * 0.55)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
