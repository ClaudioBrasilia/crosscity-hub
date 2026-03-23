import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users } from 'lucide-react';

interface Box {
  id: string;
  name: string;
  code: string;
  members: number;
  points: number;
}

const Boxes = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const isAdmin = user?.role === 'admin';

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

    if (!isAdmin) {
      toast({
        title: 'Acesso restrito',
        description: 'Apenas administradores podem criar Box.',
        variant: 'destructive',
      });
      setShowCreateDialog(false);
      return;
    }

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
                <Button type="submit" className="w-full">
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
