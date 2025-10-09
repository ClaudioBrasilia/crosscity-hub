import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { avatarEmojis } from '@/lib/mockData';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar);

  const handleSaveAvatar = () => {
    if (selectedAvatar) {
      updateUser({ avatar: selectedAvatar });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Perfil</h1>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Nome</p>
            <p className="text-xl font-semibold">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-xl font-semibold">{user?.email}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nível</p>
              <p className="text-2xl font-bold text-primary">{user?.level}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">XP Total</p>
              <p className="text-2xl font-bold text-secondary">{user?.xp}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sequência</p>
              <p className="text-2xl font-bold text-primary">{user?.streak} dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Personalizar Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {avatarEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedAvatar(emoji)}
                className={`text-6xl p-4 rounded-lg border-2 transition-all hover:scale-110 ${
                  selectedAvatar === emoji 
                    ? 'border-primary bg-primary/10 box-shadow-glow' 
                    : 'border-border'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <Button onClick={handleSaveAvatar} className="w-full">
            Salvar Avatar
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🔥', label: 'Primeira Semana', achieved: true },
              { icon: '💪', label: 'PR Hunter', achieved: true },
              { icon: '⚡', label: 'Velocista', achieved: false },
              { icon: '🏆', label: 'Campeão', achieved: false },
            ].map((achievement, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border text-center ${
                  achievement.achieved 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <p className="text-sm font-semibold">{achievement.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
