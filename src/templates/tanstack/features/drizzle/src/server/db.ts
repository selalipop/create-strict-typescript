import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.ts";

const url = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./data.db";
const sqlite = new Database(url);
export const db = drizzle(sqlite, { schema });
