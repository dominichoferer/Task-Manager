import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { notes, taskTitle } = await req.json();
    if (!notes) return NextResponse.json({ expanded: notes });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Du bist ein professioneller Assistent. Formuliere diese Stichpunkte für den Task "${taskTitle}" zu einem klar strukturierten, professionellen Text aus.

Stichpunkte:
${notes}

Regeln:
- Schreibe in der Sprache der Stichpunkte (Deutsch oder Englisch)
- Halte es präzise und professionell
- Maximal 3-4 Sätze
- Kein einleitendes Wort wie "Hier ist..." o.ä.
- Gib NUR den ausformulierten Text zurück`,
        },
      ],
    });

    const expanded = message.content[0].type === 'text' ? message.content[0].text : notes;
    return NextResponse.json({ expanded });
  } catch (error) {
    console.error('AI expand notes error:', error);
    return NextResponse.json({ expanded: '' }, { status: 500 });
  }
}
