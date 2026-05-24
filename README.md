# visual-test

**AI-powered visual UI testing framework for Playwright.**

visual-test 是一个 Playwright 扩展框架，让你用自然语言描述 UI 的视觉期望，由 AI 模型审查截图并判断通过与否。它不是一个新的 test runner——你仍然用 Playwright 组织测试、启动浏览器、编写交互逻辑，只是在需要视觉断言的地方调用 `expectVisual`。

## 特性

- **自然语言视觉断言** — 用中文或英文描述 UI 期望，无需手写像素级断言
- **AI Provider 可插拔** — 内置 OpenAI / Anthropic 支持，可接入任意视觉模型
- **双模式入口** — `visual-test/ct` 用于组件级视觉测试，`visual-test/e2e` 用于端到端流程测试
- **自动可访问性检查** — 默认集成 axe-core，每次视觉断言同时检查 a11y
- **零额外 test runner** — 完全基于 Playwright，复用其浏览器自动化、报告和 CI 能力

## 安装

```bash
npm install -D @playwright/test visual-test
```

## 快速开始

### 1. 创建配置文件

在项目根目录创建 `visual-test.config.ts`：

```typescript
import { defineConfig } from 'visual-test'

export default defineConfig({
  ai: {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: process.env.VISUAL_AI_KEY,
  },
})
```

API key 始终通过环境变量注入，不要硬编码在配置文件中。

### 2. 组件视觉测试（L2）

使用 Playwright Component Testing 在真实浏览器中 mount 单个组件，验证其渲染外观：

```typescript
// visual-tests/components/button.visual.spec.tsx
import { test, expectVisual } from 'visual-test/ct'
import { Button } from '@/components/Button'

test('primary 样式正常', async ({ mount, page }) => {
  await mount(<Button variant="primary">Submit</Button>)

  await expectVisual(page, {
    rules: [
      '按钮颜色醒目，与背景有足够对比度',
      '文字居中，字号合适且清晰可读',
      '圆角平滑，无锯齿',
    ],
  })
})

test('disabled 状态下视觉正确', async ({ mount, page }) => {
  await mount(<Button disabled>Submit</Button>)

  await expectVisual(page, {
    rules: [
      '按钮整体呈现灰色调，传达不可点击的语义',
      '文字与背景的对比度仍符合可访问性要求',
    ],
  })
})
```

### 3. E2E 流程视觉测试（L4）

在完整的端到端测试流程中，对关键页面节点做视觉快照断言：

```typescript
// visual-tests/e2e/user-flow.visual.spec.ts
import { test, expectVisual } from 'visual-test/e2e'

test('注册流程各页面视觉正常', async ({ page }) => {
  await page.goto('/register')

  await expectVisual(page, {
    name: '注册首页',
    rules: ['表单居中，输入框对齐整齐', '提交按钮可见且文案完整'],
  })

  await page.fill('#email', 'user@example.com')
  await page.click('button[type="submit"]')

  await expectVisual(page, {
    name: '验证码页',
    rules: ['验证码输入框居中可见', '重新发送按钮存在'],
  })
})
```

### 4. 运行测试

```bash
# L2 组件视觉测试（需先配置 Playwright CT）
npx playwright test -c playwright-ct.config.ts visual-tests/components/

# L4 E2E 视觉测试
npx playwright test visual-tests/e2e/
```

## 目录结构建议

推荐的测试目录布局：

```
your-project/
├── visual-test.config.ts          # visual-test 配置文件
├── visual-tests/
│   ├── components/                # L2 组件视觉测试
│   │   └── *.visual.spec.tsx
│   └── e2e/                       # L4 E2E 视觉测试
│       └── *.visual.spec.ts
└── playwright.config.ts           # Playwright 自身配置
```

## 配置参考

```typescript
import { defineConfig } from 'visual-test'

export default defineConfig({
  // AI 视觉模型
  ai: {
    provider: 'openai',           // 'openai' | 'anthropic'
    model: 'gpt-4o',
    apiKey: process.env.VISUAL_AI_KEY,
    timeout: 30000,
  },

  // 可访问性检查（默认开启，零 AI 成本）
  a11y: {
    enabled: true,
    standard: 'wcag2aa',          // 'wcag2a' | 'wcag2aa' | 'wcag2aaa'
  },

  // 截图策略
  screenshot: {
    mode: 'fullPage',             // 'viewport' | 'fullPage'
    saveOnFailure: true,
  },
})
```

## API

### `expectVisual(page, options)`

核心断言函数，截取当前页面并交由 AI 视觉模型分析。

```typescript
await expectVisual(page, {
  rules: ['按钮颜色醒目，与背景有足够对比度'],
  a11y?: boolean       // 是否同步检查可访问性，默认 true
  mode?: 'viewport' | 'fullPage'  // 截图模式，默认使用配置值
  name?: string        // 用于失败截图的文件名标识
})
```

### `defineConfig(config)`

类型安全的配置定义辅助函数，返回带类型的配置对象。

### `createProvider(type, config)`

创建一个 AI Provider 实例，用于自定义场景。

```typescript
import { createProvider } from 'visual-test'

const provider = createProvider('openai', {
  apiKey: process.env.VISUAL_AI_KEY,
  model: 'gpt-4o',
})
```

## 架构

```
用户测试代码
    │  import { test, expectVisual } from 'visual-test/ct'
    ▼
┌─────────────────────────┐
│      visual-test         │
│  ┌─────────────────┐    │
│  │  expectVisual    │    │
│  │  AI 视觉断言 API  │    │
│  └────────┬────────┘    │
│           │              │
│  ┌────────┴────────┐    │
│  │  ai-vision  a11y │    │
│  │  screenshot     │    │
│  └─────────────────┘    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│       Playwright         │
│  浏览器 / 截图 / 测试运行  │
└─────────────────────────┘
```

visual-test 是 Playwright 的扩展，不是替代。你拥有 Playwright 的全部能力，在此之上获得 AI 视觉断言。

## 与其他工具的关系

| 工具 | 定位 | 关系 |
|------|------|------|
| Playwright | 浏览器自动化 + E2E 框架 | visual-test 的底层依赖 |
| Vitest | 单元 / 组件逻辑测试 | 互补，visual-test 不做逻辑断言 |
| Storybook | 组件开发与展示 | 可配合使用 |

## 文档

- [框架设计文档](docs/design.md)
- [测试方法论](docs/testing-methodology.md)

## 许可证

MIT
