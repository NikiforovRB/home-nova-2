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
  filterValues: z.record(z.string(), z.string()).optional(),
});

export const locationSchema = z.object({
  country: z.string().min(2).max(120),
  region: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
});

export const currencyRateSchema = z.object({
  code: z.string().min(3).max(8).toUpperCase(),
  rateToUsd: z.coerce.number().positive(),
  symbol: z.string().min(1).max(8),
});

export const countryCreateSchema = z.object({
  name: z.string().min(1).max(120),
  sortOrder: z.coerce.number().int().optional(),
});

export const countryPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const regionCreateSchema = z.object({
  countryId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(120),
  sortOrder: z.coerce.number().int().optional(),
});

export const regionPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const cityCreateSchema = z.object({
  regionId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(120),
  sortOrder: z.coerce.number().int().optional(),
});

export const cityPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const siteDocumentPatchSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(200000),
});

export const filterDefCreateSchema = z.object({
  propertyType: z.string().min(1).max(40),
  fieldKey: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(200),
  fieldType: z.enum(["text", "number", "select"]),
  options: z.array(z.string()).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const filterDefPatchSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  fieldType: z.enum(["text", "number", "select"]).optional(),
  options: z.array(z.string()).nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  fieldKey: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/).optional(),
});

export const currencyCreateSchema = z.object({
  code: z.string().min(3).max(8).toUpperCase(),
  name: z.string().min(1).max(80),
  symbol: z.string().min(1).max(8),
  rateToUsd: z.coerce.number().positive(),
});
