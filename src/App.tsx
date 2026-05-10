import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  BadgeIndianRupee,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  CircleCheck,
  House,
  LayoutDashboard,
  Layers3,
  Moon,
  Plus,
  UserCircle2,
  WalletCards,
  ShieldCheck,
  Sun,
  UserPlus,
  UsersRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type OnboardingScreen = {
  title: string
  body: string
  cta: string
  heroIcon: React.ComponentType<{ className?: string }>
  heroTone: string
  points: Array<{
    text: string
    icon: React.ComponentType<{ className?: string }>
    iconTone: string
  }>
}

type AuthView = 'signin' | 'signup'
type AppStage = 'splash' | 'onboarding' | 'auth' | 'home'
type ThemeMode = 'light' | 'dark'
type KuriFilter = 'All' | 'Claimed' | 'Unclaimed' | 'Active' | 'Completed'
type AppTab = 'home' | 'kuries' | 'account'
type KuriView = 'list' | 'detail'

type KuriItem = {
  id: string
  name: string
  status: 'Active' | 'Completed'
  claimStatus: 'Unclaimed' | 'Claimed' | 'Fully Claimed'
  progress: number
  duration: number
  kuriAmount: number
  monthlyAmount: number
  organizer: string
  referenceName?: string
}

type KuriRow = {
  id: string
  name: string
  status: string
  claim_status: string
  progress: number
  duration: number
  kuri_amount: number
  monthly_amount: number
  organizer: string
  reference_name: string | null
  created_at: string
}

type KuriRound = {
  id: string
  kuriId: string
  roundName: string
  status: 'Upcoming' | 'Active' | 'Completed'
  claimStatus: 'Claimed' | 'Partially Claimed' | 'Unclaimed'
  currency: 'INR' | 'SGD' | 'DHR'
  monthlyAmount: number
  numberOfClaims: number
  claimedAmount: number
  totalValue: number
  claimAmountPerClaim: number
  startMonth: string
  endMonth: string
  paymentDate: number
  paymentSchedule: string[]
  pendingClaimAmount: number
  progress: number
  duration: number
}

type KuriRoundRow = {
  id: string
  kuri_id: string
  round_name: string
  status: string
  claim_status: string
  currency: string
  monthly_amount: number
  number_of_claims: number
  claimed_amount: number
  total_value: number
  claim_amount_per_claim: number
  start_month: string
  end_month: string
  payment_date: number
  payment_schedule: string[] | null
  pending_claim_amount: number
  progress: number
  duration: number
  created_at: string
}

const mapRoundStatus = (status: string): 'Upcoming' | 'Active' | 'Completed' => {
  if (status === 'Upcoming' || status === 'Completed') return status
  return 'Active'
}

const mapClaimStatus = (status: string): 'Claimed' | 'Partially Claimed' | 'Unclaimed' => {
  if (status === 'Claimed' || status === 'Partially Claimed') return status
  return 'Unclaimed'
}

const onboardingScreens: OnboardingScreen[] = [
  {
    title: 'See every Kuri in one place',
    body: 'Track personal and group Kuries, monthly dues, claim status and remaining months from one calm dashboard.',
    cta: 'Next',
    heroIcon: LayoutDashboard,
    heroTone: 'bg-blue-100 text-chart-2',
    points: [
      { text: 'Active Kuries and monthly totals', icon: LayoutDashboard, iconTone: 'text-chart-2' },
      { text: 'Upcoming commitments and reminders', icon: Clock3, iconTone: 'text-chart-4' },
    ],
  },
  {
    title: 'Coordinate trusted groups',
    body: 'Invite members by mobile number, record payment logs, and keep lot results visible to everyone in the group.',
    cta: 'Next',
    heroIcon: UsersRound,
    heroTone: 'bg-green-100 text-chart-3',
    points: [
      { text: 'Invite members by phone number', icon: UserPlus, iconTone: 'text-chart-3' },
      { text: 'Draw history and audit trail', icon: Clock3, iconTone: 'text-chart-1' },
    ],
  },
  {
    title: 'Transparent, without handling money',
    body: 'KuriApp records what happened. It does not collect payments. It never handles real funds.',
    cta: 'Get Started',
    heroIcon: ShieldCheck,
    heroTone: 'bg-yellow-100 text-yellow-500',
    points: [
      { text: 'No money collection in the app', icon: BadgeIndianRupee, iconTone: 'text-chart-4' },
      { text: 'Clear claimed and unclaimed status', icon: CheckCircle2, iconTone: 'text-chart-3' },
    ],
  },
]

const ONBOARDING_KEY = 'kuriapp_onboarding_done'
const THEME_KEY = 'kuriapp_theme'

function App() {
  const [stage, setStage] = useState<AppStage>('splash')
  const [session, setSession] = useState<Session | null>(null)
  const [index, setIndex] = useState(0)
  const [authView, setAuthView] = useState<AuthView>('signin')
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [authMessage, setAuthMessage] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  const [signUpName, setSignUpName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('')
  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [kuriView, setKuriView] = useState<KuriView>('list')
  const [kuriFilter, setKuriFilter] = useState<KuriFilter>('All')
  const [showAddKuri, setShowAddKuri] = useState(false)
  const [kuries, setKuries] = useState<KuriItem[]>([])
  const [selectedKuriId, setSelectedKuriId] = useState<string>('')
  const [kuriLoading, setKuriLoading] = useState(false)
  const [kuriDbError, setKuriDbError] = useState('')
  const [roundDbError, setRoundDbError] = useState('')
  const [roundLoading, setRoundLoading] = useState(false)
  const [rounds, setRounds] = useState<KuriRound[]>([])
  const [showNewRoundDrawer, setShowNewRoundDrawer] = useState(false)
  const [kuriName, setKuriName] = useState('')
  const [kuriOrganizer, setKuriOrganizer] = useState('')
  const [kuriReference, setKuriReference] = useState('')
  const [roundStartMonth, setRoundStartMonth] = useState('')
  const [roundName, setRoundName] = useState('')
  const [roundCurrency, setRoundCurrency] = useState<'INR' | 'SGD' | 'DHR'>('INR')
  const [roundMonthlyAmount, setRoundMonthlyAmount] = useState('')
  const [roundDuration, setRoundDuration] = useState('')
  const [roundClaims, setRoundClaims] = useState('')
  const [roundPaymentDate, setRoundPaymentDate] = useState('')
  const [roundClaimedAmount, setRoundClaimedAmount] = useState('')

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null
    const initialTheme: ThemeMode = storedTheme ?? 'light'
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession()

      if (!isMounted) return

      setSession(existingSession)

      if (existingSession) {
        setStage('home')
        return
      }

      const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === 'true'
      setStage(onboardingDone ? 'auth' : 'splash')
    }

    void bootstrap()

    const splashTimer = window.setTimeout(() => {
      setStage((current) => (current === 'splash' ? 'onboarding' : current))
    }, 2200)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) setStage('home')
    })

    return () => {
      isMounted = false
      window.clearTimeout(splashTimer)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadKuries = async () => {
      if (!session?.user?.id) {
        setKuries([])
        setSelectedKuriId('')
        return
      }

      setKuriLoading(true)
      setKuriDbError('')

      const { data, error } = await supabase
        .from('kuries')
        .select(
          'id,name,status,claim_status,progress,duration,kuri_amount,monthly_amount,organizer,reference_name,created_at',
        )
        .order('created_at', { ascending: false })

      setKuriLoading(false)

      if (error) {
        setKuriDbError(error.message)
        return
      }

      const mapped: KuriItem[] = ((data ?? []) as KuriRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status === 'Completed' ? 'Completed' : 'Active',
        claimStatus:
          row.claim_status === 'Claimed' || row.claim_status === 'Fully Claimed'
            ? row.claim_status
            : 'Unclaimed',
        progress: row.progress ?? 0,
        duration: row.duration ?? 12,
        kuriAmount: Number(row.kuri_amount ?? 0),
        monthlyAmount: Number(row.monthly_amount ?? 0),
        organizer: row.organizer,
        referenceName: row.reference_name ?? undefined,
      }))

      setKuries(mapped)
      setSelectedKuriId((prev) => prev || mapped[0]?.id || '')
    }

    void loadKuries()
  }, [session?.user?.id])

  useEffect(() => {
    const loadRounds = async () => {
      if (!session?.user?.id || !selectedKuriId) {
        setRounds([])
        return
      }
      setRoundLoading(true)
      setRoundDbError('')

      const { data, error } = await supabase
        .from('kuri_rounds')
        .select(
          'id,kuri_id,round_name,status,claim_status,currency,monthly_amount,number_of_claims,claimed_amount,total_value,claim_amount_per_claim,start_month,end_month,payment_date,payment_schedule,pending_claim_amount,progress,duration,created_at',
        )
        .eq('kuri_id', selectedKuriId)
        .order('created_at', { ascending: false })

      setRoundLoading(false)

      if (error) {
        setRoundDbError(error.message)
        return
      }

      const mapped: KuriRound[] = ((data ?? []) as KuriRoundRow[]).map((row) => ({
        id: row.id,
        kuriId: row.kuri_id,
        roundName: row.round_name,
        status: mapRoundStatus(row.status),
        claimStatus: mapClaimStatus(row.claim_status),
        currency:
          row.currency === 'SGD' || row.currency === 'DHR'
            ? row.currency
            : 'INR',
        monthlyAmount: Number(row.monthly_amount ?? 0),
        numberOfClaims: row.number_of_claims ?? 1,
        claimedAmount: Number(row.claimed_amount ?? 0),
        totalValue: Number(row.total_value ?? 0),
        claimAmountPerClaim: Number(row.claim_amount_per_claim ?? 0),
        startMonth: row.start_month,
        endMonth: row.end_month,
        paymentDate: row.payment_date ?? 1,
        paymentSchedule: row.payment_schedule ?? [],
        pendingClaimAmount: Number(row.pending_claim_amount ?? 0),
        progress: row.progress ?? 0,
        duration: row.duration ?? 12,
      }))

      setRounds(mapped)
    }

    void loadRounds()
  }, [session?.user?.id, selectedKuriId])

  const current = onboardingScreens[index]

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setStage('auth')
    setAuthView('signin')
  }

  const goNext = () => {
    if (index < onboardingScreens.length - 1) {
      setIndex((prev) => prev + 1)
      return
    }
    completeOnboarding()
  }

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')
    setAuthLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    })

    setAuthLoading(false)
    if (error) {
      setAuthError(error.message)
      return
    }

    setAuthMessage('Signed in successfully.')
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')

    if (signUpPassword !== signUpConfirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }

    setAuthLoading(true)

    const { error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        data: { full_name: signUpName },
      },
    })

    setAuthLoading(false)
    if (error) {
      setAuthError(error.message)
      return
    }

    setAuthMessage('Account created. Check your email to verify your account before signing in.')
    setAuthView('signin')
    setSignInEmail(signUpEmail)
    setSignInPassword('')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setStage('auth')
    setAuthView('signin')
  }

  const filteredKuries = kuries.filter((kuri) => {
    if (kuriFilter === 'All') return true
    if (kuriFilter === 'Active') return kuri.status === 'Active'
    if (kuriFilter === 'Completed') return kuri.status === 'Completed'
    if (kuriFilter === 'Claimed') return kuri.claimStatus === 'Claimed' || kuri.claimStatus === 'Fully Claimed'
    if (kuriFilter === 'Unclaimed') return kuri.claimStatus === 'Unclaimed'
    return true
  })

  const selectedKuri = kuries.find((kuri) => kuri.id === selectedKuriId) ?? kuries[0]
  const activeRound = rounds[0]
  const remainingAmountToPay = activeRound
    ? Math.max(activeRound.monthlyAmount * Math.max(activeRound.duration - activeRound.progress, 0), 0)
    : 0

  const formatInr = (value: number) => `INR ${value.toLocaleString('en-IN')}`
  const formatMoney = (currency: 'INR' | 'SGD' | 'DHR', value: number) => {
    const symbol = currency === 'INR' ? 'INR' : currency === 'SGD' ? 'SGD' : 'DHR'
    return `${symbol} ${value.toLocaleString('en-IN')}`
  }
  const formatMonthLabel = (value: string) => {
    if (!value) return '-'
    const [year, month] = value.split('-').map(Number)
    if (!year || !month) return value
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }

  const addMonths = (monthValue: string, monthsToAdd: number) => {
    const [year, month] = monthValue.split('-').map(Number)
    const d = new Date(year, (month || 1) - 1, 1)
    d.setMonth(d.getMonth() + monthsToAdd)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const monthToNumber = (monthValue: string) => {
    const [year, month] = monthValue.split('-').map(Number)
    return year * 12 + (month - 1)
  }
  const buildPaymentSchedule = (startMonth: string, duration: number) =>
    Array.from({ length: Math.max(duration, 0) }, (_, idx) => addMonths(startMonth, idx))
  const computeRoundStatus = (
    startMonth: string,
    endMonth: string,
    progress: number,
    duration: number,
  ): 'Upcoming' | 'Active' | 'Completed' => {
    if (progress >= duration) return 'Completed'
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentNum = monthToNumber(currentMonth)
    if (currentNum < monthToNumber(startMonth)) return 'Upcoming'
    if (currentNum > monthToNumber(endMonth)) return 'Completed'
    return 'Active'
  }
  const computeClaimStatus = (
    claimedAmount: number,
    totalValue: number,
  ): 'Claimed' | 'Partially Claimed' | 'Unclaimed' => {
    if (claimedAmount <= 0) return 'Unclaimed'
    if (claimedAmount >= totalValue) return 'Claimed'
    return 'Partially Claimed'
  }

  const openKuriDetail = (kuriId: string) => {
    setSelectedKuriId(kuriId)
    setKuriView('detail')
    setShowAddKuri(false)
  }

  const submitRound = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.user?.id || !selectedKuri) return

    const monthly = Number(roundMonthlyAmount)
    const duration = Number(roundDuration)
    const claims = Number(roundClaims)
    const paymentDate = Number(roundPaymentDate)
    const claimed = Number(roundClaimedAmount || 0)

    if (!roundName.trim() || !roundStartMonth || !monthly || !duration || !claims || !paymentDate) {
      setRoundDbError('Please fill all required round fields.')
      return
    }
    if (paymentDate < 1 || paymentDate > 31) {
      setRoundDbError('Payment Date should be between 1 and 31.')
      return
    }

    const totalValue = monthly * duration
    const claimAmountPerClaim = totalValue / claims
    const pendingClaimAmount = Math.max(totalValue - claimed, 0)
    const endMonth = addMonths(roundStartMonth, Math.max(duration - 1, 0))
    const paymentSchedule = buildPaymentSchedule(roundStartMonth, duration)
    const progress = 0
    const status = computeRoundStatus(roundStartMonth, endMonth, progress, duration)
    const claimStatus = computeClaimStatus(claimed, totalValue)

    setRoundDbError('')
    const { data, error } = await supabase
      .from('kuri_rounds')
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
        'id,kuri_id,round_name,status,claim_status,currency,monthly_amount,number_of_claims,claimed_amount,total_value,claim_amount_per_claim,start_month,end_month,payment_date,payment_schedule,pending_claim_amount,progress,duration,created_at',
      )
      .single()

    if (error || !data) {
      setRoundDbError(error?.message ?? 'Failed to create round.')
      return
    }

    const created: KuriRound = {
      id: data.id,
      kuriId: data.kuri_id,
      roundName: data.round_name,
      status: mapRoundStatus(data.status),
      claimStatus: mapClaimStatus(data.claim_status),
      currency:
        data.currency === 'SGD' || data.currency === 'DHR'
          ? data.currency
          : 'INR',
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
    }

    setRounds((prev) => [created, ...prev])
    setRoundName('')
    setRoundStartMonth('')
    setRoundCurrency('INR')
    setRoundMonthlyAmount('')
    setRoundDuration('')
    setRoundClaims('')
    setRoundPaymentDate('')
    setRoundClaimedAmount('')
    setShowNewRoundDrawer(false)
  }

  const submitKuri = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.user?.id) return

    const trimmedName = kuriName.trim()
    const trimmedOrganizer = kuriOrganizer.trim()
    if (!trimmedName || !trimmedOrganizer) return

    setKuriDbError('')
    const { data, error } = await supabase
      .from('kuries')
      .insert({
        user_id: session.user.id,
        name: trimmedName,
        organizer: trimmedOrganizer,
        reference_name: kuriReference.trim() || null,
        status: 'Active',
        claim_status: 'Unclaimed',
        progress: 0,
        duration: 12,
        kuri_amount: 100000,
        monthly_amount: 10000,
      })
      .select(
        'id,name,status,claim_status,progress,duration,kuri_amount,monthly_amount,organizer,reference_name,created_at',
      )
      .single()

    if (error || !data) {
      setKuriDbError(error?.message ?? 'Failed to create kuri.')
      return
    }

    const created: KuriItem = {
      id: data.id,
      name: data.name,
      status: data.status === 'Completed' ? 'Completed' : 'Active',
      claimStatus:
        data.claim_status === 'Claimed' || data.claim_status === 'Fully Claimed'
          ? data.claim_status
          : 'Unclaimed',
      progress: data.progress ?? 0,
      duration: data.duration ?? 12,
      kuriAmount: Number(data.kuri_amount ?? 0),
      monthlyAmount: Number(data.monthly_amount ?? 0),
      organizer: data.organizer,
      referenceName: data.reference_name ?? undefined,
    }

    setKuries((prev) => [created, ...prev])
    setKuriName('')
    setKuriOrganizer('')
    setKuriReference('')
    setShowAddKuri(false)
    setActiveTab('kuries')
    openKuriDetail(created.id)
  }

  const themeToggle = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 rounded-md"
      onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
    >
      {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
      <span>{theme === 'light' ? 'Dark' : 'Light'} mode</span>
    </Button>
  )

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[500px] flex-col overflow-hidden bg-background text-foreground">
      {stage === 'splash' && (
        <section className="flex min-h-svh flex-1 flex-col items-center bg-primary px-8 pb-12 pt-24 text-center text-primary-foreground">
          <div className="mt-48 flex flex-1 flex-col items-center">
            <div className="grid size-20 place-items-center rounded-[24px] bg-card">
              <BadgeIndianRupee className="size-9 text-primary" />
            </div>
            <h1 className="mt-4 text-[36px] leading-[1] font-bold tracking-[-0.025em]">KuriApp</h1>
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
            <p className="text-xs leading-4 font-semibold">Preparing your KuriApp</p>
          </div>
        </section>
      )}

      {stage === 'onboarding' && (
        <section className="flex min-h-svh flex-1 flex-col px-6 pb-8 pt-16">
          <div className="flex flex-1 flex-col items-center">
            <div className={cn('grid size-24 place-items-center rounded-full', current.heroTone)}>
              <div className="grid size-14 place-items-center rounded-full bg-background">
                <current.heroIcon className="size-6" />
              </div>
            </div>

            <h2 className="mt-8 text-center text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">
              {current.title}
            </h2>
            <p className="mt-6 max-w-[354px] text-center text-sm leading-5 text-muted-foreground">{current.body}</p>

            <div className="mt-8 flex w-full flex-col gap-3">
              {current.points.map((point) => {
                const Icon = point.icon
                return (
                  <div key={point.text} className="flex h-12 items-center gap-3 rounded-[8px] border border-border bg-background px-4">
                    <Icon className={cn('size-4', point.iconTone)} />
                    <span className="text-sm leading-[14px] text-foreground">{point.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-center gap-2">
              {onboardingScreens.map((_, dotIndex) => (
                <span key={dotIndex} className={cn('h-2 w-2 rounded-full bg-muted', dotIndex === index && 'w-6 bg-primary')} />
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="h-10 w-20 rounded-md border-border bg-background text-sm leading-6" onClick={completeOnboarding}>
                Skip
              </Button>
              <Button size="lg" className="h-10 flex-1 rounded-md text-sm leading-6" onClick={goNext}>
                {current.cta}
              </Button>
            </div>
          </div>
        </section>
      )}

      {stage === 'auth' && (
        <section className="flex min-h-svh flex-1 flex-col px-6 pb-8 pt-20">
          <div className="mb-6 flex justify-end">{themeToggle}</div>
          {authView === 'signin' ? (
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">Sign in to your KuriApp account</h2>
                <p className="text-sm leading-5 text-muted-foreground">Use your email and password to continue.</p>
              </div>

              <form className="space-y-3" onSubmit={handleSignIn}>
                <label className="block text-sm leading-5 font-medium text-foreground">
                  Email Address
                  <input type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" placeholder="Enter your email address" />
                </label>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Password
                  <input type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" placeholder="Enter your password" />
                </label>

                <button type="button" className="pt-1 text-sm leading-6 font-medium text-primary">Forgot your password?</button>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4 text-chart-3" />
                    <div>
                      <p className="text-sm leading-[14px] text-foreground">Private tracking only</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">KuriApp helps you record payments, lots and claims. It never collects or transfers money.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-sm leading-6">
                  <span className="text-foreground">Don’t have an account?</span>
                  <button type="button" className="font-medium text-primary" onClick={() => { setAuthError(''); setAuthMessage(''); setAuthView('signup') }}>
                    Sign up
                  </button>
                </div>

                <Button type="submit" size="lg" disabled={authLoading} className="mt-56 h-10 w-full rounded-md text-sm leading-6 font-medium">
                  {authLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-2xl leading-8 font-bold tracking-[-0.6px] text-foreground">Create your KuriApp account</h2>
                <p className="text-sm leading-5 text-muted-foreground">Add your full name to personalize your Account and records.</p>
              </div>

              <form className="space-y-3" onSubmit={handleSignUp}>
                <label className="block text-sm leading-5 font-medium text-foreground">
                  Full Name
                  <input type="text" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} required className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" placeholder="Enter your full name" />
                </label>

                <p className="text-sm leading-5 text-muted-foreground">You can change this later from Account settings.</p>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Email Address
                  <input type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" placeholder="Enter your email address" />
                </label>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Password
                  <input type="password" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" placeholder="Enter a password" />
                </label>

                <label className="block text-sm leading-5 font-medium text-foreground">
                  Confirm Password
                  <input type="password" value={signUpConfirmPassword} onChange={(e) => setSignUpConfirmPassword(e.target.value)} required className="mt-2 h-12 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" placeholder="Enter your password again" />
                </label>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4 text-chart-3" />
                    <div>
                      <p className="text-sm leading-[14px] text-foreground">Private tracking only</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">KuriApp helps you record payments, lots and claims. It never collects or transfers money.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-sm leading-6">
                  <span className="text-foreground">Already have an account?</span>
                  <button type="button" className="font-medium text-primary" onClick={() => { setAuthError(''); setAuthMessage(''); setAuthView('signin') }}>
                    Sign In
                  </button>
                </div>

                <Button type="submit" size="lg" disabled={authLoading} className="mt-8 h-10 w-full rounded-md text-sm leading-6 font-medium">
                  {authLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </div>
          )}

          {(authError || authMessage) && (
            <div className={cn('mt-4 rounded-md border px-3 py-2 text-sm', authError ? 'border-destructive/40 text-destructive' : 'border-chart-3/40 text-chart-3')}>
              {authError || authMessage}
            </div>
          )}
        </section>
      )}

      {stage === 'home' && (
        <section className="relative flex min-h-svh flex-1 flex-col">
          <div className="flex-1 px-6 pt-8">
            {activeTab === 'home' && (
              <>
                <div className="mb-8 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl leading-8 text-foreground">Hi, welcome back</p>
                    <h2 className="text-[30px] leading-9 font-semibold text-foreground">
                      {session?.user.user_metadata?.full_name || 'Kuri User'}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">{session?.user.email}</p>
                  </div>
                  {themeToggle}
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">
                    Use the `Kuries` tab to manage your personal ROSCA rounds.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'kuries' && kuriView === 'list' && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">Kuries</h2>
                  <Button
                    size="icon-lg"
                    className="size-10 rounded-full"
                    onClick={() => setShowAddKuri(true)}
                  >
                    <Plus className="size-5" />
                  </Button>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {(['All', 'Claimed', 'Unclaimed', 'Active', 'Completed'] as KuriFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setKuriFilter(filter)}
                      className={cn(
                        'h-9 rounded-md border px-3 text-sm',
                        kuriFilter === filter
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground',
                      )}
                    >
                      {filter}
                    </button>
                  ))}
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
                        if (e.key === 'Enter') openKuriDetail(kuri.id)
                      }}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="text-base leading-6 font-semibold text-foreground">{kuri.name}</h3>
                          <p
                            className={cn(
                              'text-sm leading-5 font-medium',
                              kuri.status === 'Active' ? 'text-chart-3' : 'text-destructive',
                            )}
                          >
                            {kuri.status}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-chart-2">
                          {kuri.claimStatus === 'Fully Claimed' ? (
                            <CircleCheck className="size-4 text-destructive" />
                          ) : (
                            <WalletCards className="size-4" />
                          )}
                          <span>{kuri.claimStatus}</span>
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-muted">
                          <div
                            className="h-1 rounded-full bg-primary"
                            style={{ width: `${(kuri.progress / kuri.duration) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm leading-6 font-medium text-foreground">
                          {String(kuri.progress).padStart(2, '0')}/{kuri.duration}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Kuri Amount:</p>
                          <p className="text-sm leading-5 font-medium text-foreground">{formatInr(kuri.kuriAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly Amount:</p>
                          <p className="text-sm leading-5 font-medium text-foreground">{formatInr(kuri.monthlyAmount)}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'kuries' && kuriView === 'detail' && selectedKuri && (
              <>
                <button
                  type="button"
                  className="mb-6 grid size-10 place-items-center rounded-full border border-border bg-background"
                  onClick={() => setKuriView('list')}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <h2 className="mb-5 text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">{selectedKuri.name}</h2>
                <div className="mb-5 rounded-xl border border-border bg-card p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Organizer:</p>
                      <p className="text-sm leading-5 font-medium text-foreground">{selectedKuri.organizer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">C/o:</p>
                      <p className="text-sm leading-5 font-medium text-foreground">
                        {selectedKuri.referenceName || '-'}
                      </p>
                    </div>
                  </div>
                </div>
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

                {!activeRound && (
                  <Button
                    size="lg"
                    className="h-10 w-full rounded-md text-base"
                    onClick={() => setShowNewRoundDrawer(true)}
                  >
                    New Round
                  </Button>
                )}

                {activeRound && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Round Name</p>
                        <p className="text-base font-semibold text-foreground">{activeRound.roundName}</p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-chart-3">{activeRound.status}</p>
                      <div className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-xs font-medium text-chart-2">
                        {activeRound.claimStatus === 'Claimed' ? (
                          <CircleCheck className="size-4 text-destructive" />
                        ) : (
                          <WalletCards className="size-4" />
                        )}
                        <span>{activeRound.claimStatus}</span>
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Monthly Amount:</p>
                        <p className="font-medium text-foreground">
                          {formatMoney(activeRound.currency, activeRound.monthlyAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">No. of Claims</p>
                        <p className="font-medium text-foreground">{activeRound.numberOfClaims}</p>
                      </div>
  
                      <div>
                        <p className="text-muted-foreground">Claimed</p>
                        <p className="font-medium text-foreground">
                          {formatMoney(activeRound.currency, activeRound.claimedAmount)}/
                          {formatMoney(activeRound.currency, activeRound.totalValue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Claim Amount per Claim</p>
                        <p className="font-medium text-foreground">
                          {formatMoney(activeRound.currency, activeRound.claimAmountPerClaim)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pending Amount to Claim</p>
                        <p className="font-medium text-foreground">
                          {formatMoney(activeRound.currency, activeRound.pendingClaimAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-muted">
                        <div
                          className="h-1 rounded-full bg-primary"
                          style={{ width: `${(activeRound.progress / Math.max(activeRound.duration, 1)) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {String(activeRound.progress).padStart(2, '0')}/{activeRound.duration}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">Start Month:</p>
                        <p className="font-medium text-foreground">{formatMonthLabel(activeRound.startMonth)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">End Month:</p>
                        <p className="font-medium text-foreground">{formatMonthLabel(activeRound.endMonth)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">Remaining Amount to Pay:</p>
                        <p className="font-medium text-foreground">{formatMoney(activeRound.currency, remainingAmountToPay)}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button type="button" className="h-10 w-full rounded-md text-sm">
                        Track Payments
                      </Button>
                      <Button type="button" className="h-10 w-full rounded-md text-sm">
                        Track Claims
                      </Button>
                      <Button type="button" variant="outline" className="h-9 w-full rounded-md text-sm">
                        View Round History
                      </Button>
                    </div>
                  </div>
                )}

                {activeRound && (
                  <Button
                    size="lg"
                    className="mt-5 h-10 w-full rounded-md text-base"
                    onClick={() => setShowNewRoundDrawer(true)}
                  >
                    New Round
                  </Button>
                )}
              </>
            )}

            {activeTab === 'account' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Account</h2>
                <p className="text-sm text-muted-foreground">{session?.user.email}</p>
                {themeToggle}
                <Button variant="outline" className="h-10" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-border px-5 py-5">
            <nav className="rounded-2xl border border-border bg-card p-1.5">
              <ul className="grid grid-cols-3">
                {([
                  ['home', House, 'Home'],
                  ['kuries', Layers3, 'Kuries'],
                  ['account', UserCircle2, 'Account'],
                ] as const).map(([tabId, Icon, label]) => (
                  <li key={tabId}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(tabId)
                        if (tabId !== 'kuries') setKuriView('list')
                      }}
                      className={cn(
                        'flex w-full flex-col items-center gap-1 rounded-xl py-2',
                        activeTab === tabId ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
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

          <Drawer open={showAddKuri} onOpenChange={setShowAddKuri}>
            <DrawerContent className="border-border bg-card">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  Add Kuri
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Create a new Kuri to track
                </DrawerDescription>
              </DrawerHeader>
              <form className="space-y-4 px-4 pb-4" onSubmit={submitKuri}>
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
                <div className="flex gap-2">
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

          <Drawer open={showNewRoundDrawer} onOpenChange={setShowNewRoundDrawer}>
            <DrawerContent className="border-border bg-card">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-2xl leading-8 font-semibold tracking-[-0.6px] text-foreground">
                  New Round
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground">
                  Add round details for this kuri
                </DrawerDescription>
              </DrawerHeader>
              <form className="space-y-4 px-4 pb-4" onSubmit={submitRound}>
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
                    onChange={(e) => setRoundCurrency(e.target.value as 'INR' | 'SGD' | 'DHR')}
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
                <div className="flex gap-2">
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
        </section>
      )}
    </main>
  )
}

export default App
