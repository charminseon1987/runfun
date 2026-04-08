import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../../core/constants/app_colors.dart';

// ── 모양 템플릿 데이터 ─────────────────────────────────────
class DrawingTemplate {
  final String key;
  final String name;
  final String shape;
  final String emoji;
  final double totalKm;
  final String description;
  final String area;

  const DrawingTemplate({
    required this.key,
    required this.name,
    required this.shape,
    required this.emoji,
    required this.totalKm,
    required this.description,
    required this.area,
  });
}

const kTemplates = [
  DrawingTemplate(
    key: '강아지_경복궁',
    name: '강아지런',
    shape: '강아지',
    emoji: '🐕',
    totalKm: 7.8,
    description: '달리면 지도에 강아지가!',
    area: '현위치 기준',
  ),
  DrawingTemplate(
    key: '하트_한강',
    name: '하트런',
    shape: '하트',
    emoji: '❤️',
    totalKm: 9.2,
    description: '로맨틱 코스로 크게 한 바퀴',
    area: '현위치 기준',
  ),
  DrawingTemplate(
    key: '별_남산',
    name: '별런',
    shape: '별',
    emoji: '⭐',
    totalKm: 8.5,
    description: '반짝반짝 별 코스 완성!',
    area: '현위치 기준',
  ),
];

// ── 화면 ──────────────────────────────────────────────────
class DrawingCourseScreen extends ConsumerStatefulWidget {
  const DrawingCourseScreen({super.key});

  @override
  ConsumerState<DrawingCourseScreen> createState() => _DrawingCourseScreenState();
}

class _DrawingCourseScreenState extends ConsumerState<DrawingCourseScreen> {
  DrawingTemplate? _selected;
  bool _isGenerating = false;
  
  Position? _currentPosition;
  GoogleMapController? _mapController;
  List<LatLng> _generatedRoute = [];

  // 커스텀 요청
  final _shapeCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }
    
    if (permission == LocationPermission.deniedForever) return;

    final pos = await Geolocator.getCurrentPosition();
    if (mounted) {
      setState(() => _currentPosition = pos);
    }
  }

  // 간단히 현 위치 주변으로 도형 그리기 (1도 = 약 111km -> 0.01로 약 1km 반경)
  void _generateShapeRoute(String shapeKey) {
    if (_currentPosition == null) return;
    final lat = _currentPosition!.latitude;
    final lng = _currentPosition!.longitude;
    final size = 0.01; // 약 1.1km 반경 (모양에 따라 totalKm 가 다름)
    
    List<LatLng> points = [];
    if (shapeKey.contains('별')) {
      // 별 모양 좌표 생성
      final centerLat = lat + size * 0.5;
      final centerLng = lng;
      for (int i = 0; i <= 5; i++) {
        double angle = (pi / 2) + (i * 4 * pi / 5);
        points.add(LatLng(
          centerLat + size * sin(angle),
          centerLng + size * cos(angle) * 1.2,
        ));
      }
    } else if (shapeKey.contains('하트')) {
      // 하트 모양 좌표
      final centerLat = lat + size;
      final centerLng = lng;
      for (double t = 0; t <= 2 * pi; t += 0.2) {
        double x = 16 * pow(sin(t), 3);
        double y = 13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t);
        // t=0 일때 y가 13, 맨 위쪽. x는 0. x는 lng, y는 lat에 대응.
        points.add(LatLng(
          centerLat + (y / 16) * size,
          centerLng + (x / 16) * size * 1.2,
        ));
      }
      points.add(points.first); // close path
    } else {
      // 기본 다각형 (강아지 대신 임시 육각형)
      final centerLat = lat + size;
      for (int i = 0; i <= 6; i++) {
        points.add(LatLng(
          centerLat + size * 0.8 * cos(i * pi / 3),
          lng + size * 1.0 * sin(i * pi / 3),
        ));
      }
    }

    setState(() {
      _generatedRoute = points;
    });

    _mapController?.animateCamera(CameraUpdate.newCameraPosition(
      CameraPosition(
        target: LatLng(points.first.latitude, points.first.longitude),
        zoom: 14.0,
      )
    ));
  }

  void _onTemplateSelected(DrawingTemplate t) {
    setState(() => _selected = t);
    _generateShapeRoute(t.key);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildCoshiMessage(),
                    const SizedBox(height: 16),
                    _buildTemplateGrid(),
                    const SizedBox(height: 24),
                    _buildCustomRequest(),
                    const SizedBox(height: 24),
                    if (_selected != null) _buildSelectedPreview(),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: _selected != null ? _buildStartButton() : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.background2,
        border: Border(bottom: BorderSide(color: AppColors.border.withValues(alpha: 0.5))),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.textPrimary, size: 20),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: 12),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('🗺️ GPS 드로잉 코스',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              Text('달리면서 지도에 그림 그리기',
                  style: TextStyle(fontSize: 12, color: AppColors.muted)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCoshiMessage() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8, offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: AppColors.primaryContainer,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(child: Text('🗺️', style: TextStyle(fontSize: 20))),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('COSHI', style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accent)),
                SizedBox(height: 2),
                Text('원하는 모양을 선택하면 현재 위치 기반으로 달릴 수 있는 네비게이션 경로를 만들어드려요! 🎨',
                  style: TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTemplateGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('인기 드로잉 코스',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          childAspectRatio: 0.85,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          children: kTemplates.map((t) => _buildTemplateCard(t)).toList(),
        ),
      ],
    );
  }

  Widget _buildTemplateCard(DrawingTemplate t) {
    final isSelected = _selected?.key == t.key;
    return GestureDetector(
      onTap: () => _onTemplateSelected(t),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accent.withValues(alpha: 0.08) : AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.accent : AppColors.border.withValues(alpha: 0.6),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected ? [] : [
            BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(t.emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(height: 6),
            Text(t.shape,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text('${t.totalKm}km',
              style: TextStyle(fontSize: 11, color: isSelected ? AppColors.accent : AppColors.muted)),
            const SizedBox(height: 4),
            Text(t.area,
              style: const TextStyle(fontSize: 10, color: AppColors.muted2),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomRequest() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('직접 요청하기',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(
            child: _buildTextField(_shapeCtrl, '모양 (예: 고양이, 별)'),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildTextField(_areaCtrl, '지역 (예: 한강, 홍대)'),
          ),
        ]),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            onPressed: _handleCustomRequest,
            style: TextButton.styleFrom(
              backgroundColor: AppColors.card,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: AppColors.border.withValues(alpha: 0.6)),
              ),
            ),
            child: const Text('🤖 COSHI에게 주변 코스 만들어달라고 하기',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.accent)),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String hint) {
    return TextField(
      controller: ctrl,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.muted, fontSize: 12),
        filled: true,
        fillColor: AppColors.card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: AppColors.border.withValues(alpha: 0.6)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: AppColors.border.withValues(alpha: 0.6)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.accent),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    );
  }

  Widget _buildSelectedPreview() {
    final t = _selected!;
    final apiKey = dotenv.env['GOOGLE_MAPS_API_KEY'] ?? '';
    final hasMap = apiKey.isNotEmpty;
    
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(color: AppColors.accent.withValues(alpha: 0.05), blurRadius: 10, spreadRadius: 2),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Text(t.emoji, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 10),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t.name, style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                Text(t.area, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
              ]),
              const Spacer(),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text('${t.totalKm}km', style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.accent)),
                const Text('예상 거리', style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ]),
            ]),
          ),
          
          if (_currentPosition != null && hasMap) 
            SizedBox(
              height: 200,
              width: double.infinity,
              child: GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
                  zoom: 14.0,
                ),
                onMapCreated: (c) => _mapController = c,
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                polylines: _generatedRoute.isNotEmpty ? {
                  Polyline(
                    polylineId: const PolylineId('target_route'),
                    color: AppColors.accent.withValues(alpha: 0.8),
                    width: 5,
                    points: _generatedRoute,
                  )
                } : {},
              ),
            )
          else 
            Container(
              height: 120,
              color: AppColors.background3,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.location_on_outlined, color: AppColors.muted.withValues(alpha: 0.5), size: 30),
                    const SizedBox(height: 8),
                    const Text('GPS 연결 중이거나 맵 키가 없습니다', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStartButton() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      width: double.infinity,
      child: FloatingActionButton.extended(
        onPressed: _handleStart,
        backgroundColor: AppColors.accent,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        label: Text(
          _isGenerating ? '네비게이션 생성 중...' : '🏃 이 코스로 길안내 시작',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
        ),
        icon: _isGenerating
          ? const SizedBox(width: 18, height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
          : const Icon(Icons.navigation_rounded, color: Colors.white),
      ),
    );
  }

  void _handleCustomRequest() {
    final shape = _shapeCtrl.text.trim();
    final area = _areaCtrl.text.trim();
    if (shape.isEmpty || area.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('모양과 지역을 모두 입력해주세요')),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('🗺️ COSHI가 $area 주변으로 \'$shape\' 코스를 만들고 있어요!')),
    );
  }

  void _handleStart() {
    if (_selected == null || _generatedRoute.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('GPS 정보를 가져오고 있습니다. 잠시만 기다려주세요.')),
      );
      return;
    }
    setState(() => _isGenerating = true);

    Future.delayed(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      setState(() => _isGenerating = false);
      
      // GoRouter extra parameter 에 targetRoute 정보 전달
      context.push('/run/active', extra: {
        'course': _selected,
        'type': 'drawing',
        'targetRoute': _generatedRoute,
      });
    });
  }
}
