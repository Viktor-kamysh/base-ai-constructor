export function parseCsvLines(csvContent: string): string[] {
    return csvContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}
