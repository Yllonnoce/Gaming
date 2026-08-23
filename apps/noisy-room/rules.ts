import type { Rules } from "@/lib/rules";

export const rules: Rules = {
  heading: "How Noisy Room works",
  appNotesHeading: "What this tool assumes",
  objective:
    "Everyone at the table hears everyone else through their own headphones, so a loud room, a long table, or a hard-of-hearing friend stops being a problem.",
  players: "2 to about 15 phones. It works best under 10.",
  equipment:
    "A phone per person, each with wired or Bluetooth headphones, on Wi-Fi or mobile data. No app to install.",
  terms: [
    { term: "Room", meaning: "one table's audio space, named like brave-otter-42. The code and link both point at it." },
    { term: "Table", meaning: "the group everyone starts in. Tap it and you talk and listen with the whole room." },
    { term: "Head, Center, Foot", meaning: "built-in groups for each end and the middle of a long table, so one end can talk without shouting past the other." },
    { term: "Side room", meaning: "any extra group inside the room, for partners or a quick private word. Anyone can make one." },
    { term: "Mute", meaning: "the big button under the group buttons. Tap it when you're not talking in a loud room; tap again to talk." },
  ],
  sections: [
    {
      heading: "Starting a room",
      blocks: [
        {
          kind: "steps",
          items: [
            "Tap Start a room. You get a two-word name and a page with a code on it.",
            "Hold the code up, or tap Big code so it fills the screen, and let people scan it with their camera app.",
            "Can't scan? Tap Share to send the link by message, or read the room name aloud — it's built to be said across a table.",
            "Join it yourself the same way everyone else does.",
          ],
        },
        {
          kind: "text",
          text: "The room is remembered on this phone, so coming back to the hub shows the same code rather than a new one. Start a different room whenever you like.",
        },
      ],
    },
    {
      heading: "Joining",
      blocks: [
        {
          kind: "steps",
          items: [
            "Put headphones on first. Without them your phone's speaker feeds back into its microphone and everyone hears an echo.",
            "Type your name if you like, set your mic level, then tap Put on headphones & join.",
            "Allow the microphone when asked. That's it — you're at the Table.",
            "The buttons that appear are who you're talking to; the list below them is who's here and where they are.",
          ],
        },
        {
          kind: "text",
          text: "Keep this page open and the phone awake. Phones stop the microphone when the screen locks or the browser goes into the background. The audio engine itself is tucked away under the controls; Show the audio engine reveals it for per-person volume, the settings gear, or if your browser wants a tap before it will play sound. If it still won't start, the link there opens the call in its own tab.",
        },
      ],
    },
    {
      heading: "Side rooms",
      blocks: [
        {
          kind: "text",
          text: "A side room is a private channel inside the room. Every room starts with Head, Center and Foot for the ends and middle of a long table; add your own for partners planning a hand or two people stepping into the kitchen.",
        },
        {
          kind: "list",
          items: [
            "Anyone can add one from the room page. Within a few seconds it's a button for everyone in the call.",
            "Tap a side room's button to move into it. Tap Table to come back. The number on a button is how many people are in it.",
            "Keep hearing the Table while in a side room is on by default: you talk only to your side room but still hear the main conversation. Untick it for a properly private huddle.",
          ],
        },
      ],
    },
    {
      heading: "Good sound",
      blocks: [
        {
          kind: "list",
          items: [
            "Headphones for everyone, not just the person who needs them. One open speaker makes echo for all.",
            "You'll hear a voice live across the table and again a fraction of a second later in your ears. That's normal; it fades into the background quickly.",
            "Mute yourself when you aren't talking if the room is very loud. The audio page has a mute button.",
            "Everyone's microphone starts at half level, because a phone a hand's width from your mouth is loud. If people say you're quiet, turn the Mic level slider up before joining, or use the settings gear in the audio engine once you're in.",
            "Show the audio engine to get a small volume bar per person, so you can turn one voice up or down just for yourself.",
            "Everyone on the same Wi-Fi helps. It works over mobile data too, but uses more of it.",
          ],
        },
      ],
    },
    {
      heading: "Common questions",
      blocks: [
        {
          kind: "list",
          items: [
            "Is it private? The room name is the only key, and it's a random one. Don't post the link anywhere public and it stays a table-sized secret.",
            "Does it need the internet? Yes, even when everyone is on the same Wi-Fi: the phones find each other through a server, then talk to each other directly.",
            "How many people? The hard limit is far higher than a table, but every phone sends its audio to every other phone, so past ten or so the weakest phone starts to struggle.",
            "Does it record anything? No. Audio goes phone to phone and is never stored.",
          ],
        },
      ],
    },
  ],
  appNotes: [
    "The audio itself is handled by VDO.Ninja, a free browser tool, running quietly inside this page. This site mints the room, hands out the code, draws the controls, and keeps the list of side rooms; it never touches the sound.",
    "Side rooms are remembered on the server so every phone sees the same list. If that storage is unavailable, the built-in Table, Head, Center and Foot still work.",
    "Room names are lowercase words joined by hyphens. Comms shows them with underscores instead — same room, different spelling.",
  ],
};
