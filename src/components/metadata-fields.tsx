"use client";

import { useState } from "react";
import { parseHashtags } from "@/lib/videos";

export type MetadataDefaults = {
  title?: string;
  caption?: string;
  hashtags?: string;
  notes?: string;
  category?: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-300">
      {message}
    </p>
  );
}

/** Title, caption, hashtags, notes and category inputs, shared by upload and edit. */
export function MetadataFields({
  defaults = {},
  categories,
  errors = {},
  disabled,
}: {
  defaults?: MetadataDefaults;
  categories: string[];
  errors?: Record<string, string>;
  disabled?: boolean;
}) {
  const [caption, setCaption] = useState(defaults.caption ?? "");
  const [hashtags, setHashtags] = useState(defaults.hashtags ?? "");
  const parsed = parseHashtags(hashtags);

  return (
    <fieldset disabled={disabled} className="space-y-4 disabled:opacity-70">
      <div>
        <label htmlFor="title" className="label">
          Title <span className="text-red-300">*</span>
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={defaults.title}
          className="input"
          placeholder="e.g. Morning coffee routine"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="caption" className="label">
            Caption
          </label>
          <span className={`text-xs tabular-nums ${caption.length > 2200 ? "text-amber-300" : "text-faint"}`}>
            {caption.length}/2200
          </span>
        </div>
        <textarea
          id="caption"
          name="caption"
          rows={5}
          maxLength={5000}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="input resize-y leading-relaxed"
          placeholder="Write the caption you'll paste into Instagram and TikTok…"
          aria-describedby={errors.caption ? "caption-error" : undefined}
        />
        {caption.length > 2200 && (
          <p className="mt-1 text-xs text-amber-300">Instagram and TikTok captions are limited to about 2,200 characters.</p>
        )}
        <FieldError id="caption-error" message={errors.caption} />
      </div>

      <div>
        <label htmlFor="hashtags" className="label">
          Hashtags
        </label>
        <input
          id="hashtags"
          name="hashtags"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          className="input"
          placeholder="#coffee #morning routine"
          autoComplete="off"
          autoCapitalize="off"
        />
        {parsed.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Hashtag preview">
            {parsed.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">
            Category
          </label>
          <input
            id="category"
            name="category"
            list="category-options"
            maxLength={60}
            defaultValue={defaults.category}
            className="input"
            placeholder="e.g. Tutorial"
            autoComplete="off"
            aria-describedby={errors.category ? "category-error" : undefined}
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <FieldError id="category-error" message={errors.category} />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label">
          Notes <span className="font-normal text-faint">(private)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={5000}
          defaultValue={defaults.notes}
          className="input resize-y"
          placeholder="Posting ideas, music, best time to post…"
          aria-describedby={errors.notes ? "notes-error" : undefined}
        />
        <FieldError id="notes-error" message={errors.notes} />
      </div>
    </fieldset>
  );
}
