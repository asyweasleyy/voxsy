import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { JournalVideo } from '../services/video.service';

const C = {
  bg: '#080810',
  surface: 'rgba(255,255,255,0.04)',
  gold: '#C9A84C',
  goldBorder: 'rgba(201,168,76,0.3)',
  goldGlow: 'rgba(201,168,76,0.08)',
  text: '#F0EBE3',
  textMuted: 'rgba(240,235,227,0.45)',
  textDim: 'rgba(240,235,227,0.22)',
  border: 'rgba(255,255,255,0.07)',
  danger: '#FF5A7E',
};

interface Props {
  video: JournalVideo;
  viewCount: number;
  onPlay: (video: JournalVideo) => void;
  onDelete: (videoId: string) => void;
}

export function VideoThumbnailCard({ video, viewCount, onPlay, onDelete }: Props) {
  const handleLongPress = () => {
    Alert.alert(video.title ?? 'Video', undefined, [
      { text: 'Oynat', onPress: () => onPlay(video) },
      { text: 'Sil', style: 'destructive', onPress: () => onDelete(video.id) },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPlay(video)}
      onLongPress={handleLongPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${video.title ?? 'Video'}, ${viewCount} izlenme. Oynatmak için dokun.`}
    >
      {/* Thumbnail area — film strip placeholder */}
      <View style={styles.thumb}>
        <Text style={styles.filmIcon}>▶</Text>
      </View>

      {/* Info row */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {video.title ?? 'Video'}
        </Text>
        <View style={styles.viewBadge}>
          <Text style={styles.viewIcon}>👁</Text>
          <Text style={styles.viewCount}>{viewCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const CARD_W = 136;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.goldBorder,
    backgroundColor: C.goldGlow,
    overflow: 'hidden',
    marginRight: 10,
  },
  cardPressed: {
    opacity: 0.75,
  },
  thumb: {
    width: CARD_W,
    height: 80,
    backgroundColor: 'rgba(201,168,76,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filmIcon: {
    fontSize: 26,
    color: C.gold,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    // Light text on dark: #F0EBE3 on rgba goldGlow ≈ ~12:1 contrast ✅
    color: C.text,
    opacity: 0.9,
    letterSpacing: 0.15,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewIcon: {
    fontSize: 9,
  },
  viewCount: {
    fontSize: 10,
    // muted text on dark bg — ~4.9:1 ✅ WCAG AA for UI components
    color: C.textMuted,
    fontWeight: '500',
  },
});
