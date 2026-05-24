import OpenAI from 'openai';
function isOpenAIConfig(config) {
    return 'apiKey' in config;
}
class OpenAIProvider {
    client;
    model;
    constructor(config) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });
        this.model = config.model ?? 'gpt-4o';
    }
    async analyze(image, rules) {
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
            const results = parsed.results.map((r) => ({
                ruleIndex: r.ruleIndex,
                pass: r.pass,
                reason: r.reason,
            }));
            return {
                pass: results.every((r) => r.pass),
                results,
            };
        }
        catch (error) {
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
class AnthropicProvider {
    apiKey;
    model;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model ?? 'claude-3-5-sonnet-20241022';
    }
    async analyze(image, rules) {
        // 骨架实现 — 后续可通过 @anthropic-ai/sdk 完成
        try {
            throw new Error('Anthropic provider not yet implemented. Install @anthropic-ai/sdk to enable.');
        }
        catch (error) {
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
export function createProvider(type, config) {
    switch (type) {
        case 'openai':
            if (!isOpenAIConfig(config)) {
                throw new Error('Expected OpenAIProviderConfig for openai provider');
            }
            return new OpenAIProvider(config);
        case 'anthropic':
            return new AnthropicProvider(config);
        default:
            throw new Error(`Unknown provider type: ${type}`);
    }
}
