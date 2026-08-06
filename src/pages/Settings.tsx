import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Fingerprint, Bell, Lock, Shield, Info, ChevronRight,
  Eye, Download,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AnimatedCard } from '../components/ui/NetworkLogo';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [biometrics, setBiometrics] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 px-5 pt-12">
      <PageHeader title="Settings" subtitle="Customize your experience" />

      {/* Appearance */}
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-3 px-1">Appearance</h2>
      <AnimatedCard delay={0.05} className="mb-5">
        <div className="card-premium overflow-hidden">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">Theme</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{theme} mode</p>
            </div>
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <motion.div layout className={`w-5 h-5 rounded-full bg-white shadow-sm ${theme === 'dark' ? 'ml-5' : 'ml-0'}`} />
            </div>
          </button>
        </div>
      </AnimatedCard>

      {/* Security */}
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-3 px-1">Security</h2>
      <AnimatedCard delay={0.1} className="mb-5">
        <div className="card-premium overflow-hidden">
          <ToggleRow icon={Fingerprint} iconBg="bg-blue-100 dark:bg-blue-500/20" iconColor="text-blue-600 dark:text-blue-400"
            title="Biometric Login" subtitle="Face ID / Fingerprint" value={biometrics} onChange={setBiometrics} />
          <div className="border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">Change PINs</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Login & Purchase PIN</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </button>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-success-100 dark:bg-success-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-success-600 dark:text-success-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Coming soon</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </button>
          </div>
        </div>
      </AnimatedCard>

      {/* Notifications */}
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-3 px-1">Notifications</h2>
      <AnimatedCard delay={0.15} className="mb-5">
        <div className="card-premium overflow-hidden">
          <ToggleRow icon={Bell} iconBg="bg-primary-100 dark:bg-primary-500/20" iconColor="text-primary-600 dark:text-primary-400"
            title="Push Notifications" subtitle="Receive push alerts" value={pushNotifs} onChange={setPushNotifs} />
          <div className="border-t border-slate-100 dark:border-slate-800">
            <ToggleRow icon={Bell} iconBg="bg-blue-100 dark:bg-blue-500/20" iconColor="text-blue-600 dark:text-blue-400"
              title="Transaction Alerts" subtitle="Get notified on transactions" value={transactionAlerts} onChange={setTransactionAlerts} />
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800">
            <ToggleRow icon={Bell} iconBg="bg-rose-100 dark:bg-rose-500/20" iconColor="text-rose-600 dark:text-rose-400"
              title="Promotional Alerts" subtitle="Offers and promotions" value={promoAlerts} onChange={setPromoAlerts} />
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800">
            <ToggleRow icon={Bell} iconBg="bg-cyan-100 dark:bg-cyan-500/20" iconColor="text-cyan-600 dark:text-cyan-400"
              title="SMS Notifications" subtitle="Receive SMS alerts" value={smsNotifs} onChange={setSmsNotifs} />
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800">
            <ToggleRow icon={Bell} iconBg="bg-slate-100 dark:bg-slate-700" iconColor="text-slate-600 dark:text-slate-300"
              title="Email Notifications" subtitle="Receive email updates" value={emailNotifs} onChange={setEmailNotifs} />
          </div>
        </div>
      </AnimatedCard>

      {/* Privacy */}
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-3 px-1">Privacy</h2>
      <AnimatedCard delay={0.2} className="mb-5">
        <div className="card-premium overflow-hidden">
          <ToggleRow icon={Eye} iconBg="bg-slate-100 dark:bg-slate-700" iconColor="text-slate-600 dark:text-slate-300"
            title="Data Sharing" subtitle="Share usage data to improve" value={dataSharing} onChange={setDataSharing} />
          <div className="border-t border-slate-100 dark:border-slate-800">
            <ToggleRow icon={Eye} iconBg="bg-primary-100 dark:bg-primary-500/20" iconColor="text-primary-600 dark:text-primary-400"
              title="Analytics" subtitle="Collect app analytics" value={analytics} onChange={setAnalytics} />
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800">
            <button className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-error-100 dark:bg-error-500/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-error-600 dark:text-error-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">Download My Data</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Export your account data</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </button>
          </div>
        </div>
      </AnimatedCard>

      {/* About */}
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-3 px-1">About</h2>
      <AnimatedCard delay={0.25} className="mb-5">
        <div className="card-premium p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">GY DATA</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Version 1.0.0</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between"><span>Build</span><span>2026.07.16</span></div>
            <div className="flex justify-between"><span>Platform</span><span>Web</span></div>
            <div className="flex justify-between"><span>License</span><span>GY DATA Ltd</span></div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}

function ToggleRow({ icon: Icon, iconBg, iconColor, title, subtitle, value, onChange }: {
  icon: typeof Bell; iconBg: string; iconColor: string; title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
      </div>
      <div className={`w-12 h-7 rounded-full p-1 transition-colors ${value ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <motion.div layout className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'ml-5' : 'ml-0'}`} />
      </div>
    </button>
  );
}
