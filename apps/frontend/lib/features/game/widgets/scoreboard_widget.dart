import 'package:flutter/material.dart';

class ScoreboardWidget extends StatelessWidget {
  final int teamAScore;
  final int teamBScore;

  final int teamATricks;
  final int teamBTricks;

  final int currentRound;

  final String phase;

  final String currentTurn;

  final int? highestBid;

  const ScoreboardWidget({
    super.key,
    required this.teamAScore,
    required this.teamBScore,
    required this.teamATricks,
    required this.teamBTricks,
    required this.currentRound,
    required this.phase,
    required this.currentTurn,
    this.highestBid,
  });

  Color _phaseColor() {
    switch (phase) {
      case 'BIDDING':
        return Colors.orange;

      case 'TRICK_SELECTION':
        return Colors.deepPurpleAccent;

      case 'PLAYING':
        return Colors.green;

      case 'SCORING':
        return Colors.blue;

      default:
        return Colors.white;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xff1D2B1F),

      elevation: 5,

      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),

      child: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          children: [
            const Text(
              "SCOREBOARD",
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 15),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,

              children: [
                _teamCard("TEAM A", teamAScore, teamATricks, Colors.blue),

                _teamCard("TEAM B", teamBScore, teamBTricks, Colors.red),
              ],
            ),

            const SizedBox(height: 18),

            Divider(color: Colors.white.withOpacity(.15)),

            const SizedBox(height: 12),

            _infoRow("Round", "$currentRound / 8"),

            _infoRow("Current Turn", currentTurn),

            _infoRow("Phase", phase, valueColor: _phaseColor()),

            if (phase == "BIDDING")
              _infoRow(
                "Highest Bid",
                highestBid?.toString() ?? "-",
                valueColor: Colors.amber,
              ),
          ],
        ),
      ),
    );
  }

  Widget _teamCard(String title, int score, int tricks, Color color) {
    return Container(
      width: 120,

      padding: const EdgeInsets.all(12),

      decoration: BoxDecoration(
        color: color.withOpacity(.15),

        borderRadius: BorderRadius.circular(15),

        border: Border.all(color: color),
      ),

      child: Column(
        children: [
          Text(
            title,
            style: TextStyle(color: color, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 8),

          Text(
            score.toString(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 8),

          Text(
            "Tricks : $tricks",
            style: const TextStyle(color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(
    String title,
    String value, {
    Color valueColor = Colors.white,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),

      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,

        children: [
          Text(
            title,
            style: const TextStyle(color: Colors.white70, fontSize: 15),
          ),

          Text(
            value,
            style: TextStyle(
              color: valueColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}
