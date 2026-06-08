import 'package:flutter/material.dart';

class CardBackWidget extends StatelessWidget {
  const CardBackWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 45,
      height: 70,
      margin: const EdgeInsets.symmetric(horizontal: 2),
      decoration: BoxDecoration(
        color: Colors.blueGrey,
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }
}
