import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingsPage from "./page";

describe("BookingsPage", () => {
  it("groups ticket, transport and hotel records without prices", () => {
    const { container } = render(<BookingsPage />);

    expect(screen.getByRole("heading", { name: "门票" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "交通" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "住宿" })).toBeInTheDocument();
    expect(screen.getByText("圣殿14:30；穹顶15:30")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/€|EUR|总价|金额/);
  });
});
