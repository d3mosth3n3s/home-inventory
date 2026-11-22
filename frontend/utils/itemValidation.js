export const LIMITS = {
  name: 100,
  brand: 100,
  model: 100,
  description: 1000,
  serialNumber: 100,
  category: 50,
  roomLocation: 50,
  price: 9999999.99,
  quantity: 99999,
};

export function validateItem(form) {
  if (!form.name?.trim()) {
    return "Please enter an item name.";
  }

  const fields = [
    ["Item name", form.name, LIMITS.name],
    ["Brand", form.brand, LIMITS.brand],
    ["Model", form.model, LIMITS.model],
    ["Description", form.description ?? form.notes, LIMITS.description],
    ["Serial number", form.serialNumber, LIMITS.serialNumber],
    ["Category", form.category, LIMITS.category],
    ["Room", form.roomLocation, LIMITS.roomLocation],
  ];

  for (const [label, value, limit] of fields) {
    if (value && value.length > limit) {
      return `${label} cannot exceed ${limit} characters.`;
    }
  }

  const prices = [
    ["Purchase price", form.purchasePrice],
    ["Current value", form.currentValue],
  ];

  for (const [label, value] of prices) {
    if (value == null || value === "") continue;

    if (!/^\d+(\.\d{1,2})?$/.test(String(value))) {
      return `${label} must be a valid nonnegative price with up to two decimal places.`;
    }

    const number = Number(value);

    if (!Number.isFinite(number) || number > LIMITS.price) {
      return `${label} cannot exceed $9,999,999.99.`;
    }
  }

  if (form.quantity !== undefined) {
    const quantity = Number(form.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > LIMITS.quantity
    ) {
      return "Quantity must be a whole number between 1 and 99,999.";
    }
  }

  return null;
}

export function formatApiError(error, fallback) {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join("\n");
  }

  return typeof detail === "string" ? detail : fallback;
}
