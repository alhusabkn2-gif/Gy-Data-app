export default function Home() {
  return (
    <div className="relative min-h-screen pb-20 overflow-hidden">
      {/* Top Cyan Banner */}
      <div className="bg-brand-cyan px-5 pt-8 pb-16 rounded-b-[35px] relative z-10">
        <div className="flex justify-between items-center text-white mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">Gy-Data</span>
          </div>
          <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center text-xl">
            😊
          </div>
        </div>
        <h1 className="text-white text-2xl font-bold">Welcome Back,</h1>
        <h2 className="text-white text-2xl font-bold">User!</h2>
      </div>

      {/* Floating Balance Card */}
      <div className="px-5 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl p-4 shadow-md flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs">Balance</p>
            <p className="text-xl font-extrabold text-black">NGN 200.00</p>
          </div>
          <div className="w-12 h-8 bg-gradient-to-r from-orange-400 to-green-400 rounded-md"></div>
        </div>
      </div>

      {/* Grid Services Section */}
      <div className="px-5 mt-6 grid grid-cols-2 gap-4 relative z-20">
        {/* Buy Airtime Card */}
        <div className="bg-brand-lightGreen border border-green-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
          <div className="text-3xl mb-1">📞</div>
          <span className="font-bold text-gray-800 text-sm">Buy Airtime</span>
        </div>

        {/* Data Bundles Card */}
        <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
          <div className="text-3xl mb-1">☁️</div>
          <span className="font-bold text-gray-800 text-sm">Data Bundles</span>
        </div>

        {/* Fund Wallet Card */}
        <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
          <div className="text-3xl mb-1">🐷</div>
          <span className="font-bold text-gray-800 text-sm">Fund Wallet</span>
        </div>

        {/* Transaction History Card */}
        <div className="bg-brand-lightOrange border border-orange-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
          <div className="text-3xl mb-1">📜</div>
          <span className="font-bold text-gray-800 text-sm">Transaction History</span>
        </div>
      </div>

      {/* Background Orange Wave at Bottom */}
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-brand-orange rounded-tl-full opacity-80 pointer-events-none"></div>
    </div>
  );
}
