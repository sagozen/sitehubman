import { IosScrollView } from '@/src/components/IosScrollView';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <AppIcon name="ArrowLeft" size={24} color="#2563eb" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Terms of Service</AppText>
        <View style={styles.placeholder} />
      </View>

      <IosScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <AppIcon name="FileText" size={24} color="#2563eb" />
        </View>

        <AppText style={styles.title}>Terms of Service</AppText>
        <AppText style={styles.lastUpdated}>Last updated: June 8, 2026</AppText>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>1. Acceptance of Terms</AppText>
          <AppText style={styles.sectionText}>
            By accessing or using SiteHub, you agree to these Terms of Service. If you do not agree,
            do not use the app, public profile pages, checkout, production, or admin services.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>2. Use of the Service</AppText>
          <AppText style={styles.sectionText}>
            SiteHub provides NFC card ordering, public profile pages, payment tracking, production,
            QA, shipping, and administrative workflows. You may use the service only for lawful
            business or personal profile purposes and in accordance with your assigned role.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>3. Account Responsibilities</AppText>
          <AppText style={styles.sectionText}>
            You are responsible for the accuracy of information submitted through your account and
            for protecting your credentials. You agree not to:
            {'\n\n'}- Share admin or staff access with unauthorized users
            {'\n'}- Upload illegal, harmful, deceptive, or infringing content
            {'\n'}- Attempt to bypass role-based access controls or payment verification
            {'\n'}- Abuse APIs, checkout, uploads, webhooks, QR codes, or NFC card data
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>4. Orders and Payments</AppText>
          <AppText style={styles.sectionText}>
            Orders, prices, payment methods, refunds, invoices, production timelines, and shipping
            availability may vary by configuration and region. Payment status is not final until
            verified by SiteHub payment systems or authorized staff.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>5. Service Availability</AppText>
          <AppText style={styles.sectionText}>
            We aim to keep SiteHub reliable, but the service may be unavailable during maintenance,
            infrastructure incidents, third-party outages, security events, or force majeure events.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>6. Limitation of Liability</AppText>
          <AppText style={styles.sectionText}>
            To the maximum extent permitted by law, Mahaka Solutions is not liable for indirect,
            incidental, special, consequential, or business-interruption damages arising from use of
            SiteHub or inability to access the service.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>7. Changes</AppText>
          <AppText style={styles.sectionText}>
            We may update these terms as SiteHub evolves. Continued use after an update means you
            accept the revised terms.
          </AppText>
        </View>

        <View style={styles.footer}>
          <AppText style={styles.footerText}>
            For questions about these Terms of Service, contact legal@mahakasolutions.com
          </AppText>
        </View>
      </IosScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
