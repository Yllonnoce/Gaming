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
  DEFAULT_GROUPS,
} from "../apps/noisy-room/names.ts";
import { commsUrl, roomPath, DEFAULT_COMMS_URL } from "../apps/noisy-room/links.ts";
import { clampMicGain, DEFAULT_MIC_GAIN } from "../apps/noisy-room/names.ts";

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

test("group ids may not collide with the built-in groups", () => {
  assert.ok(isGroupId("Kitchen"));
  assert.ok(!isGroupId(toGroupId("table")));
  for (const group of DEFAULT_GROUPS) {
    assert.ok(!isGroupId(group), group);
    assert.ok(!isGroupId(group.toUpperCase()), group);
  }
  assert.equal(DEFAULT_GROUPS[0], TABLE_GROUP, "Table is the first button");
  assert.ok(!isGroupId(""));
  assert.ok(!isGroupId("no spaces"));
});

// ---- links -------------------------------------------------------------

/** The default link is site-relative; parse it against a stand-in origin. */
const parse = (href: string) => new URL(href, "https://example.test");

test("the Comms link carries the room, the built-in groups first, and the name", () => {
  const href = commsUrl({ room: "brave-otter-42", sideRooms: ["Kitchen", "PartnersA"], label: "Eric S" });
  assert.ok(href.startsWith(`${DEFAULT_COMMS_URL}?`), "served from this site by default");
  const url = parse(href);
  assert.equal(url.pathname, DEFAULT_COMMS_URL);
  assert.equal(url.searchParams.get("room"), "brave-otter-42");
  assert.equal(url.searchParams.get("groups"), "Table,Head,Center,Foot,Kitchen,PartnersA");
  assert.equal(url.searchParams.get("label"), "Eric S");
  // The singular form would make the inner frame auto-join a group.
  assert.equal(url.searchParams.get("group"), null);
});

test("a blank name leaves the label off so Comms does not prompt for one", () => {
  const url = parse(commsUrl({ room: "brave-otter-42", label: "   " }));
  assert.equal(url.searchParams.has("label"), false);
  assert.equal(url.searchParams.get("groups"), DEFAULT_GROUPS.join(","));
});

test("the Comms host can be swapped without touching the parameters", () => {
  const url = new URL(commsUrl({ room: "r-1", base: "https://comms.cam/" }));
  assert.equal(url.origin, "https://comms.cam");
  assert.equal(url.searchParams.get("room"), "r-1");
});

test("room pages live under /r/", () => {
  assert.equal(roomPath("brave-otter-42"), "/r/brave-otter-42");
});

// ---- microphone gain -----------------------------------------------------

test("every join link lets the person into their own audio settings", () => {
  const url = parse(commsUrl({ room: "brave-otter-42" }));
  assert.ok(url.searchParams.has("mediasettings"));
  // Written as a bare flag, the way VDO.Ninja documents it.
  assert.match(url.search, /[?&]mediasettings(&|$)/);
});

test("everyone starts at half mic level unless they chose otherwise", () => {
  assert.equal(DEFAULT_MIC_GAIN, 50);
  const plain = parse(commsUrl({ room: "brave-otter-42" }));
  assert.equal(plain.searchParams.get("audiogain"), "50");
  const loud = parse(commsUrl({ room: "brave-otter-42", micGain: 150 }));
  assert.equal(loud.searchParams.get("audiogain"), "150");
});

test("mic gain is clamped and stepped, and never falls to a mute", () => {
  assert.equal(clampMicGain(0), 10, "0 would mute the guest until a director unmutes them");
  assert.equal(clampMicGain(999), 200);
  assert.equal(clampMicGain(123), 120);
  assert.equal(clampMicGain(Number.NaN), DEFAULT_MIC_GAIN);
  assert.equal(clampMicGain(DEFAULT_MIC_GAIN), DEFAULT_MIC_GAIN);
});
