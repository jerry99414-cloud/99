import type { CategoryKey, InspectionItem } from "./inspection-content";
import { INSPECTION_ITEMS } from "./inspection-content";

export interface GroupData {
  morningKeys: string[];
  afternoonKeys: string[];
  morningCustom: string[];
  afternoonCustom: string[];
  morningExtraPeople: string;
  afternoonExtraPeople: string;
}

export interface DayState {
  date: string;
  mechCount: number;
  elevCount: number;
  fireCount: number;
  mechGroups: GroupData[];
  elevGroups: GroupData[];
  fireGroups: GroupData[];
  note: string;
  notice: string;
}

export type GroupType = "mech" | "elev" | "fire";

export const TYPE_TO_CATEGORY: Record<GroupType, CategoryKey> = {
  mech: "機電類",
  elev: "電梯類",
  fire: "消防類",
};

export const TYPE_TO_LABEL_PREFIX: Record<GroupType, string> = {
  mech: "機電",
  elev: "電梯",
  fire: "消防",
};

export function emptyGroup(): GroupData {
  return {
    morningKeys: [],
    afternoonKeys: [],
    morningCustom: [],
    afternoonCustom: [],
    morningExtraPeople: "",
    afternoonExtraPeople: "",
  };
}

export function emptyDay(): DayState {
  return {
    date: "",
    mechCount: 0,
    elevCount: 0,
    fireCount: 0,
    mechGroups: [],
    elevGroups: [],
    fireGroups: [],
    note: "",
    notice: "",
  };
}

export function adjustGroupArray(arr: GroupData[], count: number): GroupData[] {
  const next = arr.slice(0, count);
  while (next.length < count) next.push(emptyGroup());
  return next;
}

export function groupsForDay(
  day: DayState,
  type: GroupType,
): GroupData[] {
  if (type === "mech") return day.mechGroups;
  if (type === "elev") return day.elevGroups;
  return day.fireGroups;
}

export function setGroupsForDay(
  day: DayState,
  type: GroupType,
  groups: GroupData[],
): DayState {
  if (type === "mech") return { ...day, mechGroups: groups };
  if (type === "elev") return { ...day, elevGroups: groups };
  return { ...day, fireGroups: groups };
}

export function countForDay(day: DayState, type: GroupType): number {
  if (type === "mech") return day.mechCount;
  if (type === "elev") return day.elevCount;
  return day.fireCount;
}

// Build cross-day labels (機電1, 機電2, 電梯1, 消防1...)
export function buildLabel(type: GroupType, runningIndex: number): string {
  return `${TYPE_TO_LABEL_PREFIX[type]}${runningIndex}.`;
}

export interface RequestContent {
  shortKey?: string;
  fullLabel: string;
}

export interface RequestGroup {
  groupLabel: string;
  morningContents: RequestContent[];
  afternoonContents: RequestContent[];
  morningExtraPeople: string[];
  afternoonExtraPeople: string[];
}

export interface RequestDay {
  date: string;
  mechanicalCount: number;
  elevatorCount: number;
  fireCount: number;
  groups: RequestGroup[];
  note: string;
  notice: string;
}

export interface InspectionRequest {
  projectName: string;
  region: "north" | "south";
  isUnpublished: boolean;
  totalDays: number;
  days: RequestDay[];
}

const ITEM_BY_KEY = new Map<string, InspectionItem>(
  INSPECTION_ITEMS.map((i) => [i.shortKey, i]),
);

function buildContents(
  keys: string[],
  customs: string[],
): RequestContent[] {
  const out: RequestContent[] = [];
  for (const k of keys) {
    const item = ITEM_BY_KEY.get(k);
    if (item) out.push({ shortKey: item.shortKey, fullLabel: item.fullLabel });
  }
  for (const c of customs) {
    const trimmed = c.trim();
    if (trimmed) out.push({ fullLabel: trimmed });
  }
  return out;
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildRequest(
  projectName: string,
  region: "north" | "south",
  isUnpublished: boolean,
  days: DayState[],
): InspectionRequest {
  // Cross-day running totals
  let mechRunning = 0;
  let elevRunning = 0;
  let fireRunning = 0;

  const reqDays: RequestDay[] = days.map((day) => {
    const groups: RequestGroup[] = [];

    day.mechGroups.forEach((g, i) => {
      groups.push({
        groupLabel: buildLabel("mech", mechRunning + i + 1),
        morningContents: buildContents(g.morningKeys, g.morningCustom),
        afternoonContents: buildContents(g.afternoonKeys, g.afternoonCustom),
        morningExtraPeople: splitLines(g.morningExtraPeople),
        afternoonExtraPeople: splitLines(g.afternoonExtraPeople),
      });
    });
    mechRunning += day.mechGroups.length;

    day.elevGroups.forEach((g, i) => {
      groups.push({
        groupLabel: buildLabel("elev", elevRunning + i + 1),
        morningContents: buildContents(g.morningKeys, g.morningCustom),
        afternoonContents: buildContents(g.afternoonKeys, g.afternoonCustom),
        morningExtraPeople: splitLines(g.morningExtraPeople),
        afternoonExtraPeople: splitLines(g.afternoonExtraPeople),
      });
    });
    elevRunning += day.elevGroups.length;

    day.fireGroups.forEach((g, i) => {
      groups.push({
        groupLabel: buildLabel("fire", fireRunning + i + 1),
        morningContents: buildContents(g.morningKeys, g.morningCustom),
        afternoonContents: buildContents(g.afternoonKeys, g.afternoonCustom),
        morningExtraPeople: splitLines(g.morningExtraPeople),
        afternoonExtraPeople: splitLines(g.afternoonExtraPeople),
      });
    });
    fireRunning += day.fireGroups.length;

    return {
      date: day.date,
      mechanicalCount: day.mechCount,
      elevatorCount: day.elevCount,
      fireCount: day.fireCount,
      groups,
      note: day.note,
      notice: day.notice,
    };
  });

  return {
    projectName,
    region,
    isUnpublished,
    totalDays: days.length,
    days: reqDays,
  };
}

export function computeUnInspected(req: InspectionRequest): InspectionItem[] {
  const seen = new Set<string>();
  for (const day of req.days) {
    for (const g of day.groups) {
      for (const c of [...g.morningContents, ...g.afternoonContents]) {
        if (c.shortKey) seen.add(c.shortKey);
      }
    }
  }
  return INSPECTION_ITEMS.filter((i) => !seen.has(i.shortKey));
}
