import { Bid } from "./types";

let bidCounter = 0;

function nextBidId(): string {
  bidCounter++;
  return `BID-${String(bidCounter).padStart(4, "0")}`;
}

export function resetBidCounter(): void {
  bidCounter = 0;
}

export class BidManager {
  private bids: Map<string, Bid> = new Map();

  submit(taskId: string, agentId: string, amount: number, message: string = ""): Bid {
    const bid: Bid = {
      id: nextBidId(),
      taskId,
      agentId,
      amount,
      status: "pending",
      message,
      submittedAt: Date.now(),
    };
    this.bids.set(bid.id, bid);
    return bid;
  }

  get(bidId: string): Bid | undefined {
    return this.bids.get(bidId);
  }

  findByTask(taskId: string): Bid[] {
    return [...this.bids.values()].filter((b) => b.taskId === taskId);
  }

  findByAgent(agentId: string): Bid[] {
    return [...this.bids.values()].filter((b) => b.agentId === agentId);
  }

  findPendingByTask(taskId: string): Bid[] {
    return this.findByTask(taskId).filter((b) => b.status === "pending");
  }

  accept(bidId: string): boolean {
    const bid = this.bids.get(bidId);
    if (!bid || bid.status !== "pending") return false;
    bid.status = "accepted";

    for (const other of this.findByTask(bid.taskId)) {
      if (other.id !== bidId && other.status === "pending") {
        other.status = "rejected";
      }
    }

    return true;
  }

  reject(bidId: string): boolean {
    const bid = this.bids.get(bidId);
    if (!bid || bid.status !== "pending") return false;
    bid.status = "rejected";
    return true;
  }

  withdraw(bidId: string): boolean {
    const bid = this.bids.get(bidId);
    if (!bid || bid.status !== "pending") return false;
    bid.status = "withdrawn";
    return true;
  }

  getLowestBid(taskId: string): Bid | undefined {
    const pending = this.findPendingByTask(taskId);
    if (pending.length === 0) return undefined;
    return pending.reduce((min, b) => (b.amount < min.amount ? b : min));
  }

  count(): number {
    return this.bids.size;
  }

  clear(): void {
    this.bids.clear();
  }
}
