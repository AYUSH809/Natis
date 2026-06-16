import 'dart:convert';

import 'package:http/http.dart' as http;

class BidService {
  Future<void> placeBid({
    required String roomCode,
    required String playerId,
    required int bid,
  }) async {
    final response = await http.post(
      Uri.parse('http://localhost:3000/game/bid'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'roomCode': roomCode,
        'playerId': playerId,
        'bid': bid,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(response.body);
    }
  }
}
