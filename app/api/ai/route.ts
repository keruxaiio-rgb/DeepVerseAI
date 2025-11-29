// app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SERMON_SYSTEM_PROMPT } from "@/lib/prompts"; // adjust path if needed
import PptxGenJS from 'pptxgenjs';
import type { Message } from '@/types/api';
import { AccessControl } from '@/lib/subscriptionService';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Get user email from custom header (set by client)
function getUserEmail(req: NextRequest): string | null {
  const userEmail = req.headers.get('x-user-email');
  return userEmail;
}

export async function POST(req: NextRequest) {
  try {
    // Basic rate limiting
    const clientIP = req.headers.get('x-forwarded-for') ||
                    req.headers.get('x-real-ip') ||
                    'unknown';

    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const payload = body; // typed earlier as ApiPayload

    // Check access control for AI features
    const userEmail = getUserEmail(req);
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const accessCheck = await AccessControl.requireAI(userEmail);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.message || "Access denied" },
        { status: 403 }
      );
    }

    // Handle PPTX generation
    if (payload.mode === "pptx") {
      const pptx = new PptxGenJS();
      const messages = payload.messages ?? [];

      // Title slide
      let slide = pptx.addSlide();
      slide.addText("DeepVerse Sermon", { x: 1, y: 0.5, fontSize: 24, bold: true, color: "#4B3CBC" });

      // Add conversation slides
      messages.forEach((msg: Message) => {
        slide = pptx.addSlide();
        slide.addText(msg.role === "user" ? "Question" : "AI Response", { x: 0.5, y: 0.2, fontSize: 18, bold: true });
        slide.addText(msg.text, { x: 0.5, y: 0.8, fontSize: 14, w: 8, h: 4, wrap: true });
      });

      // Generate PPTX buffer
      const buffer = await pptx.write({ outputType: 'nodebuffer' });

      // Return binary response
      return new Response(buffer as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': 'attachment; filename="DeepVerse_Sermon.pptx"'
        }
      });
    }

    // build messages array for model
    // payload.messages should be the full conversation (client must send it)
    const conversation = payload.messages ?? [];

    // create system message depending on mode
    const systemMessage = {
      role: "system",
      content: payload.mode === "sermon" ? SERMON_SYSTEM_PROMPT : `
You are DeepVerse AI, an AI assistant for pastors and Christians.
Answer theological questions with exegetical depth, anchored to text.
Be scholarly and pastoral.

FORMATTING STANDARDS:
- Use plain text only without markdown symbols such as number signs, asterisks, or other markup characters.
- Follow proper sentence structure with clear paragraph separation.
- Write lists, numbered points, and explanations in clean paragraph form with correct spacing.
- Present all text in a justified paragraph style, evenly and formally across every line.
`
    };

    // Compose messages for OpenAI (array of {role, content})
    const modelMessages = [
      systemMessage,
      // include previous assistant & user messages (convert to model format)
      ...conversation.map((m: Message) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text,
      })),
      // finally include the newest user message if provided separately:
      ...(payload.message ? [{ role: "user", content: payload.message }] : []),
    ];

    // now call OpenAI using your preferred method (fetch example)
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      // fallback/mock response for local dev
      return NextResponse.json({ text: "Demo reply — set OPENAI_API_KEY for real responses." });
    }

    // Handle sermon PPTX generation
    if (payload.mode === "sermon") {
      const lastAIMessage = conversation.filter((m: Message) => m.role === "ai").pop();
      if (lastAIMessage && lastAIMessage.text.includes("would you like me to transform it into a PPTX presentation?") && payload.message && payload.message.toLowerCase().includes("yes")) {
        const pptx = new PptxGenJS();
        const messages = payload.messages ?? [];

        // Title slide
        let slide = pptx.addSlide();
        slide.addText("DeepVerse Sermon", { x: 1, y: 0.5, fontSize: 24, bold: true, color: "#4B3CBC" });

        // Add conversation slides
        messages.forEach((msg: Message) => {
          slide = pptx.addSlide();
          slide.addText(msg.role === "user" ? "Question" : "AI Response", { x: 0.5, y: 0.2, fontSize: 18, bold: true });
          slide.addText(msg.text, { x: 0.5, y: 0.8, fontSize: 14, w: 8, h: 4, wrap: true });
        });

        // Generate PPTX buffer
        const buffer = await pptx.write({ outputType: 'nodebuffer' });

        // Return binary response
        return new Response(buffer as BodyInit, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': 'attachment; filename="DeepVerse_Sermon.pptx"'
          }
        });
      }
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: modelMessages,
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI API error:", openaiRes.status, errorText);

      let errorMessage = "AI service temporarily unavailable. Please try again later.";

      try {
        const errorData = JSON.parse(errorText);
        const errorType = errorData.error?.type;
        const errorCode = errorData.error?.code;

        switch (errorCode) {
          case 'insufficient_quota':
            errorMessage = "Your OpenAI account has exceeded its usage quota. Please check your OpenAI billing settings or upgrade your plan.";
            break;
          case 'invalid_api_key':
            errorMessage = "Invalid API key. Please check your OpenAI API key configuration.";
            break;
          case 'rate_limit_exceeded':
            errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
            break;
          case 'model_not_found':
            errorMessage = "The requested AI model is not available. Please contact support.";
            break;
          default:
            if (errorType === 'billing_hard_limit_reached') {
              errorMessage = "Your OpenAI account has reached its billing limit. Please update your payment method.";
            } else if (errorType === 'billing_soft_limit_reached') {
              errorMessage = "Your OpenAI account is approaching its billing limit. Please monitor your usage.";
            }
        }
      } catch (parseError) {
        // If we can't parse the error JSON, use the generic message
        console.error("Failed to parse OpenAI error response:", parseError);
      }

      return NextResponse.json({ text: errorMessage }, { status: 500 });
    }

    const openaiJson = await openaiRes.json();
    console.log("OpenAI response:", openaiJson);
    let reply = openaiJson.choices?.[0]?.message?.content ?? "No reply.";
    if (reply === "No reply.") {
      console.error("No content in OpenAI response");
    }

    // Parse suggested next for sermon
    let suggestedPrompt: string | undefined;
    if (payload.mode === "sermon") {
      const lines = reply.split('\n');
      const lastLine = lines[lines.length - 1]?.trim();
      if (lastLine && lastLine.startsWith('Suggested next:')) {
        suggestedPrompt = lastLine.replace('Suggested next:', '').trim();
        reply = lines.slice(0, -1).join('\n').trim();
      }
    }

    return NextResponse.json({ text: reply, ...(suggestedPrompt && { suggestedPrompt }) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ text: "Server error" }, { status: 500 });
  }
}
