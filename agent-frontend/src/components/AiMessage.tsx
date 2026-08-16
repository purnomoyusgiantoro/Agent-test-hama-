import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertCircle, CheckCircle2, ShieldCheck, Beaker, AlertTriangle, Info } from 'lucide-react'

export default function AiMessage({ content }: { content: string }) {
  return (
    <div className="w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // P, UL, LI, STRONG
          p: ({ children }) => <p className="mb-4 text-sm leading-relaxed text-slate-700 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 space-y-2 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal pl-5 space-y-2 text-sm text-slate-700 last:mb-0">{children}</ol>,
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
              <span className="mt-1 text-primary shrink-0"><CheckCircle2 size={16} /></span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          
          // HEADINGS
          h1: ({ children }) => <h1 className="text-xl font-display font-bold text-slate-900 mt-6 mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-display font-bold text-slate-900 mt-6 mb-3 border-b border-border pb-2">{children}</h2>,
          h3: ({ children }) => {
            const text = String(children).toLowerCase();
            let Icon = Info;
            let bgColor = "bg-slate-100";
            let iconColor = "text-slate-600";
            let borderColor = "border-slate-200";

            if (text.includes('dugaan') || text.includes('penyakit') || text.includes('hama')) {
              Icon = AlertCircle;
              bgColor = "bg-orange-50";
              iconColor = "text-orange-600";
              borderColor = "border-orange-200";
            } else if (text.includes('sekarang') || text.includes('tindakan')) {
              Icon = AlertTriangle;
              bgColor = "bg-red-50";
              iconColor = "text-red-600";
              borderColor = "border-red-200";
            } else if (text.includes('mencegah') || text.includes('preventif')) {
              Icon = ShieldCheck;
              bgColor = "bg-green-50";
              iconColor = "text-green-600";
              borderColor = "border-green-200";
            } else if (text.includes('bahan aktif') || text.includes('rekomendasi')) {
              Icon = Beaker;
              bgColor = "bg-blue-50";
              iconColor = "text-blue-600";
              borderColor = "border-blue-200";
            } else if (text.includes('kondisi') || text.includes('berat')) {
              Icon = AlertTriangle;
              bgColor = "bg-rose-50";
              iconColor = "text-rose-600";
              borderColor = "border-rose-200";
            } else if (text.includes('simpan') || text.includes('hasil')) {
              return (
                <div className="flex items-center gap-2 mt-6 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {children}
                </div>
              );
            }

            return (
              <div className={`flex items-center gap-2.5 mt-8 mb-3 px-4 py-2.5 rounded-xl border ${bgColor} ${borderColor}`}>
                <div className={`${iconColor} shrink-0`}>
                  <Icon size={20} />
                </div>
                <h3 className={`font-display font-semibold text-sm ${iconColor.replace('text-', 'text-').replace('500', '700').replace('600', '800')}`}>
                  {children}
                </h3>
              </div>
            );
          },
          h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-800 mt-4 mb-2">{children}</h4>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
