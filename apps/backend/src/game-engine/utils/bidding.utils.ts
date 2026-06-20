import {
    BidValue,
    GameState,
} from "../types/game.types";

import { VALID_BIDS } from "./game-rules";

export function getActiveBidders(
    gameState: GameState
) {
    return gameState.players.filter(
        (player) =>
            !gameState.passedPlayers.includes(
                player.userId
            )
    );
}

export function isValidBidValue(
    bid: number
): bid is BidValue {
    return VALID_BIDS.includes(
        bid as BidValue
    );
}

export function moveToNextBidder(
    gameState: GameState
) {
    if (!gameState.currentBidderId) {
        return;
    }

    const currentIndex =
        gameState.players.findIndex(
            (player) =>
                player.userId ===
                gameState.currentBidderId
        );

    if (currentIndex === -1) {
        throw new Error(
            "Current bidder not found"
        );
    }

    for (
        let offset = 1;
        offset <= gameState.players.length;
        offset++
    ) {
        const nextIndex =
            (currentIndex + offset) %
            gameState.players.length;

        const nextPlayer =
            gameState.players[nextIndex];

        if (
            !gameState.passedPlayers.includes(
                nextPlayer.userId
            )
        ) {
            gameState.currentBidderId =
                nextPlayer.userId;
            return;
        }
    }

    gameState.currentBidderId =
        undefined;
}

export function finalizeBidding(
    gameState: GameState
) {
    if (
        !gameState.highestBidderId ||
        !gameState.highestBid
    ) {
        throw new Error(
            "Cannot finalize bidding without a winning bid"
        );
    }

    const winningPlayer =
        gameState.players.find(
            (player) =>
                player.userId ===
                gameState.highestBidderId
        );

    if (!winningPlayer) {
        throw new Error(
            "Winning bidder not found"
        );
    }

    gameState.phase =
        "TRICK_SELECTION";
    gameState.currentBidderId =
        undefined;
    gameState.winningBidderId =
        gameState.highestBidderId;
    gameState.winningBid =
        gameState.highestBid;
    gameState.biddingTeam =
        winningPlayer.team;
    gameState.allHand =
        gameState.highestBid === 9;
}
