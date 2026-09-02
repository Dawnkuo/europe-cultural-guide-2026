import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("journey overview", () => {
  it("introduces the real trip and exposes the map", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "欧洲纪行 2026" }),
    ).toBeVisible();
    expect(screen.getByText("2026.09.24 — 10.06")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "欧洲旅程总览地图" }),
    ).toBeVisible();
  });

  it("shows the known critical notices", () => {
    render(<Home />);

    expect(screen.getByText(/圣殿14:30/)).toBeVisible();
    expect(screen.getByText(/比萨往返车票/)).toBeVisible();
    expect(screen.getByText(/晚到入住/)).toBeVisible();
  });
});
