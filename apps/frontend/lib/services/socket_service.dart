import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  late io.Socket socket;

  void connect() {
    socket = io.io(
      'http://localhost:3000',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .build(),
    );

    socket.onConnect((_) {
      print('✅ Connected to socket server');
    });

    socket.onDisconnect((_) {
      print('❌ Socket disconnected');
    });
  }

  void joinRoom({
    required String roomCode,
    required Map<String, dynamic> player,
  }) {
    socket.emit('join_room', {'roomCode': roomCode, 'player': player});
  }

  void onRoomUpdated(Function(dynamic) callback) {
    socket.on('room_updated', callback);
  }

  void onRoomError(Function(dynamic) callback) {
    socket.on('room_error', callback);
  }
}
