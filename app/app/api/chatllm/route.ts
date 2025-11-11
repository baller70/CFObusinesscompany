
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messages, model = "gpt-4o", stream = true } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Forward to Abacus ChatLLM (RouteLLM API)
    const abacusApiKey = process.env.ABACUSAI_API_KEY;
    if (!abacusApiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${abacusApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("ChatLLM API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from ChatLLM" },
        { status: response.status }
      );
    }

    if (stream) {
      // Stream the response back to the client
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Return the full response
      const data = await response.json();
      return NextResponse.json(data);
    }

  } catch (error) {
    console.error("ChatLLM proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
