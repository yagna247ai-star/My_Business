import 'package:flutter/material.dart';
import 'config.dart';
import 'api.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BangiApp());
}

class BangiApp extends StatelessWidget {
  const BangiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BANGI — Hermes-Powered',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(BangiConfig.ink),
        colorScheme: const ColorScheme.dark(
          primary: Color(BangiConfig.gold),
          surface: Color(BangiConfig.panel),
          background: Color(BangiConfig.ink),
        ),
        fontFamily: 'Inter',
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
