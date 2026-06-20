import {
    GameState,
    BidValue,
} from "../types/game.types";

import {
    finalizeBidding,
    getActiveBidders,
    isValidBidValue,
    moveToNextBidder,
} from "../utils/bidding.utils";

import { isBiddingComplete } from "../utils/bid-completion.utils";

export class BiddingEngine {
    static placeBid(
        gameState: GameState,
        playerId: string,
        bid: number
    ) {
        if (gameState.phase !== "BIDDING") {
            throw new Error(
                "Bidding is closed"
            );
        }

        if (
            gameState.currentBidderId !==
            playerId
        ) {
            throw new Error(
                "Not your turn"
            );
        }

        if (
            gameState.passedPlayers.includes(
                playerId
            )
        ) {
            throw new Error(
                "Passed players cannot bid again"
            );
        }

        if (!isValidBidValue(bid)) {
            throw new Error(
                "Invalid bid value"
            );
        }

        if (
            bid <=
            (gameState.highestBid ?? 0)
        ) {
            throw new Error(
                "Bid must be higher"
            );
        }

        const normalizedBid =
            bid as BidValue;

        gameState.highestBid =
            normalizedBid;
        gameState.currentBid =
            normalizedBid;
        gameState.highestBidderId =
            playerId;
        gameState.bidHistory.push({
            playerId,
            bid: normalizedBid,
        });

        moveToNextBidder(
            gameState
        );

        if (
            isBiddingComplete(
                gameState
            )
        ) {
            finalizeBidding(
                gameState
            );
        }

        return gameState;
    }

    static passBid(
        gameState: GameState,
        playerId: string
    ) {
        if (gameState.phase !== "BIDDING") {
            throw new Error(
                "Bidding is closed"
            );
        }

        if (
            gameState.currentBidderId !==
            playerId
        ) {
            throw new Error(
                "Not your turn"
            );
        }

        if (
            gameState.passedPlayers.includes(
                playerId
            )
        ) {
            throw new Error(
                "Player already passed"
            );
        }

        const activePlayers =
            getActiveBidders(gameState);

        if (
            !gameState.highestBidderId &&
            activePlayers.length <= 2
        ) {
            throw new Error(
                "At least one bid is required before the final pass"
            );
        }

        gameState.passedPlayers.push(
            playerId
        );
        gameState.bidHistory.push({
            playerId,
            bid: "PASS",
        });

        moveToNextBidder(
            gameState
        );

        if (
            isBiddingComplete(
                gameState
            )
        ) {
            finalizeBidding(
                gameState
            );
        }

        return gameState;
    }
}
