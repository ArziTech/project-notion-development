import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "@/features/auth";
import {
  mockPush,
  resetRouterMocks,
} from "../../../../__tests__/__mocks__/next-router";

// Mock fetch
global.fetch = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRouterMocks();
    vi.mocked(fetch).mockReset();
  });

  it("should render signup form with all fields", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("should show heading and description", () => {
    render(<SignupForm />);

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(
      screen.getByText(/enter your details to create your account/i),
    ).toBeInTheDocument();
  });

  it("should validate username - show error for short username", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "ab");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/username must be at least 3 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("should validate username - reject special characters", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "user@name");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/username can only contain letters/i),
      ).toBeInTheDocument();
    });
  });

  it("should validate name - show error for short name", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(nameInput, "J");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 2 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("should validate email - reject invalid email", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it("should validate password - show error for short password", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(passwordInput, "123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 6 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("should validate password confirmation - passwords must match", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password456");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("should accept optional email field", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(nameInput, "Test User");
    await user.type(emailInput, ""); // Empty email
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: expect.stringContaining('"email":""'),
      });
    });
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    const { toast } = require("sonner");

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(nameInput, "Test User");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: expect.stringContaining("testuser"),
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully! Please login.",
      );
    });
  });

  it("should redirect to login page on successful signup", async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(nameInput, "Test User");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("should show error message on signup failure", async () => {
    const user = userEvent.setup();
    const { toast } = require("sonner");

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Username already exists" }),
    } as Response);

    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "existinguser");
    await user.type(nameInput, "Test User");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Username already exists");
    });
  });

  it("should show loading state while submitting", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(nameInput, "Test User");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });
  });

  it("should have social signup buttons", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText(/sign up with apple/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sign up with google/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sign up with meta/i)).toBeInTheDocument();
  });

  it("should have link to login page", () => {
    render(<SignupForm />);

    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("should show generic error on network failure", async () => {
    const user = userEvent.setup();
    const { toast } = require("sonner");

    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<SignupForm />);

    const usernameInput = screen.getByLabelText(/username/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(nameInput, "Test User");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong. Please try again.",
      );
    });
  });
});
