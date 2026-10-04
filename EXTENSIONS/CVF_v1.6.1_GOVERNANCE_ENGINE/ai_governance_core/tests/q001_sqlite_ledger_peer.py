"""Real child process for the Q001 SQLite transaction barrier proof."""

import os
import sys
import time

from ledger_layer.sqlite_ledger import SqliteLedger


def _emit(value):
    print(value, flush=True)


def main():
    path, request_id = sys.argv[1:3]
    early_mutant = len(sys.argv) > 3 and sys.argv[3] == "--early-entered-mutant"
    ledger = SqliteLedger(path)
    _emit("READY")
    if sys.stdin.readline().strip() != "START_ATTEMPT":
        raise RuntimeError("Expected START_ATTEMPT")
    if early_mutant:
        # One pipe write makes the false entry occur before the parent can
        # observe ATTEMPTING and release its write transaction.
        os.write(sys.stdout.fileno(), f"ATTEMPTING\nENTERED:{time.perf_counter_ns()}\n".encode())
    else:
        _emit("ATTEMPTING")
    ledger.append_event({"request_id": request_id, "artifact_id": "synthetic-peer"},
                        after_acquire=None if early_mutant else lambda: _emit(f"ENTERED:{time.perf_counter_ns()}"))
    _emit("COMPLETE")


if __name__ == "__main__":
    main()
