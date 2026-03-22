import { z } from 'zod';

export const EstimateFindingSchema = z.object({
    section: z.string(),
    item_name: z.string(),
    status: z.enum(['found', 'missing', 'unclear', 'duplicate', 'needs_review', 'insufficient_data']),
    confidence: z.enum(['high', 'medium', 'low']),
    basis: z.string(),
    comment: z.string().optional(),
    recommended_action: z.string().optional()
});

export const EstimateReviewReportSchema = z.object({
    findings: z.array(EstimateFindingSchema),
    missing_data: z.array(z.string()).optional(),
    needs_confirmation: z.boolean()
});

export const MissingDataReportSchema = z.object({
    available_data: z.array(z.string()),
    missing_data: z.array(z.string()),
    why_needed: z.array(z.string()),
    suggested_source: z.array(z.string()).optional()
});

export const SiteDiarySectionSchema = z.object({
    title: z.string(),
    content: z.string()
});

export const SiteDiarySchema = z.object({
    project_name: z.string(),
    date: z.string(),
    author: z.string().optional(),
    summary: z.string(),
    weather: z.string().optional(),
    participants: z.array(z.string()).optional(),
    sections: z.array(SiteDiarySectionSchema),
    open_issues: z.array(z.object({
        description: z.string(),
        status: z.enum(['open', 'in_progress', 'resolved'])
    })).optional(),
    follow_up_actions: z.array(z.string()).optional(),
    financial_impacts: z.array(z.object({
        item_name: z.string(),
        consumed_pct: z.number(),
        remaining_pct: z.number(),
        is_overrun: z.boolean()
    })).optional(),
    quantities_reported: z.array(z.object({
        item_name: z.string(),
        quantity: z.number(),
        unit: z.string()
    })).optional(),
    predicted_completion_date: z.string().optional(),
    photo_captions: z.array(z.string()).optional(),
    draft_status: z.literal('draft_for_review'),
    confidence: z.enum(['high', 'medium', 'low']).default('medium')
});
