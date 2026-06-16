import 'dart:convert';

import 'package:http/http.dart' as http;

class GameService {
  static const String baseUrl = 'http://localhost:3000';

  Future<Map<String, dynamic>> startMatch(String roomCode) async {
    final response = await http.post(
      Uri.parse('$baseUrl/game/start'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'roomCode': roomCode}),
    );

    print('STATUS: ${response.statusCode}');

    print('BODY: ${response.body}');

    if (response.statusCode != 200) {
      throw Exception(response.body);
    }

    return jsonDecode(response.body);
  }
}
