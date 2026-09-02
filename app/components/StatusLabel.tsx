import type { VisitStatus } from "../data/types";

export function StatusLabel({ status }: { status: VisitStatus }) {
  return <span className="status-label" data-status={status}>{status}</span>;
}
