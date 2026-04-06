import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_service.dart';
import '../services/auth_service.dart';

enum AuthStatus { loading, authenticated, unauthenticated }

class AuthState {
  const AuthState(this.status, {this.token});

  final AuthStatus status;
  final String? token;
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(const AuthState(AuthStatus.loading)) {
    _init();
  }

  final Ref _ref;

  Future<void> _init() async {
    final token = await AuthService.loadToken();
    if (token != null) {
      _ref.read(apiTokenProvider.notifier).state = token;
      state = AuthState(AuthStatus.authenticated, token: token);
    } else {
      state = const AuthState(AuthStatus.unauthenticated);
    }
  }

  Future<bool> signInWithGoogle() async {
    try {
      final dio = _ref.read(dioProvider);
      final token = await AuthService.signInWithGoogle(dio);
      if (token == null) return false;
      _ref.read(apiTokenProvider.notifier).state = token;
      state = AuthState(AuthStatus.authenticated, token: token);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> signOut() async {
    await AuthService.signOut();
    _ref.read(apiTokenProvider.notifier).state = null;
    state = const AuthState(AuthStatus.unauthenticated);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref),
);
