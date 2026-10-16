import { useId, type ReactNode } from 'react';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  hideLabel?: boolean;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel,
}: SegmentedProps<T>) {
  const id = useId();
  return (
    <div className="field">
      <span id={id} className={hideLabel ? 'sr-only' : 'field-label'}>
        {label}
      </span>
      <div className="segmented" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className="segmented-option"
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SelectProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Select<T extends string>({ id, label, value, options, onChange }: SelectProps<T>) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ToggleProps {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ id, label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-track" aria-hidden="true" />
      <span className="toggle-text">
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
      </span>
    </label>
  );
}

interface SliderProps {
  id: string;
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onChange: (v: number) => void;
}

export function Slider({ id, label, value, min, max, step = 1, display, onChange }: SliderProps) {
  return (
    <div className="slider">
      <label htmlFor={id} className="slider-head">
        <span>{label}</span>
        <output htmlFor={id} className="mono">
          {display ?? value}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Panel({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section className={`panel ${className ?? ''}`} aria-labelledby={id}>
      <header className="panel-head">
        <h2 id={id}>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}
