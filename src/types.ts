/** 一条视觉检查规则 */
export interface VisualRule {
  /** 自然语言描述的检查项，如"折扣标签不遮挡产品图片" */
  description: string;
}

/** 单条规则的检查结果 */
export interface RuleResult {
  ruleIndex: number;
  pass: boolean;
  reason: string;
}

/** 一次视觉分析的整体结果 */
export interface VisualResult {
  pass: boolean;
  results: RuleResult[];
}

/** AI Provider 接口 — 可插拔设计的关键 */
export interface AIProvider {
  /** 分析截图是否满足规则，返回结构化结果 */
  analyze(image: Buffer, rules: VisualRule[]): Promise<VisualResult>;
}

/** 可访问性检查结果 */
export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
}

export interface A11yResult {
  violations: A11yViolation[];
  passes: number;
}

/** 截图选项 */
export interface ScreenshotOptions {
  fullPage?: boolean;
  selector?: string;
  timeout?: number;
}
