import { Badge } from '@/components/ui/badge';
import { Shirt, Footprints, Crown, Watch, Sparkles, Gem } from 'lucide-react';

const SLOTS = [
  { key: 'equipped_head_accessory', label: 'Cabeça', icon: Crown, color: 'bg-red-500' },
  { key: 'equipped_top', label: 'Superior', icon: Shirt, color: 'bg-violet-500' },
  { key: 'equipped_bottom', label: 'Inferior', icon: Shirt, color: 'bg-cyan-500' },
  { key: 'equipped_shoes', label: 'Calçado', icon: Footprints, color: 'bg-amber-500' },
  { key: 'equipped_accessory', label: 'Acessório', icon: Gem, color: 'bg-pink-500' },
  { key: 'equipped_wrist_accessory', label: 'Pulso', icon: Watch, color: 'bg-emerald-500' },
  { key: 'equipped_special', label: 'Especial', icon: Sparkles, color: 'bg-orange-500' },
] as const;

interface Props {
  equipment: Record<string, string | null>;
}

export default function AvatarSlotLegend({ equipment }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {SLOTS.map((slot) => {
        const value = equipment[slot.key];
        const equipped = !!value;
        const Icon = slot.icon;

        return (
          <Badge
            key={slot.key}
            variant={equipped ? 'default' : 'outline'}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 ${
              equipped ? 'bg-muted/80 text-foreground border-border' : 'text-muted-foreground'
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${equipped ? slot.color : 'bg-muted-foreground/40'}`} />
            <Icon className="h-3 w-3" />
            <span>{slot.label}</span>
            {equipped && <span className="font-bold">· {value}</span>}
          </Badge>
        );
      })}
    </div>
  );
}
