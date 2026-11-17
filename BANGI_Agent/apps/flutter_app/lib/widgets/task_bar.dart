import 'package:flutter/material.dart';
import '../config.dart';

class TaskBar extends StatelessWidget {
  final TextEditingController controller;
  final bool busy;
  final VoidCallback onSubmit;
  const TaskBar({super.key, required this.controller, required this.busy, required this.onSubmit});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withOpacity(0.08))),
      child: Row(children: [
        Expanded(
          child: TextField(
            controller: controller,
            onSubmitted: (_) => onSubmit(),
            style: const TextStyle(color: Color(BangiConfig.ink), fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Tell Bangi: Apply 10 jobs, check CRM, coach Yagna… via Gateway',
              hintStyle: TextStyle(color: Colors.black.withOpacity(0.4), fontSize: 12),
              filled: true, fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
            ),
          ),
        ),
        const SizedBox(width: 10),
        FilledButton(
          onPressed: busy ? null : onSubmit,
          style: FilledButton.styleFrom(backgroundColor: const Color(BangiConfig.gold), foregroundColor: const Color(BangiConfig.ink), padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24))),
          child: Text(busy ? 'Working…' : 'Ask Bangi →', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
        ),
      ]),
    );
  }
}
