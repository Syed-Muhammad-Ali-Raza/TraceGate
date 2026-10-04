#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Command } from 'commander';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsRoot = join(__dirname, '../skills');

const program = new Command();
program.name('llm-gateway-agent').description('Install LLM Gateway engineering skills into your IDE');

program
  .command('init')
  .option('--tool <tool>', 'cursor|claude|windsurf|agents', 'cursor')
  .option('--force', 'overwrite existing files')
  .action((opts: { tool: string; force?: boolean }) => {
    const skills = ['frontend', 'backend', 'database', 'security', 'testing'];
    for (const skill of skills) {
      installSkill(skill, opts.tool, Boolean(opts.force));
    }
    console.log(`Installed ${skills.length} skills for ${opts.tool}`);
  });

program
  .command('add')
  .argument('<skills...>')
  .option('--tool <tool>', 'cursor|claude|windsurf|agents', 'cursor')
  .action((skills: string[], opts: { tool: string }) => {
    for (const skill of skills) {
      installSkill(skill, opts.tool, true);
    }
    console.log(`Added: ${skills.join(', ')}`);
  });

program.command('list').action(() => {
  console.log(['frontend', 'backend', 'database', 'security', 'testing'].join('\n'));
});

program.parse();

function installSkill(skill: string, tool: string, force: boolean): void {
  const src = join(skillsRoot, skill, 'SKILL.md');
  if (!existsSync(src)) {
    console.warn(`Unknown skill: ${skill}`);
    return;
  }
  const dest =
    tool === 'claude'
      ? join(process.cwd(), '.claude/skills', skill, 'SKILL.md')
      : tool === 'windsurf'
        ? join(process.cwd(), '.windsurf/rules', `${skill}.md`)
        : tool === 'agents'
          ? join(process.cwd(), 'AGENTS.md')
          : join(process.cwd(), '.cursor/rules', `${skill}.mdc`);

  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest) && !force && tool !== 'agents') {
    return;
  }
  cpSync(src, dest);
}
