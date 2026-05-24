// AI vision + a11y + screenshot (core)
export { createProvider } from './ai-vision.js'
export type { ProviderType, ProviderConfig, OpenAIProviderConfig, AnthropicProviderConfig } from './ai-vision.js'
export { checkA11y } from './a11y.js'
export { captureScreenshot } from './screenshot.js'

// Shared types
export type { VisualRule, RuleResult, VisualResult, AIProvider, A11yViolation, A11yResult, ScreenshotOptions } from './types.js'

// Configuration
export { defineConfig, loadConfig } from './config.js'
export type { VisualTestConfig } from './config.js'

// Visual assertion
export { expectVisual } from './matcher.js'
export type { VisualCheckOptions } from './matcher.js'
