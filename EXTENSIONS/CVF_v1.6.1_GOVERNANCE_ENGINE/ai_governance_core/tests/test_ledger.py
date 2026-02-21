"""
test_ledger.py

Tests for ledger_layer: ImmutableLedger, BlockBuilder, HashEngine.
"""

import pytest
import json
import tempfile
import os

from ledger_layer.hash_engine import HashEngine
from ledger_layer.block_builder import BlockBuilder
from ledger_layer.immutable_ledger import ImmutableLedger


class TestHashEngine:
    """Test hash generation."""

    def test_deterministic_hash(self):
        data = {"key": "value", "num": 42}
        h1 = HashEngine.generate_hash(data)
        h2 = HashEngine.generate_hash(data)
        assert h1 == h2

    def test_different_data_different_hash(self):
        h1 = HashEngine.generate_hash({"a": 1})
        h2 = HashEngine.generate_hash({"a": 2})
        assert h1 != h2

    def test_hash_is_sha256(self):
        h = HashEngine.generate_hash({"test": True})
        assert len(h) == 64  # SHA-256 hex digest length

    def test_key_order_doesnt_matter(self):
        h1 = HashEngine.generate_hash({"b": 2, "a": 1})
        h2 = HashEngine.generate_hash({"a": 1, "b": 2})
        assert h1 == h2  # sort_keys=True


class TestBlockBuilder:
    """Test block building."""

    def test_build_block_structure(self):
        builder = BlockBuilder()
        block = builder.build_block("GENESIS", {"event": "test"})
        assert "timestamp" in block
        assert "previous_hash" in block
        assert "event" in block
        assert "hash" in block
        assert block["previous_hash"] == "GENESIS"

    def test_block_hash_is_valid(self):
        builder = BlockBuilder()
        block = builder.build_block("GENESIS", {"event": "test"})
        assert len(block["hash"]) == 64

    def test_chain_integrity(self):
        builder = BlockBuilder()
        block1 = builder.build_block("GENESIS", {"idx": 1})
        block2 = builder.build_block(block1["hash"], {"idx": 2})
        assert block2["previous_hash"] == block1["hash"]


class TestImmutableLedger:
    """Test ledger append and chain integrity."""

    def test_append_creates_block(self, tmp_dir):
        ledger_path = os.path.join(tmp_dir, "ledger.json")
        with open(ledger_path, "w") as f:
            json.dump([], f)

        ledger = ImmutableLedger(ledger_path=ledger_path)
        block = ledger.append_event({"action": "APPROVE"})

        assert block["previous_hash"] == "GENESIS"
        assert "hash" in block

        with open(ledger_path, "r") as f:
            chain = json.load(f)
        assert len(chain) == 1

    def test_chain_grows(self, tmp_dir):
        ledger_path = os.path.join(tmp_dir, "ledger.json")
        with open(ledger_path, "w") as f:
            json.dump([], f)

        ledger = ImmutableLedger(ledger_path=ledger_path)
        b1 = ledger.append_event({"idx": 1})
        b2 = ledger.append_event({"idx": 2})

        assert b2["previous_hash"] == b1["hash"]

        with open(ledger_path, "r") as f:
            chain = json.load(f)
        assert len(chain) == 2

    def test_creates_file_if_missing(self, tmp_dir):
        ledger_path = os.path.join(tmp_dir, "subdir", "ledger.json")
        ledger = ImmutableLedger(ledger_path=ledger_path)
        assert os.path.exists(ledger_path)
