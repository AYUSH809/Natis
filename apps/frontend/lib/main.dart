import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'features/lobby/screens/lobby_screen.dart';
import 'firebase_options.dart';
import 'features/auth/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(const ProviderScope(child: NatisApp()));
}

class NatisApp extends StatelessWidget {
  const NatisApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Natis',
      debugShowCheckedModeBanner: false,

      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0B5D1E),
      ),

      home: const LobbyScreen(),
    );
  }
}
