import {
  Activity,
  BarChart3,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'

const SIDEBAR_ICONS = [LayoutDashboard, Activity, Users, BarChart3, Settings]

export function DashboardMockup() {
  return (
    <div className="liquid-glass relative flex aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-2xl p-3 shadow-2xl">
      <aside className="flex w-12 shrink-0 flex-col items-center gap-3 border-r border-white/10 py-2 pr-3">
        {SIDEBAR_ICONS.map((Icon, i) => (
          <span
            key={i}
            className="text-landing-muted hover:text-landing-text flex size-9 items-center justify-center rounded-xl bg-white/5 transition-colors"
          >
            <Icon className="size-4" strokeWidth={1.5} aria-hidden />
          </span>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3 pl-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-body text-landing-muted text-xs font-light">
              RAMI · 오늘의 러닝
            </p>
            <p className="font-heading italic text-landing-text text-lg tracking-tight">
              GPS 페이스 보드
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="liquid-glass-strong rounded-xl px-3 py-1.5 text-xs text-teal-100/90">
              친구 러닝 알림
            </span>
            <span className="liquid-glass-strong rounded-xl px-3 py-1.5 text-xs text-cyan-100/90">
              코스 스탬프
            </span>
          </div>
        </div>

        <div className="liquid-glass-strong relative flex flex-1 flex-col rounded-xl p-4">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-body text-landing-muted text-xs font-light">
                이번 주 거리
              </p>
              <p className="font-heading italic text-landing-text text-2xl tracking-tight">
                42.3 km
              </p>
            </div>
            <span className="font-body text-landing-muted text-xs font-light">
              VIDY 하이라이트 대기
            </span>
          </div>

          <div className="flex flex-1 items-end gap-1.5 pt-2">
            {[40, 65, 45, 80, 55, 90, 70, 95, 60, 88, 72, 100].map((h, i) => (
              <div
                key={i}
                className="min-w-0 flex-1 rounded-t-md bg-gradient-to-t from-cyan-500/30 to-violet-400/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
