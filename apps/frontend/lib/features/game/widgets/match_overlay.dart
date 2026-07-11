import 'package:flutter/material.dart';

class MatchOverlay extends StatelessWidget {
  final bool visible;

  final int teamAScore;

  final int teamBScore;

  final int teamATricks;

  final int teamBTricks;

  final String? trumpSuit;

  final int winningBid;

  final VoidCallback onPlayAgain;

  final VoidCallback onExitLobby;

  const MatchOverlay({
    super.key,

    required this.visible,

    required this.teamAScore,

    required this.teamBScore,

    required this.teamATricks,

    required this.teamBTricks,

    required this.trumpSuit,

    required this.winningBid,

    required this.onPlayAgain,

    required this.onExitLobby,
  });

  String get winner {
    if (teamAScore > teamBScore) {
      return "Team A";
    }

    if (teamBScore > teamAScore) {
      return "Team B";
    }

    return "Draw";
  }

  @override
  Widget build(BuildContext context) {
    if (!visible) {
      return const SizedBox.shrink();
    }

    return Positioned.fill(
      child: Container(
        color: Colors.black54,

        child: Center(
          child: Container(
            width: 360,

            padding: const EdgeInsets.all(24),

            decoration: BoxDecoration(
              color: Colors.white,

              borderRadius: BorderRadius.circular(20),

              boxShadow: const [
                BoxShadow(
                  blurRadius: 18,
                  color: Colors.black26,
                  offset: Offset(0, 8),
                ),
              ],
            ),

            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.emoji_events, color: Colors.amber, size: 70),

                const SizedBox(height: 12),

                const Text(
                  "MATCH OVER",
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 16),

                Text(
                  winner == "Draw" ? "It's a Draw!" : "$winner Wins!",
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: winner == "Draw" ? Colors.orange : Colors.green,
                  ),
                ),

                const SizedBox(height: 20),

                Text(
                  "Final Score",
                  style: Theme.of(context).textTheme.titleMedium,
                ),

                const SizedBox(height: 8),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [const Text("Team A"), Text("$teamAScore")],
                ),

                const SizedBox(height: 6),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [const Text("Team B"), Text("$teamBScore")],
                ),

                const Divider(),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [const Text("Team A Tricks"), Text("$teamATricks")],
                ),

                const SizedBox(height: 6),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [const Text("Team B Tricks"), Text("$teamBTricks")],
                ),

                const Divider(),

                Text("Winning Bid : $winningBid"),

                Text("Trump : ${trumpSuit ?? "-"}"),

                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onPlayAgain,
                    child: const Text("Play Again"),
                  ),
                ),

                const SizedBox(height: 10),

                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: onExitLobby,
                    child: const Text("Exit Lobby"),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
