import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Shield, Users } from 'lucide-react';

const Admin = () => {
  const { user, getAllUsers, setUserRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState(getAllUsers());

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Acesso restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const handleRoleChange = (userId: string, newRole: 'athlete' | 'coach' | 'admin') => {
    setUserRole(userId, newRole);
    setUsers(getAllUsers());
    const roleLabels: Record<string, string> = { athlete: 'Atleta', coach: 'Professor', admin: 'Admin' };
    toast({
      title: 'Papel atualizado!',
      description: `Usuário agora é ${roleLabels[newRole]}`,
    });
  };

  const roleColor = (role: string) => {
    if (role === 'admin') return 'destructive';
    if (role === 'coach') return 'default';
    return 'secondary';
  };

  const roleLabel = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'coach') return 'Professor';
    return 'Atleta';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Usuários ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((u: any) => (
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
                </div>

                {u.id !== user.id && (
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
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
