// Pure helpers for the README version check in validate-skills.mjs.

// Returns metadata.version from a SKILL.md frontmatter block, or undefined.
export function metadataVersion(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!block) return undefined;
  const metadata = block.match(/^metadata:\n((?:[ \t]+.*\n?)*)/m)?.[1];
  return metadata?.match(/^[ \t]+version:\s*"?([^"\s]+)"?\s*$/m)?.[1];
}

// Returns the version shown in the README skills table row for a skill, or
// undefined when the table has no row for it. Only a row that starts with the
// skill's link counts; a link elsewhere in the README does not.
export function readmeVersion(readme, skill) {
  const prefix = `| [${skill}](./skills/${skill}/SKILL.md) |`;
  const row = readme.split("\n").find((line) => line.startsWith(prefix));
  if (!row) return undefined;
  return row.slice(prefix.length).match(/^\s*[^|]*?\((\d+\.\d+\.\d+)\)\s*\|/)?.[1];
}
