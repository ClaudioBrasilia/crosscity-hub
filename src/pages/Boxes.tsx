import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createBox, fetchBoxes, joinBoxByCode, readBoxesCache } from '@/lib/boxes';
import { Plus, Users } from 'lucide-react';

interface Box {
  id: string;
  name: string;
  code: string;
  members: number;
  points: number;
}

const mapBox = (box: { id: string; name: string; invite_code: string; member_count: number; points: number; }) => ({
  id: box.id,
  name: box.name,
  code: box.invite_code,
  members: box.member_count,
  points: box.points,
});

const Boxes = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = user?.role === 'admin';

  const loadBoxes = useCallback(async () => {
    setLoadingBoxes(true);

    try {
      const remoteBoxes = await fetchBoxes();
      setBoxes(remoteBoxes.map(mapBox));
    } catch (error) {
      console.error('Erro ao carregar boxes:', error);
      toast({
        title: 'Erro ao carregar boxes',
        description: 'Não foi possível sincronizar os boxes agora.',
        variant: 'destructive',
      });
      setBoxes(readBoxesCache().map(mapBox));
    } finally {
      setLoadingBoxes(false);
    }
  }, [toast]);

  useEffect(() => {
    setBoxes(readBoxesCache().map(mapBox));
    loadBoxes();
  }, [loadBoxes]);

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      toast({
        title: 'Acesso restrito',
        description: 'Apenas administradores podem criar Box.',
        variant: 'destructive',
      });
      setShowCreateDialog(false);
      return;
    }

    setSubmitting(true);

    try {
      const createdBox = mapBox(await createBox(newBoxName));

      if (user) {
        updateUser({ boxId: createdBox.id });
      }

      await loadBoxes();

      toast({
        title: 'Box criado!',
        description: `Código de convite: ${createdBox.code}`,
      });

      setShowCreateDialog(false);
      setNewBoxName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível criar o box';
      toast({
        title: 'Erro',
        description: message.includes('Apenas administradores podem criar Box.')
          ? 'Apenas administradores podem criar Box.'
          : message,
        variant: 'destructive',
      });
      setShowCreateDialog(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinBox = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const box = mapBox(await joinBoxByCode(joinCode));

      if (user) {
        updateUser({ boxId: box.id });
      }

      await loadBoxes();

      toast({
        title: 'Sucesso!',
        description: `Você entrou no box ${box.name}`,
      });

      setShowJoinDialog(false);
      setJoinCode('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Código de convite inválido';
      toast({
        title: 'Erro',
        description: message.includes('Código de convite inválido') ? 'Código de convite inválido' : message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentBox = boxes.find(b => b.id === user?.boxId);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-primary bg-clip-text text-transparent">
          Boxes
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Crie ou entre em um box para treinar com sua comunidade'
            : 'Entre em um box para treinar com sua comunidade'}
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

      <div className="flex gap-4 mb-6">
        {isAdmin && (
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
                <Button type="submit" className="w-full" disabled={submitting}>
                  Criar Box
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

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
              <Button type="submit" className="w-full" disabled={submitting}>
                Entrar no Box
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingBoxes && boxes.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-8 text-center text-muted-foreground">
              Carregando boxes...
            </CardContent>
          </Card>
        ) : boxes.map((box) => (
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
