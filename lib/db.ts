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
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      session_type     TEXT NOT NULL DEFAULT 'workshop',
      session_id       INTEGER NOT NULL,
      participant_id   INTEGER REFERENCES participants(id),
      participant_name TEXT,
      attended         INTEGER DEFAULT 0,
      attended_at      TEXT,
      signature_data   TEXT,
      ip_address       TEXT,
      UNIQUE(session_type, session_id, participant_id)
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

  migrateAttendanceTable(database);
}

function migrateAttendanceTable(database: Database.Database) {
  const columns = database
    .prepare("PRAGMA table_info(workshop_attendance)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("session_type")) {
    database.exec(
      "ALTER TABLE workshop_attendance ADD COLUMN session_type TEXT DEFAULT 'workshop'",
    );
  }

  if (!columnNames.has("session_id")) {
    database.exec("ALTER TABLE workshop_attendance ADD COLUMN session_id INTEGER");
  }

  if (!columnNames.has("participant_name")) {
    database.exec("ALTER TABLE workshop_attendance ADD COLUMN participant_name TEXT");
  }

  if (!columnNames.has("attended_at")) {
    database.exec("ALTER TABLE workshop_attendance ADD COLUMN attended_at TEXT");
  }

  if (!columnNames.has("signature_data")) {
    database.exec("ALTER TABLE workshop_attendance ADD COLUMN signature_data TEXT");
  }

  if (!columnNames.has("ip_address")) {
    database.exec("ALTER TABLE workshop_attendance ADD COLUMN ip_address TEXT");
  }

  if (columnNames.has("workshop_id")) {
    database.exec(`
      UPDATE workshop_attendance
      SET session_id = COALESCE(session_id, workshop_id)
      WHERE workshop_id IS NOT NULL
    `);
  }

  database.exec(`
    UPDATE workshop_attendance
    SET participant_name = COALESCE(
      participant_name,
      (SELECT name FROM participants p WHERE p.id = workshop_attendance.participant_id)
    )
    WHERE participant_id IS NOT NULL
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_workshop_attendance_session
    ON workshop_attendance(session_type, session_id);

    CREATE INDEX IF NOT EXISTS idx_workshop_attendance_attended
    ON workshop_attendance(session_type, session_id, attended);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_attendance_session_participant
    ON workshop_attendance(session_type, session_id, participant_id)
    WHERE participant_id IS NOT NULL;
  `);
}
