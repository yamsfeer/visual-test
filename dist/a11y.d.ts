import type { Page } from 'playwright';
import type { A11yResult } from './types.js';
interface A11yOptions {
    /** WCAG 标准等级 */
    level?: 'wcag2a' | 'wcag2aa' | 'wcag2aaa';
    /** 指定要检查的选择器范围 */
    selector?: string;
}
/**
 * 在 Playwright 页面中执行可访问性检查。
 * 需要播放页面已加载完毕，再调用此函数。
 */
export declare function checkA11y(page: Page, options?: A11yOptions): Promise<A11yResult>;
export {};
