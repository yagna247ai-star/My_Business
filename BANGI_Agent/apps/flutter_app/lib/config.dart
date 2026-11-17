import 'dart:io' show Platform;

class BangiConfig {
  // Default gateway URL per platform
  static String defaultGatewayUrl() {
    // Android emulator localhost is 10.0.2.2
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:8001';
    } catch (_) {}
    return 'http://localhost:8001';
  }

  static const String appName = 'BANGI';
  static const String appSubtitle = 'HERMES-POWERED • HYBRID';
  // Antigravity
  static const int ink = 0xFF070A12;
  static const int gold = 0xFFC9A86A;
  static const int panel = 0xFF0F172A;
  static const int emerald = 0xFF10B981;
}
