"""Measured, pinned SQLite ledger for the offline bound receipt.

BoundSqliteLedger is an opaque factory-issued handle. Only its private execution receiver subclasses SqliteLedger; the public handle
never becomes the inherited SQL receiver or exposes its builder/native connection. The existing schema and append algorithm are reused.
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
import weakref
from types import MappingProxyType
import ctypes
from pathlib import Path

from .sqlite_ledger import SqliteLedger

LEDGER_FILE_NAME = "bound-receipt-ledger.sqlite"
STORE_TAG = "cvf.boundReceiptStore.v1"
EVENT_KEY = "bound_receipt"
_FACTORY_TOKEN = object()
_BINDINGS = weakref.WeakKeyDictionary()
_EVENT_CONTEXTS = weakref.WeakKeyDictionary()
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


def _state(ledger):
    if type(ledger) is not BoundSqliteLedger or ledger not in _BINDINGS:
        raise BindingError("BINDING_UNISSUED")
    return _BINDINGS[ledger]


def _native(ledger):
    state = _state(ledger)
    if state["closed"] or state["conn"] is None:
        raise BindingError("BINDING_CLOSED")
    if os.getpid() != state["pid"] or threading.get_ident() != state["thread"]:
        raise BindingError("BINDING_OWNER_CHANGED")
    return state["conn"]


class _PinnedConnection:
    """Its delegated methods close over the captured native owner, never a writable alias."""

    __slots__ = ("__connection",)

    def __init__(self, connection):
        object.__setattr__(self, "_PinnedConnection__connection", connection)

    def __setattr__(self, _name, _value):
        raise BindingError("BINDING_CONNECTION_SEALED")

    def close(self):
        return None

    def __getattr__(self, name):
        return getattr(self.__connection, name)


def _is_reparse(path):
    info = os.lstat(path)
    return stat_module.S_ISLNK(info.st_mode) or bool(getattr(info, "st_file_attributes", 0) & _REPARSE_FLAG)


def _namespace_parts(root):
    parts = list(reversed((root, *root.parents)))
    if any(not part.is_dir() or _is_reparse(part) for part in parts):
        raise BindingError("BINDING_NAMESPACE_REDIRECTED")
    if any(os.path.normcase(os.path.realpath(part)) != os.path.normcase(os.path.abspath(part)) for part in parts):
        raise BindingError("BINDING_NAMESPACE_REDIRECTED")
    return parts


def _hold_namespace(parts):
    """On Windows hold directory handles without FILE_SHARE_DELETE during native open/use; no ACL or security mutation."""
    if os.name != "nt":
        return []
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.CreateFileW.argtypes = [ctypes.c_wchar_p, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p,
                                   ctypes.c_uint32, ctypes.c_uint32, ctypes.c_void_p]
    kernel.CreateFileW.restype = ctypes.c_void_p
    handles = []
    try:
        for part in parts:
            handle = kernel.CreateFileW(str(part), 0x80000000, 0x1 | 0x2, None, 3, 0x02000000, None)
            if handle == ctypes.c_void_p(-1).value:
                raise BindingError("BINDING_NAMESPACE_HOLD_FAILED")
            handles.append(handle)
        _namespace_parts(parts[-1])
        return handles
    except BaseException:
        for handle in reversed(handles):
            kernel.CloseHandle(ctypes.c_void_p(handle))
        raise


def _release_namespace(handles):
    if handles and os.name == "nt":
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        for handle in reversed(handles):
            kernel.CloseHandle(ctypes.c_void_p(handle))


def _close_state(state):
    conn, state["conn"], state["closed"] = state["conn"], None, True
    try:
        if conn is not None:
            conn.close()
    finally:
        handles, state["handles"] = state["handles"], []
        _release_namespace(handles)


class _ExecutionReceiver(SqliteLedger):
    """Never returned to callers. Base SQL dispatch and builder stay on this receiver."""

    def __init__(self, owner, ledger_path):
        self.__owner = weakref.ref(owner)
        super().__init__(ledger_path)

    def _connect(self):
        owner = self.__owner()
        state = _state(owner)
        if state["conn"] is None and not state["closed"]:
            if os.getpid() != state["pid"] or threading.get_ident() != state["thread"]:
                raise BindingError("BINDING_OWNER_CHANGED")
            root = Path(state["path"]).parent
            _namespace_parts(root)
            for candidate in (state["path"], *(state["path"] + suffix for suffix in ("-wal", "-shm", "-journal"))):
                if os.path.lexists(candidate) and _is_reparse(candidate):
                    raise BindingError("BINDING_TARGET_REDIRECTED")
            connection = sqlite3.connect(state["path"], timeout=self.timeout)
            try:
                connection.execute("PRAGMA journal_mode=WAL")
                connection.execute("PRAGMA synchronous=FULL")
            except BaseException:
                connection.close()
                raise
            state["conn"] = connection
        return _PinnedConnection(_native(owner))


class BoundSqliteLedger:
    """Opaque process/thread-owned handle; use open_bound_ledger()."""

    __slots__ = ("__weakref__",)

    def __setattr__(self, name, _value):
        raise BindingError("BINDING_CONNECTION_SEALED" if name == "_conn" else "BINDING_HANDLE_SEALED")

    def __delattr__(self, _name):
        raise BindingError("BINDING_HANDLE_SEALED")

    def __init__(self, ledger_path, *, _token=None, _namespace_handles=None):
        if _token is not _FACTORY_TOKEN:
            raise TypeError("BoundSqliteLedger is only constructed by open_bound_ledger")
        state = {"conn": None, "closed": False, "pid": os.getpid(), "thread": threading.get_ident(),
                 "context": None, "handles": _namespace_handles or [], "appended": 0, "path": str(ledger_path)}
        _BINDINGS[self] = state
        weakref.finalize(self, _close_state, state)
        try:
            state["receiver"] = _ExecutionReceiver(self, ledger_path)
            state["baseline"] = self._measure_now()
            state["nonce"] = uuid.uuid4().hex
            state["binding"] = self._store_id(state["baseline"])
        except BaseException:
            _close_state(state)
            raise

    @property
    def ledger_path(self):
        return _state(self)["path"]

    @property
    def appended(self):
        return _state(self)["appended"]

    @property
    def _conn(self):
        return None  # No native capability is exposed, including while open.

    @property
    def _connection_nonce(self):
        return _state(self)["nonce"]

    # -- measurement --------------------------------------------------------
    def _measure_now(self):
        conn = _native(self)
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
                                          _state(self)["nonce"]]).encode("ascii")).hexdigest()

    @property
    def instance_id(self):
        return _BOOT_UUID

    @property
    def store_binding_id(self):
        return _state(self)["binding"]

    @property
    def backend(self):
        return "SQLITE"

    def verify_binding(self):
        """Re-measure the opened connection. Any change of object, path, owner, thread or closed state raises BindingError."""
        measured = self._measure_now()
        state = _state(self)
        if measured != state["baseline"] or self._store_id(measured) != state["binding"]:
            raise BindingError("BINDING_CHANGED")
        if os.path.normcase(os.path.realpath(self.ledger_path)) != os.path.normcase(state["baseline"]["path"]):
            raise BindingError("BINDING_PATH_CHANGED")
        _namespace_parts(Path(self.ledger_path).parent)
        return _state(self)["binding"]

    def read_chain(self):
        self.verify_binding()
        return _state(self)["receiver"].read_chain()

    def lookup_request_id(self, request_id):
        self.verify_binding()
        return _state(self)["receiver"].lookup_request_id(request_id)

    # -- context-bound append ----------------------------------------------
    def bind_event_context(self, metadata):
        """Context manager: the next append through this ledger must carry exactly this metadata. No context means no append."""
        return _EventContext(self, metadata)

    def append_event(self, event_payload, *, after_acquire=None, before_commit=None):
        context = _state(self)["context"]
        if context is None:
            raise BindingError("BINDING_CONTEXT_REQUIRED")
        self.verify_binding()
        if not isinstance(event_payload, dict) or EVENT_KEY in event_payload:
            raise BindingError("BINDING_EVENT_INVALID")
        event = dict(event_payload)
        event[EVENT_KEY] = dict(context)
        block = _state(self)["receiver"].append_event(event, after_acquire=after_acquire, before_commit=before_commit)
        _state(self)["appended"] += 1
        return block

    def committed_block(self, request_id, metadata):
        """Exact lookup after commit. Returns the block only if it carries this same context; read-by-id is internal verification only."""
        self.verify_binding()
        block = _state(self)["receiver"].lookup_request_id(request_id)
        if block is None or block["event"].get(EVENT_KEY) != dict(metadata) or block["event"]["request_id"] != request_id:
            return None
        return block

    # -- teardown -----------------------------------------------------------
    def close_binding(self):
        """Close the physical handle. Idempotent. The ledger is unusable afterwards; there is no reopen on the same object."""
        state = _state(self)
        if not state["closed"]:
            _native(self)  # Refuse foreign-thread/process teardown without losing the owned connection.
        _close_state(state)


class _EventContext:
    __slots__ = ("__weakref__",)

    def __setattr__(self, _name, _value):
        raise BindingError("BINDING_CONTEXT_SEALED")

    def __delattr__(self, _name):
        raise BindingError("BINDING_CONTEXT_SEALED")

    def __init__(self, ledger, metadata):
        if not isinstance(metadata, dict) or set(metadata.keys()) != set(_METADATA_KEYS):
            raise BindingError("BINDING_CONTEXT_INVALID")
        _EVENT_CONTEXTS[self] = (ledger, MappingProxyType(dict(metadata)))

    def __enter__(self):
        ledger, metadata = _EVENT_CONTEXTS[self]
        _native(ledger)
        state = _state(ledger)
        if state["context"] is not None:
            raise BindingError("BINDING_CONTEXT_BUSY")
        state["context"] = metadata
        return self

    def __exit__(self, *_exc):
        ledger, _metadata = _EVENT_CONTEXTS[self]
        _state(ledger)["context"] = None
        return False


def open_bound_ledger(owned_root, *, name=LEDGER_FILE_NAME, reopen=False):
    """Open a bound ledger over an explicitly owned disposable root. The database must be new unless reopen=True (a peer reopening the same fixture)."""
    root = Path(owned_root)
    if not root.is_absolute() or not root.is_dir() or _is_reparse(root) or os.path.normcase(os.path.realpath(root)) != os.path.normcase(os.path.abspath(root)):
        raise BindingError("BINDING_ROOT_NOT_OWNED")
    if name != os.path.basename(name) or not name.endswith(".sqlite"):
        raise BindingError("BINDING_NAME_INVALID")
    target = root / name
    parts = _namespace_parts(root)
    for candidate in (target, *(Path(str(target) + suffix) for suffix in ("-wal", "-shm", "-journal"))):
        if os.path.lexists(candidate) and _is_reparse(candidate):
            raise BindingError("BINDING_TARGET_REDIRECTED")
    if not reopen and (os.path.lexists(target) or any(os.path.lexists(str(target) + suffix) for suffix in ("-wal", "-shm", "-journal"))):
        raise BindingError("BINDING_TARGET_EXISTS")
    if reopen and not target.is_file():
        raise BindingError("BINDING_TARGET_MISSING")
    handles = _hold_namespace(parts)
    # Ownership transfers to the constructor/finalizer; it releases on both failure and GC.
    return BoundSqliteLedger(str(target), _token=_FACTORY_TOKEN, _namespace_handles=handles)
