import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  PenLine,
  ImagePlus,
  Video as VideoIcon,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { SCREEN_W } from '../constants/layout';
import { hydrateFeedPosts } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { saveFeedPosts } from '../storage/appStorage';
import { C, ax } from '../theme/season';

const MAX_MEDIA_COUNT = 8;
const MAX_VIDEO_SECONDS = 30;
const DEFAULT_STAMP_TIME = '00:00';
const DEFAULT_STAMP_PACE = `--'--"`;
const STAMP_POSITIONS = [
  { id: 'bl', label: '좌하단' },
  { id: 'br', label: '우하단' },
  { id: 'tl', label: '좌상단' },
  { id: 'tr', label: '우상단' },
];
const STAMP_THEMES = [
  { id: 'dark', label: '다크', bg: 'rgba(28,22,25,0.82)', border: ax(0.35), title: C.accent, text: '#F8F5F6' },
  { id: 'light', label: '라이트', bg: 'rgba(255,245,250,0.85)', border: 'rgba(255,255,255,0.9)', title: '#C54D75', text: '#2D1B24' },
  { id: 'mint', label: '민트', bg: 'rgba(125,211,168,0.22)', border: 'rgba(125,211,168,0.45)', title: '#1B6B52', text: C.text },
  { id: 'violet', label: '바이올렛', bg: 'rgba(201,184,232,0.28)', border: 'rgba(201,184,232,0.55)', title: '#5C4580', text: C.text },
];

function normalizeHex(input, fallback) {
  const raw = (input || '').trim();
  if (!raw) return fallback;
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  const ok = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(withHash);
  return ok ? withHash : fallback;
}

function getStampPositionStyle(positionId) {
  if (positionId === 'br') return { right: 10, bottom: 10 };
  if (positionId === 'tl') return { left: 10, top: 10 };
  if (positionId === 'tr') return { right: 10, top: 10 };
  return { left: 10, bottom: 10 };
}

const POSTS_SEED = [
  {
    id: '1',
    user: '러닝매니아',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    km: '10.2',
    images: [
      'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800',
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
    ],
    content: '오늘 10km 완주! 날씨도 딱이고 상쾌하네요 🌿',
    likes: 47,
    liked: false,
  },
  {
    id: '2',
    user: '마라톤꿈나무',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    km: '5.8',
    images: ['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800'],
    content: '새 신발 사고 첫 러닝 🏃‍♂️ 발이 너무 편해요!',
    likes: 23,
    liked: false,
  },
  {
    id: '3',
    user: '시티런너',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
    km: '7.4',
    images: [
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
      'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800',
    ],
    content: '한강 야간 러닝 코스 추천! 야경이 진짜 예뻐요 ✨',
    likes: 88,
    liked: false,
  },
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const meProfile = useMemo(
    () => ({
      user: user?.name || '러너',
      avatar:
        user?.picture ||
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100',
    }),
    [user]
  );
  const [posts, setPosts] = useState(POSTS_SEED);
  const [feedHydrated, setFeedHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hydrateFeedPosts(POSTS_SEED).then((p) => {
      if (!cancelled) {
        setPosts(p);
        setFeedHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!feedHydrated) return;
    const t = setTimeout(() => {
      void saveFeedPosts(posts);
    }, 400);
    return () => clearTimeout(t);
  }, [posts, feedHydrated]);
  const [saved, setSaved] = useState(new Set());
  const [page, setPage] = useState({});
  const [composeOpen, setComposeOpen] = useState(false);
  const [draftBody, setDraftBody] = useState('');
  const [draftKm, setDraftKm] = useState('');
  const [draftMedia, setDraftMedia] = useState([]);
  const [stampEnabled, setStampEnabled] = useState(true);
  const [stampDistance, setStampDistance] = useState('');
  const [stampTime, setStampTime] = useState(DEFAULT_STAMP_TIME);
  const [stampPace, setStampPace] = useState(DEFAULT_STAMP_PACE);
  const [stampPosition, setStampPosition] = useState('bl');
  const [stampTheme, setStampTheme] = useState('dark');
  const [customBg, setCustomBg] = useState('#251D2B');
  const [customBorder, setCustomBorder] = useState('#F5A3B8AA');
  const [customTitle, setCustomTitle] = useState('#F5A3B8');
  const [customText, setCustomText] = useState('#F8F0F3');
  const [actionPost, setActionPost] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);

  const openCompose = () => {
    setDraftBody('');
    setDraftKm('');
    setDraftMedia([]);
    setStampEnabled(true);
    setStampDistance('');
    setStampTime(DEFAULT_STAMP_TIME);
    setStampPace(DEFAULT_STAMP_PACE);
    setStampPosition('bl');
    setStampTheme('dark');
    setEditTargetId(null);
    setComposeOpen(true);
  };

  const openEditCompose = (post) => {
    setDraftBody(post.content || '');
    setDraftKm(post.km === '-' ? '' : String(post.km || ''));
    setDraftMedia(post.media || (post.images || []).map((uri) => ({ uri, type: 'image' })));
    setStampEnabled(!!post.stamp);
    setStampDistance(post.stamp?.distance ? String(post.stamp.distance) : '');
    setStampTime(post.stamp?.time || DEFAULT_STAMP_TIME);
    setStampPace(post.stamp?.pace || DEFAULT_STAMP_PACE);
    setStampPosition(post.stamp?.position || 'bl');
    setStampTheme(post.stamp?.theme || 'dark');
    setCustomBg(post.stamp?.customStyle?.bg || '#251D2B');
    setCustomBorder(post.stamp?.customStyle?.border || '#F5A3B8AA');
    setCustomTitle(post.stamp?.customStyle?.title || '#F5A3B8');
    setCustomText(post.stamp?.customStyle?.text || '#F8F0F3');
    setEditTargetId(post.id);
    setComposeOpen(true);
  };

  const applyMediaAssets = (assets) => {
    const normalized = assets.map((a) => ({
      uri: a.uri,
      type: a.type === 'video' ? 'video' : 'image',
      duration: a.duration ?? null,
    }));

    const valid = normalized.filter((m) => {
      if (m.type !== 'video') return true;
      if (!m.duration) return true;
      const sec = Math.ceil(m.duration / 1000);
      if (sec <= MAX_VIDEO_SECONDS) return true;
      return false;
    });

    const rejectedCount = normalized.length - valid.length;
    if (rejectedCount > 0) {
      Alert.alert(
        '동영상 길이 제한',
        `동영상은 ${MAX_VIDEO_SECONDS}초 이하만 업로드할 수 있어요.`
      );
    }

    setDraftMedia((prev) => {
      const remain = MAX_MEDIA_COUNT - prev.length;
      const next = [...prev, ...valid.slice(0, Math.max(remain, 0))];
      return next.slice(0, MAX_MEDIA_COUNT);
    });
  };

  const pickMedia = async (mode) => {
    if (draftMedia.length >= MAX_MEDIA_COUNT) {
      Alert.alert('업로드 제한', `미디어는 최대 ${MAX_MEDIA_COUNT}개까지 올릴 수 있어요.`);
      return;
    }

    const mediaTypes =
      mode === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (result.canceled) return;
    applyMediaAssets(result.assets);
  };

  const captureMedia = async (mode) => {
    if (draftMedia.length >= MAX_MEDIA_COUNT) {
      Alert.alert('업로드 제한', `미디어는 최대 ${MAX_MEDIA_COUNT}개까지 올릴 수 있어요.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('카메라 권한 필요', '사진/동영상 촬영을 위해 카메라 권한을 허용해 주세요.');
      return;
    }

    const mediaTypes =
      mode === 'image'
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes,
      quality: 0.8,
      videoMaxDuration: MAX_VIDEO_SECONDS,
    });

    if (result.canceled) return;
    applyMediaAssets(result.assets);
  };

  const submitPost = () => {
    const body = draftBody.trim();
    if (!body && draftMedia.length === 0) return;
    const kmRaw = draftKm.trim().replace(/km/gi, '').trim();
    const stampDistanceValue = stampDistance.trim() || kmRaw || '-';
    const resolvedCustomStyle = {
      bg: normalizeHex(customBg, '#251D2B'),
      border: normalizeHex(customBorder, '#F5A3B8AA'),
      title: normalizeHex(customTitle, '#F5A3B8'),
      text: normalizeHex(customText, '#F8F0F3'),
    };

    const newPost = {
      id: editTargetId || `u-${Date.now()}`,
      user: meProfile.user,
      avatar: meProfile.avatar,
      km: kmRaw || '-',
      media: draftMedia,
      content: body,
      likes: 0,
      liked: false,
      stamp: stampEnabled
        ? {
            distance: stampDistanceValue,
            time: stampTime.trim() || DEFAULT_STAMP_TIME,
            pace: stampPace.trim() || DEFAULT_STAMP_PACE,
            position: stampPosition,
            theme: stampTheme,
            customStyle: stampTheme === 'custom' ? resolvedCustomStyle : null,
          }
        : null,
    };
    if (editTargetId) {
      setPosts((p) => p.map((x) => (x.id === editTargetId ? { ...x, ...newPost } : x)));
    } else {
      setPosts((p) => [newPost, ...p]);
    }
    setComposeOpen(false);
    setDraftBody('');
    setDraftKm('');
    setDraftMedia([]);
    setStampEnabled(true);
    setStampDistance('');
    setStampTime(DEFAULT_STAMP_TIME);
    setStampPace(DEFAULT_STAMP_PACE);
    setStampPosition('bl');
    setStampTheme('dark');
    setCustomBg('#251D2B');
    setCustomBorder('#F5A3B8AA');
    setCustomTitle('#F5A3B8');
    setCustomText('#F8F0F3');
    setEditTargetId(null);
  };

  const toggleLike = (id) =>
    setPosts((p) =>
      p.map((x) =>
        x.id === id ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 } : x
      )
    );
  const toggleSave = (id) =>
    setSaved((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const deletePost = (id) => {
    setPosts((p) => p.filter((x) => x.id !== id));
    setActionPost(null);
  };

  const selectedStampTheme = STAMP_THEMES.find((t) => t.id === stampTheme) || STAMP_THEMES[0];
  const selectedStampPosStyle = getStampPositionStyle(stampPosition);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[fs.headerBox, { paddingTop: insets.top + 10 }]}>
        <Text style={fs.headerTitle}>피드</Text>
        <TouchableOpacity style={fs.writeBtn} onPress={openCompose} accessibilityLabel="글쓰기">
          <PenLine size={18} color={C.onAccent} strokeWidth={2.2} />
          <Text style={fs.writeBtnTxt}>글쓰기</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const stampThemeObj =
            item.stamp?.theme === 'custom' && item.stamp?.customStyle
              ? { ...item.stamp.customStyle }
              : STAMP_THEMES.find((t) => t.id === item.stamp?.theme) || STAMP_THEMES[0];
          const stampPosStyle = getStampPositionStyle(item.stamp?.position);
          return (
          <View style={fs.postCard}>
            <View style={fs.userRow}>
              <View style={fs.avatarRing}>
                <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={fs.userName}>{item.user}</Text>
                <Text style={fs.userSub}>
                  {item.km === '-' ? '거리 미입력 · 오늘' : `${item.km}km · 오늘`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActionPost(item)}>
                <MoreHorizontal size={20} color={C.textSub} />
              </TouchableOpacity>
            </View>
            {(item.media || item.images?.map((uri) => ({ uri, type: 'image' })))?.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) =>
                    setPage((p) => ({
                      ...p,
                      [item.id]: Math.round(e.nativeEvent.contentOffset.x / SCREEN_W),
                    }))
                  }
                  scrollEventThrottle={16}
                >
                  {(item.media || item.images.map((uri) => ({ uri, type: 'image' }))).map((m, i) => (
                    <View key={`${item.id}-${m.type}-${i}`} style={fs.mediaSlide}>
                      {m.type === 'video' ? (
                        <Video
                          source={{ uri: m.uri }}
                          style={{ width: SCREEN_W, height: SCREEN_W * 0.78 }}
                          resizeMode={ResizeMode.COVER}
                          useNativeControls
                          isLooping
                        />
                      ) : (
                        <Image
                          source={{ uri: m.uri }}
                          style={{ width: SCREEN_W, height: SCREEN_W * 0.78 }}
                          resizeMode="cover"
                        />
                      )}
                      {item.stamp ? (
                        <View
                          style={[
                            fs.recordStamp,
                            stampPosStyle,
                            { backgroundColor: stampThemeObj.bg, borderColor: stampThemeObj.border },
                          ]}
                        >
                          <Text style={[fs.recordStampTitle, { color: stampThemeObj.title }]}>RUN RECORD</Text>
                          <Text style={[fs.recordStampLine, { color: stampThemeObj.text }]}>
                            거리 {item.stamp.distance}km
                          </Text>
                          <Text style={[fs.recordStampLine, { color: stampThemeObj.text }]}>
                            시간 {item.stamp.time}
                          </Text>
                          <Text style={[fs.recordStampLine, { color: stampThemeObj.text }]}>
                            페이스 {item.stamp.pace}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
                {(item.media || item.images.map((uri) => ({ uri, type: 'image' }))).length > 1 && (
                  <View style={fs.dotRow}>
                    {(item.media || item.images.map((uri) => ({ uri, type: 'image' }))).map((_, i) => (
                      <View key={i} style={[fs.dot, i === (page[item.id] || 0) && fs.dotOn]} />
                    ))}
                  </View>
                )}
              </>
            ) : null}
            <View style={fs.actionBar}>
              <TouchableOpacity style={{ marginRight: 16 }} onPress={() => toggleLike(item.id)}>
                <Heart
                  size={24}
                  color={item.liked ? C.danger : C.text}
                  fill={item.liked ? C.danger : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 16 }}>
                <MessageCircle size={24} color={C.text} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Share2 size={24} color={C.text} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => toggleSave(item.id)}>
                <Bookmark
                  size={24}
                  color={saved.has(item.id) ? C.accent : C.text}
                  fill={saved.has(item.id) ? C.accent : 'transparent'}
                />
              </TouchableOpacity>
            </View>
            <Text style={fs.likesCount}>좋아요 {item.likes}개</Text>
            {item.content ? (
              <Text style={fs.caption}>
                <Text style={{ fontWeight: '700' }}>{item.user} </Text>
                {item.content}
              </Text>
            ) : null}
            <Text style={fs.commentPreview}>댓글 3개 모두 보기</Text>
          </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
      />

      <Modal
        visible={composeOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setComposeOpen(false)}
      >
        <KeyboardAvoidingView
          style={fs.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={fs.modalBackdrop} onPress={() => setComposeOpen(false)} />
          <View style={[fs.composeSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={fs.composeHeader}>
              <Text style={fs.composeTitle}>{editTargetId ? '게시글 수정' : '새 글'}</Text>
              <TouchableOpacity onPress={() => setComposeOpen(false)} hitSlop={10}>
                <Text style={fs.composeClose}>닫기</Text>
              </TouchableOpacity>
            </View>
            <Text style={fs.composeLabel}>오늘 러닝 이야기를 남겨보세요</Text>
            <TextInput
              style={fs.composeInput}
              placeholder="무슨 러닝을 했나요? 기분, 코스, 페이스…"
              placeholderTextColor={C.textSub}
              value={draftBody}
              onChangeText={setDraftBody}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />

            <View style={fs.mediaBtnRow}>
              <TouchableOpacity style={fs.mediaBtn} onPress={() => void pickMedia('image')}>
                <ImagePlus size={16} color={C.text} />
                <Text style={fs.mediaBtnTxt}>사진</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fs.mediaBtn} onPress={() => void pickMedia('video')}>
                <VideoIcon size={16} color={C.text} />
                <Text style={fs.mediaBtnTxt}>동영상</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fs.mediaBtn} onPress={() => void captureMedia('image')}>
                <ImagePlus size={16} color={C.text} />
                <Text style={fs.mediaBtnTxt}>사진촬영</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fs.mediaBtn} onPress={() => void captureMedia('video')}>
                <VideoIcon size={16} color={C.text} />
                <Text style={fs.mediaBtnTxt}>영상촬영</Text>
              </TouchableOpacity>
            </View>
            <Text style={fs.mediaLimitText}>
              미디어 {draftMedia.length}/{MAX_MEDIA_COUNT} · 동영상 최대 {MAX_VIDEO_SECONDS}초
            </Text>

            {draftMedia.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={fs.previewRow}
                contentContainerStyle={{ gap: 8 }}
              >
                {draftMedia.map((m, i) => (
                  <View key={`draft-${i}`} style={fs.previewWrap}>
                    {m.type === 'video' ? (
                      <Video
                        source={{ uri: m.uri }}
                        style={fs.previewMedia}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted
                      />
                    ) : (
                      <Image source={{ uri: m.uri }} style={fs.previewMedia} resizeMode="cover" />
                    )}
                    {stampEnabled ? (
                      <View
                        style={[
                          fs.previewStamp,
                          selectedStampPosStyle,
                          { backgroundColor: selectedStampTheme.bg, borderColor: selectedStampTheme.border },
                        ]}
                      >
                        <Text style={[fs.previewStampTxt, { color: selectedStampTheme.text }]}>
                          {stampDistance || draftKm || '-'}km · {stampTime} · {stampPace}
                        </Text>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={fs.removeMediaBtn}
                      onPress={() => setDraftMedia((p) => p.filter((_, idx) => idx !== i))}
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            <Text style={fs.composeLabel}>거리 (선택)</Text>
            <TextInput
              style={fs.composeKm}
              placeholder="예: 5.2"
              placeholderTextColor={C.textSub}
              value={draftKm}
              onChangeText={(v) => {
                setDraftKm(v);
                if (!stampDistance.trim()) setStampDistance(v.replace(/km/gi, '').trim());
              }}
              keyboardType="decimal-pad"
            />
            <View style={fs.stampHeadRow}>
              <Text style={fs.composeLabel}>러닝기록 스탬프</Text>
              <TouchableOpacity
                style={[fs.stampToggle, stampEnabled && fs.stampToggleOn]}
                onPress={() => setStampEnabled((v) => !v)}
              >
                <Text style={fs.stampToggleTxt}>{stampEnabled ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            </View>
            {stampEnabled ? (
              <View style={fs.stampEditorBox}>
                <View style={fs.stampInputRow}>
                  <TextInput
                    style={fs.stampInput}
                    placeholder="거리 km"
                    placeholderTextColor={C.textSub}
                    value={stampDistance}
                    onChangeText={setStampDistance}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={fs.stampInput}
                    placeholder="시간 00:00"
                    placeholderTextColor={C.textSub}
                    value={stampTime}
                    onChangeText={setStampTime}
                  />
                </View>
                <TextInput
                  style={fs.stampInput}
                  placeholder={`페이스 ${DEFAULT_STAMP_PACE}`}
                  placeholderTextColor={C.textSub}
                  value={stampPace}
                  onChangeText={setStampPace}
                />
                <Text style={fs.stampSubLabel}>위치</Text>
                <View style={fs.stampOptionRow}>
                  {STAMP_POSITIONS.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[fs.stampChip, stampPosition === p.id && fs.stampChipOn]}
                      onPress={() => setStampPosition(p.id)}
                    >
                      <Text style={[fs.stampChipTxt, stampPosition === p.id && fs.stampChipTxtOn]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={fs.stampSubLabel}>색상</Text>
                <View style={fs.stampOptionRow}>
                  {[...STAMP_THEMES, { id: 'custom', label: '커스텀' }].map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[fs.stampThemeChip, stampTheme === t.id && fs.stampChipOn]}
                      onPress={() => setStampTheme(t.id)}
                    >
                      <View
                        style={[
                          fs.stampThemeSwatch,
                          {
                            backgroundColor:
                              t.id === 'custom' ? normalizeHex(customBg, '#251D2B') : t.bg,
                            borderColor:
                              t.id === 'custom'
                                ? normalizeHex(customBorder, '#F5A3B8AA')
                                : t.border,
                          },
                        ]}
                      />
                      <Text style={[fs.stampChipTxt, stampTheme === t.id && fs.stampChipTxtOn]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {stampTheme === 'custom' ? (
                  <View style={fs.customEditor}>
                    <Text style={fs.stampSubLabel}>커스텀 색상 (HEX)</Text>
                    <View style={fs.stampInputRow}>
                      <TextInput
                        style={fs.stampInput}
                        value={customBg}
                        onChangeText={setCustomBg}
                        placeholder="#251D2B"
                        placeholderTextColor={C.textSub}
                      />
                      <TextInput
                        style={fs.stampInput}
                        value={customBorder}
                        onChangeText={setCustomBorder}
                        placeholder="#F5A3B8AA"
                        placeholderTextColor={C.textSub}
                      />
                    </View>
                    <View style={fs.stampInputRow}>
                      <TextInput
                        style={fs.stampInput}
                        value={customTitle}
                        onChangeText={setCustomTitle}
                        placeholder="#F5A3B8"
                        placeholderTextColor={C.textSub}
                      />
                      <TextInput
                        style={fs.stampInput}
                        value={customText}
                        onChangeText={setCustomText}
                        placeholder="#F8F0F3"
                        placeholderTextColor={C.textSub}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
            <TouchableOpacity
              style={[
                fs.composeSubmit,
                !draftBody.trim() && draftMedia.length === 0 && fs.composeSubmitDisabled,
              ]}
              onPress={submitPost}
              disabled={!draftBody.trim() && draftMedia.length === 0}
            >
              <Text style={fs.composeSubmitTxt}>{editTargetId ? '수정 저장' : '게시하기'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!actionPost}
        transparent
        animationType="fade"
        onRequestClose={() => setActionPost(null)}
      >
        <Pressable style={fs.actionBackdrop} onPress={() => setActionPost(null)} />
        <View style={fs.actionSheet}>
          <Text style={fs.actionTitle}>게시글 옵션</Text>
          {actionPost?.user === meProfile.user ? (
            <>
              <TouchableOpacity
                style={fs.actionBtn}
                onPress={() => {
                  const target = actionPost;
                  setActionPost(null);
                  openEditCompose(target);
                }}
              >
                <Text style={fs.actionBtnTxt}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={fs.actionBtn}
                onPress={() => deletePost(actionPost.id)}
              >
                <Text style={[fs.actionBtnTxt, { color: C.danger }]}>삭제</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={fs.actionBtn} onPress={() => setActionPost(null)}>
              <Text style={fs.actionBtnTxt}>닫기</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
}

const fs = StyleSheet.create({
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: C.bg,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ax(0.35),
  },
  writeBtnTxt: { color: C.onAccent, fontSize: 13, fontWeight: '800' },
  postCard: { backgroundColor: C.surface, paddingBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.accent,
    overflow: 'hidden',
    marginRight: 10,
  },
  userName: { fontSize: 14, fontWeight: '700', color: C.text },
  userSub: { fontSize: 11, color: C.textSub, marginTop: 1 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: -14, marginBottom: 6, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  dotOn: { width: 8, backgroundColor: C.accent },
  mediaSlide: { width: SCREEN_W, height: SCREEN_W * 0.78 },
  recordStamp: {
    position: 'absolute',
    backgroundColor: 'rgba(28,22,25,0.82)',
    borderWidth: 1,
    borderColor: ax(0.35),
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  recordStampTitle: {
    color: C.accent,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  recordStampLine: { color: C.text, fontSize: 10, fontWeight: '700' },
  actionBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  likesCount: { paddingHorizontal: 12, fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  caption: { paddingHorizontal: 12, fontSize: 13, color: C.text, lineHeight: 18 },
  commentPreview: { paddingHorizontal: 12, paddingTop: 4, fontSize: 12, color: C.textSub },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  composeSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  composeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  composeTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  composeClose: { color: C.textSub, fontSize: 15, fontWeight: '600' },
  composeLabel: { color: C.textSub, fontSize: 12, marginBottom: 6, fontWeight: '600' },
  composeInput: {
    minHeight: 96,
    maxHeight: 220,
    backgroundColor: C.surfaceL2,
    borderRadius: 12,
    padding: 12,
    color: C.text,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },
  mediaBtnRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceL2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediaBtnTxt: { color: C.text, fontSize: 12, fontWeight: '700' },
  mediaLimitText: { color: C.textSub, fontSize: 11, marginBottom: 8 },
  previewRow: { marginBottom: 12, maxHeight: 86 },
  previewWrap: { width: 86, height: 86, borderRadius: 10, overflow: 'hidden' },
  previewMedia: { width: '100%', height: '100%' },
  previewStamp: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    maxWidth: '94%',
  },
  previewStampTxt: { color: C.text, fontSize: 8, fontWeight: '700' },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeKm: {
    height: 44,
    backgroundColor: C.surfaceL2,
    borderRadius: 20,
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  stampHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stampToggle: {
    backgroundColor: C.surfaceL2,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 6,
  },
  stampToggleOn: { backgroundColor: ax(0.2), borderColor: ax(0.4) },
  stampToggleTxt: { color: C.text, fontSize: 11, fontWeight: '800' },
  stampEditorBox: {
    backgroundColor: C.surfaceL2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  stampInputRow: { flexDirection: 'row', gap: 8 },
  stampInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    color: C.text,
    backgroundColor: 'rgba(255,255,255,0.04)',
    fontSize: 13,
  },
  stampSubLabel: { color: C.textSub, fontSize: 11, fontWeight: '700' },
  stampOptionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stampChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  stampChipOn: { borderColor: C.accent, backgroundColor: ax(0.18) },
  stampChipTxt: { color: C.textSub, fontSize: 11, fontWeight: '700' },
  stampChipTxtOn: { color: C.text },
  stampThemeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  stampThemeSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  customEditor: { gap: 8, marginTop: 4 },
  actionBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  actionSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 10,
  },
  actionTitle: {
    color: C.textSub,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  actionBtn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionBtnTxt: { color: C.text, fontSize: 15, fontWeight: '700' },
  composeSubmit: {
    height: 50,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeSubmitDisabled: { opacity: 0.45 },
  composeSubmitTxt: { color: C.onAccent, fontSize: 16, fontWeight: '800' },
});
