import { useAuth } from '@/contexts/AuthContext';
import { getClans, getClanMemberships, deleteClan } from '@/lib/supabaseData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { Shield, Users, Loader2, MapPin, Settings, Upload, ImageIcon, ChevronDown, Clock, CheckCircle2, Plus, Trash2 } from 'lucide-react';
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
    <div className="space-y-6 pb-10">
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
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={['pending-tasks']} className="space-y-4">
        {/* 1. Tarefas Pendentes */}
        <AccordionItem value="pending-tasks" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">Tarefas Pendentes</span>
              {pendingUsers.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {pendingUsers.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AdminCheckinHistory users={users} />
          </AccordionContent>
        </AccordionItem>

        {/* 2. Controle de Usuários */}
        <AccordionItem value="users-control" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="font-bold">Controle de Usuários</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-2xl shrink-0">{u.avatar || '👤'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{u.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        <div className="flex flex-wrap gap-2 mt-1 sm:hidden">
                          <Badge variant={roleColor(u.role)} className="text-[10px]">{roleLabel(u.role)}</Badge>
                          <Badge variant={approvalColor(u.approvalStatus)} className={`${approvalBadgeClass(u.approvalStatus)} text-[10px]`}>
                            {approvalLabel(u.approvalStatus)}
                          </Badge>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <Badge variant={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                        <Badge variant={approvalColor(u.approvalStatus)} className={approvalBadgeClass(u.approvalStatus)}>
                          {approvalLabel(u.approvalStatus)}
                        </Badge>
                      </div>
                    </div>

                    {u.id !== user?.id && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                          <Select
                            value={u.approvalStatus}
                            onValueChange={(value: 'pending' | 'approved' | 'rejected') => handleApprovalChange(u.id, value)}
                          >
                            <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
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
                            <SelectTrigger className="w-full sm:w-[130px] h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="athlete">Atleta</SelectItem>
                              <SelectItem value="coach">Professor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 3. Controle de Times */}
        <AccordionItem value="teams-control" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="font-bold">Controle de Times</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AdminTeamsSection />
          </AccordionContent>
        </AccordionItem>

        {/* 4. Horários das Aulas */}
        <AccordionItem value="class-schedule" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="font-bold">Horários das Aulas</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
             <ClassScheduleSection />
          </AccordionContent>
        </AccordionItem>

        {/* 5. Configurações do Box */}
        <AccordionItem value="box-settings" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <span className="font-bold">Configurações do Box</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <BoxLogoSection />
            <BoxSettingsSection />
          </AccordionContent>
        </AccordionItem>

        {/* 6. Economia do Avatar */}
        <AccordionItem value="avatar-economy-control" className="border rounded-lg bg-card overflow-hidden">
          <AccordionTrigger className="px-4 hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-500" />
              <span className="font-bold">Economia do Avatar</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AvatarEconomySection />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// ---- Class Schedule Section ----
const ClassScheduleSection = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ start_time: '08:00', end_time: '09:00', label: '' });

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('class_schedules')
      .select('*')
      .order('start_time', { ascending: true });
    
    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAdd = async () => {
    if (!newSchedule.start_time || !newSchedule.end_time) return;
    
    const { error } = await (supabase as any)
      .from('class_schedules')
      .insert([{
        start_time: newSchedule.start_time + ':00',
        end_time: newSchedule.end_time + ':00',
        label: newSchedule.label || null,
        is_active: true
      }]);

    if (error) {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Horário adicionado!' });
      setIsAdding(false);
      setNewSchedule({ start_time: '08:00', end_time: '09:00', label: '' });
      fetchSchedules();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este horário?')) return;
    
    const { error } = await supabase
      .from('class_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Horário removido.' });
      fetchSchedules();
    }
  };

  return (
    <div className="p-4 border rounded-md bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Gestão de Horários</h3>
            <p className="text-xs text-muted-foreground">Configure os horários das aulas.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancelar' : <><Plus className="h-4 w-4 mr-1" /> Novo</>}
        </Button>
      </div>

      {isAdding && (
        <div className="mb-4 p-3 border rounded-md bg-card space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Início</label>
              <Input type="time" value={newSchedule.start_time} onChange={e => setNewSchedule({...newSchedule, start_time: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Fim</label>
              <Input type="time" value={newSchedule.end_time} onChange={e => setNewSchedule({...newSchedule, end_time: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Rótulo (opcional)</label>
            <Input placeholder="Ex: Aula Noite" value={newSchedule.label} onChange={e => setNewSchedule({...newSchedule, label: e.target.value})} />
          </div>
          <Button className="w-full" onClick={handleAdd}>Salvar Horário</Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : schedules.length === 0 ? (
        <p className="text-center py-4 text-sm text-muted-foreground italic">Nenhum horário cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {schedules.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono">{item.start_time.substring(0,5)} - {item.end_time.substring(0,5)}</Badge>
                <span className="font-medium">{item.label || 'Aula'}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
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

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `box-logos/${location.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('training_locations')
        .update({ logo_url: publicUrl })
        .eq('id', location.id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast({ title: 'Logo atualizada!' });
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!location) return null;

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex items-center gap-3">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Logo do Box</h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Alterar Logo'}
          </Button>
          <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG, fundo transparente.</p>
        </div>
      </div>
    </div>
  );
};

// ---- Avatar Economy Section ----
const AvatarEconomySection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AvatarEconomySettings | null>(null);

  useEffect(() => {
    getAvatarEconomySettings().then((data) => {
      setForm(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { id, rule_labels, rule_notes, created_at, ...payload } = form;
      await updateAvatarEconomySettings(id, payload);
      toast({ title: 'Configurações salvas!' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const renderRuleInput = (label: string, field: keyof AvatarEconomySettings, enabledField: keyof AvatarEconomySettings) => {
    if (!form) return null;
    return (
      <div className="flex items-center justify-between gap-4 p-2 rounded-md border bg-muted/30">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form[enabledField]}
            onChange={(e) => setForm({ ...form, [enabledField]: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Input
          type="number"
          value={form[field] as number}
          onChange={(e) => setForm({ ...form, [field]: parseInt(e.target.value) || 0 })}
          className="w-20 h-8 text-right"
          disabled={!form[enabledField]}
        />
      </div>
    );
  };

  const handleResetDefaults = () => {
    if (!form) return;
    setForm({
      ...form,
      coins_per_checkin: 10,
      coins_per_challenge_completion: 50,
      coins_per_wod_completion: 20,
      coins_per_duel_participation: 15,
      coins_per_duel_win: 30,
      coins_per_pr: 25,
      level_up_bonus: 100,
      weekly_bonus_3: 30,
      weekly_bonus_4: 50,
      weekly_bonus_5: 80,
      weekly_bonus_6: 120,
      monthly_ranking_bonus: 500,
      special_event_bonus: 200,
      daily_mission_bonus: 10,
      milestone_bonus: 150,
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
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Ganhos por ação</h4>
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
            <h4 className="font-semibold text-sm">Bônus de consistência</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderRuleInput('Bônus semanal 3x', 'weekly_bonus_3', 'weekly_bonus_3_enabled')}
              {renderRuleInput('Bônus semanal 4x', 'weekly_bonus_4', 'weekly_bonus_4_enabled')}
              {renderRuleInput('Bônus semanal 5x', 'weekly_bonus_5', 'weekly_bonus_5_enabled')}
              {renderRuleInput('Bônus semanal 6x', 'weekly_bonus_6', 'weekly_bonus_6_enabled')}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Controle geral</h4>
            <div className="flex flex-wrap gap-4 items-center justify-between bg-muted/20 p-4 rounded-lg">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form?.is_active}
                  onChange={(e) => form && setForm({ ...form, is_active: e.target.checked })}
                />
                Configuração ativa
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleResetDefaults}>
                  Restaurar padrão
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
    <div className="p-4 border rounded-md">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Localização e TV</h3>
      </div>
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
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Editar Localização</Button>
        </div>
      )}
    </div>
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
    <div className="space-y-3">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : clans.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum time criado.</p>
      ) : (
        clans.map((clan) => (
          <div key={clan.id} className="flex items-center justify-between rounded-lg border p-3 bg-card">
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
    </div>
  );
};

export default Admin;
