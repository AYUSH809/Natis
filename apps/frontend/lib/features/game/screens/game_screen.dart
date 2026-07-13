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

  String get phase => _gameState["phase"] ?? "WAITING";

  bool get isWaiting => phase == "WAITING";

  bool get isBidding => phase == "BIDDING";

  bool get isSuitSelection => phase == "SUIT_SELECTION";

  bool get isPlaying => phase == "PLAYING";

  bool get isMatchFinished => _matchEnded;

  String get winningTeam {
    if (teamAScore > teamBScore) {
      return "A";
    }
    if (teamBScore > teamAScore) {
      return "B";
    }
    return "DRAW";
  }

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

    _safeSetState(() {
      _connected = true;
    });
  }

  void _registerSocketListeners() {
    _socket.onMatchStarted("match_started", _onMatchStarted);
    _socket.on((_) {
      _safeSetState(() {
        _connected = true;
      });
    });

    _socket.on((_) {
      _safeSetState(() {
        _connected = false;
      });
    });
    _socket.onBidUpdated("bid_updated", _onBidUpdated);
    _socket.onSuitSelected("suit_selected", _onSuitSelected);
    _socket.onCardPlayed("card_played", _onCardPlayed);
    _socket.onMatchEnded("match_ended", _onMatchEnded);
    _socket.onPlayerDisconnected("player_disconnected", _onPlayerDisconnected);
    _socket.onPlayerReconnected("player_reconnected", _onPlayerReconnected);
  }

  void _onMatchStarted(dynamic data) {
    debugPrint("========== MATCH START ==========");
    debugPrint(data.toString());

    _safeSetState(() {
      _refreshGameState(_payload(data));

      _matchEnded = false;
      _latestTrickWinner = null;
    });
  }

  void _onBidUpdated(dynamic data) {
    debugPrint("[SOCKET] bid_updated");
    _safeSetState(() {
      _refreshGameState(_payload(data));
    });
  }

  void _onSuitSelected(dynamic data) {
    debugPrint("[SOCKET] suit_selected");
    _safeSetState(() {
      _refreshGameState(_payload(data));
    });
  }

  void _onCardPlayed(dynamic data) {
    debugPrint("[SOCKET] card_played");
    _safeSetState(() {
      _refreshGameState(_payload(data));
    });
  }

  void _onMatchEnded(dynamic data) {
    debugPrint("[SOCKET] match_ended");
    _safeSetState(() {
      _refreshGameState(_payload(data));
      _matchEnded = true;
      debugPrint("[MATCH] Team A: $teamAScore");
      debugPrint("[MATCH] Team B: $teamBScore");
    });
  }

  void _onPlayerDisconnected(dynamic data) {}
  void _onPlayerReconnected(dynamic data) {}

  Future<void> submitBid(int bid) async {
    try {
      await _bidService.placeBid(
        roomCode: widget.roomCode,
        playerId: widget.userId,
        bid: bid,
      );
    } catch (e) {
      debugPrint("[API] submitBid: $e");
    }
  }

  Future<void> submitPass() async {
    try {
      await _passService.passBid(
        roomCode: widget.roomCode,
        playerId: widget.userId,
      );
    } catch (e) {
      debugPrint("[API] submitPass: $e");
    }
  }

  Future<void> playCard(String cardId) async {
    try {
      await _playService.playCard(
        roomCode: widget.roomCode,
        playerId: widget.userId,
        cardId: cardId,
      );
    } catch (e) {
      debugPrint("[API] playCard: $e");
    }
  }

  Future<void> selectSuit(String suit) async {
    debugPrint("[API] selectSuit: $suit");
  }

  void leaveMatch() {
    Navigator.pop(context);
  }

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
    debugPrint("========== REFRESH ==========");
    debugPrint(data.toString());

    _updateGameState(data);

    _extractCollections();

    _matchEnded = _gameState["matchEnded"] == true;

    _latestTrickWinner = _gameState["trickWinnerId"];

    debugPrint("PHASE = ${_gameState["phase"]}");
  }

  Map<String, dynamic> _payload(dynamic data) {
    return Map<String, dynamic>.from(data);
  }

  Widget _buildScoreboard() {
    return ScoreboardWidget(
      teamAScore: teamAScore,
      teamBScore: teamBScore,
      teamATricks: teamATricks,
      teamBTricks: teamBTricks,
      currentRound: currentRound,
      phase: phase,
      currentTurn: getUsername(currentPlayerTurn),
      highestBid: _gameState["highestBid"],
    );
  }

  Widget _buildTurnIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: TurnIndicator(
        isMyTurn: isMyTurn,
        isDisabled: isDisabled,
        playerName: getUsername(currentPlayerTurn),
      ),
    );
  }

  Widget _buildTable() {
    return TableWidget(
      players: _players,
      tableCards: _tableCards,
      trumpSuit: trumpSuit,
      latestTrickWinner: _latestTrickWinner,
      currentRound: currentRound,
      currentDealerIndex: currentDealerIndex,
      currentPlayerTurn: currentPlayerTurn,
      winningBidderId: winningBidderId,
    );
  }

  Widget _buildBiddingPanel() {
    if (!isBidding) {
      return const SizedBox.shrink();
    }

    return BiddingPanel(
      isMyTurn: isMyTurn,
      enabled: !isDisabled,
      highestBid: _gameState["highestBid"],
      onBid: submitBid,
      onPass: submitPass,
    );
  }

  Widget _buildHand() {
    if (!isPlaying) {
      return const SizedBox.shrink();
    }

    return HandWidget(
      cards: _myCards,

      enabled: isMyTurn,

      isDisabled: isDisabled,

      selectedCardId: null,

      onCardSelected: (card) {
        playCard(card["id"]);
      },
    );
  }

  Widget _buildOverlay() {
    return MatchOverlay(
      visible: isMatchFinished,
      teamAScore: teamAScore,
      teamBScore: teamBScore,
      teamATricks: teamATricks,
      teamBTricks: teamBTricks,
      trumpSuit: trumpSuit,
      winningBid: _gameState["highestBid"] ?? 0,
      onPlayAgain: () {
        debugPrint("Play Again");
      },
      onExitLobby: leaveMatch,
    );
  }

  Widget _buildLoadingOverlay() {
    if (!_loading) {
      return const SizedBox.shrink();
    }

    return const Positioned.fill(
      child: ColoredBox(
        color: Color(0x88000000),

        child: Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Widget _buildConnectionBanner() {
    if (_connected) {
      return const SizedBox.shrink();
    }

    return Positioned(
      top: 12,
      left: 12,
      right: 12,
      child: Material(
        color: Colors.red,

        borderRadius: BorderRadius.circular(12),

        child: const Padding(
          padding: EdgeInsets.all(12),

          child: Text(
            "Reconnecting...",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomPanel() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [_buildBiddingPanel(), _buildHand()],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1020),

      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _buildScoreboard(),
                _buildTurnIndicator(),
                Expanded(child: _buildTable()),
                _buildBottomPanel(),
              ],
            ),
            _buildOverlay(),
            _buildLoadingOverlay(),
            _buildConnectionBanner(),
          ],
        ),
      ),
    );
  }
}
