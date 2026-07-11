import 'dart:convert';

import 'package:http/http.dart' as http;

class PlayService {
  static const String baseUrl = 'http://localhost:3000';

  Future<void> playCard({
    required String roomCode,
    required String playerId,
    required String cardId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/game/play-card'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'roomCode': roomCode,
        'playerId': playerId,
        'cardId': cardId,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['message']);
    }
  }
}
