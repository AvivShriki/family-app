import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { ShoppingItem } from '../types';
import { colors, spacing, radius, shadow } from '../config/theme';
import { fetchProductImage, categoryEmoji } from '../utils/productImage';

export default function ShoppingScreen() {
  const { user } = useAuth();
  const { items, loading, add, remove, update } = useCollection<ShoppingItem>('shoppingList', 'createdAt', 'desc');
  const [text, setText] = useState('');

  const addItem = async () => {
    const name = text.trim();
    if (!name) return;
    // Add immediately so the UI feels instant; attach the photo when the lookup finishes
    const id = await add({ text: name, checked: false, addedBy: user?.email ?? 'demo', createdAt: Date.now() } as any);
    setText('');
    const imageUrl = await fetchProductImage(name);
    if (imageUrl && id) update(id, { imageUrl } as any);
  };

  const toggleItem = (item: ShoppingItem) => update(item.id, { checked: !item.checked } as any);

  const deleteChecked = () => {
    items.filter((i) => i.checked).forEach((i) => remove(i.id));
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.blueAccent} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={[...unchecked, ...checked]}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          checked.length > 0 ? (
            <TouchableOpacity style={styles.clearBtn} onPress={deleteChecked}>
              <Text style={styles.clearBtnText}>🗑 נקה מסומנים ({checked.length})</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>הרשימה ריקה 🛒</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, item.checked && styles.itemChecked]} onPress={() => toggleItem(item)}>
            <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
              {item.checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>{item.text}</Text>
            <View style={styles.itemIcon}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : (
                <Text style={styles.itemEmoji}>{categoryEmoji(item.text)}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Text style={styles.addBtnText}>הוסף</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="פריט חדש..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={addItem}
          returnKeyType="done"
          textAlign="right"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  list: { padding: spacing.lg, paddingBottom: 120 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: 16 },
  clearBtn: {
    alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.danger, borderRadius: radius.full, marginBottom: spacing.md,
  },
  clearBtnText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    gap: spacing.md, ...shadow.soft,
  },
  itemChecked: { opacity: 0.55 },
  checkbox: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    borderColor: colors.blueDark, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.blueAccent, borderColor: colors.blueAccent },
  checkmark: { color: colors.white, fontWeight: '700', fontSize: 14 },
  itemText: { fontSize: 16, color: colors.text, flex: 1, textAlign: 'right' },
  itemIcon: {
    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  itemImage: { width: 40, height: 40, borderRadius: radius.sm },
  itemEmoji: { fontSize: 20 },
  itemTextChecked: { textDecorationLine: 'line-through', color: colors.textMuted },
  inputBar: {
    flexDirection: 'row', padding: spacing.md, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm, alignItems: 'center',
  },
  input: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.md,
    padding: spacing.md, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  addBtn: { backgroundColor: colors.blueAccent, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  addBtnText: { color: colors.white, fontWeight: '700' },
});
