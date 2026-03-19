import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Shield,
  StickyNote,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { useState } from "react";
import { cleanHTML } from "@/components/common/RichTextEditor/utils/formatting";
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
  savingSection:
    | "summary"
    | "scope"
    | "constraints"
    | "requirements"
    | "notes"
    | null;
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
  const [draftSummary, setDraftSummary] = useState(summaryHtml);
  const [draftScope, setDraftScope] = useState(scopeHtml);
  const [draftConstraints, setDraftConstraints] = useState(constraintsHtml);
  const [draftRequirements, setDraftRequirements] = useState(requirementsHtml);
  const [draftNotes, setDraftNotes] = useState(notesHtml);

  const handleSaveSummary = async () => {
    await onSaveSummary(cleanHTML(draftSummary));
    setEditingSummary(false);
  };

  const handleSaveScope = async () => {
    await onSaveScope(cleanHTML(draftScope));
    setEditingScope(false);
  };

  const handleSaveConstraints = async () => {
    await onSaveConstraints(cleanHTML(draftConstraints));
    setEditingConstraints(false);
  };

  const handleSaveRequirements = async () => {
    await onSaveRequirements(cleanHTML(draftRequirements));
    setEditingRequirements(false);
  };

  const handleSaveNotes = async () => {
    await onSaveNotes(cleanHTML(draftNotes));
    setEditingNotes(false);
  };

  return (
    <div className="w-full">
      <header className="pb-3 mt-1 space-y-3 mb-8">
        <h1 className="text-[28px] font-semibold text-gray-900 uppercase tracking-wide leading-tight">
          {projectTitle}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-md text-[13px] text-primary">
            <span className="font-semibold mr-1.5">Client:</span>
            <span className="opacity-70 font-medium">{clientName ?? "—"}</span>
          </div>
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 rounded-md text-[13px] text-primary">
            <span className="font-semibold mr-1.5">Consultant:</span>
            <span className="opacity-70 font-medium">
              {consultantName ?? "—"}
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-8 pl-4 md:pl-8">
        {/* Project Summary */}
        <section className="pb-7 border-b border-gray-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5 min-h-[32px]">
              <h2 className="text-[18px] font-semibold text-gray-900 leading-none">
                Project Summary
              </h2>
              {canEdit && !editingSummary && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftSummary(summaryHtml);
                    setEditingSummary(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canEdit && editingSummary && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftSummary(summaryHtml);
                      setEditingSummary(false);
                    }}
                    disabled={savingSection === "summary"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveSummary()}
                    disabled={savingSection === "summary"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingSection === "summary" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="text-[13px] text-gray-600 leading-6 space-y-3">
              <EditableRichSection
                value={summaryHtml}
                placeholder="Write the project summary..."
                emptyText="No summary added yet."
                isSaving={savingSection === "summary"}
                isEditing={editingSummary}
                draft={draftSummary}
                setDraft={setDraftSummary}
              />
            </div>
          </div>
        </section>

        {/* Scope */}
        <section className="pb-7 border-b border-gray-200 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5 min-h-[32px]">
              <h2 className="text-[18px] font-semibold text-gray-900 leading-none">
                Scope
              </h2>
              {canEdit && !editingScope && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftScope(scopeHtml);
                    setEditingScope(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canEdit && editingScope && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftScope(scopeHtml);
                      setEditingScope(false);
                    }}
                    disabled={savingSection === "scope"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveScope()}
                    disabled={savingSection === "scope"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingSection === "scope" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="text-[13px] text-gray-600 leading-6 space-y-3">
              <EditableRichSection
                value={scopeHtml}
                placeholder="Write the scope statement..."
                emptyText="No scope statement added yet."
                isSaving={savingSection === "scope"}
                isEditing={editingScope}
                draft={draftScope}
                setDraft={setDraftScope}
              />
            </div>
          </div>
        </section>

        {/* Constraints */}
        <section className="pb-7 border-b border-gray-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5 min-h-[32px]">
              <h2 className="text-[18px] font-semibold text-gray-900 leading-none">
                Constraints
              </h2>
              {canEdit && !editingConstraints && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftConstraints(constraintsHtml);
                    setEditingConstraints(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canEdit && editingConstraints && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftConstraints(constraintsHtml);
                      setEditingConstraints(false);
                    }}
                    disabled={savingSection === "constraints"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveConstraints()}
                    disabled={savingSection === "constraints"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingSection === "constraints" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="text-[13px] text-gray-600 leading-6 space-y-3 bg-gray-100/70 px-3 py-2.5 rounded-md">
              <EditableRichSection
                value={constraintsHtml}
                placeholder="Write constraints..."
                emptyText="No constraints added yet."
                isSaving={savingSection === "constraints"}
                isEditing={editingConstraints}
                draft={draftConstraints}
                setDraft={setDraftConstraints}
              />
            </div>
          </div>
        </section>

        {/* Core Requirements */}
        <section className="pb-7 border-b border-gray-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5 min-h-[32px]">
              <h2 className="text-[18px] font-semibold text-gray-900 leading-none">
                Core Requirements
              </h2>
              {canEdit && !editingRequirements && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftRequirements(requirementsHtml);
                    setEditingRequirements(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canEdit && editingRequirements && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftRequirements(requirementsHtml);
                      setEditingRequirements(false);
                    }}
                    disabled={savingSection === "requirements"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveRequirements()}
                    disabled={savingSection === "requirements"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingSection === "requirements" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="text-[13px] text-gray-600 leading-6 space-y-3">
              <EditableRichSection
                value={requirementsHtml}
                placeholder="Describe core requirements..."
                emptyText="No requirements listed yet."
                isSaving={savingSection === "requirements"}
                isEditing={editingRequirements}
                draft={draftRequirements}
                setDraft={setDraftRequirements}
              />
            </div>
          </div>
        </section>

        {/* Project Notes */}
        <section className="pb-7 border-b border-gray-200 flex items-start gap-3">
          <StickyNote className="w-5 h-5 text-primary shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2.5 min-h-[32px]">
              <h2 className="text-[18px] font-semibold text-gray-900 leading-none">
                Project Notes
              </h2>
              {canEdit && !editingNotes && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftNotes(notesHtml);
                    setEditingNotes(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {canEdit && editingNotes && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftNotes(notesHtml);
                      setEditingNotes(false);
                    }}
                    disabled={savingSection === "notes"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveNotes()}
                    disabled={savingSection === "notes"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {savingSection === "notes" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="text-[13px] text-gray-600 leading-6 space-y-3">
              <EditableRichSection
                value={notesHtml}
                placeholder="Write project notes..."
                emptyText="No notes added yet."
                isSaving={savingSection === "notes"}
                isEditing={editingNotes}
                draft={draftNotes}
                setDraft={setDraftNotes}
              />
            </div>
          </div>
        </section>

        {/* Risk Register */}
        <section className="pb-2 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2.5 min-h-[32px]">
              <h2 className="text-[18px] font-semibold text-gray-900 leading-none">
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
          </div>
        </section>
      </div>
    </div>
  );
}
