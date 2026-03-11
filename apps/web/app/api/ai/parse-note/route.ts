import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ title: '', description: '' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Wandle diese Schnellnotiz in eine strukturierte Aufgabe um.

Notiz: "${content}"

Antworte NUR mit JSON (kein Markdown, keine Erklärungen):
{
  "title": "Kurze Aufgabenüberschrift (max. 60 Zeichen)",
  "description": "- Punkt 1\\n- Punkt 2"
}

Regeln:
- Extrahiere die wichtigste Aktion als title
- Formatiere Details als Aufzählungspunkte mit "- " Präfix
- Wenn die Notiz sehr kurz oder nur ein Satz ist, lass description leer ("")
- Antworte auf Deutsch wenn die Notiz auf Deutsch ist`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
    const parsed = JSON.parse(text);
    return NextResponse.json({
      title: parsed.title || content.slice(0, 60),
      description: parsed.description || '',
    });
  } catch {
    return NextResponse.json({ title: content.slice(0, 60), description: '' });
  }
}
