import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface UnsavedChangesConfirmModalProps {
  isOpen: boolean;
  isSaving?: boolean;
  isSaveDisabled?: boolean;
  entityLabel?: string;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export const UnsavedChangesConfirmModal = ({
  isOpen,
  isSaving = false,
  isSaveDisabled = false,
  entityLabel = "item",
  onCancel,
  onDiscard,
  onSave,
}: UnsavedChangesConfirmModalProps) =>
  createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[180] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onCancel}
            aria-label="Keep editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl border border-amber-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] overflow-hidden"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <AlertTriangle className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Unsaved Changes
                </h3>
                <p className="text-xs text-slate-600">
                  Do you want to save changes to this {entityLabel}?
                </p>
              </div>
            </div>

            <div className="px-5 py-4 text-sm text-slate-700">
              If you discard, your recent edits will be lost.
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={onDiscard}
                disabled={isSaving}
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving || isSaveDisabled}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
