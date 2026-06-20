import { GameState } from "../types/game.types";

import { ALL_HAND_BID } from "./game-rules";
import { getActiveBidders } from "./bidding.utils";

export function isBiddingComplete(
    gameState: GameState
) {
    if (
        gameState.highestBid ===
        ALL_HAND_BID
    ) {
        return true;
    }

    const activePlayers =
        getActiveBidders(gameState);

    return activePlayers.length <= 1;
}
