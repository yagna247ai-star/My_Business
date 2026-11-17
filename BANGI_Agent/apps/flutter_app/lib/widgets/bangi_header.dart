import 'package:flutter/material.dart';
import '../config.dart';

class BangiHeader extends StatelessWidget {
  final VoidCallback onStart;
  const BangiHeader({super.key, required this.onStart});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xCC070A12),
        border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.08))),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: const Color(BangiConfig.gold), borderRadius: BorderRadius.circular(10)),
            child: const Center(child: Text('B', style: TextStyle(color: Color(BangiConfig.ink), fontWeight: FontWeight.w900, fontSize: 16))),
          ),
          const SizedBox(width: 10),
          const Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('BANGI', style: TextStyle(letterSpacing: 1.6, fontWeight: FontWeight.w800, fontSize: 14)),
            Text('FLUTTER • HERMES-POWERED', style: TextStyle(fontSize: 8, letterSpacing: 1.2, color: Colors.white54)),
          ]),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: const Color(0x1A10B981), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0x3310B981))),
            child: const Text('● GATEWAY :8001', style: TextStyle(fontSize: 9, letterSpacing: 1, color: Color(0xFF6EE7B7), fontFamily: 'monospace')),
          ),
          const SizedBox(width: 10),
          FilledButton(
            onPressed: onStart,
            style: FilledButton.styleFrom(backgroundColor: const Color(BangiConfig.gold), foregroundColor: const Color(BangiConfig.ink)),
            child: const Text('Start →', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}
