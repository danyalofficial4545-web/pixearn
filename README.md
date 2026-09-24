# PixEarn: Earn Your Pixels

BUILD A COMPLETE NEW EARNING WEBSITE FROM SCRATCH - PIXEARN - MODERN WHITE DESIGN

PROJECT NAME: PixEarn
LOGO: Create a beautiful modern circular logo with text "PixEarn" inside, white background, gradient blue/purple, with floating/rotating animation on splash and login/register screen. When user opens link, logo should animate in circle shape.

1. AUTHENTICATION:
- Register Page: Fields: Email (Gmail), Username (unique), Password, Confirm Password. Show animated circular PixEarn logo on top. On Register, auto-login to Dashboard.
- Login Page: One field that accepts Username OR Email + Password field. Button: Login. Show same animated logo. Link: Forgot Password (Email OTP).
- After login, JWT / session auth.

2. TWO WALLETS SYSTEM (MOST IMPORTANT - FOR NO LOSS):
- Deposit Wallet: Coins come ONLY from Deposits (JazzCash/Easypaisa/USDT). This wallet is ONLY for BUYING PACKAGES. User can NEVER withdraw from Deposit Wallet. After buying package, coins are deducted from Deposit Wallet and finished.
- Earning Wallet: Coins come ONLY from Tasks (Automatic Timewall 10% + Manual Approved Tasks) + Referral (20% + 5%). Withdrawal is ONLY from Earning Wallet. Display balance everywhere in 3 formats: Coins | PKR | USDT. Conversion: 100 Coins = 1 PKR, 1 USD = 280 PKR (Admin editable).

3. PACKAGES (ONLY 3 PACKAGES - NO MORE):
- FREE Package: Price 0 Coins. Daily 1 Task. Daily Earning 300 Coins (3 PKR). Validity Lifetime. Minimum Withdraw for Free User: 500 PKR (50,000 Coins) - This prevents company loss, forces user to buy paid package.
- Package 200: Price 20,000 Coins (200 PKR). Daily 2 Tasks. Daily Earning 2500 Coins (25 PKR). Validity 30 Days. Minimum Withdraw: 300 PKR (30,000 Coins).
- Package 500: Price 50,000 Coins (500 PKR). Daily 5 Tasks. Daily Earning 7000 Coins (70 PKR). Validity 30 Days. Minimum Withdraw: 600 PKR (60,000 Coins).
- On Dashboard, show Active Package Name, Expiry Date, Today's Tasks. If no package, show all tasks LOCKED with blur and message "Please Deposit & Buy a Package to Unlock Tasks".

4. DASHBOARD & PROFILE & WALLET PAGES:
- Dashboard: Top header: Circular small logo + Username + Balance (Coins/PKR/USDT). Shows Active Package, Earning Today, Referral Banner. Bottom: Today's Tasks.
- Profile Page: User Photo, Username, Email, Active Package, Total Earnings, Total Tasks Completed, Joining Date, Referral Code/Link. Top right: Two Buttons always visible: DEPOSIT and WITHDRAW.
- Wallet Page: Two Tabs: Deposit Wallet (Balance + History of Deposits + Package Purchases) and Earning Wallet (Balance + History of Task Earnings + Referrals + Withdraws).

5. DEPOSIT PAGE:
- When user clicks DEPOSIT, open Deposit Page.
- Show Payment Accounts that Admin sets in Admin Panel: JazzCash Number + Title, Easypaisa Number + Title, USDT BEP20 Address + Network. Also show Instruction Text that Admin writes: "Please send money to correct number and upload proof. Wrong number payment will not be accepted."
- Form: Select Amount (200, 500, 1000), Enter Transaction ID (TID), Upload Screenshot, Submit. Status Pending. Admin approves in Admin Panel -> Coins added to Deposit Wallet.

6. TASK SYSTEM - TWO TYPES (DIRECT CONNECTION EXPLAINED):
A) AUTOMATIC TASKS - DIRECT CONNECTION (TIMEWALL - 10% TO USER):
- Integrate Timewall Offerwall via Iframe on /earn-coins page: https://timewall.io/wall/YOUR_WALL_ID?uid={USER_ID} where {USER_ID} is dynamic logged-in user id.
- Create Postback API endpoint: /api/postback?userId={uid}&coins={amount}&secret=YOUR_SECRET_KEY
- Logic: When user completes task on Timewall, Timewall calls postback URL with userId and coins. Backend verifies secret, calculates 10% of received coins and adds ONLY that 10% to user's Earning Wallet. Return "OK" to Timewall. No screenshot needed. Instant coins.
B) MANUAL CUSTOM TASKS (ADMIN VERIFICATION):
- Admin creates tasks in Admin Panel: Fields: Title/Game Name, Picture Upload, Description/Steps, Reward Coins for User, My Profit (hidden), Play Store Link, Active/Inactive Toggle.
- User Flow: User clicks task -> Opens Task Detail Page -> steps, Play Store button, form: Enter Game User ID + Upload Screenshot Proof + Submit Proof. Status Pending until Admin approves -> Coins go to Earning Wallet.

7. WITHDRAW PAGE - FIXED AMOUNTS ONLY (NO CUSTOM INPUT):
- Fixed buttons based on active package:
  FREE Package: 500 PKR, 1000 PKR
  200 Package: 300 PKR, 500 PKR, 1000 PKR
  500 Package: 600 PKR, 1000 PKR, 3000 PKR, 10000 PKR
- Check Earning Wallet balance, method: JazzCash, Easypaisa, USDT BEP20/TRC20 + Account details, submit to admin.

8. REFERRAL SYSTEM:
- Unique referral code/link per user.
- Commission 1: 20% of package price to referrer when referred user buys package into Earning Wallet.
- Commission 2: 5% of daily task earnings to referrer for 30 days into Earning Wallet.
- Referral Page: Referral link, share buttons, referred users list, earnings summary.

9. ADMIN PANEL - /admin:
- Dashboard: stats (users, deposits, withdraws, profit, pending items).
- User management: balance edits, view wallets, package status, ban/unban.
- Payment accounts management: JazzCash, Easypaisa, USDT, deposit instructions.
- Tasks management & Pending Task Proofs approval/rejection.
- Deposit approval/rejection.
- Withdrawal approval/rejection.
- Transaction logs & referral settings.

10. DESIGN & SECURITY:
- Modern white clean design, animated circular PixEarn logo, fully mobile responsive.
- Strict wallet separation: Deposit Wallet can never be withdrawn, Earning Wallet cannot purchase packages. Free package min withdraw 500 PKR.
- Pages: / (Landing with packages + logo animation), /login, /register, /dashboard, /tasks, /task/:id, /earn-coins, /deposit, /withdraw, /wallet, /profile, /referral, /history, /admin.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pixearn.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/632d2e6e-794f-4429-8bb9-9869257d4d8c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
