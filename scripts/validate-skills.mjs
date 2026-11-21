// Validates the skill set: frontmatter limits, folder/name match, and that the
// plugin manifest and README list exactly the skills that exist.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const errors = [];
const read = (path) => readFileSync(new URL(path, `file://${root}`), "utf8");

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  const lines = match[1].split("\n");
  for (let i = 0; i < lines.length; i++) {
    const top = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!top) continue;
    let value = top[2];
    if (/^[>|]-?$/.test(value)) {
      const block = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) block.push(lines[++i].trim());
      value = block.join(value.startsWith(">") ? " " : "\n");
    } else {
      value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    }
    fields[top[1]] = value;
  }
  return fields;
}

const skills = readdirSync(new URL("skills/", `file://${root}`), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const skill of skills) {
  const path = `skills/${skill}/SKILL.md`;
  if (!existsSync(new URL(path, `file://${root}`))) {
    errors.push(`${path}: missing`);
    continue;
  }
  const fields = frontmatter(read(path));
  if (!fields) {
    errors.push(`${path}: missing or unterminated frontmatter`);
    continue;
  }
  if (fields.name !== skill) errors.push(`${path}: name "${fields.name}" must match folder "${skill}"`);
  if (!fields.name || fields.name.length > 64) errors.push(`${path}: name must be 1-64 characters`);
  if (!fields.description || fields.description.length > 1024)
    errors.push(`${path}: description must be 1-1024 characters (has ${fields.description?.length ?? 0})`);
}

const manifest = JSON.parse(read(".claude-plugin/plugin.json"));
const listed = (manifest.skills ?? []).map((path) => path.replace(/^\.\/skills\//, "")).sort();
if (JSON.stringify(listed) !== JSON.stringify(skills))
  errors.push(`.claude-plugin/plugin.json skills ${JSON.stringify(listed)} must equal ${JSON.stringify(skills)}`);

const readme = read("README.md");
for (const skill of skills)
  if (!readme.includes(`(./skills/${skill}/SKILL.md)`)) errors.push(`README.md: no link to ./skills/${skill}/SKILL.md`);

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}
console.log(`PASS ${skills.length} skill(s) valid and listed: ${skills.join(", ")}`);
