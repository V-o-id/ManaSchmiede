import { PDFDocument, type PDFImage } from "pdf-lib";
import type { ResolvedCard } from "./cardResolver";
import { createNineUpLayout, mmToPt, type LayoutMode } from "./pdfLayout";
import type { ScryfallCard, ScryfallImageUris } from "./scryfallTypes";

type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface PrintableImageItem {
  imageUrl: string;
  cardName: string;
  entryLine: number;
}

export interface GenerateProxyPdfOptions {
  layoutMode?: LayoutMode;
  fetchFn?: FetchFunction;
  onProgress?: (current: number, total: number) => void;
}

const DEFAULT_LAYOUT_MODE: LayoutMode = "exact_63x88";

function bestImageUrl(imageUris?: ScryfallImageUris): string | null {
  if (!imageUris) {
    return null;
  }
  return imageUris.png ?? imageUris.large ?? imageUris.normal ?? imageUris.small ?? null;
}

function cardImageUrls(card: ScryfallCard): string[] {
  const faceUrls =
    card.card_faces
      ?.map((face) => bestImageUrl(face.image_uris))
      .filter((url): url is string => Boolean(url)) ?? [];

  if (faceUrls.length >= 2) {
    return faceUrls;
  }

  const primary = bestImageUrl(card.image_uris);
  if (primary) {
    return [primary];
  }

  return faceUrls.length > 0 ? [faceUrls[0]] : [];
}

export function buildPrintableImageList(resolvedCards: ResolvedCard[]): PrintableImageItem[] {
  const printable: PrintableImageItem[] = [];

  resolvedCards.forEach((resolved) => {
    const urls = cardImageUrls(resolved.card);
    if (urls.length === 0) {
      return;
    }

    for (let copyIndex = 0; copyIndex < resolved.entry.quantity; copyIndex += 1) {
      urls.forEach((imageUrl) => {
        printable.push({
          imageUrl,
          cardName: resolved.card.name,
          entryLine: resolved.entry.line
        });
      });
    }
  });

  return printable;
}

function imageIsPng(url: string): boolean {
  return url.toLowerCase().split("?")[0].endsWith(".png");
}

async function embedRemoteImage(
  pdfDoc: PDFDocument,
  imageUrl: string,
  fetchFn: FetchFunction
): Promise<PDFImage> {
  const response = await fetchFn(imageUrl);
  if (!response.ok) {
    throw new Error(`Bilddownload mit Status ${response.status} fehlgeschlagen`);
  }

  const bytes = await response.arrayBuffer();
  if (imageIsPng(imageUrl)) {
    return pdfDoc.embedPng(bytes);
  }

  try {
    return await pdfDoc.embedJpg(bytes);
  } catch {
    return pdfDoc.embedPng(bytes);
  }
}

export async function generateProxyPdfBytes(
  resolvedCards: ResolvedCard[],
  options: GenerateProxyPdfOptions = {}
): Promise<Uint8Array> {
  const printableItems = buildPrintableImageList(resolvedCards);
  if (printableItems.length === 0) {
    throw new Error("Keine druckbaren Bilder fuer die PDF-Erzeugung verfuegbar.");
  }

  const layout = createNineUpLayout(options.layoutMode ?? DEFAULT_LAYOUT_MODE);
  const fetchFn = options.fetchFn ?? fetch;
  const pdfDoc = await PDFDocument.create();
  const embeddedImageCache = new Map<string, PDFImage>();
  const slotsPerPage = layout.slots.length;

  const pageWidthPt = mmToPt(layout.pageWidthMm);
  const pageHeightPt = mmToPt(layout.pageHeightMm);

  printableItems.forEach((_, index) => {
    if (index % slotsPerPage === 0) {
      pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    }
  });

  for (let index = 0; index < printableItems.length; index += 1) {
    const item = printableItems[index];
    const pageIndex = Math.floor(index / slotsPerPage);
    const slotIndex = index % slotsPerPage;
    const slot = layout.slots[slotIndex];
    const page = pdfDoc.getPage(pageIndex);

    let embedded = embeddedImageCache.get(item.imageUrl);
    if (!embedded) {
      embedded = await embedRemoteImage(pdfDoc, item.imageUrl, fetchFn);
      embeddedImageCache.set(item.imageUrl, embedded);
    }

    const xPt = mmToPt(slot.xMm);
    const widthPt = mmToPt(slot.widthMm);
    const heightPt = mmToPt(slot.heightMm);
    const yFromTopPt = mmToPt(slot.yMm);
    const yPt = pageHeightPt - yFromTopPt - heightPt;

    page.drawImage(embedded, {
      x: xPt,
      y: yPt,
      width: widthPt,
      height: heightPt
    });

    options.onProgress?.(index + 1, printableItems.length);
  }

  return pdfDoc.save();
}

export function downloadPdf(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
