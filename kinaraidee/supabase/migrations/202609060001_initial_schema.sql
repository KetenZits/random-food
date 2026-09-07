create extension if not exists pgcrypto;

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  normalized_name text not null,
  category text not null check (category in ('meat','seafood','eggs','vegetables','fruits','herbs','seasonings','sauces','rice_grains','noodles','dairy','frozen','other')),
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  normalized_quantity numeric(14,3) not null default 0 check (normalized_quantity >= 0),
  unit text not null,
  normalized_unit text not null check (normalized_unit in ('g','ml','count')),
  purchase_date date not null default current_date,
  expiration_date date,
  notes text check (notes is null or char_length(notes) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meals (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  cuisine text not null default 'thai' check (cuisine in ('thai','asian','international')),
  meal_type text not null default 'main' check (meal_type in ('main','light','breakfast')),
  difficulty text not null default 'easy' check (difficulty in ('easy','medium','hard')),
  cooking_time_minutes integer not null check (cooking_time_minutes between 1 and 1440),
  is_favorite boolean not null default false,
  source text not null default 'manual' check (source in ('ai','manual','cached','curated')),
  tags text[] not null default '{}',
  image_tone text not null default '#927054',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id text not null references public.meals(id) on delete cascade,
  ingredient_name text not null,
  normalized_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  normalized_quantity numeric(14,3) not null check (normalized_quantity > 0),
  unit text not null,
  normalized_unit text not null check (normalized_unit in ('g','ml','count')),
  is_optional boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.meal_steps (
  id uuid primary key default gen_random_uuid(),
  meal_id text not null references public.meals(id) on delete cascade,
  step_number integer not null check (step_number > 0),
  instruction text not null,
  unique (meal_id, step_number)
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  meals_per_day smallint not null default 1 check (meals_per_day between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  date date not null,
  meal_slot smallint not null check (meal_slot between 0 and 2),
  meal_id text not null references public.meals(id) on delete restrict,
  is_locked boolean not null default false,
  status text not null default 'planned' check (status in ('planned','cooked','skipped')),
  match_score smallint not null default 0 check (match_score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (weekly_plan_id, date, meal_slot)
);

create table public.meal_history (
  id uuid primary key default gen_random_uuid(),
  meal_id text not null references public.meals(id) on delete restrict,
  cooked_at timestamptz not null default now(),
  ingredients_used jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.app_preferences (
  id text primary key default 'personal',
  meals_per_day smallint not null default 1 check (meals_per_day between 1 and 3),
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.ingredient_transactions (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid references public.ingredients(id) on delete set null,
  ingredient_name text not null,
  type text not null check (type in ('add','consume','adjust','waste')),
  quantity numeric(14,3) not null,
  unit text not null,
  reference text,
  created_at timestamptz not null default now()
);

create index ingredients_normalized_name_idx on public.ingredients(normalized_name);
create index ingredients_expiration_date_idx on public.ingredients(expiration_date) where quantity > 0;
create index planned_meals_date_idx on public.planned_meals(date);
create index meal_history_cooked_at_idx on public.meal_history(cooked_at desc);
create index ingredient_transactions_ingredient_idx on public.ingredient_transactions(ingredient_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ingredients_updated_at before update on public.ingredients for each row execute function public.set_updated_at();
create trigger meals_updated_at before update on public.meals for each row execute function public.set_updated_at();
create trigger weekly_plans_updated_at before update on public.weekly_plans for each row execute function public.set_updated_at();
create trigger app_preferences_updated_at before update on public.app_preferences for each row execute function public.set_updated_at();

-- Atomically consumes available inventory for a planned meal. Row locks prevent
-- concurrent cooks/adjustments from producing a negative quantity.
create or replace function public.consume_planned_meal(target_planned_meal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_plan public.planned_meals%rowtype;
  recipe_item public.meal_ingredients%rowtype;
  stock public.ingredients%rowtype;
  remaining numeric;
  take_normalized numeric;
  take_display numeric;
begin
  select * into target_plan from public.planned_meals where id = target_planned_meal_id for update;
  if not found then raise exception 'planned meal not found'; end if;
  if target_plan.status = 'cooked' then return jsonb_build_object('status', 'already_cooked'); end if;

  for recipe_item in
    select * from public.meal_ingredients where meal_id = target_plan.meal_id and is_optional = false order by created_at
  loop
    remaining := recipe_item.normalized_quantity;
    for stock in
      select * from public.ingredients
      where normalized_name = recipe_item.normalized_name
        and normalized_unit = recipe_item.normalized_unit
        and normalized_quantity > 0
      order by expiration_date asc nulls last, created_at asc
      for update
    loop
      exit when remaining <= 0;
      take_normalized := least(remaining, stock.normalized_quantity);
      take_display := case when stock.normalized_quantity = 0 then 0 else stock.quantity * take_normalized / stock.normalized_quantity end;
      update public.ingredients
      set quantity = greatest(0, quantity - take_display),
          normalized_quantity = greatest(0, normalized_quantity - take_normalized)
      where id = stock.id;
      insert into public.ingredient_transactions(ingredient_id, ingredient_name, type, quantity, unit, reference)
      values (stock.id, stock.name, 'consume', -take_display, stock.unit, target_plan.meal_id::text);
      remaining := remaining - take_normalized;
    end loop;
  end loop;

  update public.planned_meals set status = 'cooked' where id = target_plan.id;
  insert into public.meal_history(meal_id) values (target_plan.meal_id);
  return jsonb_build_object('status', 'cooked', 'planned_meal_id', target_plan.id);
end;
$$;

alter table public.ingredients enable row level security;
alter table public.meals enable row level security;
alter table public.meal_ingredients enable row level security;
alter table public.meal_steps enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.planned_meals enable row level security;
alter table public.meal_history enable row level security;
alter table public.ingredient_transactions enable row level security;
alter table public.app_preferences enable row level security;

-- No anonymous policies are intentionally created. The personal-use build writes
-- through its server boundary with the service role. Add user_id columns and
-- authenticated policies before enabling multi-user authentication.
revoke all on function public.consume_planned_meal(uuid) from public, anon, authenticated;
grant execute on function public.consume_planned_meal(uuid) to service_role;
