import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get provider and API key from headers
    const apiKey = req.headers.get('x-api-key');
    const provider = req.headers.get('x-provider') || 'anthropic';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    // Create the appropriate model based on provider
    let model;
    if (provider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey });
      model = anthropic('claude-sonnet-4-20250514');
    } else if (provider === 'openai') {
      const openai = createOpenAI({ apiKey });
      model = openai('gpt-4o');
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
      system: `You are a helpful AI assistant for DealSmart AI, a communications platform for automotive dealerships.

Be helpful, professional, and concise in your responses. If asked about specific vehicle prices, inventory, or financing terms, clarify that you cannot provide that information and suggest checking with the dealership directly.`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);

    const message =
      error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
