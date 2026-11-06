// Floorplan layout. x / y / w / h are percentages of the floorplan box.
// Tweak these to reshape the house; rooms should tile the 100x100 area.
export const ROOMS = [
  {
    key: "living",
    label: "Living Room",
    x: 0,
    y: 0,
    w: 50,
    h: 45,
    aliases: ["living", "lounge", "family room", "den"],
  },
  {
    key: "kitchen",
    label: "Kitchen",
    x: 50,
    y: 0,
    w: 30,
    h: 45,
    aliases: ["kitchen", "dining", "pantry"],
  },
  {
    key: "garage",
    label: "Garage",
    x: 80,
    y: 0,
    w: 20,
    h: 100,
    aliases: ["garage", "shed", "workshop"],
  },
  {
    key: "bedroom",
    label: "Bedroom",
    x: 0,
    y: 45,
    w: 35,
    h: 55,
    aliases: ["bedroom", "nursery", "guest room"],
  },
  {
    key: "bathroom",
    label: "Bathroom",
    x: 35,
    y: 45,
    w: 20,
    h: 30,
    aliases: ["bath", "restroom", "powder room"],
  },
  {
    key: "hall",
    label: "Hall / Closet",
    x: 35,
    y: 75,
    w: 20,
    h: 25,
    aliases: ["hall", "closet", "entry", "laundry", "utility"],
  },
  {
    key: "office",
    label: "Office",
    x: 55,
    y: 45,
    w: 25,
    h: 55,
    aliases: ["office", "study", "library"],
  },
];

export const OTHER_ROOM = { key: "other", label: "Other / Unassigned" };

export const ALL_ROOMS = [...ROOMS, OTHER_ROOM];

// Maps an item's free-text `room` (e.g. "Bedroom 2", "Master Bath") to a floorplan room.
export function roomKeyFor(item) {
  const r = String(item?.room_location ?? "")
    .trim()
    .toLowerCase();
  if (!r) return OTHER_ROOM.key;
  const match = ROOMS.find(
    (room) =>
      room.key === r ||
      room.label.toLowerCase() === r ||
      room.aliases.some((a) => r.includes(a)),
  );
  return match ? match.key : OTHER_ROOM.key;
}

// Matches the backend's /api/items/summary math:
// COALESCE(current_value, purchase_price, 0) * quantity
export const itemValue = (item) =>
  (Number(item?.current_value ?? item?.purchase_price) || 0) *
  (Number(item?.quantity) || 1);

export const formatMoney = (n) =>
  "$" +
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
