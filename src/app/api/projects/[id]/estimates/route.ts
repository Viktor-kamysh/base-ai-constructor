import { NextResponse } from 'next/server';
import { estimatesRepo } from '@/lib/repositories/estimates';
import { processEstimateReview } from '@/lib/agent/estimateReviewPipeline';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const reviews = estimatesRepo.findByProjectId(params.id);
        return NextResponse.json({ reviews });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const body = await request.json();
        const { sourceFileId, parsedLines } = body;

        if (!sourceFileId || !parsedLines || !Array.isArray(parsedLines)) {
            return NextResponse.json({ error: 'Missing sourceFileId or valid parsedLines array' }, { status: 400 });
        }

        const reviewStr = await processEstimateReview(params.id, sourceFileId, parsedLines);

        return NextResponse.json({ review: reviewStr });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Pipeline failed' }, { status: 500 });
    }
}
