/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AuthPage from "../pages/AuthPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));

import { authApi } from "../api/client";

const setup = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthPage — Layout", () => {
  it("shows Sign In form by default", () => {
    setup();
    // The submit button text
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeTruthy();
  });

  it("switches to Register form", async () => {
    setup();
    // Click the tab button labelled "Register"
    const registerTab = screen
      .getAllByRole("button")
      .find((b) => b.textContent.trim() === "Register");
    await userEvent.click(registerTab);
    expect(screen.getByPlaceholderText(/Jawwad Ahmed/i)).toBeTruthy();
  });
});

describe("AuthPage — Login", () => {
  it("calls authApi.login with entered values", async () => {
    authApi.login.mockResolvedValueOnce({
      data: {
        data: {
          token: "tok",
          user: { id: "1", name: "Alice", email: "a@b.com" },
        },
      },
    });
    setup();

    await userEvent.type(
      screen.getByPlaceholderText(/you@example\.com/i),
      "a@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/••••••••/),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "password123",
      }),
    );
  });

  it("shows error on login failure", async () => {
    authApi.login.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });
    setup();

    await userEvent.type(
      screen.getByPlaceholderText(/you@example\.com/i),
      "bad@b.com",
    );
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy(),
    );
  });
});

describe("AuthPage — Register", () => {
  const switchToRegister = async () => {
    const registerTab = screen
      .getAllByRole("button")
      .find((b) => b.textContent.trim() === "Register");
    await userEvent.click(registerTab);
  };

  it("calls authApi.register with form values", async () => {
    authApi.register.mockResolvedValueOnce({ data: { status: "success" } });
    setup();
    await switchToRegister();

    await userEvent.type(
      screen.getByPlaceholderText(/Jawwad Ahmed/i),
      "New User",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/you@example\.com/i),
      "new@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Min 6 characters/i),
      "password123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        name: "New User",
        email: "new@b.com",
        password: "password123",
      }),
    );
  });

  it("shows success message after registration", async () => {
    authApi.register.mockResolvedValueOnce({ data: { status: "success" } });
    setup();
    await switchToRegister();

    await userEvent.type(
      screen.getByPlaceholderText(/Jawwad Ahmed/i),
      "New User",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/you@example\.com/i),
      "new@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Min 6 characters/i),
      "password123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    await waitFor(() =>
      expect(screen.getByText(/account created/i)).toBeTruthy(),
    );
  });

  it("shows error on register failure", async () => {
    authApi.register.mockRejectedValueOnce({
      response: { data: { message: "Email already taken" } },
    });
    setup();
    await switchToRegister();

    await userEvent.type(screen.getByPlaceholderText(/Jawwad Ahmed/i), "User");
    await userEvent.type(
      screen.getByPlaceholderText(/you@example\.com/i),
      "exists@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/Min 6 characters/i),
      "pass123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    await waitFor(() =>
      expect(screen.getByText(/email already taken/i)).toBeTruthy(),
    );
  });
});
