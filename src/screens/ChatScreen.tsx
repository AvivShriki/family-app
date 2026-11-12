import React, { useMemo, useRef, useState } from 'react';
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

const MAX_MEMBERS = 3;

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

export default function ChatScreen({ navigation }: any) {
  const { user } = useAuth();
  const { messages, loading, send } = useMessages();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  /**
   * מי במשפחה.
   *
   * רשימת החברים מוחזקת במסמך משק הבית כמזהים בלבד, ואין לנו הרשאה
   * לקרוא את הפרופיל של אדם אחר — ולכן מי שמופיע כאן הם מי שכבר כתב
   * הודעה, ואני. זה מה שאפשר לדעת באמת, בלי להמציא שמות.
   */
  const members = useMemo(() => {
    const seen = new Map<string, string>();
    if (user?.email) seen.set(user.uid, user.email);
    messages.forEach((m) => {
      if (!seen.has(m.senderUid)) seen.set(m.senderUid, m.senderEmail);
    });
    return [...seen.entries()].map(([uid, email]) => ({
      uid,
      email,
      mine: uid === user?.uid,
    }));
  }, [messages, user]);

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
      {/* ---- מי במשפחה ---- */}
      <View style={styles.membersBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersRow}
        >
          {members.map((m) => (
            <View key={m.uid} style={styles.member} accessibilityLabel={senderLabel(m.email)}>
              <View style={[styles.avatar, m.mine && styles.avatarMine]}>
                <Text style={[styles.initial, m.mine && { color: colors.white }]}>
                  {senderLabel(m.email).charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.memberName} numberOfLines={1}>
                {m.mine ? 'אני' : senderLabel(m.email)}
              </Text>
            </View>
          ))}

          {members.length < MAX_MEMBERS ? (
            <TouchableOpacity
              style={styles.member}
              onPress={() => navigation.navigate('Invite')}
              accessibilityRole="button"
              accessibilityLabel="הוספת בן משפחה"
            >
              <View style={[styles.avatar, styles.avatarAdd]}>
                <Ionicons name="add" size={22} color={colors.sage} />
              </View>
              <Text style={styles.memberName}>הוספה</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>

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

const centered = {
  width: '100%' as const,
  maxWidth: CONTENT_MAX,
  alignSelf: 'center' as const,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  membersBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  membersRow: {
    ...centered,
    flexDirection: 'row-reverse',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  member: { alignItems: 'center', gap: 3, width: 58 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mossSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMine: { backgroundColor: colors.sage },
  avatarAdd: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.moss,
  },
  initial: { ...type.bodyStrong, textAlign: 'center', color: colors.sage },
  memberName: { ...type.caption, textAlign: 'center' },

  scroll: { ...centered, padding: spacing.md, paddingBottom: spacing.lg },

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
    ...centered,
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
