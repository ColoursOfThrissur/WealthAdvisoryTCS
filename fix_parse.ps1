$f = 'c:\Users\DerikShaju\Desktop\Derik\Projects\WelathAdvisoryDemo\WealthAdvisoryTCS\front end\src\hooks\useMorningNotes.js'
$c = Get-Content $f -Raw

$oldFn = 'export const parseSections = (output = '') => {

  const lines = output.split('
');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip completeness checklist and separators
    if (
      trimmed === ''---'' ||
      trimmed === ''***'' ||
      trimmed.includes(''Completeness Checklist'') ||
      /^\[x\]|\[ \]/i.test(trimmed) ||
      (trimmed.startsWith(''*Note:'') && trimmed.includes(''checklist''))
    ) {
      continue;
    }

    // Detect **Section Header** lines ?' must be a standalone bold line,
    // at least 2 words, starting uppercase, not a short ticker/label
    if (trimmed.startsWith(''**'') && trimmed.endsWith(''**'') && trimmed.length > 4) {
      const title = trimmed.slice(2, -2).trim();
      const wordCount = title.split(/\s+/).length;
      if (/^[A-Z]/.test(title) && wordCount >= 2 && title.length >= 6) {
        if (current) sections.push(current);
        current = { title, content: [] };
        continue;

      }
    }

    if (current && trimmed) {
      current.content.push(line);

    }

  }


  if (current) sections.push(current);

  return sections;
};'

$newFn = @'
export const parseSections = (output = '') => {
  const lines = output.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip separators and checklist lines
    if (
      trimmed === '---' ||
      trimmed === '***' ||
      trimmed.includes('Completeness Checklist') ||
      /^\[x\]|\[ \]/i.test(trimmed) ||
      (trimmed.startsWith('*Note:') && trimmed.includes('checklist'))
    ) {
      continue;
    }

    // Detect **Section Header** lines.
    // Real section headers from this backend always contain ':' or '/'
    // (e.g. "Top Call: ...", "Overnight/Pre-Market Developments").
    // This filters out date lines (**May 20, 2026 Morning Note**)
    // and topic labels (**Global Technology**).
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      const title = trimmed.slice(2, -2).trim();
      if (/^[A-Z]/.test(title) && (title.includes(':') || title.includes('/'))) {
        if (current) sections.push(current);
        current = { title, content: [] };
        continue;
      }
    }

    if (current && trimmed) {
      current.content.push(line);
    }
  }

  if (current) sections.push(current);

  // Always put Top Call first
  const topCallIdx = sections.findIndex(s => s.title.toLowerCase().includes('top call'));
  if (topCallIdx > 0) {
    const [topCall] = sections.splice(topCallIdx, 1);
    sections.unshift(topCall);
  }

  return sections;
};
'@

# Do a targeted replacement using line numbers instead of string matching
$lines = $c -split "`n"
# Find start and end of parseSections
$start = -1; $end = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match "^export const parseSections") { $start = $i }
  if ($start -ge 0 -and $i -gt $start -and $lines[$i] -match "^};") { $end = $i; break }
}

if ($start -lt 0 -or $end -lt 0) { Write-Host "Could not find parseSections bounds"; exit 1 }

$before = ($lines[0..($start-1)]) -join "`n"
$after  = ($lines[($end+1)..($lines.Count-1)]) -join "`n"
$result = $before + "`n" + $newFn + "`n" + $after

Set-Content $f $result -NoNewline
Write-Host "done — parseSections rewritten, lines $start to $end"
