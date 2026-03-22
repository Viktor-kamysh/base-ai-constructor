import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface TechSupervisionRule {
    process_keyword: string;
    required_fields: string[];
    max_overspend_pct?: number;
    note: string;
}

export const rulesRepo = {
    getTechRules: (): TechSupervisionRule[] => {
        try {
            const filePath = path.join(process.cwd(), '08_tech_rules.yaml');
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const data = yaml.load(fileContents) as { tech_supervision_rules: TechSupervisionRule[] };
            return data.tech_supervision_rules || [];
        } catch (e) {
            console.error("Failed to load tech rules:", e);
            return [];
        }
    }
};
