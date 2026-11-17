import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config.dart';

class BangiApi {
  String gatewayUrl;
  BangiApi({String? gatewayUrl}) : gatewayUrl = gatewayUrl ?? BangiConfig.defaultGatewayUrl();

  Future<void> loadSavedUrl() async {
    final p = await SharedPreferences.getInstance();
    final saved = p.getString('gateway_url');
    if (saved != null && saved.isNotEmpty) gatewayUrl = saved;
  }

  Future<void> saveUrl(String url) async {
    gatewayUrl = url;
    final p = await SharedPreferences.getInstance();
    await p.setString('gateway_url', url);
  }

  Uri _u(String path) => Uri.parse('$gatewayUrl$path');

  Future<Map<String, dynamic>> health() async {
    final r = await http.get(_u('/api/health'));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> task(String prompt) async {
    final r = await http.post(_u('/api/task'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'prompt': prompt}));
    if (r.statusCode != 200) throw Exception(r.body);
    return jsonDecode(r.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> report() async {
    final r = await http.get(_u('/api/hermes/report'));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> campaign(String corridorId) async {
    final r = await http.post(_u('/api/hermes/campaign'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'corridor_id': corridorId}));
    return jsonDecode(r.body) as Map<String, dynamic>;
  }

  /// Streaming via WS — calls onProgress for ack/progress/result
  WebSocketChannel connectWs({required void Function(Map<String, dynamic>) onMsg, void Function()? onDone}) {
    final wsUrl = gatewayUrl.replaceFirst(RegExp(r'^http'), 'ws') + '/ws';
    final ch = WebSocketChannel.connect(Uri.parse(wsUrl));
    ch.stream.listen((data) {
      try {
        final m = jsonDecode(data as String) as Map<String, dynamic>;
        onMsg(m);
        if (m['type'] == 'result' && onDone != null) onDone();
      } catch (_) {}
    }, onDone: onDone);
    return ch;
  }
}
