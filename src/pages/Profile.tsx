import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { avatarEmojis } from '@/lib/mockData';
import { CalendarCheck, ChevronLeft, ChevronRight, Award, Palette, Edit2, Check, X, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserBadges, categoryLabels, categoryIcons, type Badge } from '@/lib/badges';
import AchievementCard from '@/components/AchievementCard';
import CheckinMonthlyHistory from '@/components/CheckinMonthlyHistory';
import { THEME_PRESETS, applyTheme } from '@/components/Layout';
import UserAvatar from '@/components/UserAvatar';

const PROFILE_PHOTO_BUCKET = 'profile-photos';
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    gender: user?.gender || 'male' as 'male' | 'female',
    category: user?.category || 'beginner' as 'rx' | 'scaled' | 'beginner',
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    setSelectedAvatar(user?.avatar);
    setEditData({
      name: user?.name || '',
      gender: user?.gender || 'male',
      category: user?.category || 'beginner',
    });
  }, [user]);

  const myCheckins = useMemo(() => {
    const checkins: Record<string, string[]> = JSON.parse(localStorage.getItem('crosscity_checkins') || '{}');
    return user ? new Set(checkins[user.id] || []) : new Set<string>();
  }, [user]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    const days: { day: number; dateKey: string; isPresent: boolean; isToday: boolean; isPast: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateKey, isPresent: myCheckins.has(dateKey), isToday: dateKey === today, isPast: dateKey < today });
    }
    return { days, firstDay, daysInMonth };
  }, [calendarMonth, myCheckins]);

  const monthLabel = calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthCheckinCount = calendarDays.days.filter((d) => d.isPresent).length;

  const badgeResults = useMemo(() => user ? getUserBadges(user.id) : [], [user]);
  const categories: Badge['category'][] = ['consistency', 'performance', 'social', 'exploration'];
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const getStoragePath = (fileName: string) => `${user?.id}/${fileName}`;

  const buildPublicUrl = (path: string) => supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;

  const handleSaveAvatar = () => {
    if (selectedAvatar) {
      updateUser({ avatar: selectedAvatar });
      toast({ title: 'Avatar atualizado!' });
    }
  };

  const handleSaveProfile = () => {
    updateUser(editData);
    setIsEditing(false);
    toast({ title: 'Perfil atualizado!' });
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!user || !file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Use uma imagem JPG, PNG ou WEBP.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Imagem muito grande',
        description: 'Escolha uma imagem com até 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = getStoragePath(`avatar-${Date.now()}.${extension}`);

    try {
      if (user.avatarUrl) {
        const previousPath = user.avatarUrl.split(`/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/`)[1];
        if (previousPath) {
          await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([previousPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from(PROFILE_PHOTO_BUCKET)
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      await updateUser({ avatarUrl: buildPublicUrl(filePath) });
      toast({ title: 'Foto de perfil atualizada!' });
    } catch (error) {
      console.error('Erro ao enviar foto de perfil:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível atualizar a foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.avatarUrl) return;

    setIsUploadingPhoto(true);
    try {
      const existingPath = user.avatarUrl.split(`/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/`)[1];
      if (existingPath) {
        await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([existingPath]);
      }

      await updateUser({ avatarUrl: null });
      toast({ title: 'Foto removida com sucesso.' });
    } catch (error) {
      console.error('Erro ao remover foto de perfil:', error);
      toast({
        title: 'Erro ao remover foto',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const prevMonth = () => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Perfil</h1>

      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Informações</CardTitle>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" /> Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm" onClick={handleSaveProfile}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-primary/10 bg-muted/20 p-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={user?.name} avatar={user?.avatar} avatarUrl={user?.avatarUrl} className="h-20 w-20" fallbackClassName="text-2xl" />
              <div>
                <p className="text-lg font-semibold">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.avatarUrl ? 'Foto de perfil ativa' : 'Sem foto, usando avatar padrão.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Label htmlFor="profile-photo" className="inline-flex">
                <Button type="button" variant="outline" className="gap-2" disabled={isUploadingPhoto} asChild>
                  <span>
                    <Upload className="h-4 w-4" /> {user?.avatarUrl ? 'Trocar foto' : 'Enviar foto'}
                  </span>
                </Button>
              </Label>
              <Input id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
              <Button type="button" variant="ghost" className="gap-2" onClick={handleRemovePhoto} disabled={!user?.avatarUrl || isUploadingPhoto}>
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            </div>
          </div>

          {!isEditing ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-xl font-semibold">{user?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-xl font-semibold truncate">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gênero</p>
                  <p className="text-xl font-semibold capitalize">{user?.gender === 'male' ? 'Masculino' : 'Feminino'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <p className="text-xl font-semibold uppercase">{user?.category}</p>
              </div>
            </>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select
                    value={editData.gender}
                    onValueChange={(value: 'male' | 'female') => setEditData({ ...editData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editData.category}
                    onValueChange={(value: 'rx' | 'scaled' | 'beginner') => setEditData({ ...editData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rx">RX</SelectItem>
                      <SelectItem value="scaled">Scaled</SelectItem>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground">Nível</p>
              <p className="text-2xl font-bold text-primary">{user?.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">XP Total</p>
              <p className="text-2xl font-bold text-secondary">{user?.xp}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sequência</p>
              <p className="text-2xl font-bold text-primary">{user?.streak} dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Presenças — {monthCheckinCount} check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></Button>
            <span className="font-semibold capitalize">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-5 w-5" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarDays.firstDay }).map((_, i) => (<div key={`empty-${i}`} />))}
            {calendarDays.days.map((d) => (
              <div key={d.dateKey} className={`aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors ${d.isPresent ? 'bg-green-500/20 text-green-400 border border-green-500/40' : d.isPast ? 'bg-muted/30 text-muted-foreground' : 'text-foreground/60'} ${d.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}>
                {d.day}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />Presente</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-muted/30" />Ausente</div>
          </div>
        </CardContent>
      </Card>

      <CheckinMonthlyHistory dates={Array.from(myCheckins)} />

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-secondary" />
            Conquistas ({badgeResults.filter(b => b.unlocked).length}/{badgeResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map(cat => {
            const catBadges = badgeResults.filter(b => b.badge.category === cat);
            const unlockedCount = catBadges.filter(b => b.unlocked).length;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{categoryIcons[cat]}</span>
                  <h3 className="font-semibold text-sm">{categoryLabels[cat]}</h3>
                  <span className="text-xs text-muted-foreground ml-auto">{unlockedCount}/{catBadges.length}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {catBadges.map(({ badge, unlocked }) => (
                    <button
                      key={badge.id}
                      onClick={() => unlocked && setSelectedBadge(badge)}
                      className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all ${
                        unlocked ? 'border-primary/40 bg-primary/10 cursor-pointer hover:scale-105 active:scale-95' : 'border-border opacity-40 grayscale cursor-default'
                      }`}
                    >
                      <span className="text-3xl">{badge.icon}</span>
                      <span className="text-xs font-semibold mt-1 leading-tight">{badge.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</span>
                      {unlocked && <span className="text-[9px] text-primary mt-1">Toque para compartilhar</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(THEME_PRESETS).map(([id, theme]) => {
              const savedTheme = localStorage.getItem(`crosscity_theme_${user?.id}`) || 'blue';
              const isActive = savedTheme === id;
              const label = { blue: 'Azul', green: 'Verde', purple: 'Roxo', orange: 'Laranja' }[id] || id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (user) {
                      localStorage.setItem(`crosscity_theme_${user.id}`, id);
                      applyTheme(id);
                    }
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    isActive ? 'border-primary bg-primary/10 scale-105' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: `hsl(${theme.primary})` }}
                  />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader><CardTitle>Personalizar Avatar</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">A foto de perfil aparece primeiro. Sem foto, o app usa o avatar atual ou a inicial do nome.</p>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {avatarEmojis.map((emoji) => (
              <button key={emoji} onClick={() => setSelectedAvatar(emoji)} className={`text-6xl p-4 rounded-lg border-2 transition-all hover:scale-110 ${selectedAvatar === emoji ? 'border-primary bg-primary/10' : 'border-border'}`}>
                {emoji}
              </button>
            ))}
          </div>
          <Button onClick={handleSaveAvatar} className="w-full">Salvar Avatar</Button>
        </CardContent>
      </Card>
      {selectedBadge && user && (
        <AchievementCard
          badge={selectedBadge}
          userName={user.name}
          userLevel={user.level}
          open={!!selectedBadge}
          onOpenChange={(open) => !open && setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

export default Profile;
