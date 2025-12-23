import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// In Edge Runtime, environment variables are automatically available
// No need to use dotenv or process.cwd()
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ 
  client: sql,
  // Add query logging in development
  logger: process.env.NODE_ENV === 'development'
});