import { createNineUpLayout, mmToPt } from "./pdfLayout";

describe("pdf layout", () => {
  it("creates 9 slots for exact mode with expected margins", () => {
    const layout = createNineUpLayout("exact_63x88");

    expect(layout.slots).toHaveLength(9);
    expect(layout.gapMm).toBe(0);
    expect(layout.marginXmm).toBeCloseTo(10.5, 6);
    expect(layout.marginYmm).toBeCloseTo(16.5, 6);
    expect(layout.slots[0].xMm).toBeCloseTo(10.5, 6);
    expect(layout.slots[0].yMm).toBeCloseTo(16.5, 6);
  });

  it("creates positive margins for tight mode", () => {
    const layout = createNineUpLayout("tight_margin");
    expect(layout.marginXmm).toBeGreaterThan(0);
    expect(layout.marginYmm).toBeGreaterThan(0);
  });

  it("converts millimeters to PDF points", () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 6);
  });
});
