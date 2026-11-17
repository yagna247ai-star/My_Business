import 'package:flutter/material.dart';
import '../api.dart';
import '../config.dart';
import '../widgets/bangi_header.dart';
import '../widgets/desktop_preview.dart';
import '../widgets/task_bar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final BangiApi api = BangiApi();
  final TextEditingController input = TextEditingController();
  final ScrollController logCtrl = ScrollController();
  String status = 'IDLE';
  String log = 'Bangi Flutter → Gateway :8001 → Backend :8000\nReady. Try: Apply 10 jobs, check CRM, coach Yagna — any task via hybrid router.';
  Map<String, dynamic>? health;
  bool busy = false;

  @override
  void initState() {
    super.initState();
    api.loadSavedUrl().then((_) => setState(() {}));
    _refreshHealth();
  }

  Future<void> _refreshHealth() async {
    try {
      final h = await api.health();
      setState(() => health = h);
    } catch (e) {
      setState(() => health = {'gateway': 'offline — run uv run gateway :8001'});
    }
  }

  void _append(String m) {
    setState(() => log += '\n$m');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (logCtrl.hasClients) logCtrl.jumpTo(logCtrl.position.maxScrollExtent);
    });
  }

  Future<void> _task(String prompt) async {
    if (prompt.trim().isEmpty) return;
    setState(() { status = 'WORKING…'; busy = true; });
    _append('> $prompt');
    _append('→ POST /api/task {prompt} → Gateway → BangiAgent.do_task() → hybrid');
    try {
      // Try WS streaming first, fallback to REST
      bool gotResult = false;
      try {
        final ch = api.connectWs(onMsg: (m) {
          if (m['type'] == 'progress') _append('… ${m['step']}: ${m['detail']}');
          if (m['type'] == 'result') { _append('✓ ${m['mode'] ?? 'done'}: ${m.toString().substring(0, 400)}'); gotResult = true; }
        });
        ch.sink.add('{"prompt":"$prompt"}');
        await Future.delayed(const Duration(milliseconds: 900));
        try { ch.sink.close(); } catch (_) {}
        if (gotResult) return;
      } catch (_) {}
      final r = await api.task(prompt);
      _append('✓ ${r['mode'] ?? r['via'] ?? 'done'}: ${r.toString().substring(0, 500)}');
    } catch (e) {
      _append('✗ $e — is Gateway :8001 running? (uv run gateway)');
    } finally {
      setState(() { status = 'IDLE'; busy = false; });
    }
  }

  void _openSettings() {
    final c = TextEditingController(text: api.gatewayUrl);
    showDialog(context: context, builder: (_) => AlertDialog(
      backgroundColor: const Color(BangiConfig.panel),
      title: const Text('Gateway URL', style: TextStyle(color: Colors.white)),
      content: TextField(controller: c, style: const TextStyle(color: Colors.white, fontFamily: 'monospace'), decoration: const InputDecoration(hintText: 'http://localhost:8001', hintStyle: TextStyle(color: Colors.white38), enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white24)))),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        FilledButton(onPressed: () async { await api.saveUrl(c.text.trim()); setState(() {}); Navigator.pop(context); _refreshHealth(); }, style: FilledButton.styleFrom(backgroundColor: const Color(BangiConfig.gold), foregroundColor: const Color(BangiConfig.ink)), child: const Text('Save')),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(BangiConfig.ink),
      body: Column(children: [
        BangiHeader(onStart: () => _task('do all daily tasks: apply jobs, check CRM lead status, summarize')),
        Expanded(child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            // Hero
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(BangiConfig.gold).withOpacity(0.08), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(BangiConfig.gold).withOpacity(0.18))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Hi, I\'m Bangi. I do all tasks.', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                const SizedBox(height: 6),
                Text('Flutter (Android/iOS/macOS/Win) → Gateway :8001 → Backend :8000 — Hermes hybrid — ${api.gatewayUrl}', style: const TextStyle(fontSize: 10, color: Colors.white54, fontFamily: 'monospace')),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 8, children: [
                  _quick('Apply jobs', () => _task('apply jobs')),
                  _quick('Check CRM', () => _task('check CRM lead status')),
                  _quick('Coach Yagna', () => _task('coach Yagna: how is my 4-pillar flow?')),
                  _quick('Campaign', () => _task('generate campaign for shankarpally')),
                ]),
              ]),
            ),
            const SizedBox(height: 16),
            DesktopPreview(status: status, onCapture: () { _append('Capture → SOM [1][2][3] via Gateway /api/task'); setState(() => status = 'CAPTURED'); Future.delayed(const Duration(milliseconds: 1200), () => setState(() => status = 'IDLE')); }),
            const SizedBox(height: 16),
            // CRM + Jobs
            Row(children: [
              Expanded(child: _statCard('JOBS TODAY', '24', 'Naukri + LinkedIn', const Color(BangiConfig.panel))),
              const SizedBox(width: 10),
              Expanded(child: _statCard('CRM LEADS', '147', 'Hermes synced', const Color(BangiConfig.panel))),
              const SizedBox(width: 10),
              Expanded(child: _statCard('GATEWAY', ':8001', '/api + /ws', const Color(BangiConfig.gold), dark: true)),
            ]),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.08))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [const Text('Health', style: TextStyle(fontSize: 10, letterSpacing: 1, color: Color(BangiConfig.gold), fontWeight: FontWeight.w800, fontFamily: 'monospace')), const Spacer(), IconButton(onPressed: _openSettings, icon: const Icon(Icons.settings, size: 16, color: Colors.white54), tooltip: 'Gateway URL'), IconButton(onPressed: _refreshHealth, icon: const Icon(Icons.refresh, size: 16, color: Colors.white54))]),
                Text(health == null ? 'loading…' : health.toString().substring(0, health.toString().length > 220 ? 220 : health.toString().length), style: const TextStyle(fontSize: 9, color: Colors.white54, fontFamily: 'monospace')),
              ]),
            ),
            const SizedBox(height: 16),
            TaskBar(controller: input, busy: busy, onSubmit: () { final t = input.text; input.clear(); _task(t); }),
            const SizedBox(height: 10),
            Container(
              height: 160,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.10))),
              child: SingleChildScrollView(controller: logCtrl, child: Text(log, style: const TextStyle(fontSize: 10, color: Colors.white70, fontFamily: 'monospace'))),
            ),
            const SizedBox(height: 8),
            const Text('Gateway: uv run gateway :8001 • Backend: uv run bangi :8000 • Web: npm run dev :3000', style: TextStyle(fontSize: 9, color: Colors.white38, fontFamily: 'monospace')),
          ]),
        )),
      ]),
    );
  }

  Widget _quick(String label, VoidCallback onTap) => ActionChip(
        label: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(BangiConfig.ink))),
        backgroundColor: Colors.white,
        onPressed: onTap,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      );

  Widget _statCard(String k, String v, String sub, Color bg, {bool dark = false}) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: dark ? Colors.transparent : Colors.white.withOpacity(0.08))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(k, style: TextStyle(fontSize: 8, letterSpacing: 1.2, color: dark ? const Color(BangiConfig.ink).withOpacity(0.6) : const Color(BangiConfig.gold), fontWeight: FontWeight.w700, fontFamily: 'monospace')),
          const SizedBox(height: 4),
          Text(v, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: dark ? const Color(BangiConfig.ink) : Colors.white)),
          Text(sub, style: TextStyle(fontSize: 8, color: dark ? const Color(BangiConfig.ink).withOpacity(0.55) : Colors.white54, fontFamily: 'monospace')),
        ]),
      );
}
