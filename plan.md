# 📋 FAM (API-First) Development Roadmap

## Project Status: Active Development
- **Architecture**: Backend (FastAPI) + Frontend (Next.js)
- **Trading Mode**: **Real Account Only** (Virtual mode removed)

## Phase 1: Backend Foundation (Completed)
- [x] Project Structure (Backend/Frontend separation)
- [x] FastAPI Skeleton & SecurityManager (Encryption)
- [x] DB Modeling (User, Account, TradeLog) & SQLAlchemy

## Phase 2: KIS Proxy & Core Logic (Completed)
- [x] `AuthManager`: Token auto-refresh & caching
- [x] `KisClient`: KIS API Wrapper (Real Mode Only)
- [x] Basic API: Balance (`GET /balance`), Order (`POST /order`)

## Phase 3: User & Account Management (Completed)
- [x] DB Schema Update: `Users`, `Accounts` (Encryption enforced)
- [x] API: Account CRUD, Token Refresh, Balance Inquiry
- [x] Per-Account Auth Management (No global trading mode)

## Phase 4: Portfolio Management & Rebalancing (Completed)
- [x] Portfolio Target Modeling (`TargetPortfolio`)
- [x] Analysis Engine: Rebalancing Calculator
- [x] API: Portfolio CRUD, Rebalance Analysis

## Phase 5: Next Generation Frontend (Next.js) (Completed)
- [x] Next.js + TailwindCSS Setup
- [x] Components (Glassmorphism, Dark Mode, Premium UI)
- [x] Feature Implementation:
    - [x] Dashboard (Asset Overview, Real-time Weights)
    - [x] Account Management (Secure Encryption)
    - [x] Portfolio Rebalancing (Analysis & Suggestions)
    - [x] Advanced Trading Modals (Manual, Grid, Daily Split)

## Phase 6: Stability & Expansion (Ongoing)
- [x] `APScheduler`: Automatic Data Collection & Scheduled Trading
- [ ] End-to-End Testing (Real Environment)
- [x] Code Cleanup & Refactoring (Removed legacy frontend_old)
- [x] Git Repository Setup (GitHub CLI)
- [ ] Docker Containerization
