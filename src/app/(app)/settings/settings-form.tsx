"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Alert } from "@/components/ui";
import type { CompletionRule } from "@/lib/database.types";
import { COMPLETION_RULES } from "@/lib/videos";
import { updateCompletionRule, type FormState } from "../video-actions";

export function SettingsForm({ rule }: { rule: CompletionRule }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateCompletionRule, {});

  return (
    <form action={action} className="space-y-4">
      <fieldset className="grid gap-2.5 sm:grid-cols-2" disabled={pending}>
        <legend className="sr-only">Publication completion event</legend>
        {COMPLETION_RULES.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:border-white/20 has-[:checked]:border-accent/60 has-[:checked]:bg-accent/10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
          >
            <input
              type="radio"
              name="completion_rule"
              value={option.value}
              defaultChecked={option.value === rule}
              className="mt-0.5 size-4 accent-[#7c8cff]"
            />
            <span>
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="mt-0.5 block text-xs text-muted">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {state.error && <Alert>{state.error}</Alert>}
      <div className="flex items-center justify-end gap-3">
        {state.saved && !pending && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-300" role="status">
            <CheckCircle2 className="size-4" /> Saved
          </span>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save
        </button>
      </div>
    </form>
  );
}
