import 'dart:convert';

import 'package:http/http.dart' as http;

class RoomService {
  static const String baseUrl = 'http://localhost:3000';

  Future<Map<String, dynamic>> createRoom({
    required String hostId,
    required int maxPlayers,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rooms/create'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'hostId': hostId, 'maxPlayers': maxPlayers}),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> getRoom(String roomCode) async {
    final response = await http.get(Uri.parse('$baseUrl/rooms/$roomCode'));

    return jsonDecode(response.body);
  }
}
