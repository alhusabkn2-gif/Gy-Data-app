export const NETWORKS = [
  { id: 'MTN', name: 'MTN', color: '#FFCC00', textColor: '#000000', logo: 'MTN' },
  { id: 'GLO', name: 'Glo', color: '#00B140', textColor: '#FFFFFF', logo: 'GLO' },
  { id: 'AIRTEL', name: 'Airtel', color: '#E40000', textColor: '#FFFFFF', logo: 'AIRTEL' },
  { id: '9MOBILE', name: '9Mobile', color: '#0066CC', textColor: '#FFFFFF', logo: '9MOBILE' },
] as const;

export const ELECTRICITY_PROVIDERS = [
  { id: 'IKEDC', name: 'Ikeja Electric', short: 'IKEDC' },
  { id: 'EKEDC', name: 'Eko Electric', short: 'EKEDC' },
  { id: 'AEDC', name: 'Abuja Electric', short: 'AEDC' },
  { id: 'PHED', name: 'Port Harcourt Electric', short: 'PHED' },
  { id: 'IBEDC', name: 'Ibadan Electric', short: 'IBEDC' },
  { id: 'KEDCO', name: 'Kano Electric', short: 'KEDCO' },
  { id: 'JED', name: 'Jos Electric', short: 'JED' },
];

export const CABLE_PROVIDERS = [
  { id: 'DSTV', name: 'DStv', logo: 'DStv' },
  { id: 'GOTV', name: 'GOtv', logo: 'GOtv' },
  { id: 'STARTIMES', name: 'Startimes', logo: 'Startimes' },
];

export const BETTING_PLATFORMS = [
  { id: 'SPORTYBET', name: 'SportyBet', logo: 'SportyBet' },
  { id: 'BET9JA', name: 'Bet9ja', logo: 'Bet9ja' },
  { id: 'BANGBET', name: 'BangBet', logo: 'BangBet' },
  { id: 'NAIRABET', name: 'NairaBet', logo: 'NairaBet' },
  { id: 'BETKING', name: 'BetKing', logo: 'BetKing' },
];

export const SERVICE_ICONS = {
  data: 'Smartphone',
  airtime: 'Phone',
  electricity: 'Zap',
  cable: 'Tv',
  waec: 'GraduationCap',
  jamb: 'BookOpen',
  betting: 'Trophy',
  smile: 'Smile',
  internet: 'Wifi',
  more: 'Grid3x3',
} as const;

export const QUICK_SERVICES = [
  { id: 'electricity', name: 'Electricity', icon: 'Zap', color: 'from-amber-400 to-orange-500' },
  { id: 'cable', name: 'Cable TV', icon: 'Tv', color: 'from-sky-400 to-blue-600' },
  { id: 'waec', name: 'WAEC', icon: 'GraduationCap', color: 'from-emerald-400 to-green-600' },
  { id: 'jamb', name: 'JAMB', icon: 'BookOpen', color: 'from-rose-400 to-red-600' },
  { id: 'betting', name: 'Betting', icon: 'Trophy', color: 'from-violet-400 to-purple-600' },
  { id: 'smile', name: 'Smile Data', icon: 'Smile', color: 'from-cyan-400 to-teal-600' },
  { id: 'internet', name: 'Internet', icon: 'Wifi', color: 'from-indigo-400 to-blue-600' },
  { id: 'more', name: 'More', icon: 'Grid3x3', color: 'from-slate-400 to-slate-600' },
] as const;
