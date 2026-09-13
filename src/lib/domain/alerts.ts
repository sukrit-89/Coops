export type AlertRule = {
 id: string;
 name: string;
 metric: "complaint_rate" | "cancellation_rate" | "worker_shortage" | "payment_failure" | "welfare_drain";
 threshold: number;
 windowHours: number;
 severity: "warning" | "critical";
};
