import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, ax, SEASON } from '../theme/season';

export default function FriendCard({
  emoji,
  name,
  course,
  km,
  minAgo,
  cheered,
  onDismiss,
  onJoin,
  onCheer,
  joinState = 'idle',
}) {
  const joinLabel = joinState === 'sending'
    ? '요청 중...'
    : joinState === 'sent'
      ? '초대 보냄'
      : joinState === 'accepted'
        ? '합류 완료'
        : '같이 달려';
  return (
    <View style={s.friendCard}>
      <View style={s.friendAvatar}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
        <View style={s.friendOnline} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.friendName}>{name}</Text>
          <View style={s.runningBadge}>
            <Text style={s.runningBadgeTxt}>러닝 중</Text>
          </View>
        </View>
        <Text style={s.friendSub}>
          {course} · {km.toFixed(1)}km
        </Text>
        <Text style={s.friendTime}>{minAgo === 0 ? '방금 시작' : `${minAgo}분 전 시작`}</Text>
      </View>
      <View style={{ gap: 6 }}>
        <TouchableOpacity
          style={[s.joinBtn, joinState !== 'idle' && s.joinBtnDisabled]}
          onPress={onJoin}
          disabled={joinState !== 'idle'}
        >
          <Text style={s.joinBtnTxt}>{joinLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cheerBtn} onPress={onCheer}>
          <Text style={s.cheerBtnTxt}>
            {cheered ? '응원됨 ✓' : SEASON === 'spring' ? '응원 🌸' : '응원 💪'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={s.dismissBtn} onPress={onDismiss}>
        <Text style={{ color: C.textSub, fontSize: 16, lineHeight: 16 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ax(0.15),
    position: 'relative',
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceL2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.accent,
  },
  friendOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: C.success,
    borderWidth: 2,
    borderColor: C.surface,
  },
  friendName: { color: C.text, fontSize: 14, fontWeight: '700' },
  friendSub: { color: C.textSub, fontSize: 12, marginTop: 1 },
  friendTime: { color: C.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },
  runningBadge: {
    backgroundColor: 'rgba(125,211,168,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  runningBadgeTxt: { color: C.success, fontSize: 10, fontWeight: '700' },
  joinBtn: { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  joinBtnDisabled: { opacity: 0.7 },
  joinBtnTxt: { color: C.onAccent, fontSize: 12, fontWeight: '800' },
  cheerBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  cheerBtnTxt: { color: C.textSub, fontSize: 11, fontWeight: '600' },
  dismissBtn: { position: 'absolute', top: 8, right: 10, padding: 4 },
});
