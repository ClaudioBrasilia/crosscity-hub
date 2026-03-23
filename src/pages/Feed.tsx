import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Flame, ThumbsUp, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import * as db from '@/lib/supabaseData';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<db.FeedPost[]>([]);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Array<{ id: string; userName: string; userAvatar: string; content: string; timestamp: number }>>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  const loadPosts = useCallback(async () => {
    const data = await db.getFeedPosts(50);
    setPosts(data);
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleReaction = async (postId: string, type: string) => {
    if (!user) return;
    await db.toggleReaction(postId, user.id, type);
    await loadPosts();
  };

  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    setExpandedComments(postId);
    const data = await db.getPostComments(postId);
    setComments(prev => ({ ...prev, [postId]: data }));
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentInput[postId]?.trim()) return;
    await db.addComment(postId, user.id, commentInput[postId].trim());
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    const data = await db.getPostComments(postId);
    setComments(prev => ({ ...prev, [postId]: data }));
    await loadPosts();
  };

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

      {posts.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhuma atividade ainda.</p>}

      {posts.map((post) => (
        <Card key={post.id} className="border-primary/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{post.userAvatar}</div>
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{post.userName}</p>
                    {post.wodName && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{post.wodName}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatTime(post.timestamp)}</p>
                </div>

                <p className="text-lg">{post.content}</p>

                {post.timeDisplay && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-muted px-3 py-1 rounded-full font-semibold text-primary">⏱️ {post.timeDisplay}</span>
                  </div>
                )}

                <div className="flex items-center gap-6 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleReaction(post.id, 'fire')}>
                    <Flame className="h-4 w-4 text-primary" />
                    <span>{post.reactions.fire}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleReaction(post.id, 'clap')}>
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.reactions.clap}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => toggleComments(post.id)}>
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments}</span>
                  </Button>
                </div>

                {expandedComments === post.id && (
                  <div className="space-y-3 pt-2">
                    {(comments[post.id] || []).map(c => (
                      <div key={c.id} className="flex items-start gap-2">
                        <span className="text-lg">{c.userAvatar}</span>
                        <div>
                          <p className="text-sm font-semibold">{c.userName}</p>
                          <p className="text-sm text-muted-foreground">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escreva um comentário..."
                        value={commentInput[post.id] || ''}
                        onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                      />
                      <Button size="sm" onClick={() => submitComment(post.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Feed;
