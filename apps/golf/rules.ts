import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Finish with the lowest total, exactly like the real sport. You play nine or eighteen holes, and each hole is one deal.",
  "players": "2 to 8. Shuffle in a second deck beyond four players.",
  "equipment": "A standard 52-card deck. These are the rules for six-card golf, the most widely played form.",
  "terms": [
    {
      "term": "Layout",
      "meaning": "your six cards in two rows of three. It never grows or shrinks."
    },
    {
      "term": "Column",
      "meaning": "a vertical pair in your layout. Two cards of the same rank in a column cancel to zero."
    },
    {
      "term": "Hole",
      "meaning": "one full deal, scored and added up like a hole of golf."
    }
  ],
  "sections": [
    {
      "heading": "Setting up a hole",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Deal six cards to each player, face down, arranged in front of them in two rows of three.",
            "Nobody looks at their cards.",
            "Each player turns any two of their six face up and leaves them where they are.",
            "Turn the top card of the remaining stock face up to start the discard pile."
          ]
        },
        {
          "kind": "text",
          "text": "Your layout is always six cards. You never gain or lose cards — the whole game is about improving what already sits in front of you."
        }
      ]
    },
    {
      "heading": "Taking a turn",
      "blocks": [
        {
          "kind": "text",
          "text": "Starting to the dealer's left, on your turn you do one of two things:"
        },
        {
          "kind": "list",
          "items": [
            "Draw the top card of the stock. You may then swap it with any of your six cards — face up or face down — putting the card it replaces onto the discard pile face up. Or you may simply discard the card you drew and turn one of your face-down cards face up.",
            "Take the top card of the discard pile. If you do, you must swap it into your layout; you cannot take it and then throw it away."
          ]
        },
        {
          "kind": "text",
          "text": "A card you swap in stays face up. Play passes to the left."
        }
      ]
    },
    {
      "heading": "Card values",
      "blocks": [
        {
          "kind": "table",
          "table": {
            "columns": [
              "Card",
              "Points"
            ],
            "rows": [
              [
                "King",
                "0"
              ],
              [
                "Ace",
                "1"
              ],
              [
                "Two",
                "−2"
              ],
              [
                "Three through Ten",
                "face value"
              ],
              [
                "Jack, Queen",
                "10"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Kings are free and twos actively help you. Picture cards other than kings are what you are trying to get rid of."
        }
      ]
    },
    {
      "heading": "Cancelling pairs",
      "blocks": [
        {
          "kind": "text",
          "text": "If the two cards in the same column of your layout are the same rank, they cancel: that column scores zero regardless of what the cards would otherwise be worth."
        },
        {
          "kind": "text",
          "text": "A column of two Queens is worth nothing rather than twenty, which is the single biggest swing available. Two Twos cancel to zero as well — so they lose you the minus four, which is worth thinking about before you pair them up."
        },
        {
          "kind": "text",
          "text": "Only columns count, not rows, and not cards scattered elsewhere in the layout."
        }
      ]
    },
    {
      "heading": "Ending a hole",
      "blocks": [
        {
          "kind": "text",
          "text": "As soon as any player has all six of their cards face up, every other player gets exactly one more turn. Then everybody reveals their layout and totals it."
        },
        {
          "kind": "text",
          "text": "Add each hole to a running total. Play nine or eighteen holes; the lowest total wins."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Four-card golf. A 2×2 layout, one card turned up at the start. Faster, and the most common version for young children.",
            "Nine-card golf. A 3×3 layout, where rows, columns and diagonals can all cancel.",
            "Knocking. A player who thinks they are lowest can knock instead of playing; everyone else gets one turn and the knocker is penalised if they were wrong.",
            "Jokers at minus five. Some decks add jokers as the best card in the game.",
            "Penalty for going out first. Some tables double the score of the player who ended the hole if they were not lowest."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Choose nine or eighteen holes at setup.",
    "Negative hole scores are accepted, since twos and cancelled columns can easily put a player below zero.",
    "The four-, eight- and nine-card variants all score the same way — just enter the hole totals."
  ]
};
