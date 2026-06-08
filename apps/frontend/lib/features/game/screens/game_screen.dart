import 'package:flutter/material.dart';

import '../widgets/card_widget.dart';
import '../widgets/card_back_widget.dart';

class GameScreen extends StatelessWidget {
  final Map<String, dynamic> gameState;

  const GameScreen({super.key, required this.gameState});

  @override
  Widget build(BuildContext context) {
    final hands = gameState['hands'] as Map<String, dynamic>;

    final currentPlayerId = gameState['currentPlayerId'];

    final myCards = List<Map<String, dynamic>>.from(
      hands[currentPlayerId] ?? [],
    );

    return Scaffold(
      backgroundColor: Colors.green[800],

      appBar: AppBar(title: const Text('Natis')),

      body: Column(
        children: [
          const SizedBox(height: 20),

          const Text('Player 2', style: TextStyle(color: Colors.white)),

          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CardBackWidget(),
              CardBackWidget(),
              CardBackWidget(),
              CardBackWidget(),
              CardBackWidget(),
            ],
          ),

          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Text('Player 4', style: TextStyle(color: Colors.white)),
                      CardBackWidget(),
                    ],
                  ),
                ),

                Expanded(
                  flex: 2,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Text(
                        'TABLE',
                        style: TextStyle(color: Colors.white, fontSize: 22),
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Text('Player 3', style: TextStyle(color: Colors.white)),
                      CardBackWidget(),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(color: Colors.white),

          const Text(
            'YOUR HAND',
            style: TextStyle(color: Colors.white, fontSize: 18),
          ),

          const SizedBox(height: 10),

          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: myCards.length,
              itemBuilder: (_, index) => CardWidget(card: myCards[index]),
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
