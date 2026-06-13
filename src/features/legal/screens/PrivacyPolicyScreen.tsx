import { IosScrollView } from '@/src/components/IosScrollView';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <AppIcon name="ArrowLeft" size={24} color="#2563eb" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Privacy Policy</AppText>
        <View style={styles.placeholder} />
      </View>

      <IosScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <AppIcon name="ShieldCheck" size={24} color="#2563eb" />
        </View>

        <AppText style={styles.title}>Privacy Policy</AppText>
        <AppText style={styles.lastUpdated}>Last updated: June 8, 2026</AppText>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>1. Information We Collect</AppText>
          <AppText style={styles.sectionText}>
            We collect information needed to create accounts, process NFC card orders, publish
            customer profile pages, verify payments, and operate production workflows. This includes:
            {'\n\n'}- Name, company, job title, and contact information
            {'\n'}- Order, delivery, payment proof, and invoice details
            {'\n'}- Profile content, photos, links, and NFC/QR card data
            {'\n'}- Device and diagnostic information used for security and support
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>2. How We Use Your Information</AppText>
          <AppText style={styles.sectionText}>
            We use the information we collect to:
            {'\n\n'}- Provide SiteHub accounts, profiles, checkout, and order tracking
            {'\n'}- Process payments, refunds, invoices, production, QA, and shipping
            {'\n'}- Send operational notifications about orders and account activity
            {'\n'}- Improve reliability, security, support, and user experience
            {'\n'}- Prevent fraud, abuse, unauthorized access, and payment misuse
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>3. Information Sharing</AppText>
          <AppText style={styles.sectionText}>
            We do not sell your personal information. Data is shared only where needed to provide
            the service, such as payment processing, hosting, image delivery, analytics, support,
            or legal compliance. Access is limited to:
            {'\n\n'}- You and users you authorize through public profile links
            {'\n'}- Assigned sales, production, QA, shipping, finance, and admin staff
            {'\n'}- Service providers that process data for SiteHub
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>4. Data Security</AppText>
          <AppText style={styles.sectionText}>
            We use administrative, technical, and operational controls designed to protect personal
            information:
            {'\n\n'}- Encrypted transmission over HTTPS/TLS
            {'\n'}- Firebase Authentication and role-based access controls
            {'\n'}- Restricted payment, invoice, audit, and production records
            {'\n'}- Operational logging, monitoring, backups, and recovery controls
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>5. Your Rights</AppText>
          <AppText style={styles.sectionText}>
            Depending on your location and account type, you may request to:
            {'\n\n'}- Access your account, profile, order, and invoice information
            {'\n'}- Correct inaccurate profile or contact information
            {'\n'}- Delete data where retention is not legally or operationally required
            {'\n'}- Export your profile and order data
            {'\n'}- Opt out of non-essential communications
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>6. Contact Us</AppText>
          <AppText style={styles.sectionText}>
            If you have questions about this Privacy Policy, contact us at:
            {'\n\n'}Email: privacy@mahakasolutions.com
            {'\n'}Business: SiteHub by Mahaka Solutions
          </AppText>
        </View>

        <View style={styles.footer}>
          <AppText style={styles.footerText}>
            By using SiteHub, you agree to this Privacy Policy and our Terms of Service.
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
