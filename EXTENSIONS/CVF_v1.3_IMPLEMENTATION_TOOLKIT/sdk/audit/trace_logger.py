"""
Audit Trace Logger

Centralized audit logging for CVF executions.
"""

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import json

from ..adapters.base_adapter import AuditTrace


@dataclass
class AuditLogEntry:
    """Complete audit log entry"""
    trace: AuditTrace
    context: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)


class AuditTracer:
    """
    Centralized audit tracer for CVF
    
    Collects and persists audit traces from all executions.
    """
    
    def __init__(self, log_path: Optional[Path] = None):
        """
        Initialize audit tracer
        
        Args:
            log_path: Path to persist audit logs (optional)
        """
        self._entries: List[AuditLogEntry] = []
        self._log_path = log_path
        
        if log_path and log_path.exists():
            self._load()
    
    def log(
        self,
        trace: AuditTrace,
        context: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
    ) -> None:
        """
        Log an audit trace
        
        Args:
            trace: Audit trace from execution
            context: Additional context (e.g., user, session)
            tags: Tags for filtering
        """
        entry = AuditLogEntry(
            trace=trace,
            context=context or {},
            tags=tags or [],
        )
        self._entries.append(entry)
        
        if self._log_path:
            self._append_to_file(entry)
    
    def query(
        self,
        capability_id: Optional[str] = None,
        success: Optional[bool] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        limit: int = 100,
    ) -> List[AuditLogEntry]:
        """
        Query audit logs
        
        Args:
            capability_id: Filter by capability
            success: Filter by success status
            start_time: Filter by start time
            end_time: Filter by end time
            tags: Filter by tags (any match)
            limit: Maximum entries to return
            
        Returns:
            Matching audit log entries
        """
        results = []
        
        for entry in reversed(self._entries):  # Most recent first
            if len(results) >= limit:
                break
            
            # Apply filters
            if capability_id and entry.trace.capability_id != capability_id:
                continue
            
            if success is not None and entry.trace.success != success:
                continue
            
            if start_time and entry.trace.timestamp < start_time:
                continue
            
            if end_time and entry.trace.timestamp > end_time:
                continue
            
            if tags and not any(t in entry.tags for t in tags):
                continue
            
            results.append(entry)
        
        return results
    
    def get_stats(
        self,
        capability_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get statistics for executions
        
        Args:
            capability_id: Filter by capability
            
        Returns:
            Execution statistics
        """
        entries = self._entries
        if capability_id:
            entries = [e for e in entries if e.trace.capability_id == capability_id]
        
        if not entries:
            return {
                "total_executions": 0,
                "success_rate": 0,
                "avg_duration_ms": 0,
            }
        
        total = len(entries)
        successful = sum(1 for e in entries if e.trace.success)
        durations = [e.trace.duration_ms for e in entries]
        
        return {
            "total_executions": total,
            "successful_executions": successful,
            "failed_executions": total - successful,
            "success_rate": successful / total if total > 0 else 0,
            "avg_duration_ms": sum(durations) / len(durations) if durations else 0,
            "min_duration_ms": min(durations) if durations else 0,
            "max_duration_ms": max(durations) if durations else 0,
        }
    
    def get_failures(
        self,
        limit: int = 10,
    ) -> List[AuditLogEntry]:
        """Get recent failures"""
        return self.query(success=False, limit=limit)
    
    def export(self, format: str = "json") -> str:
        """
        Export audit logs
        
        Args:
            format: Export format ('json')
            
        Returns:
            Exported logs as string
        """
        if format == "json":
            return json.dumps(
                [self._entry_to_dict(e) for e in self._entries],
                indent=2,
                ensure_ascii=False,
            )
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def _entry_to_dict(self, entry: AuditLogEntry) -> Dict:
        """Convert entry to dictionary"""
        return {
            "trace": entry.trace.to_dict(),
            "context": entry.context,
            "tags": entry.tags,
        }
    
    def _append_to_file(self, entry: AuditLogEntry) -> None:
        """Append entry to log file"""
        if not self._log_path:
            return
        
        self._log_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self._log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(self._entry_to_dict(entry), ensure_ascii=False))
            f.write("\n")
    
    def _load(self) -> None:
        """Load logs from file"""
        if not self._log_path or not self._log_path.exists():
            return
        
        with open(self._log_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    trace_data = data["trace"]
                    trace = AuditTrace(
                        timestamp=datetime.fromisoformat(trace_data["timestamp"]),
                        capability_id=trace_data["capability_id"],
                        version=trace_data["version"],
                        actor=trace_data["actor"],
                        inputs=trace_data["inputs"],
                        outputs=trace_data.get("outputs"),
                        success=trace_data["success"],
                        error=trace_data.get("error"),
                        duration_ms=trace_data["duration_ms"],
                    )
                    entry = AuditLogEntry(
                        trace=trace,
                        context=data.get("context", {}),
                        tags=data.get("tags", []),
                    )
                    self._entries.append(entry)
                except Exception:
                    continue  # Skip malformed entries
    
    def clear(self) -> None:
        """Clear all logs"""
        self._entries = []
        if self._log_path and self._log_path.exists():
            self._log_path.unlink()
