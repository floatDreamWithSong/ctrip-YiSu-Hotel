import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production", override: true });
  dotenv.config({ path: ".env.production.local", override: true });
} else if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env.development", override: true });
  dotenv.config({ path: ".env.development.local", override: true });
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env("DIRECT_URL")
  }
});