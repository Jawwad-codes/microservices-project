/** @format */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../context/AuthContext";

function AuthConsumer() {
  const { user, token, isAuth, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="is-auth">{String(isAuth)}</span>
      <span data-testid="user-email">{user?.email ?? "none"}</span>
      <span data-testid="token">{token ?? "none"}</span>
      <button
        data-testid="login-btn"
        onClick={() =>
          login("test-token", {
            id: "1",
            name: "Alice",
            email: "alice@test.com",
          })
        }
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

const setup = () =>
  render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );

beforeEach(() => localStorage.clear());

describe("AuthContext", () => {
  it("starts unauthenticated", () => {
    setup();
    expect(screen.getByTestId("is-auth").textContent).toBe("false");
    expect(screen.getByTestId("user-email").textContent).toBe("none");
    expect(screen.getByTestId("token").textContent).toBe("none");
  });

  it("login sets isAuth, user, and token", async () => {
    setup();
    await userEvent.click(screen.getByTestId("login-btn"));
    expect(screen.getByTestId("is-auth").textContent).toBe("true");
    expect(screen.getByTestId("user-email").textContent).toBe("alice@test.com");
    expect(screen.getByTestId("token").textContent).toBe("test-token");
  });

  it("login persists to localStorage", async () => {
    setup();
    await userEvent.click(screen.getByTestId("login-btn"));
    expect(localStorage.getItem("sf_token")).toBe("test-token");
    expect(JSON.parse(localStorage.getItem("sf_user")).email).toBe(
      "alice@test.com",
    );
  });

  it("logout clears state", async () => {
    setup();
    await userEvent.click(screen.getByTestId("login-btn"));
    await userEvent.click(screen.getByTestId("logout-btn"));
    expect(screen.getByTestId("is-auth").textContent).toBe("false");
    expect(screen.getByTestId("user-email").textContent).toBe("none");
    expect(screen.getByTestId("token").textContent).toBe("none");
  });

  it("logout clears localStorage", async () => {
    setup();
    await userEvent.click(screen.getByTestId("login-btn"));
    await userEvent.click(screen.getByTestId("logout-btn"));
    expect(localStorage.getItem("sf_token")).toBeNull();
    expect(localStorage.getItem("sf_user")).toBeNull();
  });

  it("restores session from localStorage on mount", () => {
    localStorage.setItem("sf_token", "saved-token");
    localStorage.setItem(
      "sf_user",
      JSON.stringify({ id: "2", name: "Bob", email: "bob@test.com" }),
    );
    setup();
    expect(screen.getByTestId("is-auth").textContent).toBe("true");
    expect(screen.getByTestId("user-email").textContent).toBe("bob@test.com");
  });
});
