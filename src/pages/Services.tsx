import { useNavigate } from 'react-router-dom';
import {
  Smartphone, Phone, Zap, Tv, GraduationCap, BookOpen,
  Trophy, Smile, Wifi, ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AnimatedCard } from '../components/ui/NetworkLogo';

const services = [
  { id: 'data', name: 'Buy Data', desc: 'MTN, Glo, Airtel, 9Mobile', icon: Smartphone, color: 'from-blue-500 to-blue-700' },
  { id: 'airtime', name: 'Buy Airtime', desc: 'All networks supported', icon: Phone, color: 'from-cyan-500 to-cyan-700' },
  { id: 'electricity', name: 'Electricity', desc: 'Prepaid & postpaid bills', icon: Zap, color: 'from-amber-400 to-orange-500' },
  { id: 'cable', name: 'Cable TV', desc: 'DStv, GOtv, Startimes', icon: Tv, color: 'from-sky-400 to-blue-600' },
  { id: 'waec', name: 'WAEC', desc: 'Result checker pins', icon: GraduationCap, color: 'from-emerald-400 to-green-600' },
  { id: 'jamb', name: 'JAMB', desc: 'UTME registration pins', icon: BookOpen, color: 'from-rose-400 to-red-600' },
  { id: 'betting', name: 'Betting', desc: 'Fund betting accounts', icon: Trophy, color: 'from-violet-400 to-purple-600' },
  { id: 'smile', name: 'Smile Data', desc: 'Smile internet bundles', icon: Smile, color: 'from-cyan-400 to-teal-600' },
  { id: 'internet', name: 'Internet', desc: 'ISP data plans', icon: Wifi, color: 'from-indigo-400 to-blue-600' },
];

export default function Services() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title="Services" subtitle="Choose a service to get started" back={false} />

      <div className="space-y-3">
        {services.map((service, i) => {
          const Icon = service.icon;
          return (
            <AnimatedCard key={service.id} delay={i * 0.05}>
              <button
                onClick={() => navigate(`/services/${service.id}`)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{service.name}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">{service.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              </button>
            </AnimatedCard>
          );
        })}
      </div>
    </div>
  );
}
