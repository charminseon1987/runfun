import 'package:flutter/material.dart';

/// 미니멀 iOS 스타일 — 시스템 그룹드 배경·라벨·세퍼레이터 톤
class AppColors {
  static const background = Color(0xFFF2F2F7); // systemGroupedBackground
  static const background2 = Color(0xFFFFFFFF);
  static const background3 = Color(0xFFE5E5EA); // tertiarySystemFill
  static const card = Color(0xFFFFFFFF);
  static const card2 = Color(0xFFF2F2F7);

  static const border = Color(0xFFC6C6C8); // separator
  static const borderStrong = Color(0xFFD1D1D6);

  static const accent = Color(0xFF007AFF); // systemBlue
  static const accent2 = Color(0xFF5856D6); // systemIndigo
  static const accent3 = Color(0xFFFF9500); // systemOrange
  static const accent4 = Color(0xFFFF2D55);

  static const textPrimary = Color(0xFF000000);
  static const muted = Color(0xFF8E8E93); // secondaryLabel
  static const muted2 = Color(0xFFAEAEB2); // tertiaryLabel

  static const danger = Color(0xFFFF3B30);
  static const info = Color(0xFF5AC8FA);

  static const gold = Color(0xFFFFCC00);

  /// 카드/서피스 (기존 호환)
  static const surface = card;

  /// 탭 바 선택 영역 배경 (iOS 탭 느낌)
  static const iosTabIndicator = Color(0xFFE9E9EB);
}
