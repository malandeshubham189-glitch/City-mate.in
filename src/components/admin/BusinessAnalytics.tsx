import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  Coins, 
  Download, 
  RefreshCw, 
  Percent, 
  Users, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  DollarSign, 
  ChevronRight, 
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  Lock
} from "lucide-react";
import { calculateAnalyticsMetrics, DashboardMetrics } from "../../services/analyticsService";

interface BusinessAnalyticsProps {
  darkMode: boolean;
}

export default function BusinessAnalytics({ darkMode }: BusinessAnalyticsProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMetrics = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const data = await calculateAnalyticsMetrics(force);
      setMetrics(data);
    } catch (err: any) {
      console.error("Error fetching business analytics:", err);
      setErrorMsg("Failed to gather platform financial summaries. Please ensure write permissions are active.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleExportCSV = () => {
    if (!metrics) return;

    // Create CSV rows for recent ledger distribution log
    const headers = ["Transaction ID", "User Name", "Purpose", "Amount (INR)", "Platform Commission (INR)", "Status", "Timestamp"];
    const rows = metrics.recentTransactions.map(tx => [
      tx.id,
      tx.userName,
      tx.purpose.replace("_", " ").toUpperCase(),
      tx.amount,
      tx.platformCut,
      tx.status,
      tx.createdAt
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `citymate_ledger_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Decrypting Ledger Signatures & Compiling GMV...
        </p>
      </div>
    );
  }

  if (errorMsg || !metrics) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">Analytics Load Failed</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => fetchMetrics(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Retry Calculation Pipeline
        </button>
      </div>
    );
  }

  // Calculate percent of direct checkout vs total B2B commission
  const totalB2B = metrics.monetization.tiffinRevenue + metrics.monetization.packersMoversRevenue + metrics.monetization.broadbandRevenue;
  const totalDirect = metrics.monetization.pgBookingRevenue + metrics.monetization.propertyDepositRevenue;
  
  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-400 animate-pulse" />
            <span>Marketplace Ledger & GMV Hub</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Real-time financial nodes and B2B affiliate commission models
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {metrics.isFromCache && (
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1 rounded-full shrink-0">
              Cached Data
            </span>
          )}

          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Recalculating..." : "Force Refresh"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Futuristic Bento Grid Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Net Commission Revenue", 
            value: `₹${metrics.totalCommissionRevenue.toLocaleString("en-IN")}`, 
            desc: "B2B cut + booking commission", 
            icon: Coins, 
            color: "text-amber-400 bg-amber-500/5 border-amber-500/20 shadow-amber-500/5" 
          },
          { 
            label: "Escrow Volume GMV", 
            value: `₹${metrics.platformGMV.toLocaleString("en-IN")}`, 
            desc: "Gross transacted value", 
            icon: TrendingUp, 
            color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5" 
          },
          { 
            label: "Active Mover Nodes", 
            value: metrics.dailyActiveMovers.toString(), 
            desc: "Interactive seekers & owners", 
            icon: Users, 
            color: "text-indigo-400 bg-indigo-500/5 border-indigo-500/20 shadow-indigo-500/5" 
          },
          { 
            label: "B2B Conversion Ratio", 
            value: `${metrics.b2bConversionRatio}%`, 
            desc: `${metrics.convertedLeads} out of ${metrics.totalLeads} leads`, 
            icon: Percent, 
            color: "text-pink-400 bg-pink-500/5 border-pink-500/20 shadow-pink-500/5" 
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={index}
              className={`p-5 rounded-3xl border shadow-lg ${item.color} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                <div className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-white tracking-tight">{item.value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Monetization Channels Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Channel Breakdown visual representations */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-800 bg-slate-900/40 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Monetization Channel Audit</h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Split commission ledger distributions</p>
            </div>
            <span className="text-[10px] font-extrabold text-indigo-400 flex items-center gap-1 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" />
              <span>Multi-Source Platform</span>
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: "Premium PG Bookings (5%)", val: metrics.monetization.pgBookingRevenue, totalVal: totalDirect + totalB2B, color: "bg-indigo-500", desc: "Token room claims" },
              { label: "Security Deposits Escrow (2% processing)", val: metrics.monetization.propertyDepositRevenue, totalVal: totalDirect + totalB2B, color: "bg-emerald-500", desc: "Refundable token assets held" },
              { label: "Packers & Movers Leads (5% or Flat ₹500)", val: metrics.monetization.packersMoversRevenue, totalVal: totalDirect + totalB2B, color: "bg-pink-500", desc: "Allied relocation sales" },
              { label: "Tiffin Meal Referrals (Flat ₹150)", val: metrics.monetization.tiffinRevenue, totalVal: totalDirect + totalB2B, color: "bg-amber-500", desc: "Active subscriber signups" },
              { label: "Broadband Conversions (Flat ₹300)", val: metrics.monetization.broadbandRevenue, totalVal: totalDirect + totalB2B, color: "bg-sky-500", desc: "Fiber install signups" },
            ].map((channel, idx) => {
              const maxVal = Math.max(totalDirect + totalB2B, 1);
              const pct = Number(((channel.val / maxVal) * 100).toFixed(1));
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-200">{channel.label}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-2">({channel.desc})</span>
                    </div>
                    <span className="font-mono font-bold text-slate-200">₹{channel.val.toLocaleString("en-IN")} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-950 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${channel.color} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
              <span>Direct Booking: ₹{totalDirect.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>B2B Affiliates: ₹{totalB2B.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto text-indigo-400 font-extrabold">
              <span>Grand Net Commission Total: ₹{metrics.totalCommissionRevenue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Dynamic distribution ledger stats card */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Consolidated Node Ratios</h4>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Lead and Booking conversion yields</p>
          </div>

          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/50 flex justify-between items-center">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">B2B Referrals</span>
                <p className="text-lg font-black text-white mt-1">{metrics.totalLeads} Submissions</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600" />
              <div className="text-right">
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Yield</span>
                <p className="text-lg font-black text-emerald-400 mt-1">{metrics.convertedLeads}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/50 flex justify-between items-center">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Direct Bookings</span>
                <p className="text-lg font-black text-white mt-1">{metrics.totalBookings} Visits</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600" />
              <div className="text-right">
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Registrations</span>
                <p className="text-lg font-black text-indigo-400 mt-1">{metrics.totalUsers} Mates</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] leading-relaxed space-y-2">
            <div className="flex items-center gap-1 text-indigo-400 font-extrabold uppercase tracking-widest">
              <Lock className="h-3.5 w-3.5" />
              <span>Escrow Shield Protocol</span>
            </div>
            <p className="text-slate-400 font-semibold">
              Platform holds deposit reserves securely in partner nodes. Releases automatically trigger on verified lease upload signatures.
            </p>
          </div>
        </div>
      </div>

      {/* Tabular Distribution Logs (Recent Transactions ledger) */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/40 shadow-xl space-y-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">Recent Financial Ledger Logs</h4>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Audit logs for digital checkout transactions</p>
        </div>

        {metrics.recentTransactions.length === 0 ? (
          <div className="text-center py-10 font-mono text-xs text-slate-500 uppercase tracking-widest">
            No active financial transactions found in ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 pb-2 text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                  <th className="py-3 px-2">Transaction ID</th>
                  <th className="py-3 px-2">User</th>
                  <th className="py-3 px-2">Purpose</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                  <th className="py-3 px-2 text-right">Platform Cut</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/10 transition-colors">
                    <td className="py-3 px-2 font-bold text-indigo-400">{tx.id}</td>
                    <td className="py-3 px-2 text-slate-200 font-sans font-bold">{tx.userName}</td>
                    <td className="py-3 px-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {tx.purpose.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-white">₹{tx.amount.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-400">₹{tx.platformCut.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        tx.status === "captured" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : tx.status === "refunded"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-500 text-[10px]">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
