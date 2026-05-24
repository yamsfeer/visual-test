import OpenAI from 'openai';
import type { AIProvider, VisualRule, VisualResult } from './types.js';

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

function isOpenAIConfig(config: ProviderConfig): config is OpenAIProviderConfig {
  return 'apiKey' in config;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model ?? 'gpt-4o';
  }

  async analyze(image: Buffer, rules: VisualRule[]): Promise<VisualResult> {
    const rulesText = rules
      .map((r, i) => `规则 ${i + 1}: ${r.description}`)
      .join('\n');

    const prompt = `你是一名 UI/UX 质量审查助手。请逐条检查以下规则是否通过，基于提供的截图。

${rulesText}

请以 JSON 格式返回检查结果，格式如下：
{
  "results": [
    { "ruleIndex": 0, "pass": true, "reason": "说明通过或失败的原因" }
  ]
}
ruleIndex 从 0 开始，pass 为 true 表示通过，false 表示未通过。`;

    const base64Image = image.toString('base64');

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          pass: false,
          results: [
            { ruleIndex: 0, pass: false, reason: 'Empty response from AI' },
          ],
        };
      }

      const parsed = JSON.parse(content);
      const results = parsed.results.map(
        (r: { ruleIndex: number; pass: boolean; reason: string }) => ({
          ruleIndex: r.ruleIndex,
          pass: r.pass,
          reason: r.reason,
        })
      );

      return {
        pass: results.every((r: { pass: boolean }) => r.pass),
        results,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        pass: false,
        results: [
          {
            ruleIndex: 0,
            pass: false,
            reason: `AI analysis failed: ${message}`,
          },
        ],
      };
    }
  }
}

class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AnthropicProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'claude-3-5-sonnet-20241022';
  }

  async analyze(image: Buffer, rules: VisualRule[]): Promise<VisualResult> {
    // 骨架实现 — 后续可通过 @anthropic-ai/sdk 完成
    try {
      throw new Error(
        'Anthropic provider not yet implemented. Install @anthropic-ai/sdk to enable.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        pass: false,
        results: [
          {
            ruleIndex: 0,
            pass: false,
            reason: `AI analysis failed: ${message}`,
          },
        ],
      };
    }
  }
}

export function createProvider(
  type: 'openai',
  config: OpenAIProviderConfig
): AIProvider;
export function createProvider(
  type: 'anthropic',
  config: AnthropicProviderConfig
): AIProvider;
export function createProvider(
  type: ProviderType,
  config: ProviderConfig
): AIProvider {
  switch (type) {
    case 'openai':
      if (!isOpenAIConfig(config)) {
        throw new Error('Expected OpenAIProviderConfig for openai provider');
      }
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config as AnthropicProviderConfig);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
