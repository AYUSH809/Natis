import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/socket_provider.dart';

import '../services/bid_service.dart';
import '../services/pass_service.dart';
import '../services/play_service.dart';

import '../widgets/bidding_panel.dart';
import '../widgets/hand_widget.dart';
import '../widgets/match_overlay.dart';
import '../widgets/scoreboard_widget.dart';
import '../widgets/table_widget.dart';
import '../widgets/turn_indicator.dart';

import 'match_summary_screen.dart';

class GameScreen extends ConsumerStatefulWidget {
  final String roomCode;

  final String userId;

  const GameScreen({super.key, required this.roomCode, required this.userId});

  @override
  ConsumerState<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends ConsumerState<GameScreen> {
  // ================================
  // SERVICES
  // ================================

  final BidService _bidService = BidService();

  final PassService _passService = PassService();

  final PlayService _playService = PlayService();

  // ================================
  // SOCKET
  // ================================

  dynamic _socket;

  // ================================
  // GAME STATE
  // ================================

  Map<String, dynamic> _gameState = {};

  // ================================
  // PLAYER DATA
  // ================================

  List<Map<String, dynamic>> _players = [];

  List<Map<String, dynamic>> _myCards = [];

  List<Map<String, dynamic>> _tableCards = [];

  // ================================
  // MATCH STATE
  // ================================

  String? _latestTrickWinner;

  bool _matchEnded = false;

  bool _loading = false;

  bool _connected = false;

  // ================================
  // COMPUTED GETTERS
  // ================================

  bool get isMyTurn => _gameState["currentPlayerTurn"] == widget.userId;

  bool get isDisabled =>
      _gameState["disabledPlayerIds"] != null &&
      (_gameState["disabledPlayerIds"] as List).contains(widget.userId);

  int get teamAScore => _gameState["score"]?["teamA"] ?? 0;

  int get teamBScore => _gameState["score"]?["teamB"] ?? 0;

  int get teamATricks => _gameState["teamATricks"] ?? 0;

  int get teamBTricks => _gameState["teamBTricks"] ?? 0;

  String? get trumpSuit => _gameState["trumpSuit"];

  int get currentRound => _gameState["currentRound"] ?? 1;

  int get currentDealerIndex => _gameState["currentDealerIndex"] ?? 0;

  String? get currentPlayerTurn => _gameState["currentPlayerTurn"];

  String? get winningBidderId => _gameState["winningBidderId"];

  bool get matchStarted => _gameState["matchStarted"] ?? false;

  String getUsername(String? userId) {
    if (userId == null) {
      return "";
    }

    final player = _players.firstWhere(
      (player) => player["userId"] == userId,
      orElse: () => {},
    );

    return player["username"] ?? "";
  }

  @override
  void initState() {
    super.initState();

    _initializeGame();
  }

  Future<void> _initializeGame() async {
    _socket = ref.read(socketProvider);

    _registerSocketListeners();

    _connected = true;
  }

  void _registerSocketListeners() {
    _socket.on("match_started", _onMatchStarted);
    _socket.on("bid_updated", _onBidUpdated);
    _socket.on("suit_selected", _onSuitSelected);
    _socket.on("card_played", _onCardPlayed);
    _socket.on("match_ended", _onMatchEnded);
    _socket.on("player_disconnected", _onPlayerDisconnected);
    _socket.on("player_reconnected", _onPlayerReconnected);
  }

  void _onMatchStarted(dynamic data) {
    final gameData = Map<String, dynamic>.from(data);

    _safeSetState(() {
      _refreshGameState(gameData);

      _matchEnded = false;

      _latestTrickWinner = null;
    });
  }

  void _onBidUpdated(dynamic data) {
    debugPrint("[SOCKET] bid_updated");

    final gameData = Map<String, dynamic>.from(data);

    _safeSetState(() {
      _refreshGameState(gameData);
    });
  }

  void _onSuitSelected(dynamic data) {
    debugPrint("[SOCKET] suit_selected");

    final gameData = Map<String, dynamic>.from(data);

    _safeSetState(() {
      _refreshGameState(gameData);
    });
  }

  void _onCardPlayed(dynamic data) {}

  void _onMatchEnded(dynamic data) {}

  void _onPlayerDisconnected(dynamic data) {}

  void _onPlayerReconnected(dynamic data) {}

  @override
  void dispose() {
    _socket.off("match_started");
    _socket.off("bid_updated");
    _socket.off("suit_selected");
    _socket.off("card_played");
    _socket.off("match_ended");
    _socket.off("player_disconnected");
    _socket.off("player_reconnected");

    super.dispose();
  }

  void _safeSetState(VoidCallback fn) {
    if (!mounted) {
      return;
    }

    setState(fn);
  }

  void _updateGameState(Map<String, dynamic> data) {
    _gameState = data;
  }

  void _extractCollections() {
    _players = List<Map<String, dynamic>>.from(_gameState["players"] ?? []);

    _myCards = List<Map<String, dynamic>>.from(_gameState["myHand"] ?? []);

    _tableCards = List<Map<String, dynamic>>.from(
      _gameState["tableCards"] ?? [],
    );
  }

  void _refreshGameState(Map<String, dynamic> data) {
    debugPrint("[STATE] Refreshing Game State");

    _updateGameState(data);

    _extractCollections();

    _matchEnded = _gameState["matchEnded"] ?? false;

    _latestTrickWinner = _gameState["trickWinnerId"];
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text("Game Screen")));
  }
}
