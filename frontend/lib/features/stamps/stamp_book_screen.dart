import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';

class StampBookScreen extends ConsumerStatefulWidget {
  const StampBookScreen({super.key});

  @override
  ConsumerState<StampBookScreen> createState() => _StampBookScreenState();
}

class _StampBookScreenState extends ConsumerState<StampBookScreen> {
  List<dynamic> _stamps = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get<List<dynamic>>('/stamps');
      setState(() => _stamps = res.data ?? []);
    } on DioException {
      setState(() => _stamps = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('스탬프 도감'),
        actions: [IconButton(onPressed: _load, icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? Shimmer.fromColors(
              baseColor: Colors.grey.shade300,
              highlightColor: Colors.grey.shade100,
              child: GridView.count(
                crossAxisCount: 2,
                children: List.generate(6, (_) => Card(color: AppColors.surface)),
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.85,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: _stamps.length,
              itemBuilder: (ctx, i) {
                final s = _stamps[i] as Map<String, dynamic>;
                final earned = s['earned'] == true;
                return Card(
                  color: earned ? AppColors.card : AppColors.background3,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(s['icon'] as String? ?? '🏅', style: const TextStyle(fontSize: 36)),
                      const SizedBox(height: 8),
                      Text(
                        s['name'] as String? ?? '',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: earned ? AppColors.textPrimary : AppColors.muted,
                        ),
                      ),
                      Text(
                        earned ? '획득 ${s['earn_count']}' : '미획득',
                        style: const TextStyle(fontSize: 12, color: AppColors.muted),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
