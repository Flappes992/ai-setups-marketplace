import { buildInstallPrompt } from '@/lib/installPrompt';
import type { Setup } from '@/types/setup';

const base: Setup = {
  id: 's1',
  creator: {
    id: 'c1',
    username: 'tester',
    displayName: 'Tester',
    avatarUrl: '',
    bio: '',
    ratingAverage: 0,
    setupsCount: 0,
  },
  title: 'Mein Pack',
  description: 'Ein Test-Setup.',
  videoUrl: '',
  videoThumbnail: '',
  assetType: 'clonable',
  assetUrl: '',
  priceCents: 1900,
  currency: 'EUR',
  tags: [],
  ratingAverage: 0,
  ratingsCount: 0,
  createdAt: '',
};

describe('buildInstallPrompt', () => {
  it('embeds ClaudePack content inline and needs no paste placeholder', () => {
    const setup: Setup = {
      ...base,
      assetSubtype: 'claudepack',
      claudeManifest: {
        id: 'pack',
        manifest_version: 1,
        target_envs: ['claude-code'],
        personas: [{ title: 'Coach', scope: 'global', body: 'Sei direkt.' }],
        commands: [{ trigger: '/ship', summary: 'Deploy', body: 'Mach den Deploy.' }],
        agents: [{ name: 'Reviewer', summary: 'Code-Review', body: 'Prüfe den Code.' }],
      },
    };
    const out = buildInstallPrompt(setup);
    expect(out).toContain('Mein Pack');
    expect(out).toContain('Persona: Coach');
    expect(out).toContain('Sei direkt.');
    expect(out).toContain('/ship');
    expect(out).toContain('Reviewer');
    // Inline → kein Einfüge-Platzhalter
    expect(out).not.toContain('füge hier den Inhalt ein');
    expect(out).toContain('Überschreibe keine bestehenden Dateien');
  });

  it('adds a paste placeholder + source link for link-based types', () => {
    const setup: Setup = {
      ...base,
      assetSubtype: 'skill',
      assetUrl: 'https://example.com/skill.zip',
    };
    const out = buildInstallPrompt(setup);
    expect(out).toContain('Typ: Skill');
    expect(out).toContain('füge hier den Inhalt ein');
    expect(out).toContain('https://example.com/skill.zip');
  });

  it('handles BrainPack with folder tree and falls back gracefully', () => {
    const setup: Setup = {
      ...base,
      assetSubtype: 'brainpack',
      assetUrl: 'https://example.com/vault.zip',
      brainManifest: {
        vault_type: 'obsidian',
        structure: 'para',
        note_count: 120,
        folder_tree_preview: ['/Projects', '/Areas'],
      },
    };
    const out = buildInstallPrompt(setup);
    expect(out).toContain('obsidian-Vault');
    expect(out).toContain('/Projects');
    expect(out).toContain('vault.zip');
  });

  it('uses the standard body for unknown/null subtype', () => {
    const out = buildInstallPrompt({ ...base, assetSubtype: null });
    expect(out).toContain('Erkenne selbst');
    expect(out).toContain('füge hier den Inhalt ein');
  });
});
