import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Shield,
  StickyNote,
} from "lucide-react";
import { EditableRichSection } from "./EditableRichSection";

interface OverviewContentProps {
  projectTitle: string;
  clientName?: string;
  consultantName?: string;

  summaryHtml: string;
  scopeHtml: string;
  constraintsHtml: string;
  requirementsHtml: string;
  notesHtml: string;
  risks: string[];

  canEdit: boolean;
  savingSection: "summary" | "scope" | "constraints" | "requirements" | "notes" | null;
  editingSummary: boolean;
  editingScope: boolean;
  editingConstraints: boolean;
  editingRequirements: boolean;
  editingNotes: boolean;

  setEditingSummary: (v: boolean) => void;
  setEditingScope: (v: boolean) => void;
  setEditingConstraints: (v: boolean) => void;
  setEditingRequirements: (v: boolean) => void;
  setEditingNotes: (v: boolean) => void;

  onSaveSummary: (value: string) => Promise<void>;
  onSaveScope: (value: string) => Promise<void>;
  onSaveConstraints: (value: string) => Promise<void>;
  onSaveRequirements: (value: string) => Promise<void>;
  onSaveNotes: (value: string) => Promise<void>;
}

export function OverviewContent({
  projectTitle,
  clientName,
  consultantName,
  summaryHtml,
  scopeHtml,
  constraintsHtml,
  requirementsHtml,
  notesHtml,
  risks,
  canEdit,
  savingSection,
  editingSummary,
  editingScope,
  editingConstraints,
  editingRequirements,
  editingNotes,
  setEditingSummary,
  setEditingScope,
  setEditingConstraints,
  setEditingRequirements,
  setEditingNotes,
  onSaveSummary,
  onSaveScope,
  onSaveConstraints,
  onSaveRequirements,
  onSaveNotes,
}: OverviewContentProps) {
  return (
    <div className="space-y-8">
      <header className="pb-1">
        <h1 className="text-[28px] font-semibold text-gray-900 uppercase tracking-wide leading-tight">
          {projectTitle}
        </h1>
        <p className="mt-2 text-[13px] text-gray-500 font-medium">
          Client: {clientName ?? "—"}
          <span className="mx-2">|</span>
          Consultant: {consultantName ?? "—"}
        </p>
      </header>

      {/* Project Summary */}
      <section className="pb-7 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-[18px] font-semibold text-gray-900">
              Project Summary
            </h2>
          </div>
          {canEdit && !editingSummary && (
            <button
              type="button"
              onClick={() => setEditingSummary(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <EditableRichSection
          value={summaryHtml}
          placeholder="Write the project summary..."
          emptyText="No summary added yet."
          isSaving={savingSection === "summary"}
          isEditing={editingSummary}
          onEditingChange={setEditingSummary}
          onSave={onSaveSummary}
        />
      </section>

      {/* Scope & Constraints */}
      <section className="pb-7 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h2 className="text-[18px] font-semibold text-gray-900">
              Scope &amp; Constraints
            </h2>
          </div>
          {canEdit && !editingScope && !editingConstraints && (
            <button
              type="button"
              onClick={() => {
                setEditingScope(true);
                setEditingConstraints(true);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="text-[13px] text-gray-600 leading-6 space-y-3">
          <EditableRichSection
            value={scopeHtml}
            placeholder="Write the scope statement..."
            emptyText="No scope statement added yet."
            isSaving={savingSection === "scope"}
            isEditing={editingScope}
            onEditingChange={setEditingScope}
            onSave={onSaveScope}
          />
          <div className="bg-gray-100/70 px-3 py-2.5 text-[12px] leading-5 text-gray-700">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5 font-semibold">
              Constraints
            </p>
            <EditableRichSection
              value={constraintsHtml}
              placeholder="Write constraints..."
              emptyText="No constraints added yet."
              isSaving={savingSection === "constraints"}
              isEditing={editingConstraints}
              onEditingChange={setEditingConstraints}
              onSave={onSaveConstraints}
            />
          </div>
        </div>
      </section>

      {/* Core Requirements */}
      <section className="pb-7 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-[18px] font-semibold text-gray-900">
              Core Requirements
            </h2>
          </div>
          {canEdit && !editingRequirements && (
            <button
              type="button"
              onClick={() => setEditingRequirements(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <EditableRichSection
          value={requirementsHtml}
          placeholder="Describe core requirements..."
          emptyText="No requirements listed yet."
          isSaving={savingSection === "requirements"}
          isEditing={editingRequirements}
          onEditingChange={setEditingRequirements}
          onSave={onSaveRequirements}
        />
      </section>

      {/* Project Notes */}
      <section className="pb-7 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-indigo-500" />
            <h2 className="text-[18px] font-semibold text-gray-900">
              Project Notes
            </h2>
          </div>
          {canEdit && !editingNotes && (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <EditableRichSection
          value={notesHtml}
          placeholder="Write project notes..."
          emptyText="No notes added yet."
          isSaving={savingSection === "notes"}
          isEditing={editingNotes}
          onEditingChange={setEditingNotes}
          onSave={onSaveNotes}
        />
      </section>

      {/* Risk Register */}
      <section className="pb-2">
        <div className="flex items-center gap-2 mb-2.5">
          <AlertTriangle className="w-4 h-4 text-indigo-500" />
          <h2 className="text-[18px] font-semibold text-gray-900">
            Risk Register
          </h2>
        </div>
        {risks.length > 0 ? (
          <ul className="space-y-1.5 text-[13px] text-gray-700">
            {risks.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-gray-500">No risks logged yet.</p>
        )}
      </section>
    </div>
  );
}
