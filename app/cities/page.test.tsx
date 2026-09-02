import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CitiesPage from "./page";

describe("CitiesPage", () => {
  it("renders the cultural chapters for the full route", () => {
    render(<CitiesPage />);

    expect(screen.getByRole("heading", { name: "城市文化章节" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "佛罗伦萨" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "巴塞罗那" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "科隆" })).toBeInTheDocument();
  });
});
