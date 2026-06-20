import { GameState } from "../types/game.types";

export class GamePayloadService {
    static buildPlayerState(
        gameState: GameState,
        playerId: string
    ) {
        const player =
            gameState.players.find(
                (entry) =>
                    entry.userId === playerId
            );

        if (!player) {
            throw new Error(
                "Player not found in game state"
            );
        }

        return {
            roomCode:
                gameState.roomCode,
            playerId,
            myHand: player.cards,
            players:
                gameState.players.map(
                    (entry) => ({
                        userId:
                            entry.userId,
                        username:
                            entry.username,
                        team:
                            entry.team,
                        roundsWon:
                            entry.roundsWon,
                        disabled:
                            entry.disabled ??
                            false,
                        disconnected:
                            entry.disconnected ??
                            false,
                    })
                ),
            maxPlayers:
                gameState.maxPlayers,
            phase:
                gameState.phase,
            highestBid:
                gameState.highestBid,
            highestBidderId:
                gameState.highestBidderId,
            currentBidderId:
                gameState.currentBidderId,
            winningBidderId:
                gameState.winningBidderId,
            winningBid:
                gameState.winningBid,
            biddingTeam:
                gameState.biddingTeam,
            trumpSuit:
                gameState.trumpSuit,
            selectedSuit:
                gameState.selectedSuit,
            bidHistory:
                gameState.bidHistory,
            currentPlayerTurn:
                gameState.currentPlayerTurn,
            currentRound:
                gameState.currentRound,
            rounds:
                gameState.rounds,
            tableCards:
                gameState.tableCards,
            score:
                gameState.score,
            teamATricks:
                gameState.teamATricks,
            teamBTricks:
                gameState.teamBTricks,
            matchEnded:
                gameState.matchEnded,
            allHand:
                gameState.allHand,
            disabledPlayerIds:
                gameState.disabledPlayerIds,
        };
    }
}
