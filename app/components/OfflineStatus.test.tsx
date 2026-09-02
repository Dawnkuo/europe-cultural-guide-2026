import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfflineStatus } from "./OfflineStatus";

describe("OfflineStatus", () => {
  it("announces when the guide is offline", () => {
    render(<OfflineStatus />);

    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByText("离线可读")).toBeInTheDocument();
  });
});
