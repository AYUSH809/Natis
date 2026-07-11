import 'package:flutter/material.dart';

class BiddingPanel extends StatelessWidget {
  final bool isMyTurn;

  final bool enabled;

  final int? highestBid;

  final ValueChanged<int> onBid;

  final VoidCallback onPass;

  const BiddingPanel({
    super.key,
    required this.isMyTurn,
    required this.enabled,
    required this.highestBid,
    required this.onBid,
    required this.onPass,
  });

  @override
  Widget build(BuildContext context) {
    final bool canInteract = enabled && isMyTurn;

    return Card(
      color: const Color(0xff1D2B1F),

      elevation: 5,

      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),

      child: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          mainAxisSize: MainAxisSize.min,

          children: [
            const Text(
              "BIDDING",
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 15),

            Text(
              "Current Highest Bid",
              style: TextStyle(color: Colors.grey[300]),
            ),

            const SizedBox(height: 5),

            Text(
              highestBid == null ? "-" : highestBid.toString(),
              style: const TextStyle(
                color: Colors.amber,
                fontWeight: FontWeight.bold,
                fontSize: 30,
              ),
            ),

            const SizedBox(height: 18),

            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                _buildPassButton(canInteract),

                _buildBidButton(5, canInteract),

                _buildBidButton(6, canInteract),

                _buildBidButton(7, canInteract),

                _buildBidButton(8, canInteract),

                _buildAllHandButton(canInteract),
              ],
            ),

            const SizedBox(height: 18),

            AnimatedContainer(
              duration: const Duration(milliseconds: 250),

              padding: const EdgeInsets.all(10),

              decoration: BoxDecoration(
                color: canInteract
                    ? Colors.green.withOpacity(.15)
                    : Colors.orange.withOpacity(.15),

                borderRadius: BorderRadius.circular(12),
              ),

              child: Row(
                mainAxisSize: MainAxisSize.min,

                children: [
                  Icon(
                    canInteract ? Icons.play_circle : Icons.hourglass_top,
                    color: canInteract ? Colors.green : Colors.orange,
                  ),

                  const SizedBox(width: 8),

                  Text(
                    canInteract ? "Your Turn" : "Waiting for Opponent",
                    style: TextStyle(
                      color: canInteract ? Colors.green : Colors.orange,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPassButton(bool enabled) {
    return SizedBox(
      width: 95,
      height: 45,

      child: ElevatedButton.icon(
        onPressed: enabled ? onPass : null,

        style: ElevatedButton.styleFrom(backgroundColor: Colors.grey.shade700),

        icon: const Icon(Icons.close),

        label: const Text("PASS"),
      ),
    );
  }

  Widget _buildBidButton(int bid, bool enabled) {
    final bool disabled = highestBid != null && bid <= highestBid!;

    return SizedBox(
      width: 70,
      height: 45,

      child: ElevatedButton(
        onPressed: enabled && !disabled ? () => onBid(bid) : null,

        style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),

        child: Text(
          bid.toString(),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
    );
  }

  Widget _buildAllHandButton(bool enabled) {
    final bool disabled = highestBid != null && highestBid! >= 9;

    return SizedBox(
      width: 120,
      height: 45,

      child: ElevatedButton.icon(
        onPressed: enabled && !disabled ? () => onBid(9) : null,

        style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple),

        icon: const Icon(Icons.emoji_events),

        label: const Text("ALL HAND"),
      ),
    );
  }
}
