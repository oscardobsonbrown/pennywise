import type { TaxReturn } from "../lib/schema";
import { ReceiptView } from "./ReceiptView";
import { SummaryStats } from "./SummaryStats";
import { SummaryTable } from "./SummaryTable";

interface ReceiptProps {
  view: "receipt";
  data: TaxReturn;
  title: string;
}

interface SummaryProps {
  view: "summary";
  returns: Record<number, TaxReturn>;
}

type Props = ReceiptProps | SummaryProps;

export function MainPanel(props: Props) {
  const title = props.view === "summary" ? "Summary" : props.title;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="px-6 py-3 border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-bold">{title}</h2>
        {props.view === "receipt" && (
          <span className="text-xs text-[var(--color-muted)]">Compare to</span>
        )}
      </header>

      {props.view === "summary" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <SummaryStats returns={props.returns} />
          <div className="flex-1 overflow-auto">
            <SummaryTable returns={props.returns} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ReceiptView data={props.data} />
        </div>
      )}
    </div>
  );
}
