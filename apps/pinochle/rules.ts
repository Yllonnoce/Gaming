import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Bid for the right to name trump, then score enough from your melds and your tricks to make good on that bid. Fall short and you lose the whole bid. First partnership to 1,500 wins.",
  "players": "4, in two partnerships sitting opposite each other.",
  "equipment": "A 48-card pinochle deck: A, 10, K, Q, J and 9 in each suit, two copies of each. You can build one from two standard decks by removing everything below the nine.",
  "sections": [
    {
      "heading": "The unusual card ranking",
      "blocks": [
        {
          "kind": "text",
          "text": "Learn this first, because it catches everyone. Cards rank from high to low: Ace, Ten, King, Queen, Jack, Nine."
        },
        {
          "kind": "text",
          "text": "The ten sits above the king. A ten will take a king, and both are worth taking."
        }
      ]
    },
    {
      "heading": "The deal",
      "blocks": [
        {
          "kind": "text",
          "text": "Deal all 48 cards out, twelve to each player, in packets of three or four at a time rather than singly. Deal passes to the left each hand."
        }
      ]
    },
    {
      "heading": "Bidding",
      "blocks": [
        {
          "kind": "text",
          "text": "Starting to the dealer's left, players bid the number of points their partnership will score this hand, or pass. Once you pass you are out of the bidding for that hand. Bidding continues around until three players have passed."
        },
        {
          "kind": "text",
          "text": "The usual opening minimum is 250, rising in steps of ten. The last player left holding the bid names trump and leads the first trick."
        },
        {
          "kind": "text",
          "text": "What you are weighing is your meld plus the tricks you think you can take. Your partner's hand is unknown, which is what makes it a gamble."
        }
      ]
    },
    {
      "heading": "Meld",
      "blocks": [
        {
          "kind": "text",
          "text": "Once trump is named, both partnerships lay their scoring combinations face up on the table. This happens before a single trick is played, and the points are counted immediately."
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Combination",
              "Points"
            ],
            "rows": [
              [
                "Run in trump (A-10-K-Q-J of trump)",
                "150"
              ],
              [
                "Royal marriage (K-Q of trump)",
                "40"
              ],
              [
                "Marriage (K-Q of any other suit)",
                "20"
              ],
              [
                "Pinochle (jack of diamonds + queen of spades)",
                "40"
              ],
              [
                "Double pinochle (both)",
                "300"
              ],
              [
                "Aces around (one ace in each suit)",
                "100"
              ],
              [
                "Kings around",
                "80"
              ],
              [
                "Queens around",
                "60"
              ],
              [
                "Jacks around",
                "40"
              ],
              [
                "Dix (nine of trump)",
                "10 each"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "A card can count in more than one combination at once. The queen of spades can be part of a pinochle and a marriage and queens around simultaneously."
        },
        {
          "kind": "text",
          "text": "The royal marriage is already inside a run in trump, so a run scores 150 and you do not also claim the 40."
        },
        {
          "kind": "text",
          "text": "After the meld is counted, everyone picks their cards back up. You then have to actually win tricks with the cards you just showed everybody."
        }
      ]
    },
    {
      "heading": "Playing the tricks",
      "blocks": [
        {
          "kind": "text",
          "text": "The rules of play are much stricter than in most trick-taking games. On every trick:"
        },
        {
          "kind": "steps",
          "items": [
            "You must follow the suit led if you can.",
            "You must also beat the highest card played so far, if you can.",
            "If you cannot follow suit, you must play a trump if you hold one.",
            "If a trump has already been played, you must beat it if you can.",
            "Only if you can do none of these may you discard freely."
          ]
        },
        {
          "kind": "text",
          "text": "The highest trump wins; if no trump was played, the highest card of the suit led wins. Winner leads the next trick."
        }
      ]
    },
    {
      "heading": "Trick points",
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
                "Each Ace",
                "11"
              ],
              [
                "Each Ten",
                "10"
              ],
              [
                "Each King",
                "4"
              ],
              [
                "Each Queen",
                "3"
              ],
              [
                "Each Jack",
                "2"
              ],
              [
                "Each Nine",
                "0"
              ],
              [
                "Taking the last trick",
                "10"
              ]
            ]
          }
        },
        {
          "kind": "text",
          "text": "That comes to 250 points available in every hand, split between the two partnerships."
        }
      ]
    },
    {
      "heading": "Scoring the hand",
      "blocks": [
        {
          "kind": "text",
          "text": "Each partnership adds its meld to its trick points."
        },
        {
          "kind": "list",
          "items": [
            "The bidding partnership keeps that total if it is equal to or greater than the bid.",
            "If it falls short, they are set: they score minus the full amount of the bid, and their meld does not count at all. A partnership with 300 of meld that bid 400 and took only 80 in tricks loses 400.",
            "The other partnership simply scores its meld plus its tricks."
          ]
        },
        {
          "kind": "text",
          "text": "Play until a partnership reaches 1,500. If the bidding side crosses the line, they win immediately — the point of bidding is that you get there first."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Meld must be earned. Many tables require the non-bidding partnership to take at least one trick for its meld to count.",
            "Trick point simplification. Some score aces, tens and kings at 10, 10 and 5 and ignore the rest.",
            "Double-deck pinochle. An 80-card game with no nines, bids starting near 500, and a different meld table. It is really a separate game.",
            "Three-handed. Single deck, no partnerships, everyone for themselves."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Meld is entered as a breakdown rather than a total — tap the counters and the app adds it up and shows its working.",
    "Mark which team took the bid and enter the amount. If they finish below it the app sets them automatically, losing the bid and discarding their meld.",
    "Trick points across both teams are checked against 250.",
    "This scorekeeper always counts the non-bidding team's meld, and uses the 11/10/4/3/2/0 trick values above. The target is 1,500 by default and editable at setup."
  ]
};
