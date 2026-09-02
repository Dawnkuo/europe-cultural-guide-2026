import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GuidePage, { generateStaticParams } from "./page";

describe("GuidePage", () => {
  it("generates one static route per canonical guide", () => {
    expect(generateStaticParams()).toContainEqual({ slug: "st-peters-basilica" });
    expect(generateStaticParams()).toContainEqual({ slug: "cologne-cathedral" });
  });

  it("renders one complete chapter for a standard attraction", async () => {
    render(
      await GuidePage({
        params: Promise.resolve({ slug: "cologne-cathedral" }),
      }),
    );

    expect(screen.getByRole("heading", { name: "科隆大教堂" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "空间关系" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "不可错过" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "现场顺序" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "实用攻略" })).toBeInTheDocument();
  });

  it("opens the imported Vatican material from this site's own path", async () => {
    render(
      await GuidePage({
        params: Promise.resolve({ slug: "vatican-museums" }),
      }),
    );

    expect(screen.getByRole("link", { name: "打开完整离线导览" })).toHaveAttribute(
      "href",
      "/vatican-guide/",
    );
  });
});
