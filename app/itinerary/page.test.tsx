import { act, render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ItineraryPage from "./page";

describe("ItineraryPage", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/itinerary");
    vi.restoreAllMocks();
  });

  it("renders every travel day in source order", () => {
    render(<ItineraryPage />);

    const dayHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(dayHeadings[0]).toHaveTextContent("9月24日");
    expect(dayHeadings.at(-1)).toHaveTextContent("10月6日");
    expect(screen.getByText("圣殿14:30；穹顶15:30")).toBeInTheDocument();
  });

  it("keeps alternatives separate and marks incomplete detail", () => {
    render(<ItineraryPage />);

    expect(screen.getAllByText("当日备选").length).toBeGreaterThan(0);
    expect(screen.getAllByText("详细安排待补").length).toBe(3);
  });

  it("hydrates city-filtered links without a server/client mismatch", async () => {
    const browserWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: undefined });
    const serverHtml = renderToString(<ItineraryPage />);
    Object.defineProperty(globalThis, "window", { configurable: true, value: browserWindow });
    window.history.replaceState({}, "", "/itinerary?city=巴塞罗那");

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const root = hydrateRoot(container, <ItineraryPage />);
    await waitFor(() => expect(container.querySelector('button[data-active="true"]')).toHaveTextContent("巴塞罗那"));

    expect(consoleError.mock.calls.flat().join(" ")).not.toMatch(/hydration|hydrated/i);

    await act(async () => root.unmount());
    container.remove();
  });
});
