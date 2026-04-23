const GL_CODE_REGEX = /^\d{3}-\d{4}$/;

export function isValidGlCode(value: string) {
  return GL_CODE_REGEX.test(value.trim());
}

export function validateGlCodes(glCodes: string[]) {
  const invalid = glCodes.filter((code) => !isValidGlCode(code));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}
