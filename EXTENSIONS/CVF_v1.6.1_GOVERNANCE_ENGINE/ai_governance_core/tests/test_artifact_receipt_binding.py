"""Measured pinned SQLite ledger and the high-risk local transaction proof: real peer, rollback exactness, observed security invariance.

Read-only Windows security inspection only (Get-Acl). No ACL, owner or inheritance mutation is performed anywhere. The pure tuple adversaries show
that the comparison would detect a changed owner/protection/inheritance/ACE; they do not claim to restore a mutated OS ACL.
"""

import asyncio
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
ROOTS = Path(__file__).resolve().parents[4] / ".cvf" / "runtime" / "ncr-r2-w05-bound-source-20261019" / "worker" / "py-roots"
ENV = {**os.environ, "PYTHONPATH": str(CORE)}
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
        for call in (ledger.verify_binding, ledger.read_chain):
            try:
                call()
            except BindingError as error:
                seen.append(error.code)
    worker = threading.Thread(target=foreign)
    worker.start()
    worker.join(timeout=30)
    assert seen == ["BINDING_OWNER_CHANGED", "BINDING_OWNER_CHANGED"]
    with monkeypatch.context() as scoped:
        scoped.setattr(binding.os, "getpid", lambda: real_pid + 1)
        with pytest.raises(BindingError, match="BINDING_OWNER_CHANGED"):
            ledger.verify_binding()
    assert ledger.verify_binding() == ledger.store_binding_id


def test_a_changed_path_object_or_reparse_state_is_detected_before_any_effect(opened, monkeypatch):
    root, ledger = opened("swap")
    original = ledger.ledger_path
    ledger.ledger_path = str(root / "another-database.sqlite")
    with pytest.raises(BindingError, match="BINDING_PATH_CHANGED"):
        ledger.verify_binding()
    with ledger.bind_event_context(META), pytest.raises(BindingError, match="BINDING_PATH_CHANGED"):
        ledger.append_event(event_of("swap-req-0001"))
    ledger.ledger_path = original
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


def run_barrier(root, request_id, *, early_mutant=False):
    database = str(root / binding.LEDGER_FILE_NAME)
    parent = sqlite3.connect(database)
    parent.execute("BEGIN IMMEDIATE")
    events = []
    command = [sys.executable, str(PEER), "barrier", str(root), request_id] + (["--early-entered-mutant"] if early_mutant else [])
    child = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1, cwd=str(CORE), env=ENV)
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
POWERSHELL = ("$ErrorActionPreference='Stop'; $p='@@PATH@@'; $a=Get-Acl -LiteralPath $p; "
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
    done = subprocess.run([sys.executable, str(PEER), "barrier", str(root), "rollback-peer-0001"], input="START_ATTEMPT\n", capture_output=True, text=True, timeout=120,
                          cwd=str(CORE), env=ENV)
    assert done.returncode == 0, done.stderr
    lines = done.stdout.splitlines()
    assert lines[0:2] == ["READY", "ATTEMPTING"] and lines[2].startswith("ENTERED:") and lines[3] == "COMPLETE"
    assert state_of(ledger)[2] == ["rollback-attempt-01", "rollback-peer-0001"]


def test_a_post_acquire_failure_through_the_handler_leaves_state_unchanged_and_later_work_proceeds(opened):
    root, ledger = opened("handler-failure")
    context = peer.make_context(ledger)
    before = state_of(ledger)
    original = ledger.append_event
    ledger.append_event = lambda event, **kw: original(event, after_acquire=boom_after_acquire, **kw)
    with pytest.raises(RuntimeError, match="evaluate refused: 500"):
        asyncio.run(peer.drive(context, "failure-attempt-01"))
    del ledger.append_event
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
