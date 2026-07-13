import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  CreditCard, 
  Loader2, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  DollarSign
} from "lucide-react";
import { 
  initializeRazorpayScript, 
  initiatePaymentTransaction, 
  verifyAndCapturePayment, 
  calculateSplitCommission 
} from "../../services/paymentService";
import { UserProfile, PaymentTransaction } from "../../types";
import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

interface CheckoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  purpose: "premium_booking" | "property_deposit" | "affiliate_referral";
  title: string;
  user: UserProfile;
  onSuccess: (transactionId: string) => void;
}

export default function CheckoutOverlay({
  isOpen,
  onClose,
  bookingId,
  amount,
  purpose,
  title,
  user,
  onSuccess
}: CheckoutOverlayProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txDetails, setTxDetails] = useState<any | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showMockGateway, setShowMockGateway] = useState(false);

  // Dynamic Itemized Bills calculations
  const { commissionRate, platformCut, vendorPayout } = calculateSplitCommission(amount, purpose);
  const gst = Number((platformCut * 0.18).toFixed(2)); // 18% GST on platform service fees
  const totalWithGst = Number((amount + gst).toFixed(2));

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setErrorMsg(null);
      setSuccess(false);
      setTxDetails(null);
      setProcessing(false);
      setShowMockGateway(false);

      // Load Razorpay Script
      initializeRazorpayScript().then((loaded) => {
        setScriptLoaded(loaded);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    if (processing) return; // Prevent double taps (Atomic Safety Layer)
    setProcessing(true);
    setErrorMsg(null);

    try {
      // Step 1: Initiate transaction on our Express server
      const orderData = await initiatePaymentTransaction({
        bookingId,
        amount: totalWithGst,
        purpose,
        user: { uid: user.uid, name: user.name, email: user.email }
      });

      setTxDetails(orderData);

      // If Razorpay keys are placeholders or script failed, fall back to our futuristic simulated gateway
      if (orderData.isMock || !scriptLoaded) {
        // Show our secure mockup transaction sandbox terminal
        setShowMockGateway(true);
        setProcessing(false);
        return;
      }

      // Initialize real Razorpay checkout options
      const options = {
        key: "rzp_test_placeholder", // Replace with real key in production via env configuration
        amount: Math.round(totalWithGst * 100), // Razorpay accepts in paise
        currency: "INR",
        name: "CityMate India",
        description: `${title} (${purpose.replace("_", " ")})`,
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          setProcessing(true);
          try {
            // Step 2: Crytographically verify signature on Express backend
            const verified = await verifyAndCapturePayment({
              transactionId: orderData.transactionId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verified) {
              await logTransactionToFirestore(orderData.transactionId, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
            } else {
              throw new Error("Cryptographic verification failed at secure server gateway.");
            }
          } catch (err: any) {
            setErrorMsg(err.message || "Failed to securely capture payment.");
            setProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ""
        },
        theme: {
          color: "#6366F1"
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize payment process.");
      setProcessing(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!txDetails) return;
    setProcessing(true);
    setShowMockGateway(false);

    try {
      const mockOrderId = txDetails.orderId;
      const mockPaymentId = `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const mockSignature = `sig_${Math.random().toString(36).substring(2, 16).toUpperCase()}`;

      // Call our API endpoint to verify mock signature
      const verified = await verifyAndCapturePayment({
        transactionId: txDetails.transactionId,
        razorpayOrderId: mockOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature
      });

      if (verified) {
        await logTransactionToFirestore(txDetails.transactionId, mockOrderId, mockPaymentId, mockSignature);
      } else {
        throw new Error("Gateway failed verification sequence.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process simulate capture.");
      setProcessing(false);
    }
  };

  const logTransactionToFirestore = async (
    txId: string, 
    orderId: string, 
    paymentId: string, 
    sig: string
  ) => {
    try {
      const txRecord: PaymentTransaction = {
        id: txId,
        bookingId,
        userId: user.uid,
        userName: user.name,
        userEmail: user.email,
        amount: totalWithGst,
        purpose,
        status: "captured",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: sig,
        commissionRate,
        platformCut,
        vendorPayout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Write transaction ledger to Firestore
      const txDocRef = doc(db, "payment_transactions", txId);
      await setDoc(txDocRef, txRecord);

      // Trigger success view
      setSuccess(true);
      setProcessing(false);
      onSuccess(txId);
    } catch (err: any) {
      console.error("Firestore transaction logging failed:", err);
      setErrorMsg("Payment captured by Razorpay, but logging to ledger failed. Please notify support with Payment ID: " + paymentId);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop blur */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={processing ? undefined : onClose} />

      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl shadow-indigo-500/10 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">CityMate Payment Gateway</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Ledger Terminal</p>
              </div>
            </div>
            {!processing && (
              <button 
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bootstrapping Secured Gateway...</p>
              </div>
            ) : success ? (
              /* Success View */
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 space-y-6"
              >
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full bg-emerald-500/5"
                  />
                  <CheckCircle2 className="h-10 w-10 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-xl font-black uppercase tracking-wider text-white">Transaction Cleared</h4>
                  <p className="text-xs text-slate-400">Your funds have been securely captured, and the split-commission ledger was updated.</p>
                </div>

                {/* Ledger Invoice Receipt */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 text-left space-y-3 font-mono">
                  <div className="flex justify-between text-[11px] border-b border-emerald-500/10 pb-2">
                    <span className="text-slate-400 font-sans uppercase font-bold text-[9px] tracking-wider">Transaction ID</span>
                    <span className="text-emerald-400 font-bold text-[10px]">{txDetails?.transactionId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-[11px] border-b border-emerald-500/10 pb-2">
                    <span className="text-slate-400 font-sans uppercase font-bold text-[9px] tracking-wider">Purpose</span>
                    <span className="text-slate-200 text-[10px]">{purpose.replace("_", " ").toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] border-b border-emerald-500/10 pb-2">
                    <span className="text-slate-400 font-sans uppercase font-bold text-[9px] tracking-wider">Subtotal Paid</span>
                    <span className="text-slate-200 text-[10px]">₹{amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[11px] border-b border-emerald-500/10 pb-2">
                    <span className="text-slate-400 font-sans uppercase font-bold text-[9px] tracking-wider">GST (18% Platform Fee)</span>
                    <span className="text-slate-200 text-[10px]">₹{gst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[12px] font-black pt-1">
                    <span className="text-slate-400 font-sans uppercase font-bold text-[9px] tracking-wider">Total Captured</span>
                    <span className="text-emerald-400">₹{totalWithGst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-500/10 flex justify-between text-[9px] text-slate-500 font-sans font-bold uppercase tracking-wider">
                    <span>Platform Commission ({commissionRate * 100}%)</span>
                    <span>₹{platformCut} INR</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-bold uppercase tracking-widest animate-bounce">
                  <Sparkles className="h-3 w-3" />
                  Premium Member Activated
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Done & Back to Dashboard
                </button>
              </motion.div>
            ) : showMockGateway ? (
              /* MOCK SANDBOX SIMULATOR GATEWAY */
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-950/10 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4" />
                    <span>Secure Payment Sandbox</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    This CityMate sandbox replaces external Razorpay dialogs. Experience the full-stack signature capture and commission-ledger loop.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Recipient Entity</span>
                    <p className="text-xs font-bold text-slate-200">CityMate India Marketplace Escrow</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Bill Reference</span>
                    <p className="text-xs font-bold text-slate-200">{title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Order ID</span>
                      <p className="text-xs font-mono font-bold text-indigo-400">{txDetails?.orderId}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Net Amount</span>
                      <p className="text-xs font-mono font-bold text-emerald-400">₹{totalWithGst.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleSimulateSuccess}
                    disabled={processing}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Approve & Authorize Transaction</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setErrorMsg("Payment declined by bank authority. Please try again.");
                      setShowMockGateway(false);
                    }}
                    disabled={processing}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    Cancel / Fail Payment
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Standard Bill Presentment View */
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    {purpose.replace("_", " ")}
                  </span>
                  <h4 className="text-base font-black text-white mt-3 leading-snug">{title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Check out with secure escrow protection. Funds will only release to vendor upon completion of relocate milestones.</p>
                </div>

                {/* Dynamic Itemized Invoice Bills */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4 font-mono">
                  <div className="flex justify-between text-xs pb-3 border-b border-slate-800">
                    <span className="text-slate-400">Base Deposit/Amount:</span>
                    <span className="text-white font-bold">₹{amount.toLocaleString("en-IN")}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs pb-3 border-b border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5 group relative">
                      <span>Platform Commission ({commissionRate * 100}%):</span>
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500 hover:text-slate-300 cursor-help" />
                    </span>
                    <span className="text-slate-300">₹{platformCut.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-xs pb-3 border-b border-slate-800">
                    <span className="text-slate-400">GST (18% on platform cut):</span>
                    <span className="text-slate-300">₹{gst.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-white font-black uppercase text-xs tracking-wider">Grand Total to Pay:</span>
                    <span className="text-emerald-400 font-black text-base">₹{totalWithGst.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                  <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                  <div className="text-[10px] leading-relaxed">
                    <p className="text-slate-200 font-bold uppercase tracking-wider">CityMate Trust Protection Guaranteed</p>
                    <p className="text-slate-400">Escrow reserves your amount. 5% cut is split automatically to maintain infrastructure.</p>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex gap-2.5 animate-bounce">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Atomic Action Button with Double Tap Prevention */}
                <button
                  onClick={handlePayNow}
                  disabled={processing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Initializing Secure Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Payment</span>
                      <ArrowRight className="h-4 w-4 text-white" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
