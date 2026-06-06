import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/socket_service.dart';

final socketProvider =
    Provider<SocketService>((ref) {
  final socketService = SocketService();

  socketService.connect();

  return socketService;
});