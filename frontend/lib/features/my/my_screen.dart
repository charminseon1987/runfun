import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';

class MyScreen extends ConsumerWidget {
  const MyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── 프로필 헤더 ───────────────────────────────────────
          SliverToBoxAdapter(
            child: _ProfileHeader(),
          ),
          // ── 올해 러닝 총계 ─────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: _YearlyStats(),
            ),
          ),
          // ── 최근 러닝 기록 ─────────────────────────────────────
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: Text(
                '최근 러닝',
                style:
                    TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) {
                final runs = _recentRuns;
                return Padding(
                  padding:
                      const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: _RunHistoryCard(run: runs[i]),
                );
              },
              childCount: _recentRuns.length,
            ),
          ),
          // ── 획득한 스탬프 미리보기 ─────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('획득한 스탬프',
                      style: TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w700)),
                  GestureDetector(
                    onTap: () {},
                    child: const Text(
                      '전체보기',
                      style: TextStyle(
                          fontSize: 12,
                          color: AppColors.accent,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                itemCount: _stampPreviews.length,
                itemBuilder: (_, i) {
                  final s = _stampPreviews[i];
                  return Padding(
                    padding: EdgeInsets.only(
                        right: i < _stampPreviews.length - 1 ? 10 : 0),
                    child: _StampChip(
                      emoji: s['emoji'] as String,
                      name: s['name'] as String,
                      rarity: s['rarity'] as String,
                    ),
                  );
                },
              ),
            ),
          ),
          // ── 메뉴 ──────────────────────────────────────────────
          const SliverToBoxAdapter(child: SizedBox(height: 16)),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _MenuSection(ref: ref),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  static const _recentRuns = <Map<String, dynamic>>[
    {
      'date': '오늘',
      'course': '한강공원 뚝섬',
      'distanceKm': 7.2,
      'pace': "5'38\"",
      'duration': '40:35',
      'kcal': 412,
      'emoji': '🌙',
    },
    {
      'date': '어제',
      'course': '북한산 둘레길',
      'distanceKm': 5.8,
      'pace': "6'12\"",
      'duration': '35:58',
      'kcal': 334,
      'emoji': '⛰️',
    },
    {
      'date': '3일 전',
      'course': '올림픽공원',
      'distanceKm': 5.4,
      'pace': "5'52\"",
      'duration': '31:42',
      'kcal': 308,
      'emoji': '🌿',
    },
  ];

  static const _stampPreviews = <Map<String, dynamic>>[
    {'emoji': '🌉', 'name': '한강 야경', 'rarity': '골드'},
    {'emoji': '⛰️', 'name': '북한산', 'rarity': '실버'},
    {'emoji': '🌸', 'name': '봄꽃 코스', 'rarity': '스페셜'},
    {'emoji': '🌊', 'name': '해안 런', 'rarity': '브론즈'},
    {'emoji': '🏙️', 'name': '도심 새벽', 'rarity': '에픽'},
  ];
}

// ── 프로필 헤더 ───────────────────────────────────────────────────────────
class _ProfileHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    return Container(
      padding: EdgeInsets.fromLTRB(20, topInset + 16, 20, 20),
      color: AppColors.background2,
      child: Column(
        children: [
          Row(
            children: [
              // 아바타
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF007AFF), Color(0xFF5856D6)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Text('🏃',
                        style: TextStyle(fontSize: 34)),
                  ),
                  Positioned(
                    bottom: 2,
                    right: 2,
                    child: Container(
                      width: 20,
                      height: 20,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppColors.background2,
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: AppColors.background2, width: 2),
                      ),
                      child: const Text('✏️',
                          style: TextStyle(fontSize: 10)),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '러너 김민수',
                      style: TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color:
                                AppColors.gold.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('👑',
                                  style: TextStyle(fontSize: 11)),
                              SizedBox(width: 3),
                              Text(
                                '골드 러너',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.gold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          '서울 · 30대',
                          style: TextStyle(
                              fontSize: 12, color: AppColors.muted),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      '🔥 5일 연속 러닝 중',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.accent),
                    ),
                  ],
                ),
              ),
              // 설정 버튼
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.settings_outlined,
                    color: AppColors.muted),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // 팔로워/팔로잉
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                Expanded(
                    child: _ProfileStat(value: '247', label: '러닝')),
                _VerticalDivider(),
                Expanded(
                    child: _ProfileStat(value: '1,284', label: 'km')),
                _VerticalDivider(),
                Expanded(
                    child: _ProfileStat(value: '38', label: '팔로워')),
                _VerticalDivider(),
                Expanded(
                    child: _ProfileStat(value: '12', label: '스탬프')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
              fontSize: 17, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style:
              const TextStyle(fontSize: 11, color: AppColors.muted),
        ),
      ],
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  const _VerticalDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
        width: 1, height: 28, color: AppColors.borderStrong);
  }
}

// ── 올해 총계 카드 ────────────────────────────────────────────────────────
class _YearlyStats extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderStrong),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '2026년 러닝 기록',
                style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w700),
              ),
              Text(
                '${DateTime.now().month}월 ${DateTime.now().day}일 기준',
                style: const TextStyle(
                    fontSize: 11, color: AppColors.muted),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Row(
            children: [
              Expanded(
                  child: _YearStat(
                      value: '1,284',
                      unit: 'km',
                      label: '총 거리',
                      color: AppColors.accent)),
              Expanded(
                  child: _YearStat(
                      value: '247',
                      unit: '회',
                      label: '총 러닝',
                      color: AppColors.accent2)),
              Expanded(
                  child: _YearStat(
                      value: "5'52\"",
                      unit: '/km',
                      label: '평균 페이스',
                      color: AppColors.accent3)),
            ],
          ),
        ],
      ),
    );
  }
}

class _YearStat extends StatelessWidget {
  const _YearStat(
      {required this.value,
      required this.unit,
      required this.label,
      required this.color});

  final String value;
  final String unit;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              value,
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: color,
                  letterSpacing: -0.5),
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 3, left: 2),
              child: Text(
                unit,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: color.withValues(alpha: 0.7)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
              fontSize: 11, color: AppColors.muted),
        ),
      ],
    );
  }
}

// ── 최근 러닝 카드 ────────────────────────────────────────────────────────
class _RunHistoryCard extends StatelessWidget {
  const _RunHistoryCard({required this.run});

  final Map<String, dynamic> run;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderStrong),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              run['emoji'] as String,
              style: const TextStyle(fontSize: 22),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      run['course'] as String,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      run['date'] as String,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.muted),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    _RunStat(
                        value: '${run['distanceKm']}km',
                        color: AppColors.accent),
                    const SizedBox(width: 12),
                    _RunStat(
                        value: run['pace'] as String,
                        color: AppColors.textPrimary),
                    const SizedBox(width: 12),
                    _RunStat(
                        value: run['duration'] as String,
                        color: AppColors.muted),
                    const SizedBox(width: 12),
                    _RunStat(
                        value: '${run['kcal']}kcal',
                        color: AppColors.accent3),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right,
              color: AppColors.muted2, size: 18),
        ],
      ),
    );
  }
}

class _RunStat extends StatelessWidget {
  const _RunStat({required this.value, required this.color});

  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Text(
      value,
      style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color),
    );
  }
}

// ── 스탬프 미리보기 ───────────────────────────────────────────────────────
class _StampChip extends StatelessWidget {
  const _StampChip(
      {required this.emoji,
      required this.name,
      required this.rarity});

  final String emoji;
  final String name;
  final String rarity;

  Color get _rarityColor {
    switch (rarity) {
      case '레전드':
        return const Color(0xFFFF2D55);
      case '에픽':
        return const Color(0xFF5856D6);
      case '스페셜':
        return const Color(0xFFFF9500);
      case '골드':
        return AppColors.gold;
      case '실버':
        return AppColors.muted;
      default:
        return const Color(0xFF8E8E93);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: _rarityColor.withValues(alpha: 0.4), width: 1.5),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 22)),
          const SizedBox(height: 4),
          Text(
            name,
            style: const TextStyle(
                fontSize: 9, fontWeight: FontWeight.w600),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ── 메뉴 섹션 ─────────────────────────────────────────────────────────────
class _MenuSection extends StatelessWidget {
  const _MenuSection({required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _MenuGroup(items: [
          _MenuItem(
            icon: Icons.share_outlined,
            color: AppColors.accent,
            title: '친구에게 앱 공유',
            onTap: () => Share.share('RunMate AI에서 함께 달려요! 🏃‍♂️'),
          ),
          _MenuItem(
            icon: Icons.people_outline,
            color: AppColors.accent2,
            title: '친구 찾기',
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.emoji_events_outlined,
            color: AppColors.gold,
            title: '러닝 챌린지',
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 12),
        _MenuGroup(items: [
          _MenuItem(
            icon: Icons.notifications_outlined,
            color: AppColors.accent3,
            title: '알림 설정',
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.fitness_center,
            color: const Color(0xFF34C759),
            title: '주간 목표 설정',
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.language,
            color: AppColors.info,
            title: '언어 설정',
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 12),
        _MenuGroup(items: [
          _MenuItem(
            icon: Icons.help_outline,
            color: AppColors.muted,
            title: '도움말',
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.logout,
            color: AppColors.danger,
            title: '로그아웃',
            onTap: () {
              ref.read(apiTokenProvider.notifier).state = null;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('로그아웃되었습니다')),
              );
            },
          ),
        ]),
      ],
    );
  }
}

class _MenuGroup extends StatelessWidget {
  const _MenuGroup({required this.items});

  final List<_MenuItem> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderStrong),
      ),
      child: Column(
        children: items.asMap().entries.map((e) {
          final isLast = e.key == items.length - 1;
          return Column(
            children: [
              e.value,
              if (!isLast)
                const Padding(
                  padding: EdgeInsets.only(left: 52),
                  child: Divider(height: 1),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.color,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 32,
        height: 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      title: Text(
        title,
        style:
            const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      ),
      trailing: const Icon(Icons.chevron_right,
          color: AppColors.muted2, size: 18),
    );
  }
}
