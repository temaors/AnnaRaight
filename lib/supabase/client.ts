import { createClient as createSQLiteClient } from '../sqlite/client';

export function createClient() {
  return createSQLiteClient();
}
