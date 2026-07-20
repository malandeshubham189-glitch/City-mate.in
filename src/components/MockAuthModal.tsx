import React, { useState, useEffect, useRef } from "react";
import { UserRole, UserProfile } from "../types";
import { 
  X, Shield, Building, User, Mail, Lock, Sparkles, Check, Phone, 
  ArrowLeft, Loader2, Smartphone, AlertCircle, Eye, EyeOff 
} from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
import { doc, setDoc, getDoc } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signInAnonymously
} from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface MockAuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

type AuthState = 
  | "sign-in" 
  | "sign-up" 
  | "phone-input" 
  | "otp-verification" 
  | "forgot-password" 
  | "complete-profile"
  | "email-verification-pending";

interface PendingUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
}

export default function MockAuthModal({ onClose, onLoginSuccess }: MockAuthModalProps) {
  const [authState, setAuthState] = useState<AuthState>("sign-in");
  const [role, setRole] = useState<UserRole>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Pending profile state for multi-provider role selection
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);
  
  // reCAPTCHA & OTP verification refs/states
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Initialize invisible reCAPTCHA Verifier for Phone OTP
  useEffect(() => {
    let verifierInstance: RecaptchaVerifier | null = null;
    
    if (auth) {
      try {
        const container = recaptchaContainerRef.current || document.getElementById("recaptcha-verifier-container");
        if (container) {
          console.log("[reCAPTCHA Debug] Initializing RecaptchaVerifier on mount with container ref");
          verifierInstance = new RecaptchaVerifier(auth, container, {
            size: "invisible",
            callback: () => {
              console.log("reCAPTCHA solved, proceeding...");
            },
            "expired-callback": () => {
              console.warn("reCAPTCHA expired, please try again.");
              setErrorMsg("reCAPTCHA verification expired. Please request OTP again.");
            }
          });
          
          (window as any).recaptchaVerifier = verifierInstance;
          setRecaptchaVerifier(verifierInstance);
        }
      } catch (err) {
        console.error("reCAPTCHA initiation failed:", err);
      }
    }

    return () => {
      if (verifierInstance) {
        try {
          console.log("[reCAPTCHA Debug] Clearing RecaptchaVerifier on unmount");
          verifierInstance.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {
          console.warn("reCAPTCHA cleanup issue ignored:", e);
        }
      }
    };
  }, [auth]);

  // Handle Preset sandbox accounts for testing and verification
  const handlePresetLogin = async (presetRole: UserRole) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;
      let mockName = "";
      let mockEmail = "";
      let mockPhone = "";

      if (presetRole === "admin") {
        mockName = "Super Admin Dev";
        mockEmail = "admin@citymate.in";
        mockPhone = "+919999911111";
      } else if (presetRole === "owner") {
        mockName = "Rajesh Gupta (Owner)";
        mockEmail = "rajesh.gupta@owner.com";
        mockPhone = "+919876543210";
      } else {
        mockName = "Aarav Sharma";
        mockEmail = "aarav.sharma@seeker.com";
        mockPhone = "+918888877777";
      }

      const profile: UserProfile = {
        uid: uid,
        name: mockName,
        email: mockEmail,
        role: presetRole,
        phone: mockPhone,
        cityPreference: "Bengaluru",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), profile);
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error(`[Firebase Auth Error - Anonymous Login]: Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'unknown'}`, err);
      if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Anonymous sign-in is not enabled. Please enable 'Anonymous' in the Firebase Console (under Build > Authentication > Sign-in method).");
      } else {
        if (err?.code?.startsWith("permission-") || err?.message?.includes("permission") || err?.code === "permission-denied") {
          try {
            handleFirestoreError(err, OperationType.WRITE, "users/anonymous");
          } catch (e) {}
        }
        setErrorMsg("Failed to initialize demo account.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        onLoginSuccess(userDoc.data() as UserProfile);
        onClose();
      } else {
        // Complete profile registration
        setPendingUser({
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          photoURL: user.photoURL || "",
        });
        setAuthState("complete-profile");
      }
    } catch (err: any) {
      console.error(`[Firebase Auth Error - Google Login]: Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'unknown'}`, err);
      if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Google Sign-In is not enabled. Please enable 'Google' in the Firebase Console (under Build > Authentication > Sign-in method).");
      } else if (err.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        setErrorMsg(`This domain (${currentDomain}) is not authorized for authentication in your Firebase Project. Please add it to the 'Authorized domains' list in the Firebase Console (Authentication > Settings > Authorized domains).`);
      } else {
        setErrorMsg(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Facebook Sign In
  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    setErrorMsg("");
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        onLoginSuccess(userDoc.data() as UserProfile);
        onClose();
      } else {
        setPendingUser({
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          phone: user.phoneNumber || "",
          photoURL: user.photoURL || "",
        });
        setAuthState("complete-profile");
      }
    } catch (err: any) {
      console.error(`[Firebase Auth Error - Facebook Login]: Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'unknown'}`, err);
      if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Facebook Sign-In is not enabled. Please enable 'Facebook' in the Firebase Console (under Build > Authentication > Sign-in method).");
      } else if (err.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        setErrorMsg(`This domain (${currentDomain}) is not authorized for authentication in your Firebase Project. Please add it to the 'Authorized domains' list in the Firebase Console (Authentication > Settings > Authorized domains).`);
      } else {
        setErrorMsg(err.message || "Failed to sign in with Facebook.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatch OTP Verification Code to Phone
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        // Assume Indian +91 code if missing
        formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
      }

      const verifier = (window as any).recaptchaVerifier || recaptchaVerifier;
      if (!verifier) {
        throw new Error("reCAPTCHA verifier failed to load. Please refresh.");
      }

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setAuthState("otp-verification");
      setSuccessMsg(`OTP successfully dispatched to ${formattedPhone}!`);
    } catch (err: any) {
      console.error(`[Firebase Auth Error - Deployed App Debug]: Code: ${err.code || 'unknown'} | Message: ${err.message || 'unknown'}`, err);
      if (err.code === "auth/operation-not-allowed") {
        setErrorMsg(`Phone Sign-In is not enabled (Error: auth/operation-not-allowed). Please ensure 'Phone' is enabled under the 'Sign-in method' tab in Build > Authentication within your Firebase Console.`);
      } else if (err.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        setErrorMsg(`This domain (${currentDomain}) is not authorized for authentication in your Firebase Project. Please add it to the 'Authorized domains' list in the Firebase Console (Authentication > Settings > Authorized domains).`);
      } else {
        setErrorMsg(err.message || "Failed to send OTP code. Ensure number formatting is correct.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm OTP Verification Code
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (!confirmationResult) {
        throw new Error("No pending OTP request found.");
      }
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        onLoginSuccess(userDoc.data() as UserProfile);
        onClose();
      } else {
        setPendingUser({
          uid: user.uid,
          name: user.displayName || "Phone User",
          email: user.email || "",
          phone: user.phoneNumber || phone,
          photoURL: "",
        });
        setAuthState("complete-profile");
      }
    } catch (err: any) {
      console.error(`[Firebase Auth Error - OTP Verification]: Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'unknown'}`, err);
      setErrorMsg("Invalid OTP code. Please double check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Complete Registration Profile for Third-Party Logins
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    if (!name) {
      setErrorMsg("Name is required to complete profile.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    try {
      const profile: UserProfile = {
        uid: pendingUser.uid,
        name: name,
        email: pendingUser.email || `${pendingUser.uid}@citymate.in`,
        role: role,
        phone: phone || pendingUser.phone || "",
        cityPreference: "Bengaluru",
        createdAt: new Date().toISOString(),
        photoURL: pendingUser.photoURL || "",
      };

      await setDoc(doc(db, "users", pendingUser.uid), profile);
      onLoginSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error("Save profile error:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${pendingUser.uid}`);
      setErrorMsg("Failed to complete profile creation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email and Password Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Create user credential in Firebase
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userUid = cred.user.uid;

      // Dispatch verification email
      try {
        await sendEmailVerification(cred.user);
      } catch (verifyErr) {
        console.warn("Failed to send verification email:", verifyErr);
      }

      // Store in firestore
      const profile: UserProfile = {
        uid: userUid,
        name: name || "Anonymous User",
        email: email,
        role: role,
        phone: phone || "",
        cityPreference: "Bengaluru",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", userUid), profile);
      
      setSuccessMsg(`Account created! A verification link has been sent to ${email}.`);
      setAuthState("email-verification-pending");
    } catch (err: any) {
      console.error(`[Firebase Auth Error - Email Registration]: Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'unknown'}`, err);
      if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Email/Password registration is not enabled. Please enable 'Email/Password' in the Firebase Console (under Build > Authentication > Sign-in method).");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMsg("This email address is already in use.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters.");
      } else {
        setErrorMsg(err.message || "An error occurred during registration.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email and Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userUid = cred.user.uid;

      // Retrieve user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", userUid));
      
      if (userDoc.exists()) {
        onLoginSuccess(userDoc.data() as UserProfile);
        onClose();
      } else {
        // Restore minimal profile if Firestore is missing
        const profile: UserProfile = {
          uid: userUid,
          name: cred.user.displayName || "CityMate User",
          email: cred.user.email || email,
          role: "user",
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", userUid), profile);
        onLoginSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.error(`[Firebase Auth Error - Email Login]: Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'unknown'}`, err);
      if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Email/Password login is not enabled. Please enable 'Email/Password' in the Firebase Console (under Build > Authentication > Sign-in method).");
      } else if (
        err.code === "auth/wrong-password" || 
        err.code === "auth/user-not-found" || 
        err.code === "auth/invalid-credential"
      ) {
        setErrorMsg("Invalid email or password combination.");
      } else {
        setErrorMsg(err.message || "Failed to log in.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Trigger
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg(`A password reset link has been dispatched to ${email}. Check your inbox.`);
    } catch (err: any) {
      console.error(`[Firebase Auth Error - Password Reset]: Code: ${err?.code || 'unknown'} | Message: ${err?.message || 'unknown'}`, err);
      setErrorMsg(err.message || "Failed to trigger reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      {/* Invisible reCAPTCHA container required for Phone Auth */}
      <div 
        ref={recaptchaContainerRef}
        id="recaptcha-verifier-container" 
        className="absolute left-0 top-0 w-0 h-0 pointer-events-none opacity-0"
      ></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full max-w-lg rounded-3xl bg-white/70 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/40 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-left"
      >
        {/* Glow ambient design backdrops */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-brand-violet/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-brand-indigo/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-5 relative z-10">
          <div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              <span>
                {authState === "sign-in" && "Welcome to CityMate"}
                {authState === "sign-up" && "Create Premium Account"}
                {authState === "phone-input" && "Phone OTP Authentication"}
                {authState === "otp-verification" && "Enter OTP Verification"}
                {authState === "forgot-password" && "Password Recovery"}
                {authState === "complete-profile" && "Complete Your Profile"}
                {authState === "email-verification-pending" && "Verify Your Email"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              {authState === "complete-profile" 
                ? "Select your login role to finish setting up" 
                : "A premier relocation helper for Indian cities"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            id="auth-modal-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-3.5 text-xs font-semibold text-red-600 dark:text-red-400 flex flex-col gap-2 animate-in fade-in relative z-10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes("already in use") && (
              <button
                type="button"
                onClick={() => setAuthState("sign-in")}
                className="mt-1 self-start rounded-lg bg-red-100 dark:bg-red-900/40 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-all active:scale-95 cursor-pointer"
              >
                Switch to Sign In
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-start gap-2 animate-in fade-in relative z-10">
            <Check className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth State Body */}
        <div className="relative z-10">
          
          {/* STATE: SIGN IN */}
          {authState === "sign-in" && (
            <div className="space-y-5">
              
              {/* Quick Preset Sandbox accounts for testing */}
              <div className="rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/30 p-4">
                <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 mb-2">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Dev Sandbox Quick Login</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mb-3">
                  Click any verified preset account card below to bypass registrations entirely, and directly view dashboards in seconds.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePresetLogin("user")}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-center hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <User className="h-4 w-4 text-indigo-500" />
                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200">Seeker</span>
                  </button>
                  <button
                    onClick={() => handlePresetLogin("owner")}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-center hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <Building className="h-4 w-4 text-purple-500" />
                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200">Owner</span>
                  </button>
                  <button
                    onClick={() => handlePresetLogin("admin")}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 text-center hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <Shield className="h-4 w-4 text-red-500" />
                    <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200">Admin</span>
                  </button>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <GoogleIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Google</span>
                </button>

                <button
                  onClick={handleFacebookSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <FacebookIcon className="h-4 w-4 text-blue-600" />
                  <span className="hidden sm:inline">Facebook</span>
                </button>

                <button
                  onClick={() => setAuthState("phone-input")}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  <span className="hidden sm:inline">Phone</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">or email credentials</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthState("forgot-password")}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-12 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3.5 text-xs font-black shadow-lg hover:scale-[1.01] transition-all cursor-pointer hover:bg-slate-900 dark:hover:bg-slate-50 active:scale-95 disabled:opacity-50 mt-1"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In</span>}
                </button>
              </form>

              <div className="text-center text-xs mt-3">
                <span className="text-slate-500">New to CityMate? </span>
                <button
                  onClick={() => setAuthState("sign-up")}
                  className="font-extrabold text-indigo-600 hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>

            </div>
          )}

          {/* STATE: SIGN UP */}
          {authState === "sign-up" && (
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex flex-col items-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                      role === "user"
                        ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {role === "user" && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 animate-ping" />}
                    <User className="h-5 w-5 mb-1 text-indigo-500" />
                    <span className="text-xs font-extrabold">Seeker (Moving)</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Looking for PGs, flats, services</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`flex flex-col items-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                      role === "owner"
                        ? "border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {role === "owner" && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-500 animate-ping" />}
                    <Building className="h-5 w-5 mb-1 text-purple-500" />
                    <span className="text-xs font-extrabold">Owner (Listing)</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Post rooms, PGs, flats, mess</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-12 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 text-xs font-black shadow-lg transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50 mt-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign Up & Send Verification</span>}
              </button>

              <div className="text-center text-xs mt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setAuthState("sign-in")}
                  className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* STATE: PHONE OTP INPUT */}
          {authState === "phone-input" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number (with Country Code)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  We'll dispatch a 6-digit verification code to confirm your phone.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white py-3.5 text-xs font-black shadow-lg hover:scale-[1.01] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send OTP Code</span>}
              </button>

              <button
                type="button"
                onClick={() => setAuthState("sign-in")}
                className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer text-xs pt-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* STATE: OTP VERIFICATION */}
          {authState === "otp-verification" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enter Verification Code</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter the 6-digit code"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 tracking-widest text-center text-lg font-black block"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white py-3.5 text-xs font-black shadow-lg hover:scale-[1.01] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify and Authenticate</span>}
              </button>

              <div className="flex justify-between items-center text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setAuthState("phone-input")}
                  className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Edit Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // re-trigger phone submit
                    const fakeEvent = { preventDefault: () => {} } as any;
                    handleSendOTP(fakeEvent);
                  }}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* STATE: FORGOT PASSWORD */}
          {authState === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white py-3.5 text-xs font-black shadow-lg hover:scale-[1.01] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send Recovery Link</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setSuccessMsg("");
                  setAuthState("sign-in");
                }}
                className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer text-xs pt-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* STATE: EMAIL VERIFICATION PENDING */}
          {authState === "email-verification-pending" && (
            <div className="text-center py-6 space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border border-indigo-100 dark:border-indigo-900/40">
                <Mail className="h-6 w-6 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Verify Your Email Address</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-semibold">
                  We have dispatched a verification link to <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{email}</span>. Click the link inside the mail to verify your account, then click the button below to sign in!
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthState("sign-in");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="w-full rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3 text-xs font-black shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                >
                  Go to Sign In
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    setErrorMsg("");
                    try {
                      if (auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        setSuccessMsg("Verification link successfully resent.");
                      } else {
                        setErrorMsg("Please sign in first to request a verification email.");
                        setAuthState("sign-in");
                      }
                    } catch (err: any) {
                      setErrorMsg(err.message || "Failed to resend link.");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer block mx-auto"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          )}

          {/* STATE: COMPLETE THIRD-PARTY PROFILE */}
          {authState === "complete-profile" && pendingUser && (
            <form onSubmit={handleCompleteProfile} className="space-y-5">
              
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`flex flex-col items-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                      role === "user"
                        ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {role === "user" && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 animate-ping" />}
                    <User className="h-5 w-5 mb-1 text-indigo-500" />
                    <span className="text-xs font-extrabold">Seeker (Moving)</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Looking for PGs, flats, services</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("owner")}
                    className={`flex flex-col items-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                      role === "owner"
                        ? "border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {role === "owner" && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-500 animate-ping" />}
                    <Building className="h-5 w-5 mb-1 text-purple-500" />
                    <span className="text-xs font-extrabold">Owner (Listing)</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Post rooms, PGs, flats, mess</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold block"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold block"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3.5 text-xs font-black shadow-lg hover:scale-[1.01] transition-all cursor-pointer hover:bg-slate-900 dark:hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Complete Profile & Proceed</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setSuccessMsg("");
                  setPendingUser(null);
                  setAuthState("sign-in");
                }}
                className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer text-xs pt-1 mx-auto block text-center"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
}
