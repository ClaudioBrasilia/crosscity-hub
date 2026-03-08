import { useRef, useState } from 'react';
import { Badge } from '@/lib/badges';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Share2 } from 'lucide-react';
import boxLogo from '@/assets/box-logo.png';

interface AchievementCardProps {
  badge: Badge;
  userName: string;
  userLevel: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AchievementCard = ({ badge, userName, userLevel, open, onOpenChange }: AchievementCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const categoryColors: Record<Badge['category'], string> = {
    consistency: 'from-emerald-500/30 to-emerald-700/30',
    performance: 'from-amber-500/30 to-amber-700/30',
    social: 'from-rose-500/30 to-rose-700/30',
    exploration: 'from-violet-500/30 to-violet-700/30',
  };

  const categoryGlow: Record<Badge['category'], string> = {
    consistency: 'shadow-emerald-500/20',
    performance: 'shadow-amber-500/20',
    social: 'shadow-rose-500/20',
    exploration: 'shadow-violet-500/20',
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);

    try {
      // Use html2canvas-like approach via canvas
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = 400 * scale;
      canvas.height = 520 * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 520);
      grad.addColorStop(0, '#0a0a0a');
      grad.addColorStop(0.5, '#111827');
      grad.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, 400, 520, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, 400, 520, 16);
      ctx.stroke();

      // Logo
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
        logo.src = boxLogo;
      });
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.globalAlpha = 0.12;
        ctx.drawImage(logo, 120, 10, 160, 160);
        ctx.globalAlpha = 1;
      }

      // Badge emoji
      ctx.font = '80px serif';
      ctx.textAlign = 'center';
      ctx.fillText(badge.icon, 200, 220);

      // Badge name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(badge.name, 200, 275);

      // Description
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText(badge.description, 200, 305);

      // Divider line
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 335);
      ctx.lineTo(320, 335);
      ctx.stroke();

      // Desbloqueado por
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('CONQUISTA DESBLOQUEADA POR', 200, 370);

      // User name
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(userName, 200, 400);

      // Level
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`Nível ${userLevel}`, 200, 425);

      // Logo small + branding at bottom
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.drawImage(logo, 155, 450, 30, 30);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('CrossUberlandia', 220, 490);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (blob) {
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'conquista.png')] })) {
          await navigator.share({
            title: `${badge.name} - Conquista Desbloqueada!`,
            text: `Desbloqueei a conquista "${badge.name}" no CrossUberlandia! 💪`,
            files: [new File([blob], 'conquista.png', { type: 'image/png' })],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `conquista-${badge.id}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (e) {
      console.error('Share error:', e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Conquista: {badge.name}</DialogTitle>
        </DialogHeader>

        {/* Visual preview card */}
        <div
          ref={cardRef}
          className={`relative mx-auto w-full max-w-[360px] rounded-2xl border border-primary/30 bg-gradient-to-b from-card via-background to-card p-6 text-center overflow-hidden shadow-2xl ${categoryGlow[badge.category]}`}
        >
          {/* Watermark logo */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
            <img src={boxLogo} alt="" className="w-36 h-36 object-contain" />
          </div>

          {/* Glow effect */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${categoryColors[badge.category]} pointer-events-none`} />

          <div className="relative z-10 space-y-4">
            {/* Badge icon */}
            <div className="pt-8">
              <span className="text-7xl drop-shadow-lg">{badge.icon}</span>
            </div>

            {/* Badge info */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">{badge.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
            </div>

            {/* Divider */}
            <div className="w-3/5 mx-auto h-px bg-primary/30" />

            {/* User info */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Conquista desbloqueada por
              </p>
              <p className="text-lg font-bold text-primary">{userName}</p>
              <p className="text-xs text-muted-foreground">Nível {userLevel}</p>
            </div>

            {/* Branding */}
            <div className="flex items-center justify-center gap-2 pt-2 pb-1">
              <img src={boxLogo} alt="CrossUberlandia" className="w-7 h-7 object-contain" />
              <span className="text-xs text-muted-foreground font-medium">CrossUberlandia</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center py-4">
          <Button onClick={handleShare} disabled={sharing} className="gap-2">
            {navigator.share ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {sharing ? 'Gerando...' : navigator.share ? 'Compartilhar' : 'Baixar Imagem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementCard;
