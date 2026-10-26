"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowUpRight, AtSign, Command, CornerDownLeft, FolderGit2, Hash, Sparkles, Terminal, Waves } from "lucide-react";
import { getContent, type Locale } from "@/data/i18n";
import { openAssistant } from "@/lib/agent/assistant";
import { rememberLanguage } from "@/lib/visitor";
import { motionAllowed, openPalette, PALETTE_EVENT, setMotionEnabled, toast } from "./motion-preference";
import { unlockSecret } from "./secrets";

type PaletteItem = {
  id: string;
  group: "Navigate" | "Projects" | "Actions" | "Elsewhere";
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void;
};

function jump(hash: string) {
  const target = document.querySelector(hash);
  if (!target) return;
  const details = target.closest("details");
  if (details && !details.open) details.open = true;
  target.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "start" });
  history.replaceState(null, "", hash);
}

// Subsequence match with a bonus for word starts — small, predictable, and good enough for ~30 items.
function score(query: string, text: string) {
  if (!query) return 1;
  const haystack = text.toLowerCase();
  let position = -1;
  let total = 0;
  for (const character of query.toLowerCase()) {
    const next = haystack.indexOf(character, position + 1);
    if (next < 0) return 0;
    total += next === position + 1 ? 3 : 1;
    if (next === 0 || haystack[next - 1] === " ") total += 2;
    position = next;
  }
  return total;
}

const groupIcons = {
  Navigate: Hash,
  Projects: FolderGit2,
  Actions: Sparkles,
  Elsewhere: ArrowUpRight
};

export function CommandPalette({ locale = "en" }: { locale?: Locale }) {
  const { identity, projects, socialLinks, ui } = getContent(locale);
  const copy = ui.palette;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  // Items are rebuilt on each open: labels such as the motion toggle read live browser state.
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo<PaletteItem[]>(() => {
    if (!isOpen) return [];
    return [
      ...copy.sections.map(([label, hash, keywords]) => ({ id: `nav-${hash}`, group: "Navigate" as const, label, hint: hash, keywords, run: () => jump(hash) })),
      ...projects.filter((project) => project.enabled).map((project) => ({
        id: `project-${project.slug}`,
        group: "Projects" as const,
        label: project.title,
        hint: project.category,
        keywords: project.technologies.join(" "),
        run: () => jump(`#project-${project.slug}`)
      })),
      {
        id: "copy-email",
        group: "Actions",
        label: copy.copyEmail,
        hint: identity.email,
        keywords: "contact mail",
        run: () => {
          navigator.clipboard?.writeText(identity.email).then(
            () => toast(copy.copied(identity.email)),
            () => toast(copy.copyManual(identity.email))
          );
        }
      },
      {
        id: "terminal",
        group: "Actions",
        label: copy.console,
        hint: copy.consoleHint,
        keywords: "ai assistant agent chat ask terminal cli shell run",
        run: openAssistant
      },
      {
        id: "motion",
        group: "Actions",
        label: motionAllowed() ? copy.motionOff : copy.motionOn,
        hint: copy.motionHint,
        keywords: "reduce animation accessibility",
        run: () => {
          const next = !motionAllowed();
          setMotionEnabled(next);
          toast(next ? copy.motionOnToast : copy.motionOffToast);
        }
      },
      {
        id: "language",
        group: "Actions",
        label: copy.language,
        hint: copy.languageHint,
        keywords: "language arabic english عربي لغة",
        run: () => {
          rememberLanguage(ui.nav.language.hrefLang);
          window.location.href = ui.nav.language.href;
        }
      },
      ...socialLinks.map((link) => ({
        id: `social-${link.platform}`,
        group: "Elsewhere" as const,
        label: link.platform === "Email" ? copy.sendEmail : copy.open(link.label),
        hint: link.audience ?? link.href.replace(/^mailto:|https?:\/\/(www\.)?/g, ""),
        keywords: "social follow",
        run: () => {
          if (link.href.startsWith("mailto:")) window.location.href = link.href;
          else window.open(link.href, "_blank", "noopener,noreferrer");
        }
      }))
    ];
  }, [isOpen, copy, identity, projects, socialLinks, ui.nav.language.href, ui.nav.language.hrefLang]);

  const results = useMemo(() => items
    .map((item) => ({ item, rank: score(query, `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`) }))
    .filter((entry) => entry.rank > 0)
    .sort((a, b) => (query ? b.rank - a.rank : 0))
    .map((entry) => entry.item), [items, query]);

  useEffect(() => {
    function open() {
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;
      setQuery("");
      setActiveIndex(0);
      setIsOpen(true);
      dialog.showModal();
      inputRef.current?.focus();
      unlockSecret("palette");
    }
    function handleKey(event: KeyboardEvent) {
      const typing = (event.target as Element | null)?.closest("input, textarea, [contenteditable='true']");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else open();
      } else if (event.key === "/" && !typing && !dialogRef.current?.open) {
        event.preventDefault();
        open();
      }
    }
    window.addEventListener(PALETTE_EVENT, open);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener(PALETTE_EVENT, open);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function execute(item: PaletteItem | undefined) {
    if (!item) return;
    dialogRef.current?.close();
    window.setTimeout(item.run, 30);
  }

  function handleInputKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + direction + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      execute(results[activeIndex]);
    }
  }

  const activeId = results[activeIndex] ? `palette-option-${results[activeIndex].id}` : undefined;

  return (
    <dialog
      ref={dialogRef}
      className="palette"
      aria-label={copy.dialog}
      onClose={() => setIsOpen(false)}
      onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}
    >
      <div className="palette__panel">
        <div className="palette__search">
          <Command size={17} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label={copy.search}
            placeholder={copy.placeholder}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
            onKeyDown={handleInputKey}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>esc</kbd>
        </div>
        <ul id="palette-results" className="palette__results" role="listbox" aria-label={copy.results}>
          {results.length === 0 ? <li className="palette__empty" role="presentation">{copy.empty}</li> : null}
          {results.map((item, index) => {
            const Icon = groupIcons[item.group];
            const heading = !query && item.group !== results[index - 1]?.group ? item.group : null;
            return (
              <li key={item.id} role="presentation">
                {heading ? <p className="palette__group" aria-hidden="true">{copy.groups[heading]}</p> : null}
                <div
                  id={`palette-option-${item.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className="palette__option"
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => execute(item)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.hint ? <small>{item.hint}</small> : null}
                  {index === activeIndex ? <CornerDownLeft className="palette__enter" size={14} aria-hidden="true" /> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="palette__foot"><Terminal size={13} aria-hidden="true" /> {copy.tip} <kbd>/</kbd> {copy.anywhere} <Waves size={13} aria-hidden="true" /> {copy.secret} <AtSign size={13} aria-hidden="true" /><span dir="ltr">{identity.email}</span></p>
      </div>
    </dialog>
  );
}

export function PaletteTrigger({ className = "", locale = "en" }: { className?: string; locale?: Locale }) {
  return (
    <button type="button" className={`palette-trigger ${className}`} onClick={openPalette} aria-label={getContent(locale).ui.palette.trigger} dir="ltr">
      <Command size={14} aria-hidden="true" />
      <span aria-hidden="true">K</span>
    </button>
  );
}
