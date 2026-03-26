import 'package:flutter/material.dart';
import 'package:overlay_support/overlay_support.dart';

import '../../core/constants/app_colors.dart';

class FriendRunning {
  FriendRunning({
    required this.name,
    required this.avatarUrl,
    required this.courseName,
    required this.distanceKm,
  });

  final String name;
  final String avatarUrl;
  final String courseName;
  final double distanceKm;
}

void showFriendRunningToast(BuildContext context, FriendRunning friend) {
  showOverlayNotification(
    (ctx) => FriendRunningToastWidget(friend: friend),
    duration: const Duration(seconds: 8),
    position: NotificationPosition.top,
  );
}

/// runmate_ai_v2.html `.friend-toast` 스타일 (상단 그린 라인 · 둥근 하단)
class FriendRunningToastWidget extends StatelessWidget {
  const FriendRunningToastWidget({required this.friend, super.key});

  final FriendRunning friend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Material(
          color: AppColors.card,
          elevation: 8,
          shadowColor: Colors.black54,
          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
              border: Border(
                top: const BorderSide(color: AppColors.accent, width: 2),
                left: BorderSide(color: AppColors.border.withValues(alpha: 0.9)),
                right: BorderSide(color: AppColors.border.withValues(alpha: 0.9)),
                bottom: BorderSide(color: AppColors.border.withValues(alpha: 0.9)),
              ),
            ),
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        CircleAvatar(
                          radius: 23,
                          backgroundColor: AppColors.card2,
                          backgroundImage: NetworkImage(friend.avatarUrl),
                        ),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            width: 13,
                            height: 13,
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.background2, width: 2),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '🏃 주변 친구가 러닝 중이에요!',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.accent,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            friend.name,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            '${friend.courseName} · 지금 ${friend.distanceKm.toStringAsFixed(1)}km 달리는 중',
                            style: const TextStyle(fontSize: 12, color: AppColors.muted),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                      onPressed: () => OverlaySupportEntry.of(context)?.dismiss(),
                      icon: const Icon(Icons.close, size: 18, color: AppColors.muted2),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton(
                        onPressed: () => OverlaySupportEntry.of(context)?.dismiss(),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('같이 달리기'),
                      ),
                    ),
                    const SizedBox(width: 7),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => OverlaySupportEntry.of(context)?.dismiss(),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textPrimary,
                          backgroundColor: AppColors.card2,
                          side: const BorderSide(color: AppColors.borderStrong),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('응원 보내기'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
