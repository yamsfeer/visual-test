# visual-test

**AI-powered visual UI testing framework for Playwright.**

visual-test 是一个 Playwright 扩展框架，让你可以用自然语言描述 UI 的视觉期望，AI 模型帮你审查截图并判断通过与否。

```
npx visual-test init        # 初始化项目
npx visual-test add Button  # 生成组件测试模板
```

```typescript
// visual-tests/components/Button.visual.spec.tsx
import { test, expectVisual } from 'visual-test/ct'

test('按钮视觉正确', async ({ mount, page }) => {
  await mount(<Button variant="primary">提交订单</Button>)

  await expectVisual(page, {
    rules: [
      '按钮颜色醒目，与背景有足够对比度',
      '文字居中且清晰可读',
      '圆角半径合理，无锯齿',
    ],
  })
})
```

## 四层测试体系

visual-test 面向前端测试方法论中的**视觉断言维度**，扩展现有的 Playwright 测试分层：

| 层次 | 逻辑断言 | 视觉断言（visual-test） |
|------|---------|-----------------|
| L2 组件/页面 | vitest + jsdom | visual-test/ct — mount 组件 → AI 分析外观 |
| L4 E2E | Playwright E2E | visual-test/e2e — 流程截图 → AI 分析 |

## 安装

```bash
# Playwright 是 peer dependency，需要先安装
npm install -D @playwright/test
# 安装 visual-test
npm install -D visual-test
```

## 快速开始

### 1. 初始化

```bash
npx visual-test init
```

这会创建：
```
visual-test.config.ts       # 配置文件（AI provider、a11y、截图策略）
visual-tests/
├── components/             # L2 组件视觉测试
│   └── example.visual.spec.tsx
├── pages/                  # L2 页面视觉测试
│   └── example.visual.spec.ts
└── e2e/                    # L4 流程视觉测试
    └── example.visual.spec.ts
```

### 2. 配置 AI provider

编辑 `visual-test.config.ts`，设置 API key（通过环境变量注入）：

```typescript
import { defineConfig } from 'visual-test'

export default defineConfig({
  ai: {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY,
  },
})
```

或者使用 Claude：

```typescript
ai: {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY,
}
```

### 3. 写测试

**组件测试（L2 视觉）** — 使用 Playwright Component Testing：

```typescript
// visual-tests/components/ProductCard.visual.spec.tsx
import { test, expectVisual } from 'visual-test/ct'
import { ProductCard } from '../../src/components/ProductCard'

test.describe('ProductCard', () => {
  test('正常价格显示清晰', async ({ mount, page }) => {
    await mount(<ProductCard name="运动鞋垫" price={199} />)
    await expectVisual(page, {
      rules: ['价格数字清晰醒目', '产品名称完整无截断'],
    })
  })

  test('折扣标签不遮挡产品图', async ({ mount, page }) => {
    await mount(<ProductCard name="运动鞋垫" price={299} discountPrice={199} />)
    await expectVisual(page, {
      rules: [
        '折扣标签完全可见，不遮挡产品图片',
        '原价有划线效果，折扣价颜色突出',
      ],
    })
  })
})
```

**E2E 流程测试（L4 视觉）** — 使用 Playwright E2E：

```typescript
// visual-tests/e2e/checkout.visual.spec.ts
import { test, expectVisual } from 'visual-test/e2e'

test('下单全流程视觉正常', async ({ page }) => {
  await page.goto('/')

  await expectVisual(page, {
    name: '首页',
    rules: ['产品列表布局整齐，无卡片重叠或溢出'],
  })

  await page.click('.product-card:first-child')
  await expectVisual(page, {
    name: '商品详情',
    rules: ['商品主图清晰，购买按钮可见且文案完整'],
  })

  await page.click('#add-to-cart')
  await expectVisual(page, {
    name: '购物车弹出',
    rules: ['侧边栏弹出正确，总价显示清晰'],
  })
})
```

### 4. 运行

```bash
# 运行组件视觉测试
npx playwright test -c playwright-ct.config.ts visual-tests/components/

# 运行 E2E 视觉测试
npx playwright test visual-tests/e2e/

# 如果配置了 CI 脚本
npm test
```

## 配置参考

```typescript
// visual-test.config.ts
import { defineConfig } from 'visual-test'

export default defineConfig({
  // AI 视觉模型配置
  ai: {
    provider: 'openai',         // 'openai' | 'anthropic' | 'qwen-vl'
    model: 'gpt-4o',
    apiKey: process.env.VISUAL_AI_KEY,
    timeout: 30000,             // API 调用超时 (ms)
  },

  // 可访问性检查（零 AI 成本，白送的断言）
  a11y: {
    enabled: true,
    standard: 'wcag2aa',       // 'wcag2a' | 'wcag2aa' | 'wcag2aaa'
  },

  // 截图策略
  screenshot: {
    mode: 'fullPage',           // 'viewport' | 'fullPage'
    saveOnFailure: true,        // 失败时自动保存截图
  },

  // L2 组件测试
  ct: {
    testDir: './visual-tests/components',
    testMatch: '**/*.visual.spec.{tsx,jsx}',
  },

  // L4 E2E 测试
  e2e: {
    testDir: './visual-tests/e2e',
    testMatch: '**/*.visual.spec.ts',
    baseURL: 'http://localhost:3000',
  },
})
```

## 包架构

```
visual-test                 ← 视觉测试框架（单包）
├── visual-test/ct          ← L2 组件测试入口
├── visual-test/e2e         ← L4 E2E 测试入口
└── AI vision / a11y / screenshot  ← 内置核心能力
```

## 与其他工具的关系

| 工具 | 用途 | visual-test 的关系 |
|------|------|-----------|
| Playwright | 浏览器自动化 | visual-test 的底层依赖 |
| Vitest | 单元/逻辑测试 | 互补，不替代 |
| Storybook | 组件开发 | 可配合使用 |
| Chrome DevTools | 手动调试 | 互补 |

## 文档

- [框架设计文档](docs/design.md)
- [四层测试方法论](docs/testing-methodology.md)

## 许可证

MIT
