import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _tokenKey = 'runmate_token';

class AuthService {
  static final _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

  static Future<String?> signInWithGoogle(Dio dio) async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) return null;

    final response = await dio.post('/auth/google-profile', data: {
      'sub': googleUser.id,
      'email': googleUser.email,
      'name': googleUser.displayName ?? googleUser.email.split('@').first,
      'picture': googleUser.photoUrl,
    });

    final token = response.data['access_token'] as String;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    return token;
  }

  static Future<String?> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> signOut() async {
    await _googleSignIn.signOut();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }
}
