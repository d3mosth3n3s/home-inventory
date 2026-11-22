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
export const OTHER_ROOM = {
  key: "other",
  label: "Unassigned",
};

export const ALL_ROOMS = [...ROOMS, OTHER_ROOM];

export const GRID_SIZE = 5;
export const MIN_ROOM_SIZE = 15;

export function roomKeyFor(item) {
  const name = String(item?.room_location ?? "")
    .trim()
    .toLowerCase();

  if (
    !name ||
    name === "other" ||
    name === "unassigned" ||
    name === "other / unassigned"
  ) {
    return OTHER_ROOM.key;
  }

  const match = ROOMS.find(
    (room) => room.key === name || room.label.toLowerCase() === name,
  );

  return match ? match.key : `custom:${name}`;
}

export function snap(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function overlaps(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function canPlace(candidate, rooms, maxHeight = Infinity) {
  return (
    candidate.x >= 0 &&
    candidate.y >= 0 &&
    candidate.w >= MIN_ROOM_SIZE &&
    candidate.h >= MIN_ROOM_SIZE &&
    candidate.x + candidate.w <= 100 &&
    candidate.y + candidate.h <= maxHeight &&
    !rooms.some(
      (room) => room.key !== candidate.key && overlaps(candidate, room),
    )
  );
}

export function findFreePosition(room, existing) {
  const maxBottom = Math.max(100, ...existing.map((r) => r.y + r.h));

  for (let y = 0; y <= maxBottom; y += GRID_SIZE) {
    for (let x = 0; x <= 100 - room.w; x += GRID_SIZE) {
      const candidate = { ...room, x, y };

      if (canPlace(candidate, existing)) {
        return candidate;
      }
    }
  }

  return {
    ...room,
    x: 0,
    y: Math.ceil(maxBottom / GRID_SIZE) * GRID_SIZE,
  };
}

export function buildLayout(names, savedLayout = []) {
  const roomMap = new Map();

  for (const name of names) {
    const key = roomKeyFor({ room_location: name });

    if (key === OTHER_ROOM.key) continue;

    const original = ROOMS.find((r) => r.key === key);

    if (!roomMap.has(key)) {
      roomMap.set(key, {
        key,
        label: original?.label ?? name,
        x: original?.x ?? 0,
        y: original?.y ?? 0,
        w: original?.w ?? 25,
        h: original?.h ?? 25,
      });
    }
  }

  const result = [];

  // Restore existing saved rooms first.
  for (const saved of savedLayout) {
    const room = roomMap.get(saved.key);

    if (!room) continue;

    if (![saved.x, saved.y, saved.w, saved.h].every(Number.isFinite)) {
      continue;
    }

    const candidate = {
      ...room,
      x: saved.x,
      y: saved.y,
      w: saved.w,
      h: saved.h,
    };

    if (canPlace(candidate, result)) {
      result.push(candidate);
      roomMap.delete(saved.key);
    }
  }

  // Automatically position new rooms.
  for (const room of roomMap.values()) {
    result.push(canPlace(room, result) ? room : findFreePosition(room, result));
  }

  return result;
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
