import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SourcesPage from "./page";

describe("SourcesPage", () => {
  it("shows official sources and local archive provenance", () => {
    render(<SourcesPage />);

    expect(screen.getByText("腾讯文档")).toBeInTheDocument();
    expect(screen.getByText("正式票据与确认文件")).toBeInTheDocument();
    expect(screen.getByText("Vatican Museums")).toBeInTheDocument();
    expect(screen.getByText("Barcelona History Museum (MUHBA)")).toBeInTheDocument();
  });
});
