import 'package:flutter/material.dart';
import '../config.dart';

class DesktopPreview extends StatelessWidget {
  final String status;
  final VoidCallback onCapture;
  const DesktopPreview({super.key, required this.status, required this.onCapture});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 24, offset: const Offset(0, 12))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          Container(
            height: 32,
            color: const Color(BangiConfig.panel),
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(children: [
              _dot(Colors.red), const SizedBox(width: 6), _dot(Colors.amber), const SizedBox(width: 6), _dot(Colors.green),
              const SizedBox(width: 10),
              const Expanded(child: Text('BANGI DESKTOP — SOM [1][2][3] • AX tree • pid-scoped', style: TextStyle(fontSize: 8, letterSpacing: 1, color: Colors.white54, fontFamily: 'monospace'), overflow: TextOverflow.ellipsis)),
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: const Color(BangiConfig.gold), borderRadius: BorderRadius.circular(20)), child: const Text('LIVE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(BangiConfig.ink)))),
            ]),
          ),
          AspectRatio(
            aspectRatio: 16 / 10,
            child: Stack(children: [
              Image.network('https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
                  fit: BoxFit.cover, width: double.infinity, height: double.infinity, errorBuilder: (_, __, ___) => Container(color: const Color(0xFF020617))),
              Positioned(top: 60, left: 70, child: _badge('1', const Color(BangiConfig.gold))),
              Positioned(top: 110, left: 160, child: _badge('2', Colors.white)),
              Positioned(top: 140, left: 110, child: _badge('3', Colors.white)),
              Positioned(
                left: 10, right: 10, bottom: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: const Color(0xCC070A12), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.10))),
                  child: Row(children: [
                    const Expanded(child: Text('● Bangi views your screen — click by element_index', style: TextStyle(fontSize: 9, color: Colors.white70, fontFamily: 'monospace'))),
                    FilledButton(onPressed: onCapture, style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: const Color(BangiConfig.ink), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8)), child: const Text('Capture', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700))),
                  ]),
                ),
              ),
            ]),
          ),
          Container(
            height: 28,
            color: const Color(BangiConfig.panel),
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('GATEWAY /api/task → CUA-DRIVER MCP', style: TextStyle(fontSize: 8, letterSpacing: 0.8, color: Colors.white38, fontFamily: 'monospace')),
              Text(status, style: const TextStyle(fontSize: 9, letterSpacing: 1, color: Color(BangiConfig.gold), fontWeight: FontWeight.w800, fontFamily: 'monospace')),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _dot(Color c) => Container(width: 10, height: 10, decoration: BoxDecoration(color: c, shape: BoxShape.circle));
  Widget _badge(String n, Color bg) => Container(
        width: 28, height: 28,
        decoration: BoxDecoration(color: bg, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 6)]),
        child: Center(child: Text(n, style: TextStyle(color: bg == Colors.white ? const Color(BangiConfig.ink) : const Color(BangiConfig.ink), fontWeight: FontWeight.w900, fontSize: 12, fontFamily: 'monospace'))),
      );
}
