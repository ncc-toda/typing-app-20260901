CREATE TABLE problems (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
	opponent_name TEXT NOT NULL,
	opponent_message TEXT NOT NULL,
	reply_text TEXT NOT NULL,
	sort_order INTEGER NOT NULL
);

CREATE TABLE play_results (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	anonymous_id TEXT NOT NULL,
	difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
	salary INTEGER NOT NULL,
	cpm REAL NOT NULL,
	accuracy REAL NOT NULL,
	miss_count INTEGER NOT NULL,
	max_combo INTEGER NOT NULL,
	replies_completed INTEGER NOT NULL,
	duration_ms INTEGER NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE play_key_stats (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	play_result_id INTEGER NOT NULL REFERENCES play_results (id),
	key TEXT NOT NULL,
	hit_count INTEGER NOT NULL,
	miss_count INTEGER NOT NULL
);

CREATE TABLE play_transition_stats (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	play_result_id INTEGER NOT NULL REFERENCES play_results (id),
	from_key TEXT NOT NULL,
	to_key TEXT NOT NULL,
	hit_count INTEGER NOT NULL,
	miss_count INTEGER NOT NULL
);

CREATE INDEX idx_problems_difficulty ON problems (difficulty, sort_order);
CREATE INDEX idx_play_results_anonymous ON play_results (anonymous_id, created_at);
CREATE INDEX idx_play_key_stats_result ON play_key_stats (play_result_id);
CREATE INDEX idx_play_transition_stats_result ON play_transition_stats (play_result_id);
