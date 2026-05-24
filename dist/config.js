import { z } from 'zod';
import { existsSync } from 'fs';
import path from 'path';
export const VisualTestConfigSchema = z.object({
    ai: z.object({
        provider: z.enum(['openai', 'anthropic', 'qwen-vl']).default('openai'),
        model: z.string().default('gpt-4o'),
        apiKey: z.string().optional(),
        timeout: z.number().default(30000),
    }),
    a11y: z.object({
        enabled: z.boolean().default(true),
        standard: z.enum(['wcag2a', 'wcag2aa', 'wcag2aaa']).default('wcag2aa'),
    }),
    screenshot: z.object({
        mode: z.enum(['viewport', 'fullPage']).default('fullPage'),
        saveOnFailure: z.boolean().default(true),
    }),
    ct: z.object({
        testDir: z.string().default('./visual-tests/components'),
        testMatch: z.string().default('**/*.visual.spec.{tsx,jsx}'),
    }),
    e2e: z.object({
        testDir: z.string().default('./visual-tests/e2e'),
        testMatch: z.string().default('**/*.visual.spec.ts'),
        baseURL: z.string().default('http://localhost:3000'),
    }),
});
export function defineConfig(config) {
    return config;
}
const DEFAULT_CONFIG = {
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
};
export async function loadConfig(cwd) {
    const dir = cwd ?? process.cwd();
    const configPath = path.join(dir, 'visual-test.config.ts');
    if (!existsSync(configPath)) {
        return { ...DEFAULT_CONFIG };
    }
    try {
        const mod = await import(configPath);
        const raw = mod.default ?? mod.config;
        const result = VisualTestConfigSchema.safeParse(raw);
        if (!result.success) {
            const messages = result.error.issues
                .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
                .join('\n');
            throw new Error(`Invalid visual-test.config.ts:\n${messages}`);
        }
        return result.data;
    }
    catch (err) {
        if (err instanceof Error && err.message.startsWith('Invalid visual-test.config.ts')) {
            throw err;
        }
        return { ...DEFAULT_CONFIG };
    }
}
