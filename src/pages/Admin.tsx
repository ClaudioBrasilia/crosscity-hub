import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Shield, Users, Loader2, Link, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminCheckinHistory from '@/components/AdminCheckinHistory';

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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Usuários ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      <AdminCheckinHistory users={users} />

      <InviteSection />
    </div>
  );
};

// ---- Invite section isolated ----
const InviteSection = () => {
  const { toast } = useToast();
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedToken(null);
    try {
      const { data, error } = await supabase.rpc('create_app_invite', { _expires_in_hours: 72 });
      if (error) throw error;
      setGeneratedToken(data as string);
      toast({ title: 'Convite gerado!', description: 'Copie o link e envie para o convidado.' });
    } catch (e: any) {
      toast({ title: 'Erro ao gerar convite', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const inviteUrl = generatedToken
    ? `${window.location.origin}/invite/${generatedToken}`
    : null;

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Convites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gere um link de convite único para um novo membro. O link expira em 72 horas e pode ser usado apenas uma vez.
        </p>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link className="h-4 w-4 mr-2" />}
          Gerar Convite
        </Button>

        {inviteUrl && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/50">
            <code className="text-xs flex-1 break-all">{inviteUrl}</code>
            <Button size="icon" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Admin;
