import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileDown, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import {
  INSPECTION_ITEMS,
  itemsForCategory,
  type CategoryKey,
} from "@/lib/inspection-content";
import {
  type DayState,
  type GroupData,
  type GroupType,
  TYPE_TO_CATEGORY,
  adjustGroupArray,
  buildLabel,
  buildRequest,
  computeUnInspected,
  emptyDay,
} from "@/lib/inspection-state";

type Half = "morning" | "afternoon";

const TYPE_ORDER: GroupType[] = ["mech", "elev", "fire"];

function getKeysField(g: GroupData, half: Half): string[] {
  return half === "morning" ? g.morningKeys : g.afternoonKeys;
}
function setKeysField(g: GroupData, half: Half, value: string[]): GroupData {
  return half === "morning"
    ? { ...g, morningKeys: value }
    : { ...g, afternoonKeys: value };
}
function getCustomField(g: GroupData, half: Half): string[] {
  return half === "morning" ? g.morningCustom : g.afternoonCustom;
}
function setCustomField(g: GroupData, half: Half, value: string[]): GroupData {
  return half === "morning"
    ? { ...g, morningCustom: value }
    : { ...g, afternoonCustom: value };
}
function setExtraPeopleField(
  g: GroupData,
  half: Half,
  value: string,
): GroupData {
  return half === "morning"
    ? { ...g, morningExtraPeople: value }
    : { ...g, afternoonExtraPeople: value };
}

function GroupCard({
  groupLabel,
  type,
  group,
  globalCheckedKeys,
  onChange,
}: {
  groupLabel: string;
  type: GroupType;
  group: GroupData;
  globalCheckedKeys: Set<string>;
  onChange: (next: GroupData) => void;
}) {
  const category: CategoryKey = TYPE_TO_CATEGORY[type];
  const items = useMemo(() => itemsForCategory(category), [category]);

  const renderHalf = (half: Half) => {
    const selectedKeys = new Set(getKeysField(group, half));
    const customs = getCustomField(group, half);
    const extra =
      half === "morning"
        ? group.morningExtraPeople
        : group.afternoonExtraPeople;

    const toggleKey = (key: string, checked: boolean) => {
      const next = new Set(selectedKeys);
      if (checked) next.add(key);
      else next.delete(key);
      onChange(setKeysField(group, half, Array.from(next)));
    };

    const updateCustom = (idx: number, value: string) => {
      const arr = [...customs];
      arr[idx] = value;
      onChange(setCustomField(group, half, arr));
    };
    const addCustom = () => {
      onChange(setCustomField(group, half, [...customs, ""]));
    };
    const removeCustom = (idx: number) => {
      onChange(setCustomField(group, half, customs.filter((_, i) => i !== idx)));
    };

    return (
      <div className="space-y-3 rounded-lg border bg-card/50 p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">
            {half === "morning" ? "上午查驗內容" : "下午查驗內容"}
          </h4>
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-auto rounded-md border bg-background p-2">
          {items.map((item) => {
            const id = `${groupLabel}-${half}-${item.shortKey}`;
            const isCheckedGlobally = globalCheckedKeys.has(item.shortKey);
            return (
              <label
                key={id}
                htmlFor={id}
                className="flex items-start gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-accent text-sm leading-snug"
              >
                <Checkbox
                  id={id}
                  checked={selectedKeys.has(item.shortKey)}
                  onCheckedChange={(c) =>
                    toggleKey(item.shortKey, c === true)
                  }
                  className="mt-0.5 shrink-0"
                />
                <span className="flex-1 min-w-0">{item.fullLabel}</span>
                {isCheckedGlobally ? (
                  <span className="shrink-0 text-xs font-medium text-green-600 whitespace-nowrap">
                    ✅ 已勾選
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    ⬜ 未勾選
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              自訂新增查驗內容
            </Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addCustom}
              className="h-7 px-2 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" /> 新增
            </Button>
          </div>
          {customs.map((c, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={c}
                onChange={(e) => updateCustom(idx, e.target.value)}
                placeholder="例如：自訂查驗項目..."
                className="text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeCustom(idx)}
                className="h-9 w-9 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            額外新增配合檢測人員（每行一位，會與自動對應合併去重）
          </Label>
          <Textarea
            value={extra}
            onChange={(e) =>
              onChange(setExtraPeopleField(group, half, e.target.value))
            }
            placeholder="例如：監造單位"
            rows={2}
            className="text-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-muted/20">
      <CardHeader className="py-3">
        <CardTitle className="text-base">{groupLabel}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {renderHalf("morning")}
        {renderHalf("afternoon")}
      </CardContent>
    </Card>
  );
}

function DayCard({
  day,
  dayIndex,
  runningStart,
  globalCheckedKeys,
  onChange,
}: {
  day: DayState;
  dayIndex: number;
  runningStart: { mech: number; elev: number; fire: number };
  globalCheckedKeys: Set<string>;
  onChange: (next: DayState) => void;
}) {
  const updateCount = (type: GroupType, count: number) => {
    const safe = Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
    if (type === "mech") {
      onChange({
        ...day,
        mechCount: safe,
        mechGroups: adjustGroupArray(day.mechGroups, safe),
      });
    } else if (type === "elev") {
      onChange({
        ...day,
        elevCount: safe,
        elevGroups: adjustGroupArray(day.elevGroups, safe),
      });
    } else {
      onChange({
        ...day,
        fireCount: safe,
        fireGroups: adjustGroupArray(day.fireGroups, safe),
      });
    }
  };

  const updateGroup = (type: GroupType, idx: number, next: GroupData) => {
    if (type === "mech") {
      const arr = [...day.mechGroups];
      arr[idx] = next;
      onChange({ ...day, mechGroups: arr });
    } else if (type === "elev") {
      const arr = [...day.elevGroups];
      arr[idx] = next;
      onChange({ ...day, elevGroups: arr });
    } else {
      const arr = [...day.fireGroups];
      arr[idx] = next;
      onChange({ ...day, fireGroups: arr });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge>第 {dayIndex + 1} 天</Badge>
          <span className="text-base font-semibold text-muted-foreground">
            設定日期、組數與查驗內容
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label>日期</Label>
            <Input
              type="date"
              value={day.date}
              onChange={(e) => onChange({ ...day, date: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>機電組數</Label>
            <Input
              type="number"
              min={0}
              value={day.mechCount}
              onChange={(e) => updateCount("mech", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>電梯組數</Label>
            <Input
              type="number"
              min={0}
              value={day.elevCount}
              onChange={(e) => updateCount("elev", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>消防組數</Label>
            <Input
              type="number"
              min={0}
              value={day.fireCount}
              onChange={(e) => updateCount("fire", Number(e.target.value))}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {TYPE_ORDER.map((type) => {
            const groups =
              type === "mech"
                ? day.mechGroups
                : type === "elev"
                  ? day.elevGroups
                  : day.fireGroups;
            const start =
              type === "mech"
                ? runningStart.mech
                : type === "elev"
                  ? runningStart.elev
                  : runningStart.fire;
            return groups.map((g, idx) => (
              <GroupCard
                key={`${type}-${idx}`}
                type={type}
                groupLabel={buildLabel(type, start + idx + 1)}
                group={g}
                globalCheckedKeys={globalCheckedKeys}
                onChange={(next) => updateGroup(type, idx, next)}
              />
            ));
          })}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label>備註</Label>
          <Textarea
            value={day.note}
            onChange={(e) => onChange({ ...day, note: e.target.value })}
            placeholder="此處內容會輸出在備註區"
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function adjustDays(arr: DayState[], count: number): DayState[] {
  const next = arr.slice(0, count);
  while (next.length < count) {
    next.push(emptyDay());
  }
  return next;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function InspectionForm() {
  const [projectName, setProjectName] = useState("英倫公園");
  const [region, setRegion] = useState<"north" | "south">("north");
  const [isUnpublished, setIsUnpublished] = useState(false);
  const [totalDays, setTotalDays] = useState(1);
  const [days, setDays] = useState<DayState[]>(() => [emptyDay()]);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const runningStarts = useMemo(() => {
    let mech = 0,
      elev = 0,
      fire = 0;
    return days.map((d) => {
      const start = { mech, elev, fire };
      mech += d.mechGroups.length;
      elev += d.elevGroups.length;
      fire += d.fireGroups.length;
      return start;
    });
  }, [days]);

  const allCheckedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const day of days) {
      for (const g of [
        ...day.mechGroups,
        ...day.elevGroups,
        ...day.fireGroups,
      ]) {
        g.morningKeys.forEach((k) => s.add(k));
        g.afternoonKeys.forEach((k) => s.add(k));
      }
    }
    return s;
  }, [days]);

  const request = useMemo(
    () => buildRequest(projectName, region, isUnpublished, days),
    [projectName, region, isUnpublished, days],
  );
  const unInspected = useMemo(() => computeUnInspected(request), [request]);

  const updateTotalDays = (n: number) => {
    const safe = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    setTotalDays(safe);
    setDays((prev) => adjustDays(prev, safe));
  };

  const updateDay = (idx: number, next: DayState) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? next : d)));
  };

  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg(null);
    setDownloadSuccess(false);
    setGenerating(true);
    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/inspection/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const blob = await res.blob();
      const filename = `${projectName}_機電消防公設檢驗時間表${
        isUnpublished ? "_未出刊版本" : ""
      }.docx`;
      downloadBlob(blob, filename);
      setDownloadSuccess(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleContinueEditing = () => {
    setDownloadSuccess(false);
  };

  const handleReset = () => {
    setProjectName("");
    setRegion("north");
    setIsUnpublished(false);
    setTotalDays(1);
    setDays([emptyDay()]);
    setDownloadSuccess(false);
    setErrorMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalScheduledItems = INSPECTION_ITEMS.length - unInspected.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">機電消防公設檢驗時間表產生器</h1>
            <p className="text-xs text-muted-foreground">
              填寫完成後可匯出 Word（依模板格式）
            </p>
          </div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !projectName.trim()}
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                產生中...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                匯出 Word
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {errorMsg && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="py-3 text-sm text-destructive">
              匯出失敗：{errorMsg}
            </CardContent>
          </Card>
        )}

        {downloadSuccess && (
          <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">已成功下載 Word</span>
                <span className="text-sm text-muted-foreground">
                  您的所有設定已保留，可繼續修改或重新開始
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleContinueEditing}
                >
                  繼續修改
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  重新開始
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>整體設定</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-2">
              <Label>案場名稱</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例如：英倫公園、景安文匯"
              />
            </div>
            <div className="space-y-1.5">
              <Label>區域</Label>
              <RadioGroup
                value={region}
                onValueChange={(v) => setRegion(v as "north" | "south")}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="north" id="r-north" />
                  <Label htmlFor="r-north" className="font-normal cursor-pointer">
                    北部案場
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="south" id="r-south" />
                  <Label htmlFor="r-south" className="font-normal cursor-pointer">
                    中南部案場
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <Label>未出刊版本</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={isUnpublished}
                  onCheckedChange={setIsUnpublished}
                  id="unpublished"
                />
                <Label htmlFor="unpublished" className="font-normal cursor-pointer">
                  {isUnpublished ? "標題會加上（未出刊版本）" : "正式版本"}
                </Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>總天數</Label>
              <Input
                type="number"
                min={1}
                value={totalDays}
                onChange={(e) => updateTotalDays(Number(e.target.value))}
              />
            </div>
            <div className="lg:col-span-3 text-sm text-muted-foreground self-end">
              <span className="font-medium text-foreground">時間規則：</span>
              {region === "north"
                ? "流程說明 09:00~09:10／上午檢驗 09:10~12:00"
                : "流程說明 09:20~09:30／上午檢驗 09:30~12:00"}
              ；午休 12:00~13:00；下午 13:00~16:30；查證說明會 16:40~17:00。
            </div>
          </CardContent>
        </Card>

        {days.map((d, i) => (
          <DayCard
            key={i}
            day={d}
            dayIndex={i}
            runningStart={runningStarts[i] ?? { mech: 0, elev: 0, fire: 0 }}
            globalCheckedKeys={allCheckedKeys}
            onChange={(next) => updateDay(i, next)}
          />
        ))}

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Badge variant={unInspected.length === 0 ? "default" : "destructive"}>
                最終未檢驗項目（{unInspected.length} 項）
              </Badge>
              <span className="text-sm font-normal text-muted-foreground">
                已排定 {totalScheduledItems} / {INSPECTION_ITEMS.length} 項
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unInspected.length === 0 ? (
              <p className="text-sm text-muted-foreground">最終未檢驗項目：無</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {unInspected.map((item) => (
                  <li key={item.shortKey} className="flex gap-2">
                    <Badge variant="outline" className="shrink-0">
                      {item.category}
                    </Badge>
                    <span>{item.fullLabel}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end pb-12">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !projectName.trim()}
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                產生中...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                匯出 Word
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
