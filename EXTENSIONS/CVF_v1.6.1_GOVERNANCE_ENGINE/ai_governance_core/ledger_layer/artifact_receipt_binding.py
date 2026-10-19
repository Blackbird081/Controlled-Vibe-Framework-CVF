"""Measured, pinned SQLite ledger for the offline bound receipt.

BoundSqliteLedger subclasses the existing SqliteLedger without changing its schema or append algorithm. It pins ONE native SQLite
connection that is owned by the creating process and thread, and hands the inherited read/append code a close-safe facade over it.
close_binding() is the only operation that closes the physical handle. The store identity is measured from the opened connection
(PRAGMA database_list realpath plus primary-file device/inode and a factory-generated nonce), never taken from a caller label.

Construction is only possible through open_bound_ledger() over an explicitly owned, fresh root directory. This module never touches the
generic server ledger or any active path.
"""

import hashlib
import json
import os
import sqlite3
import stat as stat_module
import threading
import uuid
from pathlib import Path

from .sqlite_ledger import SqliteLedger

LEDGER_FILE_NAME = "bound-receipt-ledger.sqlite"
STORE_TAG = "cvf.boundReceiptStore.v1"
EVENT_KEY = "bound_receipt"
_FACTORY_TOKEN = object()
_BOOT_UUID = str(uuid.uuid4())  # one instance boot identity per process
_REPARSE_FLAG = getattr(stat_module, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
_METADATA_KEYS = ("operationKey", "attemptId", "envelopeSha256", "ownerSha256", "configDigest", "storeBindingId", "instanceId", "payloadSha256")


class BindingError(RuntimeError):
    """The pinned connection no longer matches what was measured at open. The operation must not proceed."""

    def __init__(self, code):
        super().__init__(code)
        self.code = code


def _canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False)


class _PinnedConnection:
    """Facade handed to inherited SqliteLedger code. close() is a no-op so a per-call close cannot end the pinned handle."""

    def __init__(self, owner):
        self._owner = owner

    def close(self):
        return None

    def __getattr__(self, name):
        return getattr(self._owner._pinned_connection(), name)


def _is_reparse(path):
    info = os.lstat(path)
    return stat_module.S_ISLNK(info.st_mode) or bool(getattr(info, "st_file_attributes", 0) & _REPARSE_FLAG)


class BoundSqliteLedger(SqliteLedger):
    """Process/thread-owned ledger. Do not construct directly; use open_bound_ledger()."""

    def __init__(self, ledger_path, *, _token=None):
        if _token is not _FACTORY_TOKEN:
            raise TypeError("BoundSqliteLedger is only constructed by open_bound_ledger")
        self._conn = None
        self._closed = False
        self._pid = os.getpid()
        self._thread = threading.get_ident()
        self._context = None
        self.appended = 0
        try:
            # The inherited initializer calls _connect(); the first call opens and pins the one native connection.
            super().__init__(ledger_path)
            self._baseline = self._measure_now()
            self._connection_nonce = uuid.uuid4().hex
            self._store_binding_id = self._store_id(self._baseline)
        except BaseException:
            self.close_binding()
            raise

    # -- connection pinning -------------------------------------------------
    def _pinned_connection(self):
        if self._closed or self._conn is None:
            raise BindingError("BINDING_CLOSED")
        if os.getpid() != self._pid or threading.get_ident() != self._thread:
            raise BindingError("BINDING_OWNER_CHANGED")
        return self._conn

    def _connect(self):
        if self._conn is None and not self._closed:
            if os.getpid() != self._pid or threading.get_ident() != self._thread:
                raise BindingError("BINDING_OWNER_CHANGED")
            connection = sqlite3.connect(self.ledger_path, timeout=self.timeout)
            try:
                connection.execute("PRAGMA journal_mode=WAL")
                connection.execute("PRAGMA synchronous=FULL")
            except BaseException:
                connection.close()
                raise
            self._conn = connection
        self._pinned_connection()
        return _PinnedConnection(self)

    # -- measurement --------------------------------------------------------
    def _measure_now(self):
        conn = self._pinned_connection()
        rows = [row for row in conn.execute("PRAGMA database_list").fetchall() if row[1] == "main"]
        if len(rows) != 1 or not rows[0][2]:
            raise BindingError("BINDING_NO_MAIN_DATABASE")
        opened = rows[0][2]
        if _is_reparse(opened):
            raise BindingError("BINDING_REPARSE")
        real = os.path.realpath(opened)
        if os.path.normcase(real) != os.path.normcase(os.path.abspath(opened)):
            raise BindingError("BINDING_PATH_REDIRECTED")
        info = os.stat(real)
        return {"path": real, "dev": str(info.st_dev), "ino": str(info.st_ino)}

    def _store_id(self, measured):
        return hashlib.sha256(_canonical([STORE_TAG, _BOOT_UUID, "SQLITE", measured["path"], measured["dev"], measured["ino"],
                                          self._connection_nonce]).encode("ascii")).hexdigest()

    @property
    def instance_id(self):
        return _BOOT_UUID

    @property
    def store_binding_id(self):
        return self._store_binding_id

    @property
    def backend(self):
        return "SQLITE"

    def verify_binding(self):
        """Re-measure the opened connection. Any change of object, path, owner, thread or closed state raises BindingError."""
        measured = self._measure_now()
        if measured != self._baseline or self._store_id(measured) != self._store_binding_id:
            raise BindingError("BINDING_CHANGED")
        if os.path.normcase(os.path.realpath(self.ledger_path)) != os.path.normcase(self._baseline["path"]):
            raise BindingError("BINDING_PATH_CHANGED")
        return self._store_binding_id

    # -- context-bound append ----------------------------------------------
    def bind_event_context(self, metadata):
        """Context manager: the next append through this ledger must carry exactly this metadata. No context means no append."""
        return _EventContext(self, metadata)

    def append_event(self, event_payload, *, after_acquire=None, before_commit=None):
        context = self._context
        if context is None:
            raise BindingError("BINDING_CONTEXT_REQUIRED")
        self.verify_binding()
        if not isinstance(event_payload, dict) or EVENT_KEY in event_payload:
            raise BindingError("BINDING_EVENT_INVALID")
        event = dict(event_payload)
        event[EVENT_KEY] = dict(context)
        block = super().append_event(event, after_acquire=after_acquire, before_commit=before_commit)
        self.appended += 1
        return block

    def committed_block(self, request_id, metadata):
        """Exact lookup after commit. Returns the block only if it carries this same context; read-by-id is internal verification only."""
        self.verify_binding()
        block = self.lookup_request_id(request_id)
        if block is None or block["event"].get(EVENT_KEY) != dict(metadata) or block["event"]["request_id"] != request_id:
            return None
        return block

    # -- teardown -----------------------------------------------------------
    def close_binding(self):
        """Close the physical handle. Idempotent. The ledger is unusable afterwards; there is no reopen on the same object."""
        conn, self._conn, self._closed = self._conn, None, True
        if conn is not None:
            try:
                conn.close()
            except sqlite3.Error:
                pass


class _EventContext:
    def __init__(self, ledger, metadata):
        if not isinstance(metadata, dict) or set(metadata.keys()) != set(_METADATA_KEYS):
            raise BindingError("BINDING_CONTEXT_INVALID")
        self._ledger = ledger
        self._metadata = dict(metadata)

    def __enter__(self):
        if self._ledger._context is not None:
            raise BindingError("BINDING_CONTEXT_BUSY")
        self._ledger._context = self._metadata
        return self

    def __exit__(self, *_exc):
        self._ledger._context = None
        return False


def open_bound_ledger(owned_root, *, name=LEDGER_FILE_NAME, reopen=False):
    """Open a bound ledger over an explicitly owned disposable root. The database must be new unless reopen=True (a peer reopening the same fixture)."""
    root = Path(owned_root)
    if not root.is_absolute() or not root.is_dir() or _is_reparse(root) or os.path.normcase(os.path.realpath(root)) != os.path.normcase(os.path.abspath(root)):
        raise BindingError("BINDING_ROOT_NOT_OWNED")
    if name != os.path.basename(name) or not name.endswith(".sqlite"):
        raise BindingError("BINDING_NAME_INVALID")
    target = root / name
    if not reopen and (os.path.lexists(target) or any(os.path.lexists(str(target) + suffix) for suffix in ("-wal", "-shm", "-journal"))):
        raise BindingError("BINDING_TARGET_EXISTS")
    if reopen and not target.is_file():
        raise BindingError("BINDING_TARGET_MISSING")
    return BoundSqliteLedger(str(target), _token=_FACTORY_TOKEN)
