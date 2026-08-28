/**
 * PublicBioScreen — Ban Nguyen Business Specification Public Bio Profile.
 *
 * Full implementation of Ban Nguyen's exact specifications:
 *  - Multilingual support (VI / EN toggle)
 *  - Full-bleed executive cover hero with avatar & verified badge
 *  - Identity block (Name, Title, Org, Positioning line)
 *  - Primary Action card (Icon, Label VI/EN, Subline VI/EN, Link)
 *  - Up to 3 Action Blocks (Tư vấn qua kênh bạn quen, Liên hệ, Sản phẩm và bài viết, etc.) with up to 4 items each
 *  - Trust Footnote block (Owner line, Trust note, aviobrand.com link, report link)
 *  - Viral growth card ("Powered by AVIO")
 */
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import QRCode from 'react-native-qrcode-svg';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosScrollView } from '@/src/components/IosScrollView';
import { buildCardProfileUrl, buildSlugProfileUrl } from '@/src/constants/publicProfile';
import {
  resolvePublicProfileByCardId,
  resolvePublicProfileBySlug,
} from '@/src/services/nfcProfileService';
import { notifyCardOwnerOfSave, notifyCardOwnerOfLeadCapture } from '@/src/services/cardViewNotificationService';
import { captureLead } from '@/src/services/leadService';
import type { BioPage, TapActionBlock, TapActionItem } from '@/src/types/models';
import { BAN_NGUYEN_SEED_BIO } from '@/src/data/seedBanNguyenBio';
import { HapticTap } from '@/src/utils/haptics';

interface Props {
  slug?: string;
  cardId?: string;
}

function compactMeta(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}

export function PublicBioScreen({ slug, cardId }: Props) {
  const [bioPage, setBioPage] = useState<BioPage | null>(null);
  const [publicUrl, setPublicUrl] = useState('');
  const [resolvedCardId, setResolvedCardId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  // Lead exchange state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadNote, setLeadNote] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const resolved = cardId
          ? await resolvePublicProfileByCardId(cardId)
          : slug
            ? await resolvePublicProfileBySlug(slug)
            : null;
        if (cancelled) return;
        if (resolved && resolved.bioPage) {
          setBioPage(resolved.bioPage);
          setPublicUrl(resolved.publicUrl);
          setResolvedCardId(resolved.cardId);
        } else {
          // Default fallback to Ban Nguyen seed bio
          const seed = BAN_NGUYEN_SEED_BIO as BioPage;
          setBioPage({
            ...seed,
            id: slug || cardId || 'pandev00',
            userId: 'seed',
            slug: slug || 'pandev00',
          });
          setPublicUrl(`https://sitehubman.app/u/${slug || 'pandev00'}`);
        }
      } catch (err) {
        console.warn('Failed to load profile:', err);
        const seed = BAN_NGUYEN_SEED_BIO as BioPage;
        setBioPage({
          ...seed,
          id: 'pandev00',
          userId: 'seed',
          slug: 'pandev00',
        });
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId, slug]);

  async function handleShare() {
    HapticTap.light();
    const url = publicUrl || `https://sitehubman.app/u/${slug || bioPage?.slug || 'pandev00'}`;
    try {
      await Share.share({
        message: `AVIO Smart Pass: ${bioPage?.displayName || 'Ban Nguyen'} - ${url}`,
        url,
        title: bioPage?.displayName || 'Ban Nguyen Profile',
      });
    } catch {
      // ignore
    }
  }

  async function handleSaveContact() {
    HapticTap.medium();
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${bioPage?.displayName || 'Ban Nguyen'}`,
      `TITLE:${bioPage?.jobTitleVi || bioPage?.tagline || 'Tech Lead · AI Coaching 1-1'}`,
      `ORG:${bioPage?.organization || 'SAGOZEN LLC'}`,
      `EMAIL:${bioPage?.email || 'pandev00@sagozen.digital'}`,
      `URL:${publicUrl || 'https://sitehubman.app/u/pandev00'}`,
      'END:VCARD',
    ].join('\n');

    await Share.share({ message: vcard, title: `${bioPage?.displayName || 'Ban Nguyen'} Contact` });
    if (bioPage?.userId && bioPage.userId !== 'seed') {
      void notifyCardOwnerOfSave(bioPage.userId).catch(() => undefined);
    }
  }

  async function handleExchangeContactSubmit() {
    if (!leadName.trim()) return;
    setLeadSubmitting(true);
    try {
      const ownerId = bioPage?.userId || 'guest';
      await captureLead({
        profileId: bioPage?.id || slug || 'pandev00',
        ownerUserId: ownerId,
        name: leadName.trim(),
        email: leadEmail.trim() || undefined,
        phone: leadPhone.trim() || undefined,
        company: leadCompany.trim() || undefined,
        note: leadNote.trim() || undefined,
      });

      if (ownerId !== 'guest' && ownerId !== 'seed') {
        void notifyCardOwnerOfLeadCapture(ownerId, leadName.trim(), leadCompany.trim() || undefined);
      }

      setLeadSuccess(true);
      HapticTap.heavy();
      setTimeout(() => {
        setShowExchangeModal(false);
        setLeadSuccess(false);
        setLeadName('');
        setLeadEmail('');
        setLeadPhone('');
        setLeadCompany('');
        setLeadNote('');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit contact exchange:', err);
    } finally {
      setLeadSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <View style={styles.loadingAvatarPulse} />
      </View>
    );
  }

  const bio = bioPage || (BAN_NGUYEN_SEED_BIO as BioPage);
  const initial = (bio.displayName.trim()[0] ?? 'B').toUpperCase();
  const canonicalUrl = publicUrl || `https://sitehubman.app/u/${bio.slug || 'pandev00'}`;

  // Multilingual resolution
  const currentTitle = lang === 'vi' ? (bio.jobTitleVi || bio.heroTitleVi || bio.tagline) : (bio.jobTitleEn || bio.heroTitleEn || bio.jobTitleVi || bio.tagline);
  const currentOrg = bio.organization || bio.heroOrg || bio.company || 'SAGOZEN LLC';
  const currentPos = lang === 'vi' ? (bio.positioningLineVi || bio.tagline) : (bio.positioningLineEn || bio.positioningLineVi);

  const primaryLabel = lang === 'vi' ? (bio.primaryActionLabelVi || 'Xem khoá AI Coaching 1-1') : (bio.primaryActionLabelEn || 'See the 1-1 AI Coaching programme');
  const primarySub = lang === 'vi' ? (bio.primaryActionSubVi || 'Lộ trình 9 bước · học phí theo đợt') : (bio.primaryActionSubEn || 'Nine stages · paid in stages');
  const primaryUrl = bio.primaryActionUrl || 'https://t.me/pandev00';
  const primaryIconName = (bio.primaryActionIcon as AppIconName) || 'FileText';

  const actionBlocksList: TapActionBlock[] = bio.actionBlocks?.length ? bio.actionBlocks : BAN_NGUYEN_SEED_BIO.actionBlocks ?? [];

  const ownerLine = lang === 'vi' ? (bio.ownerLineVi || 'Nội dung do Ban Nguyen cung cấp.') : (bio.ownerLineEn || 'Content provided by Ban Nguyen.');
  const trustNote = lang === 'vi' ? (bio.trustNoteVi || 'Avio lưu trữ trang này và không xác minh danh tính.') : (bio.trustNoteEn || 'Avio hosts this page and does not verify identity.');

  return (
    <View style={styles.root}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{`${bio.displayName} | AVIO Smart Pass`}</title>
          <meta name="description" content={currentTitle || 'Digital Business Profile'} />
          <meta property="og:title" content={`${bio.displayName} — AVIO Smart Pass`} />
          <meta property="og:description" content={currentTitle} />
          <meta property="og:url" content={canonicalUrl} />
          <meta name="theme-color" content="#000000" />
        </Head>
      ) : null}

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Navigation Bar */}
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => {
              HapticTap.light();
              if (router.canGoBack()) router.back();
              else router.push('/');
            }}
            style={styles.navIconBtn}
            hitSlop={10}
          >
            <AppIcon name="ChevronLeft" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.navRightGroup}>
            {(bio.showLanguageToggle !== false) && (
              <Pressable
                onPress={() => {
                  HapticTap.light();
                  setLang((l) => (l === 'vi' ? 'en' : 'vi'));
                }}
                style={styles.langToggleBtn}
              >
                <AppText style={styles.langToggleText} weight="extrabold">
                  {lang === 'vi' ? 'VI' : 'EN'}
                </AppText>
              </Pressable>
            )}

            <Pressable onPress={() => setShowQrModal(true)} style={styles.navIconBtn} hitSlop={10}>
              <AppIcon name="QrCode" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={() => void handleShare()} style={styles.navIconBtn} hitSlop={10}>
              <AppIcon name="Share2" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Full-bleed Cover Photo Hero */}
          <View style={styles.coverHeroWrap}>
            <Image
              source={bio.coverPhotoUrl ? { uri: bio.coverPhotoUrl } : require('@/assets/images/marketing/hero-home.png')}
              style={styles.coverPhoto}
              resizeMode="cover"
            />
            <View style={styles.coverOverlay} />

            {/* Avatar Seal */}
            <View style={styles.coverAvatarWrap}>
              {bio.photoUrl ? (
                <Image source={{ uri: bio.photoUrl }} style={styles.coverAvatarImg} />
              ) : (
                <View style={styles.coverAvatarSeal}>
                  <AppText style={styles.coverAvatarLetter} weight="extrabold">{initial}</AppText>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <AppIcon name="Check" size={11} color="#000000" />
              </View>
            </View>
          </View>

          {/* Identity Card */}
          <View style={styles.executiveCard}>
            <View style={styles.nameBlock}>
              <AppText style={styles.nameText} weight="extrabold">{bio.displayName}</AppText>
              <AppText style={styles.jobTitleText} weight="bold">{currentTitle}</AppText>
              <AppText style={styles.orgText}>{currentOrg}</AppText>
              {currentPos ? (
                <AppText style={styles.positioningText}>{currentPos}</AppText>
              ) : null}
              <View style={styles.slugPill}>
                <AppIcon name="Globe" size={10} color="rgba(255,255,255,0.5)" />
                <AppText style={styles.slugBadgeText}>
                  sitehubman.app/{bio.slug || 'pandev00'}
                </AppText>
              </View>
            </View>

            {/* Live Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statBarItem}>
                <AppText style={styles.statBarValue} weight="extrabold">{bio.views ?? 128}</AppText>
                <AppText style={styles.statBarLabel}>Lượt xem</AppText>
              </View>
              <View style={styles.statBarDivider} />
              <View style={styles.statBarItem}>
                <AppText style={styles.statBarValue} weight="extrabold">{bio.taps ?? 42}</AppText>
                <AppText style={styles.statBarLabel}>Lượt chạm NFC</AppText>
              </View>
              <View style={styles.statBarDivider} />
              <View style={styles.statBarItem}>
                <View style={styles.statBarLiveDot} />
                <AppText style={styles.statBarLiveLabel}>Đang hoạt động</AppText>
              </View>
            </View>

            {/* Save & Exchange CTAs */}
            <View style={styles.actionButtonsCol}>
              <Pressable
                onPress={() => void handleSaveContact()}
                style={({ pressed }) => [styles.saveContactBtn, pressed && styles.pressed]}
              >
                <AppIcon name="UserPlus" size={17} color="#000000" />
                <AppText style={styles.saveContactBtnText} weight="extrabold">
                  Lưu danh bạ (vCard)
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => {
                  HapticTap.medium();
                  setShowExchangeModal(true);
                }}
                style={({ pressed }) => [styles.exchangeContactBtn, pressed && styles.pressed]}
              >
                <AppIcon name="Users" size={16} color="#FFFFFF" />
                <AppText style={styles.exchangeContactBtnText} weight="extrabold">
                  Trao đổi liên hệ với {bio.displayName.split(' ')[0]}
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* ── Primary Action Card (Hành động chính) ── */}
          <Pressable
            style={({ pressed }) => [styles.primaryActionCard, pressed && styles.pressed]}
            onPress={() => {
              HapticTap.medium();
              Linking.openURL(primaryUrl).catch(() => undefined);
            }}
          >
            <View style={styles.primaryActionHeader}>
              <View style={styles.primaryActionIconBox}>
                <AppIcon name={primaryIconName} size={20} color="#000000" />
              </View>
              <View style={styles.primaryActionBadge}>
                <AppText style={styles.primaryActionBadgeText} weight="extrabold">HÀNH ĐỘNG CHÍNH</AppText>
              </View>
            </View>

            <View style={styles.primaryActionBody}>
              <AppText style={styles.primaryActionLabel} weight="extrabold">
                {primaryLabel}
              </AppText>
              <AppText style={styles.primaryActionSub}>
                {primarySub}
              </AppText>
            </View>

            <View style={styles.primaryActionFooter}>
              <AppText style={styles.primaryActionCtaText} weight="extrabold">Truy cập ngay →</AppText>
            </View>
          </Pressable>

          {/* ── Action Blocks (Up to 3 blocks) ── */}
          {actionBlocksList.map((block, bIdx) => {
            const blockTitle = lang === 'vi' ? block.titleVi : block.titleEn;
            if (!block.items || block.items.length === 0) return null;

            return (
              <View key={block.id || `block-${bIdx}`} style={styles.actionBlockContainer}>
                <AppText style={styles.blockTitle} weight="extrabold">
                  {blockTitle.toUpperCase()}
                </AppText>

                <View style={styles.blockItemsList}>
                  {block.items.map((item, iIdx) => {
                    const itemLabel = lang === 'vi' ? item.labelVi : item.labelEn;
                    const itemSub = lang === 'vi' ? (item.subVi || item.url) : (item.subEn || item.subVi || item.url);
                    const iconName = (item.icon as AppIconName) || 'Link';

                    return (
                      <Pressable
                        key={item.id || `item-${iIdx}`}
                        style={({ pressed }) => [styles.actionItemRow, pressed && styles.pressed]}
                        onPress={() => {
                          HapticTap.light();
                          Linking.openURL(item.url).catch(() => undefined);
                        }}
                      >
                        <View style={styles.actionItemIconBox}>
                          <AppIcon name={iconName} size={18} color="#FFFFFF" />
                        </View>
                        <View style={styles.actionItemMeta}>
                          <AppText style={styles.actionItemLabel} weight="bold">
                            {itemLabel}
                          </AppText>
                          {itemSub ? (
                            <AppText style={styles.actionItemSub} numberOfLines={1}>
                              {itemSub}
                            </AppText>
                          ) : null}
                        </View>
                        <AppIcon name="ArrowUpRight" size={16} color="rgba(255,255,255,0.4)" />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* ── Trust Footnote Block (Khối tin cậy Avio) ── */}
          <View style={styles.trustCard}>
            <View style={styles.trustHeaderRow}>
              <View style={styles.trustBrandBadge}>
                <AppText style={styles.trustBrandText} weight="extrabold">Powered by avio</AppText>
              </View>
            </View>

            <AppText style={styles.trustOwnerText} weight="bold">
              {ownerLine}
            </AppText>

            <View style={styles.trustLinksRow}>
              <Pressable onPress={() => Linking.openURL('https://aviobrand.com')} style={styles.trustLinkItem}>
                <AppText style={styles.trustLinkText} weight="bold">aviobrand.com</AppText>
              </Pressable>
              <AppText style={styles.trustDot}>·</AppText>
              <Pressable onPress={() => Linking.openURL('https://aviobrand.com/report')} style={styles.trustLinkItem}>
                <AppText style={styles.trustLinkText} weight="bold">Báo cáo trang này</AppText>
              </Pressable>
            </View>

            <AppText style={styles.trustNoticeText}>
              {trustNote}
            </AppText>
          </View>

          {/* Viral Growth Card */}
          <Pressable
            style={({ pressed }) => [styles.viralCard, pressed && styles.pressed]}
            onPress={() => {
              HapticTap.medium();
              Linking.openURL('https://aviobrand.com').catch(() => undefined);
            }}
          >
            <Image
              source={require('@/assets/images/marketing/nfc-tap-demo.png')}
              style={styles.viralCoverImg}
              resizeMode="cover"
            />
            <View style={styles.viralImgOverlay} />
            <View style={styles.viralCardContent}>
              <View style={styles.viralBadgeRow}>
                <View style={styles.viralBadge}>
                  <AppText style={styles.viralBadgeText} weight="extrabold">MIỄN PHÍ KHỞI TẠO</AppText>
                </View>
                <View style={styles.viralBadge}>
                  <AppText style={styles.viralBadgeText} weight="extrabold">SẴN SÀNG NFC</AppText>
                </View>
              </View>
              <AppText style={styles.viralTitle} weight="extrabold">
                {`Tạo ấn tượng với mọi đối tác như ${bio.displayName.split(' ')[0]}!`}
              </AppText>
              <AppText style={styles.viralSub}>
                Tạo trang danh tính AVIO Smart Pass trong 60 giây. Đối tác không cần cài ứng dụng.
              </AppText>
              <View style={styles.viralCta}>
                <AppText style={styles.viralCtaText} weight="extrabold">Tạo thẻ của tôi →</AppText>
              </View>
            </View>
          </Pressable>
        </IosScrollView>
      </SafeAreaView>

      {/* QR Code Modal */}
      <Modal visible={showQrModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            <View style={styles.qrHeaderRow}>
              <AppText style={styles.qrModalTitle} weight="bold">Mã QR danh tính</AppText>
              <Pressable onPress={() => setShowQrModal(false)} style={styles.closeBtn} hitSlop={10}>
                <AppIcon name="X" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.qrContainer}>
              <QRCode value={canonicalUrl} size={200} backgroundColor="#FFFFFF" color="#000000" />
            </View>
            <AppText style={styles.qrNameText} weight="extrabold">{bio.displayName}</AppText>
            <AppText style={styles.qrSubText}>Quét bằng camera điện thoại để kết nối</AppText>
          </View>
        </View>
      </Modal>

      {/* Exchange Contact Bottom Sheet Modal */}
      <Modal visible={showExchangeModal} animationType="slide" transparent>
        <Pressable style={styles.exchangeOverlay} onPress={() => setShowExchangeModal(false)}>
          <Pressable style={styles.exchangeCard} onPress={() => {}}>
            <View style={styles.exchangeHandle} />
            <View style={styles.exchangeHeaderRow}>
              <View style={styles.exchangeIconBox}>
                <AppIcon name="Users" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.exchangeModalTitle} weight="extrabold">
                  Trao đổi thông tin liên hệ
                </AppText>
                <AppText style={styles.exchangeModalSub}>
                  Gửi thông tin của bạn trực tiếp tới CRM của {bio.displayName.split(' ')[0]}
                </AppText>
              </View>
              <Pressable onPress={() => setShowExchangeModal(false)} style={styles.closeBtn} hitSlop={10}>
                <AppIcon name="X" size={18} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            {leadSuccess ? (
              <View style={styles.exchangeSuccessBox}>
                <View style={styles.exchangeSuccessIcon}>
                  <AppIcon name="Check" size={24} color="#000000" />
                </View>
                <AppText style={styles.exchangeSuccessTitle} weight="extrabold">
                  Đã gửi thành công!
                </AppText>
                <AppText style={styles.exchangeSuccessSub}>
                  Thông tin đã được lưu trực tiếp vào danh bạ của {bio.displayName.split(' ')[0]}.
                </AppText>
              </View>
            ) : (
              <View style={styles.exchangeForm}>
                <View style={styles.inputWrap}>
                  <AppText style={styles.inputLabel} weight="bold">Họ và tên *</AppText>
                  <TextInput
                    style={styles.textInput}
                    value={leadName}
                    onChangeText={setLeadName}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <AppText style={styles.inputLabel} weight="bold">Email hoặc Số điện thoại *</AppText>
                  <TextInput
                    style={styles.textInput}
                    value={leadEmail || leadPhone}
                    onChangeText={(val) => {
                      if (val.includes('@')) {
                        setLeadEmail(val);
                      } else {
                        setLeadPhone(val);
                      }
                    }}
                    placeholder="email@example.com hoặc 0901234567"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrap}>
                  <AppText style={styles.inputLabel} weight="bold">Công ty / Chức danh (Tuỳ chọn)</AppText>
                  <TextInput
                    style={styles.textInput}
                    value={leadCompany}
                    onChangeText={setLeadCompany}
                    placeholder="Tech Lead @ SAGOZEN"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>

                <Pressable
                  onPress={() => void handleExchangeContactSubmit()}
                  disabled={!leadName.trim() || leadSubmitting}
                  style={({ pressed }) => [
                    styles.sendContactBtn,
                    (!leadName.trim() || leadSubmitting) && styles.btnDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.sendContactBtnText} weight="extrabold">
                    {leadSubmitting ? 'Đang gửi...' : 'Gửi liên hệ của tôi →'}
                  </AppText>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safe: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAvatarPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16161A',
  },
  pressed: {
    opacity: 0.75,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleText: {
    color: '#000000',
    fontSize: 12,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 130,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  coverHeroWrap: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  coverAvatarWrap: {
    position: 'absolute',
    bottom: -36,
    left: 20,
  },
  coverAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#000000',
  },
  coverAvatarSeal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },
  coverAvatarLetter: {
    fontSize: 32,
    color: '#000000',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111114',
  },
  executiveCard: {
    borderRadius: 20,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    paddingTop: 48,
    alignItems: 'center',
    gap: 14,
  },
  nameBlock: {
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  jobTitleText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  orgText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  positioningText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  slugPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 4,
  },
  slugBadgeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D10',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  statBarItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statBarValue: {
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  statBarLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  statBarDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statBarLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30D158',
    marginBottom: 2,
  },
  statBarLiveLabel: {
    color: '#30D158',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 8,
  },
  saveContactBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveContactBtnText: {
    color: '#000000',
    fontSize: 14,
  },
  exchangeContactBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#16161A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exchangeContactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  primaryActionCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: 12,
  },
  primaryActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryActionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  primaryActionBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  primaryActionBody: {
    gap: 4,
  },
  primaryActionLabel: {
    color: '#000000',
    fontSize: 18,
    lineHeight: 22,
  },
  primaryActionSub: {
    color: 'rgba(0,0,0,0.65)',
    fontSize: 13,
  },
  primaryActionFooter: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  primaryActionCtaText: {
    color: '#000000',
    fontSize: 13,
  },
  actionBlockContainer: {
    gap: 8,
    marginTop: 4,
  },
  blockTitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    letterSpacing: 0.8,
    paddingLeft: 2,
  },
  blockItemsList: {
    gap: 8,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemMeta: {
    flex: 1,
    gap: 2,
  },
  actionItemLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  actionItemSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  trustCard: {
    borderRadius: 18,
    backgroundColor: '#0D0D10',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  trustHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustBrandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  trustBrandText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  trustOwnerText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  trustLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustLinkItem: {},
  trustLinkText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  trustDot: {
    color: 'rgba(255,255,255,0.3)',
  },
  trustNoticeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    lineHeight: 15,
  },
  viralCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
    marginTop: 8,
  },
  viralCoverImg: {
    width: '100%',
    height: '100%',
  },
  viralImgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  viralCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  viralBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  viralBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  viralBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  viralTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  viralSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 17,
  },
  viralCta: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  viralCtaText: {
    color: '#000000',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#111114',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  qrHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  qrNameText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  qrSubText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  exchangeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  exchangeCard: {
    backgroundColor: '#111114',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  exchangeHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  exchangeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exchangeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  exchangeModalSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  exchangeForm: {
    gap: 12,
  },
  inputWrap: {
    gap: 4,
  },
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  textInput: {
    backgroundColor: '#18181C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendContactBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  sendContactBtnText: {
    color: '#000000',
    fontSize: 14,
  },
  exchangeSuccessBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  exchangeSuccessIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  exchangeSuccessTitle: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  exchangeSuccessSub: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    textAlign: 'center',
  },
});
