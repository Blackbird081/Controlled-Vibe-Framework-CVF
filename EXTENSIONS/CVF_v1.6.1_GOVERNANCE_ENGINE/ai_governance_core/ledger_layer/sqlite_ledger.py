"""Explicit single-host SQLite ledger with transactional append and snapshot reads."""

import hashlib
import json
import os
import shutil
import sqlite3
import tempfile
import uuid
from pathlib import Path

from .block_builder import BlockBuilder
from .hash_engine import HashEngine


SCHEMA_VERSION = 1
SIDECAR_SUFFIXES = ("-wal", "-shm", "-journal")
# Private test seam: point name -> callable. Empty in production; tests set and restore it.
_FAULTS = {}


def _fault(point, *args):
    hook = _FAULTS.get(point)
    if hook is not None:
        hook(*args)


def _sidecars(path):
    return [str(path) + suffix for suffix in SIDECAR_SUFFIXES if os.path.lexists(str(path) + suffix)]


def _require_sqlite_path(target):
    if Path(target).suffix.lower() != ".sqlite":
        raise ValueError("SQLite ledger requires an explicit .sqlite path")


def _reject_preexisting(target, label):
    if os.path.lexists(target) or _sidecars(target):
        raise FileExistsError(f"{label} target must be absent")


def _new_stage(target):
    target = Path(target)
    os.makedirs(os.path.dirname(os.path.abspath(target)), exist_ok=True)
    return str(target.with_name(f"{target.stem}.stage-{os.getpid()}-{uuid.uuid4().hex}.sqlite"))


def _discard_stage(stage):
    """Remove only this attempt's staging names; return any names that could not be removed."""
    residue = []
    for name in (stage, *(stage + suffix for suffix in SIDECAR_SUFFIXES)):
        try:
            os.unlink(name)
        except FileNotFoundError:
            pass
        except OSError:
            residue.append(name)
    return residue


def _seal(stage):
    """Fold WAL state into one self-contained rollback-journal file."""
    conn = sqlite3.connect(stage)
    try:
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        if conn.execute("PRAGMA journal_mode=DELETE").fetchone()[0].lower() != "delete":
            raise ValueError("Candidate could not be sealed")
    finally:
        conn.close()
    if _sidecars(stage):
        raise ValueError("Candidate is not self-contained")


def _read_candidate(stage):
    """Read-only verification of a sealed candidate; returns its validated chain."""
    conn = sqlite3.connect(Path(stage).resolve().as_uri() + "?mode=ro", uri=True)
    try:
        if conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise ValueError("Candidate integrity check failed")
        SqliteLedger._check_schema(conn)
        rows = conn.execute("SELECT ordinal, request_id, block_json, block_hash FROM blocks ORDER BY ordinal").fetchall()
        chain = SqliteLedger._decode_rows(rows)
    finally:
        conn.close()
    if _sidecars(stage):
        raise ValueError("Candidate is not self-contained")
    return chain


def _publish(stage, target):
    """Expose a verified candidate without overwriting: a hard link fails if target exists."""
    _fault("before_publication", stage, target)
    try:
        os.link(stage, target)
    except FileExistsError:
        raise
    except OSError as exc:
        raise OSError("No-clobber publication is unsupported on this filesystem") from exc


def _after_publication(stage):
    """Post-publication cleanup never fails the call; leftovers are reported, not raised."""
    try:
        _fault("after_publication", stage)
        residue = _discard_stage(stage)
    except Exception:
        residue = [stage]
    SqliteLedger.last_stage_residue = residue


def _abandon_stage(stage, exc):
    residue = _discard_stage(stage)
    if residue:
        exc.stage_residue = residue
        if hasattr(exc, "add_note"):
            exc.add_note("staging residue: " + ", ".join(residue))


def classify_target(target_path, expected=None):
    """Read-only state of a final target, computed on an independent byte copy.

    Never grants retry permission and never promotes the target to authoritative.
    """
    target = os.fspath(target_path)
    sidecars = _sidecars(target)
    result = {"state": None, "safe_to_retry": False, "authoritative": False,
              "sidecars": [os.path.basename(name) for name in sidecars], "count": None, "tip": None}
    if not os.path.lexists(target):
        result["state"] = "SIDECAR_ONLY" if sidecars else "CLEAN_ABSENT"
        return result
    with tempfile.TemporaryDirectory() as scratch:
        copy = os.path.join(scratch, "copy.sqlite")
        shutil.copyfile(target, copy)
        for name in sidecars:
            shutil.copyfile(name, copy + name[len(target):])
        conn = None
        try:
            conn = sqlite3.connect(copy)
            if not conn.execute("SELECT count(*) FROM sqlite_master").fetchone()[0]:
                result["state"] = "PARTIAL_OPENABLE_INCOMPLETE"
                return result
            SqliteLedger._check_schema(conn)
            rows = conn.execute("SELECT ordinal, request_id, block_json, block_hash FROM blocks ORDER BY ordinal").fetchall()
            chain = SqliteLedger._decode_rows(rows)
        except sqlite3.DatabaseError:
            result["state"] = "PARTIAL_UNOPENABLE"
            return result
        except (ValueError, KeyError, TypeError):
            result["state"] = "PARTIAL_OPENABLE_INCOMPLETE"
            return result
        finally:
            if conn is not None:
                conn.close()
    result["count"] = len(chain)
    result["tip"] = chain[-1]["hash"] if chain else "GENESIS"
    if expected is None:
        result["state"] = "UNKNOWN_PREEXISTING_ORIGIN"
    elif chain == expected:
        result["state"] = "USABLE_COMPLETE"
    else:
        result["state"] = "PARTIAL_OPENABLE_INCOMPLETE"
    return result


def _request_id(event):
    if not isinstance(event, dict):
        raise ValueError("Ledger event must be an object")
    value = event.get("request_id")
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Ledger event requires a nonempty request_id")
    return value


def _event_bytes(event):
    _request_id(event)
    return json.dumps(event, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def _validate_chain(chain):
    if not isinstance(chain, list):
        raise ValueError("Ledger chain must be a block list")
    prior = "GENESIS"
    ids = set()
    for block in chain:
        if not isinstance(block, dict) or set(block) != {"timestamp", "previous_hash", "event", "hash"}:
            raise ValueError("Ledger block schema mismatch")
        if not isinstance(block["timestamp"], str) or not block["timestamp"]:
            raise ValueError("Ledger block timestamp invalid")
        request_id = _request_id(block["event"])
        _event_bytes(block["event"])
        if request_id in ids:
            raise ValueError("Duplicate request_id in ledger chain")
        ids.add(request_id)
        if block["previous_hash"] != prior:
            raise ValueError("Ledger predecessor mismatch")
        expected = HashEngine.generate_hash({key: block[key] for key in ("timestamp", "previous_hash", "event")})
        if block["hash"] != expected:
            raise ValueError("Ledger block hash mismatch")
        prior = expected
    return prior


class SqliteLedger:
    """One SQLite database per local ledger; no implicit JSON cutover."""

    last_stage_residue = []

    def __init__(self, ledger_path, *, timeout=10.0):
        self.ledger_path = os.fspath(ledger_path)
        if Path(self.ledger_path).suffix.lower() != ".sqlite":
            raise ValueError("SQLite ledger requires an explicit .sqlite path")
        self.timeout = timeout
        self.builder = BlockBuilder()
        os.makedirs(os.path.dirname(os.path.abspath(self.ledger_path)), exist_ok=True)
        existed = os.path.exists(self.ledger_path)
        conn = self._connect()
        try:
            version = conn.execute("PRAGMA user_version").fetchone()[0]
            if version == 0:
                if existed or conn.execute("SELECT count(*) FROM sqlite_master WHERE type='table'").fetchone()[0]:
                    raise ValueError("Unversioned SQLite database is not a ledger")
                conn.execute("CREATE TABLE blocks (ordinal INTEGER PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, block_json TEXT NOT NULL, block_hash TEXT NOT NULL)")
                conn.execute(f"PRAGMA user_version={SCHEMA_VERSION}")
            elif version != SCHEMA_VERSION:
                raise ValueError("Unsupported SQLite ledger schema version")
            self._check_schema(conn)
            conn.commit()
        finally:
            conn.close()
        self.read_chain()

    def _connect(self):
        conn = sqlite3.connect(self.ledger_path, timeout=self.timeout)
        try:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=FULL")
            return conn
        except BaseException:
            conn.close()
            raise

    @staticmethod
    def _check_schema(conn):
        if conn.execute("PRAGMA user_version").fetchone()[0] != SCHEMA_VERSION:
            raise ValueError("SQLite ledger schema version mismatch")
        columns = conn.execute("PRAGMA table_xinfo(blocks)").fetchall()
        expected = [
            ("ordinal", "INTEGER", 0, 1),
            ("request_id", "TEXT", 1, 0),
            ("block_json", "TEXT", 1, 0),
            ("block_hash", "TEXT", 1, 0),
        ]
        actual = [(row[1], row[2].upper(), row[3], row[5]) for row in columns]
        if actual != expected or any(row[6] != 0 for row in columns):
            raise ValueError("SQLite ledger schema mismatch")
        indexes = conn.execute("PRAGMA index_list(blocks)").fetchall()
        if not any(
            row[2] == 1 and row[4] == 0
            and [col[0] for col in conn.execute(
                "SELECT name FROM pragma_index_info(?) ORDER BY seqno", (row[1],)
            )] == ["request_id"]
            for row in indexes
        ):
            raise ValueError("SQLite ledger request_id uniqueness missing")

    @staticmethod
    def _decode_rows(rows):
        chain = []
        for expected, (ordinal, request_id, raw, block_hash) in enumerate(rows, 1):
            if ordinal != expected:
                raise ValueError("SQLite ledger ordinal gap")
            block = json.loads(raw)
            if not isinstance(block, dict):
                raise ValueError("SQLite ledger block schema mismatch")
            if _request_id(block.get("event")) != request_id or block.get("hash") != block_hash:
                raise ValueError("SQLite ledger index and block mismatch")
            chain.append(block)
        _validate_chain(chain)
        return chain

    def read_chain(self):
        conn = self._connect()
        try:
            conn.execute("BEGIN")
            self._check_schema(conn)
            rows = conn.execute("SELECT ordinal, request_id, block_json, block_hash FROM blocks ORDER BY ordinal").fetchall()
            chain = self._decode_rows(rows)
            conn.commit()
            return chain
        except BaseException:
            conn.rollback()
            raise
        finally:
            conn.close()

    def lookup_request_id(self, request_id):
        if not isinstance(request_id, str) or not request_id:
            raise ValueError("request_id required")
        return next((block for block in self.read_chain() if block["event"]["request_id"] == request_id), None)

    def append_event(self, event_payload, *, after_acquire=None, before_commit=None):
        event_raw = _event_bytes(event_payload)
        request_id = event_payload["request_id"]
        conn = self._connect()
        try:
            conn.execute("BEGIN IMMEDIATE")
            if after_acquire is not None:
                after_acquire()
            self._check_schema(conn)
            rows = conn.execute("SELECT ordinal, request_id, block_json, block_hash FROM blocks ORDER BY ordinal").fetchall()
            chain = self._decode_rows(rows)
            existing = next((block for block in chain if block["event"]["request_id"] == request_id), None)
            if existing is not None:
                if _event_bytes(existing["event"]) != event_raw:
                    raise ValueError("Conflicting event for existing request_id")
                conn.commit()
                return existing
            block = self.builder.build_block(chain[-1]["hash"] if chain else "GENESIS", event_payload)
            conn.execute("INSERT INTO blocks (ordinal, request_id, block_json, block_hash) VALUES (?, ?, ?, ?)",
                         (len(chain) + 1, request_id, json.dumps(block, sort_keys=True, allow_nan=False), block["hash"]))
            if before_commit is not None:
                before_commit()
            conn.commit()
            return block
        except BaseException:
            conn.rollback()
            raise
        finally:
            conn.close()

    @classmethod
    def import_json(cls, source_path, target_path):
        """Import a copied quiescent source; the final target appears only after verification."""
        source = Path(source_path)
        target = Path(target_path)
        _require_sqlite_path(target)
        _reject_preexisting(target, "Migration")
        raw = source.read_bytes()
        chain = json.loads(raw)
        tip = _validate_chain(chain)
        if not chain:
            raise ValueError("Migration source chain is empty")
        stage = _new_stage(target)
        try:
            ledger = cls(stage)
            conn = ledger._connect()
            try:
                conn.execute("BEGIN IMMEDIATE")
                _fault("import_before_insert")
                for ordinal, block in enumerate(chain, 1):
                    conn.execute("INSERT INTO blocks (ordinal, request_id, block_json, block_hash) VALUES (?, ?, ?, ?)",
                                 (ordinal, block["event"]["request_id"], json.dumps(block, sort_keys=True, allow_nan=False), block["hash"]))
                    _fault("import_insert", ordinal)
                conn.commit()
            except BaseException:
                conn.rollback()
                raise
            finally:
                conn.close()
            _seal(stage)
            _fault("after_candidate_close", stage)
            _fault("before_source_reverify", source)
            if _read_candidate(stage) != chain or source.read_bytes() != raw:
                raise ValueError("Migration verification failed")
            _publish(stage, target)
        except BaseException as exc:
            _abandon_stage(stage, exc)
            raise
        _after_publication(stage)
        return {"source_sha256": hashlib.sha256(raw).hexdigest(), "count": len(chain), "tip": tip}

    @staticmethod
    def _copy_verified(source_conn, target, expected_check):
        """Backup-copy into a staged candidate, verify it, then publish without overwrite."""
        stage = _new_stage(target)
        try:
            destination = sqlite3.connect(stage)
            try:
                source_conn.backup(destination, pages=8, progress=lambda *_: _fault("backup_progress"))
            finally:
                destination.close()
            _seal(stage)
            _fault("after_candidate_close", stage)
            actual = _read_candidate(stage)
            expected_check(actual)
            result = {"count": len(actual), "tip": _validate_chain(actual),
                      "request_ids": [block["event"]["request_id"] for block in actual]}
            source_conn.close()
            _publish(stage, target)
        except BaseException as exc:
            _abandon_stage(stage, exc)
            raise
        _after_publication(stage)
        return result

    def backup_to(self, target_path):
        target = Path(target_path)
        _require_sqlite_path(target)
        _reject_preexisting(target, "Backup")
        before = self.read_chain()

        def check(actual):
            # Append-only source: the snapshot must extend what existed before the copy
            # and be a prefix of what exists after it.
            after = self.read_chain()
            if actual[:len(before)] != before or after[:len(actual)] != actual:
                raise ValueError("Backup snapshot does not match source")

        source = self._connect()
        try:
            return self._copy_verified(source, target, check)
        finally:
            source.close()

    @classmethod
    def restore_backup(cls, backup_path, target_path):
        """Verify a backup and restore it to an absent local database path."""
        target = Path(target_path)
        _require_sqlite_path(target)
        if not Path(backup_path).is_file():
            raise FileNotFoundError("Backup source is absent")
        _reject_preexisting(target, "Restore")
        source = sqlite3.connect(Path(backup_path).resolve().as_uri() + "?mode=ro", uri=True)
        try:
            cls._check_schema(source)
            expected = cls._decode_rows(source.execute(
                "SELECT ordinal, request_id, block_json, block_hash FROM blocks ORDER BY ordinal").fetchall())

            def check(actual):
                if actual != expected:
                    raise ValueError("Restored chain differs from backup")

            return cls._copy_verified(source, target, check)
        finally:
            source.close()
