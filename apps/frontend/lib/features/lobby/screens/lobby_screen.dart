import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/room_provider.dart';
import 'room_waiting_screen.dart';

class LobbyScreen extends ConsumerStatefulWidget {
  const LobbyScreen({super.key});

  @override
  ConsumerState<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends ConsumerState<LobbyScreen> {
  late final String playerId;

  @override
  void initState() {
    super.initState();

    playerId = 'player_${Random().nextInt(999999)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Natis Lobby')),

      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () async {
                try {
                  final roomService = ref.read(roomServiceProvider);

                  final room = await roomService.createRoom(
                    hostId: playerId,
                    maxPlayers: 4,
                  );

                  if (!context.mounted) {
                    return;
                  }

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => RoomWaitingScreen(
                        room: room,
                        userId: playerId,
                        username: 'Host Player',
                      ),
                    ),
                  );
                } catch (e) {
                  debugPrint('Create room error: $e');

                  if (!context.mounted) {
                    return;
                  }

                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              },
              child: const Text('Create 4 Player Room'),
            ),

            const SizedBox(height: 20),

            ElevatedButton(
              onPressed: () async {
                try {
                  final roomService = ref.read(roomServiceProvider);

                  final room = await roomService.createRoom(
                    hostId: playerId,
                    maxPlayers: 6,
                  );

                  if (!context.mounted) {
                    return;
                  }

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => RoomWaitingScreen(
                        room: room,
                        userId: playerId,
                        username: 'Host Player',
                      ),
                    ),
                  );
                } catch (e) {
                  debugPrint('Create room error: $e');

                  if (!context.mounted) {
                    return;
                  }

                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              },
              child: const Text('Create 6 Player Room'),
            ),

            const SizedBox(height: 20),

            ElevatedButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => JoinRoomDialog(userId: playerId),
                );
              },
              child: const Text('Join Room'),
            ),
          ],
        ),
      ),
    );
  }
}

class JoinRoomDialog extends ConsumerStatefulWidget {
  final String userId;

  const JoinRoomDialog({super.key, required this.userId});

  @override
  ConsumerState<JoinRoomDialog> createState() => _JoinRoomDialogState();
}

class _JoinRoomDialogState extends ConsumerState<JoinRoomDialog> {
  final roomController = TextEditingController();

  final usernameController = TextEditingController();

  bool isLoading = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Join Room'),

      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: usernameController,
            decoration: const InputDecoration(hintText: 'Username'),
          ),

          const SizedBox(height: 20),

          TextField(
            controller: roomController,
            decoration: const InputDecoration(hintText: 'Room Code'),
          ),
        ],
      ),

      actions: [
        ElevatedButton(
          onPressed: isLoading
              ? null
              : () async {
                  try {
                    setState(() {
                      isLoading = true;
                    });

                    final roomService = ref.read(roomServiceProvider);

                    final room = await roomService.getRoom(
                      roomController.text.trim().toUpperCase(),
                    );

                    if (!context.mounted) {
                      return;
                    }

                    Navigator.pop(context);

                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RoomWaitingScreen(
                          room: room,
                          userId: widget.userId,
                          username: usernameController.text.trim(),
                        ),
                      ),
                    );
                  } catch (e) {
                    debugPrint('Join room error: $e');

                    if (!context.mounted) {
                      return;
                    }

                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(e.toString())));
                  } finally {
                    if (mounted) {
                      setState(() {
                        isLoading = false;
                      });
                    }
                  }
                },

          child: isLoading
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Join'),
        ),
      ],
    );
  }
}
