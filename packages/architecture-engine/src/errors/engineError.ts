// src/errors/engineError.ts
export enum EngineErrorCode {
  ComponentNotFound = 'COMPONENT_NOT_FOUND',
  ConnectionNotFound = 'CONNECTION_NOT_FOUND',
  DuplicateComponent = 'DUPLICATE_COMPONENT',
  DuplicateConnection = 'DUPLICATE_CONNECTION',
  InvalidReference = 'INVALID_REFERENCE',
  InvalidOperation = 'INVALID_OPERATION',
  ValidationFailure = 'VALIDATION_FAILURE',
}

export class EngineError extends Error {
  public readonly code: EngineErrorCode;
  public readonly entityId?: string;
  // Preserve structured validation details when applicable
  public readonly validationErrors?: string[];
  constructor(code: EngineErrorCode, message: string, entityId?: string, validationErrors?: string[]) {
    super(message);
    this.code = code;
    this.entityId = entityId;
    this.validationErrors = validationErrors;
    Object.setPrototypeOf(this, EngineError.prototype);
  }
}
