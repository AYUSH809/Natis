import 'package:flutter/material.dart';

class CardWidget extends StatelessWidget {
  final Map<String, dynamic> card;

  const CardWidget({super.key, required this.card});

  @override
  Widget build(BuildContext context) {
    final suit = card['suit'];
    final rank = card['rank'];

    return Container(
      width: 60,
      height: 90,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.black),
      ),
      child: Center(
        child: Text(
          '$rank\n$suit',
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
