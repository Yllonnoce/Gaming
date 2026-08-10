import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Bank 10,000 points before anyone else. The catch is that you can keep rolling for more, and one bad roll takes away everything you have not banked.",
  "players": "2 or more",
  "equipment": "Six dice, and something to keep score on.",
  "sections": [
    {
      "heading": "The basic idea",
      "blocks": [
        {
          "kind": "text",
          "text": "On your turn you roll dice, set aside the ones that score, and then choose: bank what you have accumulated, or push your luck and roll the rest for more."
        },
        {
          "kind": "text",
          "text": "If a roll produces nothing that scores at all, you have farkled. Your turn ends immediately and every point you accumulated but did not bank is gone."
        }
      ]
    },
    {
      "heading": "Taking a turn",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Roll all six dice.",
            "Look at what scores. If nothing does, you have farkled — your turn is over and you score nothing.",
            "Set aside at least one scoring die. You choose which, and you do not have to set aside all of them.",
            "Add its value to your running total for this turn.",
            "Now decide: bank the running total and end your turn, or reroll the dice you did not set aside.",
            "Repeat until you bank or you farkle."
          ]
        },
        {
          "kind": "text",
          "text": "You must set aside at least one scoring die on every roll. You may set aside more if you want to bank sooner, or fewer to keep more dice in play."
        }
      ]
    },
    {
      "heading": "Hot dice",
      "blocks": [
        {
          "kind": "text",
          "text": "If at any point all six of your dice have been set aside as scoring, you have hot dice. Pick all six up and roll again, keeping your running total."
        },
        {
          "kind": "text",
          "text": "There is no limit to how long this can continue, which is how enormous turns happen. It is also how enormous turns get lost — you can farkle on the very next roll and lose the lot."
        }
      ]
    },
    {
      "heading": "What scores",
      "blocks": [
        {
          "kind": "table",
          "table": {
            "columns": [
              "Combination",
              "Points"
            ],
            "rows": [
              [
                "Single 1",
                "100"
              ],
              [
                "Single 5",
                "50"
              ],
              [
                "Three 1s",
                "1,000"
              ],
              [
                "Three 2s",
                "200"
              ],
              [
                "Three 3s",
                "300"
              ],
              [
                "Three 4s",
                "400"
              ],
              [
                "Three 5s",
                "500"
              ],
              [
                "Three 6s",
                "600"
              ],
              [
                "Four of a kind",
                "1,000"
              ],
              [
                "Five of a kind",
                "2,000"
              ],
              [
                "Six of a kind",
                "3,000"
              ],
              [
                "Straight, 1 through 6",
                "1,500"
              ],
              [
                "Three pairs",
                "1,500"
              ],
              [
                "Two triplets",
                "2,500"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "Only 1s and 5s score on their own. A pair of threes is worth nothing, and a lone four is worth nothing."
        },
        {
          "kind": "text",
          "text": "Combinations must appear in a single roll. Rolling two 4s, setting them aside, and rolling a third does not make a triple — you needed all three at once."
        }
      ]
    },
    {
      "heading": "Getting on the board",
      "blocks": [
        {
          "kind": "text",
          "text": "Most tables require you to bank at least 500 in one turn before any of your points count. Until you manage it, a banked turn scores nothing and you are still on zero."
        },
        {
          "kind": "text",
          "text": "Agree whether you are playing this way before you start; it changes early strategy considerably."
        }
      ]
    },
    {
      "heading": "Ending the game",
      "blocks": [
        {
          "kind": "text",
          "text": "Once a player banks a total of 10,000 or more, every other player gets exactly one final turn to beat them. Highest total after that wins."
        },
        {
          "kind": "text",
          "text": "This means the leader is not safe — a single huge final turn can take it."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Farkle scoring varies more than almost any other game. Three pairs at 750, four of a kind as double a triple, a partial straight scoring — all are played somewhere.",
            "Three farkles in a row. Some tables deduct 500 or 1,000 from a player who farkles three turns running.",
            "Entry threshold. 350, 500 and 1,000 are all common, as is having none at all.",
            "Stealing. Some let you continue the previous player's farkled dice rather than starting fresh."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Enter the points banked for each turn. A farkled turn is simply zero, which is what an empty field already means.",
    "The target is 10,000 by default and editable at setup — set it lower for a quicker game.",
    "The table above is the most widely published set of combinations, but use whatever your table plays; the scorekeeper only records the totals you type."
  ]
};
