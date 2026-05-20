import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Analyzer from "./Analyzer";

describe("Analyzer", () => {
  it("renders header and tab buttons", () => {
    render(
      <MemoryRouter>
        <Analyzer />
      </MemoryRouter>
    );
    expect(screen.getByText("AI ফসল বিশ্লেষণ")).toBeTruthy();
    expect(screen.getByText("📷 স্ক্যান")).toBeTruthy();
    expect(screen.getAllByText(/ইতিহাস/).length).toBeGreaterThan(0);
  });

  it("shows upload prompt", () => {
    render(
      <MemoryRouter>
        <Analyzer />
      </MemoryRouter>
    );
    expect(screen.getByText("ফসলের ছবি আপলোড করুন")).toBeTruthy();
  });
});
