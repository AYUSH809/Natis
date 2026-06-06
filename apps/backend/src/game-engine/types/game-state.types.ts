import { Card } from "./card.types";

export interface GameState {
    roomCode: string;

    phase:
    | "BIDDING"
    | "TRICK_SELECTION"
    | "PLAYING"
    | "SCORING";

    deck: Card[];

    hands: Record<
        string,
        Card[]
    >;

    currentPlayerId: string;

    roundNumber: number;
}