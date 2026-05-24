import type { Page } from 'playwright';
import type { A11yResult, A11yViolation } from './types.js';

interface A11yOptions {
  /** WCAG 标准等级 */
  level?: 'wcag2a' | 'wcag2aa' | 'wcag2aaa';
  /** 指定要检查的选择器范围 */
  selector?: string;
}

interface AxeViolation {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: unknown[];
}

interface AxeResult {
  violations: AxeViolation[];
  passes: unknown[];
}

/**
 * 在 Playwright 页面中执行可访问性检查。
 * 需要播放页面已加载完毕，再调用此函数。
 */
export async function checkA11y(
  page: Page,
  options?: A11yOptions
): Promise<A11yResult> {
  await page.waitForLoadState('domcontentloaded');

  try {
    const result = await page.evaluate((opts) => {
      return new Promise<A11yResult>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
        script.onload = () => {
          const axe = (window as unknown as Record<string, unknown>).axe as {
            run: (
              context?: string | unknown,
              config?: Record<string, unknown>
            ) => Promise<AxeResult>;
          };
          if (!axe) {
            reject(new Error('axe-core failed to load'));
            return;
          }

          const runOptions: Record<string, unknown> = {};
          if (opts?.level) {
            runOptions.runOnly = {
              type: 'tag',
              values: [opts.level],
            };
          }

          const context = opts?.selector || undefined;

          axe
            .run(context, runOptions)
            .then((results: AxeResult) => {
              const violations: A11yViolation[] = results.violations.map(
                (v) => ({
                  id: v.id,
                  impact: (v.impact as A11yViolation['impact']) || 'minor',
                  description: v.description,
                  help: v.help,
                  helpUrl: v.helpUrl,
                  nodes: v.nodes.length,
                })
              );

              resolve({
                violations,
                passes: results.passes.length,
              });
            })
            .catch(reject);
        };
        script.onerror = () =>
          reject(new Error('Failed to load axe-core script'));
        document.head.appendChild(script);
      });
    }, options);

    return result;
  } catch (error) {
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
