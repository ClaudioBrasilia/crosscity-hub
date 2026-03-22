import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
  className?: string;
  fallbackClassName?: string;
}

const getInitials = (name?: string | null) => {
  const trimmed = name?.trim();
  if (!trimmed) return 'U';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const looksLikeEmojiAvatar = (avatar?: string | null) => {
  if (!avatar) return false;
  return avatar.length <= 4;
};

const UserAvatar = ({ name, avatarUrl, avatar, className, fallbackClassName }: UserAvatarProps) => {
  const fallbackText = looksLikeEmojiAvatar(avatar) ? avatar : getInitials(name);

  return (
    <Avatar className={cn('bg-muted', className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={`Foto de perfil de ${name || 'usuário'}`} /> : null}
      <AvatarFallback className={cn('bg-primary/10 text-primary font-semibold', fallbackClassName)}>
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
