import 'package:flutter/material.dart';

class TurnIndicator extends StatefulWidget {
  final bool isMyTurn;
  final bool isDisabled;
  final String? playerName;
  final bool compact;

  const TurnIndicator({
    super.key,
    required this.isMyTurn,
    this.isDisabled = false,
    this.playerName,
    this.compact = false,
  });

  @override
  State<TurnIndicator> createState() => _TurnIndicatorState();
}

class _TurnIndicatorState extends State<TurnIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _animation = Tween<double>(
      begin: 0.95,
      end: 1.08,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    if (widget.isMyTurn && !widget.isDisabled) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant TurnIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.isMyTurn && !widget.isDisabled) {
      if (!_controller.isAnimating) {
        _controller.repeat(reverse: true);
      }
    } else {
      _controller.stop();
      _controller.value = 1;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color get _backgroundColor {
    if (widget.isDisabled) {
      return Colors.grey.shade700;
    }

    return widget.isMyTurn ? Colors.green : Colors.grey.shade800;
  }

  Color get _borderColor {
    if (widget.isDisabled) {
      return Colors.grey;
    }

    return widget.isMyTurn ? Colors.amber : Colors.white24;
  }

  IconData get _icon {
    if (widget.isDisabled) {
      return Icons.block;
    }

    return widget.isMyTurn ? Icons.play_arrow_rounded : Icons.hourglass_top;
  }

  String get _title {
    if (widget.isDisabled) {
      return "DISABLED";
    }

    return widget.isMyTurn ? "YOUR TURN" : "WAITING";
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _animation,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),

        padding: EdgeInsets.symmetric(
          horizontal: widget.compact ? 10 : 18,
          vertical: widget.compact ? 6 : 10,
        ),

        decoration: BoxDecoration(
          color: _backgroundColor,

          borderRadius: BorderRadius.circular(30),

          border: Border.all(color: _borderColor, width: 2),

          boxShadow: widget.isMyTurn
              ? [
                  BoxShadow(
                    color: Colors.amber.withOpacity(.45),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                ]
              : [],
        ),

        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(_icon, color: Colors.white, size: widget.compact ? 16 : 22),

            SizedBox(width: widget.compact ? 5 : 8),

            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _title,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: widget.compact ? 11 : 15,
                  ),
                ),

                if (widget.playerName != null)
                  Text(
                    widget.playerName!,
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: widget.compact ? 9 : 12,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
