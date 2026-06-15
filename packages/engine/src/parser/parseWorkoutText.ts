export interface ParsedMovement {
  name: string;
  sets: number;
  reps?: number;
  repMax?: number;
  duration?: number;
  load?: number;
  loadFallback?: number;
  eachSide: boolean;
}

export interface ParseResult {
  movements: ParsedMovement[];
  defaultRest?: number;
  unparsedLines: string[];
}

// Normalise the sets×reps separator: "x", "×", "by"
function normaliseSep(s: string): string {
  return s.replace(/×/g, 'x').replace(/\bby\b/gi, 'x');
}

// True if the line looks like a rest annotation
function parseRestLine(line: string): number | null {
  // "Rest 60-90 sec ..." or "Rest 90 sec ..."
  const m = line.match(/^\s*rest\s+(\d+)(?:-\d+)?\s*sec/i);
  return m ? parseInt(m[1]!, 10) : null;
}

function parseMovementLine(line: string): ParsedMovement | null {
  const norm = normaliseSep(line.trim());

  // Detect "each side" / "e/s" / "per side" at end
  const eachSidePattern = /\b(each\s+side|e\/s|per\s+side)\b/i;
  const eachSide = eachSidePattern.test(norm);
  const stripped = norm.replace(eachSidePattern, '').trim();

  // Pattern: <name> [<load> or <load2> kg] <sets>x<reps[-repMax]> [sec]
  // Also:    <name> <sets>x<reps[-repMax]>   (bodyweight, no load)

  // Load part: "24 kg", "24 or 16 kg", "24kgs"
  const loadPattern = /(\d+)\s+or\s+(\d+)\s+kgs?|(\d+)\s+kgs?/i;

  let load: number | undefined;
  let loadFallback: number | undefined;
  let rest = stripped;

  const loadMatch = rest.match(loadPattern);
  if (loadMatch) {
    if (loadMatch[1] !== undefined && loadMatch[2] !== undefined) {
      // "24 or 16 kg"
      load = parseInt(loadMatch[1], 10);
      loadFallback = parseInt(loadMatch[2], 10);
    } else if (loadMatch[3] !== undefined) {
      // "24 kg"
      load = parseInt(loadMatch[3], 10);
    }
    rest = rest.replace(loadMatch[0], '').trim();
  }

  // Sets×reps: "3x5", "3x8-10", "3x30 sec"
  const setsRepsPattern = /(\d+)x(\d+)(?:-(\d+))?\s*(sec)?/i;
  const srMatch = rest.match(setsRepsPattern);
  if (!srMatch) return null;

  const sets = parseInt(srMatch[1]!, 10);
  const repsOrDuration = parseInt(srMatch[2]!, 10);
  const repMax = srMatch[3] !== undefined ? parseInt(srMatch[3], 10) : undefined;
  const isTimed = /sec/i.test(srMatch[4] ?? '');

  // Everything before the sets×reps pattern is the movement name
  const nameCandidate = rest.slice(0, rest.indexOf(srMatch[0]!)).trim();
  if (!nameCandidate) return null;

  const movement: ParsedMovement = {
    name: nameCandidate,
    sets,
    eachSide,
  };

  if (isTimed) {
    movement.duration = repsOrDuration;
  } else {
    movement.reps = repsOrDuration;
    if (repMax !== undefined) movement.repMax = repMax;
  }

  if (load !== undefined) movement.load = load;
  if (loadFallback !== undefined) movement.loadFallback = loadFallback;

  return movement;
}

export function parseWorkoutText(text: string): ParseResult {
  const movements: ParsedMovement[] = [];
  const unparsedLines: string[] = [];
  let defaultRest: number | undefined;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const rest = parseRestLine(line);
    if (rest !== null) {
      defaultRest = rest;
      continue;
    }

    const movement = parseMovementLine(line);
    if (movement) {
      movements.push(movement);
    } else {
      unparsedLines.push(line);
    }
  }

  return { movements, unparsedLines, ...(defaultRest !== undefined ? { defaultRest } : {}) };
}
