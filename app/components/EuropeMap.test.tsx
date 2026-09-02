import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EuropeMap } from "./EuropeMap";

describe("EuropeMap", () => {
  it("renders the local map and all itinerary cities", () => {
    render(<EuropeMap selectedCity="罗马" onSelectCity={() => {}} />);

    expect(
      screen.getByRole("img", { name: "欧洲旅程总览地图" }),
    ).toBeVisible();
    expect(screen.getAllByRole("button", { name: /查看.*行程/ })).toHaveLength(
      8,
    );
  });

  it("reports city selection", () => {
    const onSelectCity = vi.fn();
    render(<EuropeMap selectedCity="罗马" onSelectCity={onSelectCity} />);

    fireEvent.click(screen.getByRole("button", { name: "查看巴塞罗那行程" }));
    expect(onSelectCity).toHaveBeenCalledWith("巴塞罗那");
  });
});
