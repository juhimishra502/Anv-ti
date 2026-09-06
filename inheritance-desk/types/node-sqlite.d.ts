// Minimal ambient types for Node's built-in SQLite (node:sqlite), covering the
// subset used by lib/db. @types/node@20 does not yet ship these; this avoids a
// dependency bump while keeping the code type-checked. Node 22.5+/24 provides the
// runtime module.
declare module "node:sqlite" {
  interface StatementSync {
    run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  interface DatabaseSyncOptions {
    open?: boolean;
    readOnly?: boolean;
    enableForeignKeyConstraints?: boolean;
  }

  export class DatabaseSync {
    constructor(path: string, options?: DatabaseSyncOptions);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
