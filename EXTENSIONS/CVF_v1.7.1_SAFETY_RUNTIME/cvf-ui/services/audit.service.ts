
import { apiGet } from "./cvf.api";
import { AuditEntry } from "../types/ai.types";

export async function getAudit(): Promise<AuditEntry[]> {
  return apiGet("/audit");
}