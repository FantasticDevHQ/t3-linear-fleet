// Pure helpers for the README version check in validate-skills.mjs.

// Returns metadata.version from a SKILL.md frontmatter block, or undefined.
export function metadataVersion(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!block) return undefined;
  const metadata = block.match(/^metadata:\n((?:[ \t]+.*\n?)*)/m)?.[1];
  return metadata?.match(/^[ \t]+version:\s*"?([^"\s]+)"?\s*$/m)?.[1];
}

// The rows of the skills table: the table in the README's "## Skills" section
// whose header row is "| Skill | Status | What it does |", outside code fences.
const TABLE_HEADER = "| Skill | Status | What it does |";

function skillsTableRows(readme) {
  const rows = [];
  let inSection = false;
  let inFence = false;
  let state = "before"; // before -> header -> rows -> after
  for (const line of readme.split("\n")) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^## /.test(line)) {
      inSection = line.trim() === "## Skills";
      continue;
    }
    if (!inSection || state === "after") continue;
    if (state === "before" && line.trim() === TABLE_HEADER) state = "header";
    else if (state === "header") state = /^\|[\s|:-]+\|$/.test(line.trim()) ? "rows" : "before";
    else if (state === "rows") {
      if (line.startsWith("|")) rows.push(line);
      else state = "after";
    }
  }
  return rows;
}

// Returns the version shown in the README skills table row for a skill, or
// undefined when the skills table has no row for it.
export function readmeVersion(readme, skill) {
  const prefix = `| [${skill}](./skills/${skill}/SKILL.md) |`;
  const row = skillsTableRows(readme).find((line) => line.startsWith(prefix));
  if (!row) return undefined;
  return row.slice(prefix.length).match(/^\s*[^|]*?\((\d+\.\d+\.\d+)\)\s*\|/)?.[1];
}
