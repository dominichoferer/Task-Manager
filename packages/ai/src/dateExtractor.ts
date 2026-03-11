import Anthropic from '@anthropic-ai/sdk';
import { format, addDays } from 'date-fns';

export interface ExtractedTaskData {
  title: string;
  due_date: string | null; // ISO string
}

const client = new Anthropic();

export async function extractTaskFromText(input: string): Promise<ExtractedTaskData> {
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

Text: "${input}"

Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Text davor/danach):
{
  "title": "bereinigter Task-Titel ohne Datumsangaben",
  "due_date": "YYYY-MM-DD oder null wenn kein Datum erkannt"
}

Erkenne Ausdrücke wie: heute, morgen, übermorgen, nächste Woche, nächsten Montag, in X Tagen, bis [Datum], am [Datum].`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const parsed = JSON.parse(text.trim());
    return {
      title: parsed.title ?? input,
      due_date: parsed.due_date ?? null,
    };
  } catch {
    return { title: input, due_date: null };
  }
}
