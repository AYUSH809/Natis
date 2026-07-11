import 'package:flutter/material.dart';

class CardBackWidget extends StatelessWidget {
  final double width;
  final double height;

  const CardBackWidget({super.key, this.width = 45, this.height = 70});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,

      margin: const EdgeInsets.symmetric(horizontal: 2),

      decoration: BoxDecoration(
        color: Colors.blueGrey.shade700,

        borderRadius: BorderRadius.circular(8),

        border: Border.all(color: Colors.white24),

        boxShadow: [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 3,
            offset: const Offset(1, 2),
          ),
        ],
      ),

      child: Center(
        child: Icon(Icons.style, color: Colors.white54, size: width * 0.35),
      ),
    );
  }
}
