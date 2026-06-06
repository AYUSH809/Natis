import 'package:flutter/material.dart';

class GameScreen extends StatelessWidget {
  final Map<String, dynamic> gameState;

  const GameScreen({super.key, required this.gameState});

  @override
  Widget build(BuildContext context) {
    final players = gameState['players'] as List<dynamic>?;

    return Scaffold(
      appBar: AppBar(title: const Text('Natis')),

      body: Padding(
        padding: const EdgeInsets.all(20),

        child: players == null
            ? Center(
                child: Text(gameState['message'] ?? 'Game failed to start'),
              )
            : Column(
                children: [
                  const SizedBox(height: 20),

                  const Text(
                    'MATCH STARTED',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 20),

                  Expanded(
                    child: ListView.builder(
                      itemCount: players.length,

                      itemBuilder: (_, index) {
                        final player = players[index];

                        return Card(
                          child: ListTile(
                            title: Text(player['username']),

                            subtitle: Text('Cards: ${player['cards'].length}'),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
