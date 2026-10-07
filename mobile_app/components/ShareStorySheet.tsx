import { Action, Sheet } from './DesignSystem';
/**
 * ShareStorySheet — bottom sheet for sharing a finished/rated book.
 *
 * Native Instagram/Facebook/X/WhatsApp sharing requires react-native-share +
 * react-native-view-shot, which exist only in a dev build / prebuild binary.
 * In Expo Go (Constants.appOwnership === 'expo') those TurboModules are absent,
 * so we detect that up-front, hide the native targets, show a clear note, and
 * fall back to the system share sheet (text + captured image when possible).
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, NativeModules, StatusBar } from 'react-native';
import Constants from 'expo-constants';
import { Share2, Send, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import StoryShareCard from './StoryShareCard';

const RN_SHARE_AVAILABLE = !!NativeModules.RNShare;
const VIEW_SHOT_AVAILABLE = !!NativeModules.RNViewShot;
const IS_EXPO_GO = Constants.appOwnership === 'expo';
const NATIVE_SHARING = RN_SHARE_AVAILABLE && VIEW_SHOT_AVAILABLE && !IS_EXPO_GO;

type ShareTarget = 'instagram' | 'facebook' | 'twitter' | 'whatsapp';

interface ShareTargetButtonProps {
  icon: React.ReactNode;
  label: string;
  backgroundColor: string;
  onPress: () => void;
}

function ShareTargetButton({ icon, label, backgroundColor, onPress }: ShareTargetButtonProps) {
  return (
    <Action onPress={onPress} style={[styles.shareTarget, { backgroundColor }]}>
      <View style={styles.shareTargetIcon}>{icon}</View>
      <Text style={styles.shareTargetLabel}>{label}</Text>
    </Action>
  );
}

interface Props {
  visible: boolean;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
  initialRating: number;
  onClose: () => void;
}

export default function ShareStorySheet({
  visible,
  bookTitle,
  bookAuthor,
  bookCover,
  initialRating,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [rating, setRating] = useState(initialRating);

  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setShareError(null);
    }
  }, [visible, initialRating]);

  // Lazily require native modules so they never crash app startup
  // in environments (e.g. Expo Go) where the TurboModules are absent.
  const getNativeShare = useCallback(() => {
    if (!RN_SHARE_AVAILABLE || !VIEW_SHOT_AVAILABLE) return null;
    try {
      const { captureRef } = require('react-native-view-shot');
      const ShareMod = require('react-native-share');
      return {
        captureRef,
        Share: ShareMod.default,
        Social: ShareMod.Social,
      };
    } catch {
      return null;
    }
  }, []);

  const buildCardUri = useCallback(async (): Promise<string> => {
    const native = getNativeShare();
    if (!native) throw new Error('native-share-unavailable');
    return native.captureRef(cardRef, {
      format: 'png',
      quality: 1,
      width: 1080,
      height: 1920,
    });
  }, [getNativeShare]);

  // Graceful fallback used in Expo Go / when native modules are missing:
  // open the platform share sheet with the caption and, if we managed to
  // capture the card image, the image itself.
  const handleSystemShare = useCallback(async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      setShareError(null);
      const { Share } = await import('react-native');
      const caption = t('completion.shareCaption', { title: bookTitle });
      let uri: string | undefined;
      try {
        uri = await buildCardUri();
      } catch {
        uri = undefined;
      }
      await Share.share(uri ? { message: caption, url: uri } : { message: caption });
    } catch {
      // user dismissed the share sheet → ignore
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, t, bookTitle, buildCardUri]);

  const shareCardTo = useCallback(async (target: ShareTarget) => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      setShareError(null);
      const native = getNativeShare();
      if (!native) throw new Error('native-share-unavailable');
      const uri = await buildCardUri();
      const caption = t('completion.shareCaption', { title: bookTitle });
      const { Share, Social } = native;
      const targets: Record<ShareTarget, string | undefined> = {
        instagram: Social.InstagramStories,
        facebook: Social.Facebook,
        twitter: Social.Twitter,
        whatsapp: Social.Whatsapp,
      };
      const social = targets[target];
      if (social) {
        await Share.shareSingle({
          social,
          backgroundImage: uri,
          message: caption,
          appId: 'rsvpReader',
        });
      } else {
        const { Share: RNS } = require('react-native');
        RNS.share({ message: caption, url: uri });
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (/notinstalled|activityno|not installed/i.test(msg)) {
        setShareError(t('completion.shareUnavailable'));
      } else if (!/cancel/i.test(msg)) {
        console.warn('Share to', target, 'failed:', msg);
        setShareError(t('completion.shareFailed'));
      }
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, t, bookTitle, buildCardUri, getNativeShare]);

  if (!visible) return null;

  return (
    <>
      <StatusBar hidden />
      <Sheet visible={visible} onClose={onClose}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('completion.shareStory')}
          </Text>

          {!NATIVE_SHARING && (
            <Text style={[styles.note, { color: '#fb7185' }]}>
              {t('completion.shareNeedsDevBuild')}
            </Text>
          )}
          {shareError ? (
            <Text style={[styles.error, { color: '#fb7185' }]}>{shareError}</Text>
          ) : null}

          <View style={styles.targets}>
            {NATIVE_SHARING && (
              <ShareTargetButton
                icon={<Text style={styles.brandGlyph}>📸</Text>}
                label={t('completion.share.instagram')}
                backgroundColor="#E1306C"
                onPress={() => shareCardTo('instagram')}
              />
            )}
            {NATIVE_SHARING && (
              <ShareTargetButton
                icon={<Text style={styles.brandGlyph}>f</Text>}
                label={t('completion.share.facebook')}
                backgroundColor="#1877F2"
                onPress={() => shareCardTo('facebook')}
              />
            )}
            {NATIVE_SHARING && (
              <ShareTargetButton
                icon={<Text style={styles.brandGlyph}>𝕏</Text>}
                label={t('completion.share.twitter')}
                backgroundColor="#000000"
                onPress={() => shareCardTo('twitter')}
              />
            )}
            {NATIVE_SHARING && (
              <ShareTargetButton
                icon={<Text style={styles.brandGlyph}>💬</Text>}
                label={t('completion.share.whatsapp')}
                backgroundColor="#25D366"
                onPress={() => shareCardTo('whatsapp')}
              />
            )}
            <ShareTargetButton
              icon={<Send color={colors.foreground} size={22} />}
              label={t('completion.share.more')}
              backgroundColor={colors.surface3}
              onPress={handleSystemShare}
            />
          </View>

          <Action
            onPress={onClose}
            style={[styles.cancel, { borderColor: colors.border }]}
          >
            <Text style={[styles.cancelText, { color: colors.foreground }]}>
              {t('common.cancel')}
            </Text>
          </Action>
      </Sheet>

      {/* Off-screen card captured for the story share (native builds only) */}
      {NATIVE_SHARING && (
        <View style={styles.captureHost} pointerEvents="none">
          <StoryShareCard
            ref={cardRef}
            title={bookTitle}
            author={bookAuthor}
            rating={rating}
            cover={bookCover}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 13, 22, 0.72)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  targets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  shareTarget: {
    width: '31%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareTargetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  brandGlyph: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: '800',
  },
  shareTargetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancel: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Off-screen host for the captured story card
  captureHost: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: 1080,
    height: 1920,
  },
});
