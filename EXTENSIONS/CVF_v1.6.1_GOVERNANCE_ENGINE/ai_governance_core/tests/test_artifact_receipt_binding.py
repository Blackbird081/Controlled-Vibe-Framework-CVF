"""Measured pinned SQLite ledger and the high-risk local transaction proof: real peer, rollback exactness, observed security invariance.

Read-only Windows security inspection only (PowerShell/.NET AccessControl). No ACL, owner or inheritance mutation is performed anywhere. The pure tuple adversaries show
that the comparison would detect a changed owner/protection/inheritance/ACE; they do not claim to restore a mutated OS ACL.
"""

import asyncio
import gc
import weakref
import hashlib
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
import types
import uuid
from pathlib import Path

import pytest

from api import artifact_receipt_contract as c
from ledger_layer import artifact_receipt_binding as binding
from ledger_layer.artifact_receipt_binding import BindingError, BoundSqliteLedger, open_bound_ledger
from tests import artifact_receipt_peer as peer

CORE = Path(__file__).resolve().parents[1]
PEER = Path(__file__).with_name("artifact_receipt_peer.py")
ROOTS = Path(__file__).resolve().parents[4] / ".cvf" / "runtime" / "ncr-r2-w05-bound-authority-repair-20261020" / "worker" / "py-roots"
CHILD_TMP = tempfile.mkdtemp(prefix="cvf-ncr-r2-w05-bound-py-")
ENV = {**os.environ, "PYTHONPATH": str(CORE), "TMP": CHILD_TMP, "TEMP": CHILD_TMP, "TMPDIR": CHILD_TMP}
META = {"operationKey": "a" * 64, "attemptId": "ncr-bound-attempt-0001", "envelopeSha256": "b" * 64, "ownerSha256": "c" * 64, "configDigest": "d" * 64,
        "storeBindingId": "e" * 64, "instanceId": "123e4567-e89b-42d3-a456-426614174000", "payloadSha256": "f" * 64}


def new_root(label):
    ROOTS.mkdir(parents=True, exist_ok=True)
    return Path(tempfile.mkdtemp(prefix=f"{label}-", dir=ROOTS)).resolve()


@pytest.fixture
def opened():
    ledgers = []

    def build(label, **kwargs):
        root = new_root(label)
        ledger = open_bound_ledger(root, **kwargs)
        ledgers.append(ledger)
        return root, ledger
    yield build
    for ledger in ledgers:
        ledger.close_binding()


def event_of(request_id, **extra):
    return dict({"request_id": request_id, "artifact_id": "synthetic"}, **extra)


def test_only_the_factory_constructs_and_the_measurement_is_recomputable(opened):
    root, ledger = opened("factory")
    for token in (None, object(), "token"):
        with pytest.raises(TypeError):
            BoundSqliteLedger(str(root / "other.sqlite"), _token=token)
    assert str(uuid.UUID(ledger.instance_id)) == ledger.instance_id and ledger.backend == "SQLITE" and len(ledger.store_binding_id) == 64
    real = os.path.realpath(ledger.ledger_path)
    info = os.stat(real)
    expected = hashlib.sha256(c.canonical_bytes(["cvf.boundReceiptStore.v1", ledger.instance_id, "SQLITE", real, str(info.st_dev), str(info.st_ino),
                                                 ledger._connection_nonce])).hexdigest()
    assert expected == ledger.store_binding_id == ledger.verify_binding()
    with pytest.raises(BindingError, match="BINDING_TARGET_EXISTS"):
        open_bound_ledger(root)
    again = open_bound_ledger(root, reopen=True)
    try:
        assert again.instance_id == ledger.instance_id and again.store_binding_id != ledger.store_binding_id
    finally:
        again.close_binding()


def test_the_factory_refuses_unowned_roots_and_names():
    tmp_path = new_root("names")
    file_path = tmp_path / "a-file"
    file_path.write_text("x")
    cases = {
        "relative": (lambda: open_bound_ledger("relative/root"), "BINDING_ROOT_NOT_OWNED"), "missing": (lambda: open_bound_ledger(tmp_path / "absent"), "BINDING_ROOT_NOT_OWNED"),
        "file": (lambda: open_bound_ledger(file_path), "BINDING_ROOT_NOT_OWNED"),
        "path in name": (lambda: open_bound_ledger(tmp_path, name="sub/x.sqlite"), "BINDING_NAME_INVALID"),
        "wrong suffix": (lambda: open_bound_ledger(tmp_path, name="x.db"), "BINDING_NAME_INVALID"),
        "reopen missing": (lambda: open_bound_ledger(tmp_path, name="absent.sqlite", reopen=True), "BINDING_TARGET_MISSING"),
    }
    for label, (run, code) in cases.items():
        with pytest.raises(BindingError) as info:
            run()
        assert info.value.code == code, label
    link = tmp_path / "link"
    try:
        os.symlink(tmp_path, link, target_is_directory=True)
    except (OSError, NotImplementedError):
        return  # symbolic links need a privilege this account does not hold; the reparse seam is exercised below
    with pytest.raises(BindingError):
        open_bound_ledger(link)


def test_preopen_namespace_and_sidecar_redirects_never_call_native_sqlite(monkeypatch):
    root = new_root("preopen")
    foreign = new_root("preopen-foreign")
    target = root / binding.LEDGER_FILE_NAME
    sidecar = Path(str(target) + "-wal")
    calls = []
    original = sqlite3.connect
    monkeypatch.setattr(binding.sqlite3, "connect", lambda *args, **kwargs: (calls.append(args), original(*args, **kwargs))[1])
    try:
        os.symlink(foreign / "foreign.sqlite", sidecar)
    except (OSError, NotImplementedError):
        sidecar.write_text("stand-in")
        real_reparse = binding._is_reparse
        monkeypatch.setattr(binding, "_is_reparse", lambda path: Path(path) == sidecar or real_reparse(path))
    with pytest.raises(BindingError, match="BINDING_TARGET_REDIRECTED"):
        open_bound_ledger(root)
    assert calls == []
    sidecar.unlink()
    monkeypatch.setattr(binding, "_is_reparse", real_reparse if "real_reparse" in locals() else binding._is_reparse)
    ancestor = root / "redirected"
    try:
        os.symlink(foreign, ancestor, target_is_directory=True)
    except (OSError, NotImplementedError):
        ancestor.mkdir()
        real_reparse = binding._is_reparse
        monkeypatch.setattr(binding, "_is_reparse", lambda path: Path(path) == ancestor or real_reparse(path))
    with pytest.raises(BindingError):
        open_bound_ledger(ancestor)
    assert calls == []


def test_one_physical_connection_serves_every_call_and_close_binding_releases_it(opened, monkeypatch):
    calls = []
    real_connect = sqlite3.connect
    monkeypatch.setattr(binding.sqlite3, "connect", lambda *a, **k: (calls.append(a), real_connect(*a, **k))[1])
    root, ledger = opened("pinned")
    context = peer.make_context(ledger)
    for attempt in ("pinned-attempt-01", "pinned-attempt-02"):
        asyncio.run(peer.drive(context, attempt))
    assert len(ledger.read_chain()) == 2 and ledger.appended == 2 and len(calls) == 1
    monkeypatch.undo()
    ledger.close_binding()
    ledger.close_binding()  # idempotent
    for call in (ledger.read_chain, ledger.verify_binding, lambda: ledger.lookup_request_id("pinned-attempt-01")):
        with pytest.raises(BindingError, match="BINDING_CLOSED"):
            call()
    probe = real_connect(ledger.ledger_path)
    try:
        assert probe.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()[0] == 0  # no lingering writer holds the database
        assert probe.execute("SELECT count(*) FROM blocks").fetchone()[0] == 2
    finally:
        probe.close()
    assert ledger._conn is None


def test_append_needs_an_active_context_and_stamps_exact_metadata(opened):
    _, ledger = opened("context")
    with pytest.raises(BindingError, match="BINDING_CONTEXT_REQUIRED"):
        ledger.append_event(event_of("context-req-01"))
    for bad in ({}, dict(META, extra=1), {k: v for k, v in META.items() if k != "payloadSha256"}, None):
        with pytest.raises(BindingError, match="BINDING_CONTEXT_INVALID"):
            ledger.bind_event_context(bad)
    with ledger.bind_event_context(META):
        with pytest.raises(BindingError, match="BINDING_CONTEXT_BUSY"):
            ledger.bind_event_context(META).__enter__()
        with pytest.raises(BindingError, match="BINDING_EVENT_INVALID"):
            ledger.append_event(event_of("context-req-02", bound_receipt={"spoof": True}))
        block = ledger.append_event(event_of("context-req-01"))
    assert block["event"]["bound_receipt"] == META and ledger.appended == 1
    assert ledger.committed_block("context-req-01", META) == block
    assert ledger.committed_block("context-req-01", dict(META, attemptId="other")) is None
    assert ledger.committed_block("never-recorded", META) is None
    with pytest.raises(BindingError, match="BINDING_CONTEXT_REQUIRED"):
        ledger.append_event(event_of("context-req-03"))
    assert [b["event"]["request_id"] for b in ledger.read_chain()] == ["context-req-01"]


def test_a_foreign_thread_or_process_cannot_use_the_binding(opened, monkeypatch):
    _, ledger = opened("owner")
    seen = []
    real_pid = os.getpid()

    def foreign():
        for call in (ledger.verify_binding, ledger.read_chain, ledger.close_binding):
            try:
                call()
            except BindingError as error:
                seen.append(error.code)
    worker = threading.Thread(target=foreign)
    worker.start()
    worker.join(timeout=30)
    assert not worker.is_alive() and seen == ["BINDING_OWNER_CHANGED"] * 3
    with monkeypatch.context() as scoped:
        scoped.setattr(binding.os, "getpid", lambda: real_pid + 1)
        with pytest.raises(BindingError, match="BINDING_OWNER_CHANGED"):
            ledger.verify_binding()
    assert ledger.verify_binding() == ledger.store_binding_id


def test_a_changed_path_object_or_reparse_state_is_detected_before_any_effect(opened, monkeypatch):
    root, ledger = opened("swap")
    original = ledger.ledger_path
    with pytest.raises(BindingError, match="BINDING_HANDLE_SEALED"):
        ledger.ledger_path = str(root / "another-database.sqlite")
    assert ledger.ledger_path == original and ledger.verify_binding() == ledger.store_binding_id
    assert not (root / "another-database.sqlite").exists()
    real_stat, real_realpath = os.stat, os.path.realpath
    with monkeypatch.context() as scoped:
        scoped.setattr(binding.os, "stat", lambda p, *a, **k: types.SimpleNamespace(st_dev=real_stat(p, *a, **k).st_dev, st_ino=real_stat(p, *a, **k).st_ino + 1))
        with pytest.raises(BindingError, match="BINDING_CHANGED"):
            ledger.verify_binding()
    with monkeypatch.context() as scoped:
        scoped.setattr(binding.os.path, "realpath", lambda p, *a, **k: str(root / "elsewhere.sqlite") if str(p).endswith(".sqlite") else real_realpath(p, *a, **k))
        with pytest.raises(BindingError, match="BINDING_PATH_REDIRECTED"):
            ledger.verify_binding()
    with monkeypatch.context() as scoped:
        scoped.setattr(binding, "_is_reparse", lambda _path: True)
        with pytest.raises(BindingError, match="BINDING_REPARSE"):
            ledger.verify_binding()
    assert ledger.read_chain() == [] and ledger.verify_binding() == ledger.store_binding_id  # the pinned connection never moved


# ---------------- real second process: deterministic barrier ----------------

def state_of(ledger):
    chain = ledger.read_chain()
    return (len(chain), chain[-1]["hash"] if chain else "GENESIS", [block["event"]["request_id"] for block in chain], chain)


def assert_order(events, release_start_ns, entered_ns):
    # The child's own occurrence time, not the parent's pipe-read order, decides whether entry preceded release.
    if entered_ns < release_start_ns:
        raise AssertionError("REJECT_ENTRY_BEFORE_PARENT_RELEASE")
    assert events.index("READY") < events.index("START_ATTEMPT") < events.index("ATTEMPTING")
    assert events.index("PARENT_RELEASE") < events.index("ENTERED") < events.index("COMPLETE")


def owned_peer_command(root, request_id, early=False):
    # The old peer assigns a public method. Instrument only the unexposed receiver
    # in this test child, at the same real BEGIN IMMEDIATE after_acquire seam.
    script = "from tests.test_artifact_receipt_binding import run_owned_peer; import sys; run_owned_peer(sys.argv[1],sys.argv[2],sys.argv[3]=='1')"
    return [sys.executable, "-c", script, str(root), request_id, "1" if early else "0"]


def run_owned_peer(root, request_id, early):
    if early:
        return peer.run_barrier(root, request_id, True)  # original early-entry mutant
    ledger = open_bound_ledger(Path(root), reopen=True)
    original = binding._ExecutionReceiver.append_event
    def announced(receiver, event, **kwargs):
        kwargs["after_acquire"] = lambda: peer.emit(f"ENTERED:{time.perf_counter_ns()}")
        return original(receiver, event, **kwargs)
    try:
        binding._ExecutionReceiver.append_event = announced
        context = peer.make_context(ledger)
        peer.emit("READY")
        if sys.stdin.readline().strip() != "START_ATTEMPT":
            raise RuntimeError("Expected START_ATTEMPT")
        peer.emit("ATTEMPTING")
        asyncio.run(peer.drive(context, request_id))
        peer.emit("COMPLETE")
    finally:
        binding._ExecutionReceiver.append_event = original
        ledger.close_binding()


def run_barrier(root, request_id, *, early_mutant=False):
    database = str(root / binding.LEDGER_FILE_NAME)
    parent = sqlite3.connect(database)
    parent.execute("BEGIN IMMEDIATE")
    events = []
    command = owned_peer_command(root, request_id, early_mutant)
    child = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1, cwd=str(CORE),
                             env={**ENV, "CVF_GOVERNANCE_LEDGER_PATH": str(root / "default-ledger.json")})
    try:
        assert child.stdout.readline().strip() == "READY"
        events.append("READY")
        child.stdin.write("START_ATTEMPT\n")
        child.stdin.flush()
        events.append("START_ATTEMPT")
        assert child.stdout.readline().strip() == "ATTEMPTING"
        events.append("ATTEMPTING")
        release_start_ns = time.perf_counter_ns()  # release is an explicit event, never inferred from a timeout or missing output
        parent.commit()
        events.append("PARENT_RELEASE")
        entered = child.stdout.readline().strip()
        assert entered.startswith("ENTERED:")
        entered_ns = int(entered.split(":", 1)[1])
        events.append("ENTERED")
        assert child.stdout.readline().strip() == "COMPLETE"
        events.append("COMPLETE")
        assert child.wait(timeout=60) == 0, child.stderr.read()
    finally:
        parent.rollback()
        parent.close()
        if child.poll() is None:
            child.kill()  # only this test's own child, only on a deadlock bound
            child.wait(timeout=30)
    return events, release_start_ns, entered_ns


def test_real_second_process_serializes_on_the_production_mutation_path(opened):
    root, ledger = opened("peer")
    before = state_of(ledger)
    assert_order(*run_barrier(root, "peer-attempt-01"))
    after = state_of(ledger)
    assert after[2] == ["peer-attempt-01"] and after[0] == before[0] + 1
    event = after[3][0]["event"]
    assert event["request_id"] == "peer-attempt-01" and event["cvf_risk_level"] == "R1"
    # The peer is a different process: it measured its own boot identity and its own opened connection.
    assert event["bound_receipt"]["instanceId"] != ledger.instance_id
    assert event["bound_receipt"]["storeBindingId"] != ledger.store_binding_id
    mutant_root, mutant_ledger = opened("peer-mutant")
    with pytest.raises(AssertionError, match="REJECT_ENTRY_BEFORE_PARENT_RELEASE"):
        assert_order(*run_barrier(mutant_root, "mutant-attempt-01", early_mutant=True))
    assert state_of(mutant_ledger)[2] == ["mutant-attempt-01"]


# ---------------- rollback exactness with observed security semantics ----------------

ACE_FIELDS = ("sid", "rights", "accessType", "isInherited", "inheritanceFlags", "propagationFlags")
POWERSHELL = ("$ErrorActionPreference='Stop'; $p='@@PATH@@'; "
              "$a=if([System.IO.Directory]::Exists($p)){[System.IO.Directory]::GetAccessControl($p)}else{[System.IO.File]::GetAccessControl($p)}; "
              "$rules=@($a.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]) | ForEach-Object { [ordered]@{sid=$_.IdentityReference.Value; "
              "rights=[string]$_.FileSystemRights; accessType=[string]$_.AccessControlType; isInherited=[bool]$_.IsInherited; "
              "inheritanceFlags=[string]$_.InheritanceFlags; propagationFlags=[string]$_.PropagationFlags} }); "
              "$o=[ordered]@{ownerSid=$a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value; protectionState=[bool]$a.AreAccessRulesProtected; "
              "inheritanceState=(-not [bool]$a.AreAccessRulesProtected); aces=$rules}; $o | ConvertTo-Json -Depth 4 -Compress")


def capture_security(path):
    """Read-only inspection of the actual owner, protection, inheritance and complete ACE tuples of a scratch path."""
    done = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", POWERSHELL.replace("@@PATH@@", str(path).replace("'", "''"))],
                          capture_output=True, text=True, timeout=120)
    assert done.returncode == 0, done.stderr
    raw = json.loads(done.stdout.strip().splitlines()[-1])
    aces = raw["aces"] if isinstance(raw["aces"], list) else [raw["aces"]]
    return {"ownerSid": raw["ownerSid"], "protectionState": raw["protectionState"], "inheritanceState": raw["inheritanceState"],
            "aces": tuple(sorted(tuple(ace[field] for field in ACE_FIELDS) for ace in aces))}  # complete tuples, multiplicity kept


def semantically_equal(a, b):
    return (a["ownerSid"], a["protectionState"], a["inheritanceState"], a["aces"]) == (b["ownerSid"], b["protectionState"], b["inheritanceState"], b["aces"])


def boom_after_acquire():
    raise RuntimeError("AFTER_ACQUIRE_BEFORE_MUTATION")


def boom_before_commit():
    raise RuntimeError("AFTER_INSERT_BEFORE_COMMIT")


def snapshot(root, ledger):
    sidecars = sorted((p.name, p.stat().st_size) for p in root.iterdir() if p.name.endswith(("-wal", "-shm", "-journal")))
    return {"chain": json.dumps(ledger.read_chain(), sort_keys=True), "ids": [b["event"]["request_id"] for b in ledger.read_chain()],
            "names": sorted(p.name for p in root.iterdir() if not p.name.endswith(("-wal", "-shm", "-journal"))), "sidecars": sidecars,
            "file": capture_security(root / binding.LEDGER_FILE_NAME), "root": capture_security(root)}


def test_failed_append_rolls_back_content_existence_and_observed_security_exactly(opened):
    root, ledger = opened("rollback")
    context = peer.make_context(ledger)
    asyncio.run(peer.drive(context, "rollback-attempt-01"))
    before = snapshot(root, ledger)
    assert before["ids"] == ["rollback-attempt-01"]
    with ledger.bind_event_context(META):
        with pytest.raises(RuntimeError, match="AFTER_ACQUIRE_BEFORE_MUTATION"):
            ledger.append_event(event_of("rollback-fail-0001"), after_acquire=boom_after_acquire)
        with pytest.raises(RuntimeError, match="AFTER_INSERT_BEFORE_COMMIT"):
            ledger.append_event(event_of("rollback-fail-0002"), before_commit=boom_before_commit)
    after = snapshot(root, ledger)
    assert after["chain"] == before["chain"] and after["ids"] == before["ids"] and after["names"] == before["names"]
    assert ledger.lookup_request_id("rollback-fail-0001") is None and ledger.lookup_request_id("rollback-fail-0002") is None
    assert semantically_equal(before["file"], after["file"]) and semantically_equal(before["root"], after["root"])
    assert before["file"]["ownerSid"] and before["file"]["aces"] and before["root"]["aces"]  # real, non-empty observations
    assert {name.rsplit("-", 1)[-1] for name, _ in after["sidecars"]} <= {"wal", "shm"}  # operational WAL state is recorded separately from the committed-chain oracle
    assert ledger.appended == 1
    # SUBSEQUENT_PEER_ACQUIRES: the pinned handle left no lock behind, so a real next process acquires and commits.
    done = subprocess.run(owned_peer_command(root, "rollback-peer-0001"), input="START_ATTEMPT\n", capture_output=True, text=True, timeout=120,
                          cwd=str(CORE), env={**ENV, "CVF_GOVERNANCE_LEDGER_PATH": str(root / "default-ledger.json")})
    assert done.returncode == 0, done.stderr
    lines = done.stdout.splitlines()
    assert lines[0:2] == ["READY", "ATTEMPTING"] and lines[2].startswith("ENTERED:") and lines[3] == "COMPLETE"
    assert state_of(ledger)[2] == ["rollback-attempt-01", "rollback-peer-0001"]


def test_a_post_acquire_failure_through_the_handler_leaves_state_unchanged_and_later_work_proceeds(opened, monkeypatch):
    root, ledger = opened("handler-failure")
    context = peer.make_context(ledger)
    before = state_of(ledger)
    original = binding._ExecutionReceiver.append_event
    acquired = []
    def fail_after_lock():
        acquired.append("AFTER_ACQUIRE_BEFORE_MUTATION")
        boom_after_acquire()
    def inject(receiver, event, **kwargs):
        kwargs["after_acquire"] = fail_after_lock
        return original(receiver, event, **kwargs)
    with monkeypatch.context() as scoped:
        scoped.setattr(binding._ExecutionReceiver, "append_event", inject)
        with pytest.raises(RuntimeError, match="evaluate refused: 500"):
            asyncio.run(peer.drive(context, "failure-attempt-01"))
    assert acquired == ["AFTER_ACQUIRE_BEFORE_MUTATION"]
    assert state_of(ledger) == before and ledger.appended == 0 and ledger.lookup_request_id("failure-attempt-01") is None
    asyncio.run(peer.drive(context, "failure-attempt-02"))
    assert state_of(ledger)[2] == ["failure-attempt-02"]


def test_pure_tuple_adversaries_are_never_semantically_equal_to_the_observation():
    base = {"ownerSid": "S-1-5-21-1", "protectionState": True, "inheritanceState": False,
            "aces": tuple(sorted([("S-1-5-21-1", "FullControl", "Allow", False, "None", "None"), ("S-1-5-18", "FullControl", "Allow", False, "None", "None"),
                                  ("S-1-5-18", "FullControl", "Allow", False, "None", "None")]))}
    first = base["aces"][0]
    adversaries = {
        "EXTRA_ALLOW": dict(base, aces=tuple(sorted(base["aces"] + (("S-1-1-0", "FullControl", "Allow", False, "None", "None"),)))),
        "DENY": dict(base, aces=tuple(sorted(base["aces"] + (("S-1-1-0", "FullControl", "Deny", False, "None", "None"),)))),
        "INHERITED": dict(base, aces=tuple(sorted((first[:3] + (True,) + first[4:],) + base["aces"][1:]))),
        "WRONG_OWNER": dict(base, ownerSid="S-1-5-32-544"), "PROTECTION": dict(base, protectionState=False), "INHERITANCE_STATE": dict(base, inheritanceState=True),
        "MISSING_ACE": dict(base, aces=base["aces"][1:]), "DUPLICATE_ACE": dict(base, aces=tuple(sorted(base["aces"] + (first,)))),
        "RIGHTS": dict(base, aces=tuple(sorted((first[:1] + ("ReadAndExecute",) + first[2:],) + base["aces"][1:]))),
    }
    assert semantically_equal(base, dict(base))  # positive control
    for name, mutant in adversaries.items():
        assert not semantically_equal(base, mutant), name


def test_native_facade_and_mutable_owner_aliases_cannot_commit_foreign_blocks(opened):
    _, ledger = opened("private-native")
    foreign_root, foreign = opened("private-native-foreign")
    native = ledger._conn
    intercepted, delegated = [], []
    class Facade:
        def execute(self, sql, *args):
            if sql == "PRAGMA database_list":
                intercepted.append(sql)
                return native.execute(sql, *args)
            delegated.append(sql)
            return foreign._conn.execute(sql, *args)
        def __getattr__(self, name):
            return getattr(foreign._conn, name)
    with pytest.raises(BindingError, match="BINDING_CONNECTION_SEALED"):
        ledger._conn = Facade()
    with pytest.raises(BindingError):
        ledger._pid = -1
    with pytest.raises(BindingError):
        ledger._thread = -1
    with pytest.raises(BindingError):
        ledger._baseline = {"path": str(foreign_root / binding.LEDGER_FILE_NAME)}
    with pytest.raises(BindingError):
        ledger._closed = False
    with pytest.raises(BindingError):
        ledger._store_binding_id = foreign.store_binding_id
    assert ledger.verify_binding() != foreign.store_binding_id
    with ledger.bind_event_context(META) as entered:
        with pytest.raises(BindingError):
            entered._metadata = dict(META, attemptId="foreign")
        with pytest.raises(BindingError):
            entered._ledger = foreign
        with pytest.raises(BindingError):
            ledger._context = dict(META, attemptId="foreign")
        ledger.append_event(event_of("private-native-attempt"))
    assert intercepted == [] and delegated == []
    assert len(ledger.read_chain()) == 1 and ledger.read_chain()[0]["event"]["bound_receipt"] == META
    physical = sqlite3.connect(str(foreign_root / binding.LEDGER_FILE_NAME))
    try:
        assert physical.execute("SELECT count(*) FROM blocks").fetchone()[0] == 0
    finally:
        physical.close()
    assert foreign.read_chain() == [] and foreign.appended == 0


def test_real_policy_callback_cannot_unseal_native_owner_or_event_metadata(opened):
    _, ledger = opened("callback-native")
    foreign_root, foreign = opened("callback-native-foreign")
    context = peer.make_context(ledger)
    core = context._orchestrator
    original = core.policy_engine.evaluate
    entered = []
    def hostile(payload):
        entered.append(1)
        core._ledger_sealed = False
        core._bound_ledger = foreign
        with pytest.raises(BindingError, match="CONTEXT_LEDGER_SEALED"):
            core.ledger = foreign
        with pytest.raises(BindingError, match="BINDING_CONNECTION_SEALED"):
            ledger._conn = foreign._conn
        with pytest.raises(BindingError):
            ledger._context = dict(META, storeBindingId=foreign.store_binding_id)
        return original(payload)
    core.policy_engine.evaluate = hostile
    asyncio.run(peer.drive(context, "callback-native-attempt"))
    assert entered == [1]
    assert len(ledger.read_chain()) == 1 and ledger.appended == 1
    physical = sqlite3.connect(str(foreign_root / binding.LEDGER_FILE_NAME))
    try:
        assert physical.execute("SELECT count(*) FROM blocks").fetchone()[0] == 0
    finally:
        physical.close()
    assert foreign.read_chain() == [] and foreign.appended == 0
    assert ledger.read_chain()[0]["event"]["bound_receipt"]["storeBindingId"] == ledger.store_binding_id


def test_actual_windows_owned_junction_refused_before_native_open(monkeypatch):
    if os.name != "nt":
        pytest.skip("Actual Windows directory-junction fixture requires Windows")
    root = new_root("actual-junction")
    target = root / "target"
    target.mkdir()
    junction = root / "junction"
    done = subprocess.run(["cmd", "/c", "mklink", "/J", str(junction), str(target)], capture_output=True, text=True, timeout=30)
    if done.returncode != 0:
        pytest.skip(f"Actual directory-junction creation unavailable: exit {done.returncode}")
    assert binding._is_reparse(junction)
    calls = []
    original = sqlite3.connect
    monkeypatch.setattr(binding.sqlite3, "connect", lambda *args, **kwargs: (calls.append(args), original(*args, **kwargs))[1])
    with pytest.raises(BindingError, match="BINDING_ROOT_NOT_OWNED"):
        open_bound_ledger(junction)
    assert calls == [] and list(target.iterdir()) == []
    destination = os.environ.get("CVF_NCR_CAPTURE_EVIDENCE_ROOT")
    if destination:
        Path(destination, "actual-junction.json").write_text(json.dumps({"created": True, "nativeOpenCalls": len(calls),
            "foreignFiles": len(list(target.iterdir())), "code": "BINDING_ROOT_NOT_OWNED", "fixtureRoot": str(root)}), encoding="utf-8")


def test_opaque_handle_has_no_native_builder_or_dictionary_capability_and_gc_closes(monkeypatch):
    root = new_root("weak-owner")
    closed = []
    class ObservedConnection(sqlite3.Connection):
        def close(self):
            closed.append(1)
            return super().close()
    real_connect = sqlite3.connect
    monkeypatch.setattr(binding.sqlite3, "connect", lambda *a, **kw: real_connect(*a, factory=ObservedConnection, **kw))
    before = len(binding._BINDINGS)
    ledger = open_bound_ledger(root)
    issued_state = binding._state(ledger)
    for name in ("builder", "__dict__", "_connect", "_pinned_connection", "_receiver"):
        with pytest.raises(AttributeError):
            getattr(ledger, name)
    assert ledger._conn is None and len(binding._BINDINGS) == before + 1
    ref = weakref.ref(ledger)
    del ledger
    gc.collect()
    assert ref() is None and len(binding._BINDINGS) <= before and closed == [1]
    assert issued_state["closed"] and issued_state["conn"] is None and issued_state["handles"] == []
    moved = root.with_name(root.name + "-released")
    root.rename(moved)  # actual namespace hold released, not just a closed flag
    with real_connect(str(moved / binding.LEDGER_FILE_NAME)) as reader:
        assert reader.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()[0] == 0
