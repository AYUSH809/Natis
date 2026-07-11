import { Card, Suit } from "./card.types";

export type Team = "A" | "B";

export type GamePhase =
    | "BIDDING"
    | "TRICK_SELECTION"
    | "PLAYING"
    | "SCORING"
    | "MATCH_END";

export type BidValue =
    | 5
    | 6
    | 7
    | 8
    | 9;
export interface PlayerHand {
    userId:string;

    username:string;

    socketId:string;

    team:"A"|"B";

    cards:Card[];

    roundsWon:number;

    disabled:boolean;

    disconnected:boolean;
}

export interface BidState {
    currentBid: BidValue;
    bidderId: string;
    passedPlayers: string[];
    trickSuit?: Suit;
    allHand?: boolean;
    allHandPlayerId?: string;
}

export interface PlayedCard {
    userId: string;
    card: Card;
}

export interface RoundState {
    roundNumber: number;
    currentTurn: string;
    baseSuit?: Suit;
    playedCards: PlayedCard[];
    winnerId?: string;
}

export interface MatchScore {
    teamA: number;
    teamB: number;
}

export interface GameState {
    roomCode: string;
    maxPlayers: number;
    players: PlayerHand[];
    deck: Card[];
    currentDealerIndex: number;
    currentBidderIndex: number;
    bidState?: BidState;
    trickSuit?: Suit;
    trickRevealed: boolean;
    currentRound: number;
    rounds: RoundState[];
    score: MatchScore;
    matchStarted: boolean;
    matchEnded: boolean;
    createdAt: number;
    currentBid?: BidValue;
    highestBid?: BidValue;
    highestBidderId?: string;
    winningBidderId?: string;
    winningBid?: BidValue;
    trumpSuit?: Suit;
    passedPlayers: string[];
    phase: GamePhase;
    currentBidderId?: string;
    currentPlayerTurn?: string;
    tableCards: {
        playerId: string;
        card: Card;
    }[];
    selectedSuit?: Suit;
    teamATricks: number;
    teamBTricks: number;
    biddingTeam?: Team;
    allHand: boolean;
    allHandPlayerId?: string;
    disabledPlayerIds: string[];
    bidHistory: {
        playerId: string;
        bid: BidValue | "PASS";
    }[];
}

export type {
    Card,
    Suit,
};
