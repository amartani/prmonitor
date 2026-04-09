import { formatTimeAgo } from "./format-time-ago";

describe("formatTimeAgo", () => {
  const now = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns just now for under 60 seconds", () => {
    expect(formatTimeAgo(now - 30_000)).toBe("just now");
  });

  it("returns minutes for under 1 hour", () => {
    expect(formatTimeAgo(now - 2 * 60_000)).toBe("2 minutes ago");
    expect(formatTimeAgo(now - 60_000)).toBe("1 minute ago");
  });

  it("returns hours for under 24 hours", () => {
    expect(formatTimeAgo(now - 3 * 60 * 60_000)).toBe("3 hours ago");
    expect(formatTimeAgo(now - 60 * 60_000)).toBe("1 hour ago");
  });

  it("returns days for 24 hours or more", () => {
    expect(formatTimeAgo(now - 2 * 24 * 60 * 60_000)).toBe("2 days ago");
    expect(formatTimeAgo(now - 24 * 60 * 60_000)).toBe("1 day ago");
  });
});
