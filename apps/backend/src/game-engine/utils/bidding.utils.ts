import { GameState } from "../types/game.types";

export function moveToNextBidder(
    gameState: GameState
) {
    const currentIndex =
        gameState.players.findIndex(
            (player) =>
                player.userId ===
                gameState.currentBidderId
        );

    const nextIndex =
        (currentIndex + 1) %
        gameState.players.length;

    gameState.currentBidderId =
        gameState.players[
            nextIndex
        ].userId;
}