export type Suit =
    | "HEARTS"
    | "DIAMONDS"
    | "CLUBS"
    | "SPADES"
    | "JOKER";

export type Rank =
    | "A"
    | "K"
    | "Q"
    | "J"
    | "10"
    | "9"
    | "8"
    | "7"
    | "6"
    | "5"
    | "4"
    | "3";

export interface Card {
    id: string;

    suit: Suit;

    rank: string;

    value: number;

    isJoker?: boolean;
}