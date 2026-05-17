"""
test_utils.py

Tests for core/utils.py: Thread-safe JSON I/O + hashing.
"""

import pytest
import json
import os
import threading
from core.utils import load_json, save_json, generate_hash


class TestLoadJson:
    """Test JSON reading."""

    def test_load_valid_json(self, tmp_dir):
        path = os.path.join(tmp_dir, "data.json")
        with open(path, "w") as f:
            json.dump({"key": "value"}, f)

        result = load_json(path)
        assert result == {"key": "value"}

    def test_load_array(self, tmp_dir):
        path = os.path.join(tmp_dir, "arr.json")
        with open(path, "w") as f:
            json.dump([1, 2, 3], f)

        result = load_json(path)
        assert result == [1, 2, 3]

    def test_load_missing_file_raises(self, tmp_dir):
        with pytest.raises(FileNotFoundError):
            load_json(os.path.join(tmp_dir, "missing.json"))


class TestSaveJson:
    """Test JSON writing (atomic, thread-safe)."""

    def test_save_creates_file(self, tmp_dir):
        path = os.path.join(tmp_dir, "output.json")
        save_json(path, {"hello": "world"})
        assert os.path.exists(path)

        with open(path, "r") as f:
            data = json.load(f)
        assert data == {"hello": "world"}

    def test_save_creates_parent_dirs(self, tmp_dir):
        path = os.path.join(tmp_dir, "a", "b", "c", "data.json")
        save_json(path, {"nested": True})
        assert os.path.exists(path)

    def test_save_overwrites(self, tmp_dir):
        path = os.path.join(tmp_dir, "data.json")
        save_json(path, {"v": 1})
        save_json(path, {"v": 2})

        result = load_json(path)
        assert result == {"v": 2}

    def test_thread_safety(self, tmp_dir):
        """Concurrent writes should not corrupt the file."""
        path = os.path.join(tmp_dir, "concurrent.json")
        save_json(path, [])

        errors = []

        def writer(n):
            try:
                for i in range(10):
                    save_json(path, {"thread": n, "iter": i})
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=writer, args=(i,)) for i in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0
        # File should be valid JSON
        result = load_json(path)
        assert isinstance(result, dict)


class TestGenerateHash:
    """Test hashing."""

    def test_deterministic(self):
        data = {"a": 1, "b": 2}
        assert generate_hash(data) == generate_hash(data)

    def test_order_independent(self):
        assert generate_hash({"a": 1, "b": 2}) == generate_hash({"b": 2, "a": 1})

    def test_different_data(self):
        assert generate_hash({"a": 1}) != generate_hash({"a": 2})

    def test_sha256_length(self):
        h = generate_hash({"test": True})
        assert len(h) == 64
