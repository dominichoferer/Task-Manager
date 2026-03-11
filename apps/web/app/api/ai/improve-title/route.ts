import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ title });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Formuliere diesen Aufgabentitel präzise, professionell und handlungsorientiert um. Maximal 60 Zeichen. Antworte NUR mit dem neuen Titel, ohne Anführungszeichen oder Erklärungen.

Titel: "${title}"`,
      }],
    });

    const improved = response.content[0].type === 'text'
      ? response.content[0].text.trim().replace(/^["']|["']$/g, '')
      : title;

    return NextResponse.json({ title: improved });
  } catch {
    return NextResponse.json({ title });
  }
}
