import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Chat from "./Chat";

describe("Chat", () => {
  it("renders header and input area", () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );
    expect(screen.getByText("কৃষি AI পরামর্শদাতা")).toBeTruthy();
    expect(screen.getByPlaceholderText(/প্রশ্ন লিখুন/)).toBeTruthy();
  });

  it("shows welcome message", () => {
    render(
      <MemoryRouter>
        <Chat />
      </MemoryRouter>
    );
    expect(screen.getByText("কৃষি AI-তে স্বাগতম")).toBeTruthy();
  });
});
