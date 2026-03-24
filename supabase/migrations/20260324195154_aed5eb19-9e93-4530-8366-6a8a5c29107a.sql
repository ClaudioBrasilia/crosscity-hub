-- ============ APP_INVITES TABLE ============
CREATE TABLE IF NOT EXISTS public.app_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  created_by uuid NOT NULL,
  used_by uuid NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked', 'expired')),
  use_count integer NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 1,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz NULL
);

-- ============ RLS ============
ALTER TABLE public.app_invites ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage invites"
  ON public.app_invites FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone (including anon) can SELECT to validate tokens
CREATE POLICY "Anyone can view invites"
  ON public.app_invites FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============ RPC: create_app_invite ============
CREATE OR REPLACE FUNCTION public.create_app_invite(_expires_in_hours integer DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _token text;
  _expires timestamptz;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can create invites';
  END IF;

  _token := encode(gen_random_bytes(16), 'hex');

  IF _expires_in_hours IS NOT NULL THEN
    _expires := now() + (_expires_in_hours || ' hours')::interval;
  END IF;

  INSERT INTO public.app_invites (token, created_by, expires_at)
  VALUES (_token, auth.uid(), _expires);

  RETURN _token;
END;
$$;

-- ============ RPC: consume_app_invite ============
CREATE OR REPLACE FUNCTION public.consume_app_invite(_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
BEGIN
  SELECT * INTO _invite FROM public.app_invites
    WHERE token = _token FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF _invite.status <> 'active' THEN
    RETURN 'already_used';
  END IF;

  IF _invite.use_count >= _invite.max_uses THEN
    RETURN 'already_used';
  END IF;

  IF _invite.expires_at IS NOT NULL AND _invite.expires_at < now() THEN
    UPDATE public.app_invites SET status = 'expired' WHERE id = _invite.id;
    RETURN 'expired';
  END IF;

  UPDATE public.app_invites
  SET used_by = auth.uid(),
      used_at = now(),
      use_count = use_count + 1,
      status = 'used'
  WHERE id = _invite.id;

  RETURN 'ok';
END;
$$;