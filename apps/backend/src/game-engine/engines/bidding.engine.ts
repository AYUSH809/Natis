import { GameState } from "../types/game.types";
import { moveToNextBidder } from "../utils/bidding.utils";

export class BiddingEngine {
    static placeBid(
        gameState: GameState,
        playerId: string,
        bid: number
    ) {
        if (
            gameState.currentBidderId !==
            playerId
        ) {
            throw new Error(
                "Not your turn"
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

        gameState.highestBid =
            bid;

        gameState.currentBid =
            bid;

        gameState.highestBidderId =
            playerId;

        gameState.bidHistory.push({
            playerId,
            bid,
        });

        moveToNextBidder(
            gameState
        );

        return gameState;
    }

    static passBid(
        gameState: GameState,
        playerId: string
    ) {
        if (
            gameState.currentBidderId !==
            playerId
        ) {
            throw new Error(
                "Not your turn"
            );
        }

        if (
            !gameState.passedPlayers.includes(
                playerId
            )
        ) {
            gameState.passedPlayers.push(
                playerId
            );
        }

        gameState.bidHistory.push({
            playerId,
            bid: "PASS",
        });

        moveToNextBidder(
            gameState
        );

        return gameState;
    }
}