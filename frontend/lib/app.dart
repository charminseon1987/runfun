import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/constants/app_colors.dart';
import 'core/providers/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/community/community_screen.dart';
import 'features/home/home_screen.dart';
import 'features/marathon/marathon_list_screen.dart';
import 'features/my/my_screen.dart';
import 'features/running/running_active_screen.dart';
import 'features/stamps/stamp_book_screen.dart';

final _rootKey = GlobalKey<NavigatorState>();

ThemeData _runMateTheme() {
  const accent = AppColors.accent;
  final scheme = ColorScheme.light(
    primary: accent,
    onPrimary: Colors.white,
    primaryContainer: const Color(0xFFE8F1FF),
    onPrimaryContainer: const Color(0xFF002C5C),
    secondary: AppColors.accent2,
    onSecondary: Colors.white,
    surface: AppColors.card,
    onSurface: AppColors.textPrimary,
    onSurfaceVariant: AppColors.muted,
    surfaceContainerHighest: AppColors.card2,
    surfaceContainerHigh: AppColors.card2,
    surfaceContainer: AppColors.background3,
    outline: AppColors.border,
    outlineVariant: AppColors.borderStrong,
    error: AppColors.danger,
    onError: Colors.white,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.background,
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
    appBarTheme: AppBarTheme(
      elevation: 0.5,
      scrolledUnderElevation: 0.5,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      backgroundColor: AppColors.background2.withValues(alpha: 0.94),
      foregroundColor: AppColors.textPrimary,
      surfaceTintColor: Colors.transparent,
      centerTitle: true,
      titleTextStyle: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.4,
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AppColors.background2.withValues(alpha: 0.92),
      elevation: 0,
      height: 56,
      indicatorColor: AppColors.iosTabIndicator,
      surfaceTintColor: Colors.transparent,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final sel = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 10,
          fontWeight: sel ? FontWeight.w600 : FontWeight.w500,
          letterSpacing: -0.1,
          color: sel ? accent : AppColors.muted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final sel = states.contains(WidgetState.selected);
        return IconThemeData(
          size: 24,
          color: sel ? accent : AppColors.muted,
        );
      }),
    ),
    cardTheme: CardThemeData(
      color: AppColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.border.withValues(alpha: 0.65)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.card2,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: AppColors.borderStrong.withValues(alpha: 0.9)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: accent, width: 1.5),
      ),
      labelStyle: const TextStyle(color: AppColors.muted, fontSize: 15),
      hintStyle: TextStyle(color: AppColors.muted.withValues(alpha: 0.85), fontSize: 15),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        elevation: 0,
        foregroundColor: Colors.white,
        backgroundColor: accent,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: accent,
        side: BorderSide(color: AppColors.borderStrong),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    dividerTheme: DividerThemeData(
      color: AppColors.border.withValues(alpha: 0.8),
      thickness: 0.5,
      space: 0.5,
    ),
    listTileTheme: const ListTileThemeData(
      iconColor: AppColors.muted,
      textColor: AppColors.textPrimary,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: const Color(0xFF3A3A3C),
      contentTextStyle: const TextStyle(color: Colors.white, fontSize: 15),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.background2,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
      ),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        side: WidgetStatePropertyAll(BorderSide(color: AppColors.borderStrong)),
        backgroundColor: WidgetStateProperty.resolveWith((s) {
          if (s.contains(WidgetState.selected)) {
            return AppColors.background2;
          }
          return AppColors.card2;
        }),
      ),
    ),
  );
}

class RunMateApp extends ConsumerWidget {
  const RunMateApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    final router = GoRouter(
      navigatorKey: _rootKey,
      initialLocation: '/home',
      redirect: (context, state) {
        final status = authState.status;
        final isLoginRoute = state.matchedLocation == '/login';

        if (status == AuthStatus.loading) return null;
        if (status == AuthStatus.unauthenticated && !isLoginRoute) {
          return '/login';
        }
        if (status == AuthStatus.authenticated && isLoginRoute) {
          return '/home';
        }
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (_, __) => const LoginScreen(),
        ),
        GoRoute(
          path: '/home',
          builder: (_, __) => const _TabShell(child: HomeScreen()),
        ),
        GoRoute(
          path: '/stamps',
          builder: (_, __) => const _TabShell(child: StampBookScreen()),
        ),
        GoRoute(
          path: '/marathons',
          builder: (_, __) => const _TabShell(child: MarathonListScreen()),
        ),
        GoRoute(
          path: '/community',
          builder: (_, __) => const _TabShell(child: CommunityScreen()),
        ),
        GoRoute(
          path: '/my',
          builder: (_, __) => const _TabShell(child: MyScreen()),
        ),
        GoRoute(
          path: '/run/active',
          builder: (_, __) => const RunningActiveScreen(),
        ),
      ],
    );

    return MaterialApp.router(
      title: 'RunMate AI',
      theme: _runMateTheme(),
      routerConfig: router,
    );
  }
}

class _TabShell extends StatelessWidget {
  const _TabShell({required this.child});

  final Widget child;

  int _indexForLocation(String loc) {
    if (loc.startsWith('/stamps')) return 1;
    if (loc.startsWith('/marathons')) return 2;
    if (loc.startsWith('/community')) return 3;
    if (loc.startsWith('/my')) return 4;
    return 0;
  }

  void _go(BuildContext context, int i) {
    switch (i) {
      case 0:
        context.go('/home');
        return;
      case 1:
        context.go('/stamps');
        return;
      case 2:
        context.go('/marathons');
        return;
      case 3:
        context.go('/community');
        return;
      case 4:
        context.go('/my');
        return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    final idx = _indexForLocation(loc);
    return Scaffold(
      body: child,
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.background2.withValues(alpha: 0.94),
          border: Border(
            top: BorderSide(color: AppColors.border.withValues(alpha: 0.85)),
          ),
        ),
        child: SafeArea(
          top: false,
          child: NavigationBar(
            backgroundColor: Colors.transparent,
            selectedIndex: idx,
            onDestinationSelected: (v) => _go(context, v),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home_rounded),
                label: '홈',
              ),
              NavigationDestination(
                icon: Icon(Icons.emoji_events_outlined),
                selectedIcon: Icon(Icons.emoji_events),
                label: '스탬프',
              ),
              NavigationDestination(
                icon: Icon(Icons.calendar_month_outlined),
                selectedIcon: Icon(Icons.calendar_month),
                label: '마라톤',
              ),
              NavigationDestination(
                icon: Icon(Icons.forum_outlined),
                selectedIcon: Icon(Icons.forum),
                label: '피드',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'MY',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
