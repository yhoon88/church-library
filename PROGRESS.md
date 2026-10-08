# PROGRESS

이 파일은 세션이 끊겨도 "PROGRESS.md 보고 이어서 해"로 다시 시작하기 위한 기록입니다.

## 현재 단계
- **1단계 · PRD 인터뷰** 진행 중
  - [x] 아이디어: 교회 도서 관리 앱 — 도서 목록 관리, 사용자가 책 사진을 찍어 대출·반납, 폰 없는 어린이는 관리자가 대신 대출·반납
  - [x] ⓪ 시간: 1시간 (기획+디자인 20분 이내, 30분 지점에서 핵심 미완이면 선택 기능 보류)
  - [x] ① 문제: 종이 장부(책 이름·빌린 사람·반납날짜·반납 여부) / 원하는 모습: 누가 무엇을 빌렸는지 한눈에 + 매년 출판사에서 살 때 이미 가진 책인지 파악
  - [x] ② 느낌: 크고 단순한 버튼, 따뜻한 도서관 느낌
  - [x] ③ MVP: 1~9 모두 진행. 순서 = 1~5(목록·검색, 등록·수정·삭제, 대출, 반납, 대출현황) 먼저 배포 → 6(사진첨부) → 8(엑셀 올리기) → 7(바코드) → 9(출판사 비교 → kbookstore.com Cloudflare 봇차단 확인, 사용자 결정으로 "이번엔 안 함")
  - [x] ④ 세부: 폰 중심+컴퓨터, 반납 자동 2주(변경 가능), 회원=이름+PIN4자리+관리자 승인, 관리자 비밀번호로 책 등록·편집·회원 승인·대신 대출
  - [x] ⑤ 구글 로그인 안 넣음 / 관리자 대시보드 안 넣음 (관리자 비밀번호 화면은 넣음)
  - [x] 가정 목록 확인 (A4 → 관리자 비밀번호로 변경)
  - [x] PRD.md 작성 완료 → OK 받음
- **2단계 · 디자인 (스티치): 진행 중** — 사용자가 스티치 결과(이미지·코드) 가져오기를 기다리는 중. "스티치 건너뛰기"면 PRD+레퍼런스로 기본 디자인 정하고 3단계로
- 2단계 완료 (스티치 화면 18개 확인, OK 받음)
- **3단계 · 구현·배포: 진행 중**
  - [x] Node.js·GitHub CLI·Vercel CLI 설치, gh 로그인(yhoon88), vercel 로그인(yhoon88-4011, 팀 sw-team3)
  - [x] Supabase: 사용자 요청으로 커넥터 대신 브라우저 사용. yhoon88-make's Org에 church-library (kfvbfontkifaoyntmamv, 시드니) 생성 + SQL 에디터로 테이블 books/members/loans/login_attempts, RLS on, Storage loan-photos(public)
    - (참고) 처음 커넥터로 SDBin's Org에 만든 church-library(mzeebirmifphtazjgort)는 안 씀 — 정리 여부 사용자에게 확인 필요
  - Vercel도 커넥터 쓰지 않음 (CLI만). GitHub 자동 배포 연동 안 함 → `vercel --prod`로 배포
  - [x] GitHub 저장소 yhoon88/church-library (public, 커밋 작성자 noreply), Next.js는 app/ 폴더
  - [x] Vercel 프로젝트 church-library (rootDirectory=app, 함수 지역 icn1)
  - [x] 사용자: Supabase secret key·관리자 비밀번호 저장, Vercel Authentication 끔 (GitHub 연동은 사용자 요청으로 안 함)
  - [x] API + 화면 작성 → 로컬 API 테스트 통과 → Vercel 환경변수(Sensitive) 등록 → 배포
  - [x] **배포 URL: https://church-library-nine.vercel.app** (로그인 없이 열림, 관리자 비밀번호 서버 확인 OK)
  - [ ] 사용자 최종 확인: /admin에서 맞는 비밀번호로 들어가지는지, 폰에서 사진·바코드 동작
  - 재배포: D:\myService 에서 `vercel --prod --yes --scope sw-team3`
  - 환경변수 다시 넣을 때는 bash에서 printf로 (PowerShell 파이프는 줄바꿈이 섞여 비밀번호가 틀어짐)
  - 비밀 값 저장: `powershell -ExecutionPolicy Bypass -File D:\myService\scripts\save-secret.ps1 <이름> <최소길이>` (클립보드 → app\.env.local)

## 정해진 것
(아직 없음)

## 가정 (내가 대신 정한 것)
(아직 없음)
