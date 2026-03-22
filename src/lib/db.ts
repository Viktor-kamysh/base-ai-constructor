import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Setup database path
const dbPath = path.join(process.cwd(), 'data.db');
const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');

// Initialize database
let db: Database.Database;

try {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');

    // Initialize schema if needed
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
    } else {
        console.warn(`Schema file not found at ${schemaPath}`);
    }
} catch (error) {
    console.error('Failed to initialize better-sqlite3 database', error);
    throw error;
}

// Simple migration pattern for SQLite
try {
    db.prepare('SELECT rule_violations FROM site_diary_entries LIMIT 1').get();
} catch (err) {
    db.exec('ALTER TABLE site_diary_entries ADD COLUMN rule_violations TEXT;');
    db.exec("ALTER TABLE site_diary_entries ADD COLUMN compliance_status TEXT DEFAULT 'compliant';");
}

try {
    db.prepare('SELECT visual_evidence_summary FROM site_diary_entries LIMIT 1').get();
} catch (err) {
    db.exec('ALTER TABLE site_diary_entries ADD COLUMN visual_evidence_summary TEXT;');
}

try {
    db.prepare('SELECT review_status FROM site_diary_entries LIMIT 1').get();
} catch (err) {
    db.exec("ALTER TABLE site_diary_entries ADD COLUMN review_status TEXT DEFAULT 'pending';");
    db.exec("ALTER TABLE site_diary_entries ADD COLUMN resolution_note TEXT;");
}

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_estimates (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            unit TEXT NOT NULL,
            planned_quantity REAL NOT NULL,
            unit_price REAL NOT NULL,
            total_budget REAL NOT NULL,
            used_quantity REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    `);
} catch (err) {
    console.error("Failed to ensure project_estimates table", err);
}

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_schedule (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            task_name TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            dependency_id TEXT,
            status TEXT DEFAULT 'not_started',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    `);
} catch (err) {
    console.error("Failed to ensure project_schedule table", err);
}

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL,
            user_name TEXT NOT NULL,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
} catch (err) {
    console.error("Failed to ensure audit_logs table", err);
}

export default db;
