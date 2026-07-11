import 'package:flutter/material.dart';

import 'card_back_widget.dart';
import 'turn_indicator.dart';

class PlayerSeatWidget extends StatelessWidget {
  final String username;

  final int cardsRemaining;

  final int tricksWon;

  final bool isCurrentTurn;

  final bool isDealer;

  final bool isWinningBidder;

  final bool isDisconnected;

  final bool isDisabled;

  final bool compact;

  const PlayerSeatWidget({
    super.key,
    required this.username,
    required this.cardsRemaining,
    required this.tricksWon,
    this.isCurrentTurn = false,
    this.isDealer = false,
    this.isWinningBidder = false,
    this.isDisconnected = false,
    this.isDisabled = false,
    this.compact = false,
  });

  Color get _borderColor {
    if (isDisconnected) {
      return Colors.red;
    }

    if (isDisabled) {
      return Colors.grey;
    }

    if (isCurrentTurn) {
      return Colors.amber;
    }

    return Colors.white24;
  }

  Color get _backgroundColor {
    if (isDisconnected) {
      return Colors.red.withOpacity(.18);
    }

    if (isDisabled) {
      return Colors.grey.withOpacity(.15);
    }

    return Colors.black.withOpacity(.25);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),

      width: compact ? 120 : 145,

      padding: const EdgeInsets.all(10),

      decoration: BoxDecoration(
        color: _backgroundColor,

        borderRadius: BorderRadius.circular(16),

        border: Border.all(color: _borderColor, width: 2),
      ),

      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          /// ==========================
          /// Player Name
          /// ==========================
          Text(
            username,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),

          const SizedBox(height: 6),

          /// ==========================
          /// Status Badges
          /// ==========================
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 4,
            runSpacing: 4,
            children: [
              if (isDealer)
                _badge(icon: Icons.casino, color: Colors.blue, label: "Dealer"),

              if (isWinningBidder)
                _badge(
                  icon: Icons.emoji_events,
                  color: Colors.orange,
                  label: "Bid",
                ),

              if (isDisconnected)
                _badge(
                  icon: Icons.wifi_off,
                  color: Colors.red,
                  label: "Offline",
                ),

              if (isDisabled)
                _badge(
                  icon: Icons.block,
                  color: Colors.grey,
                  label: "Disabled",
                ),
            ],
          ),

          const SizedBox(height: 10),

          /// ==========================
          /// Card Backs
          /// ==========================
          Wrap(
            alignment: WrapAlignment.center,
            spacing: -8,
            children: List.generate(
              cardsRemaining.clamp(0, 8).toInt(),
              (_) => const CardBackWidget(width: 24, height: 36),
            ),
          ),

          const SizedBox(height: 10),

          /// ==========================
          /// Tricks Counter
          /// ==========================
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.green.shade700,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              "🏆 $tricksWon",
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          const SizedBox(height: 10),

          /// ==========================
          /// Turn Indicator
          /// ==========================
          TurnIndicator(
            isMyTurn: isCurrentTurn,
            isDisabled: isDisabled,
            compact: true,
          ),
        ],
      ),
    );
  }

  Widget _badge({
    required IconData icon,
    required Color color,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),

          const SizedBox(width: 3),

          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
