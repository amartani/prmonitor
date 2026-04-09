import type { Mock } from "vitest";
import { vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock typing needs permissive function signatures
export function mocked<T extends (...args: any[]) => any>(f: T): Mock<T> {
  if (!vi.isMockFunction(f)) {
    throw new Error("Not a mock");
  }
  return f;
}
