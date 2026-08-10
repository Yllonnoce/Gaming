import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  "objective": "Be caught holding the fewest pips. You play one hand per double, and each time a hand ends you add up whatever tiles are still in your hand. Low is good.",
  "players": "2 to 8 with a double-12 set, 2 to 10 with a double-15.",
  "equipment": "A double-12 set (91 tiles) or a double-15 set (136 tiles). A hub or centrepiece to hold the engine helps, and each player needs a marker — a coin or button will do.",
  "sections": [
    {
      "heading": "How many hands you play",
      "blocks": [
        {
          "kind": "text",
          "text": "You play one hand for each double in the set, counting down. With a double-12 set that is thirteen hands: the first uses the double-12 as its engine, then double-11, and so on down to double-blank. A double-15 set gives sixteen hands."
        },
        {
          "kind": "text",
          "text": "Whichever double belongs to that hand goes face up in the hub. Every train in that hand starts from it."
        }
      ]
    },
    {
      "heading": "Setting up a hand",
      "blocks": [
        {
          "kind": "text",
          "text": "Turn all the tiles face down and shuffle them. Find the engine for this hand and place it in the hub, then everyone draws their tiles from the remaining pile. What is left over is the boneyard, and players draw from it during the hand."
        },
        {
          "kind": "text",
          "text": "How many tiles each player draws depends on how many of you there are — with more players you each get fewer, or the boneyard runs dry:"
        },
        {
          "kind": "table",
          "table": {
            "columns": [
              "Players",
              "Double-12 set",
              "Double-15 set"
            ],
            "rows": [
              [
                "2",
                "16 tiles each",
                "20 tiles each"
              ],
              [
                "3 to 4",
                "15 tiles each",
                "18 tiles each"
              ],
              [
                "5 to 6",
                "12 tiles each",
                "16 tiles each"
              ],
              [
                "7 to 8",
                "10 tiles each",
                "14 tiles each"
              ],
              [
                "9 to 10",
                "—",
                "12 tiles each"
              ]
            ],
            "caption": "The most widely used counts. Sets from different makers print slightly different tables, so follow yours if it disagrees."
          }
        },
        {
          "kind": "text",
          "text": "The principle behind the numbers is simply that the boneyard needs to stay big enough to draw from all hand. If you are inventing a count, leave at least a dozen tiles in it."
        }
      ]
    },
    {
      "heading": "Trains",
      "blocks": [
        {
          "kind": "text",
          "text": "A train is a line of tiles running away from the hub, where touching ends match — a 12-5 laid against the double-12 engine, then a 5-3 against that, and so on."
        },
        {
          "kind": "text",
          "text": "Everyone has their own personal train, which starts at the engine and points toward them. There is also the Mexican Train: one communal line, also starting from the engine, that anybody may play on at any time. It does not exist until someone starts it, and only one is ever in play."
        },
        {
          "kind": "text",
          "text": "Your train is normally private — only you may add to it. But it becomes public if you fail to play (see below), and while it is public anyone may build on it. Marking it with a coin or button is how the table keeps track."
        }
      ]
    },
    {
      "heading": "The first turn",
      "blocks": [
        {
          "kind": "text",
          "text": "The player to the dealer's left goes first, then play passes clockwise."
        },
        {
          "kind": "text",
          "text": "On your very first turn you may lay as many tiles as you can in one unbroken line to start your personal train, not just one. Many tables play this way and it makes a big difference; some restrict the first turn to a single tile. Agree before you start."
        }
      ]
    },
    {
      "heading": "Taking a turn",
      "blocks": [
        {
          "kind": "steps",
          "items": [
            "Play one tile, matching its end to the open end of a train you are allowed to use: your own train, the Mexican Train, or anyone's train that is currently marked public.",
            "If you cannot play, draw one tile from the boneyard.",
            "If that tile can be played, play it. If it cannot, your turn ends and your train is marked public.",
            "If the boneyard is empty and you cannot play, simply pass and mark your train public."
          ]
        },
        {
          "kind": "text",
          "text": "Once your train is public it stays public until you play on it yourself, at which point the marker comes off and it is private again."
        },
        {
          "kind": "text",
          "text": "You may start the Mexican Train on any turn, in place of playing on a train, by laying a tile matching the engine off to one side."
        }
      ]
    },
    {
      "heading": "Doubles must be satisfied",
      "blocks": [
        {
          "kind": "text",
          "text": "This is the rule newcomers trip over. When anyone plays a double, it is laid crossways and the hand stops until it is covered."
        },
        {
          "kind": "steps",
          "items": [
            "Play the double.",
            "You then immediately play a second tile covering it, if you can.",
            "If you cannot, the next player must cover it — on any train, regardless of whose it is.",
            "That player keeps drawing until they can cover it, or the boneyard runs out.",
            "Nobody may play anywhere else while a double sits uncovered."
          ]
        },
        {
          "kind": "text",
          "text": "If the boneyard empties and nobody can cover the double, play resumes normally and the double stays open for the rest of the hand."
        }
      ]
    },
    {
      "heading": "Ending a hand",
      "blocks": [
        {
          "kind": "text",
          "text": "A hand ends the moment a player lays their last tile. It also ends if the boneyard is empty and no one can play at all — a blocked hand."
        },
        {
          "kind": "text",
          "text": "Everyone else adds up the pips on the tiles left in their hand. A 9-4 is thirteen points, a double-6 is twelve, the double-blank is nothing. That total is their score for the hand."
        },
        {
          "kind": "text",
          "text": "Add the hands up as you go. After the last hand, the lowest total wins."
        }
      ]
    },
    {
      "heading": "Common variations",
      "blocks": [
        {
          "kind": "list",
          "items": [
            "Double-blank penalty. The 0-0 tile is worth nothing in a straight count, so many tables give it a fixed penalty of 25 or 50 to stop it being a free ride.",
            "Satisfying with a double. Some tables let a double be covered by another double, which then also needs covering. Others forbid it.",
            "First-turn limit. Some tables allow only one tile on your opening turn rather than a full chain.",
            "Boneyard floor. Some leave a fixed number of tiles that may never be drawn, so the hand can end blocked."
          ]
        }
      ]
    }
  ],
  "appNotes": [
    "Pick your set at setup and the app works out how many hands you play — thirteen for double-12, sixteen for double-15.",
    "Leave a player blank if they went out. An empty hand scores nothing.",
    "The double-blank penalty is off by default. Switch it on at setup and set its value, and a 0-0 button appears on each player's row."
  ]
};
