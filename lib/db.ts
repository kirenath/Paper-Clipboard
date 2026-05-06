import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATABASE_PATH = ".data/clipboard.sqlite3";

const globalForDb = globalThis as unknown as {
  __clipboardDb?: Database.Database;
};

function isSubPath(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function resolveDatabasePath(): string {
  const configuredPath =
    process.env.DATABASE_PATH?.trim() || DEFAULT_DATABASE_PATH;
  const cwd = path.resolve(/* turbopackIgnore: true */ process.cwd());
  const resolved = path.resolve(cwd, configuredPath);

  const forbiddenDirectories = [
    "public",
    ".next",
    "app",
    "pages",
    "components",
    "styles",
    "hooks",
    "node_modules",
    "out",
    "build",
  ].map((dir) => path.resolve(cwd, dir));

  if (forbiddenDirectories.some((dir) => isSubPath(dir, resolved))) {
    throw new Error(
      "DATABASE_PATH points to a forbidden application/static/build directory",
    );
  }

  return resolved;
}

function initializeDatabase(): Database.Database {
  const databasePath = resolveDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");

  const schemaPath = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    "db/schema.sql",
  );
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  db.exec(schemaSql);
  db.pragma("foreign_keys = ON");

  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__clipboardDb) {
    globalForDb.__clipboardDb = initializeDatabase();
  }
  return globalForDb.__clipboardDb;
}
