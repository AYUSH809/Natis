import 'package:flutter/material.dart';

import 'card_widget.dart';

class HandWidget extends StatefulWidget {
  final List<Map<String, dynamic>> cards;

  final bool enabled;

  final bool isDisabled;

  final ValueChanged<Map<String, dynamic>>? onCardSelected;

  final String? selectedCardId;

  const HandWidget({
    super.key,
    required this.cards,
    this.enabled = true,
    this.isDisabled = false,
    this.onCardSelected,
    this.selectedCardId,
  });

  @override
  State<HandWidget> createState() => _HandWidgetState();
}

class _HandWidgetState extends State<HandWidget> {
  String? selectedCardId;

  @override
  void initState() {
    super.initState();

    selectedCardId = widget.selectedCardId;
  }

  @override
  void didUpdateWidget(covariant HandWidget oldWidget) {
    super.didUpdateWidget(oldWidget);

    selectedCardId = widget.selectedCardId;
  }

  void _selectCard(Map<String, dynamic> card) {
    if (!widget.enabled) return;

    if (widget.isDisabled) return;

    setState(() {
      selectedCardId = card['id'];
    });

    widget.onCardSelected?.call(card);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cards.isEmpty) {
      return const Center(
        child: Text(
          "No Cards",
          style: TextStyle(color: Colors.white70, fontSize: 18),
        ),
      );
    }

    return IgnorePointer(
      ignoring: !widget.enabled || widget.isDisabled,

      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 250),
        opacity: widget.isDisabled ? .4 : 1,
        child: SizedBox(
          height: 140,

          child: ListView.builder(
            scrollDirection: Axis.horizontal,

            padding: const EdgeInsets.symmetric(horizontal: 12),

            itemCount: widget.cards.length,

            itemBuilder: (context, index) {
              final card = widget.cards[index];

              final isSelected = selectedCardId == card['id'];

              return GestureDetector(
                onTap: () => _selectCard(card),

                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),

                  curve: Curves.easeOut,

                  margin: EdgeInsets.only(
                    top: isSelected ? 0 : 18,
                    bottom: isSelected ? 18 : 0,
                    right: 8,
                  ),

                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),

                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: Colors.yellow.withOpacity(.7),
                              blurRadius: 14,
                              spreadRadius: 2,
                            ),
                          ]
                        : [],
                  ),

                  child: CardWidget(card: card),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
