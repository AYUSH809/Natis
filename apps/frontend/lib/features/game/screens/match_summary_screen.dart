import 'package:flutter/material.dart';

class MatchSummaryScreen extends StatelessWidget {
  final Map<String, dynamic> summary;

  const MatchSummaryScreen({super.key, required this.summary});

  @override
  Widget build(BuildContext context) {
    final score = Map<String, dynamic>.from(summary['score'] ?? {});

    return Scaffold(
      appBar: AppBar(title: const Text('Match Summary')),

      body: Padding(
        padding: const EdgeInsets.all(20),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [
            const Text(
              'MATCH FINISHED',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 30),

            Text(
              'Winning Bid: ${summary['winningBid']}',
              style: const TextStyle(fontSize: 18),
            ),

            Text(
              'Bidding Team: ${summary['biddingTeam']}',
              style: const TextStyle(fontSize: 18),
            ),

            Text(
              'All Hand: ${summary['allHand']}',
              style: const TextStyle(fontSize: 18),
            ),

            const Divider(height: 40),

            Text(
              'Team A Tricks: ${summary['teamATricks']}',
              style: const TextStyle(fontSize: 18),
            ),

            Text(
              'Team B Tricks: ${summary['teamBTricks']}',
              style: const TextStyle(fontSize: 18),
            ),

            const Divider(height: 40),

            Text(
              'Team A Score: ${score['teamA']}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),

            Text(
              'Team B Score: ${score['teamB']}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),

            const Spacer(),

            SizedBox(
              width: double.infinity,

              child: ElevatedButton(
                onPressed: () {
                  Navigator.popUntil(context, (route) => route.isFirst);
                },

                child: const Text('Return To Lobby'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
