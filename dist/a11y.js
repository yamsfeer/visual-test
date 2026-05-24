/**
 * 在 Playwright 页面中执行可访问性检查。
 * 需要播放页面已加载完毕，再调用此函数。
 */
export async function checkA11y(page, options) {
    await page.waitForLoadState('domcontentloaded');
    try {
        const result = await page.evaluate((opts) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
                script.onload = () => {
                    const axe = window.axe;
                    if (!axe) {
                        reject(new Error('axe-core failed to load'));
                        return;
                    }
                    const runOptions = {};
                    if (opts?.level) {
                        runOptions.runOnly = {
                            type: 'tag',
                            values: [opts.level],
                        };
                    }
                    const context = opts?.selector || undefined;
                    axe
                        .run(context, runOptions)
                        .then((results) => {
                        const violations = results.violations.map((v) => ({
                            id: v.id,
                            impact: v.impact || 'minor',
                            description: v.description,
                            help: v.help,
                            helpUrl: v.helpUrl,
                            nodes: v.nodes.length,
                        }));
                        resolve({
                            violations,
                            passes: results.passes.length,
                        });
                    })
                        .catch(reject);
                };
                script.onerror = () => reject(new Error('Failed to load axe-core script'));
                document.head.appendChild(script);
            });
        }, options);
        return result;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            violations: [
                {
                    id: 'a11y-check-error',
                    impact: 'critical',
                    description: `Accessibility check failed: ${message}`,
                    help: 'Check that the page is accessible and axe-core can be loaded.',
                    helpUrl: 'https://github.com/dequelabs/axe-core',
                    nodes: 0,
                },
            ],
            passes: 0,
        };
    }
}
