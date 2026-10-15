import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Tracker, { type RiwayatMinggu } from "@/components/Tracker";
import type { DayCode } from "@/lib/data";
import type { Settings } from "@/lib/fasting";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: week, error } = await supabase.rpc("active_week");
  if (error || !week) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-bold">Database belum siap</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Jalankan file <code className="rounded bg-stone-200 px-1 dark:bg-stone-800">supabase/schema.sql</code> di
          Supabase SQL Editor, lalu muat ulang halaman ini.
        </p>
        {error && <pre className="mt-4 overflow-x-auto rounded-lg bg-stone-100 p-3 text-xs dark:bg-stone-900">{error.message}</pre>}
      </main>
    );
  }

  const [settingsRes, checklistRes, waterRes, historyRes] = await Promise.all([
    supabase.from("settings").select("program_start, kamis_flex, notifications").eq("user_id", user.id).single(),
    supabase.from("checklist").select("item_key, done").eq("week_id", week.id),
    supabase.from("water").select("day_code, glasses").eq("week_id", week.id),
    supabase
      .from("weeks")
      .select("id, started_at, ended_at, done_count, total_count, percentage")
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(12),
  ]);

  const checks: Record<string, boolean> = {};
  for (const row of checklistRes.data ?? []) checks[row.item_key] = row.done;

  const water: Partial<Record<DayCode, number>> = {};
  for (const row of waterRes.data ?? []) water[row.day_code as DayCode] = row.glasses;

  const settings: Settings = settingsRes.data ?? {
    program_start: new Date().toISOString().slice(0, 10),
    kamis_flex: false,
    notifications: false,
  };

  return (
    <Tracker
      userId={user.id}
      userEmail={user.email ?? ""}
      week={{ id: week.id, started_at: week.started_at }}
      initialSettings={settings}
      initialChecks={checks}
      initialWater={water}
      initialHistory={(historyRes.data ?? []) as RiwayatMinggu[]}
    />
  );
}
