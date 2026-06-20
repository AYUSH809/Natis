import { GameState } from "../types/game.types";

import {
    ALL_HAND_BID,
    TOTAL_TRICKS,
} from "../utils/game-rules";

export class ScoringEngine {
    static calculateScore(
        gameState: GameState
    ) {
        if (
            !gameState.biddingTeam ||
            !gameState.winningBid
        ) {
            return;
        }

        const bidValue =
            gameState.winningBid;
        const tricksWon =
            gameState.biddingTeam === "A"
                ? gameState.teamATricks
                : gameState.teamBTricks;
        const requiredTricks =
            gameState.allHand
                ? TOTAL_TRICKS
                : bidValue;
        const success =
            tricksWon >= requiredTricks;
        const scoreDelta =
            bidValue === ALL_HAND_BID
                ? ALL_HAND_BID
                : bidValue;

        if (success) {
            if (
                gameState.biddingTeam === "A"
            ) {
                gameState.score.teamA +=
                    scoreDelta;
            } else {
                gameState.score.teamB +=
                    scoreDelta;
            }
            return;
        }

        if (
            gameState.biddingTeam === "A"
        ) {
            gameState.score.teamA -=
                scoreDelta * 2;
        } else {
            gameState.score.teamB -=
                scoreDelta * 2;
        }
    }
}
