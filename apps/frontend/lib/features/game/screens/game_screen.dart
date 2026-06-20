import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/socket_provider.dart';

import '../services/bid_service.dart';
import '../services/pass_service.dart';
import '../services/play_service.dart';

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

  final BidService bidService = BidService();
  final PassService passService = PassService();
  final PlayService playService = PlayService();

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

          gameState['phase'] = data['phase'];

          gameState['winningBidderId'] = data['winningBidderId'];

          gameState['winningBid'] = data['winningBid'];
        });
      });

      socketService.onSuitSelected((data) {
        if (!mounted) return;

        setState(() {
          gameState['trumpSuit'] = data['trumpSuit'];

          gameState['phase'] = data['phase'];

          gameState['currentPlayerTurn'] = data['currentPlayerTurn'];
        });
      });

      socketService.onCardPlayed((data) {
        if (!mounted) return;

        setState(() {
          gameState['tableCards'] = data['tableCards'];

          if (data['playerId'] == gameState['playerId']) {
            final cards = List<Map<String, dynamic>>.from(gameState['myHand']);

            cards.removeWhere((card) => card['id'] == data['card']['id']);

            gameState['myHand'] = cards;
          }
        });

        gameState['currentPlayerTurn'] = data['currentPlayerTurn'];
      });
    });
  }

  Future<void> submitBid(int bid) async {
    try {
      await bidService.placeBid(
        roomCode: gameState['roomCode'],
        playerId: gameState['playerId'],
        bid: bid,
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Future<void> submitPass() async {
    try {
      await passService.passBid(
        roomCode: gameState['roomCode'],
        playerId: gameState['playerId'],
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Future<void> playCard(String cardId) async {
    try {
      await playService.playCard(
        roomCode: gameState['roomCode'],

        playerId: gameState['playerId'],

        cardId: cardId,
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final myCards = List<Map<String, dynamic>>.from(gameState['myHand'] ?? []);

    final players = List<Map<String, dynamic>>.from(gameState['players'] ?? []);

    final myPlayerId = gameState['playerId'];

    final currentBidderId = gameState['currentBidderId'];

    final isMyTurn = myPlayerId == currentBidderId;

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

                      if (gameState['tableCards'] != null)
                        Wrap(
                          spacing: 10,
                          children:
                              List<Map<String, dynamic>>.from(
                                gameState['tableCards'],
                              ).map((entry) {
                                return CardWidget(card: entry['card']);
                              }).toList(),
                        ),

                      Text(
                        gameState['phase']?.toString() ?? 'BIDDING',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                        ),
                      ),

                      const SizedBox(height: 10),

                      Text(
                        'Current Bidder: ${gameState['currentBidderId'] ?? '-'}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),

                      Text(
                        'Me: $myPlayerId',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),

                      Text(
                        'Highest Bid: ${gameState['highestBid'] ?? 0}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      if (gameState['phase'] == 'TRICK_SELECTION')
                        Text(
                          'Winner: ${gameState['winningBidderId']}',
                          style: const TextStyle(
                            color: Colors.yellow,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),

                      if (gameState['phase'] == 'TRICK_SELECTION')
                        Text(
                          'Winning Bid: ${gameState['winningBid']}',
                          style: const TextStyle(
                            color: Colors.yellow,
                            fontSize: 18,
                          ),
                        ),

                      Text(
                        isMyTurn ? 'YOUR TURN' : 'WAITING...',
                        style: TextStyle(
                          color: isMyTurn ? Colors.yellow : Colors.white,
                          fontSize: 20,
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
                            onPressed: isMyTurn ? submitPass : null,
                            child: const Text('Pass'),
                          ),

                          ElevatedButton(
                            onPressed: isMyTurn ? () => submitBid(5) : null,
                            child: const Text('5'),
                          ),

                          ElevatedButton(
                            onPressed: isMyTurn ? () => submitBid(6) : null,
                            child: const Text('6'),
                          ),

                          ElevatedButton(
                            onPressed: isMyTurn ? () => submitBid(7) : null,
                            child: const Text('7'),
                          ),

                          ElevatedButton(
                            onPressed: isMyTurn ? () => submitBid(8) : null,
                            child: const Text('8'),
                          ),

                          ElevatedButton(
                            onPressed: isMyTurn ? () => submitBid(9) : null,
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
              itemBuilder: (_, index) {
                return GestureDetector(
                  onTap: () {
                    playCard(myCards[index]['id']);
                  },
                  child: CardWidget(card: myCards[index]),
                );
              },
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
