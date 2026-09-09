// src/types/result.ts
import { EngineError } from '../errors/engineError';
export type EngineResultSuccess<T> = {
  success: true;
  data: T;
};

export type EngineResultFailure = {
  success: false;
  error: EngineError;
};

export type EngineResult<T> = EngineResultSuccess<T> | EngineResultFailure;
