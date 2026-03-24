import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

type InviteStatus = 'loading' | 'valid' | 'not_found' | 'already_used' | 'expired' | 'consumed' | 'error' | 'need_login';

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<InviteStatus>('loading');

  useEffect(() => {
    if (!token) { setStatus('not_found'); return; }
    checkAndConsume(token);
  }, [token]);

  const checkAndConsume = async (t: string) => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setStatus('need_login');
      return;
    }

    // Try to consume the invite
    const { data, error } = await supabase.rpc('consume_app_invite', { _token: t });

    if (error) {
      console.error('Invite error:', error);
      setStatus('error');
      return;
    }

    if (data === 'ok') setStatus('consumed');
    else if (data === 'not_found') setStatus('not_found');
    else if (data === 'already_used') setStatus('already_used');
    else if (data === 'expired') setStatus('expired');
    else setStatus('error');
  };

  const icon = {
    loading: <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />,
    valid: <CheckCircle className="h-12 w-12 text-green-500" />,
    consumed: <CheckCircle className="h-12 w-12 text-green-500" />,
    not_found: <XCircle className="h-12 w-12 text-destructive" />,
    already_used: <XCircle className="h-12 w-12 text-destructive" />,
    expired: <Clock className="h-12 w-12 text-yellow-500" />,
    error: <XCircle className="h-12 w-12 text-destructive" />,
    need_login: <XCircle className="h-12 w-12 text-muted-foreground" />,
  }[status];

  const title = {
    loading: 'Validando convite...',
    valid: 'Convite válido!',
    consumed: 'Convite aceito!',
    not_found: 'Convite não encontrado',
    already_used: 'Convite já utilizado',
    expired: 'Convite expirado',
    error: 'Erro ao processar convite',
    need_login: 'Login necessário',
  }[status];

  const description = {
    loading: 'Aguarde enquanto verificamos seu convite.',
    valid: 'Seu convite foi validado com sucesso.',
    consumed: 'Seu convite foi registrado. Você pode continuar usando o app normalmente.',
    not_found: 'Este link de convite não é válido ou não existe.',
    already_used: 'Este convite já foi utilizado por outra pessoa.',
    expired: 'Este convite expirou e não pode mais ser utilizado.',
    error: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
    need_login: 'Você precisa estar logado para usar este convite. Faça login e tente novamente.',
  }[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{icon}</div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{description}</p>
          {status === 'need_login' && (
            <Button onClick={() => navigate('/login')}>Ir para Login</Button>
          )}
          {(status === 'consumed' || status === 'not_found' || status === 'already_used' || status === 'expired' || status === 'error') && (
            <Button variant="outline" onClick={() => navigate('/')}>Ir para o início</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Invite;
