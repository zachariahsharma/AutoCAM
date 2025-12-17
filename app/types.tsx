import { PartCategories, Parts, PartsToPlates, Plates } from "@/lib/schema";
import { InferSelectModel } from "drizzle-orm";

export type PartCategory = Omit<
  InferSelectModel<typeof PartCategories>,
  "thickness"
> & {
  thickness: number;
  plates?: Plate[];
  parts?: Part[];
};
export type Part = InferSelectModel<typeof Parts> & { category?: PartCategory };
export type Plate = Omit<
  InferSelectModel<typeof Plates>,
  "width" | "length" | "true_depth"
> & {
  category?: PartCategory;
  width: number;
  length: number;
  true_depth: number;
};
export type PartToPlate = InferSelectModel<typeof PartsToPlates> & {
  plate?: Plate;
  part?: Part;
};

export interface BoxTube {
  name: string;
  quantity: number;
  epic: string;
  cammed: false | "in progress" | true;
  cam_download_url?: string;
}

export interface Assignment {
  plateId: string;
  parts: { id: string; quantity: number }[];
}

export interface Session {
  material: string;
  thickness: number;
  assignments: Assignment[];
  plates: Plate[];
  updatedAt: string;
  updatedBy: string;
}
