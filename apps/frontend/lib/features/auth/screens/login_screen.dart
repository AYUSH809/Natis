import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          onPressed: () async {
            final auth = ref.read(authServiceProvider);

            await auth.signInWithGoogle();
          },
          child: const Text('Sign In With Google'),
        ),
      ),
    );
  }
}
