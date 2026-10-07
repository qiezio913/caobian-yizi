-- 在 Supabase 的 SQL Editor 中执行这段 SQL，创建需要的两张表

create table if not exists diaries (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  mood text,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists chats (
  id uuid default gen_random_uuid() primary key,
  role text not null check (role in ('user', 'bot')),
  content text not null,
  created_at timestamptz default now()
);

-- 允许匿名读写（个人使用简化版，实际上线建议加登录）
alter table diaries enable row level security;
alter table chats enable row level security;

create policy "allow all diaries" on diaries for all using (true) with check (true);
create policy "allow all chats" on chats for all using (true) with check (true);
