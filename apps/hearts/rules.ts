import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Avoid taking points. Every heart costs one and the queen of spades costs thirteen. The lowest score when someone hits 100 wins — so this is a game you win by losing.",
  "players": "3 to 6, though four is the classic game.",
  "equipment": "A standard 52-card deck. Aces are high; there is no trump suit.",
  "sections": [
    {
      "heading": "The deal",
      "blocks": [
        {
          "kind": "text",
          "text": "With four players, deal all 52 cards out — thirteen each. With other numbers you need to remove low cards first so everyone gets the same amount:"
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Players",
              "Remove",
              "Cards each"
            ],
            "rows": [
              [
                "3",
                "2 of diamonds",
                "17"
              ],
              [
                "4",
                "nothing",
                "13"
              ],
              [
                "5",
                "2 of diamonds, 2 of clubs",
                "10"
              ],
              [
                "6",
                "2 and 3 of diamonds, 2 and 3 of clubs",
                "8"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Deal passes to the left each hand."
        }
      ]
    },
    {
      "heading": "Passing",
      "blocks": [
        {
          "kind": "text",
          "text": "Before anyone plays a card, each player chooses three cards from their hand and passes them face down to another player. You must choose and pass your own three before you look at the ones coming to you."
        },
        {
          "kind": "text",
          "text": "The direction rotates each hand: pass left, then right, then across, then a hand with no passing at all. Then it starts again."
        },
        {
          "kind": "text",
          "text": "With an odd number of players there is no across, so most tables cycle left, right, hold."
        }
      ]
    },
    {
      "heading": "Playing the tricks",
      "blocks": [
        {
          "kind": "text",
          "text": "The player holding the two of clubs leads it to the first trick. If it was removed for the player count, the lowest club leads instead."
        },
        {
          "kind": "steps",
          "items": [
            "Each player in turn plays one card, going clockwise.",
            "You must follow the suit led if you have it.",
            "If you have none of that suit, you may play anything — subject to the two restrictions below.",
            "The highest card of the suit that was led takes the trick. Cards of other suits cannot win, however high.",
            "Whoever took the trick leads the next one."
          ]
        },
        {
          "kind": "text",
          "text": "There is no trump suit. A spade does not beat a heart unless spades were led."
        }
      ]
    },
    {
      "heading": "Two restrictions worth knowing",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Nothing that scores may be played on the very first trick. No hearts, and not the queen of spades. If your hand is literally nothing but scoring cards, you may play them.",
            "Hearts must be broken before they can be led. Breaking hearts means someone has discarded a heart on a trick where they could not follow suit. Until that happens, you may not lead a heart. If hearts are all you hold, you may lead one."
          ]
        }
      ]
    },
    {
      "heading": "Scoring the hand",
      "blocks": [
        {
          "kind": "text",
          "text": "When all the tricks are played, each player looks at what they took."
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Card taken",
              "Points"
            ],
            "rows": [
              [
                "Each heart",
                "1"
              ],
              [
                "Queen of spades",
                "13"
              ],
              [
                "A whole hand",
                "26"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "The thirteen hearts and the queen come to exactly 26, so the four scores always add up to 26. If they do not, someone has miscounted."
        }
      ]
    },
    {
      "heading": "Shooting the moon",
      "blocks": [
        {
          "kind": "text",
          "text": "If a single player takes all thirteen hearts and the queen of spades, they have shot the moon. Rather than taking 26, they score nothing and every other player takes 26 instead."
        },
        {
          "kind": "text",
          "text": "It is the one time greed pays in Hearts. It is also brutally unforgiving — take twelve hearts and the queen and you score 25, the worst possible result."
        }
      ]
    },
    {
      "heading": "Ending the game",
      "blocks": [
        {
          "kind": "text",
          "text": "Keep playing hands until at least one player reaches 100 points. The game stops there and whoever has the lowest total wins."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Shooter subtracts. Instead of giving 26 to everyone, the shooter takes 26 off their own score.",
            "Jack of diamonds. The jack of diamonds is worth minus 10 to whoever takes it, making the hand worth 16 net.",
            "Queen breaks hearts. Playing the queen of spades also counts as breaking hearts.",
            "No passing on the first hand. Some tables start with a hold hand rather than a pass left."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "The app checks each hand against 26 and shows a running count as you type. A mismatch usually means a miscount, but you can still save it if your table plays a variant.",
    "Shooting the moon is a button rather than arithmetic. Tap it on the player who shot and the 26-to-everyone-else is applied for you; the entry boxes lock so a stale number cannot contradict it.",
    "This app implements the 26-to-everyone-else rule. The target is 100 by default and editable at setup."
  ]
};
