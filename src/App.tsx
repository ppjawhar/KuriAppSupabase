import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BadgeIndianRupee,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  House,
  LayoutDashboard,
  Layers3,
  Moon,
  Plus,
  RefreshCw,
  Trash2,
  UserCircle2,
  ShieldCheck,
  Sun,
  UserPlus,
  UsersRound,
  Wallet,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type OnboardingScreen = {
  title: string;
  body: string;
  cta: string;
  heroIcon: React.ComponentType<{ className?: string }>;
  heroTone: string;
  points: Array<{
    text: string;
    icon: React.ComponentType<{ className?: string }>;
    iconTone: string;
  }>;
};

type AuthView = "signin" | "signup";
type AppStage = "splash" | "onboarding" | "auth" | "home";
type ThemeMode = "light" | "dark";
type KuriFilter = "All" | "Claimed" | "Unclaimed" | "Active" | "Completed";
type AppTab = "home" | "kuries" | "account";
type AccountView = "menu" | "profile" | "appearance";
type KuriView =
  | "list"
  | "detail"
  | "completed-rounds"
  | "payment-history"
  | "claim-history";

type KuriItem = {
  id: string;
  name: string;
  status: "Active" | "Completed";
  claimStatus: "Unclaimed" | "Claimed" | "Fully Claimed";
  progress: number;
  duration: number;
  kuriAmount: number;
  monthlyAmount: number;
  organizer: string;
  referenceName?: string;
};

type KuriRow = {
  id: string;
  name: string;
  status: string;
  claim_status: string;
  progress: number;
  duration: number;
  kuri_amount: number;
  monthly_amount: number;
  organizer: string;
  reference_name: string | null;
  created_at: string;
};

type KuriRound = {
  id: string;
  kuriId: string;
  roundName: string;
  status: "Upcoming" | "Active" | "Completed";
  claimStatus: "Claimed" | "Partially Claimed" | "Unclaimed";
  currency: "INR" | "SGD" | "DHR";
  monthlyAmount: number;
  numberOfClaims: number;
  claimedAmount: number;
  totalValue: number;
  claimAmountPerClaim: number;
  startMonth: string;
  endMonth: string;
  paymentDate: number;
  paymentSchedule: string[];
  pendingClaimAmount: number;
  progress: number;
  duration: number;
};

type KuriRoundRow = {
  id: string;
  kuri_id: string;
  round_name: string;
  status: string;
  claim_status: string;
  currency: string;
  monthly_amount: number;
  number_of_claims: number;
  claimed_amount: number;
  total_value: number;
  claim_amount_per_claim: number;
  start_month: string;
  end_month: string;
  payment_date: number;
  payment_schedule: string[] | null;
  pending_claim_amount: number;
  progress: number;
  duration: number;
  created_at: string;
};

type KuriPaymentRow = {
  id: string;
  round_id: string;
  payment_month: string;
  amount_paid: number;
  paid_on: string;
  reference: string | null;
  note: string | null;
  attachment_url: string | null;
  created_at: string;
};

type KuriPaymentItem = {
  id: string;
  roundId: string;
  paymentMonth: string;
  amountPaid: number;
  paidOn: string;
  reference?: string;
  note?: string;
  attachmentUrl?: string;
};

type KuriClaimRow = {
  id: string;
  round_id: string;
  claim_sequence: number;
  amount_claimed: number;
  claimed_on: string;
  reference: string | null;
  note: string | null;
  attachment_url: string | null;
  created_at: string;
};

type KuriClaimItem = {
  id: string;
  roundId: string;
  claimSequence: number;
  amountClaimed: number;
  claimedOn: string;
  reference?: string;
  note?: string;
  attachmentUrl?: string;
};

type KuriListViewItem = KuriItem & {
  hasActiveRound: boolean;
  hasAnyRound: boolean;
  latestCompletedRound?: KuriRound;
  cardStatus: "Active" | "Completed" | "No active round";
  cardClaimStatus: "Claimed" | "Partially Claimed" | "Unclaimed";
  cardProgress: number;
  cardDuration: number;
  cardKuriAmount: number;
  cardMonthlyAmount: number;
};

const mapRoundStatus = (
  status: string,
): "Upcoming" | "Active" | "Completed" => {
  if (status === "Upcoming" || status === "Completed") return status;
  return "Active";
};

const mapClaimStatus = (
  status: string,
): "Claimed" | "Partially Claimed" | "Unclaimed" => {
  if (status === "Claimed" || status === "Partially Claimed") return status;
  return "Unclaimed";
};

const onboardingScreens: OnboardingScreen[] = [
  {
    title: "See every Kuri in one place",
    body: "Track personal and group Kuries, monthly dues, claim status and remaining months from one calm dashboard.",
    cta: "Next",
    heroIcon: LayoutDashboard,
    heroTone: "bg-blue-100 text-chart-2",
    points: [
      {
        text: "Active Kuries and monthly totals",
        icon: LayoutDashboard,
        iconTone: "text-chart-2",
      },
      {
        text: "Upcoming commitments and reminders",
        icon: Clock3,
        iconTone: "text-chart-4",
      },
    ],
  },
  {
    title: "Coordinate trusted groups",
    body: "Invite members by mobile number, record payment logs, and keep lot results visible to everyone in the group.",
    cta: "Next",
    heroIcon: UsersRound,
    heroTone: "bg-green-100 text-chart-3",
    points: [
      {
        text: "Invite members by phone number",
        icon: UserPlus,
        iconTone: "text-chart-3",
      },
      {
        text: "Draw history and audit trail",
        icon: Clock3,
        iconTone: "text-chart-1",
      },
    ],
  },
  {
    title: "Transparent, without handling money",
    body: "KuriApp records what happened. It does not collect payments. It never handles real funds.",
    cta: "Get Started",
    heroIcon: ShieldCheck,
    heroTone: "bg-yellow-100 text-yellow-500",
    points: [
      {
        text: "No money collection in the app",
        icon: BadgeIndianRupee,
        iconTone: "text-chart-4",
      },
      {
        text: "Clear claimed and unclaimed status",
        icon: CheckCircle2,
        iconTone: "text-chart-3",
      },
    ],
  },
];

const ONBOARDING_KEY = "kuriapp_onboarding_done";
const THEME_KEY = "kuriapp_theme";

function App() {
  const [stage, setStage] = useState<AppStage>("splash");
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [authView, setAuthView] = useState<AuthView>("signin");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [accountView, setAccountView] = useState<AccountView>("menu");
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordMessage, setChangePasswordMessage] = useState("");
  const [kuriView, setKuriView] = useState<KuriView>("list");
  const [kuriFilter, setKuriFilter] = useState<KuriFilter>("All");
  const [showAddKuri, setShowAddKuri] = useState(false);
  const [kuries, setKuries] = useState<KuriItem[]>([]);
  const [selectedKuriId, setSelectedKuriId] = useState<string>("");
  const [kuriLoading, setKuriLoading] = useState(false);
  const [kuriDbError, setKuriDbError] = useState("");
  const [roundDbError, setRoundDbError] = useState("");
  const [roundLoading, setRoundLoading] = useState(false);
  const [rounds, setRounds] = useState<KuriRound[]>([]);
  const [allRounds, setAllRounds] = useState<KuriRound[]>([]);
  const [showNewRoundDrawer, setShowNewRoundDrawer] = useState(false);
  const [kuriName, setKuriName] = useState("");
  const [kuriOrganizer, setKuriOrganizer] = useState("");
  const [kuriReference, setKuriReference] = useState("");
  const [roundStartMonth, setRoundStartMonth] = useState("");
  const [roundName, setRoundName] = useState("");
  const [roundCurrency, setRoundCurrency] = useState<"INR" | "SGD" | "DHR">(
    "INR",
  );
  const [roundMonthlyAmount, setRoundMonthlyAmount] = useState("");
  const [roundDuration, setRoundDuration] = useState("");
  const [roundClaims, setRoundClaims] = useState("");
  const [roundPaymentDate, setRoundPaymentDate] = useState("");
  const [roundClaimedAmount, setRoundClaimedAmount] = useState("");
  const [payments, setPayments] = useState<KuriPaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [claims, setClaims] = useState<KuriClaimItem[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState("");
  const [historyRoundId, setHistoryRoundId] = useState("");
  const [showMarkPaymentDrawer, setShowMarkPaymentDrawer] = useState(false);
  const [paymentDbError, setPaymentDbError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidOnDate, setPaidOnDate] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentAttachment, setPaymentAttachment] = useState<File | null>(null);
  const [showMarkClaimDrawer, setShowMarkClaimDrawer] = useState(false);
  const [claimDbError, setClaimDbError] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimDate, setClaimDate] = useState("");
  const [claimReference, setClaimReference] = useState("");
  const [claimNote, setClaimNote] = useState("");
  const [claimAttachment, setClaimAttachment] = useState<File | null>(null);
  const [claimsCount, setClaimsCount] = useState(0);
  const [showDeleteKuriDialog, setShowDeleteKuriDialog] = useState(false);
  const [deleteKuriLoading, setDeleteKuriLoading] = useState(false);
  const [dataRefreshVersion, setDataRefreshVersion] = useState(0);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const initialTheme: ThemeMode = storedTheme ?? "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(existingSession);

      if (existingSession) {
        setStage("home");
        return;
      }

      const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === "true";
      setStage(onboardingDone ? "auth" : "splash");
    };

    void bootstrap();

    const splashTimer = window.setTimeout(() => {
      setStage((current) => (current === "splash" ? "onboarding" : current));
    }, 2200);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setStage("home");
    });

    return () => {
      isMounted = false;
      window.clearTimeout(splashTimer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadKuries = async () => {
      if (!session?.user?.id) {
        setKuries([]);
        setSelectedKuriId("");
        return;
      }

      setKuriLoading(true);
      setKuriDbError("");

      const { data, error } = await supabase
        .from("kuries")
        .select(
          "id,name,status,claim_status,progress,duration,kuri_amount,monthly_amount,organizer,reference_name,created_at",
        )
        .order("created_at", { ascending: false });

      setKuriLoading(false);

      if (error) {
        setKuriDbError(error.message);
        return;
      }

      const mapped: KuriItem[] = ((data ?? []) as KuriRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status === "Completed" ? "Completed" : "Active",
        claimStatus:
          row.claim_status === "Claimed" || row.claim_status === "Fully Claimed"
            ? row.claim_status
            : "Unclaimed",
        progress: row.progress ?? 0,
        duration: row.duration ?? 12,
        kuriAmount: Number(row.kuri_amount ?? 0),
        monthlyAmount: Number(row.monthly_amount ?? 0),
        organizer: row.organizer,
        referenceName: row.reference_name ?? undefined,
      }));

      setKuries(mapped);
      setSelectedKuriId((prev) => prev || mapped[0]?.id || "");
    };

    void loadKuries();
  }, [session?.user?.id, dataRefreshVersion]);

  useEffect(() => {
    const loadRounds = async () => {
      if (!session?.user?.id || !selectedKuriId) {
        setRounds([]);
        return;
      }
      setRoundLoading(true);
      setRoundDbError("");

      const { data, error } = await supabase
        .from("kuri_rounds")
        .select(
          "id,kuri_id,round_name,status,claim_status,currency,monthly_amount,number_of_claims,claimed_amount,total_value,claim_amount_per_claim,start_month,end_month,payment_date,payment_schedule,pending_claim_amount,progress,duration,created_at",
        )
        .eq("kuri_id", selectedKuriId)
        .order("created_at", { ascending: false });

      setRoundLoading(false);

      if (error) {
        setRoundDbError(error.message);
        return;
      }

      const mapped: KuriRound[] = ((data ?? []) as KuriRoundRow[]).map(
        (row) => {
          const claimedAmount = Number(row.claimed_amount ?? 0);
          const totalValue = Number(row.total_value ?? 0);
          const progress = row.progress ?? 0;
          const duration = row.duration ?? 12;
          const status = computeRoundStatus(
            row.start_month,
            progress,
            duration,
            claimedAmount,
            totalValue,
          );

          return {
            id: row.id,
            kuriId: row.kuri_id,
            roundName: row.round_name,
            status,
            claimStatus: mapClaimStatus(row.claim_status),
            currency:
              row.currency === "SGD" || row.currency === "DHR"
                ? row.currency
                : "INR",
            monthlyAmount: Number(row.monthly_amount ?? 0),
            numberOfClaims: row.number_of_claims ?? 1,
            claimedAmount,
            totalValue,
            claimAmountPerClaim: Number(row.claim_amount_per_claim ?? 0),
            startMonth: row.start_month,
            endMonth: row.end_month,
            paymentDate: row.payment_date ?? 1,
            paymentSchedule: row.payment_schedule ?? [],
            pendingClaimAmount: Number(row.pending_claim_amount ?? 0),
            progress,
            duration,
          };
        },
      );

      setRounds(mapped);
    };

    void loadRounds();
  }, [session?.user?.id, selectedKuriId, dataRefreshVersion]);

  useEffect(() => {
    const loadAllRounds = async () => {
      if (!session?.user?.id) {
        setAllRounds([]);
        return;
      }

      const { data, error } = await supabase
        .from("kuri_rounds")
        .select(
          "id,kuri_id,round_name,status,claim_status,currency,monthly_amount,number_of_claims,claimed_amount,total_value,claim_amount_per_claim,start_month,end_month,payment_date,payment_schedule,pending_claim_amount,progress,duration,created_at",
        )
        .order("created_at", { ascending: false });

      if (error) return;

      const mapped: KuriRound[] = ((data ?? []) as KuriRoundRow[]).map(
        (row) => {
          const claimedAmount = Number(row.claimed_amount ?? 0);
          const totalValue = Number(row.total_value ?? 0);
          const progress = row.progress ?? 0;
          const duration = row.duration ?? 12;
          const status = computeRoundStatus(
            row.start_month,
            progress,
            duration,
            claimedAmount,
            totalValue,
          );

          return {
            id: row.id,
            kuriId: row.kuri_id,
            roundName: row.round_name,
            status,
            claimStatus: mapClaimStatus(row.claim_status),
            currency:
              row.currency === "SGD" || row.currency === "DHR"
                ? row.currency
                : "INR",
            monthlyAmount: Number(row.monthly_amount ?? 0),
            numberOfClaims: row.number_of_claims ?? 1,
            claimedAmount,
            totalValue,
            claimAmountPerClaim: Number(row.claim_amount_per_claim ?? 0),
            startMonth: row.start_month,
            endMonth: row.end_month,
            paymentDate: row.payment_date ?? 1,
            paymentSchedule: row.payment_schedule ?? [],
            pendingClaimAmount: Number(row.pending_claim_amount ?? 0),
            progress,
            duration,
          };
        },
      );

      setAllRounds(mapped);
    };

    void loadAllRounds();
  }, [session?.user?.id, dataRefreshVersion]);

  useEffect(() => {
    const loadPayments = async () => {
      const currentHistoryRound =
        rounds.find((round) => round.id === historyRoundId) ??
        rounds.find((round) => round.status === "Active") ??
        rounds[0];
      if (!session?.user?.id || !currentHistoryRound?.id) {
        setPayments([]);
        return;
      }

      setPaymentsLoading(true);
      setPaymentsError("");

      const { data, error } = await supabase
        .from("kuri_payments")
        .select(
          "id,round_id,payment_month,amount_paid,paid_on,reference,note,attachment_url,created_at",
        )
        .eq("round_id", currentHistoryRound.id)
        .order("payment_month", { ascending: false });

      setPaymentsLoading(false);

      if (error) {
        setPaymentsError(error.message);
        return;
      }

      const mapped: KuriPaymentItem[] = ((data ?? []) as KuriPaymentRow[]).map(
        (row) => ({
          id: row.id,
          roundId: row.round_id,
          paymentMonth: row.payment_month,
          amountPaid: Number(row.amount_paid ?? 0),
          paidOn: row.paid_on,
          reference: row.reference ?? undefined,
          note: row.note ?? undefined,
          attachmentUrl: row.attachment_url ?? undefined,
        }),
      );

      setPayments(mapped);
    };

    void loadPayments();
  }, [session?.user?.id, selectedKuriId, rounds, historyRoundId, dataRefreshVersion]);

  useEffect(() => {
    const loadClaims = async () => {
      const currentHistoryRound =
        rounds.find((round) => round.id === historyRoundId) ??
        rounds.find((round) => round.status === "Active") ??
        rounds[0];
      if (!session?.user?.id || !currentHistoryRound?.id) {
        setClaims([]);
        return;
      }

      setClaimsLoading(true);
      setClaimsError("");

      const { data, error } = await supabase
        .from("kuri_claims")
        .select(
          "id,round_id,claim_sequence,amount_claimed,claimed_on,reference,note,attachment_url,created_at",
        )
        .eq("round_id", currentHistoryRound.id)
        .order("claim_sequence", { ascending: false });

      setClaimsLoading(false);

      if (error) {
        setClaimsError(error.message);
        return;
      }

      const mapped: KuriClaimItem[] = ((data ?? []) as KuriClaimRow[]).map(
        (row) => ({
          id: row.id,
          roundId: row.round_id,
          claimSequence: row.claim_sequence,
          amountClaimed: Number(row.amount_claimed ?? 0),
          claimedOn: row.claimed_on,
          reference: row.reference ?? undefined,
          note: row.note ?? undefined,
          attachmentUrl: row.attachment_url ?? undefined,
        }),
      );

      setClaims(mapped);
    };

    void loadClaims();
  }, [session?.user?.id, selectedKuriId, rounds, historyRoundId, dataRefreshVersion]);

  useEffect(() => {
    const loadClaimsCount = async () => {
      const currentActiveRound =
        rounds.find((round) => round.status === "Active") ?? rounds[0];
      if (!session?.user?.id || !currentActiveRound?.id) {
        setClaimsCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("kuri_claims")
        .select("id", { count: "exact", head: true })
        .eq("round_id", currentActiveRound.id);

      if (error) {
        setClaimsCount(0);
        return;
      }

      setClaimsCount(count ?? 0);
    };

    void loadClaimsCount();
  }, [session?.user?.id, selectedKuriId, rounds, dataRefreshVersion]);

  const current = onboardingScreens[index];

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setStage("auth");
    setAuthView("signin");
  };

  const goNext = () => {
    if (index < onboardingScreens.length - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    completeOnboarding();
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });

    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }

    setAuthMessage("Signed in successfully.");
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");

    if (signUpPassword !== signUpConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);

    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: { full_name: signUpName },
      },
    });

    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }

    setAuthMessage(
      "Account created. Check your email to verify your account before signing in.",
    );
    setAuthView("signin");
    setSignInEmail(signUpEmail);
    setSignInPassword("");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStage("auth");
    setAuthView("signin");
  };

  const handleChangePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setChangePasswordError("");
    setChangePasswordMessage("");

    if (newPassword.length < 8) {
      setChangePasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("New password and confirm password do not match.");
      return;
    }

    setChangePasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangePasswordLoading(false);

    if (error) {
      setChangePasswordError(error.message);
      return;
    }

    setChangePasswordMessage("Password updated successfully.");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowChangePasswordForm(false);
  };

  const listItems: KuriListViewItem[] = kuries.map((kuri) => {
    const kuriRounds = allRounds.filter((round) => round.kuriId === kuri.id);
    const active = kuriRounds.find((round) => round.status === "Active");
    const latestCompleted = kuriRounds.find(
      (round) => round.status === "Completed",
    );
    const hasActiveRound = Boolean(active);
    const hasAnyRound = kuriRounds.length > 0;
    const cardStatus: "Active" | "Completed" | "No active round" =
      hasActiveRound
        ? "Active"
        : latestCompleted
          ? "Completed"
          : "No active round";
    const cardClaimStatus: "Claimed" | "Partially Claimed" | "Unclaimed" =
      active?.claimStatus ?? latestCompleted?.claimStatus ?? "Unclaimed";

    return {
      ...kuri,
      hasActiveRound,
      hasAnyRound,
      latestCompletedRound: latestCompleted,
      cardStatus,
      cardClaimStatus,
      cardProgress: active?.progress ?? 0,
      cardDuration: active?.duration ?? 0,
      cardKuriAmount: active?.totalValue ?? 0,
      cardMonthlyAmount: active?.monthlyAmount ?? 0,
    };
  });

  const filteredKuries = listItems.filter((kuri) => {
    if (kuriFilter === "All") return true;
    if (kuriFilter === "Active") return kuri.cardStatus === "Active";
    if (kuriFilter === "Completed") return kuri.cardStatus === "Completed";
    if (kuriFilter === "Claimed") return kuri.cardClaimStatus === "Claimed";
    if (kuriFilter === "Unclaimed") return kuri.cardClaimStatus === "Unclaimed";
    return true;
  });

  const selectedKuri =
    kuries.find((kuri) => kuri.id === selectedKuriId) ?? kuries[0];
  const hasActiveRound = rounds.some((round) => round.status === "Active");
  const activeRound = rounds.find((round) => round.status === "Active");
  const historyRound =
    rounds.find((round) => round.id === historyRoundId) ??
    activeRound ??
    rounds[0];
  const completedRounds = rounds.filter(
    (round) => round.status === "Completed",
  );
  const selectedKuriHasActiveRound = Boolean(
    selectedKuri &&
    allRounds.some(
      (round) => round.kuriId === selectedKuri.id && round.status === "Active",
    ),
  );
  const nextClaimSequence = activeRound
    ? Math.min(claimsCount + 1, activeRound.numberOfClaims)
    : 1;
  const remainingAmountToPay = activeRound
    ? Math.max(
        activeRound.monthlyAmount *
          Math.max(activeRound.duration - activeRound.progress, 0),
        0,
      )
    : 0;
  const activeRounds = allRounds.filter((round) => round.status === "Active");
  const activeKuriesCount = new Set(activeRounds.map((round) => round.kuriId))
    .size;
  const toPayThisMonth = activeRounds.reduce(
    (sum, round) => sum + round.monthlyAmount,
    0,
  );
  const unclaimedRemaining = activeRounds.reduce(
    (sum, round) => sum + round.pendingClaimAmount,
    0,
  );
  const showBottomMenu =
    activeTab === "home" ||
    activeTab === "account" ||
    (activeTab === "kuries" && kuriView === "list");

  const formatInr = (value: number) => `INR ${value.toLocaleString("en-IN")}`;
  const formatMoney = (currency: "INR" | "SGD" | "DHR", value: number) => {
    const symbol =
      currency === "INR" ? "INR" : currency === "SGD" ? "SGD" : "DHR";
    return `${symbol} ${value.toLocaleString("en-IN")}`;
  };
  const formatCompactInr = (value: number) => {
    const compact = new Intl.NumberFormat("en-IN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
    return `Rs ${compact}`;
  };
  const formatMonthLabel = (value: string) => {
    if (!value) return "-";
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return value;
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };
  const formatDateLabel = (value: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB");
  };
  const claimPillWidthClass = (
    status: "Claimed" | "Partially Claimed" | "Unclaimed",
  ) => {
    if (status === "Partially Claimed") return "w-[134px]";
    if (status === "Claimed") return "w-[100px]";
    return "w-[87px]";
  };
  const claimPillToneClass = (
    status: "Claimed" | "Partially Claimed" | "Unclaimed",
  ) => {
    if (status === "Claimed") return "bg-emerald-100 text-emerald-700";
    if (status === "Partially Claimed") return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  };
  const claimPillIconClass = (
    status: "Claimed" | "Partially Claimed" | "Unclaimed",
  ) => {
    if (status === "Claimed") return "text-emerald-600";
    if (status === "Partially Claimed") return "text-amber-600";
    return "text-rose-600";
  };

  const addMonths = (monthValue: string, monthsToAdd: number) => {
    const [year, month] = monthValue.split("-").map(Number);
    const d = new Date(year, (month || 1) - 1, 1);
    d.setMonth(d.getMonth() + monthsToAdd);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const nextInstallment = activeRound
    ? Math.min(activeRound.progress + 1, activeRound.duration)
    : 1;
  const nextPaymentMonth = activeRound
    ? addMonths(activeRound.startMonth, Math.max(nextInstallment - 1, 0))
    : "";
  const monthToNumber = (monthValue: string) => {
    const [year, month] = monthValue.split("-").map(Number);
    return year * 12 + (month - 1);
  };
  const buildPaymentSchedule = (startMonth: string, duration: number) =>
    Array.from({ length: Math.max(duration, 0) }, (_, idx) =>
      addMonths(startMonth, idx),
    );
  const computeRoundStatus = (
    startMonth: string,
    progress: number,
    duration: number,
    claimedAmount: number,
    totalValue: number,
  ): "Upcoming" | "Active" | "Completed" => {
    const isPaymentComplete = progress >= duration;
    const isClaimComplete = claimedAmount >= totalValue && totalValue > 0;
    if (isPaymentComplete && isClaimComplete) return "Completed";
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentNum = monthToNumber(currentMonth);
    if (currentNum < monthToNumber(startMonth)) return "Upcoming";
    return "Active";
  };
  const computeClaimStatus = (
    claimedAmount: number,
    totalValue: number,
  ): "Claimed" | "Partially Claimed" | "Unclaimed" => {
    if (claimedAmount <= 0) return "Unclaimed";
    if (claimedAmount >= totalValue) return "Claimed";
    return "Partially Claimed";
  };

  const openKuriDetail = (kuriId: string) => {
    setSelectedKuriId(kuriId);
    setKuriView("detail");
    setShowAddKuri(false);
  };
  const bumpDataRefresh = () =>
    setDataRefreshVersion((current) => current + 1);

  const submitRound = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id || !selectedKuri) return;

    const monthly = Number(roundMonthlyAmount);
    const duration = Number(roundDuration);
    const claims = Number(roundClaims);
    const paymentDate = Number(roundPaymentDate);
    const claimed = Number(roundClaimedAmount || 0);

    if (
      !roundName.trim() ||
      !roundStartMonth ||
      !monthly ||
      !duration ||
      !claims ||
      !paymentDate
    ) {
      setRoundDbError("Please fill all required round fields.");
      return;
    }
    if (paymentDate < 1 || paymentDate > 31) {
      setRoundDbError("Payment Date should be between 1 and 31.");
      return;
    }

    const totalValue = monthly * duration;
    const claimAmountPerClaim = totalValue / claims;
    const pendingClaimAmount = Math.max(totalValue - claimed, 0);
    const endMonth = addMonths(roundStartMonth, Math.max(duration - 1, 0));
    const paymentSchedule = buildPaymentSchedule(roundStartMonth, duration);
    const progress = 0;
    const status = computeRoundStatus(
      roundStartMonth,
      progress,
      duration,
      claimed,
      totalValue,
    );
    const claimStatus = computeClaimStatus(claimed, totalValue);

    setRoundDbError("");
    const { data, error } = await supabase
      .from("kuri_rounds")
      .insert({
        user_id: session.user.id,
        kuri_id: selectedKuri.id,
        round_name: roundName.trim(),
        status,
        claim_status: claimStatus,
        currency: roundCurrency,
        monthly_amount: monthly,
        number_of_claims: claims,
        claimed_amount: claimed,
        total_value: totalValue,
        claim_amount_per_claim: claimAmountPerClaim,
        start_month: roundStartMonth,
        end_month: endMonth,
        payment_date: paymentDate,
        payment_schedule: paymentSchedule,
        pending_claim_amount: pendingClaimAmount,
        progress,
        duration,
      })
      .select(
        "id,kuri_id,round_name,status,claim_status,currency,monthly_amount,number_of_claims,claimed_amount,total_value,claim_amount_per_claim,start_month,end_month,payment_date,payment_schedule,pending_claim_amount,progress,duration,created_at",
      )
      .single();

    if (error || !data) {
      setRoundDbError(error?.message ?? "Failed to create round.");
      return;
    }

    const created: KuriRound = {
      id: data.id,
      kuriId: data.kuri_id,
      roundName: data.round_name,
      status: mapRoundStatus(data.status),
      claimStatus: mapClaimStatus(data.claim_status),
      currency:
        data.currency === "SGD" || data.currency === "DHR"
          ? data.currency
          : "INR",
      monthlyAmount: Number(data.monthly_amount ?? 0),
      numberOfClaims: data.number_of_claims ?? 1,
      claimedAmount: Number(data.claimed_amount ?? 0),
      totalValue: Number(data.total_value ?? 0),
      claimAmountPerClaim: Number(data.claim_amount_per_claim ?? 0),
      startMonth: data.start_month,
      endMonth: data.end_month,
      paymentDate: data.payment_date ?? 1,
      paymentSchedule: data.payment_schedule ?? [],
      pendingClaimAmount: Number(data.pending_claim_amount ?? 0),
      progress: data.progress ?? 0,
      duration: data.duration ?? 12,
    };

    setRounds((prev) => [created, ...prev]);
    setRoundName("");
    setRoundStartMonth("");
    setRoundCurrency("INR");
    setRoundMonthlyAmount("");
    setRoundDuration("");
    setRoundClaims("");
    setRoundPaymentDate("");
    setRoundClaimedAmount("");
    setShowNewRoundDrawer(false);
    bumpDataRefresh();
  };

  const submitKuri = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id) return;

    const trimmedName = kuriName.trim();
    const trimmedOrganizer = kuriOrganizer.trim();
    if (!trimmedName || !trimmedOrganizer) return;

    setKuriDbError("");
    const { data, error } = await supabase
      .from("kuries")
      .insert({
        user_id: session.user.id,
        name: trimmedName,
        organizer: trimmedOrganizer,
        reference_name: kuriReference.trim() || null,
        status: "Active",
        claim_status: "Unclaimed",
        progress: 0,
        duration: 12,
        kuri_amount: 100000,
        monthly_amount: 10000,
      })
      .select(
        "id,name,status,claim_status,progress,duration,kuri_amount,monthly_amount,organizer,reference_name,created_at",
      )
      .single();

    if (error || !data) {
      setKuriDbError(error?.message ?? "Failed to create kuri.");
      return;
    }

    const created: KuriItem = {
      id: data.id,
      name: data.name,
      status: data.status === "Completed" ? "Completed" : "Active",
      claimStatus:
        data.claim_status === "Claimed" || data.claim_status === "Fully Claimed"
          ? data.claim_status
          : "Unclaimed",
      progress: data.progress ?? 0,
      duration: data.duration ?? 12,
      kuriAmount: Number(data.kuri_amount ?? 0),
      monthlyAmount: Number(data.monthly_amount ?? 0),
      organizer: data.organizer,
      referenceName: data.reference_name ?? undefined,
    };

    setKuries((prev) => [created, ...prev]);
    setKuriName("");
    setKuriOrganizer("");
    setKuriReference("");
    setShowAddKuri(false);
    setActiveTab("kuries");
    openKuriDetail(created.id);
    bumpDataRefresh();
  };

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id || !selectedKuri || !activeRound) return;

    const paidAmountValue = Number(activeRound.monthlyAmount);
    const paymentMonth = nextPaymentMonth;

    if (!paymentMonth || !paidOnDate || !paidAmountValue) {
      setPaymentDbError("Please fill all required payment fields.");
      return;
    }
    if (activeRound.progress >= activeRound.duration) {
      setPaymentDbError("All installments are already paid for this round.");
      return;
    }
    if (paidAmountValue <= 0) {
      setPaymentDbError("Amount paid should be greater than zero.");
      return;
    }

    setPaymentDbError("");
    setPaymentLoading(true);

    const { data: existing, error: existingError } = await supabase
      .from("kuri_payments")
      .select("id")
      .eq("round_id", activeRound.id)
      .eq("payment_month", paymentMonth)
      .maybeSingle();

    if (existingError) {
      setPaymentLoading(false);
      setPaymentDbError(existingError.message);
      return;
    }
    if (existing) {
      setPaymentLoading(false);
      setPaymentDbError("A payment for this month is already recorded.");
      return;
    }

    let attachmentUrl: string | null = null;
    if (paymentAttachment) {
      const extension = paymentAttachment.name.split(".").pop() || "bin";
      const filePath = `${session.user.id}/${activeRound.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-attachments")
        .upload(filePath, paymentAttachment, { upsert: false });
      if (uploadError) {
        setPaymentLoading(false);
        setPaymentDbError(uploadError.message);
        return;
      }
      const { data: publicData } = supabase.storage
        .from("payment-attachments")
        .getPublicUrl(filePath);
      attachmentUrl = publicData.publicUrl;
    }

    const { error: insertError } = await supabase.from("kuri_payments").insert({
      user_id: session.user.id,
      kuri_id: selectedKuri.id,
      round_id: activeRound.id,
      payment_month: paymentMonth,
      amount_paid: paidAmountValue,
      paid_on: paidOnDate,
      reference: paymentRef.trim() || null,
      note: paymentNote.trim() || null,
      attachment_url: attachmentUrl,
    });

    if (insertError) {
      setPaymentLoading(false);
      setPaymentDbError(insertError.message);
      return;
    }

    const { count, error: countError } = await supabase
      .from("kuri_payments")
      .select("id", { count: "exact", head: true })
      .eq("round_id", activeRound.id);

    if (countError) {
      setPaymentLoading(false);
      setPaymentDbError(countError.message);
      return;
    }

    const nextProgress = Math.min(
      count ?? 0,
      Math.max(activeRound.duration, 0),
    );
    const nextStatus = computeRoundStatus(
      activeRound.startMonth,
      nextProgress,
      activeRound.duration,
      activeRound.claimedAmount,
      activeRound.totalValue,
    );

    const { error: updateError } = await supabase
      .from("kuri_rounds")
      .update({
        progress: nextProgress,
        status: nextStatus,
      })
      .eq("id", activeRound.id);

    setPaymentLoading(false);

    if (updateError) {
      setPaymentDbError(updateError.message);
      return;
    }

    setRounds((prev) =>
      prev.map((round) =>
        round.id === activeRound.id
          ? {
              ...round,
              progress: nextProgress,
              status: nextStatus,
            }
          : round,
      ),
    );

    setPaidOnDate("");
    setPaymentRef("");
    setPaymentNote("");
    setPaymentAttachment(null);
    setShowMarkPaymentDrawer(false);
    bumpDataRefresh();
  };

  const submitClaim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id || !selectedKuri || !activeRound) return;

    const claimAmount = Number(activeRound.claimAmountPerClaim);
    if (!claimDate || claimAmount <= 0) {
      setClaimDbError("Please fill all required claim fields.");
      return;
    }
    if (claimsCount >= activeRound.numberOfClaims) {
      setClaimDbError("All claims are already recorded for this round.");
      return;
    }

    setClaimDbError("");
    setClaimLoading(true);

    let attachmentUrl: string | null = null;
    if (claimAttachment) {
      const extension = claimAttachment.name.split(".").pop() || "bin";
      const filePath = `${session.user.id}/${activeRound.id}/claim-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("claim-attachments")
        .upload(filePath, claimAttachment, { upsert: false });
      if (uploadError) {
        setClaimLoading(false);
        setClaimDbError(uploadError.message);
        return;
      }
      const { data: publicData } = supabase.storage
        .from("claim-attachments")
        .getPublicUrl(filePath);
      attachmentUrl = publicData.publicUrl;
    }

    const claimSequence = claimsCount + 1;
    const { error: insertError } = await supabase.from("kuri_claims").insert({
      user_id: session.user.id,
      kuri_id: selectedKuri.id,
      round_id: activeRound.id,
      claim_sequence: claimSequence,
      amount_claimed: claimAmount,
      claimed_on: claimDate,
      reference: claimReference.trim() || null,
      note: claimNote.trim() || null,
      attachment_url: attachmentUrl,
    });

    if (insertError) {
      setClaimLoading(false);
      setClaimDbError(insertError.message);
      return;
    }

    const nextClaimedAmount = Math.min(
      activeRound.claimedAmount + claimAmount,
      activeRound.totalValue,
    );
    const nextPendingClaimAmount = Math.max(
      activeRound.totalValue - nextClaimedAmount,
      0,
    );
    const nextClaimStatus = computeClaimStatus(
      nextClaimedAmount,
      activeRound.totalValue,
    );
    const nextRoundStatus = computeRoundStatus(
      activeRound.startMonth,
      activeRound.progress,
      activeRound.duration,
      nextClaimedAmount,
      activeRound.totalValue,
    );

    const { error: updateError } = await supabase
      .from("kuri_rounds")
      .update({
        claimed_amount: nextClaimedAmount,
        pending_claim_amount: nextPendingClaimAmount,
        claim_status: nextClaimStatus,
        status: nextRoundStatus,
      })
      .eq("id", activeRound.id);

    setClaimLoading(false);

    if (updateError) {
      setClaimDbError(updateError.message);
      return;
    }

    setRounds((prev) =>
      prev.map((round) =>
        round.id === activeRound.id
          ? {
              ...round,
              claimedAmount: nextClaimedAmount,
              pendingClaimAmount: nextPendingClaimAmount,
              claimStatus: nextClaimStatus,
              status: nextRoundStatus,
            }
          : round,
      ),
    );
    setClaimsCount((prev) => prev + 1);
    setClaimDate("");
    setClaimReference("");
    setClaimNote("");
    setClaimAttachment(null);
    setShowMarkClaimDrawer(false);
    bumpDataRefresh();
  };

  const deleteSelectedKuri = async () => {
    if (!selectedKuri) return;
    if (selectedKuriHasActiveRound) {
      setKuriDbError("You cannot delete a Kuri with an active round.");
      setShowDeleteKuriDialog(false);
      return;
    }

    setDeleteKuriLoading(true);
    setKuriDbError("");
    const { error } = await supabase
      .from("kuries")
      .delete()
      .eq("id", selectedKuri.id);
    setDeleteKuriLoading(false);

    if (error) {
      setKuriDbError(error.message);
      return;
    }

    const remainingKuries = kuries.filter(
      (kuri) => kuri.id !== selectedKuri.id,
    );
    setKuries(remainingKuries);
    setAllRounds((prev) =>
      prev.filter((round) => round.kuriId !== selectedKuri.id),
    );
    setRounds([]);
    setSelectedKuriId(remainingKuries[0]?.id ?? "");
    setKuriView("list");
    setShowDeleteKuriDialog(false);
    bumpDataRefresh();
  };

  const themeToggle = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 rounded-md"
      onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
    >
      {theme === "light" ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
      <span>{theme === "light" ? "Dark" : "Light"} mode</span>
    </Button>
  );

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[800px] flex-col overflow-hidden bg-background text-foreground">
      {stage === "splash" && (
        <section className="flex min-h-svh flex-1 flex-col items-center bg-primary px-8 pb-12 pt-24 text-center text-primary-foreground">
          <div className="mt-48 flex flex-1 flex-col items-center">
            <div className="grid size-20 place-items-center rounded-[24px] bg-card">
              <BadgeIndianRupee className="size-9 text-primary" />
            </div>
            <h1 className="mt-4 text-[36px] leading-[1] font-bold tracking-[-0.025em]">
              KuriApp
            </h1>
            <p className="mt-2.5 max-w-[333px] text-[14px] leading-6 text-primary-foreground">
              Simple, transparent Kuri tracking for trusted groups.
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary/80 px-3 py-[7px] text-xs leading-4">
              <ShieldCheck className="size-4" />
              <span>No money handling</span>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground/80" />
            </div>
            <p className="text-xs leading-4 font-semibold">
              Preparing your KuriApp
            </p>
          </div>
        </section>
      )}

      {stage === "onboarding" && (
        <section className="flex min-h-svh flex-1 flex-col px-6 pb-8 pt-16">
          <div className="flex flex-1 flex-col items-center">
            <div
              className={cn(
                "grid size-24 place-items-center rounded-full",
                current.heroTone,
              )}
            >
              <div className="grid size-14 place-items-center rounded-full bg-background">
                <current.heroIcon className="size-6" />
              </div>
            </div>

            <h2 className="mt-8 text-center text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">
              {current.title}
            </h2>
            <p className="mt-6 max-w-[354px] text-center text-sm leading-5 text-muted-foreground">
              {current.body}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3">
              {current.points.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.text}
                    className="flex h-12 items-center gap-3 rounded-[8px] border border-border bg-background px-4"
                  >
                    <Icon className={cn("size-4", point.iconTone)} />
                    <span className="text-sm leading-[14px] text-foreground">
                      {point.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-center gap-2">
              {onboardingScreens.map((_, dotIndex) => (
                <span
                  key={dotIndex}
                  className={cn(
                    "h-2 w-2 rounded-full bg-muted",
                    dotIndex === index && "w-6 bg-primary",
                  )}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-10 w-20 rounded-md border-border bg-background text-sm leading-6"
                onClick={completeOnboarding}
              >
                Skip
              </Button>
              <Button
                size="lg"
                className="h-10 flex-1 rounded-md text-sm leading-6"
                onClick={goNext}
              >
                {current.cta}
              </Button>
            </div>
          </div>
        </section>
      )}

      {stage === "auth" && (
        <section className="flex min-h-svh flex-1 flex-col px-6 pb-8 pt-20">
          <div className="mb-6 flex justify-end">{themeToggle}</div>
          {authView === "signin" ? (
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">
                  Sign in to your KuriApp account
                </h2>
                <p className="text-sm leading-5 text-muted-foreground">
                  Use your email and password to continue.
                </p>
              </div>

              <form className="space-y-3" onSubmit={handleSignIn}>
                <label className="block text-sm leading-5 font-medium text-foreground">
                  Email Address
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    placeholder="Enter your email address"
                  />
                </label>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Password
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    placeholder="Enter your password"
                  />
                </label>

                <button
                  type="button"
                  className="pt-1 text-sm leading-6 font-medium text-primary"
                >
                  Forgot your password?
                </button>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4 text-chart-3" />
                    <div>
                      <p className="text-sm leading-[14px] text-foreground">
                        Private tracking only
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        KuriApp helps you record payments, lots and claims. It
                        never collects or transfers money.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-sm leading-6">
                  <span className="text-foreground">
                    Don’t have an account?
                  </span>
                  <button
                    type="button"
                    className="font-medium text-primary"
                    onClick={() => {
                      setAuthError("");
                      setAuthMessage("");
                      setAuthView("signup");
                    }}
                  >
                    Sign up
                  </button>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={authLoading}
                  className="mt-56 h-10 w-full rounded-md text-sm leading-6 font-medium"
                >
                  {authLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">
                  Create your KuriApp account
                </h2>
                <p className="text-sm leading-5 text-muted-foreground">
                  Add your full name to personalize your Account and records.
                </p>
              </div>

              <form className="space-y-3" onSubmit={handleSignUp}>
                <label className="block text-sm leading-5 font-medium text-foreground">
                  Full Name
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </label>

                <p className="text-sm leading-5 text-muted-foreground">
                  You can change this later from Account settings.
                </p>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Email Address
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    placeholder="Enter your email address"
                  />
                </label>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Password
                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    placeholder="Enter a password"
                  />
                </label>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Confirm Password
                  <input
                    type="password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                    placeholder="Enter your password again"
                  />
                </label>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4 text-chart-3" />
                    <div>
                      <p className="text-sm leading-[14px] text-foreground">
                        Private tracking only
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        KuriApp helps you record payments, lots and claims. It
                        never collects or transfers money.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-sm leading-6">
                  <span className="text-foreground">
                    Already have an account?
                  </span>
                  <button
                    type="button"
                    className="font-medium text-primary"
                    onClick={() => {
                      setAuthError("");
                      setAuthMessage("");
                      setAuthView("signin");
                    }}
                  >
                    Sign In
                  </button>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={authLoading}
                  className="mt-8 h-10 w-full rounded-md text-sm leading-6 font-medium"
                >
                  {authLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            </div>
          )}

          {(authError || authMessage) && (
            <div
              className={cn(
                "mt-4 rounded-md border px-3 py-2 text-sm",
                authError
                  ? "border-destructive/40 text-destructive"
                  : "border-chart-3/40 text-chart-3",
              )}
            >
              {authError || authMessage}
            </div>
          )}
        </section>
      )}

      {stage === "home" && (
        <section className="relative flex h-svh min-h-svh flex-1 flex-col overflow-y-auto">
          <div
            className={cn(
              "flex-1 px-6 pt-8",
              showBottomMenu ? "pb-28" : "pb-6",
            )}
          >
            {activeTab === "home" && (
              <>
                <div className="sticky top-0 z-20 mb-6 bg-background pb-4">
                  <div>
                    <p className="text-2xl leading-8 tracking-[-0.6px] text-foreground">
                      Hi, welcome back
                    </p>
                    <h2 className="text-[30px] leading-9 font-semibold tracking-[-0.025em] text-foreground">
                      {session?.user.user_metadata?.full_name || "Kuri User"}
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <article className="rounded-xl border border-[#CBD5E1] bg-card p-3">
                    <div className="mb-4 inline-flex h-7 items-center gap-1.5 rounded-full bg-[#DCFCE7] px-2.5 text-[12px] leading-[130%] font-medium text-[#22C55E]">
                      <RefreshCw className="size-3.5" />
                      <span>Active</span>
                    </div>
                    <p className="text-[22px] leading-[130%] font-bold text-foreground">
                      {activeKuriesCount}
                    </p>
                    <p className="mt-1 text-[11px] leading-[130%] text-[#64748B]">
                      Kuries
                    </p>
                  </article>
                  <article className="rounded-xl border border-[#CBD5E1] bg-card p-3">
                    <div className="mb-4 inline-flex h-7 items-center gap-1.5 rounded-full bg-[#FFF2E2] px-2.5 text-[12px] leading-[130%] font-medium text-[#F97316]">
                      <Wallet className="size-3.5" />
                      <span>To Pay</span>
                    </div>
                    <p className="text-[22px] leading-[130%] font-bold text-foreground">
                      {formatCompactInr(toPayThisMonth)}
                    </p>
                    <p className="mt-1 text-[11px] leading-[130%] text-[#64748B]">
                      Every month
                    </p>
                  </article>
                  <article className="rounded-xl border border-[#CBD5E1] bg-card p-3">
                    <div className="mb-4 inline-flex h-7 items-center gap-1.5 rounded-full bg-[#DBEAFE] px-2.5 text-[12px] leading-[130%] font-medium text-[#60A5FA]">
                      <WalletCards className="size-3.5" />
                      <span>Unclaimed</span>
                    </div>
                    <p className="text-[22px] leading-[130%] font-bold text-foreground">
                      {formatCompactInr(unclaimedRemaining)}
                    </p>
                    <p className="mt-1 text-[11px] leading-[130%] text-[#64748B]">
                      Remaining
                    </p>
                  </article>
                </div>
              </>
            )}

            {activeTab === "kuries" && kuriView === "list" && (
              <>
                <div className="sticky top-0 z-20 mb-5 bg-background pb-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                      Kuries
                    </h2>
                    <Button
                      size="icon-lg"
                      className="size-10 rounded-full"
                      onClick={() => setShowAddKuri(true)}
                    >
                      <Plus className="size-5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "All",
                        "Claimed",
                        "Unclaimed",
                        "Active",
                      ] as KuriFilter[]
                    ).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setKuriFilter(filter)}
                        className={cn(
                          "h-9 rounded-md border px-3 text-sm",
                          kuriFilter === filter
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground",
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {kuriDbError && (
                    <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      {kuriDbError}
                    </div>
                  )}
                  {kuriLoading && (
                    <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                      Loading kuries...
                    </div>
                  )}
                  {!kuriLoading && filteredKuries.length === 0 && (
                    <div className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">
                      No kuries yet. Tap + to create your first kuri.
                    </div>
                  )}
                  {filteredKuries.map((kuri) => (
                    <article
                      key={kuri.id}
                      className="rounded-xl border border-border bg-card p-4"
                      onClick={() => openKuriDetail(kuri.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openKuriDetail(kuri.id);
                      }}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="text-base leading-6 font-semibold text-foreground">
                            {kuri.name}
                          </h3>
                          <p
                            className={cn(
                              "text-sm leading-5 font-medium",
                              kuri.cardStatus === "Active"
                                ? "text-[#22C55E]"
                                : kuri.cardStatus === "Completed"
                                  ? "text-[#F87171]"
                                  : "text-muted-foreground",
                            )}
                          >
                            {kuri.cardStatus}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "inline-flex h-7 items-center justify-start gap-1.5 rounded-full px-2.5 text-xs leading-4 font-medium",
                            claimPillWidthClass(kuri.cardClaimStatus),
                            claimPillToneClass(kuri.cardClaimStatus),
                          )}
                        >
                          <BadgeIndianRupee
                            className={cn(
                              "size-4",
                              claimPillIconClass(kuri.cardClaimStatus),
                            )}
                          />
                          <span>{kuri.cardClaimStatus}</span>
                        </div>
                      </div>

                      {kuri.hasActiveRound && (
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-1 flex-1 rounded-full bg-muted">
                            <div
                              className="h-1 rounded-full bg-primary"
                              style={{
                                width: `${(kuri.cardProgress / Math.max(kuri.cardDuration, 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-sm leading-6 font-medium text-foreground">
                            {String(kuri.cardProgress).padStart(2, "0")}/
                            {kuri.cardDuration}
                          </p>
                        </div>
                      )}

                      {kuri.hasActiveRound && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Kuri Amount:
                            </p>
                            <p className="text-sm leading-5 font-medium text-foreground">
                              {formatInr(kuri.cardKuriAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Monthly Amount:
                            </p>
                            <p className="text-sm leading-5 font-medium text-foreground">
                              {formatInr(kuri.cardMonthlyAmount)}
                            </p>
                          </div>
                        </div>
                      )}

                      {!kuri.hasActiveRound && kuri.latestCompletedRound && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            Last completed round:
                          </p>
                          <p className="font-medium text-foreground">
                            {kuri.latestCompletedRound.roundName} •{" "}
                            {formatMonthLabel(
                              kuri.latestCompletedRound.endMonth,
                            )}
                          </p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}

            {activeTab === "kuries" &&
              kuriView === "detail" &&
              selectedKuri && (
                <>
                  <div className="sticky top-0 z-20 mb-5 bg-background pb-4">
                    <button
                      type="button"
                      className="mb-4 grid size-10 place-items-center rounded-full border border-border bg-background"
                      onClick={() => setKuriView("list")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                      {selectedKuri.name}
                    </h2>
                  </div>
                  <div className="mb-5 rounded-xl border border-border bg-card p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Organizer:
                        </p>
                        <p className="text-sm leading-5 font-medium text-foreground">
                          {selectedKuri.organizer}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">C/o:</p>
                        <p className="text-sm leading-5 font-medium text-foreground">
                          {selectedKuri.referenceName || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {kuriDbError && (
                    <div className="mb-4 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      {kuriDbError}
                    </div>
                  )}
                  {roundDbError && (
                    <div className="mb-4 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      {roundDbError}
                    </div>
                  )}
                  {roundLoading && (
                    <div className="mb-4 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                      Loading round...
                    </div>
                  )}

                  {activeRound && (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Round Name
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {activeRound.roundName}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center justify-between">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            activeRound.status === "Completed"
                              ? "text-[#F87171]"
                              : "text-[#22C55E]",
                          )}
                        >
                          {activeRound.status}
                        </p>
                        <div
                          className={cn(
                            "inline-flex h-7 items-center justify-start gap-1.5 rounded-full px-2.5 text-xs leading-4 font-medium",
                            claimPillWidthClass(activeRound.claimStatus),
                            claimPillToneClass(activeRound.claimStatus),
                          )}
                        >
                          <BadgeIndianRupee
                            className={cn(
                              "size-4",
                              claimPillIconClass(activeRound.claimStatus),
                            )}
                          />
                          <span>{activeRound.claimStatus}</span>
                        </div>
                      </div>

                      <div className="mb-4 grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Monthly Amount:
                          </p>
                          <p className="font-medium text-foreground">
                            {formatMoney(
                              activeRound.currency,
                              activeRound.monthlyAmount,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">No. of Claims</p>
                          <p className="font-medium text-foreground">
                            {activeRound.numberOfClaims}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Claimed</p>
                          <p className="font-medium text-foreground">
                            {formatMoney(
                              activeRound.currency,
                              activeRound.claimedAmount,
                            )}
                            /
                            {formatMoney(
                              activeRound.currency,
                              activeRound.totalValue,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Claim Amount per Claim
                          </p>
                          <p className="font-medium text-foreground">
                            {formatMoney(
                              activeRound.currency,
                              activeRound.claimAmountPerClaim,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Pending Amount to Claim
                          </p>
                          <p className="font-medium text-foreground">
                            {formatMoney(
                              activeRound.currency,
                              activeRound.pendingClaimAmount,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-muted">
                          <div
                            className="h-1 rounded-full bg-primary"
                            style={{
                              width: `${(activeRound.progress / Math.max(activeRound.duration, 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {String(activeRound.progress).padStart(2, "0")}/
                          {activeRound.duration}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground">Start Month:</p>
                          <p className="font-medium text-foreground">
                            {formatMonthLabel(activeRound.startMonth)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground">End Month:</p>
                          <p className="font-medium text-foreground">
                            {formatMonthLabel(activeRound.endMonth)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground">
                            Remaining Amount to Pay:
                          </p>
                          <p className="font-medium text-foreground">
                            {formatMoney(
                              activeRound.currency,
                              remainingAmountToPay,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Button
                          type="button"
                          className="h-10 w-full rounded-md text-sm"
                          onClick={() => {
                            if (!activeRound) return;
                            setPaymentDbError("");
                            setPaidOnDate(
                              new Date().toISOString().split("T")[0],
                            );
                            setPaymentRef("");
                            setPaymentNote("");
                            setPaymentAttachment(null);
                            setShowMarkPaymentDrawer(true);
                          }}
                        >
                          Mark a Payment
                        </Button>
                        <Button
                          type="button"
                          className="h-10 w-full rounded-md text-sm"
                          onClick={() => {
                            if (!activeRound) return;
                            setClaimDbError("");
                            setClaimDate(
                              new Date().toISOString().split("T")[0],
                            );
                            setClaimReference("");
                            setClaimNote("");
                            setClaimAttachment(null);
                            setShowMarkClaimDrawer(true);
                          }}
                        >
                          Mark a Claim
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-full rounded-md text-sm"
                          onClick={() => setKuriView("payment-history")}
                        >
                          Payment History
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-full rounded-md text-sm"
                          onClick={() => setKuriView("claim-history")}
                        >
                          Claim Details
                        </Button>
                      </div>
                    </div>
                  )}

                  {!activeRound && (
                    <div className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">
                      No active rounds.
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 mt-5 w-full rounded-md text-sm"
                    onClick={() => setKuriView("completed-rounds")}
                  >
                    Completed Rounds
                  </Button>

                  {!hasActiveRound && (
                    <Button
                      size="lg"
                      className="mt-5 h-10 w-full rounded-md text-base"
                      onClick={() => setShowNewRoundDrawer(true)}
                    >
                      New Round
                    </Button>
                  )}

                  <div className="mt-5">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => setShowDeleteKuriDialog(true)}
                    >
                      <Trash2 className="size-4" />
                      Delete Kuri
                    </Button>
                    <AlertDialog
                      open={showDeleteKuriDialog}
                      onOpenChange={setShowDeleteKuriDialog}
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this Kuri?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                            {selectedKuriHasActiveRound
                              ? " You cannot delete this Kuri while an active round exists."
                              : " This will permanently remove this Kuri."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 flex-1"
                            >
                              Cancel
                            </Button>
                          </AlertDialogCancel>
                          <AlertDialogAction>
                            <Button
                              type="button"
                              className="h-10 flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={
                                selectedKuriHasActiveRound || deleteKuriLoading
                              }
                              onClick={deleteSelectedKuri}
                            >
                              {deleteKuriLoading ? "Deleting..." : "Delete"}
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}

            {activeTab === "kuries" &&
              kuriView === "payment-history" &&
              selectedKuri &&
              historyRound && (
                <>
                  <div className="sticky top-0 z-20 mb-5 bg-background pb-4">
                    <button
                      type="button"
                      className="mb-4 grid size-10 place-items-center rounded-full border border-border bg-background"
                      onClick={() => setKuriView("detail")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {selectedKuri.name} / {historyRound.roundName}
                      </p>
                      <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                        Payment History
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {paymentsError && (
                      <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                        {paymentsError}
                      </div>
                    )}
                    {paymentsLoading && (
                      <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                        Loading payment history...
                      </div>
                    )}
                    {!paymentsLoading && payments.length === 0 && (
                      <div className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        No payments recorded yet.
                      </div>
                    )}

                    {payments.map((payment) => {
                      const installment =
                        monthToNumber(payment.paymentMonth) -
                        monthToNumber(historyRound.startMonth) +
                        1;
                      return (
                        <article
                          key={payment.id}
                          className="rounded-xl border border-border bg-card p-4"
                        >
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Amount:</p>
                              <p className="font-medium text-foreground">
                                {formatMoney(
                                  historyRound.currency,
                                  payment.amountPaid,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Installment:
                              </p>
                              <p className="font-medium text-foreground">
                                {Math.max(installment, 1)}/
                                {historyRound.duration}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Reference:
                              </p>
                              <p className="font-medium text-foreground">
                                {payment.reference || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Note:</p>
                              <p className="font-medium text-foreground">
                                {payment.note || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Payment Date:
                              </p>
                              <p className="font-medium text-foreground">
                                {formatDateLabel(payment.paidOn)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Button
                              type="button"
                              variant={
                                payment.attachmentUrl ? "default" : "outline"
                              }
                              className="h-10 w-full rounded-md text-sm"
                              disabled={!payment.attachmentUrl}
                              onClick={() => {
                                if (!payment.attachmentUrl) return;
                                window.open(
                                  payment.attachmentUrl,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                            >
                              {payment.attachmentUrl
                                ? "View Attachment"
                                : "No Attachment"}
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}

            {activeTab === "kuries" &&
              kuriView === "claim-history" &&
              selectedKuri &&
              historyRound && (
                <>
                  <div className="sticky top-0 z-20 mb-5 bg-background pb-4">
                    <button
                      type="button"
                      className="mb-4 grid size-10 place-items-center rounded-full border border-border bg-background"
                      onClick={() => setKuriView("detail")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {selectedKuri.name} / {historyRound.roundName}
                      </p>
                      <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                        Claim Details
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {claimsError && (
                      <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                        {claimsError}
                      </div>
                    )}
                    {claimsLoading && (
                      <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                        Loading claim history...
                      </div>
                    )}
                    {!claimsLoading && claims.length === 0 && (
                      <div className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        No claims recorded yet.
                      </div>
                    )}

                    {claims.map((claim) => (
                      <article
                        key={claim.id}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Amount:</p>
                            <p className="font-medium text-foreground">
                              {formatMoney(
                                historyRound.currency,
                                claim.amountClaimed,
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Claim Sequence:
                            </p>
                            <p className="font-medium text-foreground">
                              {claim.claimSequence}/
                              {historyRound.numberOfClaims}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reference:</p>
                            <p className="font-medium text-foreground">
                              {claim.reference || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Note:</p>
                            <p className="font-medium text-foreground">
                              {claim.note || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Claim Date:</p>
                            <p className="font-medium text-foreground">
                              {formatDateLabel(claim.claimedOn)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button
                            type="button"
                            variant={
                              claim.attachmentUrl ? "default" : "outline"
                            }
                            className="h-10 w-full rounded-md text-sm"
                            disabled={!claim.attachmentUrl}
                            onClick={() => {
                              if (!claim.attachmentUrl) return;
                              window.open(
                                claim.attachmentUrl,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            }}
                          >
                            {claim.attachmentUrl
                              ? "View Attachment"
                              : "No Attachment"}
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

            {activeTab === "kuries" &&
              kuriView === "completed-rounds" &&
              selectedKuri && (
                <>
                  <div className="sticky top-0 z-20 mb-5 bg-background pb-4">
                    <button
                      type="button"
                      className="mb-4 grid size-10 place-items-center rounded-full border border-border bg-background"
                      onClick={() => setKuriView("detail")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                      Completed Rounds
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedKuri.name}
                    </p>
                  </div>

                  <div className="space-y-5">
                    {completedRounds.length === 0 && (
                      <div className="rounded-md border border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        No completed rounds yet.
                      </div>
                    )}

                    {completedRounds.map((round) => (
                      <article
                        key={round.id}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            Round Name
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {round.roundName}
                          </p>
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-sm font-medium text-[#F87171]">
                            Completed
                          </p>
                          <div
                            className={cn(
                              "inline-flex h-7 items-center justify-start gap-1.5 rounded-full px-2.5 text-xs leading-4 font-medium",
                              claimPillWidthClass(round.claimStatus),
                              claimPillToneClass(round.claimStatus),
                            )}
                          >
                            <BadgeIndianRupee
                              className={cn(
                                "size-4",
                                claimPillIconClass(round.claimStatus),
                              )}
                            />
                            <span>{round.claimStatus}</span>
                          </div>
                        </div>

                        <div className="mb-4 grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Monthly Amount:
                            </p>
                            <p className="font-medium text-foreground">
                              {formatMoney(round.currency, round.monthlyAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              No. of Claims
                            </p>
                            <p className="font-medium text-foreground">
                              {round.numberOfClaims}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Claimed</p>
                            <p className="font-medium text-foreground">
                              {formatMoney(round.currency, round.claimedAmount)}
                              /{formatMoney(round.currency, round.totalValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Pending Amount to Claim
                            </p>
                            <p className="font-medium text-foreground">
                              {formatMoney(
                                round.currency,
                                round.pendingClaimAmount,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-1 flex-1 rounded-full bg-muted">
                            <div
                              className="h-1 rounded-full bg-primary"
                              style={{
                                width: `${(round.progress / Math.max(round.duration, 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {String(round.progress).padStart(2, "0")}/
                            {round.duration}
                          </p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">
                              Start Month:
                            </p>
                            <p className="font-medium text-foreground">
                              {formatMonthLabel(round.startMonth)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">End Month:</p>
                            <p className="font-medium text-foreground">
                              {formatMonthLabel(round.endMonth)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">
                              Remaining Amount to Pay:
                            </p>
                            <p className="font-medium text-foreground">
                              {formatMoney(
                                round.currency,
                                Math.max(
                                  round.monthlyAmount *
                                    Math.max(
                                      round.duration - round.progress,
                                      0,
                                    ),
                                  0,
                                ),
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full rounded-md text-sm"
                            onClick={() => {
                              setHistoryRoundId(round.id);
                              setKuriView("payment-history");
                            }}
                          >
                            Payment History
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full rounded-md text-sm"
                            onClick={() => {
                              setHistoryRoundId(round.id);
                              setKuriView("claim-history");
                            }}
                          >
                            Claim Details
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

            {activeTab === "account" && (
              <div className="space-y-4">
                <div className="sticky top-0 z-20 bg-background pb-4">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Account
                  </h2>
                </div>
                {accountView === "menu" && (
                  <>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountView("profile");
                          setShowChangePasswordForm(false);
                          setChangePasswordError("");
                          setChangePasswordMessage("");
                        }}
                        className="flex h-12 w-full items-center justify-between border-b border-border px-4 text-sm font-medium text-foreground"
                      >
                        <span>Profile</span>
                        <span className="text-muted-foreground">{">"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountView("appearance")}
                        className="flex h-12 w-full items-center justify-between px-4 text-sm font-medium text-foreground"
                      >
                        <span>Appearance</span>
                        <span className="text-muted-foreground">{">"}</span>
                      </button>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="h-10 w-full"
                        onClick={handleSignOut}
                      >
                        Logout
                      </Button>
                    </div>
                  </>
                )}
                {accountView === "profile" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountView("menu");
                        setShowChangePasswordForm(false);
                        setChangePasswordError("");
                        setChangePasswordMessage("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
                    >
                      <ChevronLeft className="size-4" />
                      Back
                    </button>
                    <div className="space-y-5 rounded-xl border border-border bg-card p-4">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Name
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {session?.user.user_metadata?.full_name ||
                            "Kuri User"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Email address
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {session?.user.email}
                        </p>
                      </div>
                    </div>
                    {!showChangePasswordForm ? (
                      <Button
                        variant="outline"
                        className="h-10 w-full"
                        onClick={() => {
                          setShowChangePasswordForm(true);
                          setChangePasswordError("");
                          setChangePasswordMessage("");
                        }}
                      >
                        Change Password
                      </Button>
                    ) : (
                      <form
                        className="space-y-3 rounded-xl border border-border bg-card p-4"
                        onSubmit={handleChangePassword}
                      >
                        {changePasswordError && (
                          <p className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                            {changePasswordError}
                          </p>
                        )}
                        {changePasswordMessage && (
                          <p className="rounded-md border border-emerald-500/40 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                            {changePasswordMessage}
                          </p>
                        )}
                        <label className="block text-sm font-medium text-foreground">
                          New Password
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                            placeholder="Enter new password"
                            autoComplete="new-password"
                          />
                        </label>
                        <label className="block text-sm font-medium text-foreground">
                          Confirm New Password
                          <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) =>
                              setConfirmNewPassword(e.target.value)
                            }
                            className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 flex-1"
                            onClick={() => {
                              setShowChangePasswordForm(false);
                              setChangePasswordError("");
                              setChangePasswordMessage("");
                              setNewPassword("");
                              setConfirmNewPassword("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="h-10 flex-1"
                            disabled={changePasswordLoading}
                          >
                            {changePasswordLoading
                              ? "Updating..."
                              : "Update Password"}
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                )}
                {accountView === "appearance" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setAccountView("menu")}
                      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
                    >
                      <ChevronLeft className="size-4" />
                      Back
                    </button>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="mb-3 text-sm font-medium text-foreground">
                        Theme
                      </p>
                      {themeToggle}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {showBottomMenu && (
            <div className="fixed right-0 bottom-0 left-0 z-30 mx-auto w-full max-w-[500px] bg-background/95 px-5 py-5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <nav className="rounded-2xl border border-border bg-card p-1.5">
                <ul className="grid grid-cols-3">
                  {(
                    [
                      ["home", House, "Home"],
                      ["kuries", Layers3, "Kuries"],
                      ["account", UserCircle2, "Account"],
                    ] as const
                  ).map(([tabId, Icon, label]) => (
                    <li key={tabId}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(tabId);
                          if (tabId !== "kuries") setKuriView("list");
                          if (tabId !== "account") setAccountView("menu");
                        }}
                        className={cn(
                          "flex w-full flex-col items-center gap-1 rounded-xl py-2",
                          activeTab === tabId
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        <Icon className="size-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}

          <Drawer open={showAddKuri} onOpenChange={setShowAddKuri}>
            <DrawerContent className="flex max-h-[92svh] flex-col border-border bg-card">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  Add Kuri
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Create a new Kuri to track
                </DrawerDescription>
              </DrawerHeader>
              <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitKuri}>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                  {kuriDbError && (
                    <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      {kuriDbError}
                    </div>
                  )}
                  <label className="block text-sm font-medium text-foreground">
                    Kuri Name
                    <input
                      value={kuriName}
                      onChange={(e) => setKuriName(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="Enter Kuri Name"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Organizer
                    <input
                      value={kuriOrganizer}
                      onChange={(e) => setKuriOrganizer(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="Enter organizer name"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    C/o (Optional)
                    <input
                      value={kuriReference}
                      onChange={(e) => setKuriReference(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="Enter reference name"
                    />
                  </label>
                </div>
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1"
                    onClick={() => setShowAddKuri(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-10 flex-1">
                    Submit
                  </Button>
                </div>
              </form>
            </DrawerContent>
          </Drawer>

          <Drawer
            open={showNewRoundDrawer}
            onOpenChange={setShowNewRoundDrawer}
          >
            <DrawerContent className="flex max-h-[92svh] flex-col border-border bg-card">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  New Round
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Add round details for this kuri
                </DrawerDescription>
              </DrawerHeader>
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={submitRound}
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
                  {roundDbError && (
                    <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      {roundDbError}
                    </div>
                  )}
                  <label className="block text-sm font-medium text-foreground">
                    Round Name
                    <input
                      type="text"
                      value={roundName}
                      onChange={(e) => setRoundName(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="Round name"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Start Month
                    <input
                      type="month"
                      value={roundStartMonth}
                      onChange={(e) => setRoundStartMonth(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Duration (No. of month)
                    <input
                      type="number"
                      value={roundDuration}
                      onChange={(e) => setRoundDuration(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="12"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Currency
                    <select
                      value={roundCurrency}
                      onChange={(e) =>
                        setRoundCurrency(
                          e.target.value as "INR" | "SGD" | "DHR",
                        )
                      }
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="INR">INR</option>
                      <option value="SGD">SGD</option>
                      <option value="DHR">DHR</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Monthly Amount
                    <input
                      type="number"
                      value={roundMonthlyAmount}
                      onChange={(e) => setRoundMonthlyAmount(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="10000"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    No. of Claims
                    <input
                      type="number"
                      value={roundClaims}
                      onChange={(e) => setRoundClaims(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="2"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Payment Date
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={roundPaymentDate}
                      onChange={(e) => setRoundPaymentDate(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="5"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Claimed Amount (Optional)
                    <input
                      type="number"
                      value={roundClaimedAmount}
                      onChange={(e) => setRoundClaimedAmount(e.target.value)}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="0"
                    />
                  </label>
                </div>
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1"
                    onClick={() => setShowNewRoundDrawer(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-10 flex-1">
                    Submit
                  </Button>
                </div>
              </form>
            </DrawerContent>
          </Drawer>

          <Drawer
            open={showMarkPaymentDrawer}
            onOpenChange={setShowMarkPaymentDrawer}
          >
            <DrawerContent className="flex max-h-[92svh] flex-col border-border bg-card">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  Mark a Payment
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Record payment for this round
                </DrawerDescription>
              </DrawerHeader>
              <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitPayment}>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                  {paymentDbError && (
                    <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      {paymentDbError}
                    </div>
                  )}
                <label className="block text-sm font-medium text-foreground">
                  Installment
                  <input
                    type="text"
                    readOnly
                    value={`${String(nextInstallment).padStart(2, "0")} / ${activeRound?.duration ?? 0}`}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Amount Paid
                  <input
                    type="text"
                    readOnly
                    value={
                      activeRound
                        ? formatMoney(
                            activeRound.currency,
                            activeRound.monthlyAmount,
                          )
                        : ""
                    }
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Paid On
                  <input
                    type="date"
                    value={paidOnDate}
                    onChange={(e) => setPaidOnDate(e.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Reference (Optional)
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="UPI / bank / cash ref"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Attachment (Optional)
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setPaymentAttachment(e.target.files?.[0] ?? null)
                    }
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Notes (Optional)
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="Additional notes"
                  />
                </label>
                </div>
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1"
                    onClick={() => setShowMarkPaymentDrawer(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 flex-1"
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              </form>
            </DrawerContent>
          </Drawer>

          <Drawer
            open={showMarkClaimDrawer}
            onOpenChange={setShowMarkClaimDrawer}
          >
            <DrawerContent className="flex max-h-[92svh] flex-col border-border bg-card">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  Mark a Claim
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Record claim received for this round
                </DrawerDescription>
              </DrawerHeader>
              <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitClaim}>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                  {claimDbError && (
                    <div className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      {claimDbError}
                    </div>
                  )}
                <label className="block text-sm font-medium text-foreground">
                  Amount
                  <input
                    type="text"
                    readOnly
                    value={
                      activeRound
                        ? formatMoney(
                            activeRound.currency,
                            activeRound.claimAmountPerClaim,
                          )
                        : ""
                    }
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Claim Sequence
                  <input
                    type="text"
                    readOnly
                    value={`${String(nextClaimSequence).padStart(2, "0")} / ${activeRound?.numberOfClaims ?? 0}`}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Claim Date
                  <input
                    type="date"
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Reference (Optional)
                  <input
                    type="text"
                    value={claimReference}
                    onChange={(e) => setClaimReference(e.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="Transaction reference"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Attachment (Optional)
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setClaimAttachment(e.target.files?.[0] ?? null)
                    }
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
                  />
                </label>
                <label className="block text-sm font-medium text-foreground">
                  Note (Optional)
                  <input
                    type="text"
                    value={claimNote}
                    onChange={(e) => setClaimNote(e.target.value)}
                    className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    placeholder="Additional notes"
                  />
                </label>
                </div>
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 flex-1"
                    onClick={() => setShowMarkClaimDrawer(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 flex-1"
                    disabled={claimLoading}
                  >
                    {claimLoading ? "Saving..." : "Save Claim"}
                  </Button>
                </div>
              </form>
            </DrawerContent>
          </Drawer>
        </section>
      )}
    </main>
  );
}

export default App;
