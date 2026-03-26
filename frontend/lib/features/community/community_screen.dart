import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  List<dynamic> _posts = [];
  String _scope = 'global';
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
      final res = await dio.get<List<dynamic>>(
        '/posts',
        queryParameters: {'scope': _scope},
      );
      setState(() => _posts = res.data ?? []);
    } on DioException {
      setState(() => _posts = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _like(String id) async {
    try {
      await ref.read(dioProvider).post('/posts/$id/like');
      _load();
    } catch (_) {}
  }

  Future<void> _newPost() async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('새 포스트'),
        content: TextField(
          controller: ctrl,
          maxLines: 3,
          decoration: const InputDecoration(hintText: '내용'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('취소')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('게시')),
        ],
      ),
    );
    if (ok == true && ctrl.text.trim().isNotEmpty) {
      try {
        await ref.read(dioProvider).post('/posts', data: {
          'content': ctrl.text.trim(),
          'is_global': true,
        });
        _load();
      } catch (_) {}
    }
  }

  static List<String> _imageUrls(Map<String, dynamic> p) {
    final raw = p['images'];
    if (raw is! List) return [];
    return raw.map((e) => e.toString()).where((s) => s.startsWith('http')).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('커뮤니티'),
        backgroundColor: AppColors.surface,
        actions: [
          DropdownButton<String>(
            value: _scope,
            dropdownColor: AppColors.surface,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: 'global', child: Text('글로벌')),
              DropdownMenuItem(value: 'following', child: Text('팔로우')),
            ],
            onChanged: (v) {
              if (v != null) {
                setState(() => _scope = v);
                _load();
              }
            },
          ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _newPost,
        child: const Icon(Icons.edit),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.separated(
              padding: const EdgeInsets.only(bottom: 88),
              itemCount: _posts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 4),
              itemBuilder: (ctx, i) {
                final p = _posts[i] as Map<String, dynamic>;
                final id = p['id'].toString();
                final urls = _imageUrls(p);
                return _InstagramPostCard(
                  author: p['author_name'] as String? ?? '',
                  content: p['content'] as String? ?? '',
                  imageUrls: urls,
                  likes: p['likes'] as int? ?? 0,
                  liked: p['liked_by_me'] == true,
                  onLike: () => _like(id),
                );
              },
            ),
    );
  }
}

/// 인스타그램 스타일: 이미지 여러 장 PageView + 점 인디케이터
class _InstagramPostCard extends StatefulWidget {
  const _InstagramPostCard({
    required this.author,
    required this.content,
    required this.imageUrls,
    required this.likes,
    required this.liked,
    required this.onLike,
  });

  final String author;
  final String content;
  final List<String> imageUrls;
  final int likes;
  final bool liked;
  final VoidCallback onLike;

  @override
  State<_InstagramPostCard> createState() => _InstagramPostCardState();
}

class _InstagramPostCardState extends State<_InstagramPostCard> {
  late final PageController _pageCtrl;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController();
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width;
    final hasImages = widget.imageUrls.isNotEmpty;

    return Card(
      color: AppColors.card,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            title: Text(
              widget.author,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
          ),
          if (hasImages)
            Stack(
              alignment: Alignment.bottomCenter,
              children: [
                SizedBox(
                  height: w,
                  child: PageView.builder(
                    controller: _pageCtrl,
                    itemCount: widget.imageUrls.length,
                    onPageChanged: (i) => setState(() => _page = i),
                    itemBuilder: (_, i) {
                      return Image.network(
                        widget.imageUrls[i],
                        fit: BoxFit.cover,
                        width: w,
                        loadingBuilder: (ctx, child, prog) {
                          if (prog == null) return child;
                          return Container(
                            color: AppColors.card2,
                            alignment: Alignment.center,
                            child: const CircularProgressIndicator(strokeWidth: 2),
                          );
                        },
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.card2,
                          alignment: Alignment.center,
                          child: const Icon(Icons.broken_image_outlined, color: AppColors.muted, size: 48),
                        ),
                      );
                    },
                  ),
                ),
                if (widget.imageUrls.length > 1)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        widget.imageUrls.length,
                        (i) => Container(
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: i == _page ? 8 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: i == _page ? AppColors.accent : AppColors.muted.withValues(alpha: 0.45),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            )
          else
            Container(
              width: w,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              color: AppColors.card2,
              child: Text(
                widget.content.isEmpty ? '(내용 없음)' : widget.content,
                style: TextStyle(color: AppColors.textPrimary.withValues(alpha: 0.85), height: 1.35),
              ),
            ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(
                    widget.liked ? Icons.favorite : Icons.favorite_border,
                    color: widget.liked ? AppColors.danger : AppColors.textPrimary,
                    size: 28,
                  ),
                  onPressed: widget.onLike,
                ),
                Text(
                  '${widget.likes}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
              ],
            ),
          ),
          if (hasImages && widget.content.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
              child: Text.rich(
                TextSpan(
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, height: 1.35),
                  children: [
                    TextSpan(
                      text: '${widget.author} ',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(text: widget.content),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
