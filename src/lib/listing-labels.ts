export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Квартира",
  room: "Комната",
  house: "Дом",
  land: "Участок",
  garage: "Гараж / машиноместо",
  commercial: "Коммерция",
  hotel: "Отель",
};

export const MODE_LABELS: Record<string, string> = {
  buy: "Продажа",
  rent_long: "Аренда долгая",
  daily: "Посуточно",
};

export function listingDetailsLine(row: {
  property_type: string;
  rooms: string | null;
  mode: string;
}) {
  const pt = PROPERTY_TYPE_LABELS[row.property_type] ?? row.property_type;
  const mode = MODE_LABELS[row.mode] ?? row.mode;
  const parts = [pt, row.rooms, mode].filter(Boolean);
  return parts.join(" • ");
}
