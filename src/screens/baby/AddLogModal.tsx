import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBabyLogs } from '../../context/BabyLogsContext';
import { useMedications } from '../../context/MedicationsContext';
import { useAuth } from '../../context/AuthContext';
import { BabyLog } from '../../types';
import { colors, spacing, radius, font } from '../../config/theme';
import Button from '../../components/Button';
import TimePickerModal from '../../components/TimePickerModal';
import AmountPickerModal from '../../components/AmountPickerModal';
import BreastfeedingTimer, { BreastfeedingResult } from './BreastfeedingTimer';
import { useProfile } from '../../context/ProfileContext';
import { useHousehold } from '../../context/HouseholdContext';
import { pickProfileImage } from '../../utils/imagePicker';
import { savePhoto, loadPhoto, deletePhoto } from '../../services/logPhotos';
import { formatDuration } from '../home/activity';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  editLog?: BabyLog | null; // when set, the modal edits this entry instead of creating a new one
}

type LogType = BabyLog['type'];

// סוגי הבסיס. התרופות והתוספים מגיעים מהרשימה של המשפחה ונוספים לרשת.
const TYPES: { type: LogType; emoji: string; label: string }[] = [
  { type: 'feeding', emoji: '🍼', label: 'ארוחה' },
  { type: 'sleep', emoji: '😴', label: 'שינה' },
  { type: 'diaper', emoji: '💩', label: 'חיתול' },
  { type: 'note', emoji: '📝', label: 'הערה' },
];

const DIAPER_OPTIONS = [
  { value: 'wet', label: 'פיפי' },
  { value: 'dirty', label: 'קקי' },
  { value: 'both', label: 'שניהם' },
];

function parseTime(str: string, baseDate: Date): number {
  const [h, m] = str.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
  return d.getTime();
}

function nowHHMM() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

function hhmmFromTs(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AddLogModal({ visible, onClose, selectedDate, editLog }: Props) {
  const { user } = useAuth();
  const { add, update } = useBabyLogs();
  const { medications, activeToday } = useMedications();
  const { profile } = useProfile();
  const { householdId } = useHousehold();

  // מצב עריכה מאותחל ישירות מ-editLog — ההורה מרנדר מחדש עם key שונה
  // (id הרשומה או 'new'), כך שאין צורך לסנכרן את הטופס בתוך effect.
  const [step, setStep] = useState<'pick' | 'form'>(editLog ? 'form' : 'pick');
  const [selectedType, setSelectedType] = useState<LogType>(editLog?.type ?? 'feeding');

  // form fields
  const [startTime, setStartTime] = useState(() =>
    editLog ? hhmmFromTs(editLog.timestamp) : nowHHMM(),
  );
  const [endTime, setEndTime] = useState(
    editLog?.endTimestamp ? hhmmFromTs(editLog.endTimestamp) : '',
  );
  const [amountMl, setAmountMl] = useState(editLog?.amountMl ? String(editLog.amountMl) : '');
  // ברירת המחדל מגיעה מההגדרות אך נשארת ניתנת לשינוי בכל רישום —
  // אמא שמניקה בדרך כלל עדיין נותנת בקבוק לפעמים, ולהפך.
  const [feedingMethod, setFeedingMethod] = useState<'bottle' | 'breast' | 'solids'>(
    editLog?.feedingMethod ?? (editLog?.amountMl ? 'bottle' : (profile.feedingDefault ?? 'bottle')),
  );
  const [breast, setBreast] = useState<{ leftMs: number; rightMs: number } | null>(
    editLog?.breastLeftMs != null || editLog?.breastRightMs != null
      ? { leftMs: editLog.breastLeftMs ?? 0, rightMs: editLog.breastRightMs ?? 0 }
      : null,
  );
  const [timerVisible, setTimerVisible] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [solids, setSolids] = useState<string[]>(editLog?.solids ?? []);
  const [solidDraft, setSolidDraft] = useState('');

  const addSolid = () => {
    const v = solidDraft.trim();
    // כפילות היא כמעט תמיד הקלדה כפולה ולא שתי מנות נפרדות
    if (!v || solids.includes(v)) return setSolidDraft('');
    setSolids([...solids, v]);
    setSolidDraft('');
  };
  const [diaperType, setDiaperType] = useState<string>(editLog?.diaperType ?? 'dirty');
  const [note, setNote] = useState(editLog?.details ?? '');
  // undefined = לא נגעו, null = הוסרה, string = תמונה חדשה
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [photoError, setPhotoError] = useState('');
  const [loadedPhoto, setLoadedPhoto] = useState<string | null>(null);
  // התרופות שסומנו כניתנות יחד עם הארוחה הזו
  const [givenWith, setGivenWith] = useState<string[]>([]);
  // התרופה שנבחרה כשהרישום עצמו הוא נטילת תרופה
  const [medId, setMedId] = useState<string>(editLog?.medicationId ?? '');

  // בוררים נפתחים מעל המודל. הם מורכבים רק כשפתוחים, כדי שכל פתיחה
  // תתחיל מהערך הנוכחי של השדה ולא מזה שנבחר בפעם הקודמת.
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [amountPickerVisible, setAmountPickerVisible] = useState(false);

  const reset = () => {
    setStep('pick');
    setStartTime(nowHHMM());
    setEndTime('');
    setAmountMl('');
    setFeedingMethod(profile.feedingDefault ?? 'bottle');
    setBreast(null);
    setSolids([]);
    setSolidDraft('');
    setDiaperType('dirty');
    setNote('');
    setPhoto(undefined);
    setPhotoError('');
    setGivenWith([]);
    setMedId('');
  };

  // בעריכה התמונה נטענת רק כשפותחים את הרישום — זו כל הסיבה
  // שהיא לא יושבת בתוך הרישום עצמו
  useEffect(() => {
    if (!editLog?.hasPhoto || !householdId) return;
    let alive = true;
    loadPhoto(householdId, editLog.id)
      .then((d) => alive && setLoadedPhoto(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [editLog?.hasPhoto, editLog?.id, householdId]);

  const shownPhoto = photo === undefined ? loadedPhoto : photo;

  const onPickPhoto = async () => {
    setPhotoError('');
    const r = await pickProfileImage();
    // ביטול הוא לא שגיאה ולא אומרים עליו כלום
    if (r.status === 'ok') setPhoto(r.dataUrl);
    else if (r.status === 'error') setPhotoError(r.message);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickType = (type: LogType, medicationId = '') => {
    setSelectedType(type);
    setMedId(medicationId);
    setStep('form');
  };

  /**
   * נכתבת אחרי הרישום, כי רק אז יש מזהה.
   * כישלון כאן לא מפיל את השמירה: הרישום עצמו חשוב יותר מהתמונה.
   */
  const persistPhoto = async (logId: string) => {
    if (!householdId || photo === undefined) return;
    try {
      if (photo === null) await deletePhoto(householdId, logId);
      else await savePhoto(householdId, logId, photo);
    } catch (e) {
      console.error('שמירת התמונה נכשלה:', e);
    }
  };

  const handleSave = async () => {
    setSaveError('');
    const ts = parseTime(startTime, selectedDate);
    const entry: Omit<BabyLog, 'id'> = {
      type: selectedType,
      timestamp: ts,
      loggedBy: user?.email ?? 'demo',
    };
    if (selectedType === 'feeding') {
      entry.feedingMethod = feedingMethod;
      if (feedingMethod === 'breast') {
        // הנקה נמדדת בזמן ולא בכמות. amountMl נשאר 0 כדי שסכום
        // המיליליטרים ביום לא יספור אותה ויציג מספר שמשקר.
        entry.amountMl = 0;
        entry.breastLeftMs = breast?.leftMs ?? 0;
        entry.breastRightMs = breast?.rightMs ?? 0;
      } else if (feedingMethod === 'solids') {
        // מוצקים נמדדים ברשימה ולא בכמות; amountMl נשאר 0 כדי שסכום
        // המיליליטרים היומי לא יספור אותם
        entry.amountMl = 0;
        entry.solids = solids;
      } else {
        entry.amountMl = parseInt(amountMl) || 0;
      }
    }
    if (selectedType === 'sleep' && endTime) entry.endTimestamp = parseTime(endTime, selectedDate);
    if (selectedType === 'diaper') entry.diaperType = diaperType as any;
    if (selectedType === 'medication' && medId) entry.medicationId = medId;
    if (note) entry.details = note;
    if (shownPhoto) entry.hasPhoto = true;

    try {
      if (editLog) {
        await update(editLog.id, entry);
        await persistPhoto(editLog.id);
      } else {
        const newId = await add(entry as any);
        await persistPhoto(newId);
        // תרופות ניתנות לרוב יחד עם הארוחה — נרשמות לצידה באותה שעה
        for (const id of givenWith) {
          await add({
            type: 'medication',
            medicationId: id,
            timestamp: ts,
            loggedBy: entry.loggedBy,
          } as any);
        }
      }
    } catch (e: any) {
      // בלי זה הכתיבה נכשלת, handleClose לא רץ, והחלון נשאר פתוח
      // בלי שום סימן — נראה בדיוק כמו "הכפתור לא עובד"
      console.error('שמירת הרישום נכשלה:', e);
      setSaveError(
        e?.code === 'permission-denied'
          ? 'אין הרשאה לכתוב. אם אישרתם עכשיו את המייל, צאו והיכנסו מחדש'
          : 'השמירה לא הצליחה — בדקו את החיבור ונסו שוב',
      );
      return;
    }
    handleClose();
  };

  const selectedMed = medications.find((m) => m.id === medId);
  const typeMeta = selectedMed
    ? { type: 'medication' as LogType, emoji: selectedMed.emoji, label: selectedMed.name }
    : (TYPES.find((t) => t.type === selectedType) ?? TYPES[TYPES.length - 1]);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              {step === 'form' && !editLog ? (
                <TouchableOpacity onPress={() => setStep('pick')} style={styles.backBtn}>
                  <Text style={styles.backText}>‹ חזרה</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 60 }} />
              )}
              <Text style={styles.title}>
                {step === 'pick'
                  ? 'הוסף אירוע'
                  : `${editLog ? 'עריכת ' : ''}${typeMeta.emoji} ${typeMeta.label}`}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                accessibilityLabel="סגירה"
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              {step === 'pick' ? (
                /* Type picker grid */
                <View style={styles.typeGrid}>
                  {TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.type}
                      style={styles.typeBtn}
                      onPress={() => pickType(t.type)}
                    >
                      <Text style={styles.typeEmoji}>{t.emoji}</Text>
                      <Text style={styles.typeLabel}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {activeToday.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.typeBtn}
                      onPress={() => pickType('medication', m.id)}
                    >
                      <Text style={styles.typeEmoji}>{m.emoji}</Text>
                      <Text style={styles.typeLabel}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                /* Form fields */
                <View>
                  {/* Start time — always shown */}
                  <Field label={selectedType === 'sleep' ? 'שעת כניסה לשינה' : 'שעה'}>
                    <PickerField
                      icon="time-outline"
                      text={startTime}
                      onPress={() => setStartPickerVisible(true)}
                    />
                  </Field>

                  {/* Sleep end time */}
                  {selectedType === 'sleep' && (
                    <Field label="שעת התעוררות">
                      <PickerField
                        icon="time-outline"
                        text={endTime}
                        placeholder="בחר שעה"
                        onPress={() => setEndPickerVisible(true)}
                      />
                    </Field>
                  )}

                  {/* בקבוק או הנקה — תמיד שתי האפשרויות, גם אם בהגדרות נבחרה
                      ברירת מחדל אחרת */}
                  {selectedType === 'feeding' && (
                    <Field label="איך האכלנו">
                      <View style={styles.methodRow}>
                        {(
                          [
                            { key: 'bottle', emoji: '🍼', label: 'בקבוק' },
                            { key: 'breast', emoji: '🤱', label: 'הנקה' },
                            { key: 'solids', emoji: '🥣', label: 'מוצקים' },
                          ] as const
                        ).map((o) => (
                          <TouchableOpacity
                            key={o.key}
                            style={[styles.method, feedingMethod === o.key && styles.methodOn]}
                            onPress={() => setFeedingMethod(o.key)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: feedingMethod === o.key }}
                          >
                            <Text style={styles.methodEmoji}>{o.emoji}</Text>
                            <Text
                              style={[
                                styles.methodLabel,
                                feedingMethod === o.key && styles.methodLabelOn,
                              ]}
                            >
                              {o.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Field>
                  )}

                  {selectedType === 'feeding' && feedingMethod === 'bottle' && (
                    <Field label="כמות">
                      <PickerField
                        icon="water-outline"
                        text={amountMl ? `${amountMl} מיליליטר` : ''}
                        placeholder="בחירת כמות"
                        onPress={() => setAmountPickerVisible(true)}
                      />
                    </Field>
                  )}

                  {selectedType === 'feeding' && feedingMethod === 'solids' && (
                    <Field label="מה נאכל">
                      <View style={styles.solidAddRow}>
                        <TextInput
                          style={[styles.input, styles.solidInput]}
                          value={solidDraft}
                          onChangeText={setSolidDraft}
                          placeholder="בננה, אבוקדו, דייסה..."
                          placeholderTextColor={colors.textMuted}
                          textAlign="right"
                          onSubmitEditing={addSolid}
                          returnKeyType="done"
                        />
                        <TouchableOpacity
                          style={[styles.solidAdd, !solidDraft.trim() && styles.solidAddOff]}
                          onPress={addSolid}
                          disabled={!solidDraft.trim()}
                          accessibilityRole="button"
                          accessibilityLabel="הוספה לרשימה"
                        >
                          <Ionicons name="add" size={20} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                      {solids.length > 0 && (
                        <View style={styles.solidList}>
                          {solids.map((f) => (
                            <TouchableOpacity
                              key={f}
                              style={styles.solidChip}
                              onPress={() => setSolids(solids.filter((x) => x !== f))}
                              accessibilityRole="button"
                              accessibilityLabel={`הסרת ${f}`}
                            >
                              <Text style={styles.solidChipText}>{f}</Text>
                              <Ionicons name="close" size={13} color={colors.textLight} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </Field>
                  )}

                  {selectedType === 'feeding' && feedingMethod === 'breast' && (
                    <Field label="זמני ההנקה">
                      <PickerField
                        icon="time-outline"
                        text={
                          breast
                            ? `ימין ${formatDuration(breast.rightMs)} · שמאל ${formatDuration(breast.leftMs)}`
                            : ''
                        }
                        placeholder="פתיחת טיימר ההנקה"
                        onPress={() => setTimerVisible(true)}
                      />
                    </Field>
                  )}

                  {/* תרופות שניתנו יחד עם הארוחה */}
                  {selectedType === 'feeding' && !editLog && activeToday.length > 0 && (
                    <Field label="ניתנו גם בארוחה זו">
                      <View style={styles.checkRow}>
                        {activeToday.map((m) => (
                          <CheckChip
                            key={m.id}
                            emoji={m.emoji}
                            label={m.name}
                            checked={givenWith.includes(m.id)}
                            onPress={() =>
                              setGivenWith((prev) =>
                                prev.includes(m.id)
                                  ? prev.filter((x) => x !== m.id)
                                  : [...prev, m.id],
                              )
                            }
                          />
                        ))}
                      </View>
                    </Field>
                  )}

                  {/* מינון התרופה, כשהוגדר לה כזה */}
                  {selectedType === 'medication' && selectedMed?.dose ? (
                    <Field label="מינון">
                      <Text style={styles.doseText}>{selectedMed.dose}</Text>
                    </Field>
                  ) : null}

                  {/* Diaper type */}
                  {selectedType === 'diaper' && (
                    <Field label="סוג">
                      <View style={styles.optionRow}>
                        {DIAPER_OPTIONS.map((o) => (
                          <TouchableOpacity
                            key={o.value}
                            style={[
                              styles.optionBtn,
                              diaperType === o.value && styles.optionActive,
                            ]}
                            onPress={() => setDiaperType(o.value)}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                diaperType === o.value && styles.optionTextActive,
                              ]}
                            >
                              {o.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Field>
                  )}

                  {/* Note — always optional */}
                  <Field label="הערה (לא חובה)">
                    <TextInput
                      style={[styles.input, styles.inputMulti]}
                      value={note}
                      onChangeText={setNote}
                      placeholder="הוסף הערה..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      textAlign="right"
                    />
                    {shownPhoto ? (
                      <View style={styles.photoWrap}>
                        <Image source={{ uri: shownPhoto }} style={styles.photoPreview} />
                        <TouchableOpacity
                          onPress={() => setPhoto(null)}
                          style={styles.photoRemove}
                          accessibilityRole="button"
                          accessibilityLabel="הסרת התמונה"
                        >
                          <Ionicons name="close" size={16} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.photoAdd}
                        onPress={onPickPhoto}
                        accessibilityRole="button"
                        accessibilityLabel="הוספת תמונה להערה"
                      >
                        <Ionicons name="camera-outline" size={18} color={colors.pinkAccent} />
                        <Text style={styles.photoAddText}>הוספת תמונה</Text>
                      </TouchableOpacity>
                    )}
                    {photoError ? <Text style={styles.photoErr}>{photoError}</Text> : null}
                  </Field>

                  {/* Glossary: persisting is always "שמירה" — the title already says עריכת */}
                  {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
                  <Button label="שמירה" onPress={handleSave} style={{ marginTop: spacing.md }} />
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* הבוררים הם אחים של המודל, לא ילדים שלו — מודל בתוך מודל
        לא נפרס נכון ב-react-native-web. */}
      {startPickerVisible && (
        <TimePickerModal
          visible
          value={startTime}
          minuteStep={5}
          onSelect={setStartTime}
          onClose={() => setStartPickerVisible(false)}
        />
      )}
      {endPickerVisible && (
        <TimePickerModal
          visible
          value={endTime || startTime}
          minuteStep={5}
          onSelect={setEndTime}
          onClose={() => setEndPickerVisible(false)}
        />
      )}
      {/* מורכב רק כשפתוח — כך כל פתיחה מתחילה ממצב נקי בלי אתחול ב-effect */}
      {timerVisible && (
        <BreastfeedingTimer
          onCancel={() => setTimerVisible(false)}
          onSave={(r: BreastfeedingResult) => {
            setBreast({ leftMs: r.leftMs, rightMs: r.rightMs });
            setTimerVisible(false);
          }}
        />
      )}

      {amountPickerVisible && (
        <AmountPickerModal
          visible
          value={amountMl}
          onSelect={setAmountMl}
          onClose={() => setAmountPickerVisible(false)}
        />
      )}
    </>
  );
}

function PickerField({
  icon,
  text,
  placeholder,
  onPress,
}: {
  icon: 'time-outline' | 'water-outline';
  text: string;
  placeholder?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.pickerField} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={[styles.pickerFieldText, !text && styles.pickerFieldPlaceholder]}>
        {text || placeholder}
      </Text>
    </TouchableOpacity>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function CheckChip({
  emoji,
  label,
  checked,
  onPress,
}: {
  emoji: string;
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.checkChip, checked && styles.checkChipActive]}
      onPress={onPress}
    >
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkEmoji}>{emoji}</Text>
      <Text style={[styles.checkLabel, checked && styles.checkLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  saveError: { fontSize: 13, color: colors.danger, textAlign: 'center', marginTop: spacing.sm },
  solidAddRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  solidInput: { flex: 1, marginBottom: 0 },
  solidAdd: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.pinkAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidAddOff: { opacity: 0.4 },
  solidList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  solidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.pink,
  },
  solidChipText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  photoAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.pinkDark,
  },
  photoAddText: { fontSize: 13, fontWeight: '600', color: colors.pinkAccent },
  photoWrap: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  photoPreview: { width: 110, height: 110, borderRadius: radius.md },
  photoRemove: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoErr: { fontSize: 12, color: colors.danger, marginTop: 4 },
  methodRow: { flexDirection: 'row', gap: spacing.sm },
  method: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  methodOn: { borderColor: colors.pinkAccent, backgroundColor: colors.pink },
  methodEmoji: { fontSize: 20 },
  methodLabel: { fontSize: 13, color: colors.textMuted },
  methodLabelOn: { color: colors.text, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: '#0005',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, color: colors.pinkAccent, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  doseText: { fontSize: font.body, color: colors.text, textAlign: 'right' },
  closeBtn: { width: 60, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
  closeText: { fontSize: 18, color: colors.textMuted },

  body: { padding: spacing.lg, paddingBottom: 40 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  typeBtn: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeEmoji: { fontSize: 30, marginBottom: spacing.xs },
  typeLabel: { fontSize: 13, color: colors.text, fontWeight: '500' },

  fieldWrap: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },

  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerFieldText: { fontSize: font.bodyLg, color: colors.text },
  pickerFieldPlaceholder: { color: colors.textMuted },

  optionRow: { flexDirection: 'row', gap: spacing.sm },
  optionBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { backgroundColor: colors.pinkAccent, borderColor: colors.pinkAccent },
  optionText: { fontSize: 14, color: colors.textLight, fontWeight: '500' },
  optionTextActive: { color: colors.white, fontWeight: '700' },

  checkRow: { flexDirection: 'row', gap: spacing.sm },
  checkChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkChipActive: { backgroundColor: '#FFF8E1', borderColor: colors.pinkAccent },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.pinkAccent, borderColor: colors.pinkAccent },
  checkmark: { color: colors.white, fontWeight: '700', fontSize: 12 },
  checkEmoji: { fontSize: 15 },
  checkLabel: { fontSize: 13, color: colors.textLight, fontWeight: '500' },
  checkLabelActive: { color: colors.text, fontWeight: '700' },
});
