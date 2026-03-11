import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function expandNotes(notes: string, taskTitle: string): Promise<string> {
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

  return message.content[0].type === 'text' ? message.content[0].text : notes;
}
