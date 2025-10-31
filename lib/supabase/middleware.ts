import { updateSession as sqliteUpdateSession } from '../sqlite/middleware';
import { type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Use SQLite middleware for session management
  return await sqliteUpdateSession(request);
}
