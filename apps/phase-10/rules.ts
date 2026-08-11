import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Be the first to complete all ten phases, in order. Your score is only a tiebreaker — it decides nothing unless two people finish in the same round.",
  "players": "2 to 6",
  "equipment": "A Phase 10 deck: 108 cards. Numbers 1 to 12 in four colours, two of each — 96 cards — plus eight Skip cards and four Wild cards.",
  "terms": [
    {
      "term": "Phase",
      "meaning": "the specific combination you must lay down this round. Everyone works through the same ten, in order."
    },
    {
      "term": "Set",
      "meaning": "cards of the same number. Colours are irrelevant."
    },
    {
      "term": "Run",
      "meaning": "consecutive numbers. Colours are irrelevant."
    },
    {
      "term": "Hitting",
      "meaning": "adding single cards to any phase already on the table — allowed only once your own phase is down."
    },
    {
      "term": "Going out",
      "meaning": "emptying your hand, which ends the round. Separate from completing your phase: you can do either without the other."
    }
  ],
  "sections": [
    {
      "heading": "The ten phases",
      "blocks": [
        {
          "kind": "text",
          "text": "Everyone starts on phase 1 and works up in order. You cannot skip ahead and you cannot attempt a later phase early, no matter what cards you are holding."
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Phase",
              "What you must lay down"
            ],
            "rows": [
              [
                "1",
                "2 sets of 3"
              ],
              [
                "2",
                "1 set of 3 + 1 run of 4"
              ],
              [
                "3",
                "1 set of 4 + 1 run of 4"
              ],
              [
                "4",
                "1 run of 7"
              ],
              [
                "5",
                "1 run of 8"
              ],
              [
                "6",
                "1 run of 9"
              ],
              [
                "7",
                "2 sets of 4"
              ],
              [
                "8",
                "7 cards of one colour"
              ],
              [
                "9",
                "1 set of 5 + 1 set of 2"
              ],
              [
                "10",
                "1 set of 5 + 1 set of 3"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "A set means cards of the same number, colour irrelevant — three 7s is a set of 3. A run means consecutive numbers, colour irrelevant — 4-5-6-7 is a run of 4. Phase 8 is the exception and cares only about colour, not numbers."
        }
      ]
    },
    {
      "heading": "The deal",
      "blocks": [
        {
          "kind": "text",
          "text": "Deal ten cards to each player, one at a time. Place the rest face down as the draw pile and turn its top card up to start the discard pile. Deal passes to the left each round."
        }
      ]
    },
    {
      "heading": "Taking a turn",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Draw one card: either the top of the draw pile or the top of the discard pile.",
            "If you can complete your current phase, lay it down face up in front of you. You may only do this once per round.",
            "If your phase is already down, you may hit — see below.",
            "Discard one card face up to end your turn."
          ]
        },
        {
          "kind": "text",
          "text": "Play passes to the left. If the draw pile runs out, shuffle the discard pile and turn it over to make a new one."
        }
      ]
    },
    {
      "heading": "Laying down and hitting",
      "blocks": [
        {
          "kind": "text",
          "text": "You must lay down your phase exactly. If you are on phase 2 you need a set of 3 and a run of 4 — a set of 4 and a run of 4 does not count as it, and you cannot lay down half of it and finish later."
        },
        {
          "kind": "text",
          "text": "Once your phase is on the table, you can spend later turns hitting: adding single cards to any phase already laid down, your own or anyone else's. A player on phase 4 with a run of 7 down can be extended at either end by anyone who has already laid down."
        },
        {
          "kind": "text",
          "text": "You may not hit until your own phase is down. This is the main tension in the game — laying down early lets you start shedding cards, but commits you."
        }
      ]
    },
    {
      "heading": "Wilds and Skips",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "A Wild stands in for any card in a phase you lay down or hit. Once placed it cannot be swapped out for the real card.",
            "A Skip is discarded to make the next player lose their turn. It can never be part of a phase, and it cannot be picked up from the discard pile.",
            "If a Skip is turned up as the starting discard, the first player loses their turn."
          ]
        }
      ]
    },
    {
      "heading": "Ending a round",
      "blocks": [
        {
          "kind": "text",
          "text": "The round ends the instant one player gets rid of their last card. Note that going out and completing your phase are separate things — you can go out having never laid your phase down, and you will still be repeating it next round."
        },
        {
          "kind": "text",
          "text": "Everyone who laid their phase down moves up to the next one. Everyone who did not attempts the same phase again."
        }
      ]
    },
    {
      "heading": "Scoring",
      "blocks": [
        {
          "kind": "text",
          "text": "Every player other than the one who went out scores the cards still in their hand:"
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
                "1 through 9",
                "5"
              ],
              [
                "10 through 12",
                "10"
              ],
              [
                "Skip",
                "15"
              ],
              [
                "Wild",
                "25"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Low is good, but the score does not win the game. Play continues until at least one player has completed phase 10, and among those who did, the lowest score wins. Somebody sitting on five points who is still stuck on phase 2 has not won anything."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Phase advance on going out. Some tables let the player who goes out advance regardless of whether they laid their phase.",
            "No hitting on others. Some restrict hitting to your own melds.",
            "Skip targeting. Some play that a Skip must name a specific player rather than always hitting the next one."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Mark whether each player laid their phase down; the app tracks who is on which phase and names it for you so nobody has to hold the list in their head.",
    "The standings put finishers first, so a low score never outranks somebody who actually completed phase 10.",
    "The game ends automatically as soon as anyone completes the tenth phase."
  ]
};
