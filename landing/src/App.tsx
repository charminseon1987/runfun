import { motion } from 'motion/react'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ScrollSection } from './components/ScrollSection'
import { FridgeScanner } from './components/FridgeScanner'

/** 데모용 MP4 (VITE_VIDEO_SRC 미설정 시). 비활성화하려면 .env에 VITE_VIDEO_SRC 를 공백 한 칸 등으로 두고 Hero에서 trim 처리 — 현재는 미설정이면 데모 재생 */
const DEMO_MP4 =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'

const envVideo = (import.meta.env.VITE_VIDEO_SRC as string | undefined)?.trim()
const VIDEO_SRC = envVideo && envVideo.length > 0 ? envVideo : DEMO_MP4

function App() {
  return (
    <div className="min-h-screen bg-landing-bg text-landing-text antialiased">
      <Navbar />
      <main>
        <Hero videoSrc={VIDEO_SRC} />

        <ScrollSection id="핵심기능" title="핵심 기능">
          <ul className="liquid-glass mb-4 list-inside list-disc space-y-3 rounded-2xl p-6 transition-transform hover:scale-[1.01]">
            <li>LangGraph 페르소나 멀티 에이전트 — RAMI 오케스트레이터가 의도를 분석해 MARA, TRACKER, VIDY 등 전문 에이전트로 라우팅합니다.</li>
            <li>친구 실시간 러닝 감지와 토스 스타일 플로팅 알림(Supabase Realtime).</li>
            <li>코스 완주 스탬프·전국·세계 마라톤 일정 DB와 신청 알림.</li>
            <li>FFmpeg.wasm 기반 러닝 코스 영상 속도 편집, GPS 기록에서 SNS 업로드까지 한 흐름.</li>
          </ul>
        </ScrollSection>

        <ScrollSection id="냉장고레시피" title="냉장고 레시피">
          <FridgeScanner />
        </ScrollSection>

        <ScrollSection id="에이전트" title="멀티 에이전트">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="liquid-glass rounded-2xl p-6">
              <h3 className="font-heading italic text-landing-text mb-2 text-xl">RAMI · Orchestrator</h3>
              <p>
                친근한 러닝 AI 코치 톤으로 의도를 정리하고, 일정·코스·기록·소셜·미디어 등 서브
                에이전트에게 위임합니다.
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-6">
              <h3 className="font-heading italic text-landing-text mb-2 text-xl">페르소나 군</h3>
              <p>
                MARA·GLOBI·COSHI·TRAVI·GEARS·TRACKER·VIDY·SOAR·STAMPY·LINGUA — 각자 말투와 전문
                영역이 정의된 10개 서브 에이전트가 협업합니다.
              </p>
            </div>
          </div>
        </ScrollSection>

        <ScrollSection id="스택" title="기술 스택">
          <div className="liquid-glass-strong max-w-2xl rounded-2xl p-8">
            <p className="font-heading italic text-landing-text text-2xl">PRD v4.0 기준</p>
            <p className="mt-3">
              Google Stitch → Next.js 15 · Tailwind CSS v4 · Supabase(PostgreSQL, Auth, Realtime,
              Storage, Edge) · LangGraph · Claude API · Node.js 18+ · FFmpeg.wasm.
            </p>
            <p className="mt-4 text-xs text-teal-200/80">
              이 랜딩은 Vite + React로 프로토타입 UI를 재현한 버전입니다.
            </p>
          </div>
        </ScrollSection>

        <ScrollSection id="워크플로" title="Stitch 워크플로">
          <p className="liquid-glass rounded-2xl p-6">
            Stitch에서 프롬프트로 화면을 만들고 Tailwind 코드로 보낸 뒤, Cursor에서 Next.js 컴포넌트로
            옮기고 Supabase·에이전트 로직을 얹습니다. 배포는 Vercel과 Supabase Cloud를 전제로 합니다.
          </p>
        </ScrollSection>

        <ScrollSection id="문의" title="문의">
          <p className="mb-6">
            PoC·데모 일정이나 에이전트 설계 검토가 필요하면 아래로 연락 주세요. 동일한 리퀴드 글래스 톤을
            유지한 CTA로 전환을 돕습니다.
          </p>
          <motion.a
            href="mailto:hello@runmate.local"
            className="liquid-glass-strong inline-flex rounded-2xl px-6 py-3 text-sm font-medium text-slate-50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            문의 보내기
          </motion.a>
        </ScrollSection>
      </main>

      <motion.footer
        className="font-body text-landing-muted border-t border-white/10 px-6 py-10 text-center text-xs font-light"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        © {new Date().getFullYear()} RunMate AI · PRD v4.0 기반 랜딩 시안
      </motion.footer>
    </div>
  )
}

export default App
