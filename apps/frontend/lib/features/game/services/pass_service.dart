import 'dart:convert';

import 'package:http/http.dart' as http;

class PassService {
  static const String baseUrl = 'http://localhost:3000';

  Future<void> passBid({
    required String roomCode,
    required String playerId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/game/pass'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'roomCode': roomCode, 'playerId': playerId}),
    );

    if (response.statusCode != 200) {
      throw Exception(response.body);
    }
  }
}
