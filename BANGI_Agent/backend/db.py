"""
BANGI Persistence Engine (SQLite WAL + Event Sourcing) v0.5
===========================================================
Thread-safe SQLite database manager for task state tracking, event logging, and session replay.
Stored in ~/.bangi/bangi.db with WAL mode enabled.
"""
import os
import json
import sqlite3
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("bangi.db")


class BangiDB:
    """
    SQLite persistence manager for Bangi-Agent.
    Handles task lifecycle tracking, event logging, and state recovery.
    """

    def __init__(self, db_dir: Optional[Path] = None):
        import tempfile
        # NFR: sandbox-aware — test if we can actually write
        if db_dir is None:
            candidate = Path.home() / ".bangi"
            # check writability, not just mkdir
            try:
                candidate.mkdir(parents=True, exist_ok=True)
                test_file = candidate / ".write_test"
                test_file.write_text("ok")
                test_file.unlink(missing_ok=True)
                # also test sqlite open
                import sqlite3 as _sql
                _c = _sql.connect(str(candidate / "bangi.db"), timeout=1.0)
                _c.execute("SELECT 1")
                _c.close()
                db_dir = candidate
            except Exception as e:
                db_dir = Path(tempfile.gettempdir()) / ".bangi"
                try:
                    db_dir.mkdir(parents=True, exist_ok=True)
                except Exception:
                    pass
                logger.warning(f"Database path fallback to {db_dir}: {e}")
                candidate = db_dir
        
        try:
            db_dir.mkdir(parents=True, exist_ok=True)
            self.db_path = db_dir / "bangi.db"
            self.events_path = db_dir / "events.jsonl"
        except Exception as e:
            db_dir = Path(tempfile.gettempdir()) / ".bangi"
            db_dir.mkdir(parents=True, exist_ok=True)
            self.db_path = db_dir / "bangi.db"
            self.events_path = db_dir / "events.jsonl"
            logger.warning(f"Database path fallback to {db_dir}: {e}")

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), timeout=30.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA busy_timeout=5000;")
        return conn

    def _init_db(self):
        """Initialize database tables for tasks and events."""
        with self._get_connection() as conn:
            # WAL + busy timeout set once at init
            try:
                conn.execute("PRAGMA journal_mode=WAL;")
            except Exception:
                pass
            conn.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    prompt TEXT NOT NULL,
                    task_type TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    status TEXT NOT NULL,
                    result TEXT,
                    correlation_id TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT,
                    event_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    correlation_id TEXT,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.commit()
            logger.info(f"SQLite DB initialized at {self.db_path} (WAL mode enabled)")

    def create_task(self, prompt: str, task_type: str = "generic", mode: str = "fast-path", correlation_id: Optional[str] = None) -> str:
        """Create a new task entry in the database."""
        task_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO tasks (id, prompt, task_type, mode, status, correlation_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (task_id, prompt, task_type, mode, "queued", correlation_id, now, now)
            )
            conn.commit()
        self.log_event("task_created", {"task_id": task_id, "prompt": prompt, "mode": mode}, task_id=task_id, correlation_id=correlation_id)
        return task_id

    def update_task_status(self, task_id: str, status: str, result: Optional[Dict[str, Any]] = None, mode: Optional[str] = None):
        """Update task status and result payload."""
        now = datetime.utcnow().isoformat()
        result_str = json.dumps(result, ensure_ascii=False) if result else None
        with self._get_connection() as conn:
            if mode:
                conn.execute(
                    "UPDATE tasks SET status = ?, result = ?, mode = ?, updated_at = ? WHERE id = ?",
                    (status, result_str, mode, now, task_id)
                )
            else:
                conn.execute(
                    "UPDATE tasks SET status = ?, result = ?, updated_at = ? WHERE id = ?",
                    (status, result_str, now, task_id)
                )
            conn.commit()
        self.log_event("task_updated", {"task_id": task_id, "status": status, "mode": mode}, task_id=task_id)

    def log_event(self, event_type: str, payload: Dict[str, Any], task_id: Optional[str] = None, correlation_id: Optional[str] = None):
        """Log an event to SQLite and append to events.jsonl."""
        now = datetime.utcnow().isoformat()
        payload_str = json.dumps(payload, ensure_ascii=False)
        
        # 1. Store in SQLite
        try:
            with self._get_connection() as conn:
                conn.execute(
                    "INSERT INTO events (task_id, event_type, payload, correlation_id, timestamp) VALUES (?, ?, ?, ?, ?)",
                    (task_id, event_type, payload_str, correlation_id, now)
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to log event to SQLite: {e}")

        # 2. Append to events.jsonl
        try:
            event_obj = {
                "ts": now,
                "type": event_type,
                "task_id": task_id,
                "correlation_id": correlation_id,
                "payload": payload
            }
            with open(self.events_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(event_obj, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning(f"Failed to write to events.jsonl: {e}")

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve task details by ID."""
        with self._get_connection() as conn:
            cur = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
            row = cur.fetchone()
            if row:
                d = dict(row)
                if d.get("result"):
                    try:
                        d["result"] = json.loads(d["result"])
                    except Exception:
                        pass
                return d
        return None

    def list_tasks(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent tasks."""
        tasks = []
        with self._get_connection() as conn:
            cur = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?", (limit,))
            for row in cur.fetchall():
                d = dict(row)
                if d.get("result"):
                    try:
                        d["result"] = json.loads(d["result"])
                    except Exception:
                        pass
                tasks.append(d)
        return tasks

    def health(self) -> Dict[str, Any]:
        """Check database health."""
        try:
            with self._get_connection() as conn:
                cur = conn.execute("SELECT COUNT(*) as count FROM tasks")
                count = cur.fetchone()["count"]
            return {"status": "ok", "db_path": str(self.db_path), "task_count": count, "events_log": str(self.events_path)}
        except Exception as e:
            return {"status": "error", "error": str(e)}
