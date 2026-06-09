export type CategoryKey = "機電類" | "電梯類" | "消防類";

export interface InspectionItem {
  shortKey: string;
  fullLabel: string;
  category: CategoryKey;
}

export const INSPECTION_ITEMS: InspectionItem[] = [
  { shortKey: "發電機設備", fullLabel: "發電機設備(設備外觀及功能檢驗、ATS電源切換測試、低壓電氣盤體電源相序檢驗、發電機室進(排)風機功能檢驗)", category: "機電類" },
  { shortKey: "通風設備", fullLabel: "通風設備(發電機室進(排)風機、地下室進(排)風主機及導流風機、各層廁所排風機)", category: "機電類" },
  { shortKey: "空調設備", fullLabel: "空調設備室內送風機及室外主機設備檢驗", category: "機電類" },
  { shortKey: "中央監控系統", fullLabel: "中央監控系統(監控主機、門禁系統、緊急壓扣設備、監視系統設備、對講機設備、各項設備I/O監控點檢驗)", category: "機電類" },
  { shortKey: "弱電設備", fullLabel: "弱電設備(數位天線、電信機房、梯間弱電箱(電信、網路、電視、監控))", category: "機電類" },
  { shortKey: "噴灌設備查證", fullLabel: "噴灌設備查證", category: "機電類" },
  { shortKey: "雨水回收設備查證", fullLabel: "雨水回收設備查證", category: "機電類" },
  { shortKey: "車道管制設備", fullLabel: "車道管制設備(紅綠燈設備及號誌燈控主機、柵欄機、讀卡機、鐵捲門）", category: "機電類" },
  { shortKey: "公設特殊空間設備功能檢驗", fullLabel: "公設特殊空間設備功能檢驗(垃圾廚餘儲藏設備)", category: "機電類" },
  { shortKey: "接地系統", fullLabel: "接地系統(電信、動力(電氣)設備、避雷針、發電機)", category: "機電類" },
  { shortKey: "給水設備", fullLabel: "給水設備(上(下)水箱管路查證、揚水泵浦、各公設給水設備功能)", category: "機電類" },
  { shortKey: "地下室區域、公設室內空間及外圍景觀燈具功能檢驗", fullLabel: "地下室區域、公設室內空間及外圍景觀燈具功能檢驗", category: "機電類" },
  { shortKey: "各棟各樓層梯廳間燈具功能檢驗", fullLabel: "各棟各樓層梯廳間燈具功能檢驗", category: "機電類" },
  { shortKey: "插座、電壓、相序功能檢驗及漏電斷路器迴路功能檢驗", fullLabel: "插座、電壓、相序功能檢驗及漏電斷路器迴路功能檢驗", category: "機電類" },
  { shortKey: "電氣箱體查證", fullLabel: "電氣箱體查證(台電變受電室外配電盤、各樓層低壓配電盤)", category: "機電類" },
  { shortKey: "管線施工品質查證", fullLabel: "管線施工品質查證", category: "機電類" },
  { shortKey: "排水設備", fullLabel: "排水設備(地下室污水及廢水系統、污水及廢水泵浦、各公設排水功能、屋突及地下室排水、複壁內排水查證)", category: "機電類" },
  { shortKey: "泵浦絕緣阻值量測", fullLabel: "泵浦絕緣阻值量測(雨水、污水、廢水、揚水泵)", category: "機電類" },
  { shortKey: "電梯設備", fullLabel: "電梯設備(電梯機坑檢視、電梯昇降道檢視、車廂設備功能檢驗、電梯機房檢驗)", category: "電梯類" },
  { shortKey: "消防機房及防災中心", fullLabel: "消防機房及防災中心(警報設備、滅火設備、避難逃生設備、消防搶救上之必要設施)", category: "消防類" },
  { shortKey: "消防水系統設備", fullLabel: "消防水系統設備(滅火設備、消防搶救上之必要設施)", category: "消防類" },
  { shortKey: "消防電氣系統設備", fullLabel: "消防電氣系統設備(警報設備、避難逃生設備)", category: "消防類" },
  { shortKey: "排煙設備", fullLabel: "排煙設備（風量測試）", category: "消防類" },
  { shortKey: "消防無線電通信輔助設備", fullLabel: "消防無線電通信輔助設備", category: "消防類" },
  { shortKey: "泡沫放射試驗", fullLabel: "泡沫放射試驗（PM13：00）", category: "消防類" },
];

export function itemsForCategory(cat: CategoryKey): InspectionItem[] {
  return INSPECTION_ITEMS.filter((i) => i.category === cat);
}

export const DEFAULT_NOTICE = `1. 發電機功能測試(ATS斷電測試)公設區域停電需提前公告，預計於上午9點30分開始斷電測試，測試時間約為１個小時，測試時間會因現場檢驗缺失狀況有所增減調整。
2. 電梯昇降設備配合發電機測試時電梯管制及開放時間需提前公告，預計於上午9點30分前管制完成，管制時間約為１個小時，管制時間會因現場檢驗缺失狀況有所增減調整。
3. 消防設備測試時會發出警報聲響,泡沫放射區域淨空，需提前公告告知住戶。
4. 以上項目當天測試設備前會全棟廣播通知。
5. 請提前通知各系統設備廠商當天務必到場配合檢驗。
6. 當天檢驗前請先將所有機房門扇、往屋突頂樓人孔蓋及屋頂,地下室水箱蓋全部開啟。
7. 空調系統檢驗天花板內設備請廠商先備妥符合勞安規定之上下設備(如施工架,高空作業車…等)。`;
