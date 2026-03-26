import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:overlay_support/overlay_support.dart';

import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env 없으면 기본 API URL 사용 (api_service.dart)
  }
  runApp(
    const ProviderScope(
      child: OverlaySupport.global(
        child: RunMateApp(),
      ),
    ),
  );
}
