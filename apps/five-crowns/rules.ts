import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Finish the eleven rounds with the lowest total. You only ever score the cards left in your hand, so the game is a race to get rid of everything.",
  "players": "2 to 7",
  "equipment": "A Five Crowns deck: 116 cards. It is two identical 58-card decks shuffled together. Each has five suits — stars, hearts, clubs, diamonds and spades — running 3 up to King, plus three jokers. So there are six jokers in all, and no aces or twos.",
  "sections": [
    {
      "heading": "The shape of the game",
      "blocks": [
        {
          "kind": "text",
          "text": "Five Crowns is eleven rounds long, and every round is slightly bigger than the last."
        },
        {
          "kind": "text",
          "text": "Round one deals three cards and threes are wild. Round two deals four cards and fours are wild. This continues up to round eleven, which deals thirteen cards with Kings wild. The wild rank always matches the number of cards in the hand."
        },
        {
          "kind": "text",
          "text": "Jokers are wild in every single round, on top of whatever rank is wild that time."
        }
      ]
    },
    {
      "heading": "Setting up a round",
      "blocks": [
        {
          "kind": "text",
          "text": "Shuffle and deal the right number of cards to each player, one at a time, starting to the dealer's left. Place the rest face down as the stock and turn its top card face up beside it to start the discard pile."
        },
        {
          "kind": "text",
          "text": "The deal passes to the left each round."
        }
      ]
    },
    {
      "heading": "Taking a turn",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Draw either the top card of the stock or the top card of the discard pile.",
            "Decide whether you can go out — see below.",
            "Discard one card face up to end your turn."
          ]
        },
        {
          "kind": "text",
          "text": "Play passes to the left. You hold your cards the whole time; there is no laying down partway through."
        }
      ]
    },
    {
      "heading": "Books and runs",
      "blocks": [
        {
          "kind": "text",
          "text": "You are trying to arrange your whole hand into two kinds of combination:"
        },
        {
          "kind": "list",
          "items": [
            "A book is three or more cards of the same rank — three Sevens, four Queens. In Five Crowns they may repeat suits, since there are two of every card.",
            "A run is three or more cards in sequence in a single suit — 5-6-7 of hearts. Runs do not wrap around; the King is the top and the 3 is the bottom."
          ]
        },
        {
          "kind": "text",
          "text": "Wild cards stand in for anything. A hand of 5-6-wild of stars is a legal run, and so is Queen-Queen-joker."
        }
      ]
    },
    {
      "heading": "Going out",
      "blocks": [
        {
          "kind": "text",
          "text": "Here is the rule that catches new players: you cannot lay down part of your hand. You may only lay down when every single card you hold fits into a book or a run."
        },
        {
          "kind": "text",
          "text": "When you can, lay the whole lot face up on your turn and discard your last card. That is going out, and it ends the round for everyone else."
        },
        {
          "kind": "text",
          "text": "Every other player then gets exactly one more turn. On that final turn they draw, lay down whatever valid books and runs they can make — and here partial melds are allowed — and discard. Whatever is still in their hand is what they score."
        }
      ]
    },
    {
      "heading": "Scoring",
      "blocks": [
        {
          "kind": "text",
          "text": "Melded cards are worth nothing. Only what remains in your hand counts against you."
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Card left in hand",
              "Points"
            ],
            "rows": [
              [
                "3 through 10",
                "face value"
              ],
              [
                "Jack",
                "11"
              ],
              [
                "Queen",
                "12"
              ],
              [
                "King",
                "13"
              ],
              [
                "The wild rank for that round",
                "20"
              ],
              [
                "Joker",
                "50"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "The player who went out scores zero. Add each round to a running total; after eleven rounds, lowest wins."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Laying off. Some tables let players add cards to the melds already on the table during their final turn. The published rules do not.",
            "Wild card value. A few tables score the round's wild rank at face value instead of 20.",
            "Joker value. Some play jokers at 20 rather than 50."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Enter one total per player per round — add up the cards left in hand and type the number.",
    "The player who went out scores zero.",
    "All eleven rounds are laid out as chips at the bottom, labelled by wild card. Tap any of them to go back and correct a score."
  ]
};
