import '@testing-library/jest-dom'
import type { Assertion, AsymmetricMatchersContaining } from 'vitest'

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

interface CustomMatchers<R = void> {
  toBeInTheDocument(): R
  toBeVisible(): R
  toBeEmptyDOMElement(): R
  toBeDisabled(): R
  toBeEnabled(): R
  toBeInvalid(): R
  toBeRequired(): R
  toBeValid(): R
  toHaveAttribute(attr: string, value?: string): R
  toHaveClass(className: string): R
  toHaveFormValues(values: Record<string, any>): R
  toHaveStyle(css: string | Record<string, string>): R
  toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R
  toHaveValue(value?: string | number | string[]): R
  toBePartiallyChecked(): R
  toHaveErrorMessage(message: string): R
  toBeChecked(): R
  toBePartiallyChecked(): R
}
