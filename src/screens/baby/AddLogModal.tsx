import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useBabyLogs } from '../../context/BabyLogsContext';
import { useMedications } from '../../context/MedicationsContext';
import { useAuth } from '../../context/AuthContext';
import { BabyLog } from '../../types';
import { activityMeta, medIcon } from '../../config/activity';
import { colors, spacing, radius, type, TOUCH } from '../../config/theme';
import Button from '../../components/Button';
import BottomSheet from '../../components/BottomSheet';
import PressScale from '../../components/PressScale';
import Chip from '../../components/Chip';
import Segmented from '../../components/Segmented';
import TextField from '../../components/TextField';
import TimePickerModal from '../../components/TimePickerModal';
import AmountPickerModal from '../../components/AmountPickerModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  editLog?: BabyLog | null; // כשמוגדר, המודל עורך את הרשומה ולא יוצר חדשה
}

type LogType = BabyLog['type'];

// סוגי הבסיס. התרופות והתוספים מגיעים מהרשימה של המשפחה ונוספים לרשת.
const TYPES: LogType[] = ['feeding', 'sleep', 'diaper', 'note'];

const DIAPER_OPTIONS = [
  { value: 'wet', label: 'שתן' },
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

  // מצב עריכה מאותחל ישירות מ-editLog — ההורה מרנדר מחדש עם key שונה
  // (id הרשומה או 'new'), כך שאין צורך לסנכרן את הטופס בתוך effect.
  const [step, setStep] = useState<'pick' | 'form'>(editLog ? 'form' : 'pick');
  const [selectedType, setSelectedType] = useState<LogType>(editLog?.type ?? 'feeding');

  // שדות הטופס
  const [startTime, setStartTime] = useState(() =>
    editLog ? hhmmFromTs(editLog.timestamp) : nowHHMM(),
  );
  const [endTime, setEndTime] = useState(
    editLog?.endTimestamp ? hhmmFromTs(editLog.endTimestamp) : '',
  );
  const [amountMl, setAmountMl] = useState(editLog?.amountMl ? String(editLog.amountMl) : '');
  const [diaperType, setDiaperType] = useState<string>(editLog?.diaperType ?? 'dirty');
  const [note, setNote] = useState(editLog?.details ?? '');
  // התרופות שסומנו כניתנות יחד עם הארוחה הזו
  const [givenWith, setGivenWith] = useState<string[]>([]);
  // התרופה שנבחרה כשהרישום עצמו הוא נטילת תרופה
  const [medId, setMedId] = useState<string>(editLog?.medicationId ?? '');
  const [saving, setSaving] = useState(false);

  // הבוררים נפתחים מעל המגירה. הם מורכבים רק כשפתוחים, כדי שכל פתיחה
  // תתחיל מהערך הנוכחי של השדה ולא מזה שנבחר בפעם הקודמת.
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [amountPickerVisible, setAmountPickerVisible] = useState(false);

  const reset = () => {
    setStep('pick');
    setStartTime(nowHHMM());
    setEndTime('');
    setAmountMl('');
    setDiaperType('dirty');
    setNote('');
    setGivenWith([]);
    setMedId('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickType = (t: LogType, medicationId = '') => {
    setSelectedType(t);
    setMedId(medicationId);
    setStep('form');
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ts = parseTime(startTime, selectedDate);
      const entry: Omit<BabyLog, 'id'> = {
        type: selectedType,
        timestamp: ts,
        loggedBy: user?.email ?? 'demo',
      };
      if (selectedType === 'feeding') entry.amountMl = parseInt(amountMl) || 0;
      if (selectedType === 'sleep' && endTime)
        entry.endTimestamp = parseTime(endTime, selectedDate);
      if (selectedType === 'diaper') entry.diaperType = diaperType as any;
      if (selectedType === 'medication' && medId) entry.medicationId = medId;
      if (note) entry.details = note;

      if (editLog) {
        await update(editLog.id, entry);
      } else {
        await add(entry as any);
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
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedMed = medications.find((m) => m.id === medId);
  const meta = activityMeta(selectedType);
  const title =
    step === 'pick'
      ? 'מה לתעד?'
      : `${editLog ? 'עריכת ' : ''}${selectedMed ? selectedMed.name : meta.label}`;

  return (
    <>
      <BottomSheet
        visible={visible}
        title={title}
        onClose={handleClose}
        onBack={step === 'form' && !editLog ? () => setStep('pick') : undefined}
      >
        {step === 'pick' ? (
          <>
            {/* רשת הבחירה: כל סוג במשטח בגוון שלו, כך שהעין מוצאת אותו
                לפי הצבע עוד לפני שהיא קוראת את השם */}
            <View style={styles.typeGrid}>
              {TYPES.map((t) => {
                const m = activityMeta(t);
                return (
                  <PressScale
                    key={t}
                    onPress={() => pickType(t)}
                    accessibilityRole="button"
                    accessibilityLabel={m.label}
                    style={styles.typeOuter}
                  >
                    <View style={[styles.typeBtn, { backgroundColor: m.surface }]}>
                      <MaterialCommunityIcons name={m.icon} size={30} color={m.color} />
                      <Text style={[type.bodyStrong, styles.typeLabel]} numberOfLines={1}>
                        {m.label}
                      </Text>
                    </View>
                  </PressScale>
                );
              })}
              {activeToday.map((m) => {
                const medMeta = activityMeta('medication');
                return (
                  <PressScale
                    key={m.id}
                    onPress={() => pickType('medication', m.id)}
                    accessibilityRole="button"
                    accessibilityLabel={m.name}
                    style={styles.typeOuter}
                  >
                    <View style={[styles.typeBtn, { backgroundColor: medMeta.surface }]}>
                      <MaterialCommunityIcons
                        name={medIcon(m.emoji)}
                        size={30}
                        color={medMeta.color}
                      />
                      <Text style={[type.bodyStrong, styles.typeLabel]} numberOfLines={1}>
                        {m.name}
                      </Text>
                    </View>
                  </PressScale>
                );
              })}
            </View>

            <Button
              label="ביטול"
              variant="secondary"
              onPress={handleClose}
              style={{ marginTop: spacing.md }}
            />
          </>
        ) : (
          <View>
            {/* שעה — תמיד */}
            <Field label={selectedType === 'sleep' ? 'שעת כניסה לשינה' : 'שעה'}>
              <PickerField
                icon="time-outline"
                text={startTime}
                onPress={() => setStartPickerVisible(true)}
                accessibilityLabel={`שעה ${startTime}, לשינוי`}
              />
            </Field>

            {/* שעת התעוררות */}
            {selectedType === 'sleep' ? (
              <Field label="שעת התעוררות">
                <PickerField
                  icon="time-outline"
                  text={endTime}
                  placeholder="עוד ישנה — אפשר להשלים אחר כך"
                  onPress={() => setEndPickerVisible(true)}
                  accessibilityLabel="שעת התעוררות, לבחירה"
                />
              </Field>
            ) : null}

            {/* כמות */}
            {selectedType === 'feeding' ? (
              <Field label="כמות">
                <PickerField
                  icon="water-outline"
                  text={amountMl ? `${amountMl} מ"ל` : ''}
                  placeholder="בחירת כמות, או הנקה"
                  onPress={() => setAmountPickerVisible(true)}
                  accessibilityLabel="כמות, לבחירה"
                />
              </Field>
            ) : null}

            {/* תרופות שניתנו יחד עם הארוחה */}
            {selectedType === 'feeding' && !editLog && activeToday.length > 0 ? (
              <Field label="ניתנו גם בארוחה הזו">
                <View style={styles.chipRow}>
                  {activeToday.map((m) => (
                    <Chip
                      key={m.id}
                      label={m.name}
                      icon={medIcon(m.emoji)}
                      mode="check"
                      selected={givenWith.includes(m.id)}
                      onPress={() =>
                        setGivenWith((prev) =>
                          prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id],
                        )
                      }
                    />
                  ))}
                </View>
              </Field>
            ) : null}

            {/* מינון התרופה, כשהוגדר לה כזה */}
            {selectedType === 'medication' && selectedMed?.dose ? (
              <Field label="מינון">
                <View style={styles.doseBox}>
                  <Text style={type.bodyStrong}>{selectedMed.dose}</Text>
                </View>
              </Field>
            ) : null}

            {/* סוג חיתול */}
            {selectedType === 'diaper' ? (
              <Field label="סוג">
                <Segmented
                  label="סוג החיתול"
                  options={DIAPER_OPTIONS as { value: string; label: string }[]}
                  value={diaperType}
                  onChange={setDiaperType}
                />
              </Field>
            ) : null}

            <TextField
              label="הערה (לא חובה)"
              value={note}
              onChangeText={setNote}
              placeholder="משהו ששווה לזכור מהרישום הזה"
              multiline
              numberOfLines={3}
            />

            {/* המונח קבוע: שמירה. הכותרת כבר אומרת אם זו עריכה. */}
            <Button
              label="שמירה"
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </BottomSheet>

      {/* הבוררים הם אחים של המגירה, לא ילדים שלה — מודל בתוך מודל
          לא נפרס נכון ב-react-native-web. */}
      {startPickerVisible ? (
        <TimePickerModal
          visible
          value={startTime}
          minuteStep={5}
          onSelect={setStartTime}
          onClose={() => setStartPickerVisible(false)}
        />
      ) : null}
      {endPickerVisible ? (
        <TimePickerModal
          visible
          value={endTime || startTime}
          minuteStep={5}
          onSelect={setEndTime}
          onClose={() => setEndPickerVisible(false)}
        />
      ) : null}
      {amountPickerVisible ? (
        <AmountPickerModal
          visible
          value={amountMl}
          onSelect={setAmountMl}
          onClose={() => setAmountPickerVisible(false)}
        />
      ) : null}
    </>
  );
}

/** שדה שנפתח לבורר. נראה כמו שדה קלט כדי שיהיה ברור שהוא נלחץ. */
function PickerField({
  icon,
  text,
  placeholder,
  onPress,
  accessibilityLabel,
}: {
  icon: 'time-outline' | 'water-outline';
  text: string;
  placeholder?: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <TouchableOpacity
      style={styles.pickerField}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={19} color={colors.sage} />
      <Text style={[type.bodyStrong, styles.pickerText, !text && styles.placeholder]}>
        {text || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={17} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={type.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  typeGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  typeOuter: { flexGrow: 1, flexBasis: '45%', minWidth: 130 },
  typeBtn: {
    flex: 1,
    minHeight: 112,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  typeLabel: { textAlign: 'center' },

  field: { marginBottom: spacing.md, gap: spacing.xs },
  pickerField: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH + 6,
  },
  pickerText: { flex: 1 },
  placeholder: { ...type.body, color: colors.textMuted },
  doseBox: {
    backgroundColor: colors.mossSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  chipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
});
