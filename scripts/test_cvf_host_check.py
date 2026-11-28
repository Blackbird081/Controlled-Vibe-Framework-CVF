#!/usr/bin/env python3
"""Tests for scripts/cvf_host_check.ps1 (advisory host-load check).

Run: python -m pytest scripts/test_cvf_host_check.py -q -p no:cacheprovider

Verdict logic is tested deterministically through -FromSampleJson (no sampling,
no load). Only the "live" group takes real samples (skipped off Windows).
"""
from __future__ import annotations

import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent / "cvf_host_check.ps1"
WINPS = shutil.which("powershell") if sys.platform == "win32" else None
PWSH = shutil.which("pwsh")
ON_WINDOWS = sys.platform == "win32"

needs_winps = pytest.mark.skipif(WINPS is None, reason="Windows PowerShell 5.1 not available")
needs_pwsh = pytest.mark.skipif(PWSH is None, reason="pwsh not available")
SHELLS = [pytest.param("winps", marks=needs_winps), pytest.param("pwsh", marks=needs_pwsh)]


def exe_for(name: str | None) -> str | None:
    return PWSH if name == "pwsh" else WINPS


KEY_METRICS = [
    "memoryCommitPercent", "availableMemoryMB", "cpuPercent",
    "systemDiskActivePercent", "systemDiskAvgSecPerRead", "systemDiskAvgSecPerWrite", "systemDiskQueueLength",
    "repoDiskActivePercent", "repoDiskAvgSecPerRead", "repoDiskAvgSecPerWrite", "repoDiskQueueLength",
    "freeSpaceGB",
]
REPO_DISK = [k for k in KEY_METRICS if k.startswith("repoDisk")]
CATEGORIES = {"sample file not found", "sample file is not valid JSON", "sampling failed", "unsupported platform"}

HEALTHY = {
    "memoryCommitPercent": 60.0, "availableMemoryMB": 8000.0, "cpuPercent": 20.0,
    "systemDiskActivePercent": 10.0, "systemDiskAvgSecPerRead": 0.001, "systemDiskAvgSecPerWrite": 0.001,
    "systemDiskQueueLength": 0.0,
    "repoDiskActivePercent": 10.0, "repoDiskAvgSecPerRead": 0.001, "repoDiskAvgSecPerWrite": 0.001,
    "repoDiskQueueLength": 0.0,
    "freeSpaceGB": 50.0,
}


def make_sample(cores: int = 8, **overrides) -> dict:
    metrics = dict(HEALTHY)
    metrics.update(overrides)
    return {"metrics": metrics, "context": {"logicalCores": cores}}


def run_ps(args: list[str], exe: str | None = None, timeout: int = 90):
    exe = exe or WINPS
    cmd = [exe, "-NoProfile", "-NonInteractive"]
    if exe == WINPS:
        cmd += ["-ExecutionPolicy", "Bypass"]
    cmd += ["-File", str(SCRIPT)] + args
    proc = subprocess.run(cmd, capture_output=True, timeout=timeout, stdin=subprocess.DEVNULL)
    return proc.returncode, proc.stdout.decode("utf-8", "replace"), proc.stderr.decode("utf-8", "replace")


def write_fixture(tmp_path: Path, payload, name: str = "s.json") -> Path:
    f = tmp_path / name
    f.write_text(json.dumps(payload), encoding="utf-8")
    return f


def check_fixture(tmp_path: Path, payload, extra: list[str] | None = None, exe: str | None = None, name: str = "s.json"):
    f = write_fixture(tmp_path, payload, name)
    code, out, err = run_ps(["-FromSampleJson", str(f), "-Json"] + (extra or []), exe=exe)
    return code, json.loads(out), out, err


def human(tmp_path: Path, payload, lang: str = "en", name: str = "h.json") -> str:
    f = write_fixture(tmp_path, payload, name)
    code, out, err = run_ps(["-FromSampleJson", str(f), "-Lang", lang])
    assert code == 0
    return out


# --- verdict table (also run under pwsh 7) ---------------------------------------------------------------------
VERDICT_TABLE = [
    ("healthy", {}, "OK", None),
    ("commit 89.9 is OK", {"memoryCommitPercent": 89.9}, "OK", None),
    ("commit 90 is BUSY", {"memoryCommitPercent": 90.0}, "BUSY", "memory commit"),
    ("commit 93 alone is only BUSY", {"memoryCommitPercent": 93.0}, "BUSY", "memory commit"),
    ("commit 96.9 alone is only BUSY", {"memoryCommitPercent": 96.9}, "BUSY", "memory commit"),
    ("commit 97 is PRESSURE", {"memoryCommitPercent": 97.0}, "PRESSURE", "memory commit"),
    ("commit 93 + avail 1499 is PRESSURE", {"memoryCommitPercent": 93.0, "availableMemoryMB": 1499.0}, "PRESSURE", "memory commit"),
    ("commit 92.9 + avail 1499 is BUSY", {"memoryCommitPercent": 92.9, "availableMemoryMB": 1499.0}, "BUSY", "available RAM"),
    ("commit 93 + avail 1500 is BUSY", {"memoryCommitPercent": 93.0, "availableMemoryMB": 1500.0}, "BUSY", "memory commit"),
    ("avail 1500 is OK (strictly below)", {"availableMemoryMB": 1500.0}, "OK", None),
    ("avail 1499 is BUSY", {"availableMemoryMB": 1499.0}, "BUSY", "available RAM"),
    ("avail 500 is BUSY", {"availableMemoryMB": 500.0}, "BUSY", "available RAM"),
    ("avail 499 is PRESSURE", {"availableMemoryMB": 499.0}, "PRESSURE", "available RAM"),
    ("cpu 84.9 is OK", {"cpuPercent": 84.9}, "OK", None),
    ("cpu 85 is BUSY", {"cpuPercent": 85.0}, "BUSY", "CPU"),
    ("cpu 100 is only BUSY", {"cpuPercent": 100.0}, "BUSY", "CPU"),
    ("disk 69.9 is OK", {"systemDiskActivePercent": 69.9}, "OK", None),
    ("disk 70 is BUSY", {"systemDiskActivePercent": 70.0}, "BUSY", "system disk active"),
    ("disk 100 but fast is only BUSY",
     {"systemDiskActivePercent": 100.0, "systemDiskAvgSecPerWrite": 0.019, "systemDiskQueueLength": 3.0},
     "BUSY", "system disk active"),
    ("disk 90 + write 0.020 is PRESSURE",
     {"systemDiskActivePercent": 90.0, "systemDiskAvgSecPerWrite": 0.020}, "PRESSURE", "system disk active"),
    ("disk 90 + queue 4 is PRESSURE",
     {"systemDiskActivePercent": 90.0, "systemDiskQueueLength": 4.0}, "PRESSURE", "system disk active"),
    ("disk 89.9 + slow is only BUSY",
     {"systemDiskActivePercent": 89.9, "systemDiskAvgSecPerWrite": 0.5}, "BUSY", "system disk active"),
    ("repo disk pressure",
     {"repoDiskActivePercent": 95.0, "repoDiskQueueLength": 6.0}, "PRESSURE", "repo disk active"),
    ("free 2.0 GB is OK", {"freeSpaceGB": 2.0}, "OK", None),
    ("free 1.99 GB is PRESSURE", {"freeSpaceGB": 1.99}, "PRESSURE", "free space"),
]


@pytest.mark.parametrize("shell", SHELLS)
@pytest.mark.parametrize("label,overrides,verdict,reason", VERDICT_TABLE, ids=[r[0] for r in VERDICT_TABLE])
def test_verdict_table(tmp_path, shell, label, overrides, verdict, reason):
    code, data, _, _ = check_fixture(tmp_path, make_sample(**overrides), exe=exe_for(shell))
    assert code == 0
    assert data["verdict"] == verdict
    assert data["unknownMetrics"] == []
    if reason:
        assert any(reason in r for r in data["reasons"]), data["reasons"]
        assert data["plainReasons"], "plain reasons are always given for BUSY/PRESSURE"
    else:
        assert data["reasons"] == ["no PRESSURE or BUSY rule fired"]


# --- OK requires the key metrics (H3) --------------------------------------------------------------------------
@needs_winps
@pytest.mark.parametrize("missing", ["memoryCommitPercent", "availableMemoryMB"])
def test_missing_memory_signal_is_unknown_never_ok(tmp_path, missing):
    code, data, _, _ = check_fixture(tmp_path, make_sample(**{missing: None}))
    assert code == 0
    assert data["verdict"] == "UNKNOWN"
    assert missing in data["unknownMetrics"]
    assert data["suggestedMaxWorkers"] is None
    assert any("memory signal" in r for r in data["reasons"])


@needs_winps
@pytest.mark.parametrize("missing", ["cpuPercent", "systemDiskActivePercent", "freeSpaceGB"])
def test_missing_other_required_metric_is_unknown(tmp_path, missing):
    code, data, _, _ = check_fixture(tmp_path, make_sample(**{missing: None}))
    assert code == 0 and data["verdict"] == "UNKNOWN"
    assert data["unknownMetrics"] == [missing]
    assert any("required metric" in r and missing in r for r in data["reasons"])


@needs_winps
def test_missing_repo_disk_can_be_ok_but_message_says_so(tmp_path):
    payload = make_sample(**{k: None for k in REPO_DISK})
    code, data, _, _ = check_fixture(tmp_path, payload)
    assert data["verdict"] == "OK"
    assert sorted(data["unknownMetrics"]) == sorted(REPO_DISK)
    assert "project's disk could not be measured" in data["message"]
    out = human(tmp_path, payload)
    assert "project's disk could not be measured" in out
    out_vi = human(tmp_path, payload, "vi", "hv.json")
    assert "\u1ed5 \u0111\u0129a ch\u1ee9a d\u1ef1 \u00e1n" in out_vi   # "o dia chua du an"
    # a fully measured sample must NOT carry that sentence
    code, data, _, _ = check_fixture(tmp_path, make_sample(), name="full.json")
    assert "could not be measured" not in data["message"]


@needs_winps
def test_missing_system_disk_latency_and_queue_do_not_block_ok(tmp_path):
    code, data, _, _ = check_fixture(tmp_path, make_sample(systemDiskAvgSecPerRead=None, systemDiskAvgSecPerWrite=None, systemDiskQueueLength=None))
    assert data["verdict"] == "OK"


@needs_winps
def test_pressure_finding_stands_even_when_memory_missing(tmp_path):
    code, data, _, _ = check_fixture(tmp_path, make_sample(memoryCommitPercent=None, availableMemoryMB=None, freeSpaceGB=1.0))
    assert data["verdict"] == "PRESSURE"
    assert data["suggestedMaxWorkers"] == 1
    assert "memoryCommitPercent" in data["unknownMetrics"]


@needs_winps
def test_all_unknown_when_nothing_given(tmp_path):
    code, data, _, _ = check_fixture(tmp_path, {"metrics": {}})
    assert code == 0 and data["verdict"] == "UNKNOWN"
    assert sorted(data["unknownMetrics"]) == sorted(KEY_METRICS)


@needs_winps
def test_unknown_human_output_is_plain_and_has_no_worker_line(tmp_path):
    payload = make_sample(cpuPercent=None, systemDiskActivePercent=None)
    for lang in ("en", "vi"):
        out = human(tmp_path, payload, lang, f"u_{lang}.json")
        assert "UNKNOWN" in out
        assert "Suggested parallel workers" not in out and "song song" not in out
        not_measured = [ln for ln in out.splitlines() if ln.startswith(("Not measured", "Ch\u01b0a \u0111o \u0111\u01b0\u1ee3c:"))]
        assert len(not_measured) == 1
        assert not re.search(r"[a-z][A-Z]", not_measured[0]), not_measured[0]       # no camelCase identifiers
        assert "Percent" not in not_measured[0]


# --- median of readings (M1) -------------------------------------------------------------------------------------
@needs_winps
def test_available_ram_uses_median_of_readings(tmp_path):
    spike = make_sample()
    spike["availableMemoryMBReadings"] = [300, 4000, 4200]       # one dip does not decide
    code, data, _, _ = check_fixture(tmp_path, spike)
    assert data["verdict"] == "OK"
    assert data["metrics"]["availableMemoryMB"]["value"] == 4000
    low = make_sample()
    low["availableMemoryMBReadings"] = [300, 400, 4200]
    code, data, _, _ = check_fixture(tmp_path, low, name="low.json")
    assert data["verdict"] == "PRESSURE" and data["metrics"]["availableMemoryMB"]["value"] == 400
    even = make_sample()
    even["availableMemoryMBReadings"] = [1000, 2000]
    code, data, _, _ = check_fixture(tmp_path, even, name="even.json")
    assert data["metrics"]["availableMemoryMB"]["value"] == 1500


# --- suggested workers --------------------------------------------------------------------------------------
WORKER_TABLE = [
    (8, 8000.0, 60.0, 5),     # floor(8000/1500)
    (8, 30000.0, 60.0, 8),    # clamped to logical cores
    (16, 4600.0, 60.0, 3),
    (16, 1400.0, 60.0, 1),    # floor = 0, clamped up to 1 (BUSY, not PRESSURE)
    (2, 8000.0, 60.0, 2),
    (8, 8000.0, 89.0, 5),     # below the commit cap
    (8, 8000.0, 90.0, 2),     # commit >= 90 caps at 2
    (8, 8000.0, 95.0, 2),
    (1, 8000.0, 95.0, 1),     # cores below the cap still win
    (8, 450.0, 60.0, 1),      # PRESSURE => 1
]


@needs_winps
@pytest.mark.parametrize("cores,avail,commit,expected", WORKER_TABLE)
def test_suggested_max_workers(tmp_path, cores, avail, commit, expected):
    code, data, _, _ = check_fixture(tmp_path, make_sample(cores=cores, availableMemoryMB=avail, memoryCommitPercent=commit))
    assert data["suggestedMaxWorkers"] == expected
    assert "heuristic" in data["suggestedMaxWorkersBasis"]


# --- exit codes and bad parameters (H1) -----------------------------------------------------------------------
@needs_winps
def test_exit_codes_with_fail_on_pressure(tmp_path):
    pressure = make_sample(availableMemoryMB=300.0)
    code, data, _, _ = check_fixture(tmp_path, pressure, ["-FailOnPressure"], name="p.json")
    assert code == 3 and data["verdict"] == "PRESSURE"
    code, data, _, _ = check_fixture(tmp_path, pressure, name="p2.json")
    assert code == 0 and data["verdict"] == "PRESSURE"
    code, data, _, _ = check_fixture(tmp_path, make_sample(availableMemoryMB=1400.0), ["-FailOnPressure"], name="b.json")
    assert code == 0 and data["verdict"] == "BUSY"
    code, data, _, _ = check_fixture(tmp_path, {"metrics": {}}, ["-FailOnPressure"], name="u.json")
    assert code == 0 and data["verdict"] == "UNKNOWN"
    code, data, _, _ = check_fixture(tmp_path, make_sample(), ["-FailOnPressure"], name="o.json")
    assert code == 0 and data["verdict"] == "OK"


BAD_PARAMS = [
    ["-SampleSeconds", "abc"],
    ["-SampleSeconds", "99999999999999999999"],
    ["-SampleSeconds", "-4"],
    ["-SampleSeconds", "NaN"],
    ["-WaitSeconds", "99999999999"],
    ["-WaitSeconds", "abc"],
    ["-WaitSeconds", "-5"],
    ["-IntervalSeconds", "zzz"],
    ["-IntervalSeconds", "-3"],
    ["-IntervalSeconds", "1e99"],
    ["-NoSuchParameter", "5"],
    ["-Lang", "klingon"],
]


@pytest.mark.parametrize("shell", SHELLS)
@pytest.mark.parametrize("bad", BAD_PARAMS, ids=[" ".join(b) for b in BAD_PARAMS])
def test_bad_parameters_never_fail_the_caller(tmp_path, shell, bad):
    # OK sample: even a huge -WaitSeconds must not wait (nothing to wait for).
    code, data, out, err = check_fixture(tmp_path, make_sample(), bad, exe=exe_for(shell))
    assert code == 0
    assert data["verdict"] == "OK"
    assert "internal" not in out.lower()


@needs_winps
def test_huge_wait_is_clamped_and_pressure_with_interval_larger_than_wait_does_not_loop(tmp_path):
    # PRESSURE sample; huge wait is clamped to 1800 but interval 1800 does not fit after the first reading's elapsed time
    code, data, _, err = check_fixture(tmp_path, make_sample(availableMemoryMB=300.0),
                                       ["-WaitSeconds", "99999999999", "-IntervalSeconds", "99999"])
    assert code == 0 and data["verdict"] == "PRESSURE"
    assert data["samplesTaken"] == 1 and err.strip() == ""
    assert data["waitTimedOut"] is False and data["waitedSeconds"] == 0
    assert "shorter than the interval" in data["waitNote"]


@needs_winps
def test_live_bad_parameters_exit_zero():
    code, out, err = run_ps(["-SampleSeconds", "abc", "-WaitSeconds", "abc", "-IntervalSeconds", "-1", "-Json"], timeout=120)
    data = json.loads(out)
    assert code == 0 and data["verdict"] in {"OK", "BUSY", "PRESSURE", "UNKNOWN"}
    assert data["sampleSeconds"] == 3   # the default


# --- fixed failure categories, no leaks (H2) -----------------------------------------------------------------------
@needs_winps
def test_failure_categories_are_fixed_and_leak_nothing(tmp_path):
    spaced = tmp_path / "dir with spaces"
    spaced.mkdir()
    # a valid file inside a path with spaces works and the path never shows up
    good = spaced / "good sample.json"
    good.write_text(json.dumps(make_sample()), encoding="utf-8")
    code, out, err = run_ps(["-FromSampleJson", str(good), "-Json"])
    assert code == 0 and json.loads(out)["verdict"] == "OK"
    assert "spaces" not in (out + err)

    bad = spaced / "bad sample.json"
    bad.write_text("{not json, secret-marker-123", encoding="utf-8")
    cases = [
        (str(spaced / "missing file.json"), "sample file not found"),
        (str(bad), "sample file is not valid JSON"),
        ("\\\\no-such-server-xyz\\share\\x.json", "sample file not found"),
        ("//no-such-server-xyz/share/x.json", "sample file not found"),
        ("\\\\?\\C:\\nope\\x.json", "sample file not found"),
    ]
    for path, category in cases:
        started = time.time()
        code, out, err = run_ps(["-FromSampleJson", path, "-Json", "-FailOnPressure"])
        assert time.time() - started < 15, path           # a UNC lookup must not cost seconds
        assert code == 0, path
        data = json.loads(out)
        assert data["verdict"] == "UNKNOWN"
        assert data["reasons"][0] == "UNKNOWN: " + category
        assert data["plainReasons"] and "\\" not in data["plainReasons"][0]
        text = out + err
        for leak in ("spaces", "no-such-server", "secret-marker", "nope", "Cannot", "Exception", "At line", str(tmp_path), tmp_path.name):
            assert leak not in text, (leak, path)
        assert err.strip() == ""
    code, out, err = run_ps(["-FromSampleJson", str(spaced / "missing file.json")])
    assert code == 0 and "spaces" not in (out + err) and "sample file was not found" in out   # human output, plain words


@needs_winps
def test_reasons_use_only_known_categories_for_unknown_failures(tmp_path):
    empty = tmp_path / "empty.json"
    empty.write_text("[]", encoding="utf-8")
    code, out, err = run_ps(["-FromSampleJson", str(empty), "-Json"])
    data = json.loads(out)
    assert code == 0 and data["verdict"] == "UNKNOWN"
    assert data["reasons"][0].removeprefix("UNKNOWN: ") in CATEGORIES


# --- out-of-range fixture values (M3) ------------------------------------------------------------------------------
@needs_winps
@pytest.mark.parametrize("key,value", [
    ("memoryCommitPercent", 101), ("memoryCommitPercent", -1), ("cpuPercent", 150), ("cpuPercent", -0.5),
    ("systemDiskActivePercent", 1000), ("availableMemoryMB", -5), ("availableMemoryMB", 1e30),
    ("freeSpaceGB", -1), ("freeSpaceGB", 1e30), ("systemDiskQueueLength", -3), ("systemDiskAvgSecPerWrite", -1),
    ("cpuPercent", "NaN"), ("cpuPercent", "abc"), ("cpuPercent", True), ("cpuPercent", [1, 2]),
])
def test_out_of_range_values_become_unknown_without_error_text(tmp_path, key, value):
    code, data, out, err = check_fixture(tmp_path, make_sample(**{key: value}))
    assert code == 0
    assert key in data["unknownMetrics"], (key, value, data["unknownMetrics"])
    assert data["metrics"][key]["value"] is None
    assert "internal" not in out.lower() and "sampling failed" not in out
    assert data["verdict"] in {"OK", "UNKNOWN", "PRESSURE", "BUSY"}


@needs_winps
def test_context_is_coerced(tmp_path):
    for same, expected in ((True, True), (False, False), ("yes", None), (1, None), (None, None)):
        payload = make_sample()
        payload["context"]["systemAndRepoOnSameDisk"] = same
        code, data, _, _ = check_fixture(tmp_path, payload, name=f"c_{same}.json")
        assert data["context"]["systemAndRepoOnSameDisk"] is expected, same
    for cores, expected in ((0, 1), (-4, 1), (2.7, 2), (1, 1), (100000, 4096)):
        code, data, _, _ = check_fixture(tmp_path, make_sample(cores=cores, availableMemoryMB=30000.0), name=f"k_{cores}.json")
        assert data["context"]["logicalCores"] == expected, cores
        assert data["suggestedMaxWorkers"] == min(20, expected)   # 30000/1500 = 20, then cores cap
    code, data, _, _ = check_fixture(tmp_path, {"metrics": HEALTHY, "context": {"logicalCores": "many"}}, name="k_str.json")
    assert isinstance(data["context"]["logicalCores"], int) and data["context"]["logicalCores"] >= 1


# --- wait loop ----------------------------------------------------------------------------------------------
@needs_winps
def test_wait_loop_ends_when_pressure_clears(tmp_path):
    seq = [make_sample(availableMemoryMB=300.0), make_sample(availableMemoryMB=400.0), make_sample()]
    code, data, _, err = check_fixture(tmp_path, seq, ["-WaitSeconds", "60", "-IntervalSeconds", "0"])
    assert code == 0
    assert data["verdict"] == "OK"
    assert data["samplesTaken"] == 3
    assert data["waitTimedOut"] is False
    assert data["waitedSeconds"] < 10
    assert data["waitNote"] is None
    assert err.count("cvf_host_check: PRESSURE") == 2   # progress goes to stderr only
    assert " in 0 s" not in err


@needs_winps
def test_wait_loop_times_out_and_fail_on_pressure_applies(tmp_path):
    seq = [make_sample(availableMemoryMB=300.0)]
    code, data, out, err = check_fixture(tmp_path, seq, ["-WaitSeconds", "1", "-IntervalSeconds", "0"])
    assert code == 0
    assert data["verdict"] == "PRESSURE"
    assert data["waitTimedOut"] is True
    assert data["waitedSeconds"] >= 1
    assert data["samplesTaken"] >= 2
    assert "cvf_host_check" not in out   # stdout is exactly one JSON object
    assert " in 0 s" not in err
    code, data, _, _ = check_fixture(tmp_path, seq, ["-WaitSeconds", "1", "-IntervalSeconds", "0", "-FailOnPressure"], name="s2.json")
    assert code == 3


@needs_winps
def test_wait_stops_when_remaining_time_is_below_the_interval(tmp_path):
    seq = [make_sample(availableMemoryMB=300.0), make_sample()]
    code, data, _, err = check_fixture(tmp_path, seq, ["-WaitSeconds", "5", "-IntervalSeconds", "10"])
    assert data["samplesTaken"] == 1 and data["verdict"] == "PRESSURE"
    assert data["waitedSeconds"] == 0 and err.strip() == ""
    assert data["waitTimedOut"] is False
    assert "shorter than the interval" in data["waitNote"]


@needs_winps
def test_no_wait_means_one_reading(tmp_path):
    seq = [make_sample(availableMemoryMB=300.0), make_sample()]
    code, data, _, err = check_fixture(tmp_path, seq)
    assert data["verdict"] == "PRESSURE"
    assert data["samplesTaken"] == 1 and data["waitedSeconds"] == 0 and data["waitTimedOut"] is False
    assert err.strip() == ""


@needs_winps
def test_low_free_space_pressure_is_never_waited_on(tmp_path):
    seq = [make_sample(freeSpaceGB=1.0), make_sample()]
    code, data, _, err = check_fixture(tmp_path, seq, ["-WaitSeconds", "60", "-IntervalSeconds", "0"])
    assert data["verdict"] == "PRESSURE"
    assert data["samplesTaken"] == 1 and data["waitedSeconds"] == 0
    assert data["waitTimedOut"] is False and err.strip() == ""
    assert "not waited" in data["waitNote"]
    # but free space PLUS a time-fixable pressure still waits
    seq2 = [make_sample(freeSpaceGB=1.0, availableMemoryMB=300.0), make_sample(freeSpaceGB=1.0)]
    code, data, _, err = check_fixture(tmp_path, seq2, ["-WaitSeconds", "60", "-IntervalSeconds", "0"], name="s2.json")
    # one interval elapsed and the last reading is still PRESSURE (free space) => waitTimedOut per the R4 rule
    assert data["samplesTaken"] == 2 and data["verdict"] == "PRESSURE" and data["waitTimedOut"] is True


# --- messages by reason class (H4) and plain reasons (M4) -------------------------------------------------------------
@needs_winps
def test_message_follows_the_reason_class(tmp_path):
    cases = [
        (make_sample(availableMemoryMB=450.0), "short of memory", "memory"),
        (make_sample(availableMemoryMB=1400.0), "using a lot of memory", "memory"),
        (make_sample(cpuPercent=95.0), "processor is very busy", "processor"),
        (make_sample(systemDiskActivePercent=75.0), "disk is fairly busy", "disk"),
        (make_sample(systemDiskActivePercent=99.0, systemDiskQueueLength=8.0), "full capacity", "disk"),
        (make_sample(freeSpaceGB=1.0), "nearly full", "disk space"),
    ]
    for payload, phrase, _ in cases:
        out = human(tmp_path, payload)
        assert phrase in out, (phrase, out)
    cpu_only = human(tmp_path, make_sample(cpuPercent=95.0), name="cpu.json")
    assert "memory" not in cpu_only.split("\n")[0].lower().replace("cvf host check", "")
    disk_only = human(tmp_path, make_sample(systemDiskActivePercent=75.0), name="disk.json")
    assert "memory" not in disk_only.split("\n")[0].lower()
    full = human(tmp_path, make_sample(freeSpaceGB=1.0), name="full.json")
    assert "Free up disk space" in full and "waiting will not help" in full
    assert "wait" not in full.split("\n")[0].replace("waiting will not help", "")
    # memory pressure + nearly full disk: memory advice first, disk-full advice appended
    both = human(tmp_path, make_sample(availableMemoryMB=450.0, freeSpaceGB=1.0), name="both.json")
    assert "short of memory" in both and "disk is nearly full" in both


@needs_winps
def test_vi_messages_and_plain_reasons(tmp_path):
    out = human(tmp_path, make_sample(availableMemoryMB=456.0, **{k: None for k in REPO_DISK}), "vi", "v.json")
    why = [ln for ln in out.splitlines() if ln.startswith("L\u00fd do")]
    assert len(why) == 1
    assert "456" in why[0] and "b\u1ed9 nh\u1edb tr\u1ed1ng c\u00f2n 456 MB" in why[0]
    assert "PRESSURE" not in why[0] and "BUSY" not in why[0] and "RAM" not in why[0]
    assert not re.search(r"[a-z][A-Z]", why[0]), why[0]
    assert "Suggested" not in out and "Why" not in out
    assert "Ch\u01b0a \u0111o" in out                         # project's disk not measured
    assert "\u0110\u00e2y ch\u1ec9 l\u00e0 t\u00ecnh tr\u1ea1ng t\u1ea1i m\u1ed9t th\u1eddi \u0111i\u1ec3m" in out   # "single moment"
    disk = human(tmp_path, make_sample(systemDiskActivePercent=99.0, systemDiskQueueLength=8.0), "vi", "vd.json")
    assert "ho\u1ea1t \u0111\u1ed9ng h\u1ebft c\u00f4ng su\u1ea5t" in disk      # "hoat dong het cong suat"
    assert "k\u00edn" not in disk
    free = human(tmp_path, make_sample(freeSpaceGB=1.0), "vi", "vf.json")
    assert "gi\u1ea3i ph\u00f3ng dung l\u01b0\u1ee3ng" in free


@needs_winps
def test_english_plain_reasons_have_numbers_and_no_rule_names(tmp_path):
    out = human(tmp_path, make_sample(availableMemoryMB=456.0, cpuPercent=90.0))
    why = [ln for ln in out.splitlines() if ln.startswith("Why")][0]
    assert "456 MB" in why and "90%" in why
    assert "PRESSURE:" not in why and "BUSY:" not in why and "availableMemoryMB" not in why
    assert out.rstrip().endswith("This is a single moment and can change within a minute.")


@needs_winps
def test_json_keeps_technical_reasons_and_adds_plain_ones(tmp_path):
    code, data, _, _ = check_fixture(tmp_path, make_sample(availableMemoryMB=456.0))
    assert data["reasons"] == ["PRESSURE: available RAM 456 MB < 500 MB"]
    assert data["plainReasons"] == ["only 456 MB of memory is free"]
    code, data, _, _ = check_fixture(tmp_path, make_sample(cpuPercent=None, systemDiskActivePercent=None), name="u.json")
    assert data["plainUnknown"] == ["processor", "system disk"]
    code, data, _, _ = check_fixture(tmp_path, make_sample(cpuPercent=None), ["-Lang", "vi"], name="uv.json")
    assert data["plainUnknown"] == ["b\u1ed9 x\u1eed l\u00fd"]


@needs_winps
def test_human_message_en_and_vi_basics(tmp_path):
    out = human(tmp_path, make_sample(availableMemoryMB=300.0))
    assert out.startswith("CVF host check: PRESSURE")
    assert "CVF does not stop anything" in out
    assert "Suggested parallel workers" in out
    out_vi = human(tmp_path, make_sample(availableMemoryMB=300.0), "vi", "hv.json")
    assert "thi\u1ebfu b\u1ed9 nh\u1edb" in out_vi
    assert "CVF kh\u00f4ng t\u1ef1 \u0111\u1ed9ng" in out_vi
    f = write_fixture(tmp_path, make_sample(availableMemoryMB=300.0), "j.json")
    code, out_json, _ = run_ps(["-FromSampleJson", str(f), "-Lang", "vi", "-Json"])
    assert out_json.isascii()                   # JSON stays ASCII (unicode escapes)
    assert "thi\u1ebfu b\u1ed9 nh\u1edb" in json.loads(out_json)["message"]


# --- output shape, privacy ---------------------------------------------------------------------------------------
@needs_winps
def test_json_shape_units_and_no_identity(tmp_path):
    code, data, out, err = check_fixture(tmp_path, make_sample(availableMemoryMB=1400.0))
    assert data["schema"] == "cvf.hostCheck@1"
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", data["timestampUtc"])
    for key in ("sampleSeconds", "metrics", "context", "verdict", "reasons", "plainReasons", "unknownMetrics",
                "plainUnknown", "suggestedMaxWorkers", "message", "waitedSeconds", "waitTimedOut"):
        assert key in data
    assert list(data["metrics"].keys()) == KEY_METRICS
    for name, metric in data["metrics"].items():
        assert set(metric) == {"value", "unit"}, name
        assert metric["unit"]
    assert data["metrics"]["availableMemoryMB"]["unit"] == "MB"
    assert data["verdict"] in {"OK", "BUSY", "PRESSURE", "UNKNOWN"}
    assert out.strip().startswith("{") and out.strip().endswith("}") and len(out.strip().splitlines()) == 1

    haystack = (out + err).lower()
    secrets = [socket.gethostname(), os.environ.get("COMPUTERNAME", ""), os.environ.get("USERNAME", ""),
               os.environ.get("USER", ""), str(tmp_path), tmp_path.name, str(Path.home())]
    for secret in secrets:
        if len(secret) >= 3:
            assert secret.lower() not in haystack, secret


@needs_winps
def test_own_json_output_can_be_fed_back(tmp_path):
    code, data, out, _ = check_fixture(tmp_path, make_sample(availableMemoryMB=1400.0, cores=4))
    again = tmp_path / "again.json"
    again.write_text(out, encoding="utf-8")
    code, out2, _ = run_ps(["-FromSampleJson", str(again), "-Json"])
    data2 = json.loads(out2)
    assert data2["verdict"] == data["verdict"] == "BUSY"
    assert data2["suggestedMaxWorkers"] == data["suggestedMaxWorkers"] == 1
    assert data2["metrics"] == data["metrics"]


# --- static properties of the script ------------------------------------------------------------------------
def test_script_is_ascii_lf_and_thresholds_are_at_the_top():
    raw = SCRIPT.read_bytes()
    assert b"\r" not in raw
    assert raw.isascii()
    text = raw.decode("ascii")
    assert text.index("$Thresholds = [ordered]@{") < text.index("function ")
    assert "tunable PROPOSALS" in text
    # numeric parameters are strings so a bad value can never fail parameter binding
    for name in ("SampleSeconds", "WaitSeconds", "IntervalSeconds"):
        assert f"[string]${name}" in text and f"[int]${name}" not in text
    # advisory-only: no process control, deletion, writing, shutdown or network cmdlets
    forbidden = (
        "Stop-Process", "Remove-Item", "Invoke-WebRequest", "Invoke-RestMethod", "Start-Job", "Register-ScheduledTask",
        "Start-Process", "Set-Content", "Out-File", "Add-Content", ".Kill(", "taskkill", "Stop-Computer",
        "Restart-Computer", "Clear-Content", "Set-ItemProperty", "New-Item",
    )
    # CIM timeouts are capped by the remaining budget, never a fixed 5; Exit() is guarded by the child-process check
    assert "-OperationTimeoutSec 5" not in text and "[math]::Min(5" in text
    assert text.count("[Environment]::Exit(") == 1 and "Test-StartedAsChildScript" in text
    lowered = text.lower()
    for token in forbidden:
        assert token.lower() not in lowered, token


# --- real samples (live) ---------------------------------------------------------------------------------------
@needs_winps
@pytest.mark.parametrize("hook", ["", "perflib", "cim"])
def test_live_sample_returns_valid_verdict(hook):
    args = ["-SampleSeconds", "1", "-Json"]
    if hook:
        args += ["-ForceCounterPath", hook]
    code, out, err = run_ps(args, timeout=120)
    assert code == 0
    data = json.loads(out)
    assert data["schema"] == "cvf.hostCheck@1"
    assert data["verdict"] in {"OK", "BUSY", "PRESSURE", "UNKNOWN"}
    assert data["sampleSeconds"] == 3                 # a SampleSeconds below 3 is raised to 3 readings
    assert list(data["metrics"].keys()) == KEY_METRICS
    if hook == "cim":
        # counters skipped: disk metrics must be UNKNOWN, never invented
        assert "systemDiskActivePercent" in data["unknownMetrics"]
        assert data["verdict"] in {"UNKNOWN", "PRESSURE", "BUSY"}
    if data["verdict"] == "OK":
        for key in ("memoryCommitPercent", "availableMemoryMB", "cpuPercent", "systemDiskActivePercent", "freeSpaceGB"):
            assert data["metrics"][key]["value"] is not None


@needs_winps
def test_default_live_run_finishes_within_the_runtime_bound():
    started = time.time()
    code, out, err = run_ps(["-Json"], timeout=120)
    elapsed = time.time() - started
    assert code == 0
    assert json.loads(out)["verdict"] in {"OK", "BUSY", "PRESSURE", "UNKNOWN"}
    assert elapsed < 15, f"default live run took {elapsed:.1f} s"


# --- abandoned read, process safety, contract, network location (R1-R5) -----------------------------------------------
@needs_winps
def test_abandoned_counter_read_under_file_exits_zero_with_one_json_object():
    started = time.time()
    code, out, err = run_ps(["-ForceBudgetMs", "400", "-Json"], timeout=60)
    assert code == 0
    assert time.time() - started < 20
    assert len(out.strip().splitlines()) == 1
    data = json.loads(out)
    assert data["verdict"] == "UNKNOWN"
    for key in ("memoryCommitPercent", "availableMemoryMB", "cpuPercent", "systemDiskActivePercent"):
        assert key in data["unknownMetrics"], key
        assert data["metrics"][key]["value"] is None
    assert data["suggestedMaxWorkers"] is None


@needs_winps
def test_abandoned_read_does_not_kill_a_callers_session():
    # Started with -Command (not -File): the script must end with a plain exit, so the caller's own code still runs.
    cmd = [WINPS, "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command",
           "& '" + str(SCRIPT) + "' -ForceBudgetMs 400 -Json; 'caller-still-alive'"]
    proc = subprocess.run(cmd, capture_output=True, timeout=60, stdin=subprocess.DEVNULL)
    out = proc.stdout.decode("utf-8", "replace")
    assert proc.returncode == 0
    lines = [ln for ln in out.splitlines() if ln.strip()]
    assert lines[-1] == "caller-still-alive"
    assert json.loads(lines[0])["verdict"] == "UNKNOWN"


MALFORMED = [
    ["-SampleSeconds"],               # value-less trailing parameter
    ["-Json", "-Json"],               # duplicated switch
    ["-F"],                           # ambiguous parameter-name prefix
]


@needs_winps
@pytest.mark.parametrize("args", MALFORMED, ids=[" ".join(a) for a in MALFORMED])
def test_malformed_command_lines_are_the_documented_exception(args):
    # Contract: exit 0 for any WELL-FORMED command line; PowerShell rejects these before the script runs,
    # so callers must treat a non-zero exit code or empty output as UNKNOWN.
    code, out, err = run_ps(args)
    assert code != 0
    assert out.strip() == ""
    text = SCRIPT.read_text(encoding="ascii")
    assert "callers must treat any other exit code or empty output as UNKNOWN" in text


@needs_winps
def test_json_notes_state_the_exit_contract(tmp_path):
    code, data, _, _ = check_fixture(tmp_path, make_sample())
    assert "exit code 0 for any well-formed command line" in data["notes"]
    assert "empty output as UNKNOWN" in data["notes"]


@needs_winps
def test_network_location_message_from_fixture(tmp_path):
    payload = make_sample(freeSpaceGB=None, **{k: None for k in REPO_DISK})
    payload["context"]["projectOnNetworkPath"] = True
    code, data, _, _ = check_fixture(tmp_path, payload)
    assert data["verdict"] == "UNKNOWN"
    assert data["context"]["projectOnNetworkPath"] is True
    assert "network location cannot be measured" in data["message"]
    out_vi = human(tmp_path, payload, "vi", "net_vi.json")
    assert "v\u1ecb tr\u00ed m\u1ea1ng" in out_vi
    # a non-bool flag is coerced to null and adds nothing
    payload["context"]["projectOnNetworkPath"] = "yes"
    code, data, _, _ = check_fixture(tmp_path, payload, name="net2.json")
    assert data["context"]["projectOnNetworkPath"] is None
    assert "network location" not in data["message"]


@needs_winps
def test_live_unc_path_is_flagged_quickly_and_never_ok():
    started = time.time()
    code, out, err = run_ps(["-Path", "\\\\no-such-server-xyz\\share", "-Json"], timeout=120)
    assert time.time() - started < 15
    data = json.loads(out)
    assert code == 0
    assert data["context"]["projectOnNetworkPath"] is True
    assert data["metrics"]["freeSpaceGB"]["value"] is None
    assert data["verdict"] != "OK"
    assert "network location cannot be measured" in data["message"]
    assert "no-such-server" not in out + err


# --- pwsh 7 extras -----------------------------------------------------------------------------------------------
@needs_pwsh
def test_pwsh_wait_loop_missing_memory_and_vi(tmp_path):
    seq = [make_sample(availableMemoryMB=300.0), make_sample()]
    code, data, _, _ = check_fixture(tmp_path, seq, ["-WaitSeconds", "30", "-IntervalSeconds", "0"], exe=PWSH)
    assert data["verdict"] == "OK" and data["samplesTaken"] == 2
    code, data, _, _ = check_fixture(tmp_path, make_sample(availableMemoryMB=None), exe=PWSH, name="m.json")
    assert data["verdict"] == "UNKNOWN" and data["suggestedMaxWorkers"] is None
    f = write_fixture(tmp_path, make_sample(availableMemoryMB=300.0), "v.json")
    code, out, _ = run_ps(["-FromSampleJson", str(f), "-Lang", "vi", "-Json"], exe=PWSH)
    assert out.isascii() and "thi\u1ebfu b\u1ed9 nh\u1edb" in json.loads(out)["message"]
    code, out, err = run_ps(["-FromSampleJson", "\\\\no-such-server-xyz\\share\\x.json", "-Json"], exe=PWSH)
    assert code == 0 and json.loads(out)["reasons"][0] == "UNKNOWN: sample file not found"


@needs_pwsh
@pytest.mark.skipif(not ON_WINDOWS, reason="live pwsh sample is only meaningful on Windows")
def test_pwsh_live_sample():
    code, out, err = run_ps(["-SampleSeconds", "1", "-Json"], exe=PWSH, timeout=120)
    data = json.loads(out)
    assert code == 0 and data["verdict"] in {"OK", "BUSY", "PRESSURE", "UNKNOWN"}


@needs_pwsh
@pytest.mark.skipif(ON_WINDOWS, reason="non-Windows behavior")
def test_non_windows_live_is_unknown_exit_zero():
    code, out, err = run_ps(["-Json"], exe=PWSH)
    data = json.loads(out)
    assert code == 0 and data["verdict"] == "UNKNOWN"
    assert data["reasons"][0] == "UNKNOWN: unsupported platform"
