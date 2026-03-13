import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH =
  process.env.DB_PATH ?? path.join(process.cwd(), "data", "careerlab.db");

let db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }

  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      topic      TEXT,
      color      TEXT DEFAULT '#46549C',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS participants (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT,
      email      TEXT,
      team_id    INTEGER REFERENCES teams(id),
      role       TEXT DEFAULT 'participant',
      joined_at  TEXT DEFAULT (date('now')),
      status     TEXT DEFAULT 'active',
      note       TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workshops (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      session_no      INTEGER NOT NULL,
      title           TEXT NOT NULL,
      held_date       TEXT,
      location        TEXT,
      facilitator     TEXT,
      status          TEXT DEFAULT 'planned',
      plan_doc_url    TEXT,
      result_doc_url  TEXT,
      note            TEXT
    );

    CREATE TABLE IF NOT EXISTS workshop_attendance (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id     INTEGER REFERENCES workshops(id),
      participant_id  INTEGER REFERENCES participants(id),
      attended        INTEGER DEFAULT 0,
      UNIQUE(workshop_id, participant_id)
    );

    CREATE TABLE IF NOT EXISTS team_activities (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id       INTEGER REFERENCES teams(id),
      activity_no   INTEGER NOT NULL,
      activity_type TEXT,
      held_date     TEXT,
      location      TEXT,
      summary       TEXT,
      status        TEXT DEFAULT 'planned',
      report_url    TEXT,
      evidence_urls TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kpi_snapshots (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date      TEXT DEFAULT (date('now')),
      participants_count INTEGER DEFAULT 0,
      workshops_done     INTEGER DEFAULT 0,
      activities_done    INTEGER DEFAULT 0,
      solutions_count    INTEGER DEFAULT 0,
      trainings_done     INTEGER DEFAULT 0,
      note               TEXT
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      deliverable_type TEXT NOT NULL,
      title            TEXT NOT NULL,
      due_date         TEXT,
      submitted_at     TEXT,
      file_url         TEXT,
      status           TEXT DEFAULT 'pending',
      note             TEXT
    );
  `);
}
