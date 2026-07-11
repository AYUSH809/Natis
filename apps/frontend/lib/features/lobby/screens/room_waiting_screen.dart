import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/socket_provider.dart';

import '../../game/services/game_service.dart';
import '../../game/screens/game_screen.dart';

class RoomWaitingScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> room;

  final String userId;

  final String username;

  const RoomWaitingScreen({
    super.key,
    required this.room,
    required this.userId,
    required this.username,
  });

  @override
  ConsumerState<RoomWaitingScreen> createState() => _RoomWaitingScreenState();
}

class _RoomWaitingScreenState extends ConsumerState<RoomWaitingScreen> {
  late Map<String, dynamic> room;

  bool isStartingMatch = false;

  @override
  void initState() {
    super.initState();

    room = widget.room;

    final socketService = ref.read(socketProvider);

    socketService.joinRoom(
      roomCode: room['roomCode'],
      player: {'userId': widget.userId, 'username': widget.username},
    );

    socketService.onRoomUpdated((updatedRoom) {
      if (!mounted) return;

      setState(() {
        room = Map<String, dynamic>.from(updatedRoom);
      });
    });

    socketService.onRoomError((error) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error['message'] ?? 'Room Error')));
    });

    socketService.onMatchStarted((_) {
      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) =>
              GameScreen(roomCode: room['roomCode'], userId: widget.userId),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final players = (room['players'] as List<dynamic>?) ?? [];

    final bool isHost = room['hostId'] == widget.userId;

    return Scaffold(
      appBar: AppBar(title: Text('Room ${room['roomCode']}')),

      body: Padding(
        padding: const EdgeInsets.all(20),

        child: Column(
          children: [
            Text(
              'Players Joined',
              style: Theme.of(context).textTheme.headlineSmall,
            ),

            const SizedBox(height: 20),

            Expanded(
              child: players.isEmpty
                  ? const Center(child: Text('Waiting for players...'))
                  : ListView.builder(
                      itemCount: players.length,
                      itemBuilder: (_, index) {
                        final player = players[index];

                        return Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              child: Text(
                                player['username']
                                    .toString()
                                    .substring(0, 1)
                                    .toUpperCase(),
                              ),
                            ),

                            title: Text(player['username']),

                            subtitle: Text('Team ${player['team']}'),
                          ),
                        );
                      },
                    ),
            ),

            const SizedBox(height: 20),

            Text(
              '${players.length}/${room['maxPlayers']} Players',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 20),

            ElevatedButton(
              onPressed:
                  players.length == room['maxPlayers'] &&
                      isHost &&
                      !isStartingMatch
                  ? () async {
                      try {
                        setState(() {
                          isStartingMatch = true;
                        });

                        final gameService = GameService();

                        // final gameState = await gameService.startMatch(
                        //   room['roomCode'],
                        // );

                        if (!context.mounted) {
                          return;
                        }

                        await gameService.startMatch(room['roomCode']);
                      } catch (error) {
                        if (!context.mounted) {
                          return;
                        }

                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(error.toString())),
                        );
                      } finally {
                        if (mounted) {
                          setState(() {
                            isStartingMatch = false;
                          });
                        }
                      }
                    }
                  : null,

              child: isStartingMatch
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(isHost ? 'Start Match' : 'Waiting for Host'),
            ),
          ],
        ),
      ),
    );
  }
}
