import { Design } from '../../constants/theme';
import { ScreenHeader, Action, Surface } from '../../components/DesignSystem';
import React from 'react';
import Constants from 'expo-constants';
import appConfig from '../../app.json';
import { View, Text, ScrollView,  Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Moon, Sun, Gauge, Eye, Info, Zap, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useLibrary } from '../../hooks/useLibrary';
import * as db from '../../db/database';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, colors, setTheme } = useTheme();
  const { settings, refreshSettings } = useLibrary();

  const speed = settings?.readingSpeed ?? 300;
  const showFixation = settings?.showFixation ?? true;

  const handleSpeedChange = async (val: number) => {
    await db.updateSettings({ readingSpeed: Math.round(val) });
    await refreshSettings();
  };

  const handleFixationToggle = async (val: boolean) => {
    await db.updateSettings({ showFixation: val });
    await refreshSettings();
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={{ paddingHorizontal: 0 }}><ScreenHeader title={t('settings.title')} subtitle={t('settings.subtitle')} /></View>

        {/* Appearance (Theme) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedFg }]}>{t('settings.appearance').toUpperCase()}</Text>
          <View style={styles.themeRow}>
            {/* Dark option */}
            <Action
              onPress={() => setTheme('dark')}
              style={[
                styles.themeCard,
                {
                  backgroundColor: theme === 'dark' ? colors.primaryMuted : colors.surface,
                  borderColor: theme === 'dark' ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.themePreviewDark, { borderColor: colors.border }]}>
                <View style={styles.previewLine1} />
                <View style={styles.previewLine2} />
                <View style={styles.previewLine3} />
                <View style={[styles.previewPill, { backgroundColor: colors.primary }]} />
              </View>
              <View style={styles.themeLabelRow}>
                <Moon size={16} color={colors.primary} />
                <Text style={[styles.themeLabel, { color: colors.foreground }]}>{t('settings.dark')}</Text>
              </View>
              {theme === 'dark' && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
            </Action>

            {/* Light option */}
            <Action
              onPress={() => setTheme('light')}
              style={[
                styles.themeCard,
                {
                  backgroundColor: theme === 'light' ? colors.primaryMuted : colors.surface,
                  borderColor: theme === 'light' ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.themePreviewLight, { borderColor: colors.border }]}>
                <View style={styles.previewLine1Light} />
                <View style={styles.previewLine2Light} />
                <View style={styles.previewLine3Light} />
                <View style={[styles.previewPill, { backgroundColor: colors.primary }]} />
              </View>
              <View style={styles.themeLabelRow}>
                <Sun size={16} color={colors.primary} />
                <Text style={[styles.themeLabel, { color: colors.foreground }]}>{t('settings.light')}</Text>
              </View>
              {theme === 'light' && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
            </Action>
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedFg }]}>{t('settings.language').toUpperCase()}</Text>
          <Surface style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardItemRow}>
              <View style={styles.itemTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryMuted }]}>
                  <Languages size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>{t('settings.language')}</Text>
                  <Text style={[styles.itemSub, { color: colors.mutedFg }]}>{t('settings.languageDesc')}</Text>
                </View>
              </View>
              <Action
                onPress={toggleLanguage}
                style={[styles.langPill, { backgroundColor: colors.surface3, borderColor: colors.border }]}
              >
                <Text style={[styles.langPillText, { color: colors.foreground }]}>
                  {i18n.language === 'pl' ? 'Polski' : 'English'}
                </Text>
              </Action>
            </View>
          </Surface>
        </View>

        {/* RSVP Reading */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedFg }]}>{t('settings.rsvpReading').toUpperCase()}</Text>
          <Surface style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Speed slider */}
            <View style={styles.cardItem}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryMuted }]}>
                    <Gauge size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]}>{t('settings.readingSpeed')}</Text>
                    <Text style={[styles.itemSub, { color: colors.mutedFg }]}>{t('settings.readingSpeedDesc')}</Text>
                  </View>
                </View>
                <Text style={[styles.speedVal, { color: colors.primary }]}>
                  {speed} <Text style={[styles.speedUnit, { color: colors.mutedFg }]}>{t('stats.unit.wpm')}</Text>
                </Text>
              </View>
              <Slider
                value={speed}
                minimumValue={100}
                maximumValue={800}
                step={25}
                onSlidingComplete={handleSpeedChange}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surface3}
                thumbTintColor={colors.primary}
                style={styles.slider}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderMinMax, { color: colors.subtleFg }]}>100 {t('stats.unit.wpm')}</Text>
                <Text style={[styles.sliderMinMax, { color: colors.subtleFg }]}>800 {t('stats.unit.wpm')}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Fixation toggle */}
            <View style={styles.cardItemRow}>
              <View style={styles.itemTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryMuted }]}>
                  <Eye size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>{t('settings.fixationPoint')}</Text>
                  <Text style={[styles.itemSub, { color: colors.mutedFg }]}>{t('settings.fixationPointDesc')}</Text>
                </View>
              </View>
              <Switch
                value={showFixation}
                onValueChange={handleFixationToggle}
                trackColor={{ false: colors.surface3, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </Surface>
        </View>

        {/* O aplikacji */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedFg }]}>{t('settings.about').toUpperCase()}</Text>
          <Surface style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardItemRow}>
              <View style={styles.itemTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.surface3 }]}>
                  <Info size={16} color={colors.mutedFg} />
                </View>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{t('settings.version')}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.mutedFg }]}>{Constants.expoConfig?.version ?? appConfig.expo.version}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.cardItemRow}>
              <View style={styles.itemTitleRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.surface3 }]}>
                  <Zap size={16} color={colors.mutedFg} />
                </View>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{t('settings.technology')}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.mutedFg }]}>RSVP (React Native)</Text>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Design.spacing.lg,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    paddingTop: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeCard: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  themePreviewDark: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: '#0f1219',
    borderWidth: 1,
    padding: 8,
    position: 'relative',
  },
  themePreviewLight: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    padding: 8,
    position: 'relative',
  },
  previewLine1: { height: 6, borderRadius: 3, backgroundColor: '#2d3549', marginBottom: 6 },
  previewLine2: { height: 4, borderRadius: 2, backgroundColor: '#1f2636', width: '80%', marginBottom: 4 },
  previewLine3: { height: 4, borderRadius: 2, backgroundColor: '#1f2636', width: '60%' },
  previewLine1Light: { height: 6, borderRadius: 3, backgroundColor: '#d5d5dc', marginBottom: 6 },
  previewLine2Light: { height: 4, borderRadius: 2, backgroundColor: '#ebebef', width: '80%', marginBottom: 4 },
  previewLine3Light: { height: 4, borderRadius: 2, backgroundColor: '#ebebef', width: '60%' },
  previewPill: { position: 'absolute', bottom: 6, left: 8, width: 32, height: 10, borderRadius: 5 },
  themeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  themeLabel: { fontSize: 15, fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  cardGroup: { borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  cardItem: { padding: 16 },
  cardItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16 },
  itemHeader: { flexWrap: 'wrap', gap: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemTitleRow: { flex: 1, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemSub: { fontSize: 13, marginTop: 1 },
  speedVal: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  speedUnit: { fontSize: 12, fontWeight: '400' },
  slider: { width: '100%', height: 32 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderMinMax: { fontSize: 12 },
  divider: { height: 1, width: '100%' },
  langPill: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  langPillText: { fontSize: 15, fontWeight: '600' },
  infoValue: { fontSize: 15 },
});
