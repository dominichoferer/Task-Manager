import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { format, addDays } from 'date-fns';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ title: text, due_date: null });

    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Du bist ein Assistent für einen Task Manager. Extrahiere den Task-Titel und das Fälligkeitsdatum aus diesem Text.

Heute ist: ${today}
Morgen ist: ${tomorrow}

Text: "${text}"

Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Text davor/danach):
{"title":"bereinigter Task-Titel ohne Datumsangaben","due_date":"YYYY-MM-DD oder null wenn kein Datum erkannt"}

Erkenne: heute, morgen, übermorgen, nächste Woche, nächsten Montag/Dienstag/etc., in X Tagen, bis [Datum], am [Datum].`,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const parsed = JSON.parse(responseText.trim());

    return NextResponse.json({
      title: parsed.title ?? text,
      due_date: parsed.due_date ?? null,
    });
  } catch (error) {
    console.error('AI date extraction error:', error);
    return NextResponse.json({ title: '', due_date: null }, { status: 500 });
  }
}
