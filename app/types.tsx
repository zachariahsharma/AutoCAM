export interface Part {
  name: string;
  quantity: number;
  epic: string;
}

export interface PartCategory {
  material: string;
  thickness: number;
  parts: Part[];
}

export interface BoxTube {
  name: string;
  quantity: number;
  epic: string;
}
