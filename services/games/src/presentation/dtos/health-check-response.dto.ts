export class HealthCheckResponseDto {
  status: "ok" | "degraded";
  service: string;
  messaging: "ok" | "degraded";
}
