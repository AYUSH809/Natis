import 'package:flutter/material.dart';

class TrumpBadge extends StatelessWidget {
  final String? trumpSuit;

  const TrumpBadge({super.key, required this.trumpSuit});

  bool get _isNoTrump => trumpSuit == null || trumpSuit == "JOKER";

  Color get _badgeColor {
    switch (trumpSuit) {
      case "HEARTS":
        return Colors.red;

      case "DIAMONDS":
        return Colors.deepOrange;

      case "CLUBS":
        return Colors.green;

      case "SPADES":
        return Colors.black87;

      case "JOKER":
        return Colors.deepPurple;

      default:
        return Colors.grey;
    }
  }

  IconData get _icon {
    switch (trumpSuit) {
      case "HEARTS":
        return Icons.favorite;

      case "DIAMONDS":
        return Icons.diamond;

      case "CLUBS":
        return Icons.eco;

      case "SPADES":
        return Icons.change_history;

      case "JOKER":
        return Icons.auto_awesome;

      default:
        return Icons.help_outline;
    }
  }

  String get _title {
    if (_isNoTrump) {
      return "NO TRUMP";
    }

    return "TRUMP";
  }

  String get _subtitle {
    if (_isNoTrump) {
      return "JOKER MODE";
    }

    return trumpSuit!;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),

      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),

      decoration: BoxDecoration(
        color: _badgeColor,

        borderRadius: BorderRadius.circular(30),

        boxShadow: [
          BoxShadow(
            color: _badgeColor.withOpacity(.45),
            blurRadius: 12,
            spreadRadius: 1,
          ),
        ],
      ),

      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_icon, color: Colors.white, size: 22),

          const SizedBox(width: 10),

          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _title,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),

              Text(
                _subtitle,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
