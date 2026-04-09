// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Jest mock typing needs permissive function signatures
export function mocked<T extends (...args: any[]) => any>(
  f: T
): jest.MockedFunction<T> {
  if (!jest.isMockFunction(f)) {
    throw new Error("Not a mock");
  }
  return f;
}
