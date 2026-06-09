import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  VerticalMergeType,
  AlignmentType,
  BorderStyle,
  PageBreak,
  PageOrientation,
} from "docx";
import {
  ITEM_BY_SHORT_KEY,
  INSPECTION_ITEMS,
  PEOPLE_MAPPING,
  dedupePreserveOrder,
} from "./data";
import type {
  InspectionContentEntry,
  InspectionGroupInput,
  InspectionRequest,
} from "./types";

const FONT = "微軟正黑體";
const FONT_SIZE = 20; // half-points = 10pt

const COL_WIDTHS = [621, 566, 1277, 1162, 5784, 1729]; // dxa
const TOTAL_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0);

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

// ---------- Sort index (master list order) ----------

const SORT_INDEX = new Map<string, number>(
  INSPECTION_ITEMS.map((item, i) => [item.shortKey, i]),
);

function sortContents(
  contents: InspectionContentEntry[],
): InspectionContentEntry[] {
  return [...contents].sort((a, b) => {
    const ia =
      a.shortKey != null ? (SORT_INDEX.get(a.shortKey) ?? Infinity) : Infinity;
    const ib =
      b.shortKey != null ? (SORT_INDEX.get(b.shortKey) ?? Infinity) : Infinity;
    return ia - ib;
  });
}

// ---------- Date formatting ----------

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const m = parseInt(parts[1] ?? "", 10);
    const d = parseInt(parts[2] ?? "", 10);
    if (!isNaN(m) && !isNaN(d)) return `${m}/${d}`;
  }
  return dateStr;
}

// ---------- Notice text ----------

const NOTICE_FULL: string[] = [
  "1. 發電機功能測試(ATS斷電測試)公設區域停電需提前公告，預計於上午9點30分開始斷電測試，測試時間約為１個小時，測試時間會因現場檢驗缺失狀況有所增減調整。",
  "2. 電梯昇降設備配合發電機測試時電梯管制及開放時間需提前公告，預計於上午9點30分前管制完成，管制時間約為１個小時，管制時間會因現場檢驗缺失狀況有所增減調整。",
  "3. 消防設備測試時會發出警報聲響,泡沫放射區域淨空，需提前公告告知住戶。",
  "4. 以上項目當天測試設備前會全棟廣播通知。",
  "5. 請提前通知各系統設備廠商當天務必到場配合檢驗。",
  "6. 當天檢驗前請先將所有機房門扇、往屋突頂樓人孔蓋及屋頂、地下室水箱蓋全部開啟。",
  "7. 空調系統檢驗天花板內設備請廠商先備妥符合勞安規定之上下設備(如施工架、高空作業車…等)。",
];

const NOTICE_SIMPLE: string[] = [
  "1. 請提前通知各系統設備廠商當天務必到場配合檢驗。",
  "2. 以上項目當天測試設備前會全棟廣播通知。",
  "3. 當天檢驗前請先將所有機房門扇、往屋突頂樓人孔蓋及屋頂、地下室水箱蓋全部開啟。",
  "4. 消防設備測試時會發出警報聲響，需提前公告告知住戶。",
];

const NOTICE_DRAINAGE =
  "排水系統各樓層落水頭試水檢驗請廠商先備妥試水設備(如水桶&手推車或水管….等)。";

const DRAINAGE_KEYWORDS = ["排水", "污水", "廢水", "落水頭"];

// ---------- Types ----------

type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType];
type VerticalMergeValue =
  (typeof VerticalMergeType)[keyof typeof VerticalMergeType];

interface CellOpts {
  text?: string;
  bullets?: string[];
  paragraphs?: Paragraph[];
  width: number;
  colSpan?: number;
  align?: AlignmentValue;
  verticalMerge?: VerticalMergeValue;
}

// ---------- Paragraph builders ----------

function makeText(
  text: string,
  align: AlignmentValue = AlignmentType.CENTER,
): Paragraph {
  return new Paragraph({
    alignment: align,
    spacing: { before: 0, after: 0 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: FONT_SIZE,
        bold: true,
      }),
    ],
  });
}

function makeBulletParagraph(label: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
    indent: { left: 255, hanging: 255 },
    children: [
      new TextRun({
        text: `● ${label}`,
        font: FONT,
        size: FONT_SIZE,
        bold: true,
      }),
    ],
  });
}

function makeCell(opts: CellOpts): TableCell {
  let paragraphs: Paragraph[];
  if (opts.paragraphs && opts.paragraphs.length > 0) {
    paragraphs = opts.paragraphs;
  } else if (opts.bullets && opts.bullets.length > 0) {
    paragraphs = opts.bullets.map((b) => makeBulletParagraph(b));
  } else {
    const text = opts.text ?? "";
    const align = opts.align ?? AlignmentType.CENTER;
    paragraphs =
      text === ""
        ? [makeText("", align)]
        : text.split("\n").map((line) => makeText(line, align));
  }

  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    columnSpan: opts.colSpan,
    verticalMerge: opts.verticalMerge,
    verticalAlign: VerticalAlign.CENTER,
    borders: BORDER,
    children: paragraphs,
  });
}

// ---------- People mapping ----------

function autoPeopleFor(contents: InspectionContentEntry[]): string[] {
  const acc: string[] = [];
  for (const c of contents) {
    if (!c.shortKey) continue;
    const ppl = PEOPLE_MAPPING[c.shortKey];
    if (ppl) acc.push(...ppl);
  }
  return acc;
}

function buildPeopleText(
  contents: InspectionContentEntry[],
  extra: string[] = [],
): string {
  return dedupePreserveOrder([...autoPeopleFor(contents), ...extra]).join("\n");
}

// ---------- Group rendering ----------

interface RenderedGroup {
  group: string;
  contentItems: string[];
  people: string;
}

function renderGroups(
  groups: InspectionGroupInput[],
  half: "morning" | "afternoon",
): RenderedGroup[] {
  const out: RenderedGroup[] = [];
  for (const g of groups) {
    const contents =
      half === "morning" ? g.morningContents : g.afternoonContents;
    const extras =
      half === "morning"
        ? g.morningExtraPeople ?? []
        : g.afternoonExtraPeople ?? [];
    if (!contents || contents.length === 0) continue;
    const sorted = sortContents(contents);
    out.push({
      group: g.groupLabel,
      contentItems: sorted.map((c) => c.fullLabel),
      people: buildPeopleText(sorted, extras),
    });
  }
  return out;
}

function hasDrainageInRendered(groups: RenderedGroup[]): boolean {
  for (const g of groups) {
    if (
      g.contentItems.some((label) =>
        DRAINAGE_KEYWORDS.some((k) => label.includes(k)),
      )
    ) {
      return true;
    }
  }
  return false;
}

// ---------- Region times ----------

function getTimes(region: "north" | "south") {
  if (region === "north") {
    return { briefing_time: "09:00~09:10", morning_time: "09:10~12:00" };
  }
  return { briefing_time: "09:20~09:30", morning_time: "09:30~12:00" };
}

// ---------- computeUnInspected ----------

export interface UnInspectedSummary {
  shortKeys: string[];
  fullLabels: string[];
}

export function computeUnInspected(req: InspectionRequest): UnInspectedSummary {
  const seen = new Set<string>();
  for (const day of req.days) {
    for (const g of day.groups) {
      for (const c of [...g.morningContents, ...g.afternoonContents]) {
        if (c.shortKey) seen.add(c.shortKey);
      }
    }
  }
  const remaining: string[] = [];
  const fullLabels: string[] = [];
  for (const item of ITEM_BY_SHORT_KEY.values()) {
    if (!seen.has(item.shortKey)) {
      remaining.push(item.shortKey);
      fullLabels.push(item.fullLabel);
    }
  }
  return { shortKeys: remaining, fullLabels };
}

// ---------- Day-table builders ----------

interface DayBuildContext {
  projectName: string;
  dayIndex: number; // 1-based
  versionText: string;
  date: string;
  briefingTime: string;
  morningTime: string;
  meetingTime: string;
  morningGroups: RenderedGroup[];
  afternoonGroups: RenderedGroup[];
  note: string;
  isUnpublished: boolean;
}

function makeTitleRow(ctx: DayBuildContext): TableRow {
  return new TableRow({
    children: [
      makeCell({
        text: `『${ctx.projectName}』機電消防公設檢驗時間表-${ctx.dayIndex}${ctx.versionText}`,
        width: TOTAL_WIDTH,
        colSpan: 6,
      }),
    ],
  });
}

function makeHeaderRow(): TableRow {
  return new TableRow({
    tableHeader: true,
    children: [
      makeCell({ text: "日期", width: COL_WIDTHS[0]! }),
      makeCell({ text: "時程", width: COL_WIDTHS[1]! }),
      makeCell({ text: "時間", width: COL_WIDTHS[2]! }),
      makeCell({ text: "檢驗分組", width: COL_WIDTHS[3]! }),
      makeCell({ text: "檢驗內容", width: COL_WIDTHS[4]! }),
      makeCell({ text: "配合檢測人員", width: COL_WIDTHS[5]! }),
    ],
  });
}

interface DateMergeState {
  isFirst: boolean;
}

function dateCell(state: DateMergeState, dateText: string): TableCell {
  if (state.isFirst) {
    state.isFirst = false;
    return makeCell({
      text: dateText,
      width: COL_WIDTHS[0]!,
      verticalMerge: VerticalMergeType.RESTART,
    });
  }
  return makeCell({
    width: COL_WIDTHS[0]!,
    verticalMerge: VerticalMergeType.CONTINUE,
  });
}

function makeDataRows(ctx: DayBuildContext): TableRow[] {
  const rows: TableRow[] = [];
  const dateState: DateMergeState = { isFirst: true };

  // Briefing row -> "上午" RESTART
  rows.push(
    new TableRow({
      children: [
        dateCell(dateState, ctx.date),
        makeCell({
          text: "上午",
          width: COL_WIDTHS[1]!,
          verticalMerge: VerticalMergeType.RESTART,
        }),
        makeCell({ text: ctx.briefingTime, width: COL_WIDTHS[2]! }),
        makeCell({ text: "流程說明", width: COL_WIDTHS[3]! }),
        makeCell({
          text: "公設查證流程說明及編組人員介紹",
          width: COL_WIDTHS[4]!,
          align: AlignmentType.LEFT,
        }),
        makeCell({ text: "", width: COL_WIDTHS[5]! }),
      ],
    }),
  );

  // Morning groups -> "上午" CONTINUE
  for (const g of ctx.morningGroups) {
    rows.push(
      new TableRow({
        children: [
          dateCell(dateState, ctx.date),
          makeCell({
            width: COL_WIDTHS[1]!,
            verticalMerge: VerticalMergeType.CONTINUE,
          }),
          makeCell({ text: ctx.morningTime, width: COL_WIDTHS[2]! }),
          makeCell({ text: g.group, width: COL_WIDTHS[3]! }),
          makeCell({
            bullets: g.contentItems,
            width: COL_WIDTHS[4]!,
            align: AlignmentType.LEFT,
          }),
          makeCell({ text: g.people, width: COL_WIDTHS[5]! }),
        ],
      }),
    );
  }

  // Lunch row
  rows.push(
    new TableRow({
      children: [
        dateCell(dateState, ctx.date),
        makeCell({ text: "中午", width: COL_WIDTHS[1]! }),
        makeCell({ text: "12:00~13:00", width: COL_WIDTHS[2]! }),
        makeCell({
          text: "午休時間",
          width: COL_WIDTHS[3]! + COL_WIDTHS[4]! + COL_WIDTHS[5]!,
          colSpan: 3,
        }),
      ],
    }),
  );

  // Afternoon groups -> "下午" RESTART on first, CONTINUE on rest
  let afternoonRestartUsed = false;
  for (const g of ctx.afternoonGroups) {
    const merge: VerticalMergeValue = afternoonRestartUsed
      ? VerticalMergeType.CONTINUE
      : VerticalMergeType.RESTART;
    const text = afternoonRestartUsed ? "" : "下午";
    afternoonRestartUsed = true;
    rows.push(
      new TableRow({
        children: [
          dateCell(dateState, ctx.date),
          makeCell({
            text,
            width: COL_WIDTHS[1]!,
            verticalMerge: merge,
          }),
          makeCell({ text: "13:00~16:30", width: COL_WIDTHS[2]! }),
          makeCell({ text: g.group, width: COL_WIDTHS[3]! }),
          makeCell({
            bullets: g.contentItems,
            width: COL_WIDTHS[4]!,
            align: AlignmentType.LEFT,
          }),
          makeCell({ text: g.people, width: COL_WIDTHS[5]! }),
        ],
      }),
    );
  }

  // Meeting row
  rows.push(
    new TableRow({
      children: [
        dateCell(dateState, ctx.date),
        afternoonRestartUsed
          ? makeCell({
              width: COL_WIDTHS[1]!,
              verticalMerge: VerticalMergeType.CONTINUE,
            })
          : makeCell({
              text: "下午",
              width: COL_WIDTHS[1]!,
              verticalMerge: VerticalMergeType.RESTART,
            }),
        makeCell({ text: ctx.meetingTime, width: COL_WIDTHS[2]! }),
        makeCell({ text: "查證說明會", width: COL_WIDTHS[3]! }),
        makeCell({
          text: "當天查證重要缺失說明",
          width: COL_WIDTHS[4]!,
          align: AlignmentType.LEFT,
        }),
        makeCell({ text: "", width: COL_WIDTHS[5]! }),
      ],
    }),
  );

  return rows;
}

// ---------- Notes row (auto-generated) ----------

function buildNotesParas(ctx: DayBuildContext): Paragraph[] {
  const paras: Paragraph[] = [];

  paras.push(
    makeText("備註：實際檢驗時間因檢驗缺失狀況調整", AlignmentType.LEFT),
  );
  if (ctx.note) {
    ctx.note
      .split("\n")
      .filter(Boolean)
      .forEach((l) => paras.push(makeText(l, AlignmentType.LEFT)));
  }

  paras.push(makeText("各項設備測試注意事項：", AlignmentType.LEFT));

  const baseNotices = ctx.dayIndex === 1 ? NOTICE_FULL : NOTICE_SIMPLE;
  baseNotices.forEach((text) =>
    paras.push(makeText(text, AlignmentType.LEFT)),
  );

  const hasDrainage =
    hasDrainageInRendered(ctx.morningGroups) ||
    hasDrainageInRendered(ctx.afternoonGroups);
  if (hasDrainage) {
    const nextNum = baseNotices.length + 1;
    paras.push(
      makeText(`${nextNum}. ${NOTICE_DRAINAGE}`, AlignmentType.LEFT),
    );
  }

  if (ctx.isUnpublished) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: "此時程為預定排程，實際行程依初勘調整為準",
            font: FONT,
            size: FONT_SIZE,
            bold: true,
            color: "FF0000",
          }),
        ],
      }),
    );
  }

  return paras;
}

function makeNotesRow(ctx: DayBuildContext): TableRow {
  return new TableRow({
    children: [
      makeCell({
        paragraphs: buildNotesParas(ctx),
        width: TOTAL_WIDTH,
        colSpan: 6,
        align: AlignmentType.LEFT,
      }),
    ],
  });
}

function buildDayTable(ctx: DayBuildContext): Table {
  const rows: TableRow[] = [
    makeTitleRow(ctx),
    makeHeaderRow(),
    ...makeDataRows(ctx),
    makeNotesRow(ctx),
  ];

  return new Table({
    columnWidths: COL_WIDTHS,
    rows,
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
  });
}

export async function generateInspectionDocx(
  req: InspectionRequest,
): Promise<Buffer> {
  const times = getTimes(req.region);
  const versionText = req.isUnpublished ? "(未出刊版本)" : "";

  const children: (Table | Paragraph)[] = [];

  req.days.forEach((d, idx) => {
    const morningGroups = renderGroups(d.groups, "morning");
    const afternoonGroups = renderGroups(d.groups, "afternoon");

    const ctx: DayBuildContext = {
      projectName: req.projectName,
      dayIndex: idx + 1,
      versionText,
      date: formatDate(d.date),
      briefingTime: times.briefing_time,
      morningTime: times.morning_time,
      meetingTime: "16:40~17:00",
      morningGroups,
      afternoonGroups,
      note: d.note ?? "",
      isUnpublished: req.isUnpublished,
    };

    children.push(buildDayTable(ctx));

    if (idx < req.days.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE, bold: true },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 567,
              bottom: 232,
              left: 232,
              right: 232,
              gutter: 227,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
