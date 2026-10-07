import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AppText from '@/src/components/AppText';
import AppIcon from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

// QrCode SVG is optional — gracefully fallback if not installed
let QRCode: React.ComponentType<{
  value: string;
  size: number;
  color?: string;
  backgroundColor?: string;
}> | null = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch {
  QRCode = null;
}

const C = {
  canvas: '#0D0D0E',
  surface: '#242424',
  surfaceRaised: '#2C2C2C',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
  accent: '#799A85',
};

type QrStyle = 'dots' | 'squares' | 'rounded';
const QR_STYLES: QrStyle[] = ['dots', 'squares', 'rounded'];

const FG_COLORS = ['#F5F5F7', '#2596BE', '#30D158', '#FFD60A', '#BF5AF2'];
const BG_COLORS = ['#000000', '#111114', '#0A1628', '#0D2015', '#1A0A28'];

export default function QrCustomizeScreen() {
  const [qrStyle, setQrStyle] = useState<QrStyle>('squares');
  const [fgColor, setFgColor] = useState(FG_COLORS[0]);
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [addLogo, setAddLogo] = useState(false);
  const [showProfileBelow, setShowProfileBelow] = useState(true);

  const handleSave = useCallback(() => {
    HapticTap.confidentClick();
    router.back();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => { HapticTap.light(); router.back(); }}
          style={styles.backBtn}
          hitSlop={8}
        >
          <AppIcon name="chevron-left" size={22} color={C.text} />
        </Pressable>
        <AppText style={styles.headerTitle}>Customize QR</AppText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Preview */}
        <View style={[styles.previewCard, { backgroundColor: bgColor }]}>
          {QRCode ? (
            <QRCode
              value="https://sitehubman.com/u/demo"
              size={180}
              color={fgColor}
              backgroundColor={bgColor}
            />
          ) : (
            <View style={styles.qrPlaceholder}>
              <AppIcon name="maximize" size={80} color={fgColor} />
              <AppText style={[styles.qrPlaceholderText, { color: fgColor }]}>
                QR Preview
              </AppText>
            </View>
          )}
          {showProfileBelow && (
            <View style={styles.profileBelow}>
              <View style={styles.profileBelowAvatar} />
              <AppText style={[styles.profileBelowName, { color: fgColor }]}>
                Alex Johnson
              </AppText>
              <AppText style={[styles.profileBelowTitle, { color: fgColor, opacity: 0.6 }]}>
                Software Engineer
              </AppText>
            </View>
          )}
        </View>

        {/* QR Style */}
        <AppText style={styles.sectionLabel}>QR STYLE</AppText>
        <View style={styles.pillRow}>
          {QR_STYLES.map((s) => (
            <Pressable
              key={s}
              onPress={() => { HapticTap.softConfirmation(); setQrStyle(s); }}
              style={[styles.pill, qrStyle === s && styles.pillActive]}
              hitSlop={4}
            >
              <AppText
                style={[styles.pillText, qrStyle === s && styles.pillTextActive]}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Foreground Color */}
        <AppText style={styles.sectionLabel}>FOREGROUND</AppText>
        <View style={styles.colorRow}>
          {FG_COLORS.map((col) => (
            <Pressable
              key={col}
              onPress={() => { HapticTap.light(); setFgColor(col); }}
              style={[
                styles.swatch,
                { backgroundColor: col },
                fgColor === col && styles.swatchActive,
              ]}
              hitSlop={4}
            >
              {fgColor === col && (
                <AppIcon name="check" size={14} color={col === '#F5F5F7' ? '#000' : '#fff'} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Background Color */}
        <AppText style={styles.sectionLabel}>BACKGROUND</AppText>
        <View style={styles.colorRow}>
          {BG_COLORS.map((col) => (
            <Pressable
              key={col}
              onPress={() => { HapticTap.light(); setBgColor(col); }}
              style={[
                styles.swatch,
                { backgroundColor: col, borderColor: 'rgba(255,255,255,0.2)' },
                bgColor === col && styles.swatchActive,
              ]}
              hitSlop={4}
            >
              {bgColor === col && (
                <AppIcon name="check" size={14} color="#fff" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Toggles */}
        <AppText style={styles.sectionLabel}>OPTIONS</AppText>
        <View style={styles.group}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIconWrap}>
                <AppIcon name="image" size={16} color={C.accent} />
              </View>
              <View>
                <AppText style={styles.toggleLabel}>Add Logo</AppText>
                <AppText style={styles.toggleSub}>Embed profile photo in QR center</AppText>
              </View>
            </View>
            <Switch
              value={addLogo}
              onValueChange={(v) => {
                HapticTap.softConfirmation();
                setAddLogo(v);
              }}
              trackColor={{ false: C.surfaceRaised, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIconWrap}>
                <AppIcon name="user" size={16} color={C.accent} />
              </View>
              <View>
                <AppText style={styles.toggleLabel}>Profile Preview Below QR</AppText>
                <AppText style={styles.toggleSub}>Show name & title under code</AppText>
              </View>
            </View>
            <Switch
              value={showProfileBelow}
              onValueChange={(v) => {
                HapticTap.softConfirmation();
                setShowProfileBelow(v);
              }}
              trackColor={{ false: C.surfaceRaised, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.75 }]}
          hitSlop={4}
        >
          <AppIcon name="save" size={18} color="#000" />
          <AppText style={styles.saveBtnText}>Save Style</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: { width: 36, alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.3,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  previewCard: {
    borderRadius: 24,
    borderColor: C.border,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 16,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qrPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileBelow: {
    alignItems: 'center',
    gap: 4,
  },
  profileBelowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceRaised,
    marginBottom: 4,
  },
  profileBelowName: {
    fontSize: 15,
    fontWeight: '600',
  },
  profileBelowTitle: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.muted,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 99,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  pillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  pillText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderColor: C.accent,
    transform: [{ scale: 1.1 }],
  },
  group: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderColor: C.border,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  toggleSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
