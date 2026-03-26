import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';

enum _MarathonSort {
  /// 가까운 대회(다가오는 날짜) 먼저, 지난 대회는 뒤로
  ddaySoonFirst,
  /// 늦은 대회 먼저
  ddayLateFirst,
  /// API 응답 순서 유지
  apiOrder,
}

class MarathonListScreen extends ConsumerStatefulWidget {
  const MarathonListScreen({super.key});

  @override
  ConsumerState<MarathonListScreen> createState() => _MarathonListScreenState();
}

class _MarathonListScreenState extends ConsumerState<MarathonListScreen> {
  List<dynamic> _items = [];
  List<dynamic> _apiOrder = [];
  String? _err;
  bool _loading = true;
  _MarathonSort _sort = _MarathonSort.ddaySoonFirst;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _err = null;
    });
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get<List<dynamic>>('/marathons');
      final raw = res.data ?? [];
      setState(() {
        _apiOrder = List<dynamic>.from(raw);
        _items = List<dynamic>.from(raw);
      });
      _applySort();
    } on DioException catch (e) {
      setState(() => _err = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  static DateTime? _parseRaceDay(dynamic v) {
    if (v == null) return null;
    final s = v.toString();
    final d = DateTime.tryParse(s);
    if (d == null) return null;
    return DateTime(d.year, d.month, d.day);
  }

  static int _daysUntilRace(DateTime? raceDay) {
    if (raceDay == null) return 999999;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return raceDay.difference(today).inDays;
  }

  /// 정렬 키: 다가오는 대회는 일수가 작을수록 앞(0,1,2…), 지난 대회는 뒤(큰 값)
  static int _sortKeySoonFirst(Map<String, dynamic> m) {
    final race = _parseRaceDay(m['race_date']);
    if (race == null) return 999999;
    final days = _daysUntilRace(race);
    if (days >= 0) return days;
    return 50000 - days;
  }

  static int _sortKeyLateFirst(Map<String, dynamic> m) {
    final race = _parseRaceDay(m['race_date']);
    if (race == null) return -999999;
    final days = _daysUntilRace(race);
    if (days >= 0) return -days;
    return -50000 - days;
  }

  void _applySort() {
    final list = List<Map<String, dynamic>>.from(
      _apiOrder.map((e) => Map<String, dynamic>.from(e as Map)),
    );
    switch (_sort) {
      case _MarathonSort.ddaySoonFirst:
        list.sort((a, b) => _sortKeySoonFirst(a).compareTo(_sortKeySoonFirst(b)));
      case _MarathonSort.ddayLateFirst:
        list.sort((a, b) => _sortKeyLateFirst(a).compareTo(_sortKeyLateFirst(b)));
      case _MarathonSort.apiOrder:
        break;
    }
    setState(() => _items = list);
  }

  static String _ddayLabel(dynamic raceDateRaw) {
    final race = _parseRaceDay(raceDateRaw);
    if (race == null) return '';
    final d = _daysUntilRace(race);
    if (d == 0) return 'D-Day';
    if (d > 0) return 'D-$d';
    return 'D+${-d}';
  }

  Future<void> _open(String? url) async {
    if (url == null || url.isEmpty) return;
    final u = Uri.parse(url);
    if (await canLaunchUrl(u)) {
      await launchUrl(u, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('마라톤'),
        backgroundColor: AppColors.surface,
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
            child: SegmentedButton<_MarathonSort>(
              segments: const [
                ButtonSegment(
                  value: _MarathonSort.ddaySoonFirst,
                  label: Text('D-Day↑'),
                ),
                ButtonSegment(
                  value: _MarathonSort.ddayLateFirst,
                  label: Text('D-Day↓'),
                ),
                ButtonSegment(
                  value: _MarathonSort.apiOrder,
                  label: Text('기본'),
                ),
              ],
              selected: {_sort},
              onSelectionChanged: (s) {
                setState(() => _sort = s.first);
                _applySort();
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _err != null
                    ? Center(child: Text(_err!))
                    : ListView.builder(
                        padding: const EdgeInsets.only(bottom: 24),
                        itemCount: _items.length,
                        itemBuilder: (ctx, i) {
                          final m = _items[i] as Map<String, dynamic>;
                          final date = m['race_date'] as String?;
                          final dday = _ddayLabel(m['race_date']);
                          return Card(
                            color: AppColors.surface,
                            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            child: ListTile(
                              title: Text(m['name'] as String? ?? ''),
                              subtitle: Text(
                                '${m['region'] ?? ''} · ${date ?? ''} · ${m['status'] ?? ''}',
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (dday.isNotEmpty) ...[
                                    Text(
                                      dday,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                        color: _daysUntilRace(_parseRaceDay(m['race_date'])) >= 0
                                            ? AppColors.accent
                                            : AppColors.muted,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  Icon(Icons.open_in_new, size: 18, color: AppColors.muted),
                                ],
                              ),
                              isThreeLine: false,
                              onTap: () => _open(m['apply_url'] as String?),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
