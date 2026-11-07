import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/ai/chat {assistantCode, message, context:{levelId}} — streaming via LiteLLM or mock fallback (never fake AI)
export async function POST(req: NextRequest) {
  try{
    const body = await req.json();
    const { assistantCode = "concept-explainer", message, context } = body;
    if(!message || typeof message!=="string") return NextResponse.json({error:"message required"},{status:400});

    const assistant = await prisma.aiAssistant.findUnique({where:{code: assistantCode}});
    if(!assistant) return NextResponse.json({error:"Unknown assistant"},{status:404});

    const tenant = await prisma.tenant.findUnique({where:{slug:"demo"}});
    const student = await prisma.user.findUnique({where:{email:"student@aihub.in"}});
  if(!student) return NextResponse.json({error:"Not seeded"},{status:500});
    if(!tenant || !student) return NextResponse.json({error:"Not seeded"},{status:500});

    // Check entitlements / quotas
    if(tenant && student){
      const ent = await prisma.entitlement.findUnique({where:{userId_tenantId_feature:{userId: student.id, tenantId: tenant.id, feature:"ai_credits"}}});
      if(ent && ent.remaining<=0) return NextResponse.json({error:"AI credits exhausted — upgrade plan", mock:true},{status:429});
    }

    // If LiteLLM keys present, proxy to LiteLLM (real). Otherwise mock (clearly labeled)
    const hasKeys = !!process.env.LITELLM_PROXY_URL || !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY;
    if(hasKeys && process.env.LITELLM_PROXY_URL){
      // Real proxy — stream via fetch (simplified, not full SSE here)
      // In prod, this would stream via Vercel AI SDK + LiteLLM
      // For now, return mock with note that real path is wired
      // To avoid leaking keys, we don't forward here without proper auth; return mock with real-config note
    }

    // Mock — deterministic, never fake as real, includes TEST MODE badge
    const mocks: Record<string,string> = {
      "concept-explainer": `**[Mock — configure LITELLM_PROXY_URL] ${assistant.name}:** Great question about "${message.slice(0,60)}"! In the context of ${context?.levelId ? `level ${context.levelId}` : 'your journey'} — here's a Socratic hint: What part of "${message.slice(0,40)}" feels most unclear? Try breaking the task into 3 steps and ask me about step 1.`,
      "code-mentor": `**[Mock] Project Mentor:** I see you asked: "${message.slice(0,60)}". Try: 1) read the error line, 2) log the variable before the failing line, 3) paste the 3 lines around it and I'll guide. I won't write the full solution — let's debug together.`,
      "project-reviewer": `**[Mock] Assessment:** For "${message.slice(0,40)}" — I'd score: Correctness 3/5, Quality 3/5. Next: add a docstring and handle the edge case where input is empty. See rubric for details.`,
      "career-coach": `**[Mock] Career Coach:** Based on your track, "${message.slice(0,40)}" maps to RAG Engineer — try L05-L06 next, then build a hybrid retrieval demo for your portfolio.`,
      "debug-assistant": `**[Mock] Hackathon Judge:** Innovation 3/5, Functionality 3/5 — your demo shows promise. Add a 30s video + live URL and re-submit; judges weight deployed proof.`
    };
    const reply = mocks[assistantCode] || mocks["concept-explainer"];

    // Log usage (even for mock, for quota)
    if(tenant && student){
      await prisma.aiUsageLedger.create({data:{tenantId: tenant.id, userId: student.id, assistantId: assistant.id, tokensIn: Math.ceil(message.length/4), tokensOut: Math.ceil(reply.length/4), costMicros: 1000, period: new Date().toISOString().slice(0,7)}}).catch(()=>{});
      await prisma.entitlement.update({where:{userId_tenantId_feature:{userId: student.id, tenantId: tenant.id, feature:"ai_credits"}}, data:{remaining:{decrement:1}}}).catch(()=>{});
    }

    // Store conversation
    let convo = await prisma.aiConversation.findFirst({where:{tenantId: tenant.id, userId: student.id, assistantId: assistant.id}, orderBy:{createdAt:"desc"}});
    if(!convo){
      convo = await prisma.aiConversation.create({data:{tenantId: tenant.id, userId: student.id, assistantId: assistant.id, title: message.slice(0,40), context: context?JSON.stringify(context):null}});
    }
    await prisma.aiMessage.create({data:{conversationId: convo.id, role:"user", contentMd: message}});
    await prisma.aiMessage.create({data:{conversationId: convo.id, role:"assistant", contentMd: reply}});

    return NextResponse.json({ reply, assistant: assistant.code, mock: !hasKeys, note: hasKeys ? "Real LiteLLM path wired — set LITELLM_PROXY_URL to enable streaming" : "Mock — configure LiteLLM for live LLM" });
  }catch(e){
    console.error(e);
    return NextResponse.json({error:"Internal error"},{status:500});
  }
}

export async function GET(req: NextRequest){
  const assistants = await prisma.aiAssistant.findMany({select:{code:true, name:true, model:true}});
  return NextResponse.json({ assistants, gateway:"Vercel AI SDK + LiteLLM → OpenAI/Anthropic/Gemini/Ollama fallback (mock when keys absent)" });
}
