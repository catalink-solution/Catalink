"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type CustomSelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export type CustomSelectGroup = {
  label: string;
  options: CustomSelectOption[];
};

export type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options?: CustomSelectOption[];
  groups?: CustomSelectGroup[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
};

type FlatOption = CustomSelectOption & { groupLabel?: string };

function flattenOptions(
  options: CustomSelectOption[] | undefined,
  groups: CustomSelectGroup[] | undefined
): FlatOption[] {
  if (groups?.length) {
    return groups.flatMap((g) =>
      g.options.map((o) => ({ ...o, groupLabel: g.label }))
    );
  }
  return options ?? [];
}

export function CustomSelect({
  value,
  onChange,
  options,
  groups,
  placeholder = "Sélectionner…",
  label,
  disabled = false,
  required = false,
  name,
  id: idProp,
  size = "md",
  className = "",
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const autoId = useId();
  const triggerId = idProp ?? autoId;
  const listboxId = `${triggerId}-listbox`;

  const flat = useMemo(() => flattenOptions(options, groups), [options, groups]);
  const selectable = useMemo(() => flat.filter((o) => !o.disabled), [flat]);

  const selected = flat.find((o) => o.value === value) ?? null;
  const displayLabel = selected?.label ?? placeholder;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanelStyle({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(-1);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    updatePanelPosition();
    setOpen(true);
    const idx = selectable.findIndex((o) => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
  }, [disabled, selectable, updatePanelPosition, value]);

  const selectOption = useCallback(
    (opt: FlatOption) => {
      if (opt.disabled) return;
      onChange(opt.value);
      close();
      triggerRef.current?.focus();
    },
    [close, onChange]
  );

  useEffect(() => {
    if (!open) return;

    updatePanelPosition();

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      close();
    }

    function onScrollOrResize() {
      updatePanelPosition();
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [close, open, updatePanelPosition]);

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
    }

    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => {
        if (selectable.length === 0) return -1;
        const next = h < selectable.length - 1 ? h + 1 : 0;
        return next;
      });
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => {
        if (selectable.length === 0) return -1;
        const next = h > 0 ? h - 1 : selectable.length - 1;
        return next;
      });
    }

    if (e.key === "Home") {
      e.preventDefault();
      setHighlight(0);
    }

    if (e.key === "End") {
      e.preventDefault();
      setHighlight(selectable.length - 1);
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlight >= 0 && selectable[highlight]) {
        selectOption(selectable[highlight]);
      }
    }
  }

  const sizeClasses =
    size === "sm"
      ? "min-h-[36px] px-2.5 py-1.5 text-xs"
      : "min-h-[48px] px-3 py-2.5 text-sm";

  function renderOption(opt: FlatOption, indexInSelectable: number) {
    const isSelected = opt.value === value;
    const isHighlighted = indexInSelectable === highlight;
    const optionId = `${listboxId}-opt-${indexInSelectable}`;

    return (
      <li
        key={`${opt.groupLabel ?? "flat"}-${opt.value}-${opt.label}`}
        id={optionId}
        role="option"
        aria-selected={isSelected}
        aria-disabled={opt.disabled || undefined}
        onMouseEnter={() => !opt.disabled && setHighlight(indexInSelectable)}
        onClick={() => selectOption(opt)}
        className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
          opt.disabled
            ? "cursor-not-allowed opacity-40"
            : isHighlighted
              ? "bg-violet-600/20 text-white"
              : isSelected
                ? "bg-violet-600/15 text-violet-100"
                : "text-white/85 hover:bg-violet-600/20"
        }`}
      >
        {opt.icon && <span className="shrink-0 text-violet-300/80">{opt.icon}</span>}
        <span className="min-w-0 flex-1 truncate">{opt.label}</span>
        {isSelected && <Check size={16} className="shrink-0 text-violet-400" aria-hidden />}
      </li>
    );
  }

  let selectableIndex = -1;

  const panel =
    open && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            style={{
              position: "fixed",
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width,
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-xl border border-violet-500/40 bg-[#090B14]/95 shadow-[0_8px_32px_rgba(0,0,0,0.55),0_0_24px_rgba(124,58,237,0.18)] backdrop-blur-xl"
          >
            <ul className="max-h-60 overflow-y-auto p-1.5">
              {groups?.length
                ? groups.map((group) => (
                    <li key={group.label} role="presentation">
                      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-violet-300/50">
                        {group.label}
                      </div>
                      <ul role="presentation">
                        {group.options.map((opt) => {
                          if (!opt.disabled) selectableIndex += 1;
                          const idx = opt.disabled ? -1 : selectableIndex;
                          return renderOption({ ...opt, groupLabel: group.label }, idx);
                        })}
                      </ul>
                    </li>
                  ))
                : flat.map((opt) => {
                    if (!opt.disabled) selectableIndex += 1;
                    const idx = opt.disabled ? -1 : selectableIndex;
                    return renderOption(opt, idx);
                  })}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-white/60">{label}</span>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
          tabIndex={-1}
          aria-hidden
        />
      )}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? label ?? placeholder}
        aria-required={required || undefined}
        aria-activedescendant={
          open && highlight >= 0 ? `${listboxId}-opt-${highlight}` : undefined
        }
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-violet-500/50 bg-[#06080f] text-left text-white shadow-[0_0_0_1px_rgba(124,58,237,0.08),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all outline-none hover:border-violet-500/70 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses}`}
      >
        <span className={`min-w-0 flex-1 truncate ${!selected ? "text-white/40" : ""}`}>
          {selected?.icon && (
            <span className="mr-2 inline-flex align-middle text-violet-300/80">{selected.icon}</span>
          )}
          {displayLabel}
        </span>
        <ChevronDown
          size={size === "sm" ? 14 : 18}
          className={`shrink-0 text-violet-300/70 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {panel}
    </div>
  );
}
