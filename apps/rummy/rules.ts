import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Score points by melding sets and runs, and avoid being caught holding cards when someone goes out. First to 500 wins.",
  "players": "2 to 6",
  "equipment": "A standard 52-card deck for up to four players. For five or more, shuffle two decks together. Jokers are optional.",
  "sections": [
    {
      "heading": "The deal",
      "blocks": [
        {
          "kind": "table",
          "table": {
            "columns": [
              "Players",
              "Cards each"
            ],
            "rows": [
              [
                "2",
                "10"
              ],
              [
                "3 to 4",
                "7"
              ],
              [
                "5 or more",
                "6"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Deal one card at a time. Place the rest face down as the stock and turn its top card face up beside it to start the discard pile. Deal passes to the left."
        }
      ]
    },
    {
      "heading": "Sets and runs",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "A set is three or more cards of the same rank — three Jacks, four Fives.",
            "A run is three or more consecutive cards of the same suit — 5-6-7 of hearts."
          ]
        },
        {
          "kind": "text",
          "text": "The ace is either high or low but never both: A-K-Q of spades is a run and so is A-2-3, but Q-K-A-2 is not."
        }
      ]
    },
    {
      "heading": "Taking a turn",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Draw the top card of the stock, or take cards from the discard pile (see below).",
            "Lay down any sets or runs you can, face up in front of you.",
            "Lay off single cards onto any meld already on the table — yours or anybody else's.",
            "Discard one card face up to end your turn."
          ]
        },
        {
          "kind": "text",
          "text": "Unlike many rummy games there is no minimum first meld, and you may lay down as little or as much as you like whenever you like."
        }
      ]
    },
    {
      "heading": "Taking from the discard pile",
      "blocks": [
        {
          "kind": "text",
          "text": "This is what makes 500 Rummy its own game, and it is the rule new players miss."
        },
        {
          "kind": "text",
          "text": "You may take any card from anywhere in the discard pile, not only the top one. But there is a price: you must also take every card lying above it, and you must immediately meld the card you were reaching for."
        },
        {
          "kind": "text",
          "text": "The cards above it go into your hand. That is the risk — they are yours now, and anything you cannot meld before the hand ends counts against you."
        },
        {
          "kind": "text",
          "text": "Because of this, the discard pile is spread out rather than squared up, so everyone can see what is in it."
        }
      ]
    },
    {
      "heading": "Ending a hand",
      "blocks": [
        {
          "kind": "text",
          "text": "The hand ends when a player melds or lays off their last card. A final discard is not required; you may go out with your last card melded."
        },
        {
          "kind": "text",
          "text": "If the stock runs out before anyone goes out, the hand ends there and everyone scores as normal."
        }
      ]
    },
    {
      "heading": "Scoring",
      "blocks": [
        {
          "kind": "text",
          "text": "Each player adds up the cards they melded on the table, then subtracts the cards still in their hand. A hand can easily come out negative."
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Card",
              "Points"
            ],
            "rows": [
              [
                "Ace melded high or in a set",
                "15"
              ],
              [
                "Ace in an A-2-3 run",
                "1"
              ],
              [
                "King, Queen, Jack, Ten",
                "10"
              ],
              [
                "Nine down to Two",
                "face value"
              ],
              [
                "Joker, if used",
                "15"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Keep a running total across hands. Play until someone reaches 500 — highest total wins."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Going out bonus. Some tables give the player who goes out a flat bonus.",
            "Discard required. Some require a final discard to go out.",
            "Jokers wild. Jokers can stand in for any card in a meld rather than scoring 15 in their own right.",
            "Aces always 15. Some score every melded ace at 15 regardless of position."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Enter one net total per player per hand — melds minus the cards left in hand. Negative numbers are accepted, and you will need them.",
    "The target is 500 by default and editable at setup."
  ]
};
