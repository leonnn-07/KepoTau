import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getCompletionRule } from "@/lib/queries";
import { RETENTION_HOURS } from "@/lib/videos";
import { signOut } from "../actions";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />
      <section className="glass mb-5 p-5 sm:p-6">
        <h2 className="font-semibold">Automatic file cleanup</h2>
        <p className="mb-5 mt-1 text-sm text-muted">
          Choose which publication event completes a video. {RETENTION_HOURS} hours after that event the MP4 is
          permanently deleted from storage by the scheduled cleanup job. Unposted videos are never deleted, and the
          title, caption, hashtags and posting history are always kept.
        </p>
        <Suspense fallback={<div className="skeleton h-44" />}>
          <RuleForm />
        </Suspense>
        <p className="mt-4 text-xs text-faint">
          Changing this re-evaluates videos that still have their file. A schedule that already started is never
          shortened, and a newly completed video always gets at least {RETENTION_HOURS} hours.
        </p>
      </section>
      <section className="glass p-5 sm:p-6">
        <h2 className="font-semibold">Account</h2>
        <Suspense fallback={<div className="skeleton mt-3 h-10" />}>
          <Account />
        </Suspense>
      </section>
    </div>
  );
}

async function RuleForm() {
  const rule = await getCompletionRule();
  return <SettingsForm rule={rule} />;
}

async function Account() {
  const { user } = await requireUser();
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm">
        <p className="text-muted">Signed in as</p>
        <p className="font-medium">{user.email}</p>
      </div>
      <form action={signOut}>
        <button type="submit" className="btn btn-ghost">
          Sign out
        </button>
      </form>
    </div>
  );
}
