-- 목적: page_id는 내부 고정 키로 유지하고, 공개 URL은 user_url로 분리하여 관리
-- 일반 회원가입 유저(admin_users)와 네이버 로그인 유저(naver_admin_accounts) 모두 적용

-- 1. admin_users 테이블에 user_url 컬럼 추가
alter table admin_users
  add column if not exists user_url text;

-- admin_users: 기본값 백필 - user_url이 없는 계정은 page_id를 기본값으로 세팅
update admin_users
set user_url = page_id
where user_url is null
  and page_id is not null;

-- admin_users: user_url 유니크 인덱스 생성
create unique index if not exists admin_users_user_url_unique
  on admin_users (user_url);

-- 2. naver_admin_accounts 테이블에 user_url 컬럼 추가
alter table naver_admin_accounts
  add column if not exists user_url text;

-- naver_admin_accounts: 기본값 백필 - user_url이 없는 계정은 page_id를 기본값으로 세팅
update naver_admin_accounts
set user_url = page_id
where user_url is null
  and page_id is not null;

-- naver_admin_accounts: user_url 유니크 인덱스 생성
create unique index if not exists naver_admin_accounts_user_url_unique
  on naver_admin_accounts (user_url);


