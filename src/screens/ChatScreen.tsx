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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../context/MessagesContext';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { FamilyMessage } from '../types';
import { fmtTime } from '../utils/dates';
import { colors, spacing, radius, type, TOUCH, CONTENT_MAX } from '../config/theme';

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

  if (loading) return <Loader text="טוען את ההודעות" />;

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
            icon="message-text-outline"
            title="אין עדיין הודעות"
            hint="כאן אפשר להשאיר הודעה לבן או בת הזוג, והיא תופיע להם מיד"
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
          accessibilityLabel="הודעה למשפחה"
          multiline
          onSubmitEditing={onSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !draft.trim() && styles.sendDisabled]}
          onPress={onSend}
          disabled={!draft.trim() || sending}
          accessibilityRole="button"
          accessibilityLabel="שליחה"
          accessibilityState={{ disabled: !draft.trim() || sending }}
        >
          <Ionicons name="arrow-up" size={20} color={colors.white} />
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
      {showDay ? (
        <View style={styles.dayWrap}>
          <Text style={styles.day}>{dayLabel(message.createdAt)}</Text>
        </View>
      ) : null}
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        {!mine ? <Text style={styles.sender}>{senderLabel(message.senderEmail)}</Text> : null}
        <Text style={[type.body, mine ? styles.textMine : styles.textTheirs]}>{message.text}</Text>
        <Text style={[styles.time, mine && styles.timeMine]}>{fmtTime(message.createdAt)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
  },

  dayWrap: { alignItems: 'center', marginVertical: spacing.sm },
  day: {
    ...type.caption,
    backgroundColor: colors.creamDeep,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },

  bubble: {
    maxWidth: '82%',
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  // ההודעות שלי במרווה ובצד שמאל, של השני בלבן ובימין — אותה הבחנה
  // שכל צ'אט בעברית עושה, וכך אין צורך בשם על כל הודעה שלי
  mine: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sage,
    borderBottomLeftRadius: radius.xs,
  },
  theirs: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomRightRadius: radius.xs,
  },

  sender: { ...type.caption, color: colors.sage, fontWeight: '700', marginBottom: 2 },
  textMine: { color: colors.white },
  textTheirs: { color: colors.text },
  time: { ...type.caption, textAlign: 'left', marginTop: 3 },
  timeMine: { color: 'rgba(255,255,255,0.75)' },

  composer: {
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
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
    minHeight: TOUCH,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    ...type.body,
    color: colors.text,
    outlineStyle: 'none',
  } as any,
  sendBtn: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.full,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
