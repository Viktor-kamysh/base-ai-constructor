import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ChangeOrderDocument } from '@/lib/pdf/ChangeOrder';
import { diaryRepo } from '@/lib/repositories/diary';
import { projectsRepo } from '@/lib/repositories/projects';
import { aiProvider } from '@/lib/ai/openai';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string, diaryId: string }> }) {
    const params = await context.params;
    try {
        const { itemName, quantity, unit } = await request.json();

        const project = projectsRepo.findById(params.id);
        const diary = diaryRepo.findById(params.diaryId);

        if (!project || !diary) {
            return NextResponse.json({ error: 'Project or Diary not found' }, { status: 404 });
        }

        // Draft reason using LLM based strictly on the raw text context of the diary:
        const draftPrompt = `
Based on the following construction site diary notes, explain technically WHY the unbudgeted "${itemName}" was necessary. Be professional, objective, and construct a logical explanation (Změnový list reason). Write the explanation strictly in Czech.

Site Diary Context: ${diary.raw_text}
Unbudgeted Item Name: ${itemName}
        `;

        const autoreasoning = await aiProvider.generateText(
            "You are an expert construction engineer drafting mechanical Change Orders.",
            draftPrompt
        );

        // Mock unit price (if available from other lines we'd average it, but MVP assumes a standard override or $1000 base)
        const unit_price = 1500;
        const total_impact = (Number(quantity) || 1) * unit_price;

        const data = {
            projectName: project.name,
            item_name: itemName,
            draft_reasoning: autoreasoning,
            estimated_quantity: Number(quantity) || 1,
            unit: unit || 'ks',
            unit_price: unit_price,
            total_impact: total_impact
        };

        const stream = await renderToStream(<ChangeOrderDocument data={data} />);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        const pdfBuffer = Buffer.concat(chunks);

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="ChangeOrder_${itemName.replace(/\s+/g, '_')}.pdf"`
            }
        });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
