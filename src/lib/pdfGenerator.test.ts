import { buildPrintableImageList } from "./pdfGenerator";
import type { ResolvedCard } from "./cardResolver";

function makeResolved(overrides: Partial<ResolvedCard> = {}): ResolvedCard {
  return {
    entry: {
      line: 1,
      rawLine: "2 Delver of Secrets (ISD) 51",
      section: "deck",
      quantity: 2,
      name: "Delver of Secrets",
      setCode: "ISD",
      collectorNumber: "51"
    },
    card: {
      id: "abc",
      name: "Delver of Secrets",
      lang: "de",
      released_at: "2011-09-30",
      set: "isd",
      collector_number: "51",
      card_faces: [
        { name: "Delver of Secrets", image_uris: { png: "https://img.example/front.png" } },
        { name: "Insectile Aberration", image_uris: { png: "https://img.example/back.png" } }
      ]
    },
    languageUsed: "de",
    source: "set_collector",
    ...overrides
  };
}

describe("buildPrintableImageList", () => {
  it("duplicates entries by quantity and includes both faces for DFC cards", () => {
    const list = buildPrintableImageList([makeResolved()]);
    expect(list).toHaveLength(4);
    expect(list[0].imageUrl).toContain("front.png");
    expect(list[1].imageUrl).toContain("back.png");
  });

  it("uses single-face image when card faces are not present", () => {
    const singleFace = makeResolved({
      entry: {
        line: 1,
        rawLine: "1 Opt",
        section: "deck",
        quantity: 1,
        name: "Opt"
      },
      card: {
        id: "opt-id",
        name: "Opt",
        lang: "de",
        released_at: "2018-09-01",
        set: "xln",
        collector_number: "65",
        image_uris: { png: "https://img.example/opt.png" }
      }
    });

    const list = buildPrintableImageList([singleFace]);
    expect(list).toHaveLength(1);
    expect(list[0].imageUrl).toContain("opt.png");
  });
});

