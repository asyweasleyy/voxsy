import { ResizeMode, Video } from 'expo-av';
import React, { useCallback, useRef } from 'react';
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
  const videoRef = useRef<Video>(null);

  const handleClose = useCallback(async () => {
    await videoRef.current?.pauseAsync();
    onClose();
  }, [onClose]);

  const handleLoad = useCallback(() => {
    onOpened();
    videoRef.current?.playAsync();
  }, [onOpened]);

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
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {video.title ?? 'Video'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.playerWrap}>
          <Video
            ref={videoRef}
            source={{ uri: video.local_uri }}
            style={styles.videoView}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            onLoad={handleLoad}
            isLooping={false}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.viewCountTxt}>👁 {viewCount} izlenme</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
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
  closeBtnPressed: { backgroundColor: 'rgba(255,255,255,0.22)' },
  closeIcon: { fontSize: 14, color: '#F0F0F0', fontWeight: '700' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#F0EBE3',
    marginHorizontal: 8,
  },
  headerSpacer: { width: 36 },
  playerWrap: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  videoView: { flex: 1 },
  footer: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  viewCountTxt: { fontSize: 13, color: '#888', fontWeight: '500' },
});
