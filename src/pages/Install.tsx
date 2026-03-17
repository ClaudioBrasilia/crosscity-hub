import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Share, Smartphone, Monitor, Apple, Chrome } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/20">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">📲</div>
          <CardTitle className="text-3xl gradient-primary bg-clip-text text-transparent">
            Instalar BoxLink
          </CardTitle>
          <CardDescription>
            Tenha o app direto na tela inicial do seu celular
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center p-6 bg-primary/10 rounded-xl">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lg font-semibold text-foreground">App já instalado!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Abra o BoxLink pela tela inicial do seu dispositivo.
              </p>
            </div>
          ) : (
            <>
              {/* Android / Desktop com prompt nativo */}
              {deferredPrompt && (
                <Button onClick={handleInstall} className="w-full h-14 text-lg gap-3" size="lg">
                  <Download className="w-5 h-5" />
                  Instalar agora
                </Button>
              )}

              {/* iOS */}
              {platform === 'ios' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                    <Apple className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">iPhone / iPad</p>
                      <p className="text-sm text-muted-foreground">Siga os passos abaixo:</p>
                    </div>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                      <span className="text-muted-foreground">Toque no ícone de <strong className="text-foreground">Compartilhar</strong> <Share className="w-4 h-4 inline" /> na barra do Safari</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-muted-foreground">Role para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong></span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                      <span className="text-muted-foreground">Confirme tocando em <strong className="text-foreground">"Adicionar"</strong></span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android sem prompt */}
              {platform === 'android' && !deferredPrompt && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                    <Chrome className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Android</p>
                      <p className="text-sm text-muted-foreground">Instale pelo Chrome:</p>
                    </div>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                      <span className="text-muted-foreground">Toque no menu <strong className="text-foreground">⋮</strong> do Chrome</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-muted-foreground">Toque em <strong className="text-foreground">"Instalar aplicativo"</strong></span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Desktop */}
              {platform === 'desktop' && !deferredPrompt && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                    <Monitor className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Desktop</p>
                      <p className="text-sm text-muted-foreground">Melhor experiência no celular!</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Acesse este link no navegador do seu celular para instalar o app:
                  </p>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <code className="text-sm text-primary break-all">{window.location.origin}/install</code>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl">
                <Smartphone className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  O app funciona offline, é rápido e ocupa pouco espaço no seu celular.
                </p>
              </div>
            </>
          )}

          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
            Voltar ao app
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
