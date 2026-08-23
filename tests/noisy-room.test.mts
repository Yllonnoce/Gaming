import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ADJECTIVES,
  NOUNS,
  generateRoomName,
  isRoomName,
  isGroupId,
  toGroupId,
  TABLE_GROUP,
} from "../apps/noisy-room/names.ts";
import { commsUrl, roomPath, DEFAULT_COMMS_URL } from "../apps/noisy-room/links.ts";

// ---- room names --------------------------------------------------------

test("generated room names are always valid", () => {
  // A deterministic sweep across the whole random range, not a lucky sample.
  for (let i = 0; i < 500; i++) {
    const name = generateRoomName(() => (i * 0.618033988749895) % 1);
    assert.ok(isRoomName(name), `rejected its own name: ${name}`);
    assert.match(name, /^[a-z]+-[a-z]+-\d\d$/);
  }
});

test("the word lists are plain lowercase ASCII, as the URL pattern demands", () => {
  for (const word of [...ADJECTIVES, ...NOUNS]) {
    assert.match(word, /^[a-z]+$/, word);
  }
});

test("room names from URLs are validated strictly", () => {
  assert.ok(isRoomName("brave-otter-42"));
  assert.ok(isRoomName("abc"));
  assert.ok(!isRoomName("Brave-Otter-42"), "uppercase");
  assert.ok(!isRoomName("brave otter"), "space");
  assert.ok(!isRoomName("brave--otter"), "double hyphen");
  assert.ok(!isRoomName("-brave"), "leading hyphen");
  assert.ok(!isRoomName("ab"), "too short");
  assert.ok(!isRoomName("a".repeat(41)), "too long");
  assert.ok(!isRoomName("test"), "reserved by Comms");
  assert.ok(!isRoomName("../etc"), "path characters");
});

// ---- group ids ---------------------------------------------------------

test("labels become alphanumeric group ids", () => {
  assert.equal(toGroupId("Kitchen crew"), "KitchenCrew");
  assert.equal(toGroupId("  partners  A "), "PartnersA");
  assert.equal(toGroupId("Team #2!"), "Team2");
  assert.equal(toGroupId("a-very-long-name-that-keeps-going"), "Averylongnamethatkee");
  assert.equal(toGroupId("???"), "");
});

test("group ids may not collide with the table group", () => {
  assert.ok(isGroupId("Kitchen"));
  assert.ok(!isGroupId(toGroupId("table")));
  assert.ok(!isGroupId(TABLE_GROUP));
  assert.ok(!isGroupId(""));
  assert.ok(!isGroupId("no spaces"));
});

// ---- links -------------------------------------------------------------

test("the Comms link carries the room, the table group first, and the name", () => {
  const url = new URL(
    commsUrl({ room: "brave-otter-42", sideRooms: ["Kitchen", "PartnersA"], label: "Eric S" }),
  );
  assert.equal(`${url.origin}${url.pathname}`, DEFAULT_COMMS_URL);
  assert.equal(url.searchParams.get("room"), "brave-otter-42");
  assert.equal(url.searchParams.get("groups"), `${TABLE_GROUP},Kitchen,PartnersA`);
  assert.equal(url.searchParams.get("label"), "Eric S");
  // The singular form would make the inner frame auto-join a group.
  assert.equal(url.searchParams.get("group"), null);
});

test("a blank name leaves the label off so Comms does not prompt for one", () => {
  const url = new URL(commsUrl({ room: "brave-otter-42", label: "   " }));
  assert.equal(url.searchParams.has("label"), false);
  assert.equal(url.searchParams.get("groups"), TABLE_GROUP);
});

test("the Comms host can be swapped without touching the parameters", () => {
  const url = new URL(commsUrl({ room: "r-1", base: "https://comms.cam/" }));
  assert.equal(url.origin, "https://comms.cam");
  assert.equal(url.searchParams.get("room"), "r-1");
});

test("room pages live under /r/", () => {
  assert.equal(roomPath("brave-otter-42"), "/r/brave-otter-42");
});
