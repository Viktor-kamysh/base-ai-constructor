export interface Rule {
    id: string;
    triggerWords: string[];
    expectedItems: string[];
    note: string;
}

export const RULES_LIBRARY: Rule[] = [
    {
        id: 'terrace_waterproofing_bundle',
        triggerWords: ['terrace', 'roof_terrace', 'balcony'],
        expectedItems: ['waterproofing', 'slope_layer_or_fall', 'drainage_solution', 'edge_details', 'penetration_sealing'],
        note: 'Presence of terrace-like scope should trigger review for waterproofing bundle completeness.'
    },
    {
        id: 'facade_insulation_bundle',
        triggerWords: ['facade_insulation', 'etics', 'exterior_insulation'],
        expectedItems: ['insulation_boards', 'adhesive_or_fixing', 'anchors_if_required', 'reinforcement_mesh', 'basecoat', 'finish_render', 'trims_and_profiles'],
        note: 'Facade insulation is often incomplete when trims, anchors, or mesh are omitted.'
    },
    {
        id: 'demolition_bundle',
        triggerWords: ['demolition', 'removal', 'dismantling'],
        expectedItems: ['debris_handling', 'transport', 'disposal', 'protection_measures', 'final_cleaning'],
        note: 'Demolition packages often miss logistics and disposal.'
    },
    {
        id: 'window_installation_bundle',
        triggerWords: ['windows', 'external_doors', 'glazing'],
        expectedItems: ['installation', 'sealing', 'flashing_or_finish_edges', 'adjustment', 'accessory_materials'],
        note: 'Openings often appear in estimate without complete installation accessories or sealing details.'
    },
    {
        id: 'tile_finish_bundle',
        triggerWords: ['tile_finish', 'ceramic_tile', 'bathroom_tile'],
        expectedItems: ['substrate_preparation', 'waterproofing_if_wet_area', 'adhesive', 'grout', 'silicone_or_edge_finish'],
        note: 'Tile systems are often quoted partially.'
    }
];

export interface RuleViolation {
    ruleId: string;
    triggeredBy: string;
    missingItems: string[];
    note: string;
}

export class RuleEngine {
    /**
     * Evaluates the text items of an estimate against the rules library.
     * Returns a list of potential violations (missing expected items).
     */
    static evaluate(estimateItems: string[]): RuleViolation[] {
        const violations: RuleViolation[] = [];
        const textCorpus = estimateItems.join(' ').toLowerCase();

        for (const rule of RULES_LIBRARY) {
            // Check if any trigger word exists
            const triggeredBy = rule.triggerWords.find(word => textCorpus.includes(word.toLowerCase()));

            if (triggeredBy) {
                // If triggered, check if expected items are missing
                const missingItems = rule.expectedItems.filter(
                    item => !textCorpus.includes(item.toLowerCase().replace(/_/g, ' '))
                );

                if (missingItems.length > 0) {
                    violations.push({
                        ruleId: rule.id,
                        triggeredBy,
                        missingItems,
                        note: rule.note
                    });
                }
            }
        }

        return violations;
    }
}
