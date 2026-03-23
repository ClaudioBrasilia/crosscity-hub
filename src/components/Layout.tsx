import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Home, Trophy, Dumbbell, User, LogOut, Building2, BarChart3, Swords, Warehouse, MoreHorizontal, Users, Flame, GraduationCap, Shield, Map } from 'lucide-react';
import OnboardingTour from '@/components/OnboardingTour';
import GoalsQuestionnaire from '@/components/GoalsQuestionnaire';

const THEME_PRESETS: Record<string, { primary: string; secondary: string; accent: string; ring: string }> = {
  blue: { primary: '217 91% 60%', secondary: '199 89% 48%', accent: '217 91% 60%', ring: '217 91% 60%' },
  green: { primary: '142 76% 46%', secondary: '160 84% 39%', accent: '142 76% 46%', ring: '142 76% 46%' },
  purple: { primary: '270 70% 60%', secondary: '280 65% 50%', accent: '270 70% 60%', ring: '270 70% 60%' },
  orange: { primary: '25 95% 53%', secondary: '35 92% 50%', accent: '25 95% 53%', ring: '25 95% 53%' },
};

const applyTheme = (themeId: string) => {
  const theme = THEME_PRESETS[themeId];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--ring', theme.ring);
  root.style.setProperty('--sidebar-primary', theme.primary);
  root.style.setProperty('--sidebar-ring', theme.ring);
};

export { THEME_PRESETS, applyTheme };

const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  useEffect(() => {
    // Apply saved theme
    if (user) {
      const savedTheme = localStorage.getItem(`crosscity_theme_${user.id}`) || 'blue';
      applyTheme(savedTheme);

      // Check onboarding
      const onboardingStatus = localStorage.getItem(`crosscity_onboarding_${user.id}`);
      if (onboardingStatus === 'pending') {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (user) {
      localStorage.setItem(`crosscity_onboarding_${user.id}`, 'done');
      // Show goals if not set yet
      const goals = localStorage.getItem(`crosscity_goals_${user.id}`);
      if (!goals) {
        setShowGoals(true);
      }
    }
  };

  const handleGoalsComplete = () => {
    setShowGoals(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const primaryNavItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Dumbbell, label: 'WOD', path: '/wod' },
    { icon: Swords, label: 'Duelos', path: '/battle' },
    { icon: Trophy, label: 'Ranking', path: '/leaderboard' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  const secondaryNavItems = [
    { icon: Users, label: 'Feed', path: '/feed' },
    { icon: BarChart3, label: 'Benchmarks', path: '/benchmarks' },
    { icon: Flame, label: 'Desafios', path: '/challenges' },
    { icon: Map, label: 'Times', path: '/clans' }, { icon: Warehouse, label: 'Meu Box', path: '/mybox' },
    { icon: Building2, label: 'Boxes', path: '/boxes' },
    ...(user?.role === 'coach' || user?.role === 'admin' ? [{ icon: GraduationCap, label: 'Painel do Coach', path: '/coach' }] : []),
    ...(user?.role === 'admin' ? [{ icon: Shield, label: 'Administração', path: '/admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="text-2xl">🏋️</span>
              <div>
                <h1 className="text-lg font-bold gradient-primary bg-clip-text text-transparent leading-none">BoxLink</h1>
                <p className="text-[10px] text-muted-foreground">CrossUberlandia</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-primary/30 px-2 py-1">
                <span className="text-lg">{user?.avatar}</span>
                <p className="text-xs font-medium hidden sm:block">Nível {user?.level}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                        <Icon className="h-4 w-4 mr-2" /> {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-5">
        <main className="flex-1">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-background/95 backdrop-blur">
        <div className="container mx-auto">
          <div className="grid grid-cols-5">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center py-2 gap-1 text-[11px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Onboarding Tour */}
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}

      {/* Goals Questionnaire */}
      {showGoals && user && <GoalsQuestionnaire userId={user.id} onComplete={handleGoalsComplete} />}
    </div>
  );
};

export default Layout;
