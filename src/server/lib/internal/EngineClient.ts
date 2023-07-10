import { EngineClient } from '@5minds/processcube_engine_client';

export const Client = new EngineClient(process.env.PROCESSCUBE_ENGINE_URL ?? 'http://localhost:10560');
