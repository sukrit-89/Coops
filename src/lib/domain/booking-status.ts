import type { AppRole, BookingStatus } from "@/types/database";

const transitions: Record<BookingStatus, BookingStatus[]> = {
  requested: ["accepted", "rejected", "cancelled"],
  accepted: ["confirmed", "cancelled"],
  confirmed: ["worker_en_route", "cancelled", "disputed"],
  worker_en_route: ["in_progress", "disputed"],
  in_progress: ["completed", "disputed"],
  completed: [],
  cancelled: [],
  rejected: [],
  disputed: ["cancelled", "completed"]
};

const roleTransitions: Record<AppRole, BookingStatus[]> = {
  customer: ["cancelled", "disputed"],
  worker: ["accepted", "rejected", "worker_en_route", "in_progress", "completed", "disputed"],
  cooperative_admin: ["confirmed", "cancelled", "disputed"],
  platform_admin: ["accepted", "rejected", "confirmed", "worker_en_route", "in_progress", "completed", "cancelled", "disputed"]
};

export function canTransitionBookingStatus({
  from,
  to,
  role
}: {
  from: BookingStatus;
  to: BookingStatus;
  role: AppRole;
}) {
  return transitions[from].includes(to) && roleTransitions[role].includes(to);
}

export function validNextStatuses(from: BookingStatus) {
  return transitions[from];
}
