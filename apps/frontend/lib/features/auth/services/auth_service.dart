import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  Future<UserCredential> signInWithGoogle() async {
    await _googleSignIn.initialize();

    final GoogleSignInAccount? googleUser = await _googleSignIn.authenticate();

    if (googleUser == null) {
      throw Exception('Google Sign In Cancelled');
    }

    final googleAuth = googleUser.authentication;

    final credential = GoogleAuthProvider.credential(
      idToken: googleAuth.idToken,
    );

    return await _auth.signInWithCredential(credential);
  }

  Future<void> logout() async {
    await _auth.signOut();

    await _googleSignIn.signOut();
  }
}
