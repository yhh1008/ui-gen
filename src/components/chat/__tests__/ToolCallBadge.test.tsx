import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result",
  result?: unknown
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "test", toolName, args, state, result } as ToolInvocation;
  }
  return { toolCallId: "test", toolName, args, state } as ToolInvocation;
}

// str_replace_editor — in-progress
test("shows 'Creating' label while create is in progress", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

// str_replace_editor — completed create
test("shows green dot (no spinner) when create is completed", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", "ok")}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// str_replace_editor — str_replace
test("shows 'Editing' label for str_replace command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" }, "result", "ok")}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

// str_replace_editor — insert
test("shows 'Editing' label for insert command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/components/Card.jsx" }, "result", "ok")}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

// str_replace_editor — view
test("shows 'Reading' label for view command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/App.jsx" }, "result", "ok")}
    />
  );
  expect(screen.getByText("Reading App.jsx")).toBeDefined();
});

// str_replace_editor — undo_edit
test("shows 'Reverting' label for undo_edit command", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/App.jsx" }, "result", "ok")}
    />
  );
  expect(screen.getByText("Reverting App.jsx")).toBeDefined();
});

// file_manager — rename
test("shows 'Renaming' label for file_manager rename", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", { command: "rename", path: "/Old.jsx" }, "result", "ok")}
    />
  );
  expect(screen.getByText("Renaming Old.jsx")).toBeDefined();
});

// file_manager — delete
test("shows 'Deleting' label for file_manager delete", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/Old.jsx" }, "result", "ok")}
    />
  );
  expect(screen.getByText("Deleting Old.jsx")).toBeDefined();
});

// fallback — unknown tool
test("falls back to raw toolName for unknown tools", () => {
  render(
    <ToolCallBadge
      toolInvocation={makeInvocation("some_unknown_tool", {}, "result", "ok")}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// spinner shown when in progress
test("shows spinner when tool call is in progress", () => {
  const { container } = render(
    <ToolCallBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeTruthy();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
