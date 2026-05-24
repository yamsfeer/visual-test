/**
 * 对 Playwright 页面截图，支持全页和选择器裁剪。
 */
export async function captureScreenshot(page, options) {
    const { fullPage, selector, timeout } = options ?? {};
    if (selector) {
        const el = page.locator(selector);
        if (timeout !== undefined) {
            await el.waitFor({ state: 'attached', timeout });
        }
        return await el.screenshot({ type: 'png' });
    }
    return await page.screenshot({
        type: 'png',
        fullPage: fullPage ?? false,
        timeout,
    });
}
