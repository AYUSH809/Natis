export const STANDARD_SUITS = [
    "SPADES",
    "HEARTS",
    "DIAMONDS",
    "CLUBS"
] as const;

export const SUITS = [
    ...STANDARD_SUITS,
    "JOKER",
] as const;

export type StandardSuit =
    (typeof STANDARD_SUITS)[number];

export type Suit =
    (typeof SUITS)[number];

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
