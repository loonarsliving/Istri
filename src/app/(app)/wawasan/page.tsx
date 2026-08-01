import { FINANCIAL_TIP_SECTIONS } from "@/lib/financial-tips";

export default function WawasanPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-rose-900">Wawasan Keuangan</h1>
        <p className="text-sm text-rose-900/60">
          Rangkuman panduan pengelolaan keuangan rumah tangga dari OJK, Kementerian Keuangan, dan
          praktik perencanaan keuangan keluarga.
        </p>
      </div>

      {FINANCIAL_TIP_SECTIONS.map((section) => (
        <div key={section.title} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-rose-900">
            <span className="text-lg">{section.icon}</span> {section.title}
          </p>
          <ul className="mt-3 space-y-2">
            {section.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-rose-900/80">
                <span className="text-rose-400">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p className="px-1 text-xs text-rose-900/40">
        Sumber: sikapiuangmu.ojk.go.id, mediakeuangan.kemenkeu.go.id, dan panduan perencanaan
        keuangan keluarga umum. Bukan pengganti konsultasi dengan perencana keuangan berlisensi.
      </p>
    </div>
  );
}
