import { useAuth } from '@/contexts/AuthContext';
import { getClans, getClanMemberships, deleteClan } from '@/lib/supabaseData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { Shield, Users, Loader2, MapPin, Settings, Upload, ImageIcon, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import AdminCheckinHistory from '@/components/AdminCheckinHistory';
import { getAvatarEconomySettings, updateAvatarEconomySettings, type AvatarEconomySettings } from '@/lib/avatar-economy';
import { type TvLayoutModel, type TvRightTopBlockMode } from '@/lib/tv-layout';

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'athlete' | 'coach' | 'admin';
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

const normalizeApprovalStatus = (value: unknown): UserItem['approvalStatus'] => {
  if (value === 'approved' || value === 'rejected' || value === 'pending') return value;
  return 'pending';
};

const normalizeUsers = (items: any[]): UserItem[] =>
  items.map((item) => ({
    ...item,
    approvalStatus: normalizeApprovalStatus(item.approvalStatus ?? item.approval_status),
  }));

const Admin = () => {
  const { user, getAllUsers, setUserRole, setUserApprovalStatus } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then((data) => {
      setUsers(normalizeUsers(data as any[]));
      setLoading(false);
    });
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Acesso restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: 'athlete' | 'coach' | 'admin') => {
    await setUserRole(userId, newRole);
    const updated = await getAllUsers();
    setUsers(normalizeUsers(updated as any[]));
    const roleLabels: Record<string, string> = { athlete: 'Atleta', coach: 'Professor', admin: 'Admin' };
    toast({
      title: 'Papel atualizado!',
      description: `Usuário agora é ${roleLabels[newRole]}`,
    });
  };

  const handleApprovalChange = async (userId: string, status: 'pending' | 'approved' | 'rejected') => {
    await setUserApprovalStatus(userId, status);
    const updated = await getAllUsers();
    setUsers(normalizeUsers(updated as any[]));
    const statusLabels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    };
    toast({
      title: 'Status de aprovação atualizado!',
      description: `Usuário agora está como ${statusLabels[status]}`,
    });
  };

  const roleColor = (role: string) => {
    if (role === 'admin') return 'destructive' as const;
    if (role === 'coach') return 'default' as const;
    return 'secondary' as const;
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'coach') return 'Professor';
    return 'Atleta';
  };

  const approvalColor = (status: string) => {
    if (status === 'approved') return 'default' as const;
    if (status === 'rejected') return 'destructive' as const;
    return 'secondary' as const;
  };

  const approvalBadgeClass = (status: string) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
    if (status === 'approved') return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
    return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
  };

  const approvalLabel = (status: string) => {
    if (status === 'approved') return 'Aprovado';
    if (status === 'rejected') return 'Rejeitado';
    return 'Pendente';
  };

  const pendingUsers = users.filter((u) => u.approvalStatus === 'pending' && u.role !== 'admin');
  const approvedUsers = users.filter((u) => u.approvalStatus === 'approved');
  const rejectedUsers = users.filter((u) => u.approvalStatus === 'rejected');
  const adminUsers = users.filter((u) => u.role === 'admin');
  const athleteUsers = users.filter((u) => u.role === 'athlete');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <Badge variant="secondary" className={approvalBadgeClass('pending')}>
          Pendências: {pendingUsers.length}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Box</CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Total Membros', value: users.length, icon: '👥' },
                { label: 'Atletas', value: athleteUsers.length, icon: '🏋️' },
                { label: 'Admins', value: adminUsers.length, icon: '🛡️' },
                { label: 'Aprovados', value: approvedUsers.length, icon: '✅' },
                { label: 'Pendentes', value: pendingUsers.length, icon: '⏳' },
                { label: 'Recusados', value: rejectedUsers.length, icon: '❌' },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">{m.icon}</span>
                    <p className="text-2xl font-bold mt-1">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 border-t pt-6">
            <CardTitle className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              Gerenciar Usuários ({users.length})
            </CardTitle>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{u.avatar || '👤'}</span>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                      <Badge variant={approvalColor(u.approvalStatus)} className={approvalBadgeClass(u.approvalStatus)}>
                        {approvalLabel(u.approvalStatus)}
                      </Badge>
                    </div>

                    {u.id !== user?.id && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={u.approvalStatus}
                          onValueChange={(value: 'pending' | 'approved' | 'rejected') => handleApprovalChange(u.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovar</SelectItem>
                            <SelectItem value="rejected">Rejeitar</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={u.role}
                          onValueChange={(value: 'athlete' | 'coach' | 'admin') => handleRoleChange(u.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="athlete">Atleta</SelectItem>
                            <SelectItem value="coach">Professor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <AdminCheckinHistory users={users} />

      <AvatarEconomySection />

      <BoxLogoSection />

      <BoxSettingsSection />

      <AdminTeamsSection />
    </div>
  );
};


// ---- Box Logo section ----
const BoxLogoSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (supabase as any)
      .from('training_locations')
      .select('id, name, logo_url')
      .eq('is_active', true)
      .limit(1)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          setLocation(data[0]);
          setLogoUrl(data[0].logo_url || null);
        }
        setLoading(false);
      });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !location) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem (JPG, PNG ou WebP).', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${location.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('box-logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from('box-logos').getPublicUrl(filePath);
    const newUrl = publicData.publicUrl + '?t=' + Date.now();

    const { error: updateError } = await (supabase as any)
      .from('training_locations')
      .update({ logo_url: newUrl })
      .eq('id', location.id);

    if (updateError) {
      toast({ title: 'Erro ao salvar URL', description: updateError.message, variant: 'destructive' });
    } else {
      setLogoUrl(newUrl);
      toast({ title: 'Logo atualizada!' });
    }
    setUploading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo do Box
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !location ? (
          <p className="text-sm text-muted-foreground">Nenhum local de treino cadastrado.</p>
        ) : (
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo do Box" className="h-16 w-16 rounded-lg object-contain border border-border" />
            ) : (
              <div className="h-16 w-16 rounded-lg border border-dashed border-muted-foreground/40 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">{location.name}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


const AvatarEconomySection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AvatarEconomySettings | null>(null);
  const [form, setForm] = useState({
    coins_per_checkin: 10,
    coins_per_challenge_completion: 20,
    coins_per_wod_completion: 15,
    coins_per_duel_participation: 10,
    coins_per_duel_win: 25,
    coins_per_pr: 30,
    level_up_bonus: 25,
    weekly_bonus_3: 30,
    weekly_bonus_4: 45,
    weekly_bonus_5: 60,
    weekly_bonus_6: 75,
    monthly_ranking_bonus: 100,
    special_event_bonus: 50,
    daily_mission_bonus: 20,
    milestone_bonus: 40,
    coins_per_checkin_enabled: true,
    coins_per_challenge_completion_enabled: true,
    coins_per_wod_completion_enabled: true,
    coins_per_duel_participation_enabled: true,
    coins_per_duel_win_enabled: true,
    coins_per_pr_enabled: true,
    level_up_bonus_enabled: true,
    weekly_bonus_3_enabled: true,
    weekly_bonus_4_enabled: true,
    weekly_bonus_5_enabled: true,
    weekly_bonus_6_enabled: true,
    monthly_ranking_bonus_enabled: true,
    special_event_bonus_enabled: true,
    daily_mission_bonus_enabled: true,
    milestone_bonus_enabled: true,
    is_active: true,
  });

  useEffect(() => {
    getAvatarEconomySettings().then((data) => {
      if (data) {
        setSettings(data);
        setForm({
          coins_per_checkin: data.coins_per_checkin,
          coins_per_challenge_completion: data.coins_per_challenge_completion,
          coins_per_wod_completion: data.coins_per_wod_completion,
          coins_per_duel_participation: data.coins_per_duel_participation,
          coins_per_duel_win: data.coins_per_duel_win,
          coins_per_pr: data.coins_per_pr,
          level_up_bonus: data.level_up_bonus,
          weekly_bonus_3: data.weekly_bonus_3,
          weekly_bonus_4: data.weekly_bonus_4,
          weekly_bonus_5: data.weekly_bonus_5,
          weekly_bonus_6: data.weekly_bonus_6,
          monthly_ranking_bonus: data.monthly_ranking_bonus,
          special_event_bonus: data.special_event_bonus,
          daily_mission_bonus: data.daily_mission_bonus,
          milestone_bonus: data.milestone_bonus,
          coins_per_checkin_enabled: data.coins_per_checkin_enabled,
          coins_per_challenge_completion_enabled: data.coins_per_challenge_completion_enabled,
          coins_per_wod_completion_enabled: data.coins_per_wod_completion_enabled,
          coins_per_duel_participation_enabled: data.coins_per_duel_participation_enabled,
          coins_per_duel_win_enabled: data.coins_per_duel_win_enabled,
          coins_per_pr_enabled: data.coins_per_pr_enabled,
          level_up_bonus_enabled: data.level_up_bonus_enabled,
          weekly_bonus_3_enabled: data.weekly_bonus_3_enabled,
          weekly_bonus_4_enabled: data.weekly_bonus_4_enabled,
          weekly_bonus_5_enabled: data.weekly_bonus_5_enabled,
          weekly_bonus_6_enabled: data.weekly_bonus_6_enabled,
          monthly_ranking_bonus_enabled: data.monthly_ranking_bonus_enabled,
          special_event_bonus_enabled: data.special_event_bonus_enabled,
          daily_mission_bonus_enabled: data.daily_mission_bonus_enabled,
          milestone_bonus_enabled: data.milestone_bonus_enabled,
          is_active: data.is_active,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);

    const { data, error } = await updateAvatarEconomySettings(settings?.id || null, {
      ...form,
    });

    if (error) {
      toast({
        title: 'Erro ao salvar economia do avatar',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setSettings(data);
      toast({
        title: 'Economia do Avatar salva!',
      });
    }

    setSaving(false);
  };

  const renderRuleInput = (label: string, valueKey: keyof typeof form, enabledKey: keyof typeof form) => (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
      <div>
        <label className="text-sm font-medium">{label}</label>
        <Input
          type="number"
          value={Number(form[valueKey]) || 0}
          onChange={(e) => setForm({ ...form, [valueKey]: parseInt(e.target.value) || 0 })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium pb-2">
        <input
          type="checkbox"
          checked={Boolean(form[enabledKey])}
          onChange={(e) => setForm({ ...form, [enabledKey]: e.target.checked })}
        />
        Ativo
      </label>
    </div>
  );

  const handleResetDefaults = () => {
    setForm({
      coins_per_checkin: 10,
      coins_per_challenge_completion: 20,
      coins_per_wod_completion: 15,
      coins_per_duel_participation: 10,
      coins_per_duel_win: 25,
      coins_per_pr: 30,
      level_up_bonus: 25,
      weekly_bonus_3: 30,
      weekly_bonus_4: 45,
      weekly_bonus_5: 60,
      weekly_bonus_6: 75,
      monthly_ranking_bonus: 100,
      special_event_bonus: 50,
      daily_mission_bonus: 20,
      milestone_bonus: 40,
      coins_per_checkin_enabled: true,
      coins_per_challenge_completion_enabled: true,
      coins_per_wod_completion_enabled: true,
      coins_per_duel_participation_enabled: true,
      coins_per_duel_win_enabled: true,
      coins_per_pr_enabled: true,
      level_up_bonus_enabled: true,
      weekly_bonus_3_enabled: true,
      weekly_bonus_4_enabled: true,
      weekly_bonus_5_enabled: true,
      weekly_bonus_6_enabled: true,
      monthly_ranking_bonus_enabled: true,
      special_event_bonus_enabled: true,
      daily_mission_bonus_enabled: true,
      milestone_bonus_enabled: true,
      is_active: true,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Economia do Avatar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="avatar-economy" className="border rounded-md px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ChevronDown className="h-4 w-4" />
                  Configurar Economia do Avatar
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Ganhos por ação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {renderRuleInput('BrazaCoin por check-in', 'coins_per_checkin', 'coins_per_checkin_enabled')}
                      {renderRuleInput('BrazaCoin por concluir desafio', 'coins_per_challenge_completion', 'coins_per_challenge_completion_enabled')}
                      {renderRuleInput('BrazaCoin por registrar WOD', 'coins_per_wod_completion', 'coins_per_wod_completion_enabled')}
                      {renderRuleInput('BrazaCoin por participar de duelo', 'coins_per_duel_participation', 'coins_per_duel_participation_enabled')}
                      {renderRuleInput('BrazaCoin por vencer duelo', 'coins_per_duel_win', 'coins_per_duel_win_enabled')}
                      {renderRuleInput('BrazaCoin por bater PR', 'coins_per_pr', 'coins_per_pr_enabled')}
                      {renderRuleInput('Bônus por level up', 'level_up_bonus', 'level_up_bonus_enabled')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Bônus de consistência</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {renderRuleInput('Bônus semanal 3x', 'weekly_bonus_3', 'weekly_bonus_3_enabled')}
                      {renderRuleInput('Bônus semanal 4x', 'weekly_bonus_4', 'weekly_bonus_4_enabled')}
                      {renderRuleInput('Bônus semanal 5x', 'weekly_bonus_5', 'weekly_bonus_5_enabled')}
                      {renderRuleInput('Bônus semanal 6x', 'weekly_bonus_6', 'weekly_bonus_6_enabled')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Bônus especiais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {renderRuleInput('Bônus por ranking mensal', 'monthly_ranking_bonus', 'monthly_ranking_bonus_enabled')}
                      {renderRuleInput('Bônus por evento especial', 'special_event_bonus', 'special_event_bonus_enabled')}
                      {renderRuleInput('Bônus por missões diárias', 'daily_mission_bonus', 'daily_mission_bonus_enabled')}
                      {renderRuleInput('Bônus por marcos/conquistas', 'milestone_bonus', 'milestone_bonus_enabled')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Controle geral</h4>
                    <div className="flex flex-wrap gap-4 items-center">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        />
                        Configuração ativa
                      </label>
                      <Button type="button" variant="outline" onClick={handleResetDefaults}>
                        Restaurar padrão
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

// ---- Box Settings section ----
const BoxSettingsSection = () => {
  const { toast } = useToast();
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    radius_meters: 100,
    latitude: 0,
    longitude: 0,
    tv_layout_model: 'old' as TvLayoutModel,
    tv_right_top_block_mode: 'checkins' as TvRightTopBlockMode,
  });

  useEffect(() => {
    (supabase as any)
      .from('training_locations')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .then(({ data }: any) => {
        if (data && data.length > 0) {
          const loc = data[0];
          setLocation(loc);
          setForm({
            name: loc.name,
            radius_meters: loc.radius_meters,
            latitude: loc.latitude,
            longitude: loc.longitude,
            tv_layout_model: loc.tv_layout_model === 'new' ? 'new' : 'old',
            tv_right_top_block_mode: loc.tv_right_top_block_mode === 'avatar' || loc.tv_right_top_block_mode === 'avatars' ? 'avatar' : 'checkins',
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!location) return;
    const { error } = await (supabase as any)
      .from('training_locations')
      .update({
        name: form.name,
        radius_meters: form.radius_meters,
        latitude: form.latitude,
        longitude: form.longitude,
        tv_layout_model: form.tv_layout_model,
        tv_right_top_block_mode: form.tv_right_top_block_mode,
      })
      .eq('id', location.id);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      setLocation({ ...location, ...form });
      setEditing(false);
      toast({ title: 'Configurações salvas!' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações do Box
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !location ? (
          <p className="text-sm text-muted-foreground">Nenhum local de treino cadastrado.</p>
        ) : editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nome do local</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Raio permitido (metros)</label>
              <Input type="number" value={form.radius_meters} onChange={(e) => setForm({ ...form, radius_meters: parseInt(e.target.value) || 100 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Modelo TV</label>
              <Select
                value={form.tv_layout_model}
                onValueChange={(value: TvLayoutModel) => setForm({ ...form, tv_layout_model: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="old">Antigo</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Bloco direito superior da TV</label>
              <Select
                value={form.tv_right_top_block_mode}
                onValueChange={(value: TvRightTopBlockMode) => setForm({ ...form, tv_right_top_block_mode: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkins">Check-ins</SelectItem>
                  <SelectItem value="avatar">Avatar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Salvar</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{location.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Coordenadas: {location.latitude}, {location.longitude}
            </p>
            <p className="text-sm text-muted-foreground">
              Raio de check-in: {location.radius_meters}m
            </p>
            <p className="text-sm text-muted-foreground">
              Modelo TV: {location.tv_layout_model === 'new' ? 'Novo' : 'Antigo'}
            </p>
            <p className="text-sm text-muted-foreground">
              Bloco direito superior da TV: {location.tv_right_top_block_mode === 'avatar' || location.tv_right_top_block_mode === 'avatars' ? 'Avatar' : 'Check-ins'}
            </p>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Editar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ---- Admin Teams Management ----
const AdminTeamsSection = () => {
  const { toast } = useToast();
  const [clans, setClans] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Promise.all([getClans(), getClanMemberships()]).then(([c, m]) => {
      setClans(c);
      setMemberships(m);
      setLoading(false);
    });
  }, [tick]);

  const memberCount = (clanId: string) =>
    Object.values(memberships).filter((v) => v === clanId).length;

  const handleDelete = async (clan: any) => {
    if (!window.confirm(`Excluir o time "${clan.name}"? Todos os membros serão removidos.`)) return;
    try {
      await deleteClan(clan.id);
      toast({ title: 'Time excluído', description: `${clan.name} foi removido.` });
      setTick((v) => v + 1);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Gerenciar Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : clans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum time criado.</p>
        ) : (
          clans.map((clan) => (
            <div key={clan.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-semibold">{clan.banner} {clan.name}</p>
                <p className="text-xs text-muted-foreground">{memberCount(clan.id)} membros</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(clan)}>
                Excluir
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Admin;
