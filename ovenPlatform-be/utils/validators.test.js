const { validateStreamName } = require('./validators');

describe('Stream Name Validation', () => {
  // Casi validi
  test('Valid stream name should pass validation', () => {
    const result = validateStreamName('validname12345');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('Stream name with underscores and hyphens should be valid', () => {
    const result = validateStreamName('valid_name-123');
    expect(result.isValid).toBe(true);
  });

  // Lunghezza minima
  test('Stream name less than 8 characters should be invalid', () => {
    const result = validateStreamName('short');
    expect(result.isValid).toBe(false);
    expect(result.error.code).toBe('STREAM_NAME_TOO_SHORT');
    expect(result.error.status).toBe(422);
  });

  // Presenza di spazi
  test('Stream name with spaces should be invalid', () => {
    const result = validateStreamName('invalid name');
    expect(result.isValid).toBe(false);
    expect(result.error.code).toBe('STREAM_NAME_CONTAINS_SPACES');
    expect(result.error.status).toBe(422);
  });

  // Caratteri speciali
  test('Stream name with special characters should be invalid', () => {
    const result = validateStreamName('invalid!name@#$%');
    expect(result.isValid).toBe(false);
    expect(result.error.code).toBe('STREAM_NAME_INVALID_CHARS');
    expect(result.error.status).toBe(422);
  });

  // Input non valido
  test('Missing stream name should be invalid', () => {
    const result = validateStreamName();
    expect(result.isValid).toBe(false);
    expect(result.error.code).toBe('MISSING_STREAM_NAME');
    expect(result.error.status).toBe(400);
  });

  test('Non-string stream name should be invalid', () => {
    const result = validateStreamName(12345);
    expect(result.isValid).toBe(false);
    expect(result.error.code).toBe('MISSING_STREAM_NAME');
    expect(result.error.status).toBe(400);
  });
});
