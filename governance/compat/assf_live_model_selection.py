"""ASSF live provider/model selection helpers."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any


AUTO_FREE_QUOTA_MODEL = "AUTO_FROM_ALIBABA_FREE_QUOTA_LEDGER"
AUTO_PROVIDER = "AUTO_FROM_ASSF_LIVE_PROVIDER_CANDIDATES"
ALIBABA_PROVIDER = "alibaba-dashscope"
ALIBABA_PROVIDER_ALIASES = frozenset({ALIBABA_PROVIDER, "alibaba"})


@dataclass(frozen=True)
class ModelSelection:
    requested_model: str
    resolved_model: str | None
    status: str
    ledger_path: Path
    requested_provider: str = AUTO_PROVIDER
    resolved_provider: str | None = ALIBABA_PROVIDER
    provider_status: str = "PROVIDER_USABLE"
    expiration_date: str | None = None
    free_quota_remaining: int | None = None
    diagnostic_rerun_result: str | None = None
    reason: str | None = None

    def to_dict(self, *, relative_to: Path | None = None) -> dict[str, Any]:
        ledger_path = self.ledger_path
        if relative_to is not None:
            try:
                ledger_path_text = ledger_path.relative_to(relative_to).as_posix()
            except ValueError:
                ledger_path_text = ledger_path.as_posix()
        else:
            ledger_path_text = ledger_path.as_posix()
        return {
            "requestedProvider": self.requested_provider,
            "resolvedProvider": self.resolved_provider,
            "providerStatus": self.provider_status,
            "requestedModel": self.requested_model,
            "resolvedModel": self.resolved_model,
            "status": self.status,
            "ledgerPath": ledger_path_text,
            "expirationDate": self.expiration_date,
            "freeQuotaRemaining": self.free_quota_remaining,
            "diagnosticRerunResult": self.diagnostic_rerun_result,
            "reason": self.reason,
        }


def _parse_ledger_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _ledger_entry_model_id(entry: dict[str, Any]) -> str | None:
    model_id = entry.get("modelCode") or entry.get("modelId")
    return model_id if isinstance(model_id, str) and model_id.strip() else None


def _diagnostic_result(entry: dict[str, Any]) -> str | None:
    rerun = entry.get("diagnosticRerun")
    if isinstance(rerun, dict):
        result = rerun.get("result")
        return str(result) if result else None
    result = entry.get("diagnosticRerunResult")
    return str(result) if result else None


def _load_free_quota_models(ledger_path: Path) -> list[dict[str, Any]]:
    data = json.loads(ledger_path.read_text(encoding="utf-8"))
    models = data.get("models") if isinstance(data, dict) else None
    if not isinstance(models, list):
        raise ValueError("Alibaba free-quota ledger missing models array")
    return [entry for entry in models if isinstance(entry, dict)]


def _entry_to_selection(
    *,
    requested_provider: str,
    resolved_provider: str,
    requested_model: str,
    entry: dict[str, Any],
    ledger_path: Path,
    status: str,
    reason: str | None = None,
) -> ModelSelection:
    model_id = _ledger_entry_model_id(entry)
    remaining = entry.get("freeQuotaRemaining")
    if remaining is None:
        remaining = entry.get("freeQuotaRemainingAtCapture")
    return ModelSelection(
        requested_provider=requested_provider,
        resolved_provider=resolved_provider,
        provider_status="PROVIDER_USABLE",
        requested_model=requested_model,
        resolved_model=model_id,
        status=status,
        ledger_path=ledger_path,
        expiration_date=str(entry.get("expirationDate", "")) or None,
        free_quota_remaining=remaining if isinstance(remaining, int) else None,
        diagnostic_rerun_result=_diagnostic_result(entry),
        reason=reason,
    )


def resolve_free_quota_model(
    *,
    requested_model: str,
    ledger_path: Path,
    today: date | None = None,
) -> ModelSelection:
    return resolve_provider_model(
        requested_provider=ALIBABA_PROVIDER,
        requested_model=requested_model,
        ledger_path=ledger_path,
        today=today,
    )


def resolve_provider_model(
    *,
    requested_provider: str,
    requested_model: str,
    ledger_path: Path,
    today: date | None = None,
) -> ModelSelection:
    if requested_provider == AUTO_PROVIDER:
        resolved_provider = ALIBABA_PROVIDER
        provider_reason = (
            "auto-selected the only source-backed ASCP-T5 live provider candidate"
        )
    elif requested_provider in ALIBABA_PROVIDER_ALIASES:
        resolved_provider = ALIBABA_PROVIDER
        provider_reason = None
    else:
        return ModelSelection(
            requested_provider=requested_provider,
            resolved_provider=None,
            provider_status="PROVIDER_NOT_SOURCE_BACKED_FOR_ASSF_USE_CASE",
            requested_model=requested_model,
            resolved_model=None,
            status="PROVIDER_MODEL_NOT_USABLE",
            ledger_path=ledger_path,
            reason=(
                "provider is not implemented as a source-backed ASCP-T5 "
                "live provider/model selection candidate"
            ),
        )

    now = today or date.today()
    models = _load_free_quota_models(ledger_path)
    by_model = {
        model_id: entry
        for entry in models
        if (model_id := _ledger_entry_model_id(entry)) is not None
    }

    def is_usable(entry: dict[str, Any]) -> bool:
        expiration = entry.get("expirationDate")
        if not isinstance(expiration, str):
            return False
        parsed = _parse_ledger_date(expiration)
        return parsed is not None and now <= parsed

    if requested_model != AUTO_FREE_QUOTA_MODEL:
        entry = by_model.get(requested_model)
        if entry is None:
            return ModelSelection(
                requested_provider=requested_provider,
                resolved_provider=resolved_provider,
                provider_status="PROVIDER_USABLE",
                requested_model=requested_model,
                resolved_model=None,
                status="MODEL_FREE_QUOTA_NOT_VERIFIED",
                ledger_path=ledger_path,
                reason="model is absent from the Alibaba free-quota ledger models array",
            )
        if not is_usable(entry):
            return _entry_to_selection(
                requested_model=requested_model,
                requested_provider=requested_provider,
                resolved_provider=resolved_provider,
                entry=entry,
                ledger_path=ledger_path,
                status="MODEL_FREE_QUOTA_EXPIRED",
                reason="model expiration date is before the current run date",
            )
        return _entry_to_selection(
            requested_provider=requested_provider,
            resolved_provider=resolved_provider,
            requested_model=requested_model,
            entry=entry,
            ledger_path=ledger_path,
            status="MODEL_FREE_QUOTA_USABLE",
        )

    candidates = [entry for entry in models if is_usable(entry)]
    if not candidates:
        return ModelSelection(
            requested_provider=requested_provider,
            resolved_provider=resolved_provider,
            provider_status="PROVIDER_USABLE",
            requested_model=requested_model,
            resolved_model=None,
            status="NO_USABLE_FREE_QUOTA_MODEL",
            ledger_path=ledger_path,
            reason="no unexpired models were found in the Alibaba free-quota ledger",
        )

    def sort_key(entry: dict[str, Any]) -> tuple[int, date, int, str]:
        expiration = _parse_ledger_date(str(entry.get("expirationDate", "")))
        remaining = entry.get("freeQuotaRemaining")
        if remaining is None:
            remaining = entry.get("freeQuotaRemainingAtCapture")
        diagnostic_pass = 1 if _diagnostic_result(entry) == "PASS" else 0
        return (
            diagnostic_pass,
            remaining if isinstance(remaining, int) else 0,
            expiration or date.min,
            _ledger_entry_model_id(entry) or "",
        )

    selected = max(candidates, key=sort_key)
    return _entry_to_selection(
        requested_provider=requested_provider,
        resolved_provider=resolved_provider,
        requested_model=requested_model,
        entry=selected,
        ledger_path=ledger_path,
        status="MODEL_FREE_QUOTA_USABLE",
        reason=(
            provider_reason
            or "auto-selected from unexpired Alibaba free-quota ledger entries"
        ),
    )
