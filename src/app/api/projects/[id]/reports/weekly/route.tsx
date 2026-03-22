import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { WeeklyReportDocument } from '@/lib/pdf/WeeklyReport';
import { diaryRepo } from '@/lib/repositories/diary';
import { projectsRepo } from '@/lib/repositories/projects';
import { projectScheduleRepo } from '@/lib/repositories/projectScheduleRepo';

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    const params = await context.params;
    try {
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';

        const project = projectsRepo.findById(params.id);
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        const allDiaries = diaryRepo.findByProjectId(params.id);

        // Filter last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyDiaries = allDiaries.filter(d => {
            const dDate = new Date(d.date);
            return dDate >= sevenDaysAgo || isNaN(dDate.getTime());
        });

        // Fallback if no recent diaries just to show functionality MVP
        const diariesToProcess = weeklyDiaries.length > 0 ? weeklyDiaries : allDiaries.slice(0, 7);

        const schedule = projectScheduleRepo.findByProjectId(params.id);
        let predictedDelayDays = 0;
        let scheduleHealth = "No schedule tracking available.";

        if (schedule.length > 0) {
            const maxPlannedEnd = Math.max(...schedule.map(s => new Date(s.end_date).getTime()));
            for (const diary of allDiaries) {
                const struct = diary.structured_data ? JSON.parse(diary.structured_data) : {};
                if (struct.predicted_completion_date) {
                    const predictedEnd = new Date(struct.predicted_completion_date).getTime();
                    const diffMs = predictedEnd - maxPlannedEnd;
                    if (diffMs > 0) {
                        predictedDelayDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    }
                    scheduleHealth = `Latest AI schedule forecast based on diary from ${diary.date}.`;
                    break;
                }
            }
            if (predictedDelayDays === 0 && scheduleHealth === "No schedule tracking available.") {
                scheduleHealth = "Project is currently on track according to the latest AI forecasts.";
            }
        }

        let compliantCount = 0;
        const criticalIssues: string[] = [];
        const overspendingItems: { process: string; details: string }[] = [];

        diariesToProcess.forEach(d => {
            if (d.compliance_status === 'compliant') {
                compliantCount++;
            }

            if (d.rule_violations) {
                const violations = JSON.parse(d.rule_violations);
                violations.forEach((v: any) => {
                    if (v.severity === 'violation') {
                        criticalIssues.push(`[${d.date}] ${v.rule_id}: ${v.description}`);
                    }
                    if (v.type === 'overspending') {
                        overspendingItems.push({
                            process: v.rule_id,
                            details: `[${d.date}] ${v.description}`
                        });
                    }
                });
            }
        });

        const complianceRate = diariesToProcess.length > 0 ? (compliantCount / diariesToProcess.length) * 100 : 100;

        const data: any = {
            projectName: project.name,
            startDate: diariesToProcess.length > 0 ? diariesToProcess[diariesToProcess.length - 1].date : '-',
            endDate: diariesToProcess.length > 0 ? diariesToProcess[0].date : '-',
            complianceRate,
            criticalIssues,
            overspendingItems,
            scheduleHealth,
            predictedDelayDays,
            lang
        };

        const stream = await renderToStream(<WeeklyReportDocument data={data} />);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }
        const pdfBuffer = Buffer.concat(chunks);

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="WeeklyReport_${project.name}.pdf"`
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate weekly report' }, { status: 500 });
    }
}
