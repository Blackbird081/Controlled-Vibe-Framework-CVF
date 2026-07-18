/**
 * Local read-only view of the accepted T3 RefineryPacket, per
 * docs/reference/sot_three_layer/CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md
 * section 2. Kernel consumes this shape by reference only; Kernel is
 * never a second RefineryPacket producer.
 */
export type RefineryStatus = "IN_PROGRESS" | "READY_FOR_KERNEL" | "REVIEW_REQUIRED" | "BLOCKED";

export interface RefineryPacketRef {
  refinery_packet_id: string;
  content_hash: string;
  declared_scope: { organization: string; country?: string | null; project?: string | null; customer?: string | null };
  status: RefineryStatus;
}
