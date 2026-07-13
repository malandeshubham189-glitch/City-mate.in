import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Share2,
  Gift,
  AlertCircle,
  IndianRupee,
  Copy,
  Check,
  Send,
  RefreshCw,
  Award
} from "lucide-react";
import {
  getUserWallet,
  createReferral,
  requestWithdrawal,
  getWalletTransactions,
  getReferralsList,
  addWalletCashback
} from "../../services/referralService";
import { UserWallet, Referral, WalletTransaction } from "../../types";

interface RewardsWalletProps {
  darkMode: boolean;
  currentUser: any;
}

export default function RewardsWallet({ darkMode, currentUser }: RewardsWalletProps) {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [referEmail, setReferEmail] = useState("");
  const [referSuccess, setReferSuccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [formError, setFormError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Milestones tracking helper
  const loyaltyTarget = 2000; // ₹2000 for elite referral badge

  const fetchWalletDetails = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const wallData = await getUserWallet(currentUser.uid, currentUser.name || "mate");
      const txs = await getWalletTransactions(currentUser.uid);
      const refs = await getReferralsList(currentUser.uid);

      setWallet(wallData);
      setTransactions(txs);
      setReferrals(refs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, [currentUser?.uid]);

  const handleCopyCode = () => {
    if (!wallet?.referralCode) return;
    navigator.clipboard.writeText(wallet.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referEmail.trim() || !wallet) return;

    try {
      await createReferral(currentUser.uid, referEmail, wallet.referralCode);
      setReferSuccess(true);
      setReferEmail("");
      setTimeout(() => setReferSuccess(false), 3000);
      fetchWalletDetails();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setWithdrawSuccess(false);

    const amt = Number(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid positive payout amount.");
      return;
    }
    if (!upiId.trim() || !upiId.includes("@")) {
      setFormError("Please specify a valid UPI ID (e.g. mobile@paytm or name@okaxis).");
      return;
    }
    if (!wallet || wallet.balance < amt) {
      setFormError(`Insufficient balance. Your current rewards balance is ₹${wallet?.balance || 0}.`);
      return;
    }

    try {
      await requestWithdrawal(currentUser.uid, amt, `UPI: ${upiId}`);
      setWithdrawSuccess(true);
      setWithdrawAmount("");
      setUpiId("");
      fetchWalletDetails();
    } catch (err: any) {
      setFormError(err.message || "An error occurred during transaction processing.");
    }
  };

  // Quick simulation helper to add some mock affiliate cashbacks for testing/presentation
  const simulateBookingAffiliate = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const isFirst = transactions.length === 0;
      const amount = isFirst ? 750 : 300;
      const desc = isFirst 
        ? "B2B Packers & Movers Commission Share: Lead PM-4402 Complete"
        : "Organic Tiffin Service Referral Bonus: Lead TF-8810 active subscription";
      
      await addWalletCashback(currentUser.uid, amount, desc);
      fetchWalletDetails();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const progressPercent = wallet ? Math.min(100, Math.round((wallet.accruedCashback / loyaltyTarget) * 100)) : 0;

  return (
    <div className="space-y-6 text-left">
      
      {/* Overview Glass Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-5 rounded-2xl border border-indigo-500/20 shadow-md">
          <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-500/10 blur-xl rounded-full" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block">Withdrawable Balance</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">₹{loading ? "..." : wallet?.balance || 0}</span>
              </div>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-2 rounded-xl text-indigo-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-300">
            <TrendingUp className="h-3.5 w-3.5" /> Direct instant bank withdrawal enabled.
          </div>
        </div>

        {/* Accrued cashback */}
        <div className="relative overflow-hidden bg-slate-950/60 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Life-Time Earnings</span>
              <span className="text-3xl font-black text-emerald-400">₹{loading ? "..." : wallet?.accruedCashback || 0}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-400">
              <Gift className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-400">
            Includes both referred signups & B2B commissions.
          </div>
        </div>

        {/* Referral code card */}
        <div className="relative overflow-hidden bg-slate-950/60 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Your Referral Code</span>
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-2 mt-1">
              <span className="font-mono text-sm font-extrabold text-indigo-300 tracking-wider">
                {loading ? "..." : wallet?.referralCode || "C_MATE"}
              </span>
              <button
                onClick={handleCopyCode}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="mt-2.5 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Share with relocating friends!</span>
            <button
              onClick={simulateBookingAffiliate}
              className="text-indigo-400 font-bold hover:underline"
            >
              Simulate ₹750 Comm.
            </button>
          </div>
        </div>
      </div>

      {/* Progress towards elite rewards badge */}
      <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span className="flex items-center gap-1 font-bold">
            <Award className="h-4 w-4 text-indigo-400" /> MATE ELITE BADGE STATUS
          </span>
          <span>₹{wallet?.accruedCashback || 0} / ₹{loyaltyTarget} Lifetime Earnings</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[9px] text-slate-500">
          Reach ₹2,000 in cashback or referrals to unlock early access to premium flatmate listings and 100% discount on verification fees!
        </p>
      </div>

      {/* Dual Column Forms & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Referral sending & Withdrawals */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Invite Friend Form */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Share2 className="h-4 w-4 text-indigo-400" /> Refer Relocating Friends
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Generate ₹150 instantly when your friend registers and undergoes verification, plus earn extra commissions on packer and mover bookings!
            </p>

            <form onSubmit={handleSendReferral} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter friend's email address"
                value={referEmail}
                onChange={(e) => setReferEmail(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg text-xs p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-lg cursor-pointer transition-colors"
              >
                Send Invite
              </button>
            </form>

            <AnimatePresence>
              {referSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-950/40 border border-emerald-900/60 p-2 rounded-lg text-[10px] text-emerald-400 flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4 shrink-0" /> Invitation Logged! Referral link recorded.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Direct Instant Payout Withdrawal */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Send className="h-4 w-4 text-emerald-400 animate-pulse" /> Direct Instant Bank Payout
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Submit your bank details or UPI Address to withdraw referral earnings. Minimum payout limit is ₹100. Processing is handled within 2 hours.
            </p>

            <form onSubmit={handleWithdrawal} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="₹ Amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">UPI ID Address</label>
                  <input
                    type="text"
                    required
                    placeholder="name@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-rose-950/40 border border-rose-900/60 p-2 rounded-lg text-[10px] text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase py-2.5 rounded-lg cursor-pointer transition-colors"
              >
                Request Withdrawal Payout
              </button>
            </form>

            <AnimatePresence>
              {withdrawSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg text-[10px] text-emerald-400 flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4.5 w-4.5 shrink-0" /> Payout Submitted! Track standard processing timeline inside transaction logs.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Col: Ledger Logs */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Real-time Ledger Log */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-400" /> Ledger Transaction History
              </h3>
              <button
                onClick={fetchWalletDetails}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-10 bg-slate-900 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center p-8 text-xs text-slate-500">
                  No transaction ledger logs found. Set up active referrals or simulate bookings to view balances.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg flex justify-between items-center text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-200">{tx.description}</p>
                      <p className="text-[9px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold text-xs ${
                        tx.type === "credit" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                      </span>
                      <span className={`block text-[8px] uppercase tracking-wider ${
                        tx.status === "completed" ? "text-emerald-500" : "text-amber-400"
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Referral Invitations Tracker */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-indigo-400" /> Pending & Dispatched Invitations
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {loading ? (
                <div className="h-10 bg-slate-900 animate-pulse rounded-lg" />
              ) : referrals.length === 0 ? (
                <div className="text-center p-4 text-[10px] text-slate-500">
                  No referred users recorded. Invite friends to start earning payouts!
                </div>
              ) : (
                referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="bg-slate-900/30 border border-slate-900/80 p-2 rounded-lg flex justify-between items-center text-[10px]"
                  >
                    <span className="font-medium text-slate-300">{ref.referredEmail}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      ref.status === "completed"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900/50"
                        : ref.status === "signed_up"
                        ? "bg-indigo-950/80 text-indigo-400 border border-indigo-900/50"
                        : "bg-slate-900 text-slate-500"
                    }`}>
                      {ref.status === "signed_up" ? "Registered" : ref.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
