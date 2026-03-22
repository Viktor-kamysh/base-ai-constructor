import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
    header: { fontSize: 24, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
    meta: { fontSize: 12, marginBottom: 20, textAlign: 'center', color: '#555' },
    sectionTitle: { fontSize: 16, marginTop: 25, marginBottom: 10, borderBottom: '1pt solid #ccc', paddingBottom: 5 },
    text: { fontSize: 12, marginBottom: 5 },
    alertText: { fontSize: 12, marginBottom: 5, color: '#d32f2f' },
    bold: { fontWeight: 'bold' },
    table: { display: 'flex', flexDirection: 'column', marginTop: 10 },
    tableRow: { flexDirection: 'row', borderBottom: '1pt solid #eee', paddingVertical: 5 },
    tableColHeader: { flex: 1, fontSize: 12, paddingRight: 5 },
    tableCol: { flex: 1, fontSize: 11, paddingRight: 5 }
});

const labels: Record<string, any> = {
    en: {
        title: "Construction Tech Supervision",
        weekly: "Weekly Report:",
        compliance: "Weekly Compliance Status",
        compliant: "Compliant",
        basedOn: "Based on automated tech supervision rules applied to daily diaries.",
        critical: "🔴 Critical Issues Found",
        noCritical: "No critical issues detected this week. Great job!",
        warnings: "⚠️ Materials & Overspending Warning",
        noWarnings: "No significant overspending reported.",
        process: "Process / Area",
        details: "Violation Details",
        scheduleHealth: "🗓️ Schedule Health",
        delayDays: "Predicted Delay:",
        onTrack: "✅ Project is on track.",
        generated: "Generated automatically by Construction Pro Agent"
    },
    cs: {
        title: "Technický Dozor Stavby",
        weekly: "Týdenní Zpráva:",
        compliance: "Stav Dodržování Předpisů",
        compliant: "V Pořádku",
        basedOn: "Na základě automatizovaných pravidel technického dozoru aplikovaných na deníky.",
        critical: "🔴 Nalezeny Kritické Problémy",
        noCritical: "Tento týden nebyly zjištěny žádné kritické problémy.",
        warnings: "⚠️ Varování: Materiály a Překročení Rozpočtu",
        noWarnings: "Nebylo zaznamenáno žádné významné překročení rozpočtu.",
        process: "Proces / Oblast",
        details: "Detaily Porušení",
        scheduleHealth: "🗓️ Stav Plnění Harmonogramu",
        delayDays: "Odhadované Zpoždění:",
        onTrack: "✅ Projekt je podle plánu.",
        generated: "Vygenerováno pomocí Construction Pro Agent"
    },
    ru: {
        title: "Технический Надзор",
        weekly: "Еженедельный Отчет:",
        compliance: "Статус Соответствия",
        compliant: "В норме",
        basedOn: "На основе автоматизированных алгоритмов контроля.",
        critical: "🔴 Критические Нарушения",
        noCritical: "Критических нарушений на этой неделе не выявлено. Отличная работа!",
        warnings: "⚠️ Предупреждения: Перерасход",
        noWarnings: "Значительных перерасходов не зафиксировано.",
        process: "Процесс",
        details: "Детали Нарушения",
        scheduleHealth: "🗓️ Статус Расписания",
        delayDays: "Прогноз задержки:",
        onTrack: "✅ Проект идет по графику.",
        generated: "Сгенерировано автоматически системой Construction Pro Agent"
    }
};

export interface WeeklyReportData {
    projectName: string;
    startDate: string;
    endDate: string;
    complianceRate: number;
    criticalIssues: string[];
    overspendingItems: { process: string; details: string }[];
    scheduleHealth: string;
    predictedDelayDays: number;
    lang?: string;
}

export const WeeklyReportDocument = ({ data }: { data: WeeklyReportData }) => {
    const l = labels[data.lang || 'en'] || labels['en'];
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>{l.title}</Text>
                <Text style={styles.meta}>{l.weekly} {data.projectName}</Text>
                <Text style={styles.meta}>{data.startDate} - {data.endDate}</Text>

                <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f8f9fa' }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{l.compliance}</Text>
                    <Text style={{ fontSize: 24, marginTop: 10, color: data.complianceRate > 80 ? '#2e7d32' : '#d32f2f' }}>
                        {data.complianceRate.toFixed(1)}% {l.compliant}
                    </Text>
                    <Text style={styles.text}>{l.basedOn}</Text>
                </View>

                <Text style={styles.sectionTitle}>{l.critical}</Text>
                {data.criticalIssues.length > 0 ? (
                    data.criticalIssues.map((issue, idx) => (
                        <Text key={idx} style={styles.alertText}>• {issue}</Text>
                    ))
                ) : (
                    <Text style={styles.text}>{l.noCritical}</Text>
                )}

                <Text style={styles.sectionTitle}>{l.scheduleHealth}</Text>
                <View style={{ ...styles.table, backgroundColor: data.predictedDelayDays > 0 ? '#ffebee' : '#e8f5e9', padding: 10 }}>
                    <Text style={styles.text}>{data.scheduleHealth}</Text>
                    {data.predictedDelayDays > 0 ? (
                        <Text style={{ ...styles.alertText, fontWeight: 'bold', marginTop: 5 }}>{l.delayDays} +{data.predictedDelayDays} days</Text>
                    ) : (
                        <Text style={{ color: '#2e7d32', fontWeight: 'bold', marginTop: 5 }}>{l.onTrack}</Text>
                    )}
                </View>

                <Text style={styles.sectionTitle}>{l.warnings}</Text>
                {data.overspendingItems.length > 0 ? (
                    <View style={styles.table}>
                        <View style={[styles.tableRow, { backgroundColor: '#f1f1f1' }]}>
                            <Text style={styles.tableColHeader}>{l.process}</Text>
                            <Text style={styles.tableColHeader}>{l.details}</Text>
                        </View>
                        {data.overspendingItems.map((item, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={styles.tableCol}>{item.process}</Text>
                                <Text style={styles.tableCol}>{item.details}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.text}>{l.noWarnings}</Text>
                )}

                <Text style={{ position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 10, color: '#999' }}>
                    {l.generated}
                </Text>
            </Page>
        </Document>
    )
};
