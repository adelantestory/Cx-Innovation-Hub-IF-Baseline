import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

/**
 * Custom render function that wraps components with necessary providers.
 * Currently wraps with no providers, but can be extended as needed
 * (e.g., context providers, theme providers, etc.)
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { customRender as render };
