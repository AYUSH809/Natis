import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/room_service.dart';

final roomServiceProvider =
    Provider<RoomService>((ref) {
  return RoomService();
});