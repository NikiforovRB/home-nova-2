/** Ключи совпадают с listings.property_type и listingTypeSchema (кроме hotel — отдельно в форме). */
export const FILTER_PROPERTY_TYPES = [
  { value: "apartment", label: "Квартиры" },
  { value: "room", label: "Комнаты" },
  { value: "house", label: "Дома, дачи, коттеджи" },
  { value: "land", label: "Земельные участки" },
  { value: "garage", label: "Гаражи и машиноместа" },
  { value: "commercial", label: "Коммерческая недвижимость" },
  { value: "hotel", label: "Отель" },
] as const;

export type FilterPropertyTypeValue = (typeof FILTER_PROPERTY_TYPES)[number]["value"];
