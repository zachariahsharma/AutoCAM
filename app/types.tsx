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
  cammed: false | "in progress" | true;
  cam_download_url?: string;
}

export interface Assignment {
  plateId: string;
  parts: { id: string; quantity: number }[];
}

export interface Plate {
  id: string;
  Width: number;
  Length: number;
  trueDepth: number;
  status: "pending" | "in progress" | "completed";
  verifiedSignature?: string;
  cam_download_url?: string;
  cam_bundle_rel?: string;
  screenshot_url?: string;
}

export interface Session {
  material: string;
  thickness: number;
  assignments: Assignment[];
  plates: Plate[];
  updatedAt: string;
  updatedBy: string;
}
