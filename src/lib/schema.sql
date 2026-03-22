-- src/lib/schema.sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS site_diary_entries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  date TEXT NOT NULL,
  raw_text TEXT,
  structured_data TEXT NOT NULL, -- JSON detailed payload
  confidence TEXT NOT NULL DEFAULT 'low',
  source_refs TEXT, -- JSON array of file IDs or strings
  missing_data TEXT, -- JSON array of missing fields
  needs_confirmation BOOLEAN DEFAULT 1,
  version INTEGER DEFAULT 1,
  rule_violations TEXT, -- JSON payload of business logic issues
  compliance_status TEXT DEFAULT 'compliant', -- 'compliant', 'flagged', 'violation'
  review_status TEXT DEFAULT 'pending',
  resolution_note TEXT,
  visual_evidence_summary TEXT, -- Summary from Gemini Vision
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_diary_id TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(source_diary_id) REFERENCES site_diary_entries(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS estimate_reviews (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  source_file_id TEXT NOT NULL,
  findings_json TEXT NOT NULL, -- JSON detailed findings
  confidence TEXT NOT NULL DEFAULT 'low',
  source_refs TEXT, -- JSON array
  missing_data TEXT, -- JSON array
  needs_confirmation BOOLEAN DEFAULT 1,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(source_file_id) REFERENCES project_files(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_name TEXT NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
