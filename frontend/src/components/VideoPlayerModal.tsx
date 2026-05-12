import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { JournalVideo } from '../services/video.service';

interface Props {
  video: JournalVideo | null;
  viewCount: number;
  isVisible: boolean;
  onClose: () => void;
  onOpened: () => void;
}

export function VideoPlayerModal({ video, viewCount, isVisible, onClose, onOpened }: Props) {
  const hasNotifiedRef = useRef(false);

  const player = useVideoPlayer(
    video ? { uri: video.local_uri } : null,
    (p) => { p.loop = false; },
  );

  useEffect(() => {
    if (isVisible && video && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onOpened();
    }
    if (!isVisible) {
      hasNotifiedRef.current = false;
    }
  }, [isVisible, video, onOpened]);

  const handleClose = useCallback(() => {
    player.pause();
    onClose();
  }, [player, onClose]);

  if (!video) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            onPress={handleClose}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {video.title ?? 'Video'}
          </Text>
          {/* Mirror spacer to optically center the title */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Player */}
        <View style={styles.playerWrap}>
          <VideoView
            style={styles.videoView}
            player={player}
            allowsFullscreen
            allowsPictureInPicture={false}
            nativeControls
            contentFit="contain"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.viewCountTxt}>👁 {viewCount} izlenme</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  closeIcon: {
    fontSize: 14,
    // Light on black: #F0F0F0 on #000 → 19:1 ✅
    color: '#F0F0F0',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#F0EBE3',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 36,
  },
  playerWrap: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoView: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  viewCountTxt: {
    fontSize: 13,
    // muted on black: #888 → 5.7:1 ✅ WCAG AA
    color: '#888',
    fontWeight: '500',
  },
});
