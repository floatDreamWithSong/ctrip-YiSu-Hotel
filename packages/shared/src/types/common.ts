import { pageQuerySchema } from "../schema/common";
import z from "zod";

export type PageQuery = z.infer<typeof pageQuerySchema>;