import test from 'node:test';
import assert from 'node:assert';
import { RuleEngine } from '../lib/agent/ruleEngine';
import { SiteDiarySchema } from '../lib/agent/schemas';
import { projectsRepo } from '../lib/repositories/projects';
import { GET as getProjects } from '../app/api/projects/route';
import { parseCsvLines } from '../lib/agent/csvParser';

test('1. Rule Engine Behavior', () => {
    const violations = RuleEngine.evaluate(['We need a terrace here', 'Nothing else']);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0].ruleId, 'terrace_waterproofing_bundle');
    assert.ok(violations[0].missingItems.includes('waterproofing'));
});

test('2. Schema Validation', () => {
    const validData = {
        project_name: 'Test',
        date: '2026-03-20',
        summary: 'A summary',
        sections: [{ title: 'Work', content: 'Did some work' }],
        draft_status: 'draft_for_review',
        confidence: 'high'
    };

    const parsed = SiteDiarySchema.parse(validData);
    assert.strictEqual(parsed.project_name, 'Test');

    const invalidData = {
        project_name: 'Test'
    };

    let didThrow = false;
    try {
        SiteDiarySchema.parse(invalidData);
    } catch (e) {
        didThrow = true;
    }
    assert.ok(didThrow, 'Schema should throw on invalid data');
});

test('3. Database Persistence', () => {
    const project = projectsRepo.create('Test Project', '123 Test St');
    assert.ok(project.id);
    assert.strictEqual(project.name, 'Test Project');

    const retrieved = projectsRepo.findById(project.id);
    assert.deepStrictEqual(retrieved?.id, project.id);
});

test('4. Estimate Parsing Logic', () => {
    const csv = ['header1,header2', 'val1,val2', 'val3,val4'].join(String.fromCharCode(10));
    const lines = parseCsvLines(csv);
    assert.strictEqual(lines.length, 3);
    assert.strictEqual(lines[1], 'val1,val2');
});

test('5. API Routes', async () => {
    const initialProjectCount = projectsRepo.findAll().length;
    projectsRepo.create('API Test Project');

    const response = await getProjects() as any;
    const json = await response.json();

    assert.ok(json.projects);
    assert.strictEqual(json.projects.length, initialProjectCount + 1);
});
