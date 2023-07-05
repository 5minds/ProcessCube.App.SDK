import 'server-only';
let engineUrl = process.env.PROCESSCUBE_ENGINE_URL || 'http://localhost:10560';
export function getEngineUrl() {
  return engineUrl;
}

export function setEngineUrl(engineUrl: string) {
  engineUrl = engineUrl;
}
