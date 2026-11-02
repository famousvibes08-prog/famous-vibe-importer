import { createOpenAI } from "@ai-sdk/openai";

export const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
    getRunId: () => runId,
  };
}

export function createLovableResponsesProvider(config: { apiKey: string; model: string }) {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: LOVABLE_GATEWAY_URL,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { model: provider.responses(config.model), runIdFetch };
}
