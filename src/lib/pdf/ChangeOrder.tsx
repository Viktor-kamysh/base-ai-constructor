import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
    header: { fontSize: 24, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
    meta: { fontSize: 12, marginBottom: 5, color: '#555' },
    sectionTitle: { fontSize: 16, marginTop: 20, marginBottom: 10, borderBottom: '1pt solid #ccc', paddingBottom: 5 },
    text: { fontSize: 12, marginBottom: 10, lineHeight: 1.5 },
    bold: { fontWeight: 'bold' },
    table: { display: 'flex', flexDirection: 'column', marginTop: 15 },
    tableRow: { flexDirection: 'row', borderBottom: '1pt solid #eee', paddingVertical: 8 },
    tableColHeader: { flex: 1, fontSize: 12, fontWeight: 'bold' },
    tableCol: { flex: 1, fontSize: 12 },
    signatures: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
    signBox: { width: '40%', borderTop: '1pt solid #000', paddingTop: 10, textAlign: 'center', fontSize: 12 }
});

export interface ChangeOrderData {
    projectName: string;
    item_name: string;
    draft_reasoning: string;
    estimated_quantity: number;
    unit: string;
    unit_price: number;
    total_impact: number;
}

export const ChangeOrderDocument = ({ data }: { data: ChangeOrderData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Změnový list / Change Order</Text>
            <Text style={styles.meta}><Text style={styles.bold}>Projekt:</Text> {data.projectName}</Text>
            <Text style={styles.meta}><Text style={styles.bold}>Datum vydání:</Text> {new Date().toLocaleDateString()}</Text>

            <Text style={styles.sectionTitle}>1. Odborný popis změny / Description of Change</Text>
            <Text style={styles.text}>{data.draft_reasoning}</Text>

            <Text style={styles.sectionTitle}>2. Kalkulace nákladů / Cost Calculation</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: '#f1f1f1' }]}>
                    <Text style={styles.tableColHeader}>Položka / Item</Text>
                    <Text style={styles.tableColHeader}>Množství / Qty</Text>
                    <Text style={styles.tableColHeader}>Jednotková cena / Unit Rate</Text>
                    <Text style={styles.tableColHeader}>Celkem / Total</Text>
                </View>
                <View style={styles.tableRow}>
                    <Text style={styles.tableCol}>{data.item_name}</Text>
                    <Text style={styles.tableCol}>{data.estimated_quantity} {data.unit}</Text>
                    <Text style={styles.tableCol}>{data.unit_price.toFixed(2)} CZK</Text>
                    <Text style={styles.tableCol}>{data.total_impact.toFixed(2)} CZK</Text>
                </View>
            </View>

            <View style={{ marginTop: 20, padding: 10, backgroundColor: '#fff3e0', border: '1pt solid #ffb74d' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Upozornění / Notice:</Text>
                <Text style={{ fontSize: 10, marginTop: 5 }}>Tato práce nebyla zahrnuta v původním rozpočtu a je nutné ji neprodleně schválit. / This work was unbudgeted and requires immediate approval.</Text>
            </View>

            <View style={styles.signatures}>
                <View style={styles.signBox}>
                    <Text>Zástupce zhotovitele / Contractor</Text>
                    <Text style={{ fontSize: 10, color: '#777', marginTop: 5 }}>(Podpis a datum)</Text>
                </View>
                <View style={styles.signBox}>
                    <Text>Technický dozor stavby / Supervisor</Text>
                    <Text style={{ fontSize: 10, color: '#777', marginTop: 5 }}>(Podpis a datum)</Text>
                </View>
            </View>

        </Page>
    </Document>
);
