import type { Page } from 'playwright';
import type { ScreenshotOptions } from './types.js';
/**
 * 对 Playwright 页面截图，支持全页和选择器裁剪。
 */
export declare function captureScreenshot(page: Page, options?: ScreenshotOptions): Promise<Buffer>;
