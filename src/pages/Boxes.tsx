import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users } from 'lucide-react';

interface Box {
  id: string;
  name: string;
  code: string;
  members: number;
  points: number;
}

interface BoxJoinRequest {
  id: string;
  user_id: string;
  created_at: string;
}

const Boxes = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [pendingRequests, setPendingRequests] = useState<BoxJoinRequest[]>([]);
  const [requestUserNames, setRequestUserNames] = useState<Record<string, string>>({});
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const loadBoxes = () => {
      const boxesData = localStorage.getItem('crosscity_boxes') || '[]';
      setBoxes(JSON.parse(boxesData));
    };
    loadBoxes();
  }, []);

  const generateBoxCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateBox = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBox: Box = {
      id: `box_${Date.now()}`,
      name: newBoxName,
      code: generateBoxCode(),
      members: 1,
      points: 0,
    };

    const updatedBoxes = [...boxes, newBox];
    localStorage.setItem('crosscity_boxes', JSON.stringify(updatedBoxes));
    setBoxes(updatedBoxes);
    
    if (user) {
      updateUser({ boxId: newBox.id });
    }

    toast({
      title: 'Box criado!',
      description: `Código de convite: ${newBox.code}`,
    });

    setShowCreateDialog(false);
    setNewBoxName('');
  };

  const handleJoinBox = (e: React.FormEvent) => {
    e.preventDefault();
    
    const box = boxes.find(b => b.code === joinCode.toUpperCase());
    
    if (!box) {
      toast({
        title: 'Erro',
        description: 'Código de convite inválido',
        variant: 'destructive',
      });
      return;
    }

    const updatedBoxes = boxes.map(b => 
      b.id === box.id ? { ...b, members: b.members + 1 } : b
    );
    localStorage.setItem('crosscity_boxes', JSON.stringify(updatedBoxes));
    setBoxes(updatedBoxes);

    if (user) {
      updateUser({ boxId: box.id });
    }

    toast({
      title: 'Sucesso!',
      description: `Você entrou no box ${box.name}`,
    });

    setShowJoinDialog(false);
    setJoinCode('');
  };

  const currentBox = boxes.find(b => b.id === user?.boxId);
  const isBoxAdmin = !!user && (user.role === 'admin' || user.role === 'coach') && !!currentBox;

  const loadPendingRequests = async (boxId: string) => {
    setIsLoadingRequests(true);
    const { data, error } = await supabase
      .from('box_join_requests' as any)
      .select('id, user_id, created_at')
      .eq('box_id', boxId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      setIsLoadingRequests(false);
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const requests = ((data as BoxJoinRequest[]) || []);
    setPendingRequests(requests);

    if (requests.length > 0) {
      const userIds = [...new Set(requests.map((item) => item.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const usersMap = (profilesData || []).reduce<Record<string, string>>((acc, profile) => {
        acc[profile.id] = profile.name;
        return acc;
      }, {});
      setRequestUserNames(usersMap);
    } else {
      setRequestUserNames({});
    }

    setIsLoadingRequests(false);
  };

  useEffect(() => {
    if (!isBoxAdmin || !currentBox) return;
    loadPendingRequests(currentBox.id);
  }, [isBoxAdmin, currentBox?.id]);

  const handleGenerateInvite = async () => {
    if (!currentBox) return;
    setIsGeneratingInvite(true);
    const { data, error } = await supabase.rpc('generate_box_invite' as any, {
      p_box_id: currentBox.id,
    });
    setIsGeneratingInvite(false);

    if (error) {
      toast({
        title: 'Erro ao gerar convite',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const token = data?.token || '';
    setInviteToken(token);
    toast({
      title: 'Convite gerado',
      description: 'Link de convite único criado com sucesso.',
    });
  };

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingRequestId(requestId);
    const rpcName = action === 'approve' ? 'approve_box_join_request' : 'reject_box_join_request';
    const { error } = await supabase.rpc(rpcName as any, { p_request_id: requestId });
    setProcessingRequestId(null);

    if (error) {
      toast({
        title: action === 'approve' ? 'Erro ao aprovar' : 'Erro ao recusar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: action === 'approve' ? 'Solicitação aprovada' : 'Solicitação recusada',
      description: 'Status atualizado com sucesso.',
    });

    if (currentBox) {
      loadPendingRequests(currentBox.id);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-primary bg-clip-text text-transparent">
          Boxes
        </h1>
        <p className="text-muted-foreground">
          Crie ou entre em um box para treinar com sua comunidade
        </p>
      </div>

      {currentBox && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Seu Box Atual</CardTitle>
            <CardDescription>Você faz parte de:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{currentBox.name}</h3>
                <p className="text-muted-foreground">Código: {currentBox.code}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{currentBox.members} membros</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentBox.points} pontos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isBoxAdmin && currentBox && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Painel de Aprovação do Box</CardTitle>
            <CardDescription>
              Área mínima para gerar convite e revisar solicitações pendentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleGenerateInvite}
                disabled={isGeneratingInvite}
                className="w-full sm:w-auto"
              >
                {isGeneratingInvite ? 'Gerando...' : 'Gerar convite'}
              </Button>
              {inviteToken && (
                <div className="text-sm text-muted-foreground break-all">
                  Link: {`${window.location.origin}/boxes?invite=${inviteToken}`}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Solicitações pendentes</h3>
              {isLoadingRequests ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : pendingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {requestUserNames[request.user_id] || request.user_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado em {new Date(request.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReviewRequest(request.id, 'approve')}
                          disabled={processingRequestId === request.id}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewRequest(request.id, 'reject')}
                          disabled={processingRequestId === request.id}
                        >
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 mb-6">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Box
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Box</DialogTitle>
              <DialogDescription>
                Crie um box e convide seus amigos usando o código gerado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBox} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="box-name">Nome do Box</Label>
                <Input
                  id="box-name"
                  placeholder="CrossFit Elite"
                  value={newBoxName}
                  onChange={(e) => setNewBoxName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Criar Box
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Entrar em um Box
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entrar em um Box</DialogTitle>
              <DialogDescription>
                Digite o código de convite para entrar em um box existente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJoinBox} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-code">Código de Convite</Label>
                <Input
                  id="join-code"
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                  className="uppercase"
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar no Box
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {boxes.map((box) => (
          <Card key={box.id} className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle>{box.name}</CardTitle>
              <CardDescription>Código: {box.code}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{box.members} membros</span>
                </div>
                <span className="text-muted-foreground">{box.points} pts</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Boxes;
