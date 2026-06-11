import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/socket_provider.dart';

import '../widgets/card_widget.dart';
import '../widgets/card_back_widget.dart';

class GameScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> gameState;

  const GameScreen({super.key, required this.gameState});

  @override
  ConsumerState<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends ConsumerState<GameScreen> {
  late Map<String, dynamic> gameState;

  @override
  void initState() {
    super.initState();

    gameState = Map<String, dynamic>.from(widget.gameState);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final socketService = ref.read(socketProvider);

      socketService.onBidUpdated((data) {
        if (!mounted) return;

        setState(() {
          gameState['highestBid'] = data['highestBid'];

          gameState['highestBidderId'] = data['highestBidderId'];

          gameState['currentBidderId'] = data['currentBidderId'];

          gameState['bidHistory'] = data['bidHistory'];
        });
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final myCards = List<Map<String, dynamic>>.from(gameState['myHand'] ?? []);

    final players = List<Map<String, dynamic>>.from(gameState['players'] ?? []);

    return Scaffold(
      backgroundColor: Colors.green[800],

      appBar: AppBar(title: const Text('Natis')),

      body: Column(
        children: [
          const SizedBox(height: 20),

          Text(
            'Players (${players.length})',
            style: const TextStyle(color: Colors.white, fontSize: 18),
          ),

          const SizedBox(height: 10),

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
                      Text(
                        'Player Left',
                        style: TextStyle(color: Colors.white),
                      ),
                      CardBackWidget(),
                    ],
                  ),
                ),

                Expanded(
                  flex: 2,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'TABLE',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 20),

                      Text(
                        gameState['phase']?.toString() ?? 'BIDDING',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                        ),
                      ),

                      const SizedBox(height: 10),

                      Text(
                        'Highest Bid: ${gameState['highestBid'] ?? 0}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 20),

                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        alignment: WrapAlignment.center,
                        children: [
                          ElevatedButton(
                            onPressed: () {},
                            child: const Text('Pass'),
                          ),

                          ElevatedButton(
                            onPressed: () {},
                            child: const Text('5'),
                          ),

                          ElevatedButton(
                            onPressed: () {},
                            child: const Text('6'),
                          ),

                          ElevatedButton(
                            onPressed: () {},
                            child: const Text('7'),
                          ),

                          ElevatedButton(
                            onPressed: () {},
                            child: const Text('8'),
                          ),

                          ElevatedButton(
                            onPressed: () {},
                            child: const Text('All Hand'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Text(
                        'Player Right',
                        style: TextStyle(color: Colors.white),
                      ),
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
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
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
