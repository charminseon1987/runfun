// lib/features/courses/drawing_course_screen.dart
// GPS 드로잉 코스 선택 + 미리보기 화면

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
    key:         '강아지_경복궁',
    name:        '경복궁 강아지런',
    shape:       '강아지',
    emoji:       '🐕',
    totalKm:     7.8,
    description: '달리면 지도에 강아지가!',
    area:        '경복궁·광화문',
  ),
  DrawingTemplate(
    key:         '하트_한강',
    name:        '한강 하트런',
    shape:       '하트',
    emoji:       '❤️',
    totalKm:     9.2,
    description: '한강에서 그리는 로맨틱 코스',
    area:        '한강공원',
  ),
  DrawingTemplate(
    key:         '별_남산',
    name:        '남산 별런',
    shape:       '별',
    emoji:       '⭐',
    totalKm:     8.5,
    description: '남산 주변 반짝반짝 별 코스',
    area:        '남산·명동',
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

  // 커스텀 요청
  final _shapeCtrl = TextEditingController();
  final _areaCtrl  = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D14),
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
                    const SizedBox(height: 20),
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
    );
  }

  // ── 헤더 ────────────────────────────────────────────────
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('🗺️ GPS 드로잉 코스',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white)),
              Text('달리면서 지도에 그림 그리기',
                style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5))),
            ],
          ),
        ],
      ),
    );
  }

  // ── COSHI 안내 메시지 ────────────────────────────────────
  Widget _buildCoshiMessage() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E2E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF00E87A).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFF00E87A).withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(child: Text('🗺️', style: TextStyle(fontSize: 20))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('COSHI', style: TextStyle(
                  fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF00E87A))),
                const SizedBox(height: 2),
                Text('원하는 모양을 선택하면 실제 달릴 수 있는\nGPS 코스로 만들어드릴게요! 🎨',
                  style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.85), height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 템플릿 그리드 ────────────────────────────────────────
  Widget _buildTemplateGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('인기 드로잉 코스',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
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
      onTap: () => setState(() => _selected = t),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E2E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF00E87A) : Colors.white.withOpacity(0.08),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(t.emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(height: 6),
            Text(t.shape,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 2),
            Text('${t.totalKm}km',
              style: TextStyle(fontSize: 11, color: isSelected ? const Color(0xFF00E87A) : Colors.white38)),
            const SizedBox(height: 4),
            Text(t.area,
              style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.4)),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  // ── 커스텀 요청 ─────────────────────────────────────────
  Widget _buildCustomRequest() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('직접 요청하기',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
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
              backgroundColor: const Color(0xFF1E1E2E),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.white.withOpacity(0.12)),
              ),
            ),
            child: const Text('🤖 COSHI에게 코스 만들어달라고 하기',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF00E87A))),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String hint) {
    return TextField(
      controller: ctrl,
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12),
        filled: true,
        fillColor: const Color(0xFF1E1E2E),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
    );
  }

  // ── 선택된 코스 미리보기 ──────────────────────────────────
  Widget _buildSelectedPreview() {
    final t = _selected!;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF00E87A).withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Text(t.emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 10),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(t.name, style: const TextStyle(
                fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
              Text(t.area, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5))),
            ]),
          ]),
          const SizedBox(height: 12),
          _buildStatRow('📏 총 거리', '${t.totalKm}km'),
          _buildStatRow('📍 지역',   t.area),
          _buildStatRow('🎨 모양',   t.shape),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF00E87A).withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '💬 COSHI: "${t.description} 이 코스 완주하면 지도에 ${t.shape} 완성이에요!"',
              style: const TextStyle(fontSize: 12, color: Color(0xFF00E87A), height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(children: [
        Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5))),
        const SizedBox(width: 8),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
      ]),
    );
  }

  // ── 시작 버튼 ────────────────────────────────────────────
  Widget _buildStartButton() {
    return FloatingActionButton.extended(
      onPressed: _handleStart,
      backgroundColor: const Color(0xFF00E87A),
      label: Text(
        _isGenerating ? '코스 생성 중...' : '🏃 이 코스로 달리기',
        style: const TextStyle(color: Color(0xFF003820), fontWeight: FontWeight.w900, fontSize: 14),
      ),
      icon: _isGenerating
        ? const SizedBox(width: 18, height: 18,
            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF003820)))
        : null,
    );
  }

  // ── 이벤트 핸들러 ────────────────────────────────────────
  void _handleCustomRequest() {
    final shape = _shapeCtrl.text.trim();
    final area  = _areaCtrl.text.trim();
    if (shape.isEmpty || area.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('모양과 지역을 모두 입력해주세요')),
      );
      return;
    }
    // TODO: API 호출 → COSHI 에이전트
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('🗺️ COSHI가 $area 에서 $shape 코스를 만들고 있어요!')),
    );
  }

  void _handleStart() {
    if (_selected == null) return;
    setState(() => _isGenerating = true);

    // TODO: 실제 GPS 러닝 화면으로 이동 + 웨이포인트 전달
    Future.delayed(const Duration(seconds: 1), () {
      setState(() => _isGenerating = false);
      Navigator.pushNamed(context, '/running/active',
        arguments: {'course': _selected, 'type': 'drawing'});
    });
  }
}
