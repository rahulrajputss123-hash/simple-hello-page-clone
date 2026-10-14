import { type ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Shared bottom sheet component with consistent styling across the app.
 * Matches the tuned style from OfferFilterButton: rounded-t-3xl, drag handle,
 * max-h-[85dvh], smooth slide-up animation, safe-area padding.
 */
export function AppBottomSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`flex max-h-[85dvh] flex-col rounded-t-3xl ${className}`}
        style={{
          animation: "slide-up 200ms ease-out",
          willChange: "transform",
        }}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-12 shrink-0 rounded-full bg-muted" />

        <SheetHeader className="shrink-0">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-4">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div
            className="shrink-0 border-t pt-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
