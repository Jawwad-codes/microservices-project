/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AuthPage from "../pages/AuthPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

import { authApi } from "../api/client";

const renderPage = () =>
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
  it("renders Sign In form by default", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeTruthy();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeTruthy();
  });

  it("switches to Register tab", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /register/i }));
    expect(screen.getByPlaceholderText(/jawwad ahmed/i)).toBeTruthy();
  });
});

describe("AuthPage — Login", () => {
  it("calls authApi.login with form values", async () => {
    authApi.login.mockResolvedValueOnce({
      data: {
        data: {
          token: "tok",
          user: { id: "1", name: "Alice", email: "a@b.com" },
        },
      },
    });

    renderPage();
    await userEvent.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "a@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/••••••••/i),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "password123",
      }),
    );
  });

  it("shows error message on login failure", async () => {
    authApi.login.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });

    renderPage();
    await userEvent.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "bad@b.com",
    );
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy(),
    );
  });
});

describe("AuthPage — Register", () => {
  it("calls authApi.register and switches to login tab on success", async () => {
    authApi.register.mockResolvedValueOnce({ data: { status: "success" } });

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /register/i }));
    await userEvent.type(
      screen.getByPlaceholderText(/jawwad ahmed/i),
      "New User",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "new@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/min 6 characters/i),
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
    // Should switch back to login tab showing success message
    await waitFor(() =>
      expect(screen.getByText(/account created/i)).toBeTruthy(),
    );
  });

  it("shows error message on register failure", async () => {
    authApi.register.mockRejectedValueOnce({
      response: { data: { message: "Email already taken" } },
    });

    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /register/i }));
    await userEvent.type(screen.getByPlaceholderText(/jawwad ahmed/i), "User");
    await userEvent.type(
      screen.getByPlaceholderText(/you@example.com/i),
      "exists@b.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText(/min 6 characters/i),
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
