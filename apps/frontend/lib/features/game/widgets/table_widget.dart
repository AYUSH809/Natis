import 'package:flutter/material.dart';

import 'player_seat_widget.dart';
import 'trump_badge.dart';
import 'trick_banner.dart';
import 'card_widget.dart';

class TableWidget extends StatelessWidget {
  final List<Map<String, dynamic>> players;

  final List<Map<String, dynamic>> tableCards;

  final String? trumpSuit;

  final String? latestTrickWinner;

  final int currentRound;

  final int currentDealerIndex;

  final String? currentPlayerTurn;

  final String? winningBidderId;

  const TableWidget({
    super.key,
    required this.players,
    required this.tableCards,
    required this.trumpSuit,
    required this.latestTrickWinner,
    required this.currentRound,
    required this.currentDealerIndex,
    required this.currentPlayerTurn,
    required this.winningBidderId,
  });

  Map<String, dynamic>? _getPlayer(int index) {
    if (index < 0 || index >= players.length) {
      return null;
    }

    return players[index];
  }

  String _username(String? userId) {
    if (userId == null) return "";

    final player = players.cast<Map<String, dynamic>>().firstWhere(
      (p) => p["userId"] == userId,
      orElse: () => {},
    );

    return player["username"] ?? "";
  }

  bool _isDealer(String? userId) {
    if (userId == null) return false;

    if (currentDealerIndex >= players.length) {
      return false;
    }

    return players[currentDealerIndex]["userId"] == userId;
  }

  bool _isCurrentTurn(String? userId) {
    return currentPlayerTurn == userId;
  }

  bool _isWinningBidder(String? userId) {
    return winningBidderId == userId;
  }

  int _cardsRemaining(Map<String, dynamic> player) {
    if (player.containsKey("cardsRemaining")) {
      return player["cardsRemaining"] as int;
    }

    return 8;
  }

  Widget _playerSeat(Map<String, dynamic> player) {
    return PlayerSeatWidget(
      username: player["username"] ?? "",

      cardsRemaining: _cardsRemaining(player),

      tricksWon: player["roundsWon"] ?? 0,

      isCurrentTurn: _isCurrentTurn(player["userId"]),

      isDealer: _isDealer(player["userId"]),

      isWinningBidder: _isWinningBidder(player["userId"]),

      isDisconnected: player["disconnected"] ?? false,

      isDisabled: player["disabled"] ?? false,

      compact: true,
    );
  }

  Widget _buildHeader() {
    return const Column(
      children: [
        SizedBox(height: 15),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.casino, color: Colors.white, size: 22),

            SizedBox(width: 8),

            Text(
              "TABLE",
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
                letterSpacing: 1,
              ),
            ),
          ],
        ),

        SizedBox(height: 15),
      ],
    );
  }

  Widget _buildPlayedCards() {
    return Container(
      width: 190,
      height: 130,

      alignment: Alignment.center,

      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),

        border: Border.all(color: Colors.white24),
      ),

      child: tableCards.isEmpty
          ? const Text(
              "Waiting for first card...",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70),
            )
          : Stack(
              children: List.generate(tableCards.length, (index) {
                final offset = _playedCardOffset(index);

                return AnimatedPositioned(
                  duration: const Duration(milliseconds: 300),
                  left: offset.dx,
                  top: offset.dy,
                  child: CardWidget(card: tableCards[index]),
                );
              }),
            ),
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),

          decoration: BoxDecoration(
            color: Colors.black26,

            borderRadius: BorderRadius.circular(20),
          ),

          child: Text(
            "ROUND $currentRound / 8",

            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
            ),
          ),
        ),

        const SizedBox(height: 10),

        if (currentPlayerTurn != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),

            decoration: BoxDecoration(
              color: Colors.amber,

              borderRadius: BorderRadius.circular(18),
            ),

            child: Row(
              mainAxisSize: MainAxisSize.min,

              children: [
                const Icon(Icons.play_arrow, size: 18, color: Colors.black),

                const SizedBox(width: 6),

                Text(
                  "Turn: ${_username(currentPlayerTurn)}",
                  style: const TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 8),

        if (players.isNotEmpty && currentDealerIndex < players.length)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),

            decoration: BoxDecoration(
              color: Colors.blue,

              borderRadius: BorderRadius.circular(18),
            ),

            child: Row(
              mainAxisSize: MainAxisSize.min,

              children: [
                const Icon(Icons.casino, size: 18, color: Colors.white),

                const SizedBox(width: 6),

                Text(
                  "Dealer: ${players[currentDealerIndex]["username"]}",

                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildTableSurface() {
    return Container(
      constraints: const BoxConstraints(
        minWidth: 250,
        maxWidth: 320,
        minHeight: 220,
        maxHeight: 280,
      ),

      decoration: BoxDecoration(
        color: const Color(0xff2E7D32),

        borderRadius: BorderRadius.circular(28),

        border: Border.all(color: Colors.greenAccent, width: 2),

        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.45),
            blurRadius: 20,
            spreadRadius: 2,
            offset: const Offset(0, 8),
          ),
        ],
      ),

      child: Column(
        children: [
          _buildHeader(),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TrumpBadge(trumpSuit: trumpSuit),
          ),

          Expanded(child: Center(child: _buildPlayedCards())),

          _buildFooter(),
        ],
      ),
    );
  }

  Offset _playedCardOffset(int index) {
    switch (index) {
      case 0:
        return const Offset(60, 0);

      case 1:
        return const Offset(120, 40);

      case 2:
        return const Offset(60, 80);

      case 3:
        return const Offset(0, 40);

      default:
        return const Offset(60, 40);
    }
  }

  @override
  Widget build(BuildContext context) {
    final topPlayer = _getPlayer(2);

    final leftPlayer = _getPlayer(1);

    final rightPlayer = _getPlayer(3);
    return SizedBox(
      height: 500,
      child: Stack(
        children: [
          Align(
            alignment: const Alignment(0, 0.08),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),

              child: _buildTableSurface(),
            ),
          ),
          if (topPlayer != null) ...[
            Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _playerSeat(topPlayer),
              ),
            ),
          ],
          if (leftPlayer != null) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _playerSeat(leftPlayer),
              ),
            ),
          ],
          if (rightPlayer != null) ...[
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: _playerSeat(rightPlayer),
              ),
            ),
          ],
          TrickBanner(
            visible: latestTrickWinner != null,

            winnerName: _username(latestTrickWinner),

            roundNumber: currentRound > 1 ? currentRound - 1 : 1,
          ),
        ],
      ),
    );
  }
}
