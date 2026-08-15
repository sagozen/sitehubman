import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppHeaderV2 } from '@/src/components/AppHeaderV2';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { HapticTap } from '@/src/utils/haptics';

interface FAQItem {
  question: string;
  answer: string;
  category: 'nfc' | 'orders' | 'profile';
}

const FAQS: FAQItem[] = [
  {
    category: 'nfc',
    question: 'How do I tap an AVIO card on iPhone?',
    answer: 'Tap the card against the very top edge of the back of your iPhone (near the camera). For iPhone XS and newer, no app is needed — background NFC reading is automatic.',
  },
  {
    category: 'nfc',
    question: 'How do I tap an AVIO card on Android?',
    answer: 'Ensure NFC is turned ON in your quick settings, then tap the card against the center back of the phone.',
  },
  {
    category: 'profile',
    question: 'How do I edit my social links and bio?',
    answer: 'Navigate to the Profile tab in your AVIO app. Tap any field (Phone, Email, LinkedIn, WhatsApp) to update your info in real time. Changes sync to your card in under 1 second.',
  },
  {
    category: 'orders',
    question: 'How long does physical card shipping take?',
    answer: 'Orders are laser-engraved and quality-inspected within 24 hours. Local delivery takes 1-2 business days; international shipping takes 3-5 business days.',
  },
  {
    category: 'nfc',
    question: 'What is Direct Mode?',
    answer: 'Direct Mode lets your NFC card bypass your bio landing page and open your WhatsApp, LinkedIn, or custom portfolio link directly when tapped.',
  },
];

export function HelpCenterScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'nfc' | 'profile' | 'orders'>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery =
      !query.trim() ||
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleSupportClick = (channel: 'telegram' | 'whatsapp') => {
    HapticTap.selection();
    const url =
      channel === 'telegram'
        ? 'https://t.me/aviobrand'
        : 'https://wa.me/85512345678';
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.root}>
      <AppHeaderV2 title="Help & Support" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <AppIcon name="Search" size={20} color="rgba(255, 255, 255, 0.4)" />
          <TextInput
            placeholder="Search FAQs, tapping guides, NFC setup..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Live Support Bridge Cards */}
        <View style={styles.supportBridges}>
          <Pressable
            style={({ pressed }) => [styles.bridgeCard, styles.bridgeTg, pressed && { opacity: 0.8 }]}
            onPress={() => handleSupportClick('telegram')}
          >
            <AppIcon name="Send" size={24} color="#0088CC" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText style={styles.bridgeTitle}>Telegram Live Support</AppText>
              <AppText style={styles.bridgeSub}>Instant 24/7 direct response</AppText>
            </View>
            <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.bridgeCard, styles.bridgeWa, pressed && { opacity: 0.8 }]}
            onPress={() => handleSupportClick('whatsapp')}
          >
            <AppIcon name="MessageCircle" size={24} color="#25D366" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText style={styles.bridgeTitle}>WhatsApp VIP Desk</AppText>
              <AppText style={styles.bridgeSub}>Priority customer concierge</AppText>
            </View>
            <AppIcon name="ChevronRight" size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>
        </View>

        {/* Category Pills */}
        <View style={styles.categories}>
          {(['all', 'nfc', 'profile', 'orders'] as const).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                HapticTap.selection();
                setActiveCategory(cat);
              }}
              style={[
                styles.categoryPill,
                activeCategory === cat && styles.categoryPillActive,
              ]}
            >
              <AppText
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat.toUpperCase()}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* FAQ Accordion List */}
        <View style={styles.faqList}>
          <AppText style={styles.sectionHeader}>Frequently Asked Questions</AppText>
          {filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <Pressable
                key={faq.question}
                onPress={() => {
                  HapticTap.selection();
                  setExpandedIndex(isExpanded ? null : index);
                }}
                style={[styles.faqCard, isExpanded && styles.faqCardActive]}
              >
                <View style={styles.faqHeaderRow}>
                  <AppText style={styles.faqQuestion}>{faq.question}</AppText>
                  <AppIcon
                    name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                    size={18}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                </View>
                {isExpanded && (
                  <AppText style={styles.faqAnswer}>{faq.answer}</AppText>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },
  supportBridges: {
    gap: 10,
    marginBottom: 24,
  },
  bridgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  bridgeTg: {
    borderLeftWidth: 4,
    borderLeftColor: '#0088CC',
  },
  bridgeWa: {
    borderLeftWidth: 4,
    borderLeftColor: '#25D366',
  },
  bridgeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bridgeSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  categories: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryTextActive: {
    color: '#000000',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#111114',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  faqCardActive: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#16161A',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
    lineHeight: 19,
  },
});
