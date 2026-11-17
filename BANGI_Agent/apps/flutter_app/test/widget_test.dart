import 'package:flutter_test/flutter_test.dart';
import 'package:bangi_flutter/main.dart';

void main() {
  testWidgets('Bangi app loads', (tester) async {
    await tester.pumpWidget(const BangiApp());
    expect(find.textContaining('BANGI'), findsWidgets);
  });
}
