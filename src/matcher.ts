import { type Page } from '@playwright/test'
import { createProvider } from './ai-vision.js'
import { checkA11y } from './a11y.js'
import { captureScreenshot } from './screenshot.js'
import type { AIProvider } from './types.js'
import type { VisualTestConfig } from './config.js'
import { loadConfig } from './config.js'

export interface VisualCheckOptions {
  /** 自然语言规则列表 */
  rules: string[]
  /** 是否同时检查可访问性，默认继承 config */
  a11y?: boolean
  /** 截图模式，默认继承 config */
  mode?: 'viewport' | 'fullPage'
  /** 可选名称，用于失败截图文件名 */
  name?: string
}

/**
 * visual-test 的核心断言函数。
 *
 * 对当前页面截图，发送给 AI 视觉模型分析是否满足自然语言规则，
 * 同时可选地执行可访问性检查。任一检查失败则抛出错误。
 */
export async function expectVisual(
  page: Page,
  options: VisualCheckOptions,
): Promise<void> {
  const config: VisualTestConfig = await loadConfig()
  const issues: string[] = []

  // 1. 截图
  const screenshotMode = options.mode ?? config.screenshot.mode
  const screenshot = await captureScreenshot(page, {
    fullPage: screenshotMode === 'fullPage',
  })

  // 2. AI 视觉分析
  try {
    const provider = resolveProvider(config)
    const result = await provider.analyze(
      screenshot,
      options.rules.map(description => ({ description })),
    )

    for (const r of result.results) {
      if (!r.pass) {
        issues.push(
          `[视觉规则] "${options.rules[r.ruleIndex]}" 未通过: ${r.reason}`,
        )
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    issues.push(`[AI 分析错误] ${message}`)
  }

  // 3. 可访问性检查
  const doA11y = options.a11y ?? config.a11y.enabled
  if (doA11y) {
    try {
      const a11yResult = await checkA11y(page, {
        level: config.a11y.standard,
      })
      for (const v of a11yResult.violations) {
        issues.push(
          `[可访问性] [${v.impact}] ${v.id}: ${v.help} (${v.helpUrl})`,
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      issues.push(`[可访问性检查错误] ${message}`)
    }
  }

  // 4. 如果有问题，保存截图并抛出错误
  if (issues.length > 0) {
    if (config.screenshot.saveOnFailure) {
      const name = options.name ?? 'visual-failure'
      try {
        await page.screenshot({
          path: `visual-tests/screenshots/${name}-${Date.now()}.png`,
          fullPage: screenshotMode === 'fullPage',
        })
      } catch {
        // 保存截图失败不阻塞测试结果
      }
    }

    throw new Error(
      `视觉检查失败 (${issues.length} 个问题):\n${issues.join('\n')}`,
    )
  }
}

/**
 * 根据配置创建 AI provider 实例。
 * 当 config 中指定的 provider 不被支持时，默认回退到 openai。
 */
function resolveProvider(config: VisualTestConfig): AIProvider {
  const providerType = config.ai.provider

  if (providerType === 'openai') {
    return createProvider('openai', {
      apiKey: config.ai.apiKey ?? process.env.OPENAI_API_KEY ?? '',
      model: config.ai.model,
    })
  }

  if (providerType === 'anthropic') {
    return createProvider('anthropic', {
      apiKey: config.ai.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '',
      model: config.ai.model,
    })
  }

  // 不支持的 provider 回退到 openai
  return createProvider('openai', {
    apiKey: config.ai.apiKey ?? process.env.OPENAI_API_KEY ?? '',
    model: config.ai.model,
  })
}
