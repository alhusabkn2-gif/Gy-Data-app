import {
  Headphones,
  MessageCircle,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AnimatedCard } from '../components/ui/NetworkLogo';

const SUPPORT_PHONE = '07120161312';
const WHATSAPP_PHONE = '2348032732007';
const SUPPORT_EMAIL = 'alhusabkn2@gmail.com';

const CHANNELS = [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    desc: 'Chat with our support team',
    color: 'from-emerald-500 to-green-700',
    action: 'Open WhatsApp',
    href: `https://wa.me/${WHATSAPP_PHONE}`,
  },
  {
    icon: Mail,
    title: 'Email Us',
    desc: SUPPORT_EMAIL,
    color: 'from-blue-500 to-blue-700',
    action: 'Send Email',
    href: `mailto:${SUPPORT_EMAIL}`,
  },
  {
    icon: Phone,
    title: 'Call Us',
    desc: SUPPORT_PHONE,
    color: 'from-cyan-500 to-cyan-700',
    action: 'Call Now',
    href: `tel:${SUPPORT_PHONE}`,
  },
];

const FAQS = [
  {
    q: 'How do I fund my wallet?',
    a: 'Go to Fund Wallet on the home screen, enter an amount, choose a payment method, and confirm.',
  },
  {
    q: 'What is the Purchase PIN?',
    a: 'The Purchase PIN is a 4-digit code required before every transaction. Keep it secure.',
  },
  {
    q: 'How long do transactions take?',
    a: 'Most transactions are instant. If delayed, please check your transaction history for status updates.',
  },
  {
    q: 'How do I refer friends?',
    a: 'Share your referral code from your profile page. You earn ₦100 for each successful referral.',
  },
];

export default function Support() {
  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader
        title="Support"
        subtitle="We're here to help"
        back
      />

      <AnimatedCard delay={0.05} className="mb-5">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Headphones className="w-7 h-7 text-white" />
            </div>

            <div>
              <p className="text-white font-bold font-display text-lg">
                Need Help?
              </p>

              <p className="text-white/70 text-sm">
                Our team is available 24/7
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      <div className="space-y-3 mb-6">
        {CHANNELS.map((ch, i) => {
          const Icon = ch.icon;

          return (
            <AnimatedCard
              key={ch.title}
              delay={0.1 + i * 0.05}
            >
              <a
                href={ch.href}
                target={
                  ch.title === 'WhatsApp'
                    ? '_blank'
                    : undefined
                }
                rel={
                  ch.title === 'WhatsApp'
                    ? 'noopener noreferrer'
                    : undefined
                }
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ch.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 text-left">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {ch.title}
                  </p>

                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    {ch.desc}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              </a>
            </AnimatedCard>
          );
        })}
      </div>

      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display mb-3">
        FAQs
      </h2>

      <div className="space-y-2.5">
        {FAQS.map((faq, i) => (
          <AnimatedCard
            key={i}
            delay={0.2 + i * 0.05}
          >
            <details className="group card-premium p-4 cursor-pointer">
              <summary className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200 text-sm list-none">
                {faq.q}

                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
              </summary>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                {faq.a}
              </p>
            </details>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
