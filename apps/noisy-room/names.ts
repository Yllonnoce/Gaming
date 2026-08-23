/**
 * Room and group naming.
 *
 * Pure, so it can be unit tested and shared by the client (which generates a
 * name) and the server (which validates one arriving in a URL).
 */

/**
 * Two words and a number: easy to read aloud across a table to someone who
 * can't scan the code. Roughly 60 x 70 x 90 = 380,000 combinations, which is
 * plenty for a room whose only exposure is a game night.
 */
export const ADJECTIVES = [
  "amber", "bold", "brave", "breezy", "bright", "brisk", "calm", "cheery", "clever", "cosy",
  "crisp", "daring", "dusty", "eager", "fancy", "fizzy", "fluffy", "frosty", "gentle", "giddy",
  "golden", "grand", "happy", "hasty", "hearty", "humble", "jolly", "keen", "kind", "lively",
  "lucky", "mellow", "merry", "mighty", "misty", "nimble", "noble", "peppy", "plucky", "plush",
  "proud", "quick", "quiet", "rosy", "royal", "rusty", "shiny", "silky", "sleepy", "snappy",
  "snug", "spry", "sturdy", "sunny", "swift", "tidy", "velvet", "witty", "zany", "zesty",
] as const;

export const NOUNS = [
  "acorn", "badger", "beacon", "beaver", "bishop", "bobcat", "canoe", "castle", "cobra", "comet",
  "cricket", "dragon", "eagle", "ember", "falcon", "ferret", "fiddle", "finch", "gecko", "goblin",
  "harbor", "heron", "hornet", "husky", "jackal", "jester", "kestrel", "kitten", "knight", "lantern",
  "lemur", "lobster", "magpie", "mammoth", "marble", "meadow", "moose", "narwhal", "nugget", "orchid",
  "otter", "panda", "parrot", "pebble", "pelican", "penguin", "pirate", "poodle", "puffin", "rabbit",
  "raven", "rocket", "salmon", "sparrow", "sphinx", "squid", "tiger", "toucan", "turnip", "viking",
  "walrus", "wizard", "wombat", "yeti", "zebra",
] as const;

export function generateRoomName(random: () => number = Math.random): string {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const number = 10 + Math.floor(random() * 90); // two digits, never a leading zero
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${number}`;
}

/**
 * What we accept in a /r/<room> URL. Lowercase words joined by single hyphens,
 * no longer than VDO.Ninja tolerates. Comms rewrites the hyphens to
 * underscores on its side; since everyone's link goes through the same
 * rewrite they still land in the same room.
 */
export const ROOM_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+){0,4}$/;
export const MAX_ROOM_NAME_LENGTH = 40;

export function isRoomName(value: string): boolean {
  return (
    value.length >= 3 &&
    value.length <= MAX_ROOM_NAME_LENGTH &&
    ROOM_NAME_PATTERN.test(value) &&
    // Comms treats this one as a reserved name and refuses it.
    value !== "test"
  );
}

/** The group everyone starts in. Side rooms are the other groups. */
export const TABLE_GROUP = "Table";

export const MAX_SIDE_ROOMS = 12;
export const MAX_GROUP_ID_LENGTH = 20;
export const MAX_LABEL_LENGTH = 30;

/**
 * A group id has to survive a comma-separated URL parameter and VDO.Ninja's
 * own filtering, so it is reduced to letters and digits. "Kitchen crew"
 * becomes "KitchenCrew", which is what the button in Comms will read.
 */
export function toGroupId(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join("")
    .slice(0, MAX_GROUP_ID_LENGTH);
}

export function isGroupId(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_GROUP_ID_LENGTH &&
    /^[A-Za-z0-9]+$/.test(value) &&
    value.toLowerCase() !== TABLE_GROUP.toLowerCase()
  );
}
