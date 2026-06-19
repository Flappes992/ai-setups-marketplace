import { buildExportPrompt, EXPORT_MODE_LABEL, type ExportMode } from '@/lib/exportPrompts';
import { categoryToMode } from '@/lib/scanImport';

const MODES: ExportMode[] = ['standard', 'skill', 'brainpack', 'claudepack'];

describe('buildExportPrompt', () => {
  it('produces a prompt for every upload mode with a paste placeholder', () => {
    for (const mode of MODES) {
      const p = buildExportPrompt(mode);
      expect(p).toContain('Setiq-Export');
      expect(p).toContain('"securityReport"');
      expect(p).toContain('"assets"');
      expect(p).toContain('füge hier dein Artefakt ein');
      expect(p).toContain(mode.toUpperCase());
    }
  });

  it('pins the category so the import maps back to the same mode', () => {
    // skill → skill, brainpack → brainpack, claudepack → claudepack
    expect(buildExportPrompt('skill')).toContain('"category": "skill"');
    expect(categoryToMode('skill')).toBe('skill');

    expect(buildExportPrompt('brainpack')).toContain('"category": "brainpack"');
    expect(categoryToMode('brainpack')).toBe('brainpack');

    expect(buildExportPrompt('claudepack')).toContain('"category": "claudepack"');
    expect(categoryToMode('claudepack')).toBe('claudepack');

    // standard → prompt_stack maps to the standard upload mode
    expect(buildExportPrompt('standard')).toContain('"category": "prompt_stack"');
    expect(categoryToMode('prompt_stack')).toBe('standard');
  });

  it('always carries the security/redaction instruction', () => {
    for (const mode of MODES) {
      expect(buildExportPrompt(mode)).toContain('ENTSCHÄRFUNG');
    }
  });

  it('has a label for every mode', () => {
    for (const mode of MODES) {
      expect(EXPORT_MODE_LABEL[mode]).toBeTruthy();
    }
  });
});
