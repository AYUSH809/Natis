import 'dart:async';

import 'package:flutter/material.dart';

class TrickBanner extends StatefulWidget {
  final String? winnerName;
  final int? roundNumber;
  final bool visible;
  final Duration duration;

  const TrickBanner({
    super.key,
    required this.winnerName,
    required this.roundNumber,
    required this.visible,
    this.duration = const Duration(seconds: 2),
  });

  @override
  State<TrickBanner> createState() => _TrickBannerState();
}

class _TrickBannerState extends State<TrickBanner>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  late final Animation<double> _fadeAnimation;

  late final Animation<double> _scaleAnimation;

  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    _scaleAnimation = Tween<double>(
      begin: .85,
      end: 1,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));

    if (widget.visible) {
      _showBanner();
    }
  }

  @override
  void didUpdateWidget(covariant TrickBanner oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.visible != oldWidget.visible) {
      if (widget.visible) {
        _showBanner();
      } else {
        _hideBanner();
      }
    }
  }

  void _showBanner() {
    _hideTimer?.cancel();

    _controller.forward();

    _hideTimer = Timer(widget.duration, () {
      if (mounted) {
        _hideBanner();
      }
    });
  }

  void _hideBanner() {
    _controller.reverse();
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.winnerName == null) {
      return const SizedBox.shrink();
    }

    return IgnorePointer(
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: Center(
            child: Container(
              width: 260,

              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),

              decoration: BoxDecoration(
                color: Colors.black.withOpacity(.88),

                borderRadius: BorderRadius.circular(20),

                border: Border.all(color: Colors.amber, width: 2),

                boxShadow: [
                  BoxShadow(
                    color: Colors.amber.withOpacity(.35),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),

              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.emoji_events, color: Colors.amber, size: 42),

                  const SizedBox(height: 10),

                  Text(
                    widget.roundNumber == null
                        ? "TRICK WON"
                        : "ROUND ${widget.roundNumber}",
                    style: const TextStyle(
                      color: Colors.white70,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                      fontSize: 13,
                    ),
                  ),

                  const SizedBox(height: 10),

                  const Text(
                    "Winner",
                    style: TextStyle(color: Colors.white60, fontSize: 15),
                  ),

                  const SizedBox(height: 4),

                  Text(
                    widget.winnerName!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 12),

                  const Divider(color: Colors.white24, thickness: 1),

                  const SizedBox(height: 8),

                  const Text(
                    "+1 Trick",
                    style: TextStyle(
                      color: Colors.greenAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
