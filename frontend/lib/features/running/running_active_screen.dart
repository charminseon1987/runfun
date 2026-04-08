import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:just_audio/just_audio.dart';

import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';

/// 나이키 런 클럽 스타일: 지도 풀스크린 + 하단 그라데이션·큰 시작/종료
class RunningActiveScreen extends ConsumerStatefulWidget {
  const RunningActiveScreen({super.key});

  @override
  ConsumerState<RunningActiveScreen> createState() => _RunningActiveScreenState();
}

class _RunningActiveScreenState extends ConsumerState<RunningActiveScreen> {
  StreamSubscription<Position>? _sub;
  late final AudioPlayer _player;
  final List<LatLng> _route = [];
  String? _sessionId;
  double _distanceKm = 0;
  DateTime? _startedAt;
  bool _running = false;
  bool _musicEnabled = true;
  bool _isMusicLoading = false;
  String _mood = 'Upbeat';
  int _targetBpm = 145;
  DateTime? _lastMoodSyncAt;
  GoogleMapController? _mapController;

  static const _fallbackTarget = LatLng(37.53, 127.07);
  static const Map<String, String> _moodTrackMap = {
    'Lo-fi': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'Upbeat': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'EDM': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'Techno': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'K-pop': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  };

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _player.playerStateStream.listen((state) {
      if (!mounted) return;
      setState(() => _isMusicLoading = state.processingState == ProcessingState.loading);
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    _player.dispose();
    super.dispose();
  }

  Future<void> _ensurePerm() async {
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.deniedForever || perm == LocationPermission.denied) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('위치 권한이 필요합니다')),
        );
      }
    }
  }

  Future<void> _start() async {
    await _ensurePerm();
    final dio = ref.read(dioProvider);
    try {
      final res = await dio.post<Map<String, dynamic>>('/running/start', data: {});
      _sessionId = res.data?['id'] as String?;
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('세션 시작 실패: ${e.message}')),
        );
      }
      return;
    }
    setState(() {
      _running = true;
      _startedAt = DateTime.now();
      _route.clear();
      _distanceKm = 0;
    });
    _sub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
      ),
    ).listen(_onPos);
    if (_musicEnabled) {
      _syncMusicByPace(force: true);
    }
  }

  void _followCamera(LatLng target) {
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: target, zoom: 16.5, tilt: 0),
      ),
    );
  }

  void _onPos(Position pos) {
    final next = LatLng(pos.latitude, pos.longitude);
    setState(() {
      if (_route.isNotEmpty) {
        final prev = _route.last;
        final d = Geolocator.distanceBetween(
          prev.latitude,
          prev.longitude,
          next.latitude,
          next.longitude,
        );
        _distanceKm += d / 1000;
      }
      _route.add(next);
    });
    if (_running) {
      _followCamera(next);
      _syncMusicByPace();
    }
    final sid = _sessionId;
    if (sid != null) {
      ref.read(dioProvider).post(
            '/running/update/$sid',
            data: {
              'route': _route
                  .map((e) => {'lat': e.latitude, 'lng': e.longitude})
                  .toList(),
            },
          );
    }
  }

  int _currentPaceSecondsPerKm() {
    if (_startedAt == null || _distanceKm < 0.05) return 0;
    final sec = DateTime.now().difference(_startedAt!).inSeconds;
    final secPerKm = (sec / _distanceKm).round();
    return secPerKm <= 0 ? 0 : secPerKm;
  }

  int _paceToBpm(int secPerKm) {
    if (secPerKm <= 0) return 145;
    if (secPerKm <= 240) return 178; // <= 4:00
    if (secPerKm <= 300) return 168; // <= 5:00
    if (secPerKm <= 360) return 156; // <= 6:00
    if (secPerKm <= 420) return 146; // <= 7:00
    return 136;
  }

  String _paceToMood(int secPerKm) {
    if (secPerKm <= 0) return _mood;
    if (secPerKm <= 260) return 'Techno';
    if (secPerKm <= 320) return 'EDM';
    if (secPerKm <= 390) return 'Upbeat';
    return 'Lo-fi';
  }

  Future<void> _playMoodTrack(String mood) async {
    final url = _moodTrackMap[mood];
    if (url == null) return;
    setState(() => _isMusicLoading = true);
    try {
      await _player.setUrl(url);
      await _player.setLoopMode(LoopMode.one);
      await _player.play();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('음악 재생에 실패했습니다. 네트워크를 확인하세요.')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isMusicLoading = false);
      }
    }
  }

  Future<void> _syncMusicByPace({bool force = false}) async {
    if (!_musicEnabled || !_running) return;
    final now = DateTime.now();
    if (!force && _lastMoodSyncAt != null && now.difference(_lastMoodSyncAt!).inSeconds < 20) {
      return;
    }
    final secPerKm = _currentPaceSecondsPerKm();
    final nextBpm = _paceToBpm(secPerKm);
    final nextMood = _paceToMood(secPerKm);
    final shouldSwitch = force || (nextMood != _mood) || ((nextBpm - _targetBpm).abs() >= 10);
    _lastMoodSyncAt = now;
    if (!shouldSwitch) return;
    setState(() {
      _targetBpm = nextBpm;
      _mood = nextMood;
    });
    await _playMoodTrack(_mood);
  }

  Future<void> _toggleMusic() async {
    if (_musicEnabled) {
      await _player.pause();
      if (mounted) {
        setState(() => _musicEnabled = false);
      }
      return;
    }
    if (mounted) {
      setState(() => _musicEnabled = true);
    }
    if (_running) {
      await _syncMusicByPace(force: true);
    } else {
      await _playMoodTrack(_mood);
    }
  }

  Future<void> _selectMood(String mood) async {
    setState(() => _mood = mood);
    if (_musicEnabled) {
      await _playMoodTrack(mood);
    }
  }

  Future<void> _stop() async {
    await _sub?.cancel();
    _sub = null;
    final sid = _sessionId;
    final dio = ref.read(dioProvider);
    if (sid != null) {
      final elapsed = _startedAt != null ? DateTime.now().difference(_startedAt!).inSeconds : 0;
      final pace = _distanceKm > 0 ? (elapsed / 60) / _distanceKm : 0.0;
      try {
        await dio.post(
          '/running/end/$sid',
          data: {
            'distance_km': _distanceKm,
            'duration_sec': elapsed,
            'avg_pace': pace,
            'calories': (_distanceKm * 62).round(),
            'route': _route
                .map((e) => {'lat': e.latitude, 'lng': e.longitude})
                .toList(),
          },
        );
      } catch (_) {}
    }
    if (mounted) {
      setState(() => _running = false);
      context.pop();
    }
  }

  String _paceText() {
    if (!_running || _startedAt == null || _distanceKm < 0.05) return '--:--';
    final sec = DateTime.now().difference(_startedAt!).inSeconds;
    final paceMinPerKm = (sec / 60) / _distanceKm;
    final m = paceMinPerKm.floor();
    final s = ((paceMinPerKm - m) * 60).round().clamp(0, 59);
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  int _kcal() => (_distanceKm * 62).round();

  @override
  Widget build(BuildContext context) {
    final key = dotenv.env['GOOGLE_MAPS_API_KEY'] ?? '';
    final hasMap = key.isNotEmpty;
    final target = _route.isNotEmpty ? _route.last : _fallbackTarget;

    List<LatLng> targetRoute = [];
    try {
      final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
      if (extra != null && extra['targetRoute'] != null) {
        targetRoute = List<LatLng>.from(extra['targetRoute']);
      }
    } catch (_) {}

    final mapLayer = hasMap
        ? GoogleMap(
            initialCameraPosition: CameraPosition(target: target, zoom: 15.5),
            onMapCreated: (c) {
              _mapController = c;
              if (_route.isNotEmpty) {
                _followCamera(_route.last);
              } else if (targetRoute.isNotEmpty) {
                _followCamera(targetRoute.first);
              }
            },
            polylines: {
              if (targetRoute.isNotEmpty)
                Polyline(
                  polylineId: const PolylineId('target'),
                  color: AppColors.accent.withValues(alpha: 0.3),
                  width: 6,
                  points: targetRoute,
                  patterns: const [PatternItem.dash(20), PatternItem.gap(10)],
                ),
              if (_route.length >= 2)
                Polyline(
                  polylineId: const PolylineId('run'),
                  color: AppColors.accent,
                  width: 5,
                  points: _route,
                ),
            },
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            compassEnabled: false,
          )
        : _MapPlaceholder(routePoints: _route.length, distanceKm: _distanceKm);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(child: mapLayer),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                children: [
                  Material(
                    color: Colors.white.withValues(alpha: 0.92),
                    shape: const CircleBorder(),
                    elevation: 2,
                    shadowColor: Colors.black26,
                    clipBehavior: Clip.antiAlias,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.textPrimary),
                      onPressed: () {
                        if (_running) {
                          showDialog<void>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('러닝 종료?'),
                              content: const Text('기록을 저장하고 나갈까요?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('취소')),
                                FilledButton(onPressed: () {
                                  Navigator.pop(ctx);
                                  _stop();
                                }, child: const Text('종료')),
                              ],
                            ),
                          );
                        } else {
                          context.pop();
                        }
                      },
                    ),
                  ),
                  const Spacer(),
                  if (_running)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.accent.withValues(alpha: 0.45)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'LIVE',
                            style: TextStyle(
                              color: AppColors.accent,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    AppColors.background.withValues(alpha: 0.98),
                    AppColors.background.withValues(alpha: 0.75),
                    Colors.transparent,
                  ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 32, 20, 20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _StatPill(
                              big: _distanceKm.toStringAsFixed(2),
                              unit: 'km',
                              accent: true,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _StatPill(
                              big: _paceText(),
                              unit: '페이스 /km',
                              accent: false,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _StatPill(
                              big: '${_kcal()}',
                              unit: 'kcal',
                              amber: true,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                        decoration: BoxDecoration(
                          color: AppColors.card.withValues(alpha: 0.94),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: _musicEnabled ? AppColors.accent : AppColors.muted,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _musicEnabled
                                        ? '음악 BPM $_targetBpm · $_mood'
                                        : '음악 일시정지',
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  width: 38,
                                  height: 38,
                                  child: IconButton(
                                    onPressed: _isMusicLoading ? null : _toggleMusic,
                                    icon: Icon(
                                      _musicEnabled ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 34,
                              child: ListView(
                                scrollDirection: Axis.horizontal,
                                children: _moodTrackMap.keys.map((m) {
                                  final selected = m == _mood;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: ChoiceChip(
                                      label: Text(m),
                                      selected: selected,
                                      onSelected: (_) => _selectMood(m),
                                      selectedColor: AppColors.accent.withValues(alpha: 0.2),
                                      side: BorderSide(
                                        color: selected
                                            ? AppColors.accent.withValues(alpha: 0.7)
                                            : AppColors.border.withValues(alpha: 0.7),
                                      ),
                                      labelStyle: TextStyle(
                                        color: selected ? AppColors.accent : AppColors.textPrimary,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                      ),
                                      backgroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: FilledButton(
                          onPressed: _running ? _stop : _start,
                          style: FilledButton.styleFrom(
                            backgroundColor: _running ? AppColors.danger : AppColors.accent,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: 0.2),
                          ),
                          child: Text(_running ? '종료하기' : '러닝 시작'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({
    required this.big,
    required this.unit,
    this.accent = false,
    this.amber = false,
  });

  final String big;
  final String unit;
  final bool accent;
  final bool amber;

  @override
  Widget build(BuildContext context) {
    final color = accent
        ? AppColors.accent
        : amber
            ? AppColors.accent3
            : AppColors.textPrimary;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.7)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            big,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              height: 1,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            unit,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.muted,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}

/// API 키 없을 때도 지도가 메인인 것처럼 보이는 풀스크린 플레이스홀더
class _MapPlaceholder extends StatelessWidget {
  const _MapPlaceholder({required this.routePoints, required this.distanceKm});

  final int routePoints;
  final double distanceKm;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFE8E9ED), Color(0xFFF2F2F7)],
            ),
          ),
        ),
        CustomPaint(painter: _GridPainter(), size: Size.infinite),
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.map_outlined, size: 56, color: AppColors.muted.withValues(alpha: 0.5)),
              const SizedBox(height: 12),
              Text(
                '지도를 쓰려면\nGOOGLE_MAPS_API_KEY 를 .env 에 설정하세요',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.muted.withValues(alpha: 0.95), fontSize: 13, height: 1.4),
              ),
              if (routePoints > 0) ...[
                const SizedBox(height: 16),
                Text(
                  '$routePoints 포인트 · ${distanceKm.toStringAsFixed(2)} km',
                  style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = AppColors.accent.withValues(alpha: 0.08)
      ..strokeWidth = 1;
    const step = 40.0;
    for (var x = 0.0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), p);
    }
    for (var y = 0.0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), p);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
