
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
    const { messages, model = "RouteLLM", stream = true } = body;

    console.log(`[ChatLLM] Processing request with model: ${model}, stream: ${stream}, messages: ${messages?.length || 0}`);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Forward to Abacus ChatLLM (RouteLLM API)
    const abacusApiKey = process.env.ABACUSAI_API_KEY;
    if (!abacusApiKey) {
      console.error("[ChatLLM] API key not configured");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    console.log(`[ChatLLM] Sending request to Abacus API with ${messages.length} messages`);

    // If RouteLLM is selected, omit the model parameter to let Abacus route automatically
    const requestBody: any = {
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 16000,
    };

    // Only add model if it's not RouteLLM
    if (model && model !== "RouteLLM") {
      requestBody.model = model;
    }

    const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${abacusApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[ChatLLM] API error (${response.status}):`, errorData);
      
      let errorMessage = "Failed to get response from ChatLLM";
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch {
        // Use default error message if parsing fails
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    console.log(`[ChatLLM] Successfully received response from API`);

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
    console.error("[ChatLLM] Proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
