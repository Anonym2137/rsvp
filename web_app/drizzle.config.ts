/// <reference types="node" />
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
   out: "./drizzle",
   schema: "./server/db/schema.ts",
   dialect: 'sqlite',
   dbCredentials: {
      url: process.env.DATABASE_URL!,
   },
   verbose: true,
   strict: true,
})