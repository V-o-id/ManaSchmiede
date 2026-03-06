export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface ScryfallCardFace {
  name: string;
  image_uris?: ScryfallImageUris;
}

export interface ScryfallCard {
  id: string;
  name: string;
  lang: string;
  released_at: string;
  set: string;
  collector_number: string;
  image_uris?: ScryfallImageUris;
  card_faces?: ScryfallCardFace[];
}

export interface ScryfallList<T> {
  object: "list";
  has_more: boolean;
  data: T[];
}

export interface ScryfallErrorResponse {
  object: "error";
  status: number;
  code: string;
  details: string;
}

