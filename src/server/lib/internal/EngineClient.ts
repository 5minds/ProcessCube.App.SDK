import { EngineClient } from '@5minds/processcube_engine_client';

export const EngineURL = process.env.PROCESSCUBE_ENGINE_URL ?? 'http://localhost:10560';
export const Client = new EngineClient(EngineURL);
