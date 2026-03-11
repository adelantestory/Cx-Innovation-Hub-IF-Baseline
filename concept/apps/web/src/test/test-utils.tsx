import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Custom render function that wraps components with any necessary providers.
 * Extend this as the app grows (e.g., add router, context providers).
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render with custom render
export { customRender as render };
