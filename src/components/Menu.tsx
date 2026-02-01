import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ReactNode } from "react";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

type TriggerVariant = "button" | "inline";

interface MenuProps {
  trigger: ReactNode;
  triggerClassName?: string;
  triggerVariant?: TriggerVariant;
  children: ReactNode;
  popupClassName?: string;
  side?: Side;
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
}

interface MenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}

const triggerButtonClassName =
  "p-1.5 rounded-lg text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-bg-muted) data-[popup-open]:text-(--color-text) data-[popup-open]:bg-(--color-bg-muted)";

const triggerInlineClassName =
  "text-(--color-text-muted) flex items-center gap-1 hover:text-(--color-text) data-[popup-open]:text-(--color-text) cursor-pointer";

const popupBaseClassName =
  "menu-popup bg-(--color-bg) border border-(--color-border) rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 py-1.5";

const itemBaseClassName =
  "menu-item mx-1.5 px-2.5 py-1.5 text-sm cursor-pointer rounded-lg outline-none text-(--color-text-muted) flex items-center gap-2.5 select-none";

export function Menu({
  trigger,
  triggerClassName,
  triggerVariant = "button",
  children,
  popupClassName,
  side,
  align,
  sideOffset,
  alignOffset,
}: MenuProps) {
  const baseClassName =
    triggerVariant === "inline" ? triggerInlineClassName : triggerButtonClassName;

  const positionerProps = {
    className: "z-50",
    ...(side !== undefined && { side }),
    ...(align !== undefined && { align }),
    ...(sideOffset !== undefined && { sideOffset }),
    ...(alignOffset !== undefined && { alignOffset }),
  };

  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        className={
          triggerClassName
            ? `${baseClassName} ${triggerClassName}`
            : baseClassName
        }
      >
        {trigger}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner {...positionerProps}>
          <BaseMenu.Popup
            className={
              popupClassName
                ? `${popupBaseClassName} ${popupClassName}`
                : popupBaseClassName
            }
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export function MenuItem({
  children,
  onClick,
  className,
  selected,
}: MenuItemProps) {
  return (
    <BaseMenu.Item
      onClick={onClick}
      className={`${itemBaseClassName} ${selected ? "text-(--color-text) font-medium" : ""} ${className ?? ""}`}
    >
      {children}
    </BaseMenu.Item>
  );
}
