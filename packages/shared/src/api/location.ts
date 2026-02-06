import {
  regeocodeRequestSchema,
  regeocodeResponseSchema,
  inputTipsRequestSchema,
  inputTipsResponseSchema,
  geocodeRequestSchema,
  geocodeResponseSchema,
} from "../schema/location";
import z from "zod";

export const ApiLocationSchemas = {
  regeocodeRequest: regeocodeRequestSchema,
  regeocodeResponse: regeocodeResponseSchema,
  inputTipsRequest: inputTipsRequestSchema,
  inputTipsResponse: inputTipsResponseSchema,
  geocodeRequest: geocodeRequestSchema,
  geocodeResponse: geocodeResponseSchema,
};

export type ApiLocationTypes = {
  [key in keyof typeof ApiLocationSchemas as `${Capitalize<key>}`]: z.infer<typeof ApiLocationSchemas[key]>
};
