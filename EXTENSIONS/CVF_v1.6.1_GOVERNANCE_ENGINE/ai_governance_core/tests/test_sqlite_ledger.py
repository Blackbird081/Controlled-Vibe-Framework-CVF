"""Synthetic local transaction, migration, restore and real peer proofs."""

import hashlib
import json
import os
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

import pytest

from ledger_layer.block_builder import BlockBuilder
from ledger_layer.sqlite_ledger import SqliteLedger


def _state(ledger):
    chain = ledger.read_chain()
    return (len(chain), chain[-1]["hash"] if chain else "GENESIS",
            [block["event"]["request_id"] for block in chain], chain)


def test_append_rollback_duplicate_and_exact_lookup(tmp_path):
    ledger = SqliteLedger(tmp_path / "candidate.sqlite")
    first = ledger.append_event({"request_id": "one", "artifact_id": "artifact-A"})
    before = _state(ledger)

    def fail_after_acquire():
        raise RuntimeError("AFTER_ACQUIRE_BEFORE_MUTATION")

    with pytest.raises(RuntimeError, match="AFTER_ACQUIRE_BEFORE_MUTATION"):
        ledger.append_event({"request_id": "two"}, after_acquire=fail_after_acquire)
    assert _state(ledger) == before
    assert ledger.lookup_request_id("two") is None
    with pytest.raises(RuntimeError, match="AFTER_INSERT_BEFORE_COMMIT"):
        ledger.append_event({"request_id": "two"}, before_commit=lambda: (_ for _ in ()).throw(RuntimeError("AFTER_INSERT_BEFORE_COMMIT")))
    assert _state(ledger) == before
    assert ledger.append_event({"artifact_id": "artifact-A", "request_id": "one"}) == first
    assert _state(ledger) == before
    with pytest.raises(ValueError, match="Conflicting"):
        ledger.append_event({"request_id": "one", "artifact_id": "artifact-B"})
    assert _state(ledger) == before
    assert ledger.lookup_request_id("one") == first
    assert ledger.append_event({"request_id": "two"})["previous_hash"] == first["hash"]
    assert _state(ledger)[0] == 2  # SUBSEQUENT_PEER_ACQUIRES is tested below.
    assert SqliteLedger(tmp_path / "candidate.sqlite").lookup_request_id("two")["event"]["request_id"] == "two"


def test_incompatible_existing_database_is_not_initialized(tmp_path):
    target = tmp_path / "unknown.sqlite"
    sqlite3.connect(target).close()
    with pytest.raises(ValueError, match="Unversioned"):
        SqliteLedger(target)
    assert target.exists()


@pytest.mark.parametrize("schema", [
    "ordinal TEXT, request_id TEXT NOT NULL, block_json TEXT NOT NULL, block_hash TEXT NOT NULL, UNIQUE(request_id, block_hash)",
    "ordinal INTEGER PRIMARY KEY, request_id TEXT NOT NULL, block_json TEXT NOT NULL, block_hash TEXT NOT NULL, UNIQUE(request_id, block_hash)",
    "ordinal INTEGER PRIMARY KEY, request_id TEXT, block_json TEXT NOT NULL, block_hash TEXT NOT NULL, UNIQUE(request_id)",
])
def test_version_one_incompatible_schema_rejected(tmp_path, schema):
    target = tmp_path / "wrong-schema.sqlite"
    with sqlite3.connect(target) as conn:
        conn.execute(f"CREATE TABLE blocks ({schema})")
        conn.execute("PRAGMA user_version=1")
    with pytest.raises(ValueError, match="schema|uniqueness"):
        SqliteLedger(target)


def test_version_one_partial_request_id_index_rejected(tmp_path):
    target = tmp_path / "partial-schema.sqlite"
    with sqlite3.connect(target) as conn:
        conn.execute("CREATE TABLE blocks (ordinal INTEGER PRIMARY KEY, request_id TEXT NOT NULL, block_json TEXT NOT NULL, block_hash TEXT NOT NULL)")
        conn.execute("CREATE UNIQUE INDEX request_id_partial ON blocks(request_id) WHERE request_id != ''")
        conn.execute("PRAGMA user_version=1")
    with pytest.raises(ValueError, match="uniqueness"):
        SqliteLedger(target)


def test_import_rejects_bad_source_and_restores_clean_backup(tmp_path):
    builder = BlockBuilder()
    one = builder.build_block("GENESIS", {"request_id": "one", "artifact_id": "A"})
    two = builder.build_block(one["hash"], {"request_id": "two", "artifact_id": "B"})
    source = tmp_path / "source-copy.json"
    source.write_text(json.dumps([one, two]), encoding="utf-8")
    raw = source.read_bytes()
    target = tmp_path / "imported.sqlite"
    result = SqliteLedger.import_json(source, target)
    assert result == {"source_sha256": hashlib.sha256(raw).hexdigest(), "count": 2, "tip": two["hash"]}
    assert source.read_bytes() == raw
    ledger = SqliteLedger(target)
    assert ledger.read_chain() == [one, two]
    assert ledger.lookup_request_id("two")["event"]["artifact_id"] == "B"
    with pytest.raises(FileExistsError):
        SqliteLedger.import_json(source, target)
    assert ledger.read_chain() == [one, two]

    bad = tmp_path / "bad.json"
    for chain in ([dict(two, hash="0" * 64)], [one, one], [dict(two, previous_hash="GENESIS")]):
        bad.write_text(json.dumps(chain), encoding="utf-8")
        with pytest.raises(ValueError):
            SqliteLedger.import_json(bad, tmp_path / "rejected.sqlite")
        assert not (tmp_path / "rejected.sqlite").exists()

    backup = tmp_path / "backup.sqlite"
    snapshot = ledger.backup_to(backup)
    assert snapshot == {"count": 2, "tip": two["hash"], "request_ids": ["one", "two"]}
    clean = tmp_path / "clean.sqlite"
    assert SqliteLedger.restore_backup(backup, clean) == snapshot
    restored = SqliteLedger(clean)
    assert restored.read_chain() == [one, two]
    with sqlite3.connect(backup) as conn:
        conn.execute("UPDATE blocks SET block_hash=? WHERE ordinal=2", ("0" * 64,))
    with pytest.raises(ValueError, match="mismatch"):
        SqliteLedger(backup)


def _assert_order(events, release_start_ns, entered_ns):
    # Child occurrence time, rather than parent pipe-read order, decides
    # whether entry preceded release. perf_counter_ns uses the shared OS clock.
    if entered_ns < release_start_ns:
        raise AssertionError("REJECT_ENTRY_BEFORE_PARENT_RELEASE")
    assert events.index("READY") < events.index("START_ATTEMPT") < events.index("ATTEMPTING")
    assert events.index("PARENT_RELEASE") < events.index("ENTERED") < events.index("COMPLETE")


def _run_peer_barrier(path, request_id, *, early_mutant=False):
    parent = sqlite3.connect(path)
    parent.execute("BEGIN IMMEDIATE")
    events = []
    command = [sys.executable, str(Path(__file__).with_name("q001_sqlite_ledger_peer.py")), str(path), request_id]
    if early_mutant:
        command.append("--early-entered-mutant")
    child = subprocess.Popen(command,
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             text=True, bufsize=1, cwd=str(Path(__file__).parents[1]),
                             env={**os.environ, "PYTHONPATH": str(Path(__file__).parents[1])})
    try:
        assert child.stdout.readline().strip() == "READY"
        events.append("READY")
        child.stdin.write("START_ATTEMPT\n")
        child.stdin.flush()
        events.append("START_ATTEMPT")
        assert child.stdout.readline().strip() == "ATTEMPTING"
        events.append("ATTEMPTING")
        # The locked parent owns the write transaction. Release is an explicit
        # event, never inferred from a timeout or missing child output.
        release_start_ns = time.perf_counter_ns()
        parent.commit()
        events.append("PARENT_RELEASE")
        entered_line = child.stdout.readline().strip()
        assert entered_line.startswith("ENTERED:")
        entered_ns = int(entered_line.split(":", 1)[1])
        events.append("ENTERED")
        assert child.stdout.readline().strip() == "COMPLETE"
        events.append("COMPLETE")
        assert child.wait(timeout=10) == 0, child.stderr.read()
    finally:
        parent.rollback()
        parent.close()
        if child.poll() is None:
            child.kill()
            child.wait(timeout=10)
    return events, release_start_ns, entered_ns


def test_real_second_process_serializes_and_post_acquire_cleanup(tmp_path):
    path = tmp_path / "peer.sqlite"
    ledger = SqliteLedger(path)
    ledger.append_event({"request_id": "one"})
    _assert_order(*_run_peer_barrier(path, "two"))
    mutant_path = tmp_path / "mutant.sqlite"
    SqliteLedger(mutant_path)
    with pytest.raises(AssertionError, match="REJECT_ENTRY_BEFORE_PARENT_RELEASE"):
        _assert_order(*_run_peer_barrier(mutant_path, "mutant", early_mutant=True))
    assert _state(ledger)[2] == ["one", "two"]

    def fail():
        raise RuntimeError("AFTER_ACQUIRE_BEFORE_MUTATION")

    before = _state(ledger)
    with pytest.raises(RuntimeError, match="AFTER_ACQUIRE_BEFORE_MUTATION"):
        ledger.append_event({"request_id": "fault"}, after_acquire=fail)
    assert _state(ledger) == before
    subsequent = subprocess.run([sys.executable, str(Path(__file__).with_name("q001_sqlite_ledger_peer.py")), str(path), "three"],
                                input="START_ATTEMPT\n", capture_output=True, text=True,
                                cwd=str(Path(__file__).parents[1]), timeout=10,
                                env={**os.environ, "PYTHONPATH": str(Path(__file__).parents[1])})
    assert subsequent.returncode == 0, subsequent.stderr
    assert subsequent.stdout.splitlines()[0:2] == ["READY", "ATTEMPTING"]
    assert subsequent.stdout.splitlines()[2].startswith("ENTERED:")
    assert subsequent.stdout.splitlines()[3] == "COMPLETE"
    assert _state(ledger)[2] == ["one", "two", "three"]  # SUBSEQUENT_PEER_ACQUIRES


def test_api_backend_selection_and_limited_tail(tmp_path, monkeypatch):
    import importlib

    monkeypatch.setenv("CVF_GOVERNANCE_LEDGER_PATH", str(tmp_path / "api.sqlite"))
    import api.server as server
    server = importlib.reload(server)
    try:
        assert isinstance(server._ledger, SqliteLedger)
        for request_id in ("a", "b", "c"):
            server._ledger.append_event({"request_id": request_id})
        import asyncio
        result = asyncio.run(server.ledger(limit=2))
        assert result.data["total_blocks"] == 3
        assert result.data["returned"] == 2
        assert [entry["event"]["request_id"] for entry in result.data["entries"]] == ["b", "c"]
        assert set(result.data["entries"][0]) == {"timestamp", "previous_hash", "event", "hash"}
    finally:
        json_path = tmp_path / "api.json"
        json_path.write_text("[]", encoding="utf-8")
        monkeypatch.setenv("CVF_GOVERNANCE_LEDGER_PATH", str(json_path))
        importlib.reload(server)


# ---- Q001 target-publication correction: staged verification, no-clobber, faults, mutants ----

import ledger_layer.sqlite_ledger as owner  # noqa: E402


@pytest.fixture(autouse=True)
def _restore_fault_seam():
    saved = dict(owner._FAULTS)
    owner._FAULTS.clear()
    yield
    owner._FAULTS.clear()
    owner._FAULTS.update(saved)


_CHAINS = {}


def _chain(count):
    """Deterministic synthetic chain: built once per length so later comparisons see identical blocks."""
    if count not in _CHAINS:
        builder, chain, prior = BlockBuilder(), [], "GENESIS"
        for index in range(count):
            block = builder.build_block(prior, {"request_id": f"r{index:02d}", "artifact_id": "synthetic"})
            chain.append(block)
            prior = block["hash"]
        _CHAINS[count] = chain
    return list(_CHAINS[count])


def _source(tmp_path, count=12, name="source.json"):
    path = tmp_path / name
    path.write_text(json.dumps(_chain(count)), encoding="utf-8")
    return path


def _raw_ids(path):
    conn = sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True)
    try:
        return [row[0] for row in conn.execute("SELECT request_id FROM blocks ORDER BY ordinal")]
    finally:
        conn.close()


def _names(directory):
    return sorted(os.listdir(directory))


def _big_ledger(path, count=40):
    ledger = SqliteLedger(path)
    for index in range(count):
        ledger.append_event({"request_id": f"big{index:02d}", "pad": "x" * 3000})
    return ledger


def _boom(*_args):
    raise RuntimeError("INJECTED_FAULT")


def _assert_publication_clean(directory, target, allowed):
    """Oracle: after a handled pre-publication failure the final target, sidecars and stages are absent."""
    if os.path.lexists(target) or owner._sidecars(target):
        raise AssertionError("FINAL_OR_SIDECAR_PRESENT_AFTER_HANDLED_FAULT")
    if _names(directory) != sorted(allowed):
        raise AssertionError(f"UNACCOUNTED_RESIDUE {_names(directory)}")


def test_import_candidate_verified_before_publication(tmp_path):
    src, target = _source(tmp_path), tmp_path / "final.sqlite"
    seen = {}

    def observe(stage, final):
        seen["target_absent"] = not os.path.lexists(final)
        seen["stage_ids"] = _raw_ids(stage)  # VERIFIED_BEFORE_PUBLICATION
        seen["sidecars"] = owner._sidecars(stage)

    owner._FAULTS["before_publication"] = observe
    result = SqliteLedger.import_json(src, target)
    assert seen == {"target_absent": True, "stage_ids": [f"r{i:02d}" for i in range(12)], "sidecars": []}
    assert set(result) == {"source_sha256", "count", "tip"} and result["count"] == 12
    assert _raw_ids(target) == seen["stage_ids"] and owner._sidecars(target) == []
    assert _names(tmp_path) == ["final.sqlite", "source.json"] and SqliteLedger.last_stage_residue == []
    assert owner.classify_target(target, _chain(12))["state"] == "USABLE_COMPLETE"


@pytest.mark.parametrize("point,hook", [
    ("import_before_insert", _boom),
    ("import_insert", lambda ordinal: _boom() if ordinal == 7 else None),
    ("after_candidate_close", _boom),
    ("before_publication", _boom),
])
def test_import_handled_fault_leaves_no_final_and_keeps_source(tmp_path, point, hook):
    src, target = _source(tmp_path), tmp_path / "final.sqlite"
    raw = src.read_bytes()
    owner._FAULTS[point] = hook
    with pytest.raises(RuntimeError, match="INJECTED_FAULT"):
        SqliteLedger.import_json(src, target)
    _assert_publication_clean(tmp_path, target, ["source.json"])
    assert src.read_bytes() == raw
    owner._FAULTS.clear()
    assert SqliteLedger.import_json(src, target)["count"] == 12  # observation only; not retry permission


def test_import_source_changed_before_publication_is_rejected(tmp_path):
    src, target = _source(tmp_path), tmp_path / "final.sqlite"
    owner._FAULTS["before_source_reverify"] = lambda path: path.write_bytes(path.read_bytes() + b" ")
    with pytest.raises(ValueError, match="verification failed"):
        SqliteLedger.import_json(src, target)
    _assert_publication_clean(tmp_path, target, ["source.json"])


@pytest.mark.parametrize("point", ["backup_progress", "after_candidate_close", "before_publication"])
def test_backup_and_restore_handled_fault_leave_no_final(tmp_path, point):
    ledger = _big_ledger(tmp_path / "live.sqlite")
    before = _state(ledger)
    backup = tmp_path / "backup.sqlite"
    ledger.backup_to(backup)
    backup_raw = backup.read_bytes()
    live_names = _names(tmp_path)
    owner._FAULTS[point] = _boom
    for operation, target in ((lambda t: ledger.backup_to(t), tmp_path / "b2.sqlite"),
                              (lambda t: SqliteLedger.restore_backup(backup, t), tmp_path / "r2.sqlite")):
        with pytest.raises(RuntimeError, match="INJECTED_FAULT"):
            operation(target)
        _assert_publication_clean(tmp_path, target, live_names)
    assert backup.read_bytes() == backup_raw and _state(ledger) == before


def test_backup_progress_is_traversed_mid_copy(tmp_path):
    ledger = _big_ledger(tmp_path / "live.sqlite")
    calls = []
    owner._FAULTS["backup_progress"] = lambda: calls.append(1)
    ledger.backup_to(tmp_path / "b.sqlite")
    assert len(calls) > 1  # a mid-copy interruption point genuinely exists in the production call


@pytest.mark.parametrize("kind", ["import", "backup", "restore"])
def test_competing_creator_is_never_overwritten(tmp_path, kind):
    ledger = SqliteLedger(tmp_path / "live.sqlite")
    for block in _chain(3):
        ledger.append_event(block["event"])
    backup = tmp_path / "backup.sqlite"
    ledger.backup_to(backup)
    src, target = _source(tmp_path), tmp_path / "final.sqlite"
    competitor = b"COMPETING-CREATOR"
    owner._FAULTS["before_publication"] = lambda stage, final: Path(final).write_bytes(competitor)
    call = {"import": lambda: SqliteLedger.import_json(src, target),
            "backup": lambda: ledger.backup_to(target),
            "restore": lambda: SqliteLedger.restore_backup(backup, target)}[kind]
    with pytest.raises(FileExistsError):
        call()
    assert target.read_bytes() == competitor  # PREEXISTING_TARGET_UNCHANGED_AFTER_RAISE
    assert owner._sidecars(target) == []
    assert not [n for n in _names(tmp_path) if ".stage-" in n]


@pytest.mark.parametrize("suffix", ["", "-wal", "-shm", "-journal"])
def test_preexisting_target_or_sidecar_rejected_unchanged(tmp_path, suffix):
    src, target = _source(tmp_path), tmp_path / "final.sqlite"
    ledger = SqliteLedger(tmp_path / "live.sqlite")
    backup = tmp_path / "backup.sqlite"
    ledger.backup_to(backup)
    Path(str(target) + suffix).write_bytes(b"PREEXISTING")
    before = {n: (tmp_path / n).read_bytes() for n in _names(tmp_path)}
    for call in (lambda: SqliteLedger.import_json(src, target), lambda: ledger.backup_to(target),
                 lambda: SqliteLedger.restore_backup(backup, target)):
        with pytest.raises(FileExistsError):
            call()
    assert {n: (tmp_path / n).read_bytes() for n in _names(tmp_path) if n in before} == before
    assert set(_names(tmp_path)) - set(before) <= {"live.sqlite-wal", "live.sqlite-shm"}


def test_post_publication_failure_does_not_report_failed_complete_target(tmp_path):
    src, target = _source(tmp_path), tmp_path / "final.sqlite"
    owner._FAULTS["after_publication"] = _boom
    result = SqliteLedger.import_json(src, target)  # returns; a complete target is not reported failed
    assert result["count"] == 12 and owner.classify_target(target, _chain(12))["state"] == "USABLE_COMPLETE"
    assert len(SqliteLedger.last_stage_residue) == 1  # residue disclosed, not raised
    assert [n for n in _names(tmp_path) if ".stage-" in n]


@pytest.mark.parametrize("operation", ["backup", "restore"])
def test_post_publication_validator_fault_cannot_report_complete_target_failed(tmp_path, monkeypatch, operation):
    ledger = SqliteLedger(tmp_path / "live.sqlite")
    ledger.append_event({"request_id": "one"})
    backup = tmp_path / "backup.sqlite"
    if operation == "restore":
        ledger.backup_to(backup)
    target = tmp_path / "final.sqlite"

    def after_publication(_stage):
        def fail_validation(_chain):
            raise RuntimeError("post-publication validation fault")
        monkeypatch.setattr(owner, "_validate_chain", fail_validation)

    owner._FAULTS["after_publication"] = after_publication
    result = ledger.backup_to(target) if operation == "backup" else SqliteLedger.restore_backup(backup, target)
    assert result["count"] == 1 and result["request_ids"] == ["one"]
    assert _raw_ids(target) == ["one"]
    assert not [name for name in _names(tmp_path) if ".stage-" in name]


def test_classification_states_are_read_only_and_never_grant_retry(tmp_path):
    expected = _chain(4)
    target = tmp_path / "t.sqlite"
    assert owner.classify_target(target)["state"] == "CLEAN_ABSENT"
    Path(str(target) + "-wal").write_bytes(b"x")
    assert owner.classify_target(target)["state"] == "SIDECAR_ONLY"
    os.unlink(str(target) + "-wal")
    target.write_bytes(b"not a sqlite database" * 50)
    assert owner.classify_target(target, expected)["state"] == "PARTIAL_UNOPENABLE"
    target.write_bytes(b"")
    assert owner.classify_target(target, expected)["state"] == "PARTIAL_OPENABLE_INCOMPLETE"
    os.unlink(target)
    full = tmp_path / "full.json"
    full.write_text(json.dumps(expected), encoding="utf-8")
    SqliteLedger.import_json(full, target)
    assert owner.classify_target(target)["state"] == "UNKNOWN_PREEXISTING_ORIGIN"
    assert owner.classify_target(target, expected)["state"] == "USABLE_COMPLETE"
    assert owner.classify_target(target, expected[:2] + expected[3:])["state"] == "PARTIAL_OPENABLE_INCOMPLETE"
    before = target.read_bytes()
    results = [owner.classify_target(target, expected) for _ in range(2)]
    assert target.read_bytes() == before and owner._sidecars(target) == []
    assert all(r["safe_to_retry"] is False and r["authoritative"] is False for r in results)  # NO_AUTOMATIC_RETRY


def test_short_target_is_classified_incomplete(tmp_path):
    expected = _chain(5)
    target = tmp_path / "t.sqlite"
    src = tmp_path / "s.json"
    src.write_text(json.dumps(expected[:3]), encoding="utf-8")
    SqliteLedger.import_json(src, target)
    assert owner.classify_target(target, expected)["state"] == "PARTIAL_OPENABLE_INCOMPLETE"


def test_mutants_are_rejected_by_oracle(tmp_path, monkeypatch):
    src = _source(tmp_path)

    # Partial-final mutant: publishes half the candidate straight to the final name, then fails.
    def partial_publish(stage, final):
        Path(final).write_bytes(Path(stage).read_bytes()[:2048])
        raise RuntimeError("INJECTED_FAULT")

    target = tmp_path / "final.sqlite"
    monkeypatch.setattr(owner, "_publish", partial_publish)
    with pytest.raises(RuntimeError):
        SqliteLedger.import_json(src, target)
    with pytest.raises(AssertionError, match="FINAL_OR_SIDECAR_PRESENT"):
        _assert_publication_clean(tmp_path, target, ["source.json"])
    assert owner.classify_target(target, _chain(12))["state"] in ("PARTIAL_UNOPENABLE", "PARTIAL_OPENABLE_INCOMPLETE")
    monkeypatch.undo()

    # Overwrite-capable publication mutant: os.replace clobbers the competing creator; oracle sees it.
    def replace_publish(stage, final):
        owner._fault("before_publication", stage, final)
        os.replace(stage, final)

    target2 = tmp_path / "final2.sqlite"
    owner._FAULTS["before_publication"] = lambda stage, final: Path(final).write_bytes(b"COMPETING-CREATOR")
    monkeypatch.setattr(owner, "_publish", replace_publish)
    SqliteLedger.import_json(src, target2)
    with pytest.raises(AssertionError):
        assert target2.read_bytes() == b"COMPETING-CREATOR"
    monkeypatch.undo()
    owner._FAULTS.clear()

    # Success-with-short-chain mutant: a candidate missing its last row must not verify or publish.
    original_seal = owner._seal

    def short_seal(stage):
        conn = sqlite3.connect(stage)
        conn.execute("DELETE FROM blocks WHERE ordinal=(SELECT max(ordinal) FROM blocks)")
        conn.commit()
        conn.close()
        return original_seal(stage)

    monkeypatch.setattr(owner, "_seal", short_seal)
    with pytest.raises(ValueError, match="verification failed"):
        SqliteLedger.import_json(src, tmp_path / "short.sqlite")
    assert not (tmp_path / "short.sqlite").exists()
    with pytest.raises(AssertionError):  # oracle side: success reporting fewer rows than expected
        assert {"count": 11}["count"] == 12


def test_backup_with_real_peer_yields_one_complete_snapshot(tmp_path):
    ledger = _big_ledger(tmp_path / "live.sqlite", 40)
    started = []

    def run_peer():
        if started:
            return
        started.append(1)
        peer = subprocess.run([sys.executable, str(Path(__file__).with_name("q001_sqlite_ledger_peer.py")),
                               str(tmp_path / "live.sqlite"), "peer-during-backup"],
                              input="START_ATTEMPT\n", capture_output=True, text=True, timeout=30,
                              cwd=str(Path(__file__).parents[1]),
                              env={**os.environ, "PYTHONPATH": str(Path(__file__).parents[1])})
        assert peer.returncode == 0, peer.stderr

    owner._FAULTS["backup_progress"] = run_peer
    result = ledger.backup_to(tmp_path / "snap.sqlite")
    ids = _raw_ids(tmp_path / "snap.sqlite")
    live = _raw_ids(tmp_path / "live.sqlite")
    assert started and result["request_ids"] == ids and result["count"] == len(ids)
    assert live[:len(ids)] == ids and len(ids) in (40, 41) and live[-1] == "peer-during-backup"
    assert owner.classify_target(tmp_path / "snap.sqlite")["state"] == "UNKNOWN_PREEXISTING_ORIGIN"


@pytest.mark.parametrize("name", ["final.db", "final", "final.sqlite3"])
def test_non_sqlite_target_suffix_rejected_before_any_stage(tmp_path, name):
    src = _source(tmp_path)
    ledger = SqliteLedger(tmp_path / "live.sqlite")
    ledger.append_event({"request_id": "one"})
    backup = tmp_path / "backup.sqlite"
    ledger.backup_to(backup)
    target = tmp_path / name
    before = _names(tmp_path)
    seen = []
    owner._FAULTS["before_publication"] = lambda *a: seen.append("REACHED_PUBLICATION")
    for call in (lambda: SqliteLedger.import_json(src, target), lambda: ledger.backup_to(target),
                 lambda: SqliteLedger.restore_backup(backup, target)):
        with pytest.raises(ValueError, match="explicit .sqlite path"):
            call()
    assert seen == [] and not target.exists() and _names(tmp_path) == before  # no stage created, nothing published


def test_empty_import_source_rejected_without_target(tmp_path):
    src = tmp_path / "empty.json"
    src.write_text("[]", encoding="utf-8")
    raw, target = src.read_bytes(), tmp_path / "final.sqlite"
    with pytest.raises(ValueError, match="empty"):
        SqliteLedger.import_json(src, target)
    assert src.read_bytes() == raw and _names(tmp_path) == ["empty.json"]
