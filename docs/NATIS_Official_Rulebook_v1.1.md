# NATIS Official Game Rules & Logic Specification (v1.1)

---

## 1. Core Architecture & System Dealer

* **Dealer Role**: The **System** acts as the automated Dealer. It manages card shuffling, RNG seeding, two-phase distribution, turn clocks, and authoritative rule validation.
* **Dealer Rotation Token**: While the System physically deals, a virtual "Dealer Token" rotates clockwise among player seats after each deal to establish the lead bidder (`Seat + 1`) and opening trick leader.
* **Modes**:
  * **4 Players**: Team A (Seats 1 & 3) vs Team B (Seats 2 & 4).
  * **6 Players**: Team A (Seats 1, 3, 5) vs Team B (Seats 2, 4, 6).

---

## 2. Deck Composition & Two-Phase Dealing Sequence

### A. Deck Breakdown (Always 8 Cards per Player = 8 Tricks per Match)
* **4-Player Match (32 Cards Total)**:
  * Hearts (♥): A–7 (8 cards)
  * Clubs (♣): A–7 (8 cards)
  * Diamonds (♦): A–7 (8 cards)
  * Spades (♠): A–8 (7 cards)
  * 1 Joker
* **6-Player Match (48 Cards Total)**:
  * Hearts (♥): A–3 (12 cards)
  * Clubs (♣): A–3 (12 cards)
  * Diamonds (♦): A–3 (12 cards)
  * Spades (♠): A–4 (11 cards)
  * 1 Joker
* *Note: Spades always has 1 fewer card than the other suits to maintain total card count with the 1 Joker.*

### B. Two-Phase Deal & Bidding Flow
```
[Phase 1 Deal] -> 4 cards dealt to each player
       ↓
[Bidding Phase] -> Clockwise starting at (Virtual Dealer + 1)
       ↓
[Trump Selection] -> Highest Bidder selects hidden Trick Suit
       ↓
[Phase 2 Deal] -> Remaining 4 cards dealt to each player (Hands now 8 cards)
       ↓
[Tricks (Rounds 1–8)] -> Play out 8 tricks
```

---

## 3. Bidding Rules & Scoring Math

* **Bid Range**: Minimum bid is **5**, Maximum bid is **8**.
* **Bidding Progression**:
  * Starts at `Virtual Dealer + 1` and proceeds clockwise.
  * Players may either raise (bid higher than current highest bid) or Pass.
  * **UI Display**: Only the **current highest bid** is displayed to the next player in line.
  * If all players pass initially, the virtual dealer defaults to the contract at the minimum bid of **5**.
* **Contract Winner**: Becomes the Contract Player and selects the hidden Trick Suit based on their first 4 cards.
* **Scoring Rules**:
  * **Success** (Contracting team wins >= bid tricks): **`+bid` points**.
  * **Failure** (Contracting team wins < bid tricks): **`-(2 * bid)` points** (Twice the bid deducted as penalty).
  * Scores can be **negative**.
  * Scoring is calculated and accumulated strictly at the **Team level**.

---

## 4. Trick Suit (Trump), Reveal Mechanic & Dissolution

* **Hidden Trump**: Only the contract winner knows the Trick Suit initially.
* **Reveal Condition**:
  * A player whose turn it is may click "Reveal Trump" **if and only if they do not hold any card of the ongoing trick's Base Suit** (void in Base Suit).
* **Action Post-Reveal**:
  * If the revealing player **holds any card of the revealed Trick Suit**, they are **strictly bound to play a Trick Suit card**.
  * If the revealing player **does not have any Trick Suit cards**, they may play any card of their choice.
  * Once revealed, the Trick Suit becomes visible to all players and retains trump power for the remainder of the match.
* **Match Dissolution Rule (Void Hand)**:
  * Upon revealing the Trick Suit, the server audits the initial deal:
  * If the **opposing team** (the team opposing the player who chose trump) was dealt **0 cards of the Trick Suit from the start** across all their team members, the match is **dissolved immediately** (Void hand: no points awarded or deducted; redeal initiated).

---

## 5. Joker Strategy & Special Modifiers

* **1 Game-Wide Joker**:
  1. **Trick 1 Prohibition**: The Joker **cannot be played at all during Round / Trick 1** of any match.
  2. **Cannot Establish Base Suit (Tricks 2–7)**: In Rounds 2–7, the Joker **cannot be played as the lead / opening card** of a trick. It can never establish the Base Suit and can only be played as a follow-up card.
  3. **Bypass Suit-Following**: From Trick 2 to Trick 7, the Joker can be played as a follow-up card at any time (even if the player holds cards of the Base Suit).
  4. **Strength (Tricks 2–7)**: Unconditionally defeats all normal cards and Trick Suit cards.
  5. **Last Round Degradation (Trick 8)**: If the Joker is held until the **last round (Trick 8)**, its power is degraded to the **7 of Spades** (`7♠`).
  6. **Joker as Trick Suit (No Trump)**: If Joker is chosen as Trump, no suit has trump power; Base Suit high-card rules govern.

---

## 6. "All Hand" Gambit

* **Eligibility**: Can be declared up to the end of Round 3, **provided the declarer's team has won ALL previous rounds in the match** (e.g. 1/1, 2/2, or 3/3).
* **Commitment**: The declaring player commits to winning **every remaining trick alone**.
* **Teammates Disabled**: Declaring player's teammates are benched for the rest of the match.
* **Stakes**:
  * **Success** (Player wins all remaining tricks): **`+8` points bonus**.
  * **Failure** (Opponents win even a single trick): **`-16` points penalty**.

---

## 7. Match vs Game Session & "End Game" CTA

* **Single Match**: Exactly **1 deal of 8 tricks**.
* **Consecutive Matches**: Matches continue infinitely one after another.
* **Data Retention**: Between subsequent matches, individual trick history is cleared; only the **cumulative summed-up team scores** are retained.
* **"End Game" CTA**:
  * Any player can click the "End Game" button at any time.
  * If clicked during an ongoing match, that match completes normally as the **final match**.
  * Once that match finishes, the session terminates and the **final team scores and match summary** are displayed.
