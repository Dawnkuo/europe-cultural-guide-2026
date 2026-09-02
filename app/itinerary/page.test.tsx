import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ItineraryPage from "./page";

describe("ItineraryPage", () => {
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
});
