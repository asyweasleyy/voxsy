import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { getUserInstruments, type Instrument } from '../../services/instruments.service';
import {
  getEntriesByMonth,
  getEntryByDate,
  type JournalEntryWithItems,
  type MonthEntry,
} from '../../services/journal.service';

const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  gold: '#C9A84C',
  goldGlow: 'rgba(201,168,76,0.10)',
  goldBorder: 'rgba(201,168,76,0.3)',
  text: '#F0EBE3',
  textMuted: 'rgba(240,235,227,0.45)',
  textDim: 'rgba(240,235,227,0.22)',
  border: 'rgba(255,255,255,0.07)',
  green: '#4ADE80',
  purple: '#A78BFA',
};

const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const TR_MONTHS = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
];
const DAY_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

const SECTIONS: { type: 'learned' | 'did' | 'todo'; label: string; color: string; icon: string }[] = [
  { type: 'learned', label: 'Öğrendim',  color: C.green,  icon: '✦' },
  { type: 'did',     label: 'Yaptım',    color: C.gold,   icon: '◆' },
  { type: 'todo',    label: 'Yapacağım', color: C.purple, icon: '▲' },
];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCalendarCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const offset = (firstDow + 6) % 7; // Mon-first offset
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function GecmisScreen() {
  const { user } = useAuth();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [instrLoading, setInstrLoading] = useState(true);
  const [filterInstrId, setFilterInstrId] = useState<string | null>(null);

  const [monthEntries, setMonthEntries] = useState<MonthEntry[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<JournalEntryWithItems[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserInstruments(user.id).then(data => {
      setInstruments(data);
      setInstrLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setMonthLoading(true);
    setSelectedDate(null);
    getEntriesByMonth(user.id, year, month)
      .then(data => setMonthEntries(data))
      .finally(() => setMonthLoading(false));
  }, [user, year, month]);

  const filteredEntries = useMemo(() => {
    if (!filterInstrId) return monthEntries;
    return monthEntries.filter(e => e.instrument_id === filterInstrId);
  }, [monthEntries, filterInstrId]);

  const markedDates = useMemo(() => {
    const s = new Set<string>();
    filteredEntries.forEach(e => s.add(e.date));
    return s;
  }, [filteredEntries]);

  // Reload detail whenever selected date or filter changes
  useEffect(() => {
    if (!selectedDate || !user) {
      setSelectedEntries([]);
      return;
    }
    const dayEntries = filteredEntries.filter(e => e.date === selectedDate);
    if (dayEntries.length === 0) {
      setSelectedEntries([]);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    Promise.all(dayEntries.map(e => getEntryByDate(user.id, e.instrument_id, selectedDate)))
      .then(results => setSelectedEntries(results.filter(Boolean) as JournalEntryWithItems[]))
      .finally(() => setDetailLoading(false));
  }, [selectedDate, filteredEntries, user]);

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;

  const goToPrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const goToNext = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const calendarCells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  if (instrLoading) {
    return (
      <View style={st.center}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <View style={st.pageHeader}>
          <Text style={st.pageTitle}>Geçmiş</Text>
        </View>

        {/* Month navigation */}
        <View style={st.monthNav}>
          <Pressable style={st.navBtn} onPress={goToPrev} hitSlop={12}>
            <Text style={st.navArrow}>‹</Text>
          </Pressable>
          <Text style={st.monthLabel}>{TR_MONTHS[month - 1]} {year}</Text>
          <Pressable
            style={[st.navBtn, isCurrentMonth && st.navBtnOff]}
            onPress={goToNext}
            disabled={isCurrentMonth}
            hitSlop={12}
          >
            <Text style={[st.navArrow, isCurrentMonth && st.navArrowOff]}>›</Text>
          </Pressable>
        </View>

        {/* Instrument filter chips */}
        {instruments.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={st.chipScroll}
            contentContainerStyle={st.chipContent}
          >
            <Pressable
              style={[st.chip, filterInstrId === null && st.chipOn]}
              onPress={() => setFilterInstrId(null)}
            >
              <Text style={[st.chipTxt, filterInstrId === null && st.chipTxtOn]}>Tümü</Text>
            </Pressable>
            {instruments.map(inst => (
              <Pressable
                key={inst.id}
                style={[st.chip, filterInstrId === inst.id && st.chipOn]}
                onPress={() => setFilterInstrId(inst.id)}
              >
                <Text style={st.chipEmoji}>{inst.emoji}</Text>
                <Text style={[st.chipTxt, filterInstrId === inst.id && st.chipTxtOn]}>
                  {inst.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Calendar */}
        <View style={st.calWrap}>
          <View style={st.dayLabelsRow}>
            {DAY_LABELS.map(d => (
              <Text key={d} style={st.dayLabel}>{d}</Text>
            ))}
          </View>

          {monthLoading ? (
            <ActivityIndicator color={C.gold} style={{ marginVertical: 32 }} />
          ) : (
            <View style={st.grid}>
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <View key={`e${idx}`} style={st.cell} />;
                }
                const ds = toDateStr(year, month, day);
                const isToday = ds === todayStr;
                const isSel = ds === selectedDate;
                const hasDot = markedDates.has(ds);
                return (
                  <Pressable
                    key={ds}
                    style={[st.cell, isToday && st.cellToday, isSel && st.cellSel]}
                    onPress={() => setSelectedDate(prev => prev === ds ? null : ds)}
                  >
                    <Text style={[
                      st.cellTxt,
                      isToday && st.cellTxtToday,
                      isSel && st.cellTxtSel,
                    ]}>
                      {day}
                    </Text>
                    {hasDot && (
                      <View style={[st.dot, isSel && st.dotSel]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Selected day entries */}
        {selectedDate && (
          <View style={st.detail}>
            <Text style={st.detailDate}>
              {selectedDate.split('-').reverse().join('.')}
            </Text>

            {detailLoading ? (
              <ActivityIndicator color={C.gold} style={{ marginTop: 20 }} />
            ) : selectedEntries.length === 0 ? (
              <View style={st.emptyDay}>
                <Text style={st.emptyDayTxt}>Bu günde kayıt yok</Text>
              </View>
            ) : (
              selectedEntries.map(entry => (
                <View key={entry.id} style={st.entryCard}>
                  <Text style={st.entryInstr}>
                    {entry.instrument_emoji} {entry.instrument_name}
                  </Text>
                  {SECTIONS.map(sec => {
                    const items = entry.items.filter(i => i.type === sec.type);
                    if (items.length === 0) return null;
                    return (
                      <View key={sec.type} style={st.secBlock}>
                        <View style={st.secHead}>
                          <Text style={[st.secIcon, { color: sec.color }]}>{sec.icon}</Text>
                          <Text style={[st.secLabel, { color: sec.color }]}>{sec.label}</Text>
                        </View>
                        {items.map(item => (
                          <View key={item.id} style={st.itemRow}>
                            <View style={[st.itemBullet, { backgroundColor: sec.color }]} />
                            <Text style={st.itemTxt}>{item.content}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  scroll: { paddingBottom: 48 },

  pageHeader: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  pageTitle: { fontFamily: SERIF, fontSize: 30, color: C.gold, letterSpacing: 0.3 },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navBtnOff: { opacity: 0.25 },
  navArrow: { fontSize: 28, color: C.gold, lineHeight: 34 },
  navArrowOff: { color: C.textDim },
  monthLabel: { fontSize: 17, fontWeight: '600', color: C.text, letterSpacing: 0.2 },

  chipScroll: { maxHeight: 44, marginBottom: 12 },
  chipContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  chipOn: { borderColor: C.goldBorder, backgroundColor: C.goldGlow },
  chipEmoji: { fontSize: 14 },
  chipTxt: { fontSize: 13, color: C.textMuted },
  chipTxtOn: { color: C.gold, fontWeight: '600' },

  calWrap: { paddingHorizontal: 10 },
  dayLabelsRow: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: C.textDim, fontWeight: '600', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285714%', height: 46, alignItems: 'center', justifyContent: 'center' },
  cellToday: { borderRadius: 10, borderWidth: 1.5, borderColor: C.purple },
  cellSel: { borderRadius: 10, backgroundColor: C.gold },
  cellTxt: { fontSize: 15, color: C.text },
  cellTxtToday: { color: C.purple, fontWeight: '600' },
  cellTxtSel: { color: '#080810', fontWeight: '700' },
  dot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold },
  dotSel: { backgroundColor: '#080810' },

  detail: { marginTop: 20, paddingHorizontal: 16 },
  detailDate: { fontSize: 13, color: C.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
  emptyDay: {
    alignItems: 'center', paddingVertical: 32,
    borderWidth: 1, borderColor: C.border, borderRadius: 14, borderStyle: 'dashed',
  },
  emptyDayTxt: { color: C.textDim, fontSize: 14 },

  entryCard: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  entryInstr: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 12 },
  secBlock: { marginBottom: 10 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  secIcon: { fontSize: 10, fontWeight: '700' },
  secLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 4, marginBottom: 4 },
  itemBullet: { width: 4, height: 4, borderRadius: 2, marginTop: 9, marginRight: 8, flexShrink: 0 },
  itemTxt: { flex: 1, fontSize: 14, color: C.text, lineHeight: 22, opacity: 0.85 },
});
