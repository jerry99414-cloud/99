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

type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType];
type VerticalMergeValue = (typeof VerticalMergeType)[keyof typeof VerticalMergeType];

interface CellOpts {
  text?: string;
  bullets?: string[];
  width: number;
  colSpan?: number;
  align?: AlignmentValue;
  verticalMerge?: VerticalMergeValue;
}

function makeText(text: string, align: AlignmentValue = AlignmentType.CENTER): Paragraph {
  return new Paragraph({
    alignment: align,
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
    indent: { left: 360, hanging: 360 },
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
  if (opts.bullets && opts.bullets.length > 0) {
    paragraphs = opts.bullets.map((b) => makeBulletParagraph(b));
  } else {
    const text = opts.text ?? "";
    const align = opts.align ?? AlignmentType.CENTER;
    paragraphs = text === ""
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
    out.push({
      group: g.groupLabel,
      contentItems: contents.map((c) => c.fullLabel),
      people: buildPeopleText(contents, extras),
    });
  }
  return out;
}

function getTimes(region: "north" | "south") {
  if (region === "north") {
    return {
      briefing_time: "09:00~09:10",
      morning_time: "09:10~12:00",
    };
  }
  return {
    briefing_time: "09:20~09:30",
    morning_time: "09:30~12:00",
  };
}

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
  dayIndex: number;
  versionText: string;
  date: string;
  briefingTime: string;
  morningTime: string;
  meetingTime: string;
  morningGroups: RenderedGroup[];
  afternoonGroups: RenderedGroup[];
  note: string;
  notice: string;
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

  // Lunch row -> "中午" single cell (no vertical merge)
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

  // Afternoon groups -> "下午" RESTART on first iteration; CONTINUE on the rest
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

  // Meeting row -> "下午" RESTART (if no afternoon groups) else CONTINUE
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

function makeNotesRow(note: string, notice: string): TableRow {
  const lines = [
    "備註：實際檢驗時間因檢驗缺失狀況調整",
    note,
    "各項設備測試注意事項：",
    notice,
  ]
    .filter((s) => s !== undefined && s !== null)
    .join("\n");

  return new TableRow({
    children: [
      makeCell({
        text: lines,
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
    makeNotesRow(ctx.note, ctx.notice),
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
    const ctx: DayBuildContext = {
      projectName: req.projectName,
      dayIndex: idx + 1,
      versionText,
      date: d.date,
      briefingTime: times.briefing_time,
      morningTime: times.morning_time,
      meetingTime: "16:40~17:00",
      morningGroups: renderGroups(d.groups, "morning"),
      afternoonGroups: renderGroups(d.groups, "afternoon"),
      note: d.note ?? "",
      notice: d.notice ?? "",
    };

    children.push(buildDayTable(ctx));

    // Page break between days (not after the last day)
    if (idx < req.days.length - 1) {
      children.push(
        new Paragraph({
          children: [
            new PageBreak(),
          ],
        }),
      );
    }
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: FONT_SIZE,
            bold: true,
          },
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

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
