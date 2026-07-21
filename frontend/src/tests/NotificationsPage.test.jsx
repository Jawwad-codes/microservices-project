/** @format */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NotificationsPage from "../pages/NotificationsPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../api/client", () => ({
  notificationsApi: {
    list: vi.fn(),
    byEmail: vi.fn(),
  },
}));

import { notificationsApi } from "../api/client";

const mockNotifications = [
  {
    id: "n1",
    email: "u@b.com",
    type: "order_confirmation",
    subject: "Order Confirmation",
    body: "Your order is confirmed.",
    status: "sent",
    createdAt: new Date().toISOString(),
  },
  {
    id: "n2",
    email: "u@b.com",
    type: "order_cancelled",
    subject: "Your Order Has Been Cancelled",
    body: "Your order was cancelled.",
    status: "sent",
    createdAt: new Date().toISOString(),
  },
];

const renderPage = (loggedIn = true) => {
  if (loggedIn) {
    localStorage.setItem("sf_token", "tok");
    localStorage.setItem(
      "sf_user",
      JSON.stringify({ id: "u1", name: "User", email: "u@b.com" }),
    );
  } else {
    localStorage.clear();
  }
  return render(
    <MemoryRouter>
      <AuthProvider>
        <NotificationsPage />
      </AuthProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("NotificationsPage — Unauthenticated", () => {
  it("shows sign-in prompt", () => {
    renderPage(false);
    expect(screen.getByText(/sign in to view notifications/i)).toBeTruthy();
  });
});

describe("NotificationsPage — Display", () => {
  it("renders notification subjects", async () => {
    notificationsApi.byEmail.mockResolvedValueOnce({
      data: { data: mockNotifications },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Order Confirmation")).toBeTruthy(),
    );
    expect(screen.getByText("Your Order Has Been Cancelled")).toBeTruthy();
  });

  it("shows notification count in header", async () => {
    notificationsApi.byEmail.mockResolvedValueOnce({
      data: { data: mockNotifications },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/2 notifications for u@b.com/i)).toBeTruthy(),
    );
  });

  it("shows empty state when no notifications", async () => {
    notificationsApi.byEmail.mockResolvedValueOnce({ data: { data: [] } });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no notifications yet/i)).toBeTruthy(),
    );
  });

  it("fetches by user email", async () => {
    notificationsApi.byEmail.mockResolvedValueOnce({
      data: { data: mockNotifications },
    });
    renderPage();
    await waitFor(() =>
      expect(notificationsApi.byEmail).toHaveBeenCalledWith("u@b.com"),
    );
  });
});

describe("NotificationsPage — Filter tabs", () => {
  it("shows filter buttons for each type", async () => {
    notificationsApi.byEmail.mockResolvedValueOnce({
      data: { data: mockNotifications },
    });
    renderPage();
    await waitFor(() => screen.getByText("Order Confirmation"));
    expect(screen.getByText(/Order Confirmed/i)).toBeTruthy();
    expect(screen.getByText(/Order Cancelled/i)).toBeTruthy();
  });

  it("filters notifications by type when tab is clicked", async () => {
    notificationsApi.byEmail.mockResolvedValueOnce({
      data: { data: mockNotifications },
    });
    renderPage();
    await waitFor(() => screen.getByText("Order Confirmation"));

    // Click "Order Cancelled" filter
    await userEvent.click(screen.getByText(/Order Cancelled/i));
    expect(screen.queryByText("Order Confirmation")).toBeNull();
    expect(screen.getByText("Your Order Has Been Cancelled")).toBeTruthy();
  });
});

describe("NotificationsPage — Expand row", () => {
  it("expands notification body on click", async () => {
    notificationsApi.byEmail.mockResolvedValueOnce({
      data: { data: [mockNotifications[0]] },
    });
    renderPage();
    await waitFor(() => screen.getByText("Order Confirmation"));

    await userEvent.click(screen.getByText("Order Confirmation"));
    await waitFor(() =>
      expect(screen.getByText(/your order is confirmed/i)).toBeTruthy(),
    );
  });
});
