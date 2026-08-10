import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Be the first partnership to 5,000 points. Almost all of that comes from canastas — melds of seven or more cards — so the game is about building long melds rather than going out quickly.",
  "players": "4, in two partnerships sitting opposite each other. Two- and three-player versions exist. This scorekeeper handles up to four partnerships.",
  "equipment": "Two standard 52-card decks plus their four jokers, shuffled together — 108 cards.",
  "sections": [
    {
      "heading": "The deal",
      "blocks": [
        {
          "kind": "text",
          "text": "Deal eleven cards to each player. Place the rest face down as the stock and turn its top card face up beside it to start the discard pile."
        },
        {
          "kind": "text",
          "text": "If that turned-up card is a red three or a wild card, turn another on top of it — and the pile starts frozen (explained below)."
        },
        {
          "kind": "text",
          "text": "Before play begins, anyone holding a red three puts it face up on the table and draws a replacement from the stock."
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
                "Joker",
                "50"
              ],
              [
                "Ace, Two",
                "20"
              ],
              [
                "King down to Eight",
                "10"
              ],
              [
                "Seven down to Four, black Three",
                "5"
              ],
              [
                "Red Three",
                "100 bonus"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Jokers and twos are wild. Red threes are never melded — they sit face up in front of your partnership as a bonus. Black threes are almost dead cards; see below."
        }
      ]
    },
    {
      "heading": "Taking a turn",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Draw the top card of the stock, or take the entire discard pile if you are allowed to (see below).",
            "Meld if you wish — lay down new melds or add to your partnership's existing ones.",
            "Discard one card face up to end your turn."
          ]
        },
        {
          "kind": "text",
          "text": "Melds belong to the partnership, not the player. Either partner may add to any meld the team has down."
        }
      ]
    },
    {
      "heading": "Melding",
      "blocks": [
        {
          "kind": "text",
          "text": "A meld is three or more cards of the same rank. Suits do not matter. A meld may contain at most three wild cards, and must always have more natural cards than wild ones."
        },
        {
          "kind": "text",
          "text": "Your partnership's first meld of a hand must reach a minimum total value, and that minimum climbs as your score grows:"
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Your score at the start of the hand",
              "Minimum first meld"
            ],
            "rows": [
              [
                "Below zero",
                "15"
              ],
              [
                "0 to 1,495",
                "50"
              ],
              [
                "1,500 to 2,995",
                "90"
              ],
              [
                "3,000 and up",
                "120"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Only the card values in the melds themselves count toward that minimum — bonuses do not. You may combine several melds laid down in the same turn to reach it."
        },
        {
          "kind": "text",
          "text": "Black threes may only ever be melded on the turn you go out, and never with wild cards."
        }
      ]
    },
    {
      "heading": "The discard pile",
      "blocks": [
        {
          "kind": "text",
          "text": "Taking the pile is the heart of Canasta, and it is where most of the skill lives. You take the whole pile, not just the top card, so it can be enormous."
        },
        {
          "kind": "text",
          "text": "To take it you must always be able to use the top card immediately, in a meld you make on that same turn."
        },
        {
          "kind": "text",
          "text": "Whether you can take it depends on whether the pile is frozen:"
        },
        {
          "kind": "list",
          "items": [
            "An unfrozen pile can be taken if you can meld the top card using two matching cards from your hand, or by adding it to a meld your partnership already has down.",
            "A frozen pile can only be taken if you hold two natural cards of the same rank as the top card. Adding it to an existing meld is not enough."
          ]
        },
        {
          "kind": "text",
          "text": "The pile is frozen against your partnership until you have made your first meld. It is frozen against everybody if a wild card or a red three has been discarded onto it — turn that card sideways so it stays visible."
        },
        {
          "kind": "text",
          "text": "A black three on top of the pile blocks it, but only for the very next player."
        }
      ]
    },
    {
      "heading": "Canastas and going out",
      "blocks": [
        {
          "kind": "text",
          "text": "A meld of seven or more cards is a canasta. Square the pile up with a red card on top for a natural one and a black card on top for a mixed one."
        },
        {
          "kind": "list",
          "items": [
            "A natural canasta has no wild cards at all and scores 500.",
            "A mixed canasta has one to three wild cards and scores 300."
          ]
        },
        {
          "kind": "text",
          "text": "Your partnership must have completed at least one canasta before it may go out. Going out means playing every card in your hand, with or without a final discard. You may ask your partner's permission first, and you must abide by the answer."
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Bonus",
              "Points"
            ],
            "rows": [
              [
                "Natural canasta",
                "500"
              ],
              [
                "Mixed canasta",
                "300"
              ],
              [
                "Going out",
                "100"
              ],
              [
                "Going out concealed",
                "200"
              ],
              [
                "Each red three",
                "100"
              ],
              [
                "All four red threes",
                "800"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Concealed means you melded your entire hand in one turn, having never melded earlier in that hand — and your partnership had no melds down either."
        }
      ]
    },
    {
      "heading": "Scoring the hand",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Add up your canasta bonuses, the going-out bonus if you earned it, and your red threes.",
            "Add the point value of every card your partnership has melded.",
            "Subtract the value of every card left in both partners' hands."
          ]
        },
        {
          "kind": "text",
          "text": "A partnership that never got a meld down has its red threes counted against it rather than for it — so four red threes and no melds is minus 800."
        },
        {
          "kind": "text",
          "text": "The first partnership to 5,000 wins. If both cross in the same hand, the higher total takes it."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Going-out bonus. Some tables score 200 flat for going out rather than 100, or 300 concealed.",
            "Two-handed Canasta. Deal 15 cards, draw two at a time, and require two canastas to go out.",
            "Samba and Bolivia. Popular extensions that add sequence melds and change the target score."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Enter melded card points and cards left in hand as totals; tap the counters for canastas and red threes and the app does the arithmetic and shows its working.",
    "The red-three penalty is applied automatically when a team's melded points are zero.",
    "The minimum meld shown on each team's card is worked out from their score before the current hand, so it is always the figure you actually need.",
    "The scorekeeper does not track the discard pile or whether it is frozen — that stays at the table."
  ]
};
