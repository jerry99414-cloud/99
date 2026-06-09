// Shared types for inspection schedule generation

export interface InspectionContentEntry {
  shortKey?: string;
  fullLabel: string;
  isCustom?: boolean;
}

export interface InspectionGroupInput {
  // groupLabel example: "機電1." / "電梯1." / "消防2."
  groupLabel: string;
  morningContents: InspectionContentEntry[];
  afternoonContents: InspectionContentEntry[];
  morningExtraPeople?: string[];
  afternoonExtraPeople?: string[];
}

export interface InspectionDayInput {
  date: string;
  mechanicalCount: number;
  elevatorCount: number;
  fireCount: number;
  groups: InspectionGroupInput[];
  note?: string;
  notice?: string;
}

export interface InspectionRequest {
  projectName: string;
  region: "north" | "south";
  isUnpublished: boolean;
  totalDays: number;
  days: InspectionDayInput[];
}
