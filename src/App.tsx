import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BadgeIndianRupee,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  House,
  LayoutDashboard,
  Layers3,
  MoreVertical,
  Pencil,
  PackageOpen,
  Plus,
  PieChart,
  RefreshCw,
  Trash2,
  UserCircle2,
  ShieldCheck,
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
type AccountView = "menu" | "profile" | "appearance" | "about";
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
  const scrollContainerRef = useRef<HTMLElement | null>(null);
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
  const [showChangeNameForm, setShowChangeNameForm] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [changeNameLoading, setChangeNameLoading] = useState(false);
  const [changeNameError, setChangeNameError] = useState("");
  const [changeNameMessage, setChangeNameMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordMessage, setChangePasswordMessage] = useState("");
  const [kuriView, setKuriView] = useState<KuriView>("list");
  const [kuriFilter, setKuriFilter] = useState<KuriFilter>("All");
  const [showAddKuri, setShowAddKuri] = useState(false);
  const [isEditingKuri, setIsEditingKuri] = useState(false);
  const [showKuriActions, setShowKuriActions] = useState(false);
  const [kuries, setKuries] = useState<KuriItem[]>([]);
  const [selectedKuriId, setSelectedKuriId] = useState<string>("");
  const [kuriLoading, setKuriLoading] = useState(false);
  const [kuriDbError, setKuriDbError] = useState("");
  const [roundDbError, setRoundDbError] = useState("");
  const [roundLoading, setRoundLoading] = useState(false);
  const [rounds, setRounds] = useState<KuriRound[]>([]);
  const [allRounds, setAllRounds] = useState<KuriRound[]>([]);
  const [showNewRoundDrawer, setShowNewRoundDrawer] = useState(false);
  const [isEditingRound, setIsEditingRound] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState("");
  const [showRoundActions, setShowRoundActions] = useState(false);
  const [showDeleteRoundDialog, setShowDeleteRoundDialog] = useState(false);
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
  const [payments, setPayments] = useState<KuriPaymentItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [claims, setClaims] = useState<KuriClaimItem[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState("");
  const [cashflowWindow, setCashflowWindow] = useState<6 | 12>(6);
  const [homePayments, setHomePayments] = useState<KuriPaymentItem[]>([]);
  const [homeClaims, setHomeClaims] = useState<KuriClaimItem[]>([]);
  const [historyRoundId, setHistoryRoundId] = useState("");
  const [showMarkPaymentDrawer, setShowMarkPaymentDrawer] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState("");
  const [deletingPaymentId, setDeletingPaymentId] = useState("");
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false);
  const [paymentDbError, setPaymentDbError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidOnDate, setPaidOnDate] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentAttachment, setPaymentAttachment] = useState<File | null>(null);
  const [showMarkClaimDrawer, setShowMarkClaimDrawer] = useState(false);
  const [editingClaimId, setEditingClaimId] = useState("");
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
  const [pageTransitionClass, setPageTransitionClass] = useState("");
  const [isWideDrawer, setIsWideDrawer] = useState(false);
  const prevKuriViewRef = useRef<KuriView>("list");
  const prevAccountViewRef = useRef<AccountView>("menu");

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const initialTheme: ThemeMode = storedTheme ?? "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 701px)");
    const update = () => setIsWideDrawer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
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
        setActiveTab("home");
        setKuriView("list");
        setAccountView("menu");
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
      if (nextSession) {
        setActiveTab("home");
        setKuriView("list");
        setAccountView("menu");
        setStage("home");
      }
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
        .eq("user_id", session.user.id)
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
  }, [
    session?.user?.id,
    selectedKuriId,
    rounds,
    historyRoundId,
    dataRefreshVersion,
  ]);

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
  }, [
    session?.user?.id,
    selectedKuriId,
    rounds,
    historyRoundId,
    dataRefreshVersion,
  ]);

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

  useEffect(() => {
    const loadHomeChartData = async () => {
      if (!session?.user?.id) {
        setHomePayments([]);
        setHomeClaims([]);
        return;
      }

      const [{ data: paymentData }, { data: claimData }] = await Promise.all([
        supabase
          .from("kuri_payments")
          .select(
            "id,round_id,payment_month,amount_paid,paid_on,reference,note,attachment_url,created_at",
          )
          .eq("user_id", session.user.id),
        supabase
          .from("kuri_claims")
          .select(
            "id,round_id,claim_sequence,amount_claimed,claimed_on,reference,note,attachment_url,created_at",
          )
          .eq("user_id", session.user.id),
      ]);

      setHomePayments(
        ((paymentData ?? []) as KuriPaymentRow[]).map((row) => ({
          id: row.id,
          roundId: row.round_id,
          paymentMonth: row.payment_month,
          amountPaid: Number(row.amount_paid ?? 0),
          paidOn: row.paid_on,
          reference: row.reference ?? undefined,
          note: row.note ?? undefined,
          attachmentUrl: row.attachment_url ?? undefined,
        })),
      );

      setHomeClaims(
        ((claimData ?? []) as KuriClaimRow[]).map((row) => ({
          id: row.id,
          roundId: row.round_id,
          claimSequence: row.claim_sequence,
          amountClaimed: Number(row.amount_claimed ?? 0),
          claimedOn: row.claimed_on,
          reference: row.reference ?? undefined,
          note: row.note ?? undefined,
          attachmentUrl: row.attachment_url ?? undefined,
        })),
      );
    };

    void loadHomeChartData();
  }, [session?.user?.id, dataRefreshVersion]);

  useEffect(() => {
    if (activeTab !== "kuries") {
      prevKuriViewRef.current = kuriView;
      return;
    }

    const kuriViewOrder: Record<KuriView, number> = {
      list: 0,
      detail: 1,
      "completed-rounds": 2,
      "payment-history": 2,
      "claim-history": 2,
    };
    const prev = prevKuriViewRef.current;
    if (prev === kuriView) return;
    const isForward = kuriViewOrder[kuriView] >= kuriViewOrder[prev];
    setPageTransitionClass(
      isForward ? "page-enter-forward" : "page-enter-backward",
    );
    const timer = window.setTimeout(() => setPageTransitionClass(""), 260);
    prevKuriViewRef.current = kuriView;
    return () => window.clearTimeout(timer);
  }, [activeTab, kuriView]);

  useEffect(() => {
    if (activeTab !== "account") {
      prevAccountViewRef.current = accountView;
      return;
    }

    const accountViewOrder: Record<AccountView, number> = {
      menu: 0,
      profile: 1,
      appearance: 1,
      about: 1,
    };
    const prev = prevAccountViewRef.current;
    if (prev === accountView) return;
    const isForward = accountViewOrder[accountView] >= accountViewOrder[prev];
    setPageTransitionClass(
      isForward ? "page-enter-forward" : "page-enter-backward",
    );
    const timer = window.setTimeout(() => setPageTransitionClass(""), 260);
    prevAccountViewRef.current = accountView;
    return () => window.clearTimeout(timer);
  }, [activeTab, accountView]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = 0;
    window.requestAnimationFrame(() => {
      container.scrollTop = 0;
    });
  }, [stage, authView, activeTab, kuriView, accountView]);

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

    setActiveTab("home");
    setKuriView("list");
    setAccountView("menu");
    setStage("home");
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
        emailRedirectTo:
          import.meta.env.VITE_AUTH_REDIRECT_URL ?? window.location.origin,
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
    setActiveTab("home");
    setKuriView("list");
    setAccountView("menu");
    setStage("auth");
    setAuthView("signin");
    setAuthError("");
    setAuthMessage("");
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

  const handleChangeName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChangeNameError("");
    setChangeNameMessage("");

    const trimmedName = newDisplayName.trim();
    if (!trimmedName) {
      setChangeNameError("Name cannot be empty.");
      return;
    }

    setChangeNameLoading(true);
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });
    setChangeNameLoading(false);

    if (error) {
      setChangeNameError(error.message);
      return;
    }

    if (data.user) {
      setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
    }
    setChangeNameMessage("Name updated successfully.");
    setShowChangeNameForm(false);
    setNewDisplayName("");
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
  const toPayThisMonth = activeRounds.reduce((sum, round) => {
    const isPayable = round.progress < round.duration;
    return sum + (isPayable ? round.monthlyAmount : 0);
  }, 0);
  const totalRemainingToPay = activeRounds.reduce((sum, round) => {
    const remainingInstallments = Math.max(round.duration - round.progress, 0);
    return sum + round.monthlyAmount * remainingInstallments;
  }, 0);
  const unclaimedRemaining = activeRounds.reduce(
    (sum, round) => sum + Math.max(round.totalValue - round.claimedAmount, 0),
    0,
  );
  const claimStatusData = [
    {
      label: "Claimed",
      value: activeRounds.filter((round) => round.claimStatus === "Claimed")
        .length,
      color: "#22C55E",
    },
    {
      label: "Partially Claimed",
      value: activeRounds.filter(
        (round) => round.claimStatus === "Partially Claimed",
      ).length,
      color: "#F59E0B",
    },
    {
      label: "Unclaimed",
      value: activeRounds.filter((round) => round.claimStatus === "Unclaimed")
        .length,
      color: "#60A5FA",
    },
  ];
  const totalClaimStatusCount = claimStatusData.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const donutGradient =
    totalClaimStatusCount === 0
      ? "#E2E8F0"
      : (() => {
          let start = 0;
          return claimStatusData
            .filter((item) => item.value > 0)
            .map((item) => {
              const portion = (item.value / totalClaimStatusCount) * 100;
              const end = start + portion;
              const segment = `${item.color} ${start}% ${end}%`;
              start = end;
              return segment;
            })
            .join(", ");
        })();
  const monthKey = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  const chartMonthLabel = (value: string) => {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "short",
    });
  };
  const cashflowMonths = Array.from({ length: cashflowWindow }, (_, idx) => {
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth() - (cashflowWindow - 1 - idx),
      1,
    );
    return monthKey(d);
  });
  const monthlyCashflowData = cashflowMonths.map((month) => {
    const paid = homePayments
      .filter((item) => (item.paidOn || "").slice(0, 7) === month)
      .reduce((sum, item) => sum + item.amountPaid, 0);
    const claimed = homeClaims
      .filter((item) => (item.claimedOn || "").slice(0, 7) === month)
      .reduce((sum, item) => sum + item.amountClaimed, 0);
    return { month, paid, claimed };
  });
  const monthlyCashflowMax = Math.max(
    ...monthlyCashflowData.map((item) => Math.max(item.paid, item.claimed)),
    1,
  );
  const showBottomMenu =
    activeTab === "home" ||
    activeTab === "account" ||
    (activeTab === "kuries" && kuriView === "list");
  const sheetSide = isWideDrawer ? "right" : "bottom";
  const activeTabIndex =
    activeTab === "home" ? 0 : activeTab === "kuries" ? 1 : 2;

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
    return `₹${compact}`;
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
    _status: "Claimed" | "Partially Claimed" | "Unclaimed",
  ) => {
    return "w-fit";
  };
  const claimPillToneClass = (
    status: "Claimed" | "Partially Claimed" | "Unclaimed",
  ) => {
    if (status === "Claimed") return "bg-emerald-100 text-emerald-700";
    if (status === "Partially Claimed") return "bg-amber-100 text-amber-700";
    return "bg-[#DBEAFE] text-[#60A5FA]";
  };
  const claimPillIconClass = (
    status: "Claimed" | "Partially Claimed" | "Unclaimed",
  ) => {
    if (status === "Claimed") return "text-emerald-600";
    if (status === "Partially Claimed") return "text-amber-600";
    return "text-[#60A5FA]";
  };
  const ClaimPillIcon = ({
    status,
    className,
  }: {
    status: "Claimed" | "Partially Claimed" | "Unclaimed";
    className?: string;
  }) =>
    status === "Unclaimed" ? (
      <WalletCards className={className} />
    ) : (
      <BadgeIndianRupee className={className} />
    );
  const EmptyState = ({ message }: { message: string }) => (
    <div className="rounded-xl border border-border bg-card px-4 py-8 text-center">
      <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-muted/50">
        <PackageOpen className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  const addMonths = (monthValue: string, monthsToAdd: number) => {
    const [year, month] = monthValue.split("-").map(Number);
    const d = new Date(year, (month || 1) - 1, 1);
    d.setMonth(d.getMonth() + monthsToAdd);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const monthToNumber = (monthValue: string) => {
    const [year, month] = monthValue.split("-").map(Number);
    return year * 12 + (month - 1);
  };
  const nextInstallment = activeRound
    ? Math.min(activeRound.progress + 1, activeRound.duration)
    : 1;
  const nextPaymentMonth = activeRound
    ? addMonths(activeRound.startMonth, Math.max(nextInstallment - 1, 0))
    : "";
  const editingPayment =
    payments.find((payment) => payment.id === editingPaymentId) ?? null;
  const paymentFormRound = editingPayment ? historyRound : activeRound;
  const paymentFormInstallment =
    editingPayment && historyRound
      ? Math.max(
          monthToNumber(editingPayment.paymentMonth) -
            monthToNumber(historyRound.startMonth) +
            1,
          1,
        )
      : nextInstallment;
  const paymentFormAmount =
    editingPayment?.amountPaid ?? paymentFormRound?.monthlyAmount ?? 0;
  const editingClaim =
    claims.find((claim) => claim.id === editingClaimId) ?? null;
  const claimFormRound = editingClaim ? historyRound : activeRound;
  const claimFormSequence = editingClaim?.claimSequence ?? nextClaimSequence;
  const claimFormAmount =
    editingClaim?.amountClaimed ?? claimFormRound?.claimAmountPerClaim ?? 0;
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
  const resetKuriForm = () => {
    setKuriName("");
    setKuriOrganizer("");
    setKuriReference("");
    setIsEditingKuri(false);
    setKuriDbError("");
  };
  const startEditKuri = () => {
    if (!selectedKuri) return;
    setKuriName(selectedKuri.name);
    setKuriOrganizer(selectedKuri.organizer);
    setKuriReference(selectedKuri.referenceName ?? "");
    setIsEditingKuri(true);
    setKuriDbError("");
    setShowKuriActions(false);
    setShowAddKuri(true);
  };
  const bumpDataRefresh = () => setDataRefreshVersion((current) => current + 1);
  const resetRoundForm = () => {
    setRoundName("");
    setRoundStartMonth("");
    setRoundCurrency("INR");
    setRoundMonthlyAmount("");
    setRoundDuration("");
    setRoundClaims("");
    setRoundPaymentDate("");
    setIsEditingRound(false);
    setEditingRoundId("");
    setRoundDbError("");
  };
  const startEditRound = (round: KuriRound) => {
    setRoundName(round.roundName);
    setRoundStartMonth(round.startMonth);
    setRoundCurrency(round.currency);
    setRoundMonthlyAmount(String(round.monthlyAmount));
    setRoundDuration(String(round.duration));
    setRoundClaims(String(round.numberOfClaims));
    setRoundPaymentDate(String(round.paymentDate));
    setIsEditingRound(true);
    setEditingRoundId(round.id);
    setRoundDbError("");
    setShowRoundActions(false);
    setShowNewRoundDrawer(true);
  };

  const submitRound = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id || !selectedKuri) return;

    const monthly = Number(roundMonthlyAmount);
    const duration = Number(roundDuration);
    const claims = Number(roundClaims);
    const paymentDate = Number(roundPaymentDate);
    const editingRound = rounds.find((round) => round.id === editingRoundId);
    const claimed = editingRound?.claimedAmount ?? 0;

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
    const progress = editingRound?.progress ?? 0;
    const status = computeRoundStatus(
      roundStartMonth,
      progress,
      duration,
      claimed,
      totalValue,
    );
    const claimStatus = computeClaimStatus(claimed, totalValue);

    setRoundDbError("");
    const roundPayload = {
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
    };
    const { data, error } =
      isEditingRound && editingRoundId
        ? await supabase
            .from("kuri_rounds")
            .update(roundPayload)
            .eq("id", editingRoundId)
            .select(
              "id,kuri_id,round_name,status,claim_status,currency,monthly_amount,number_of_claims,claimed_amount,total_value,claim_amount_per_claim,start_month,end_month,payment_date,payment_schedule,pending_claim_amount,progress,duration,created_at",
            )
            .single()
        : await supabase
            .from("kuri_rounds")
            .insert(roundPayload)
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

    setRounds((prev) =>
      isEditingRound
        ? prev.map((round) => (round.id === created.id ? created : round))
        : [created, ...prev],
    );
    resetRoundForm();
    setShowNewRoundDrawer(false);
    bumpDataRefresh();
  };

  const deleteRound = async () => {
    if (!editingRoundId) return;
    setRoundDbError("");
    const { error } = await supabase
      .from("kuri_rounds")
      .delete()
      .eq("id", editingRoundId);
    if (error) {
      setRoundDbError(error.message);
      return;
    }
    setRounds((prev) => prev.filter((round) => round.id !== editingRoundId));
    setShowDeleteRoundDialog(false);
    setShowRoundActions(false);
    setEditingRoundId("");
    setIsEditingRound(false);
    bumpDataRefresh();
  };

  const submitKuri = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id) return;

    const trimmedName = kuriName.trim();
    const trimmedOrganizer = kuriOrganizer.trim();
    if (!trimmedName || !trimmedOrganizer) return;

    setKuriDbError("");
    const { data, error } =
      isEditingKuri && selectedKuri
        ? await supabase
            .from("kuries")
            .update({
              name: trimmedName,
              organizer: trimmedOrganizer,
              reference_name: kuriReference.trim() || null,
            })
            .eq("id", selectedKuri.id)
            .select(
              "id,name,status,claim_status,progress,duration,kuri_amount,monthly_amount,organizer,reference_name,created_at",
            )
            .single()
        : await supabase
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

    setKuries((prev) =>
      isEditingKuri
        ? prev.map((kuri) => (kuri.id === created.id ? created : kuri))
        : [created, ...prev],
    );
    resetKuriForm();
    setShowAddKuri(false);
    setActiveTab("kuries");
    if (!isEditingKuri) openKuriDetail(created.id);
    bumpDataRefresh();
  };

  const resetPaymentForm = () => {
    setEditingPaymentId("");
    setPaymentDbError("");
    setPaidOnDate("");
    setPaymentRef("");
    setPaymentNote("");
    setPaymentAttachment(null);
  };

  const startEditPayment = (payment: KuriPaymentItem) => {
    setEditingPaymentId(payment.id);
    setPaymentDbError("");
    setPaidOnDate(payment.paidOn);
    setPaymentRef(payment.reference ?? "");
    setPaymentNote(payment.note ?? "");
    setPaymentAttachment(null);
    setShowMarkPaymentDrawer(true);
  };

  const requestDeletePayment = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
    setPaymentDbError("");
    setShowDeletePaymentDialog(true);
  };

  const deletePayment = async () => {
    if (!deletingPaymentId) return;
    const paymentToDelete = payments.find(
      (payment) => payment.id === deletingPaymentId,
    );
    if (!paymentToDelete) {
      setPaymentDbError("Payment record not found.");
      setShowDeletePaymentDialog(false);
      return;
    }

    const targetRound = rounds.find((round) => round.id === paymentToDelete.roundId);
    if (!targetRound) {
      setPaymentDbError("Round not found for this payment.");
      setShowDeletePaymentDialog(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("kuri_payments")
      .delete()
      .eq("id", deletingPaymentId);

    if (deleteError) {
      setPaymentDbError(deleteError.message);
      return;
    }

    const { count, error: countError } = await supabase
      .from("kuri_payments")
      .select("id", { count: "exact", head: true })
      .eq("round_id", targetRound.id);

    if (countError) {
      setPaymentDbError(countError.message);
      return;
    }

    const nextProgress = Math.min(count ?? 0, Math.max(targetRound.duration, 0));
    const nextStatus = computeRoundStatus(
      targetRound.startMonth,
      nextProgress,
      targetRound.duration,
      targetRound.claimedAmount,
      targetRound.totalValue,
    );

    const { error: updateError } = await supabase
      .from("kuri_rounds")
      .update({
        progress: nextProgress,
        status: nextStatus,
      })
      .eq("id", targetRound.id);

    if (updateError) {
      setPaymentDbError(updateError.message);
      return;
    }

    setShowDeletePaymentDialog(false);
    setDeletingPaymentId("");
    bumpDataRefresh();
  };

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id || !selectedKuri || !paymentFormRound) return;

    const isEditingPayment = Boolean(editingPayment);
    const paidAmountValue = Number(paymentFormAmount);
    const paymentMonth = editingPayment?.paymentMonth ?? nextPaymentMonth;

    if (!paymentMonth || !paidOnDate || !paidAmountValue) {
      setPaymentDbError("Please fill all required payment fields.");
      return;
    }
    if (
      !isEditingPayment &&
      activeRound &&
      activeRound.progress >= activeRound.duration
    ) {
      setPaymentDbError("All installments are already paid for this round.");
      return;
    }
    if (paidAmountValue <= 0) {
      setPaymentDbError("Amount paid should be greater than zero.");
      return;
    }

    setPaymentDbError("");
    setPaymentLoading(true);

    if (!isEditingPayment) {
      const { data: existing, error: existingError } = await supabase
        .from("kuri_payments")
        .select("id")
        .eq("round_id", paymentFormRound.id)
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
    }

    let attachmentUrl: string | null = editingPayment?.attachmentUrl ?? null;
    if (paymentAttachment) {
      const extension = paymentAttachment.name.split(".").pop() || "bin";
      const filePath = `${session.user.id}/${paymentFormRound.id}/${Date.now()}.${extension}`;
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

    const { error: upsertError } = isEditingPayment
      ? await supabase
          .from("kuri_payments")
          .update({
            paid_on: paidOnDate,
            reference: paymentRef.trim() || null,
            note: paymentNote.trim() || null,
            attachment_url: attachmentUrl,
          })
          .eq("id", editingPaymentId)
      : await supabase.from("kuri_payments").insert({
          user_id: session.user.id,
          kuri_id: selectedKuri.id,
          round_id: paymentFormRound.id,
          payment_month: paymentMonth,
          amount_paid: paidAmountValue,
          paid_on: paidOnDate,
          reference: paymentRef.trim() || null,
          note: paymentNote.trim() || null,
          attachment_url: attachmentUrl,
        });

    if (upsertError) {
      setPaymentLoading(false);
      setPaymentDbError(upsertError.message);
      return;
    }

    if (isEditingPayment) {
      setPaymentLoading(false);
      resetPaymentForm();
      setShowMarkPaymentDrawer(false);
      bumpDataRefresh();
      return;
    }

    if (!activeRound) {
      setPaymentLoading(false);
      setPaymentDbError("Active round not found.");
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

    resetPaymentForm();
    setShowMarkPaymentDrawer(false);
    bumpDataRefresh();
  };

  const resetClaimForm = () => {
    setEditingClaimId("");
    setClaimDbError("");
    setClaimDate("");
    setClaimReference("");
    setClaimNote("");
    setClaimAttachment(null);
  };

  const startEditClaim = (claim: KuriClaimItem) => {
    setEditingClaimId(claim.id);
    setClaimDbError("");
    setClaimDate(claim.claimedOn);
    setClaimReference(claim.reference ?? "");
    setClaimNote(claim.note ?? "");
    setClaimAttachment(null);
    setShowMarkClaimDrawer(true);
  };

  const submitClaim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id || !selectedKuri || !claimFormRound) return;

    const isEditingClaim = Boolean(editingClaim);
    const claimAmount = Number(claimFormAmount);
    if (!claimDate || claimAmount <= 0) {
      setClaimDbError("Please fill all required claim fields.");
      return;
    }
    if (
      !isEditingClaim &&
      activeRound &&
      claimsCount >= activeRound.numberOfClaims
    ) {
      setClaimDbError("All claims are already recorded for this round.");
      return;
    }

    setClaimDbError("");
    setClaimLoading(true);

    let attachmentUrl: string | null = editingClaim?.attachmentUrl ?? null;
    if (claimAttachment) {
      const extension = claimAttachment.name.split(".").pop() || "bin";
      const filePath = `${session.user.id}/${claimFormRound.id}/claim-${Date.now()}.${extension}`;
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

    const claimSequence = isEditingClaim ? claimFormSequence : claimsCount + 1;
    const { error: upsertError } = isEditingClaim
      ? await supabase
          .from("kuri_claims")
          .update({
            claimed_on: claimDate,
            reference: claimReference.trim() || null,
            note: claimNote.trim() || null,
            attachment_url: attachmentUrl,
          })
          .eq("id", editingClaimId)
      : await supabase.from("kuri_claims").insert({
          user_id: session.user.id,
          kuri_id: selectedKuri.id,
          round_id: claimFormRound.id,
          claim_sequence: claimSequence,
          amount_claimed: claimAmount,
          claimed_on: claimDate,
          reference: claimReference.trim() || null,
          note: claimNote.trim() || null,
          attachment_url: attachmentUrl,
        });

    if (upsertError) {
      setClaimLoading(false);
      setClaimDbError(upsertError.message);
      return;
    }

    if (isEditingClaim) {
      setClaimLoading(false);
      resetClaimForm();
      setShowMarkClaimDrawer(false);
      bumpDataRefresh();
      return;
    }

    if (!activeRound) {
      setClaimLoading(false);
      setClaimDbError("Active round not found.");
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
    resetClaimForm();
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
        <section
          ref={scrollContainerRef}
          className="relative flex h-svh min-h-svh flex-1 flex-col overflow-y-auto px-6 pt-20 pb-28"
        >
          {authView === "signin" ? (
            <div className="space-y-12">
              <div className="space-y-2">
                <h2 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">
                  Sign in to your KuriApp
                </h2>
                <p className="text-sm leading-5 text-muted-foreground">
                  Use your email and password to continue.
                </p>
              </div>

              <form
                id="signin-form"
                className="flex min-h-0 flex-col"
                onSubmit={handleSignIn}
              >
                <div className="space-y-3 pb-4">
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
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">
                  Create your KuriApp account
                </h2>
                <p className="text-sm leading-5 text-muted-foreground">
                  Add your full name to personalize your Account and records.
                </p>
              </div>

              <form
                id="signup-form"
                className="flex min-h-0 flex-col"
                onSubmit={handleSignUp}
              >
                <div className="space-y-3 pb-4">
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
                </div>
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

          <div className="fixed right-0 bottom-0 left-0 z-30 mx-auto w-full max-w-[800px] border-t border-border bg-background/95 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Button
              type="submit"
              form={authView === "signin" ? "signin-form" : "signup-form"}
              size="lg"
              disabled={authLoading}
              className="h-10 w-full rounded-md text-sm leading-6 font-medium"
            >
              {authView === "signin"
                ? authLoading
                  ? "Signing In..."
                  : "Sign In"
                : authLoading
                  ? "Creating Account..."
                  : "Sign Up"}
            </Button>
          </div>
        </section>
      )}

      {stage === "home" && (
        <section
          ref={scrollContainerRef}
          className="relative flex h-svh min-h-svh flex-1 flex-col overflow-y-auto"
        >
          <div
            className={cn(
              "flex-1 px-6 pt-6",
              showBottomMenu ? "pb-28" : "pb-6",
              pageTransitionClass,
            )}
          >
            {activeTab === "home" && (
              <>
                <div className="fixed top-0 right-0 left-0 z-30 mx-auto w-full max-w-[800px] bg-background px-6 pt-2 pb-3">
                  <div className="mt-2">
                    <p className="text-2xl leading-8 tracking-[-0.6px] text-foreground">
                      Hi, welcome back
                    </p>
                    <h2 className="text-[30px] leading-9 font-semibold tracking-[-0.025em] text-foreground">
                      {session?.user.user_metadata?.full_name || "Kuri User"}
                    </h2>
                  </div>
                </div>
                <div className="mt-24 grid grid-cols-2 gap-3">
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
                      <span>Monthly Payment</span>
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
                  <article className="rounded-xl border border-[#CBD5E1] bg-card p-3">
                    <div className="mb-4 inline-flex h-7 items-center gap-1.5 rounded-full bg-[#FEE2E2] px-2.5 text-[12px] leading-[130%] font-medium text-[#EF4444]">
                      <Wallet className="size-3.5" />
                      <span>To Pay</span>
                    </div>
                    <p className="text-[22px] leading-[130%] font-bold text-foreground">
                      {formatCompactInr(totalRemainingToPay)}
                    </p>
                    <p className="mt-1 text-[11px] leading-[130%] text-[#64748B]">
                      Total remaining
                    </p>
                  </article>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <article className="rounded-xl border border-[#CBD5E1] bg-card p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="size-4 text-[#3B82F6]" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Monthly Cashflow
                        </h3>
                      </div>
                      <div className="inline-flex rounded-full border border-border bg-background p-0.5">
                        <button
                          type="button"
                          onClick={() => setCashflowWindow(6)}
                          className={cn(
                            "rounded-full px-2 py-1 text-[11px] leading-none",
                            cashflowWindow === 6
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          6M
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashflowWindow(12)}
                          className={cn(
                            "rounded-full px-2 py-1 text-[11px] leading-none",
                            cashflowWindow === 12
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          12M
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {monthlyCashflowData.map((item) => (
                        <div
                          key={item.month}
                          className="grid grid-cols-[36px_1fr] items-center gap-2"
                        >
                          <span className="text-[11px] text-[#64748B]">
                            {chartMonthLabel(item.month)}
                          </span>
                          <div className="space-y-1">
                            <div className="h-2 rounded-full bg-[#DBEAFE]">
                              <div
                                className="h-2 rounded-full bg-[#3B82F6]"
                                style={{
                                  width: `${(item.paid / monthlyCashflowMax) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="h-2 rounded-full bg-[#DCFCE7]">
                              <div
                                className="h-2 rounded-full bg-[#22C55E]"
                                style={{
                                  width: `${(item.claimed / monthlyCashflowMax) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[11px] text-[#64748B]">
                      <span className="inline-flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#3B82F6]" />
                        Paid
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#22C55E]" />
                        Claimed
                      </span>
                    </div>
                  </article>
                  <article className="rounded-xl border border-[#CBD5E1] bg-card p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <PieChart className="size-4 text-[#F59E0B]" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Claim Status
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className="relative size-20 rounded-full"
                        style={{
                          background: `conic-gradient(${donutGradient})`,
                        }}
                      >
                        <div className="absolute inset-3 rounded-full bg-card" />
                      </div>
                      <div className="space-y-2">
                        {claimStatusData.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 text-xs text-[#64748B]"
                          >
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-foreground">
                              {item.value}
                            </span>
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>
              </>
            )}

            {activeTab === "kuries" && kuriView === "list" && (
              <>
                <div className="fixed top-0 right-0 left-0 z-30 mx-auto w-full max-w-[800px] bg-background px-6 pt-2 pb-3">
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
                      ["All", "Claimed", "Unclaimed", "Active"] as KuriFilter[]
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

                <div className="mt-24 space-y-3">
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
                    <EmptyState message="No kuries yet. Tap + to create your first kuri." />
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
                          <ClaimPillIcon
                            status={kuri.cardClaimStatus}
                            className={cn(
                              "size-4 shrink-0",
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
                  <div className="fixed top-0 right-0 left-0 z-30 mx-auto w-full max-w-[800px] bg-background px-6 pt-2 pb-3">
                    <div className="mb-4 flex items-center justify-between">
                      <button
                        type="button"
                        className="grid size-10 place-items-center rounded-full border border-border bg-background"
                        onClick={() => {
                          setShowKuriActions(false);
                          setKuriView("list");
                        }}
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className="size-10 rounded-full"
                          onClick={() => setShowKuriActions((prev) => !prev)}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                        {showKuriActions && (
                          <div className="absolute top-11 right-0 z-30 min-w-[180px] rounded-md border border-border bg-card p-1 shadow-sm">
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                              onClick={startEditKuri}
                            >
                              <Pencil className="size-4" />
                              Edit Kuri Details
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setShowKuriActions(false);
                                setShowDeleteKuriDialog(true);
                              }}
                            >
                              <Trash2 className="size-4" />
                              Delete Kuri
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                      {selectedKuri.name}
                    </h2>
                  </div>
                  <div className="mt-24 mb-5 rounded-xl border border-border bg-card p-4">
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
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Round Name
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {activeRound.roundName}
                          </p>
                        </div>
                        <div className="relative">
                          <Button
                            type="button"
                            variant="outline"
                            className="size-8 rounded-md"
                            onClick={() => setShowRoundActions((prev) => !prev)}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                          {showRoundActions && (
                            <div className="absolute top-9 right-0 z-30 min-w-[180px] rounded-md border border-border bg-card p-1 shadow-sm">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => {
                                  setShowRoundActions(false);
                                  setHistoryRoundId(activeRound.id);
                                  setKuriView("payment-history");
                                }}
                              >
                                Payment History
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => {
                                  setShowRoundActions(false);
                                  setHistoryRoundId(activeRound.id);
                                  setKuriView("claim-history");
                                }}
                              >
                                Claim Details
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => startEditRound(activeRound)}
                              >
                                <Pencil className="size-4" />
                                Edit Round
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setEditingRoundId(activeRound.id);
                                  setShowRoundActions(false);
                                  setShowDeleteRoundDialog(true);
                                }}
                              >
                                <Trash2 className="size-4" />
                                Delete Round
                              </button>
                            </div>
                          )}
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
                          <ClaimPillIcon
                            status={activeRound.claimStatus}
                            className={cn(
                              "size-4 shrink-0",
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
                            resetPaymentForm();
                            setPaidOnDate(
                              new Date().toISOString().split("T")[0],
                            );
                            setShowMarkPaymentDrawer(true);
                          }}
                        >
                          Record a Payment
                        </Button>
                        <Button
                          type="button"
                          className="h-10 w-full rounded-md text-sm"
                          onClick={() => {
                            if (!activeRound) return;
                            resetClaimForm();
                            setClaimDate(
                              new Date().toISOString().split("T")[0],
                            );
                            setShowMarkClaimDrawer(true);
                          }}
                        >
                          Record a Claim
                        </Button>
                      </div>
                    </div>
                  )}

                  {!activeRound && <EmptyState message="No active rounds." />}

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
                      onClick={() => {
                        resetRoundForm();
                        setShowNewRoundDrawer(true);
                      }}
                    >
                      New Round
                    </Button>
                  )}

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

                  <div className="h-6" />

                  <AlertDialog
                    open={showDeleteRoundDialog}
                    onOpenChange={setShowDeleteRoundDialog}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this round?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the round details. This action cannot
                          be undone.
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
                            onClick={deleteRound}
                          >
                            Delete
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

            {activeTab === "kuries" &&
              kuriView === "payment-history" &&
              selectedKuri &&
              historyRound && (
                <>
                  <div className="fixed top-0 right-0 left-0 z-30 mx-auto w-full max-w-[800px] bg-background px-6 pt-2 pb-3">
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

                  <div className="mt-[7rem] space-y-4">
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
                      <EmptyState message="No payments recorded yet." />
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

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 w-full rounded-md text-sm"
                              onClick={() => startEditPayment(payment)}
                            >
                              Edit Payment
                            </Button>
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
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 w-full rounded-md text-sm text-destructive"
                              onClick={() => requestDeletePayment(payment.id)}
                            >
                              Delete Payment
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <AlertDialog
                    open={showDeletePaymentDialog}
                    onOpenChange={setShowDeletePaymentDialog}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          <Button type="button" variant="outline" className="h-10 flex-1">
                            Cancel
                          </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction>
                          <Button
                            type="button"
                            className="h-10 flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={deletePayment}
                          >
                            Delete
                          </Button>
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

            {activeTab === "kuries" &&
              kuriView === "claim-history" &&
              selectedKuri &&
              historyRound && (
                <>
                  <div className="fixed top-0 right-0 left-0 z-30 mx-auto w-full max-w-[800px] bg-background px-6 pt-2 pb-3">
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

                  <div className="mt-[7rem] space-y-4">
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
                      <EmptyState message="No claims recorded yet." />
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

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full rounded-md text-sm"
                            onClick={() => startEditClaim(claim)}
                          >
                            Edit Claim
                          </Button>
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
                  <div className="fixed top-0 right-0 left-0 z-30 mx-auto w-full max-w-[800px] bg-background px-6 pt-2 pb-3">
                    <button
                      type="button"
                      className="mb-4 grid size-10 place-items-center rounded-full border border-border bg-background"
                      onClick={() => setKuriView("detail")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedKuri.name}
                    </p>
                    <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                      Completed Rounds
                    </h2>
                  </div>

                  <div className="mt-[7rem] space-y-5">
                    {completedRounds.length === 0 && (
                      <EmptyState message="No completed rounds yet." />
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
                <div className="fixed top-0 right-0 left-0 z-30 mx-auto w-full max-w-[800px] bg-background px-6 pt-2 pb-3">
                  {accountView !== "menu" && (
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
                      className="mb-4 grid size-10 place-items-center rounded-full border border-border bg-background"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                      {accountView === "profile"
                        ? "Profile"
                        : accountView === "appearance"
                          ? "Appearance"
                          : accountView === "about"
                            ? "About App"
                            : "Account"}
                    </h2>
                    {accountView === "menu" && (
                      <span className="size-10" aria-hidden />
                    )}
                  </div>
                </div>
                <div
                  className={cn(
                    accountView === "menu" ? "mt-20" : "mt-[6.5rem]",
                  )}
                />
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
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountView("appearance")}
                        className="flex h-12 w-full items-center justify-between border-b border-border px-4 text-sm font-medium text-foreground"
                      >
                        <span>Appearance</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountView("about")}
                        className="flex h-12 w-full items-center justify-between px-4 text-sm font-medium text-foreground"
                      >
                        <span>About App</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
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
                    <div className="space-y-5 rounded-xl border border-border bg-card p-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Name
                          </p>
                          {!showChangeNameForm && (
                            <button
                              type="button"
                              className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                              onClick={() => {
                                setShowChangeNameForm(true);
                                setChangeNameError("");
                                setChangeNameMessage("");
                                setNewDisplayName(
                                  session?.user.user_metadata?.full_name ||
                                    "Kuri User",
                                );
                              }}
                            >
                              <Pencil className="size-4" />
                            </button>
                          )}
                        </div>
                        {!showChangeNameForm ? (
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {session?.user.user_metadata?.full_name ||
                              "Kuri User"}
                          </p>
                        ) : (
                          <form
                            className="mt-2 space-y-2"
                            onSubmit={handleChangeName}
                          >
                            {changeNameError && (
                              <p className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
                                {changeNameError}
                              </p>
                            )}
                            {changeNameMessage && (
                              <p className="rounded-md border border-emerald-500/40 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                                {changeNameMessage}
                              </p>
                            )}
                            <input
                              type="text"
                              value={newDisplayName}
                              onChange={(e) =>
                                setNewDisplayName(e.target.value)
                              }
                              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                              placeholder="Enter your full name"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-9 flex-1"
                                onClick={() => {
                                  setShowChangeNameForm(false);
                                  setChangeNameError("");
                                  setChangeNameMessage("");
                                  setNewDisplayName("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="h-9 flex-1"
                                disabled={changeNameLoading}
                              >
                                {changeNameLoading ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </form>
                        )}
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
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="mb-3 text-sm font-medium text-foreground">
                        Theme
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name="theme-mode"
                            checked={theme === "light"}
                            onChange={() => setTheme("light")}
                            className="size-4 accent-primary"
                          />
                          <span>Light</span>
                        </label>
                        <label className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name="theme-mode"
                            checked={theme === "dark"}
                            onChange={() => setTheme("dark")}
                            className="size-4 accent-primary"
                          />
                          <span>Dark</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
                {accountView === "about" && (
                  <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                    <h3 className="text-base font-semibold text-foreground">
                      KuriApp
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      KuriApp helps trusted groups track Kuri rounds with clear
                      records for payments, claims, progress, and history.
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      This app is only for tracking and transparency. It does
                      not collect, hold, or transfer money.
                    </p>
                    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                      Version: 1.0.0
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {showBottomMenu && (
            <div className="fixed right-0 bottom-0 left-0 z-30 mx-auto w-full max-w-[800px] px-5 py-5">
              <nav className="relative rounded-full border border-border bg-card p-1.5">
                <div
                  className="absolute top-1.5 left-1.5 h-[calc(100%-0.75rem)] w-[calc((100%-0.75rem)/3)] rounded-full bg-primary/10 transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
                />
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
                          "relative z-10 flex w-full flex-col items-center gap-1 rounded-full py-2 transition-colors duration-200",
                          activeTab === tabId
                            ? "text-primary"
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

          <Sheet
            open={showAddKuri}
            onOpenChange={(open) => {
              setShowAddKuri(open);
              if (!open) resetKuriForm();
            }}
          >
            <SheetContent
              side={sheetSide}
              className="flex flex-col overflow-hidden border-border bg-card"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  {isEditingKuri ? "Edit Kuri" : "Add Kuri"}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {isEditingKuri
                    ? "Update Kuri details"
                    : "Create a new Kuri to track"}
                </SheetDescription>
              </SheetHeader>
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={submitKuri}
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
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
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-10">
                  <SheetClose
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
                    onClick={resetKuriForm}
                  >
                    Cancel
                  </SheetClose>
                  <Button type="submit" className="h-10 flex-1">
                    {isEditingKuri ? "Save Changes" : "Submit"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>

          <Sheet
            open={showNewRoundDrawer}
            onOpenChange={(open) => {
              setShowNewRoundDrawer(open);
              if (!open) resetRoundForm();
            }}
          >
            <SheetContent
              side={sheetSide}
              className="flex flex-col overflow-hidden border-border bg-card"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  {isEditingRound ? "Edit Round" : "New Round"}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {isEditingRound
                    ? "Update details for this round"
                    : "Add round details for this kuri"}
                </SheetDescription>
              </SheetHeader>
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={submitRound}
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
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
                      className="mt-2 block h-10 w-full min-w-0 max-w-full rounded-md border border-border bg-background px-3 py-0 text-sm leading-10"
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
                </div>
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-10">
                  <SheetClose
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
                    onClick={resetRoundForm}
                  >
                    Cancel
                  </SheetClose>
                  <Button type="submit" className="h-10 flex-1">
                    {isEditingRound ? "Save Changes" : "Submit"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>

          <Sheet
            open={showMarkPaymentDrawer}
            onOpenChange={(open) => {
              setShowMarkPaymentDrawer(open);
              if (!open) resetPaymentForm();
            }}
          >
            <SheetContent
              side={sheetSide}
              className="flex flex-col overflow-hidden border-border bg-card"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  {editingPayment ? "Edit Payment" : "Record a Payment"}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {editingPayment
                    ? "Update payment details for this installment"
                    : "Record payment for this round"}
                </SheetDescription>
              </SheetHeader>
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={submitPayment}
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
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
                      value={`${String(paymentFormInstallment).padStart(2, "0")} / ${paymentFormRound?.duration ?? 0}`}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Amount Paid
                    <input
                      type="text"
                      readOnly
                      value={
                        paymentFormRound
                          ? formatMoney(
                              paymentFormRound.currency,
                              paymentFormAmount,
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
                      className="mt-2 block h-10 w-full min-w-0 max-w-full rounded-md border border-border bg-background px-3 py-0 text-sm leading-10"
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
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 py-0 text-sm leading-10 file:mr-3 file:h-7 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-0 file:text-xs file:leading-7 file:font-medium file:text-primary-foreground"
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
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-10">
                  <SheetClose
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
                    onClick={resetPaymentForm}
                  >
                    Cancel
                  </SheetClose>
                  <Button
                    type="submit"
                    className="h-10 flex-1"
                    disabled={paymentLoading}
                  >
                    {paymentLoading
                      ? "Saving..."
                      : editingPayment
                        ? "Save Changes"
                        : "Save Payment"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>

          <Sheet
            open={showMarkClaimDrawer}
            onOpenChange={(open) => {
              setShowMarkClaimDrawer(open);
              if (!open) resetClaimForm();
            }}
          >
            <SheetContent
              side={sheetSide}
              className="flex flex-col overflow-hidden border-border bg-card"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  {editingClaim ? "Edit Claim" : "Record a Claim"}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {editingClaim
                    ? "Update claim details for this installment"
                    : "Record claim received for this round"}
                </SheetDescription>
              </SheetHeader>
              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={submitClaim}
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">
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
                        claimFormRound
                          ? formatMoney(
                              claimFormRound.currency,
                              claimFormAmount,
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
                      value={`${String(claimFormSequence).padStart(2, "0")} / ${claimFormRound?.numberOfClaims ?? 0}`}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium text-foreground">
                    Claim Date
                    <input
                      type="date"
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                      className="mt-2 block h-10 w-full min-w-0 max-w-full rounded-md border border-border bg-background px-3 py-0 text-sm leading-10"
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
                      className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 py-0 text-sm leading-10 file:mr-3 file:h-7 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-0 file:text-xs file:leading-7 file:font-medium file:text-primary-foreground"
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
                <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-4 pt-3 pb-10">
                  <SheetClose
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
                    onClick={resetClaimForm}
                  >
                    Cancel
                  </SheetClose>
                  <Button
                    type="submit"
                    className="h-10 flex-1"
                    disabled={claimLoading}
                  >
                    {claimLoading
                      ? "Saving..."
                      : editingClaim
                        ? "Save Changes"
                        : "Save Claim"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </section>
      )}
    </main>
  );
}

export default App;
