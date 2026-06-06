class RoomModel {
  final String roomCode;

  final int maxPlayers;

  RoomModel({
    required this.roomCode,
    required this.maxPlayers,
  });

  factory RoomModel.fromJson(
    Map<String, dynamic> json,
  ) {
    return RoomModel(
      roomCode: json['roomCode'],
      maxPlayers: json['maxPlayers'],
    );
  }
}