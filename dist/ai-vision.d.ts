import type { AIProvider } from './types.js';
export type ProviderType = 'openai' | 'anthropic';
export interface OpenAIProviderConfig {
    apiKey: string;
    model?: string;
    baseURL?: string;
}
export interface AnthropicProviderConfig {
    apiKey: string;
    model?: string;
}
export type ProviderConfig = OpenAIProviderConfig | AnthropicProviderConfig;
export declare function createProvider(type: 'openai', config: OpenAIProviderConfig): AIProvider;
export declare function createProvider(type: 'anthropic', config: AnthropicProviderConfig): AIProvider;
