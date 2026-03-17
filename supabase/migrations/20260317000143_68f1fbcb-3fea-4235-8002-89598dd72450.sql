
-- Create enums
CREATE TYPE public.transaction_status AS ENUM ('pendente', 'pago', 'cancelado');
CREATE TYPE public.expense_category AS ENUM ('foto_video', 'trafego_pago', 'manutencao', 'outros');

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  sale_value NUMERIC NOT NULL DEFAULT 0,
  commission_pct NUMERIC NOT NULL DEFAULT 0,
  broker_payout NUMERIC NOT NULL DEFAULT 0,
  broker_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status transaction_status NOT NULL DEFAULT 'pendente',
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  category expense_category NOT NULL DEFAULT 'outros',
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on transactions"
ON public.transactions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Brokers can read own transactions"
ON public.transactions FOR SELECT TO authenticated
USING (broker_user_id = auth.uid());

-- RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on expenses"
ON public.expenses FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
