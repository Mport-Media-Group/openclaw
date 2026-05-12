/**
 * AWS credential presence (set/unset only).
 */
export function getAwsEnvSummary() {
  const id = process.env.AWS_ACCESS_KEY_ID?.trim() ? "set" : "unset";
  const sec = process.env.AWS_SECRET_ACCESS_KEY?.trim() ? "set" : "unset";
  const region = process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim() || "";
  return {
    accessKeyId: id,
    secretAccessKey: sec,
    region: region ? "set" : "unset",
  };
}
