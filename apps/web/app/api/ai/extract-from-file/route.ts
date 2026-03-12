import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Keine Datei übergeben' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf';

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  if (!isImage && !isPdf) {
    return NextResponse.json({ error: 'Nur Bilder und PDFs werden unterstützt' }, { status: 400 });
  }

  const prompt = `Analysiere dieses Dokument/Bild und extrahiere daraus eine oder mehrere Aufgaben.

Antworte NUR mit JSON (kein Markdown, keine Erklärungen):
{
  "title": "Kurze prägnante Aufgabenüberschrift (max. 60 Zeichen)",
  "description": "- Punkt 1\\n- Punkt 2\\n- Punkt 3",
  "company_hint": "Firmenname falls erkennbar, sonst null"
}

Regeln:
- Extrahiere die wichtigste Aktion/Aufgabe als title
- Formatiere alle Details, Unterpunkte, To-Dos als "- " Aufzählungspunkte
- Wenn mehrere Aufgaben erkennbar, fasse sie sinnvoll zusammen
- Antworte auf Deutsch`;

  try {
    const contentBlocks: Anthropic.MessageParam['content'] = isImage
      ? [
          { type: 'image', source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 } },
          { type: 'text', text: prompt },
        ]
      : [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: prompt },
        ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      title: parsed.title || '',
      description: parsed.description || '',
      company_hint: parsed.company_hint || null,
    });
  } catch (e) {
    console.error('extract-from-file error:', e);
    return NextResponse.json({ title: '', description: '', company_hint: null });
  }
}
