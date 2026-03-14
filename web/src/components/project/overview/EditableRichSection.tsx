import { useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { cleanHTML } from "@/components/common/RichTextEditor/utils/formatting";

export interface EditableRichSectionProps {
  value: string;
  placeholder: string;
  emptyText: string;
  isSaving: boolean;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
  onSave: (value: string) => Promise<void>;
}

export function EditableRichSection({
  value,
  placeholder,
  emptyText,
  isSaving,
  isEditing,
  onEditingChange,
  onSave,
}: EditableRichSectionProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const handleSave = async () => {
    await onSave(cleanHTML(draft));
    onEditingChange(false);
  };

  const hasContent = Boolean(value.trim());

  if (isEditing) {
    return (
      <div className="space-y-3">
        <RichTextEditor
          value={draft}
          onChange={setDraft}
          placeholder={placeholder}
          minHeight="120px"
          maxHeight="320px"
          tools={[
            "textFormat",
            "bold",
            "italic",
            "more",
            "separator",
            "bulletList",
            "numberedList",
            "separator",
            "link",
          ]}
          disabled={isSaving}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              onEditingChange(false);
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasContent ? (
        <div
          className="text-[13px] text-gray-600 leading-6 max-w-none wrap-break-word [&_p]:my-0 [&_p+_p]:mt-3 [&_a]:text-blue-600 [&_a]:underline [&_strong]:font-semibold [&_b]:font-semibold [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <p className="text-[13px] text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}
