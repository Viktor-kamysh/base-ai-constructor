import { NextResponse } from 'next/server';
import { projectEstimatesRepo } from '@/lib/repositories/projectEstimatesRepo';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const data = await request.json();

        // MVP: Assume data is directly an array of BOQ item objects
        if (Array.isArray(data)) {
            data.forEach(item => {
                projectEstimatesRepo.create({
                    project_id: params.id,
                    item_name: item.item_name,
                    unit: item.unit,
                    planned_quantity: Number(item.planned_quantity),
                    unit_price: Number(item.unit_price),
                    total_budget: Number(item.planned_quantity) * Number(item.unit_price)
                });
            });
            return NextResponse.json({ success: true, imported: data.length });
        }

        return NextResponse.json({ error: 'Invalid format. Expected JSON array of objects.' }, { status: 400 });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
