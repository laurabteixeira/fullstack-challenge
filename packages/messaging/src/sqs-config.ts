export type SqsConfig = {
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function loadSqsConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SqsConfig {
  const region = env.AWS_REGION ?? "us-east-1";
  const accessKeyId = env.AWS_ACCESS_KEY_ID ?? "test";
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY ?? "test";
  const endpoint = env.AWS_ENDPOINT_URL;

  return { region, endpoint, accessKeyId, secretAccessKey };
}
