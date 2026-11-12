import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import EmptyState from '../components/EmptyState';
import { FamilyMessage } from '../types';
import { fmtTime } from '../utils/dates';
import { colors, spacing, radius, font, shadow } from '../config/theme';

/** תאריך קצר מעל הודעה שפותחת יום חדש */
function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'היום';
  if (same(d, yesterday)) return 'אתמול';
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
}

/** אין לנו שמות משתמשים, רק אימייל — מציגים את החלק שלפני השטרודל */
function senderLabel(email: string): string {
  return email.split('@')[0] || 'בן משפחה';
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { messages, loading, send } = useMessages();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const onSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    try {
      await send(text);
    } catch {
      setDraft(text); // מחזירים את הטקסט כדי שלא ייעלם
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.pinkAccent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="אין עדיין הודעות"
            hint="כאן אפשר להשאיר הודעה לבן או בת הזוג, והיא תופיע להם מיד 💬"
          />
        ) : (
          messages.map((m, i) => (
            <Bubble
              key={m.id}
              message={m}
              mine={m.senderUid === user?.uid}
              showDay={i === 0 || dayLabel(messages[i - 1].createdAt) !== dayLabel(m.createdAt)}
            />
          ))
        )}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="הודעה למשפחה"
          placeholderTextColor={colors.textMuted}
          textAlign="right"
          multiline
          onSubmitEditing={onSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !draft.trim() && styles.sendDisabled]}
          onPress={onSend}
          disabled={!draft.trim() || sending}
          accessibilityLabel="שליחה"
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({
  message,
  mine,
  showDay,
}: {
  message: FamilyMessage;
  mine: boolean;
  showDay: boolean;
}) {
  return (
    <>
      {showDay ? <Text style={styles.day}>{dayLabel(message.createdAt)}</Text> : null}
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {!mine ? <Text style={styles.sender}>{senderLabel(message.senderEmail)}</Text> : null}
        <Text style={styles.text}>{message.text}</Text>
        <Text style={[styles.time, mine && styles.timeMine]}>{fmtTime(message.createdAt)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  centered: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center' },
  scroll: { padding: spacing.md, paddingBottom: spacing.lg },

  day: {
    fontSize: font.caption,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },

  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  // ההודעות שלי בוורוד ובצד אחד, של השני בלבן ובצד השני — אותה הבחנה
  // שכל צ'אט עושה, וכך אין צורך בשם על כל הודעה שלי
  mine: { alignSelf: 'flex-start', backgroundColor: colors.pink },
  theirs: { alignSelf: 'flex-end', backgroundColor: colors.white },

  sender: {
    fontSize: font.caption,
    fontWeight: font.weight.semibold,
    color: colors.textLight,
    textAlign: 'right',
    marginBottom: 2,
  },
  text: { fontSize: font.body, color: colors.text, textAlign: 'right', lineHeight: 21 },
  time: { fontSize: font.caption, color: colors.textLight, textAlign: 'left', marginTop: 2 },
  timeMine: { color: colors.text },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    fontSize: font.body,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
});
