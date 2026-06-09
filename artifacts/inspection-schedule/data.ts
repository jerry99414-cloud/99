export type CategoryKey = "機電類" | "電梯類" | "消防類";

export interface InspectionItem {
  shortKey: string;
  fullLabel: string;
  category: CategoryKey;
}

export const INSPECTION_ITEMS: InspectionItem[] = [
  // 機電類
  {
    shortKey: "發電機設備",
    fullLabel:
      "發電機設備(設備外觀及功能檢驗、ATS電源切換測試、低壓電氣盤體電源相序檢驗、發電機室進(排)風機功能檢驗)",
    category: "機電類",
  },
  {
    shortKey: "通風設備",
    fullLabel:
      "通風設備(發電機室進(排)風機、地下室進(排)風主機及導流風機、各層廁所排風機)",
    category: "機電類",
  },
  {
    shortKey: "空調設備",
    fullLabel: "空調設備室內送風機及室外主機設備檢驗",
    category: "機電類",
  },
  {
    shortKey: "中央監控系統",
    fullLabel:
      "中央監控系統(監控主機、門禁系統、緊急壓扣設備、監視系統設備、對講機設備、各項設備I/O監控點檢驗)",
    category: "機電類",
  },
  {
    shortKey: "弱電設備",
    fullLabel: "弱電設備(數位天線、電信機房、梯間弱電箱(電信、網路、電視、監控))",
    category: "機電類",
  },
  {
    shortKey: "噴灌設備查證",
    fullLabel: "噴灌設備查證",
    category: "機電類",
  },
  {
    shortKey: "雨水回收設備查證",
    fullLabel: "雨水回收設備查證",
    category: "機電類",
  },
  {
    shortKey: "車道管制設備",
    fullLabel: "車道管制設備(紅綠燈設備及號誌燈控主機、柵欄機、讀卡機、鐵捲門）",
    category: "機電類",
  },
  {
    shortKey: "公設特殊空間設備功能檢驗",
    fullLabel: "公設特殊空間設備功能檢驗(垃圾廚餘儲藏設備)",
    category: "機電類",
  },
  {
    shortKey: "接地系統",
    fullLabel: "接地系統(電信、動力(電氣)設備、避雷針、發電機)",
    category: "機電類",
  },
  {
    shortKey: "給水設備",
    fullLabel: "給水設備(上(下)水箱管路查證、揚水泵浦、各公設給水設備功能)",
    category: "機電類",
  },
  {
    shortKey: "地下室區域、公設室內空間及外圍景觀燈具功能檢驗",
    fullLabel: "地下室區域、公設室內空間及外圍景觀燈具功能檢驗",
    category: "機電類",
  },
  {
    shortKey: "各棟各樓層梯廳間燈具功能檢驗",
    fullLabel: "各棟各樓層梯廳間燈具功能檢驗",
    category: "機電類",
  },
  {
    shortKey: "插座、電壓、相序功能檢驗及漏電斷路器迴路功能檢驗",
    fullLabel: "插座、電壓、相序功能檢驗及漏電斷路器迴路功能檢驗",
    category: "機電類",
  },
  {
    shortKey: "電氣箱體查證",
    fullLabel: "電氣箱體查證(台電變受電室外配電盤、各樓層低壓配電盤)",
    category: "機電類",
  },
  {
    shortKey: "管線施工品質查證",
    fullLabel: "管線施工品質查證",
    category: "機電類",
  },
  {
    shortKey: "排水設備",
    fullLabel:
      "排水設備(地下室污水及廢水系統、污水及廢水泵浦、各公設排水功能、屋突及地下室排水、複壁內排水查證)",
    category: "機電類",
  },
  {
    shortKey: "泵浦絕緣阻值量測",
    fullLabel: "泵浦絕緣阻值量測(雨水、污水、廢水、揚水泵)",
    category: "機電類",
  },
  // 電梯類
  {
    shortKey: "電梯設備",
    fullLabel: "電梯設備(電梯機坑檢視、電梯昇降道檢視、車廂設備功能檢驗、電梯機房檢驗)",
    category: "電梯類",
  },
  // 消防類
  {
    shortKey: "消防機房及防災中心",
    fullLabel:
      "消防機房及防災中心(警報設備、滅火設備、避難逃生設備、消防搶救上之必要設施)",
    category: "消防類",
  },
  {
    shortKey: "消防水系統設備",
    fullLabel: "消防水系統設備(滅火設備、消防搶救上之必要設施)",
    category: "消防類",
  },
  {
    shortKey: "消防電氣系統設備",
    fullLabel: "消防電氣系統設備(警報設備、避難逃生設備)",
    category: "消防類",
  },
  {
    shortKey: "排煙設備",
    fullLabel: "排煙設備（風量測試）",
    category: "消防類",
  },
  {
    shortKey: "消防無線電通信輔助設備",
    fullLabel: "消防無線電通信輔助設備",
    category: "消防類",
  },
  {
    shortKey: "泡沫放射試驗",
    fullLabel: "泡沫放射試驗（PM13：00）",
    category: "消防類",
  },
];

export const ITEM_BY_SHORT_KEY: Map<string, InspectionItem> = new Map(
  INSPECTION_ITEMS.map((item) => [item.shortKey, item]),
);

// 配合檢測人員自動對應 (依 shortKey)
export const PEOPLE_MAPPING: Record<string, string[]> = {
  發電機設備: ["發電機設備商", "水電承包商"],
  通風設備: ["通風設備商"],
  空調設備: ["空調設備商"],
  中央監控系統: ["中央監控設備商(配合人員需2人)"],
  弱電設備: ["弱電設備商"],
  電梯設備: ["電梯設備商"],
  車道管制設備: ["中央監控設備商(配合人員需2人)"],
  公設特殊空間設備功能檢驗: ["公設空間特殊設備商"],
  接地系統: ["水電承包商"],
  給水設備: ["水電承包商"],
  "地下室區域、公設室內空間及外圍景觀燈具功能檢驗": ["水電承包商"],
  各棟各樓層梯廳間燈具功能檢驗: ["水電承包商"],
  "插座、電壓、相序功能檢驗及漏電斷路器迴路功能檢驗": ["水電承包商"],
  電氣箱體查證: ["水電承包商"],
  管線施工品質查證: ["水電承包商"],
  排水設備: ["水電承包商"],
  泵浦絕緣阻值量測: ["水電承包商"],
  噴灌設備查證: ["噴灌設備商"],
  雨水回收設備查證: ["雨水回收設備商"],
  消防機房及防災中心: ["消防機組設備商"],
  消防水系統設備: ["消防水承包商", "消防水電承包商"],
  消防電氣系統設備: ["消防總機設備商", "消防電承包商"],
  排煙設備: ["消防排煙設備商", "通風設備商"],
  消防無線電通信輔助設備: ["無線電通信輔助設備商"],
  泡沫放射試驗: ["消防水電承包商", "消防水承包商"],
};

export function dedupePreserveOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const trimmed = it.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}
