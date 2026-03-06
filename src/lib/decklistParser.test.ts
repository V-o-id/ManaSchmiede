import { parseArenaDecklist } from "./decklistParser";

describe("parseArenaDecklist", () => {
  it("parses deck and sideboard lines with optional set data", () => {
    const input = `Deck
4 Lightning Strike (M19) 152
2 Opt

Sideboard
1 Negate (M20) 69`;

    const parsed = parseArenaDecklist(input);

    expect(parsed.diagnostics).toHaveLength(0);
    expect(parsed.entries).toHaveLength(3);
    expect(parsed.totalCards).toBe(7);
    expect(parsed.entries[0]).toMatchObject({
      section: "deck",
      quantity: 4,
      name: "Lightning Strike",
      setCode: "M19",
      collectorNumber: "152"
    });
    expect(parsed.entries[1]).toMatchObject({
      section: "deck",
      quantity: 2,
      name: "Opt"
    });
    expect(parsed.entries[2]).toMatchObject({
      section: "sideboard",
      quantity: 1,
      name: "Negate"
    });
  });

  it("defaults to deck section when no section header is present", () => {
    const parsed = parseArenaDecklist("3 Island (M21) 263");

    expect(parsed.diagnostics).toHaveLength(0);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].section).toBe("deck");
  });

  it("supports additional Arena sections like Commander", () => {
    const input = `Commander
1 Kinnan, Bonder Prodigy (IKO) 192`;
    const parsed = parseArenaDecklist(input);

    expect(parsed.diagnostics).toHaveLength(0);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].section).toBe("commander");
  });

  it("returns diagnostics for malformed lines", () => {
    const parsed = parseArenaDecklist(`Deck
This is not valid`);

    expect(parsed.entries).toHaveLength(0);
    expect(parsed.diagnostics).toHaveLength(1);
    expect(parsed.diagnostics[0]).toMatchObject({
      line: 2,
      code: "invalid_line"
    });
  });

  it("returns diagnostics for invalid quantity", () => {
    const parsed = parseArenaDecklist("0 Shock (M21) 159");

    expect(parsed.entries).toHaveLength(0);
    expect(parsed.diagnostics).toHaveLength(1);
    expect(parsed.diagnostics[0].code).toBe("invalid_quantity");
  });

  it("preserves collector numbers with suffix letters", () => {
    const parsed = parseArenaDecklist("1 Plains (UNF) 235a");

    expect(parsed.diagnostics).toHaveLength(0);
    expect(parsed.entries[0].collectorNumber).toBe("235a");
  });
});

