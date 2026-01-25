export interface SummarizationRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  options: {
    parentTitle: string;
    selectedText?: string;
    connectionType?: string;
    messageLength?: number | 'full';
    messageCount?: number;
    customPrompt?: string;
  };
}

export interface SummarizationResponse {
  success: boolean;
  summary?: string;
  error?: string;
}
