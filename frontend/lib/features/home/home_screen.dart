import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import 'friend_running_toast.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  final Set<String> _visibleFriendAlerts = {'a1', 'a2'};
  late AnimationController _blink;

  // 이번 주 러닝 데이터 (추후 API 연동)
  static const _weeklyKm = 18.4;
  static const _weeklyRuns = 3;
  static const _streakDays = 5;
  static const _weeklyGoalKm = 30.0;

  // 다가오는 마라톤 (추후 API 연동)
  static const _upcomingMarathons = <Map<String, dynamic>>[
    {
      'name': '서울 국제 마라톤',
      'date': '2026-04-05',
      'dday': 10,
      'distance': '풀마라톤',
      'location': '서울 광화문',
      'emoji': '🏙️',
    },
    {
      'name': '한강 봄 하프마라톤',
      'date': '2026-04-19',
      'dday': 24,
      'distance': '하프마라톤',
      'location': '서울 잠실',
      'emoji': '🌸',
    },
    {
      'name': '제주 국제 마라톤',
      'date': '2026-05-10',
      'dday': 45,
      'distance': '풀마라톤',
      'location': '제주 서귀포',
      'emoji': '🌊',
    },
  ];

  // 추천 코스
  static const _hotCourses = <Map<String, dynamic>>[
    {
      'icon': '🌙',
      'name': '한강 야경코스',
      'distance': '10.5km',
      'rating': '4.9',
      'tag': '야간추천',
      'tagColor': 0xFF5856D6,
    },
    {
      'icon': '⛰️',
      'name': '북한산 둘레길',
      'distance': '8.2km',
      'rating': '4.8',
      'tag': '트레일',
      'tagColor': 0xFF34C759,
    },
    {
      'icon': '🌸',
      'name': '전주 한옥마을',
      'distance': '6.5km',
      'rating': '4.7',
      'tag': '명소코스',
      'tagColor': 0xFFFF9500,
    },
    {
      'icon': '🗽',
      'name': 'NY 센트럴파크',
      'distance': '9.7km',
      'rating': '4.9',
      'tag': '해외이색',
      'tagColor': 0xFFFF2D55,
    },
  ];

  @override
  void initState() {
    super.initState();
    _blink =
        AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
          ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _blink.dispose();
    super.dispose();
  }

  void _demoFriendToast() {
    showFriendRunningToast(
      context,
      FriendRunning(
        name: '민준',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=minjun',
        courseName: '한강공원 뚝섬',
        distanceKm: 2.4,
      ),
    );
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  void _openRamiChat() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _RamiChatSheet(blink: _blink),
    );
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: ListView(
        padding: EdgeInsets.fromLTRB(0, topInset, 0, 100),
        children: [
          // ── 헤더 ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _greeting(),
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.muted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text.rich(
                        TextSpan(
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.6,
                          ),
                          children: const [
                            TextSpan(text: 'Run'),
                            TextSpan(
                              text: 'Mate',
                              style: TextStyle(color: AppColors.accent),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // 알림 버튼
                IconButton(
                  onPressed: _demoFriendToast,
                  icon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(Icons.notifications_outlined,
                          color: AppColors.textPrimary, size: 26),
                      Positioned(
                        top: -2,
                        right: -2,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.accent4,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // RAMI AI 코치
                GestureDetector(
                  onTap: _openRamiChat,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: AppColors.accent.withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        FadeTransition(
                          opacity: Tween(begin: 0.4, end: 1.0).animate(
                            CurvedAnimation(
                                parent: _blink, curve: Curves.easeInOut),
                          ),
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                                color: AppColors.accent,
                                shape: BoxShape.circle),
                          ),
                        ),
                        const SizedBox(width: 5),
                        const Text(
                          'AI 코치',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.accent),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── 이번 주 통계 카드 ──────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _WeeklyStatsCard(
              km: _weeklyKm,
              runs: _weeklyRuns,
              streak: _streakDays,
              goalKm: _weeklyGoalKm,
            ),
          ),

          const SizedBox(height: 16),

          // ── 달리기 시작 버튼 ───────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _StartRunButton(onTap: () => context.push('/run/active')),
          ),

          const SizedBox(height: 16),

          // ── 친구 러닝 알림 ─────────────────────────────────────
          if (_visibleFriendAlerts.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _SectionHeader(
                title: '👥 지금 달리는 친구',
                action: '전체보기',
                onAction: () => _toast('친구 전체 목록'),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  if (_visibleFriendAlerts.contains('a1'))
                    _FriendRunCard(
                      emoji: '🧑',
                      name: '민준',
                      course: '한강공원 뚝섬',
                      distanceKm: 2.4,
                      minutesAgo: 0,
                      onDismiss: () =>
                          setState(() => _visibleFriendAlerts.remove('a1')),
                      onJoin: () =>
                          _toast('🏃 민준과 함께 달리기 요청을 보냈어요!'),
                      onCheer: () => _toast('📣 민준에게 응원을 보냈어요!'),
                    ),
                  if (_visibleFriendAlerts.contains('a2')) ...[
                    const SizedBox(height: 8),
                    _FriendRunCard(
                      emoji: '👩',
                      name: '수진',
                      course: '북한산 둘레길',
                      distanceKm: 5.1,
                      minutesAgo: 3,
                      onDismiss: () =>
                          setState(() => _visibleFriendAlerts.remove('a2')),
                      onJoin: () =>
                          _toast('🏃 수진과 함께 달리기 요청을 보냈어요!'),
                      onCheer: () => _toast('📣 수진에게 응원을 보냈어요!'),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // ── 다가오는 마라톤 ────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _SectionHeader(
              title: '🏅 다가오는 마라톤',
              action: '전체보기',
              onAction: () => context.go('/marathons'),
            ),
          ),
          SizedBox(
            height: 130,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
              itemCount: _upcomingMarathons.length,
              itemBuilder: (_, i) {
                final m = _upcomingMarathons[i];
                return Padding(
                  padding: EdgeInsets.only(right: i < _upcomingMarathons.length - 1 ? 10 : 0),
                  child: _MarathonCard(
                    emoji: m['emoji'] as String,
                    name: m['name'] as String,
                    dday: m['dday'] as int,
                    distance: m['distance'] as String,
                    location: m['location'] as String,
                    onTap: () => context.go('/marathons'),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 16),

          // ── 추천 코스 ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _SectionHeader(
              title: '🗺️ 추천 코스',
              action: '지도보기',
              onAction: () => context.push('/run/active'),
            ),
          ),
          const SizedBox(height: 2),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.1,
            ),
            itemCount: _hotCourses.length,
            itemBuilder: (_, i) {
              final c = _hotCourses[i];
              return _CourseCard(
                icon: c['icon'] as String,
                name: c['name'] as String,
                distance: c['distance'] as String,
                rating: c['rating'] as String,
                tag: c['tag'] as String,
                tagColor: Color(c['tagColor'] as int),
                onTap: () => _toast('${c['name']} 코스 상세'),
              );
            },
          ),

          const SizedBox(height: 16),

          // ── RAMI AI 코치 제안 ──────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _RamiSuggestionCard(
              blink: _blink,
              onTap: _openRamiChat,
            ),
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 6) return '새벽 러닝 준비됐나요?';
    if (h < 12) return '좋은 아침이에요!';
    if (h < 18) return '오늘도 힘내요!';
    return '저녁 러닝 어때요?';
  }
}

// ── 이번 주 통계 카드 ─────────────────────────────────────────────────────
class _WeeklyStatsCard extends StatelessWidget {
  const _WeeklyStatsCard({
    required this.km,
    required this.runs,
    required this.streak,
    required this.goalKm,
  });

  final double km;
  final int runs;
  final int streak;
  final double goalKm;

  @override
  Widget build(BuildContext context) {
    final progress = (km / goalKm).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF007AFF).withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '이번 주 러닝',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('🔥', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 4),
                    Text(
                      '$streak일 연속',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                km.toStringAsFixed(1),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 42,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1.5,
                  height: 1,
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(bottom: 6, left: 4),
                child: Text(
                  'km',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              _MiniStat(value: '$runs회', label: '러닝'),
              const SizedBox(width: 20),
              _MiniStat(
                value: '5\'48"',
                label: '평균 페이스',
              ),
            ],
          ),
          const SizedBox(height: 14),
          // 목표 프로그레스
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '주간 목표 ${goalKm.toStringAsFixed(0)}km',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '${(progress * 100).toInt()}%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: Colors.white.withValues(alpha: 0.25),
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(Colors.white),
                  minHeight: 6,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

// ── 달리기 시작 버튼 ──────────────────────────────────────────────────────
class _StartRunButton extends StatelessWidget {
  const _StartRunButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: AppColors.textPrimary,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('🏃‍♂️', style: TextStyle(fontSize: 22)),
              SizedBox(width: 10),
              Text(
                '달리기 시작',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── 섹션 헤더 ─────────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  const _SectionHeader(
      {required this.title, required this.action, required this.onAction});

  final String title;
  final String action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w700)),
          GestureDetector(
            onTap: onAction,
            child: Text(
              action,
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.accent),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 친구 러닝 카드 ────────────────────────────────────────────────────────
class _FriendRunCard extends StatelessWidget {
  const _FriendRunCard({
    required this.emoji,
    required this.name,
    required this.course,
    required this.distanceKm,
    required this.minutesAgo,
    required this.onDismiss,
    required this.onJoin,
    required this.onCheer,
  });

  final String emoji;
  final String name;
  final String course;
  final double distanceKm;
  final int minutesAgo;
  final VoidCallback onDismiss;
  final VoidCallback onJoin;
  final VoidCallback onCheer;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border(
              left: const BorderSide(color: AppColors.accent, width: 3),
              top: BorderSide(color: AppColors.borderStrong),
              right: BorderSide(color: AppColors.borderStrong),
              bottom: BorderSide(color: AppColors.borderStrong),
            ),
          ),
          child: Row(
            children: [
              // 아바타
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.card2,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.accent, width: 2),
                    ),
                    child: Text(emoji,
                        style: const TextStyle(fontSize: 22)),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFF34C759),
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: AppColors.card, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              // 정보
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF34C759)
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            '러닝 중',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF34C759),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$course · ${distanceKm.toStringAsFixed(1)}km',
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.muted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      minutesAgo == 0 ? '방금 시작' : '$minutesAgo분 전 시작',
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.accent,
                          fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              // 버튼
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    height: 30,
                    child: FilledButton(
                      onPressed: onJoin,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        padding:
                            const EdgeInsets.symmetric(horizontal: 12),
                        textStyle: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w700),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('같이 달려'),
                    ),
                  ),
                  const SizedBox(height: 5),
                  SizedBox(
                    height: 26,
                    child: OutlinedButton(
                      onPressed: onCheer,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.muted,
                        padding:
                            const EdgeInsets.symmetric(horizontal: 10),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        textStyle: const TextStyle(fontSize: 11),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('응원 💪'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Positioned(
          top: 4,
          right: 4,
          child: IconButton(
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
            onPressed: onDismiss,
            icon: const Icon(Icons.close,
                size: 15, color: AppColors.muted2),
          ),
        ),
      ],
    );
  }
}

// ── 마라톤 카드 ───────────────────────────────────────────────────────────
class _MarathonCard extends StatelessWidget {
  const _MarathonCard({
    required this.emoji,
    required this.name,
    required this.dday,
    required this.distance,
    required this.location,
    required this.onTap,
  });

  final String emoji;
  final String name;
  final int dday;
  final String distance;
  final String location;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 170,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderStrong),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(emoji, style: const TextStyle(fontSize: 24)),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: dday <= 14
                        ? AppColors.accent4.withValues(alpha: 0.12)
                        : AppColors.accent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'D-$dday',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: dday <= 14
                          ? AppColors.accent4
                          : AppColors.accent,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              name,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            Text(
              '$distance · $location',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.muted,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ── 추천 코스 카드 ────────────────────────────────────────────────────────
class _CourseCard extends StatelessWidget {
  const _CourseCard({
    required this.icon,
    required this.name,
    required this.distance,
    required this.rating,
    required this.tag,
    required this.tagColor,
    required this.onTap,
  });

  final String icon;
  final String name;
  final String distance;
  final String rating;
  final String tag;
  final Color tagColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.card,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderStrong),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(icon, style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 8),
              Text(name,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700)),
              const SizedBox(height: 2),
              Row(
                children: [
                  Text(distance,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.muted)),
                  const SizedBox(width: 4),
                  const Text('·',
                      style:
                          TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(width: 4),
                  const Text('⭐',
                      style: TextStyle(fontSize: 10)),
                  const SizedBox(width: 2),
                  Text(rating,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.muted)),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: tagColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '# $tag',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: tagColor),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── RAMI AI 코치 제안 카드 ────────────────────────────────────────────────
class _RamiSuggestionCard extends StatelessWidget {
  const _RamiSuggestionCard(
      {required this.blink, required this.onTap});

  final AnimationController blink;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderStrong),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text('🤖', style: TextStyle(fontSize: 22)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'RAMI AI 코치',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(width: 6),
                      FadeTransition(
                        opacity: Tween(begin: 0.4, end: 1.0).animate(
                          CurvedAnimation(
                              parent: blink, curve: Curves.easeInOut),
                        ),
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                              color: Color(0xFF34C759),
                              shape: BoxShape.circle),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    '"오늘 한강 야경코스 어때요? 날씨도 좋고, 5km면 딱 이에요 🌙"',
                    style: TextStyle(
                        fontSize: 12,
                        color: AppColors.muted,
                        height: 1.4),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right,
                color: AppColors.muted2, size: 20),
          ],
        ),
      ),
    );
  }
}

// ── RAMI AI 코치 채팅 시트 ────────────────────────────────────────────────
class _RamiChatSheet extends StatefulWidget {
  const _RamiChatSheet({required this.blink});

  final AnimationController blink;

  @override
  State<_RamiChatSheet> createState() => _RamiChatSheetState();
}

class _RamiChatSheetState extends State<_RamiChatSheet> {
  final _controller = TextEditingController();
  final List<_ChatMsg> _messages = [
    _ChatMsg(
      isRami: true,
      text: '안녕! 나는 RAMI야 🏃‍♂️\n오늘 어떤 러닝 도움이 필요해?',
    ),
  ];

  static const _suggestions = [
    '오늘 코스 추천해줘',
    '다음 마라톤 알려줘',
    '이번 주 훈련 계획 짜줘',
    '러닝화 추천',
  ];

  void _send(String text) {
    if (text.trim().isEmpty) return;
    setState(() {
      _messages.add(_ChatMsg(isRami: false, text: text));
      _controller.clear();
    });
    // 더미 응답 (추후 API 연동)
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() {
          _messages.add(_ChatMsg(
            isRami: true,
            text: _getResponse(text),
          ));
        });
      }
    });
  }

  String _getResponse(String input) {
    if (input.contains('코스')) {
      return '오늘 한강 야경코스 어때요? 10.5km, 평탄하고 야경이 끝내줘요 🌙\n지금 친구 민준도 뚝섬에 있어요!';
    }
    if (input.contains('마라톤')) {
      return '다음 대회는 서울 국제 마라톤! D-10이에요 🏅\n신청 마감 3일 남았으니 서두르세요!';
    }
    if (input.contains('훈련') || input.contains('계획')) {
      return '이번 주 목표 30km 중 18.4km 완료! 💪\n화요일 인터벌 5km + 목요일 LSD 7km 추천해요.';
    }
    if (input.contains('러닝화') || input.contains('신발')) {
      return '발볼 넓이랑 주 용도가 어떻게 되세요?\n로드용이면 나이키 페가수스, 트레일이면 살로몬 추천해요 👟';
    }
    return '알겠어요! 더 자세히 알려주면 더 잘 도와줄 수 있어요 😊';
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.background2,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // 핸들
              const SizedBox(height: 10),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderStrong,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              // 헤더
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('🤖',
                          style: TextStyle(fontSize: 20)),
                    ),
                    const SizedBox(width: 10),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('RAMI AI 코치',
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800)),
                        Text(
                          'RunMate 전문 AI 러닝 파트너',
                          style: TextStyle(
                              fontSize: 11, color: AppColors.muted),
                        ),
                      ],
                    ),
                    const Spacer(),
                    FadeTransition(
                      opacity: Tween(begin: 0.4, end: 1.0).animate(
                        CurvedAnimation(
                            parent: widget.blink,
                            curve: Curves.easeInOut),
                      ),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF34C759)
                              .withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          '온라인',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF34C759),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 24),
              // 채팅 메시지
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _messages.length,
                  itemBuilder: (_, i) {
                    final msg = _messages[i];
                    return _ChatBubble(msg: msg);
                  },
                ),
              ),
              // 빠른 제안
              if (_messages.length <= 1)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: _suggestions
                        .map((s) => GestureDetector(
                              onTap: () => _send(s),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 7),
                                decoration: BoxDecoration(
                                  color: AppColors.card2,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                      color: AppColors.borderStrong),
                                ),
                                child: Text(
                                  s,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                ),
              // 입력창
              Padding(
                padding: EdgeInsets.fromLTRB(
                    16,
                    8,
                    16,
                    MediaQuery.viewInsetsOf(context).bottom + 16),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        decoration: InputDecoration(
                          hintText: 'RAMI에게 물어보세요...',
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24)),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide(
                                color: AppColors.borderStrong),
                          ),
                        ),
                        onSubmitted: _send,
                        textInputAction: TextInputAction.send,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        onPressed: () => _send(_controller.text),
                        icon: const Icon(Icons.send_rounded,
                            color: Colors.white, size: 18),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ChatMsg {
  _ChatMsg({required this.isRami, required this.text});

  final bool isRami;
  final String text;
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.msg});

  final _ChatMsg msg;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment:
            msg.isRami ? MainAxisAlignment.start : MainAxisAlignment.end,
        children: [
          if (msg.isRami) ...[
            Container(
              width: 30,
              height: 30,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child:
                  const Text('🤖', style: TextStyle(fontSize: 14)),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: msg.isRami ? AppColors.card2 : AppColors.accent,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(msg.isRami ? 4 : 16),
                  bottomRight: Radius.circular(msg.isRami ? 16 : 4),
                ),
              ),
              child: Text(
                msg.text,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  color: msg.isRami
                      ? AppColors.textPrimary
                      : Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
