import type { SummarizationRequest, SummarizationResponse } from './worker-types';

self.addEventListener('message', async (e: MessageEvent<SummarizationRequest>) => {
  const { messages, options } = e.data;
  
  try {
    // Perform heavy text processing
    // This is just the computational part - API calls still happen on main thread
    const messageCount = options.messageCount || 10;
    const processedMessages = messages.slice(-messageCount);
    
    // Build summary structure
    const summary = buildSummaryStructure(processedMessages, options);
    
    const response: SummarizationResponse = {
      success: true,
      summary,
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: SummarizationResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});

function buildSummaryStructure(
  messages: Array<{ role: string; content: string }>,
  options: SummarizationRequest['options']
): string {
  // Heavy computation: process and structure messages
  // This runs off main thread, preventing UI freeze
  
  let summary = `# Context from: ${options.parentTitle}\n\n`;
  
  if (options.selectedText) {
    summary += `## Selected Text\n${options.selectedText}\n\n`;
  }
  
  summary += `## Recent Conversation\n`;
  messages.forEach((msg, i) => {
    const truncated = options.messageLength !== 'full' 
      ? msg.content.slice(0, options.messageLength as number)
      : msg.content;
    summary += `**${msg.role}:** ${truncated}\n\n`;
  });
  
  return summary;
}
