import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Flame, ThumbsUp } from 'lucide-react';

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  wodName: string;
  time: string;
  reactions: { fire: number; clap: number; muscle: number };
  comments: number;
  timestamp: number;
}

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const feedData = localStorage.getItem('crosscity_feed');
    if (feedData) {
      setPosts(JSON.parse(feedData));
    }
  }, []);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Feed</h1>
      </div>

      {posts.map((post) => (
        <Card key={post.id} className="border-primary/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{post.userAvatar}</div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{post.userName}</p>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      {post.wodName}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatTime(post.timestamp)}</p>
                </div>

                <p className="text-lg">{post.content}</p>

                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-muted px-3 py-1 rounded-full font-semibold text-primary">
                    ⏱️ {post.time}
                  </span>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <span>{post.reactions.fire}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.reactions.clap}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments}</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Feed;
