# visual-test — 框架设计文档

**版本**: v0.1.0

## 一、项目定位

visual-test 是一个 **AI-powered 视觉 UI 测试框架扩展**。它不是一个新的 test runner，而是 Playwright 的插件 —— 复用 Playwright 的浏览器自动化、测试编排和报告能力，在其之上提供 AI 视觉断言能力。

```
┌──────────────────────────────────────────────┐
│              用户编写的测试代码                 │
│   visual-tests/components/*.visual.spec.tsx   │
│   visual-tests/e2e/*.visual.spec.ts           │
└──────────────────┬───────────────────────────┘
                   │ import { test, expectVisual }
                   ▼
┌──────────────────────────────────────────────┐
│                visual-test                    │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │ expectVisual │  │  config 系统          │   │
│  │ 视觉断言 API  │  │  visual-test.config.ts │   │
│  └──────┬──────┘  └──────────────────────┘   │
│         │                                      │
│         ▼                                      │
│  ┌──────────────────────────────────────────┐ │
│  │          核心能力（内置）                  │ │
│  │  ┌──────────┐ ┌───────┐ ┌──────────────┐ │ │
│  │  │ai-vision │ │ a11y  │ │ screenshot   │ │ │
│  │  │GPT-4V等  │ │axe-core│ │   utilities  │ │ │
│  │  └──────────┘ └───────┘ └──────────────┘ │ │
│  └──────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│              Playwright                        │
│   浏览器自动化 / 截图 / 测试运行 / 报告        │
└──────────────────────────────────────────────┘
```

## 二、单包架构

visual-test 是一个 **单 NPM 包**，不依赖额外的内部子包。所有核心能力内聚在 `src/` 目录下：

```
visual-test/                  ← 单 NPM 包
├── src/
│   ├── index.ts              # 主入口: defineConfig, expectVisual, createProvider...
│   ├── ct.ts                 # L2 组件测试入口
│   ├── e2e.ts                # L4 E2E 入口
│   ├── config.ts             # Zod 配置系统
│   ├── matcher.ts            # expectVisual 核心实现
│   ├── ai-vision.ts          # AI 视觉分析 (provider 可插拔)
│   ├── a11y.ts               # 可访问性检查 (axe-core)
│   ├── screenshot.ts         # Playwright 截图工具
│   ├── fixtures.ts           # Playwright fixtures 扩展
│   └── types.ts              # 共享类型定义
├── docs/
│   ├── design.md             # 本文档
│   └── testing-methodology.md
├── package.json
└── tsconfig.json
```

**设计原则**：
- 单包，零内部依赖，安装即用
- 扩展 Playwright，不替代 Playwright
- AI provider 可插拔，支持 OpenAI / Anthropic / 自定义

## 三、核心 API 设计

### 3.1 `expectVisual(page, options)`

visual-test 框架的核心断言。接收 Playwright 的 `Page` 对象和自然语言规则，调用 AI 视觉模型进行分析。

```typescript
interface VisualCheckOptions {
  rules: string[]          // 自然语言规则，如 ['折扣标签不遮挡产品图片']
  a11y?: boolean           // 是否同时检查可访问性，默认 true
  mode?: 'viewport' | 'fullPage'  // 截图模式
  name?: string            // 失败截图文件名
}

async function expectVisual(page: Page, options: VisualCheckOptions): Promise<void>
```

内部流程：
1. Playwright 截图
2. 调内置的 AI provider 分析
3. 可选的 a11y 检查
4. 失败时保存截图 + throw Error

### 3.2 配置系统

用户项目根目录的 `visual-test.config.ts`：

```typescript
import { defineConfig } from 'visual-test'

export default defineConfig({
  ai: {
    provider: 'openai',       // 可插拔 AI 模型
    model: 'gpt-4o',
    apiKey: process.env.VISUAL_AI_KEY,
  },
  a11y: {
    enabled: true,
    standard: 'wcag2aa',
  },
  screenshot: {
    mode: 'fullPage',
    saveOnFailure: true,
  },
  ct: {
    testDir: './visual-tests/components',
  },
  e2e: {
    testDir: './visual-tests/e2e',
    baseURL: 'http://localhost:3000',
  },
})
```

找不到配置文件时，全部使用默认值，框架仍可正常工作。

### 3.3 AI Provider 可插拔设计

这是让框架"通用"的关键设计。`visual-test` 定义了 `AIProvider` 接口：

```typescript
interface AIProvider {
  analyze(image: Buffer, rules: VisualRule[]): Promise<VisualResult>
}
```

内置 provider：
- `OpenAIProvider` — 使用 GPT-4V
- `AnthropicProvider` — 使用 Claude Vision

用户可实现自定义 provider 接入任意视觉模型，只需实现 `AIProvider` 接口。

## 四、L2 和 L4 双模式

### L2 — 组件/页面视觉测试

使用 Playwright Component Testing (CT) 模式，在真实浏览器中 mount 单个组件：

```typescript
// visual-tests/components/Button.visual.spec.tsx
import { test, expectVisual } from 'visual-test/ct'
import { Button } from '../../src/components/Button'

test('主要按钮颜色醒目', async ({ mount, page }) => {
  await mount(<Button variant="primary">提交</Button>)
  await expectVisual(page, {
    rules: ['按钮颜色醒目，文字清晰', '按钮圆角和阴影合适'],
  })
})
```

特点：
- 不启动完整应用，只 mount 单个组件
- 快速（单组件渲染毫秒级）
- 隔离性好（每个 test 独立的组件实例）

### L4 — 业务流程视觉测试

使用 Playwright E2E 模式，真实浏览器走完整流程：

```typescript
// visual-tests/e2e/checkout.visual.spec.ts
import { test, expectVisual } from 'visual-test/e2e'

test('下单全流程视觉正常', async ({ page }) => {
  await page.goto('/')
  await expectVisual(page, { name: '首页', rules: ['布局正常'] })

  await page.click('.product-card')
  await expectVisual(page, { name: '详情', rules: ['信息完整'] })

  await page.click('#add-to-cart')
  await expectVisual(page, { name: '购物车', rules: ['价格清晰'] })
})
```

特点：
- 完整应用，真实数据
- 慢（需要完整流程）
- 测的是端到端的视觉连续性

## 五、与其他工具的关系

| 工具 | 定位 | 关系 |
|------|------|------|
| Playwright | 浏览器自动化 + E2E 框架 | visual-test 的底层依赖 |
| Vitest | 单元/组件逻辑测试 | 互补，visual-test 不替代 |
| axe-core | 可访问性检查引擎 | visual-test 封装了 axe-core |
| UIUX Audit CLI | 未知网站的自动扫描 | 共享视觉测试能力，不同上层 |
| Storybook | 组件开发环境 | 可配合使用（CT 替代方案）|

## 六、设计决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 不自己做 test runner | 扩展 Playwright | Playwright 已是最成熟的浏览器自动化框架 |
| AI provider 可插拔 | 接口 + 工厂模式 | 不同团队预算/偏好不同 |
| a11y 默认开启 | 作为 expectVisual 的一部分 | 零额外成本，白送的断言 |
| 配置放根目录 | visual-test.config.ts | 和 eslint/vitest/playwright 惯例一致 |
