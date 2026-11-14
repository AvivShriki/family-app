import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useBabyProfile } from '../hooks/useBabyProfile';
import { colors } from '../config/theme';

// The baby's avatar, shown everywhere in the app: the profile photo when
// one was uploaded (settings screen), otherwise the 👶 placeholder.
export default function BabyAvatar({ size = 48 }: { size?: number }) {
  const { profile } = useBabyProfile();
  const round = { width: size, height: size, borderRadius: size / 2 };

  if (profile.photoUrl) {
    return <Image source={{ uri: profile.photoUrl }} style={[round, styles.photo]} />;
  }
  return (
    <View style={[round, styles.placeholder]}>
      <Text style={{ fontSize: size / 2 }}>👶</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: colors.pink },
  placeholder: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
