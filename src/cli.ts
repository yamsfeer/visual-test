import { Command } from 'commander'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'

const program = new Command()

program
  .name('visual-test')
  .description('AI-powered visual UI testing CLI')
  .version('0.1.0')

program
  .command('init')
  .description('Initialize visual-test configuration and directory structure')
  .action(() => {
    const cwd = process.cwd()

    const configPath = path.join(cwd, 'visual-test.config.ts')
    if (existsSync(configPath)) {
      console.log(`⚠ ${configPath} already exists, skipping.`)
    } else {
      const configContent = `import { defineConfig } from 'visual-test'

export default defineConfig({
  ai: {
    provider: 'openai',
    model: 'gpt-4o',
    timeout: 30000,
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
    testMatch: '**/*.visual.spec.{tsx,jsx}',
  },
  e2e: {
    testDir: './visual-tests/e2e',
    testMatch: '**/*.visual.spec.ts',
    baseURL: 'http://localhost:3000',
  },
})
`
      writeFileSync(configPath, configContent)
      console.log(`✓ Created ${configPath}`)
    }

    const directories = [
      'visual-tests/components',
      'visual-tests/pages',
      'visual-tests/e2e',
    ]

    for (const dir of directories) {
      const fullPath = path.join(cwd, dir)
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true })
        console.log(`✓ Created ${fullPath}/`)
      }
    }

    const componentExamplePath = path.join(cwd, 'visual-tests/components/example.visual.spec.tsx')
    if (!existsSync(componentExamplePath)) {
      const content = `import { test } from 'visual-test/ct'
import { expectVisual } from 'visual-test/ct'

test('Example component visual test', async ({ mount, page }) => {
  // Mount your component
  // const { container } = await mount(<YourComponent />)

  await expectVisual(page, {
    rules: [
      'The component renders correctly',
      'All text is readable with proper contrast',
    ],
    name: 'example-component',
  })
})
`
      writeFileSync(componentExamplePath, content)
      console.log(`✓ Created ${componentExamplePath}`)
    }

    const pagesExamplePath = path.join(cwd, 'visual-tests/pages/example.visual.spec.ts')
    if (!existsSync(pagesExamplePath)) {
      const content = `import { test } from 'visual-test/e2e'
import { expectVisual } from 'visual-test/e2e'

test('Example page visual test', async ({ page }) => {
  await page.goto('/')

  await expectVisual(page, {
    rules: [
      'The page layout is correct',
      'Navigation elements are visible',
      'No broken images or missing content',
    ],
    name: 'example-page',
  })
})
`
      writeFileSync(pagesExamplePath, content)
      console.log(`✓ Created ${pagesExamplePath}`)
    }

    const e2eExamplePath = path.join(cwd, 'visual-tests/e2e/example.visual.spec.ts')
    if (!existsSync(e2eExamplePath)) {
      const content = `import { test } from 'visual-test/e2e'
import { expectVisual } from 'visual-test/e2e'

test('Example E2E visual test', async ({ page }) => {
  await page.goto('/')

  // Interact with the page
  await page.click('button#cta')

  await expectVisual(page, {
    rules: [
      'The CTA section is visible after clicking the button',
      'The page layout is correct after interaction',
      'No layout shifts or visual glitches',
    ],
    name: 'example-e2e',
  })
})
`
      writeFileSync(e2eExamplePath, content)
      console.log(`✓ Created ${e2eExamplePath}`)
    }

    console.log('\nVisual test setup complete! Run your tests with:')
    console.log('  npx playwright test --config visual-test.config.ts')
  })

program
  .command('add <name>')
  .description('Create a new visual test template')
  .option('-t, --type <type>', 'Test type: component, page, or e2e', 'component')
  .action((name: string, options: { type: string }) => {
    const cwd = process.cwd()
    const validTypes = ['component', 'page', 'e2e']

    if (!validTypes.includes(options.type)) {
      console.error(`❌ Invalid type: "${options.type}". Must be one of: ${validTypes.join(', ')}`)
      process.exit(1)
    }

    const dirMap: Record<string, string> = {
      component: 'visual-tests/components',
      page: 'visual-tests/pages',
      e2e: 'visual-tests/e2e',
    }

    const dir = path.join(cwd, dirMap[options.type])
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const ext = options.type === 'component' ? '.tsx' : '.ts'
    const fileName = `${name}.visual.spec${ext}`
    const filePath = path.join(dir, fileName)

    if (existsSync(filePath)) {
      console.log(`⚠ ${filePath} already exists, skipping.`)
      return
    }

    const templates: Record<string, string> = {
      component: `import { test } from 'visual-test/ct'
import { expectVisual } from 'visual-test/ct'

test('${name} visual test', async ({ mount, page }) => {
  // Mount your component
  // const { container } = await mount(<${name} />)

  await expectVisual(page, {
    rules: [
      'The ${name} component renders correctly',
      'All interactive elements are properly styled',
    ],
    name: '${name}',
  })
})
`,
      page: `import { test } from 'visual-test/e2e'
import { expectVisual } from 'visual-test/e2e'

test('${name} page visual test', async ({ page }) => {
  await page.goto('/')

  await expectVisual(page, {
    rules: [
      'The page layout is correct',
      'Key content is visible and well-structured',
    ],
    name: '${name}',
  })
})
`,
      e2e: `import { test } from 'visual-test/e2e'
import { expectVisual } from 'visual-test/e2e'

test('${name} E2E visual test', async ({ page }) => {
  await page.goto('/')

  // Add your interactions here
  // await page.click('button')

  await expectVisual(page, {
    rules: [
      'The flow works correctly after interactions',
      'All UI elements are properly displayed',
    ],
    name: '${name}',
  })
})
`,
    }

    writeFileSync(filePath, templates[options.type])
    console.log(`✓ Created ${filePath}`)
  })

program.parse()
