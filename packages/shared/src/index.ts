export const SYSTEM_NAME = "SystemArchitect AI";

export type Status = "ok" | "error";

export interface HealthCheckResponse {
  status: Status;
}
