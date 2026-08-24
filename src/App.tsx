import { Check, GripHorizontal, PaintBucket, Plane, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ColorDecision,
  ColorMethodConfig,
  contrastRatio,
  defaultColorMethodConfig,
  getOklchDecision,
  getWcagRgbDecision,
  normalizeHex,
  relativeLuminance,
} from "@/lib/color";

const flights = [
  { id: "t0-5689", airline: "T0", number: "5689", from: "GRU", to: "D", lane: 0, start: 70, width: 150 },
  { id: "m3-8511", airline: "M3", number: "8511", from: "SID", to: "I", lane: 1, start: 265, width: 150 },
  { id: "g3-2105", airline: "G3", number: "2105", from: "02", to: "", lane: 2, start: 355, width: 185 },
  { id: "wj-3822", airline: "WJ", number: "3822", from: "03", to: "", lane: 3, start: 415, width: 150 },
  { id: "jj-3086", airline: "JJ", number: "3086", from: "04", to: "", lane: 0, start: 505, width: 150 },
  { id: "g3-1250", airline: "G3", number: "1250", from: "02", to: "", lane: 1, start: 710, width: 150 },
  { id: "jj-3300", airline: "JJ", number: "3300", from: "03", to: "", lane: 2, start: 760, width: 150 },
  { id: "la-0718", airline: "LA", number: "0718", from: "02", to: "", lane: 3, start: 925, width: 150 },
  { id: "ad-2613", airline: "AD", number: "2613", from: "00", to: "", lane: 0, start: 1060, width: 150 },
  { id: "g3-1252", airline: "G3", number: "1252", from: "CGH", to: "D", lane: 1, start: 1245, width: 150 },
];

const stateLabels = [
  { key: "normal", label: "Normal" },
  { key: "hover", label: "Hover" },
  { key: "selected", label: "Selecionado" },
  { key: "active", label: "Clicado" },
  { key: "dragging", label: "Arrastando" },
] as const;

const adjustableStateLabels = stateLabels.slice(1) as Array<(typeof stateLabels)[number] & {
  key: keyof ColorMethodConfig["rgbDarken"];
}>;

const presets = ["#F86D01", "#FE0002", "#1D1478", "#00457C", "#008C95", "#F5D547", "#F7F7F7", "#111111"];

const scenarioColors = [
  { label: "GOL laranja", value: "#F86D01" },
  { label: "GOL vermelho", value: "#FE0002" },
  { label: "LATAM escuro", value: "#1A0F75" },
  { label: "Azul operacional", value: "#00457C" },
  { label: "Azul claro", value: "#9DCEF2" },
  { label: "Verde saturado", value: "#00A870" },
  { label: "Amarelo", value: "#FFC328" },
  { label: "Branco quase puro", value: "#F7F7F7" },
  { label: "Cinza medio", value: "#8A8F98" },
  { label: "Preto quase puro", value: "#111111" },
];

type Method = "wcag" | "oklch";

function App() {
  const [color, setColor] = useState("#1D1478");
  const [typedColor, setTypedColor] = useState("#1D1478");
  const [config, setConfig] = useState<ColorMethodConfig>(defaultColorMethodConfig);

  const normalizedColor = normalizeHex(color);
  const wcagDecision = useMemo(() => getWcagRgbDecision(normalizedColor, config), [normalizedColor, config]);
  const oklchDecision = useMemo(() => getOklchDecision(normalizedColor, config), [normalizedColor, config]);

  function updateColor(nextColor: string) {
    const normalized = normalizeHex(nextColor);
    setColor(normalized);
    setTypedColor(normalized);
  }

  function updateWeight(group: keyof ColorMethodConfig, key: keyof ColorMethodConfig["rgbDarken"], value: number) {
    setConfig((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value,
      },
    }));
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-normal">PoC de cor para blocos de alocação</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Escolha uma cor livre de companhia e compare a geração dos estados em WCAG/RGB e OKLCH.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-2">
              <Label htmlFor="airline-color">Cor da companhia</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="airline-color"
                  type="color"
                  className="h-9 w-14 cursor-pointer p-1"
                  value={normalizedColor}
                  onChange={(event) => updateColor(event.target.value)}
                />
                <Input
                  value={typedColor}
                  onChange={(event) => setTypedColor(event.target.value)}
                  onBlur={() => updateColor(typedColor)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      updateColor(typedColor);
                    }
                  }}
                  className="w-28 font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-muted-foreground/20 p-1"
                  onClick={() => updateColor(preset)}
                  title={preset}
                >
                  <span className="h-5 w-5 rounded-sm border border-black/10" style={{ background: preset }} />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 py-5">
        <Tabs defaultValue="wcag">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList>
              <TabsTrigger value="wcag">WCAG/RGB</TabsTrigger>
              <TabsTrigger value="oklch">OKLCH</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Metric label="Contraste branco" value={`${wcagDecision.whiteContrast.toFixed(2)}:1`} />
              <Metric label="Contraste preto" value={`${wcagDecision.blackContrast.toFixed(2)}:1`} />
              <Metric label="Texto" value={wcagDecision.foreground === "#FFFFFF" ? "branco" : "preto"} />
              <Metric label="OKLCH L" value={oklchDecision.oklch.l.toFixed(3)} />
            </div>
          </div>

          <TabsContent value="wcag">
            <ComparisonPanel
              title="WCAG + interpolação RGB"
              decision={wcagDecision}
              method="wcag"
              config={config}
              onSelectColor={updateColor}
              onUpdateWeight={updateWeight}
              onResetConfig={() => setConfig(defaultColorMethodConfig)}
              description="Escolhe texto por contraste real contra branco/preto. Os estados misturam a cor base com branco ou preto no espaço RGB."
            />
          </TabsContent>

          <TabsContent value="oklch">
            <ComparisonPanel
              title="WCAG + estados em OKLCH"
              decision={oklchDecision}
              method="oklch"
              config={config}
              onSelectColor={updateColor}
              onUpdateWeight={updateWeight}
              onResetConfig={() => setConfig(defaultColorMethodConfig)}
              description="Mantém texto por contraste WCAG, mas clareia ou escurece os estados alterando a luminosidade OKLCH."
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function ComparisonPanel({
  title,
  description,
  decision,
  method,
  config,
  onSelectColor,
  onUpdateWeight,
  onResetConfig,
}: {
  title: string;
  description: string;
  decision: ColorDecision;
  method: Method;
  config: ColorMethodConfig;
  onSelectColor: (color: string) => void;
  onUpdateWeight: (
    group: keyof ColorMethodConfig,
    key: keyof ColorMethodConfig["rgbDarken"],
    value: number,
  ) => void;
  onResetConfig: () => void;
}) {
  const scenarioDecisions = scenarioColors.map((scenario) => ({
    ...scenario,
    decision:
      method === "wcag" ? getWcagRgbDecision(scenario.value, config) : getOklchDecision(scenario.value, config),
  }));

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-md border bg-card p-4 xl:grid-cols-[0.9fr_0.9fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <PaintBucket className="h-4 w-4" />
            {title}
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {decision.notes.map((note) => (
              <span key={note} className="rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                {note}
              </span>
            ))}
          </div>
        </div>

        <MethodControls method={method} config={config} onUpdateWeight={onUpdateWeight} onResetConfig={onResetConfig} />

        <div className="grid gap-2 text-sm">
          <StateRow label="Normal" color={decision.states.normal} foreground={decision.foreground} base={decision.base} />
          <StateRow label="Hover" color={decision.states.hover} foreground={decision.foreground} base={decision.base} />
          <StateRow
            label="Selecionado"
            color={decision.states.selected}
            foreground={decision.foreground}
            base={decision.base}
          />
          <StateRow label="Clicado" color={decision.states.active} foreground={decision.foreground} base={decision.base} />
          <StateRow
            label="Arrastando"
            color={decision.states.dragging}
            foreground={decision.foreground}
            base={decision.base}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Timeline decision={decision} method={method} config={config} />
        <div className="grid gap-4">
          <StateGallery decision={decision} />
          <DecisionRulesPanel decision={decision} method={method} />
        </div>
      </div>

      <ScenarioBench scenarios={scenarioDecisions} onSelectColor={onSelectColor} />
    </div>
  );
}

function MethodControls({
  method,
  config,
  onUpdateWeight,
  onResetConfig,
}: {
  method: Method;
  config: ColorMethodConfig;
  onUpdateWeight: (
    group: keyof ColorMethodConfig,
    key: keyof ColorMethodConfig["rgbDarken"],
    value: number,
  ) => void;
  onResetConfig: () => void;
}) {
  if (method === "oklch") {
    return (
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            Calibragem OKLCH
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onResetConfig} title="Resetar calibragem">
            <RotateCcw className="h-3.5 w-3.5" />
            Pesos
          </Button>
        </div>
        <div className="grid gap-3">
          {adjustableStateLabels.map(({ key, label }) => (
            <SliderRow
              key={key}
              label={label}
              value={config.oklchLightness[key]}
              min={0.01}
              max={0.25}
              step={0.005}
              suffix="L"
              onChange={(value) => onUpdateWeight("oklchLightness", key, value)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          Calibragem RGB
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onResetConfig} title="Resetar calibragem">
          <RotateCcw className="h-3.5 w-3.5" />
          Pesos
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="grid gap-3">
          <div className="text-xs font-medium text-muted-foreground">Escurecer com preto</div>
          {adjustableStateLabels.map(({ key, label }) => (
            <SliderRow
              key={key}
              label={label}
              value={config.rgbDarken[key]}
              min={0.02}
              max={0.4}
              step={0.01}
              suffix="%"
              onChange={(value) => onUpdateWeight("rgbDarken", key, value)}
            />
          ))}
        </div>
        <div className="grid gap-3">
          <div className="text-xs font-medium text-muted-foreground">Clarear com branco</div>
          {adjustableStateLabels.map(({ key, label }) => (
            <SliderRow
              key={key}
              label={label}
              value={config.rgbLighten[key]}
              min={0.02}
              max={0.4}
              step={0.01}
              suffix="%"
              onChange={(value) => onUpdateWeight("rgbLighten", key, value)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: "%" | "L";
  onChange: (value: number) => void;
}) {
  const displayValue = suffix === "%" ? `${Math.round(value * 100)}%` : value.toFixed(3);

  return (
    <label className="grid grid-cols-[88px_1fr_48px] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 cursor-pointer px-0 py-0 shadow-none"
      />
      <span className="text-right font-mono">{displayValue}</span>
    </label>
  );
}

function Timeline({
  decision,
  method,
  config,
}: {
  decision: ColorDecision;
  method: Method;
  config: ColorMethodConfig;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showScenarioColors, setShowScenarioColors] = useState(false);

  function resetInteractionState() {
    setHoveredId(null);
    setSelectedId(null);
    setActiveId(null);
    setDraggingId(null);
  }

  function getFlightState(flightId: string): keyof ColorDecision["states"] {
    if (draggingId === flightId) {
      return "dragging";
    }

    if (activeId === flightId) {
      return "active";
    }

    if (selectedId === flightId) {
      return "selected";
    }

    if (hoveredId === flightId) {
      return "hover";
    }

    return "normal";
  }

  return (
    <section className="overflow-x-auto rounded-md border bg-card">
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Plane className="h-4 w-4" />
          Resource allocation
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showScenarioColors ? "default" : "outline"}
            size="sm"
            onClick={() => setShowScenarioColors((current) => !current)}
            title="Alternar cores variadas no grid"
          >
            <PaintBucket className="h-3.5 w-3.5" />
            Cenários
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetInteractionState} title="Resetar estados">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            Search
          </div>
        </div>
      </div>

      <div className="flex border-b bg-muted/35">
        <aside className="w-[205px] shrink-0 border-r px-4 py-3">
          <div className="text-xs font-semibold uppercase">Unallocated</div>
          <div className="mt-1 text-xs text-muted-foreground">281 flights</div>
        </aside>
        <div className="relative h-12 min-w-[1120px] flex-1">
          {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"].map((hour, index) => (
            <div key={hour} className="absolute top-0 h-full border-l px-2 py-2 text-xs text-muted-foreground" style={{ left: index * 160 }}>
              {hour}
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        <aside className="w-[205px] shrink-0 border-r bg-muted/20">
          {["Patio principal", "Belt 02", "Patio remoto", "Belt 03", "Restituicao de bagagem", "Belt 04", "Sala de embarque", "Belt 01"].map(
            (row, index) => (
              <div key={row} className="flex h-12 items-center justify-between border-b px-4 text-xs">
                <span className={index % 2 === 0 ? "font-semibold uppercase" : "font-semibold"}>{row}</span>
                <span className="text-muted-foreground">{index % 2 === 0 ? "" : "0 D"}</span>
              </div>
            ),
          )}
        </aside>

        <div className="relative h-96 min-w-[1120px] flex-1 overflow-hidden bg-grid">
          {flights.map((flight, index) => {
            const top = 24 + flight.lane * 33 + Math.floor(index / 5) * 120;
            const scenario = scenarioColors[index % scenarioColors.length];
            const blockDecision = showScenarioColors
              ? getDecisionForTimelineScenario(method, config, scenario.value)
              : decision;

            return (
              <FlightBlock
                key={flight.id}
                flight={flight}
                state={getFlightState(flight.id)}
                decision={blockDecision}
                interactive
                onPointerEnter={() => setHoveredId(flight.id)}
                onPointerLeave={() => {
                  setHoveredId((current) => (current === flight.id ? null : current));
                  setActiveId((current) => (current === flight.id ? null : current));
                }}
                onPointerDown={() => setActiveId(flight.id)}
                onPointerUp={() => setActiveId((current) => (current === flight.id ? null : current))}
                onClick={() => setSelectedId(flight.id)}
                onDragStart={() => {
                  setDraggingId(flight.id);
                  setSelectedId(flight.id);
                  setActiveId(null);
                }}
                onDragEnd={() => {
                  setDraggingId((current) => (current === flight.id ? null : current));
                  setActiveId(null);
                }}
                style={{
                  left: flight.start,
                  top,
                  width: flight.width,
                }}
                label={showScenarioColors ? scenario.label : undefined}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getDecisionForTimelineScenario(method: Method, config: ColorMethodConfig, color: string) {
  return method === "oklch" ? getOklchDecision(color, config) : getWcagRgbDecision(color, config);
}

function FlightBlock({
  flight,
  state,
  decision,
  style,
  interactive = false,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onClick,
  onDragStart,
  onDragEnd,
  label,
}: {
  flight: (typeof flights)[number];
  state: keyof ColorDecision["states"];
  decision: ColorDecision;
  style: React.CSSProperties;
  interactive?: boolean;
  onPointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: React.PointerEventHandler<HTMLButtonElement>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onDragStart?: React.DragEventHandler<HTMLButtonElement>;
  onDragEnd?: React.DragEventHandler<HTMLButtonElement>;
  label?: string;
}) {
  const background = decision.states[state];
  const isDragging = state === "dragging";
  const isSelected = state === "selected";
  const ratio = contrastRatio(background, decision.foreground);

  return (
    <button
      type="button"
      draggable={interactive}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="absolute flex h-6 items-center justify-between gap-2 rounded-[3px] px-2 text-[10px] font-bold shadow-sm transition-[background-color,box-shadow,transform,outline-color]"
      style={{
        ...style,
        background,
        color: decision.foreground,
        outline: isSelected ? `2px solid ${decision.foreground}` : "none",
        outlineOffset: isSelected ? "2px" : 0,
        boxShadow: isDragging ? "0 10px 22px rgba(15, 23, 42, 0.28)" : undefined,
        transform: isDragging ? "translateY(-4px)" : undefined,
        cursor: interactive ? (isDragging ? "grabbing" : "grab") : undefined,
      }}
      title={`${label ? `${label} - ` : ""}${state}: contraste ${ratio.toFixed(2)}:1`}
    >
      <span className="flex min-w-0 items-center gap-1">
        {isDragging ? <GripHorizontal className="h-3 w-3 shrink-0" /> : <Plane className="h-3 w-3 shrink-0" />}
        <span className="truncate">
          {flight.airline} {flight.number}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 font-semibold opacity-95">
        {flight.from}
        {flight.to ? <span>{flight.to}</span> : <span className="rounded-[2px] border px-1 leading-3">P</span>}
      </span>
    </button>
  );
}

function ScenarioBench({
  scenarios,
  onSelectColor,
}: {
  scenarios: Array<{ label: string; value: string; decision: ColorDecision }>;
  onSelectColor: (color: string) => void;
}) {
  return (
    <section className="rounded-md border bg-card p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Bancada de cenários</div>
          <div className="text-xs text-muted-foreground">Cores claras, escuras, saturadas e neutras na mesma régua.</div>
        </div>
        <div className="text-xs text-muted-foreground">AA texto pequeno: 4.5:1</div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {scenarios.map(({ label, value, decision }) => {
          const normalContrast = contrastRatio(decision.states.normal, decision.foreground);
          const failedStates = stateLabels.filter(({ key }) => contrastRatio(decision.states[key], decision.foreground) < 4.5);

          return (
            <button
              type="button"
              key={value}
              className="grid gap-3 rounded-md border bg-background p-3 text-left transition-colors hover:bg-accent"
              onClick={() => onSelectColor(value)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">{label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{value}</div>
                </div>
                <span className="h-8 w-8 shrink-0 rounded-sm border" style={{ background: value }} />
              </div>

              <div className="flex flex-wrap gap-1">
                {stateLabels.map(({ key, label: stateLabel }) => (
                  <span
                    key={key}
                    className="h-6 min-w-16 rounded-[3px] px-2 py-1 text-center text-[10px] font-bold"
                    style={{
                      background: decision.states[key],
                      color: decision.foreground,
                    }}
                    title={`${stateLabel}: ${decision.states[key]}`}
                  >
                    {stateLabel}
                  </span>
                ))}
              </div>

              <div className="grid gap-1 text-[11px] text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span>Texto</span>
                  <span className="font-mono text-foreground">
                    {decision.foreground === "#FFFFFF" ? "branco" : "preto"} {normalContrast.toFixed(2)}:1
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>OKLCH</span>
                  <span className="font-mono text-foreground">
                    L {decision.oklch.l.toFixed(3)} C {decision.oklch.c.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Fallback</span>
                  <span className={failedStates.length ? "font-medium text-red-700" : "font-medium text-emerald-700"}>
                    {failedStates.length ? `${failedStates.length} estado(s)` : "nao precisa"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StateGallery({ decision }: { decision: ColorDecision }) {
  return (
    <section className="rounded-md border bg-card p-4">
      <div className="text-sm font-semibold">Estados isolados</div>
      <div className="mt-3 grid gap-3">
        {stateLabels.map(({ key, label }) => (
          <div key={key} className="grid gap-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{label}</span>
              <span className="font-mono">{decision.states[key]}</span>
            </div>
            <FlightBlock
              flight={flights[4]}
              state={key}
              decision={decision}
              style={{
                position: "relative",
                left: 0,
                top: 0,
                width: "100%",
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function DecisionRulesPanel({ decision, method }: { decision: ColorDecision; method: Method }) {
  const foregroundLabel = decision.foreground === "#FFFFFF" ? "branco" : "preto";
  const minContrast = Math.min(...stateLabels.map(({ key }) => contrastRatio(decision.states[key], decision.foreground)));

  return (
    <section className="rounded-md border bg-card p-4">
      <div className="text-sm font-semibold">Régua candidata</div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <RuleRow label="Texto principal" value={`preto/branco por contraste; atual: ${foregroundLabel}`} />
        <RuleRow label="Texto secundário" value="mesmo foreground com menor peso visual, sem trocar matiz" />
        <RuleRow
          label="Estados"
          value={method === "wcag" ? "mix RGB calibrado por estado" : "delta de lightness OKLCH por estado"}
        />
        <RuleRow label="Contraste mínimo" value={`menor estado atual: ${minContrast.toFixed(2)}:1`} />
        <RuleRow label="Exceções" value="marcas com texto forçado devem virar lista explícita" />
        <RuleRow label="Fallback" value="se estado cair abaixo de 4.5:1, reduzir delta ou voltar para cor base" />
      </div>
    </section>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[108px_1fr] gap-2">
      <span className="font-medium text-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StateRow({
  label,
  color,
  foreground,
  base,
}: {
  label: string;
  color: string;
  foreground: ColorDecision["foreground"];
  base: string;
}) {
  const contrast = contrastRatio(color, foreground);
  const luminance = relativeLuminance(color);
  const luminanceDelta = luminance - relativeLuminance(base);

  return (
    <div className="grid grid-cols-[105px_1fr_152px] items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-8 rounded-md border" style={{ background: color }} />
      <div className="flex items-center justify-end gap-2 text-xs">
        {contrast >= 4.5 ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : null}
        <span className="font-mono">{contrast.toFixed(2)}:1</span>
        <span className="font-mono text-muted-foreground">
          L {luminance.toFixed(4)}
          {Math.abs(luminanceDelta) > 0.0001 ? ` ${luminanceDelta > 0 ? "+" : ""}${luminanceDelta.toFixed(4)}` : ""}
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-card px-2.5 py-1">
      <span>{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </span>
  );
}

export default App;
