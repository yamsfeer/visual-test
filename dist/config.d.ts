import { z } from 'zod';
export declare const VisualTestConfigSchema: z.ZodObject<{
    ai: z.ZodObject<{
        provider: z.ZodDefault<z.ZodEnum<["openai", "anthropic", "qwen-vl"]>>;
        model: z.ZodDefault<z.ZodString>;
        apiKey: z.ZodOptional<z.ZodString>;
        timeout: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        model: string;
        provider: "openai" | "anthropic" | "qwen-vl";
        timeout: number;
        apiKey?: string | undefined;
    }, {
        apiKey?: string | undefined;
        model?: string | undefined;
        provider?: "openai" | "anthropic" | "qwen-vl" | undefined;
        timeout?: number | undefined;
    }>;
    a11y: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        standard: z.ZodDefault<z.ZodEnum<["wcag2a", "wcag2aa", "wcag2aaa"]>>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        standard: "wcag2a" | "wcag2aa" | "wcag2aaa";
    }, {
        enabled?: boolean | undefined;
        standard?: "wcag2a" | "wcag2aa" | "wcag2aaa" | undefined;
    }>;
    screenshot: z.ZodObject<{
        mode: z.ZodDefault<z.ZodEnum<["viewport", "fullPage"]>>;
        saveOnFailure: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        mode: "viewport" | "fullPage";
        saveOnFailure: boolean;
    }, {
        mode?: "viewport" | "fullPage" | undefined;
        saveOnFailure?: boolean | undefined;
    }>;
    ct: z.ZodObject<{
        testDir: z.ZodDefault<z.ZodString>;
        testMatch: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        testDir: string;
        testMatch: string;
    }, {
        testDir?: string | undefined;
        testMatch?: string | undefined;
    }>;
    e2e: z.ZodObject<{
        testDir: z.ZodDefault<z.ZodString>;
        testMatch: z.ZodDefault<z.ZodString>;
        baseURL: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        baseURL: string;
        testDir: string;
        testMatch: string;
    }, {
        baseURL?: string | undefined;
        testDir?: string | undefined;
        testMatch?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    e2e: {
        baseURL: string;
        testDir: string;
        testMatch: string;
    };
    ai: {
        model: string;
        provider: "openai" | "anthropic" | "qwen-vl";
        timeout: number;
        apiKey?: string | undefined;
    };
    a11y: {
        enabled: boolean;
        standard: "wcag2a" | "wcag2aa" | "wcag2aaa";
    };
    screenshot: {
        mode: "viewport" | "fullPage";
        saveOnFailure: boolean;
    };
    ct: {
        testDir: string;
        testMatch: string;
    };
}, {
    e2e: {
        baseURL?: string | undefined;
        testDir?: string | undefined;
        testMatch?: string | undefined;
    };
    ai: {
        apiKey?: string | undefined;
        model?: string | undefined;
        provider?: "openai" | "anthropic" | "qwen-vl" | undefined;
        timeout?: number | undefined;
    };
    a11y: {
        enabled?: boolean | undefined;
        standard?: "wcag2a" | "wcag2aa" | "wcag2aaa" | undefined;
    };
    screenshot: {
        mode?: "viewport" | "fullPage" | undefined;
        saveOnFailure?: boolean | undefined;
    };
    ct: {
        testDir?: string | undefined;
        testMatch?: string | undefined;
    };
}>;
export type VisualTestConfig = z.infer<typeof VisualTestConfigSchema>;
export declare function defineConfig(config: VisualTestConfig): VisualTestConfig;
export declare function loadConfig(cwd?: string): Promise<VisualTestConfig>;
