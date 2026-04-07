import { z } from "zod";

export const authRegisterSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(120),
  name: z.string().min(2).max(120),
});

export const authLoginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(120),
});

export const listingModeSchema = z.enum(["buy", "rent_long", "daily"]);

export const listingTypeSchema = z.enum([
  "apartment",
  "room",
  "house",
  "land",
  "garage",
  "commercial",
  "hotel",
]);

export const listingCreateSchema = z.object({
  title: z.string().min(10).max(180),
  description: z.string().min(30).max(6000),
  mode: listingModeSchema,
  propertyType: listingTypeSchema,
  rooms: z.string().max(30).optional(),
  price: z.coerce.number().positive(),
  currencyCode: z.enum(["RUB", "EUR", "USD", "TRY"]),
  cityId: z.coerce.number().int().positive(),
  phone: z.string().min(7).max(32),
  discountComment: z.string().max(240).optional(),
});

export const locationSchema = z.object({
  country: z.string().min(2).max(120),
  region: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
});

export const currencyRateSchema = z.object({
  code: z.enum(["RUB", "EUR", "USD", "TRY"]),
  rateToUsd: z.coerce.number().positive(),
  symbol: z.string().min(1).max(4),
});
