import { GameState } from "../types/game.types";

export function isBiddingComplete(
    gameState: GameState
) {
    const activePlayers =
        gameState.players.filter(
            player =>
                !gameState.passedPlayers.includes(
                    player.userId
                )
        );

    return activePlayers.length <= 1;
}