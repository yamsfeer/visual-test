import { type Page } from '@playwright/test';
export interface VisualCheckOptions {
    /** 自然语言规则列表 */
    rules: string[];
    /** 是否同时检查可访问性，默认继承 config */
    a11y?: boolean;
    /** 截图模式，默认继承 config */
    mode?: 'viewport' | 'fullPage';
    /** 可选名称，用于失败截图文件名 */
    name?: string;
}
/**
 * visual-test 的核心断言函数。
 *
 * 对当前页面截图，发送给 AI 视觉模型分析是否满足自然语言规则，
 * 同时可选地执行可访问性检查。任一检查失败则抛出错误。
 */
export declare function expectVisual(page: Page, options: VisualCheckOptions): Promise<void>;
