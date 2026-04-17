export type DeckSection = "deck" | "sideboard" | "commander" | "companion";

export interface DeckEntry {
  line: number;
  rawLine: string;
  section: DeckSection;
  quantity: number;
  name: string;
  setCode?: string;
  collectorNumber?: string;
}

export type DeckParseDiagnosticCode =
  | "invalid_line"
  | "invalid_quantity"
  | "empty_name";

export interface DeckParseDiagnostic {
  line: number;
  rawLine: string;
  code: DeckParseDiagnosticCode;
  message: string;
}

export interface ParsedDecklist {
  entries: DeckEntry[];
  diagnostics: DeckParseDiagnostic[];
  totalCards: number;
}

const SECTION_BY_HEADER: Record<string, DeckSection> = {
  deck: "deck",
  mainboard: "deck",
  sideboard: "sideboard",
  commander: "commander",
  companion: "companion"
};

const CARD_LINE_REGEX =
  /^(?<quantity>\d+)\s+(?<name>.+?)(?:\s+\((?<setCode>[a-zA-Z0-9]{2,6})\)\s+(?<collectorNumber>[a-zA-Z0-9]+))?$/;

export function parseArenaDecklist(input: string): ParsedDecklist {
  const lines = input.split(/\r?\n/);
  const entries: DeckEntry[] = [];
  const diagnostics: DeckParseDiagnostic[] = [];
  let currentSection: DeckSection = "deck";

  lines.forEach((rawLine, index) => {
    const line = index + 1;
    const trimmed = rawLine.trim();

    if (trimmed === "") {
      return;
    }

    const maybeHeader = SECTION_BY_HEADER[trimmed.toLowerCase()];
    if (maybeHeader) {
      currentSection = maybeHeader;
      return;
    }

    const match = CARD_LINE_REGEX.exec(trimmed);
    if (!match?.groups) {
      diagnostics.push({
        line,
        rawLine,
        code: "invalid_line",
        message: "Die Zeile entspricht nicht dem Arena-Decklistenformat."
      });
      return;
    }

    const quantity = Number.parseInt(match.groups.quantity, 10);
    if (!Number.isFinite(quantity) || quantity < 1) {
      diagnostics.push({
        line,
        rawLine,
        code: "invalid_quantity",
        message: "Die Kartenanzahl muss mindestens 1 sein."
      });
      return;
    }

    const name = match.groups.name.trim();
    if (name.length === 0) {
      diagnostics.push({
        line,
        rawLine,
        code: "empty_name",
        message: "Der Kartenname fehlt."
      });
      return;
    }

    entries.push({
      line,
      rawLine,
      section: currentSection,
      quantity,
      name,
      setCode: match.groups.setCode?.toUpperCase(),
      collectorNumber: match.groups.collectorNumber
    });
  });

  const totalCards = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  return {
    entries,
    diagnostics,
    totalCards
  };
}
