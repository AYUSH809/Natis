export type Suit =
    | "SPADE"
    | "HEART"
    | "DIAMOND"
    | "CLUB"
    | "JOKER";

export type Team = "A" | "B";

export interface Card {
    id: string;

    suit: Suit;

    rank: string;

    value: number;

    isJoker?: boolean;
}

export interface PlayerHand {
    userId: string;

    username: string;

    team: Team;

    cards: Card[];

    roundsWon: number;

    disconnected?: boolean;
}

export interface BidState {
    currentBid: number;

    bidderId: string;

    passedPlayers: string[];

    trickSuit?: Suit;

    allHand?: boolean;
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
}