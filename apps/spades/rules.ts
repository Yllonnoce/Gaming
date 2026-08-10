import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Say how many tricks you will take, then take exactly that many. Overshooting is punished as surely as falling short. First partnership to 500 wins.",
  "players": "4, in two partnerships sitting opposite each other.",
  "equipment": "A standard 52-card deck. Aces are high, and spades are permanently trump.",
  "sections": [
    {
      "heading": "The deal",
      "blocks": [
        {
          "kind": "text",
          "text": "Deal the whole deck out, one card at a time — thirteen cards each. Deal passes to the left after every hand. There are therefore exactly thirteen tricks in every hand."
        }
      ]
    },
    {
      "heading": "Bidding",
      "blocks": [
        {
          "kind": "text",
          "text": "Starting to the dealer's left and going clockwise, each player says how many tricks they expect to take. You bid once; there is no second round and no raising."
        },
        {
          "kind": "text",
          "text": "Your two bids are added together to make your partnership's contract. If you bid 4 and your partner bids 3, your team must take at least 7 tricks."
        },
        {
          "kind": "text",
          "text": "Because all four players bid independently, the four bids rarely total thirteen. If they add to less, there are spare tricks floating about that somebody will be forced to take — which is exactly the problem."
        }
      ]
    },
    {
      "heading": "Playing the tricks",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "The player to the dealer's left leads the first trick. You may not lead a spade yet.",
            "Each player in turn plays one card clockwise.",
            "You must follow the suit led if you hold it.",
            "If you cannot follow, you may play anything, including a spade.",
            "The highest spade played wins the trick. If no spade was played, the highest card of the suit led wins.",
            "The winner of the trick leads the next one."
          ]
        },
        {
          "kind": "text",
          "text": "Spades may not be led until they have been broken — that is, until somebody has played a spade on a trick whose suit they could not follow. If spades are all you hold, you may lead one."
        }
      ]
    },
    {
      "heading": "Scoring the hand",
      "blocks": [
        {
          "kind": "text",
          "text": "Compare the tricks your partnership took against the contract you bid."
        },
        {
          "kind": "list",
          "items": [
            "Make it, and you score ten points per trick bid. A bid of 7 that takes 7 or more scores 70.",
            "Miss it by even one trick and you are set: you lose ten points per trick bid. A bid of 7 that takes 6 scores minus 70, and nothing else you did counts."
          ]
        },
        {
          "kind": "text",
          "text": "Every trick you take above your bid is called an overtrick, or a bag. Each is worth one point at the time."
        }
      ]
    },
    {
      "heading": "Bags — the rule that decides games",
      "blocks": [
        {
          "kind": "text",
          "text": "Bags look like a small bonus and are actually a slow-burning penalty. They accumulate across the whole game, not just the hand."
        },
        {
          "kind": "text",
          "text": "The moment a partnership has collected ten bags, it immediately loses 100 points and ten bags come off the count. Any extra carry forward — collect eleven and you pay the 100 and still have one on the books."
        },
        {
          "kind": "text",
          "text": "This is why the correct play is often to bid accurately rather than safely. A team that quietly overshoots by one every hand hands back 100 points on the tenth."
        }
      ]
    },
    {
      "heading": "Nil",
      "blocks": [
        {
          "kind": "text",
          "text": "Instead of a number, a player may bid nil: a claim to take no tricks whatsoever."
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Bid",
              "If successful",
              "If it fails"
            ],
            "rows": [
              [
                "Nil",
                "+100",
                "−100"
              ],
              [
                "Blind nil",
                "+200",
                "−200"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "A nil bidder's partner bids normally, and the team must still make that contract on its own — the nil bid adds nothing to it. So a nil alongside a partner's bid of 5 means the team needs 5 tricks, all of which the partner must take."
        },
        {
          "kind": "text",
          "text": "If the nil bidder takes even one trick the nil fails, but the partner's contract is judged separately and may still be made."
        },
        {
          "kind": "text",
          "text": "Tricks taken by a failed nil bidder still count as bags for the team."
        },
        {
          "kind": "text",
          "text": "Blind nil is declared before looking at your cards at all. Most tables only allow it when your partnership is behind by 100 or more."
        }
      ]
    },
    {
      "heading": "Ending the game",
      "blocks": [
        {
          "kind": "text",
          "text": "Play hands until a partnership reaches 500. Highest score wins. If both cross in the same hand, the higher total takes it."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Minimum bid. Some tables require every player to bid at least 1, removing nil entirely.",
            "Ten for two hundred. Bidding and making ten or more tricks scores 200 instead of 100.",
            "Bag penalty size. Some tables use five bags and 50 points rather than ten and 100.",
            "Cutthroat spades. Three or four players scoring individually, with no partnerships."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Enter the partnership's combined bid and the tricks it actually took. Nil is set per player, since it is an individual bid.",
    "The app carries the bag count between hands and applies the −100 automatically at the tenth, so nobody has to remember where the team stands. The count on each team's card turns gold when a penalty is close.",
    "Tricks across both teams are checked against thirteen.",
    "This scorekeeper implements partnership spades with the ten-bag, 100-point penalty. The target is 500 by default and editable at setup."
  ]
};
