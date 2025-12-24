import {
  PartCategories,
  Parts,
  PartsToPlates,
  Plates,
  BoxTubes,
} from "@/lib/schema/cam";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

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
export type BoxTube = InferInsertModel<typeof BoxTubes>;

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

export interface Material {
  id: number;
  name: string;
}

export interface Machine {
  id: number;
  name: string;
  file: string;
}

export interface Tool {
  id: number,
  name: string;
  materials: Material[];
  machines: Machine[];
  file: string; 
}

export interface Collaborator {
  id: number;
  name: string;
  role: "Admin" | "Member";
  email: string;
}

export interface ApiKey {
  id: number;
  name: string;
  startchars: string;
}