import { useState, useRef, useEffect, useCallback } from "react";
import { Menu } from "@base-ui/react/menu";
import type { TaxReturn, PendingUpload } from "../lib/schema";
import type { NavItem } from "../lib/types";
import { ReceiptView } from "./ReceiptView";
import { SummaryStats } from "./SummaryStats";
import { SummaryTable } from "./SummaryTable";
import { SummaryReceiptView } from "./SummaryReceiptView";
import { LoadingView } from "./LoadingView";

interface CommonProps {
  isChatOpen: boolean;
  onToggleChat: () => void;
  navItems: NavItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

interface ReceiptProps extends CommonProps {
  view: "receipt";
  data: TaxReturn;
  title: string;
}

interface SummaryProps extends CommonProps {
  view: "summary";
  returns: Record<number, TaxReturn>;
}

interface LoadingProps extends CommonProps {
  view: "loading";
  pendingUpload: PendingUpload;
}

type Props = ReceiptProps | SummaryProps | LoadingProps;

type SummaryViewMode = "table" | "receipt";

const ITEM_WIDTH = 70; // Approximate width per nav item in pixels
const OVERFLOW_BUTTON_WIDTH = 40;

export function MainPanel(props: Props) {
  const [summaryViewMode, setSummaryViewMode] = useState<SummaryViewMode>("table");
  const [visibleCount, setVisibleCount] = useState(props.navItems.length);
  const navRef = useRef<HTMLElement>(null);

  const calculateVisibleItems = useCallback(() => {
    if (!navRef.current) return;
    const availableWidth = navRef.current.offsetWidth;
    const maxItems = Math.floor((availableWidth - OVERFLOW_BUTTON_WIDTH) / ITEM_WIDTH);
    setVisibleCount(Math.max(1, Math.min(props.navItems.length, maxItems)));
  }, [props.navItems.length]);

  useEffect(() => {
    calculateVisibleItems();
    const observer = new ResizeObserver(calculateVisibleItems);
    if (navRef.current) {
      observer.observe(navRef.current);
    }
    return () => observer.disconnect();
  }, [calculateVisibleItems]);

  const visibleItems = props.navItems.slice(0, visibleCount);
  const overflowItems = props.navItems.slice(visibleCount);
  const hasOverflow = overflowItems.length > 0;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Header */}
      <header className="h-12 px-6 flex items-center justify-between flex-shrink-0 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <span className="text-sm font-medium flex-shrink-0">Taxes</span>
          <nav ref={navRef} className="flex items-center gap-1 flex-1 min-w-0">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => props.onSelect(item.id)}
                className={`px-2 py-1 text-sm flex-shrink-0 ${
                  props.selectedId === item.id
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {item.label}
              </button>
            ))}
            {hasOverflow && (
              <Menu.Root>
                <Menu.Trigger className="px-2 py-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex-shrink-0">
                  ···
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner className="z-50">
                    <Menu.Popup className="bg-[var(--color-bg)] border border-[var(--color-border)] shadow-lg py-1 min-w-[120px]">
                      {overflowItems.map((item) => (
                        <Menu.Item
                          key={item.id}
                          onClick={() => props.onSelect(item.id)}
                          className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-[var(--color-bg-muted)] outline-none ${
                            props.selectedId === item.id
                              ? "text-[var(--color-text)]"
                              : "text-[var(--color-text-muted)]"
                          }`}
                        >
                          {item.label}
                        </Menu.Item>
                      ))}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            )}
          </nav>
        </div>
        {!props.isChatOpen && (
          <button
            onClick={props.onToggleChat}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex-shrink-0"
          >
            Chat
          </button>
        )}
      </header>

      {/* Content */}
      {props.view === "loading" ? (
        <LoadingView
          filename={props.pendingUpload.filename}
          year={props.pendingUpload.year}
          status={props.pendingUpload.status}
        />
      ) : props.view === "summary" ? (
        summaryViewMode === "table" ? (
          <div className="flex-1 flex flex-col min-h-0">
            <SummaryStats returns={props.returns} />
            <div className="flex-1 min-h-0">
              <SummaryTable returns={props.returns} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <SummaryReceiptView returns={props.returns} />
          </div>
        )
      ) : props.view === "receipt" ? (
        <div className="flex-1 overflow-y-auto">
          <ReceiptView data={props.data} />
        </div>
      ) : null}
    </div>
  );
}
