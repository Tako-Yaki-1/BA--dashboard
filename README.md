# BA Dashboard — Clack & Co.

Business Analytics final project: MySQL + Laravel REST API (Docker) with a React + Vite + TypeScript dashboard, for Clack & Co., an online custom mechanical keyboard shop. Presents the full BA process — descriptive, predictive, prescriptive — on one advertising-strategy case study.

## Stack

- Frontend: React + Vite + TypeScript, Tailwind CSS, Recharts, Lucide React, React Router, Axios
- Backend: Laravel (PHP 8.2), REST API only
- Database: MySQL 8 in Docker (phpMyAdmin on port 8080 for live demo)

## Commands

Requires Docker Desktop and Node.js. No setup scripts — type these.

First-time setup:

```
docker compose build
docker compose up -d
cd backend
php artisan key:generate --force
docker compose exec api php artisan migrate --seed
```

Daily start / stop:

```
docker compose up -d
docker compose stop
```

Reset the database:

```
docker compose stop
docker compose down -v
docker compose up -d
docker compose exec api php artisan migrate --seed
```

Backend tests:

```
docker compose exec api php artisan test
```

Start the frontend (separate terminal, from the `frontend/` folder):

```
npm install
npm run dev
```

## URLs

| What | Where |
|---|---|
| Dashboard app | http://localhost:5173 |
| Laravel API | http://localhost:8000/api/health |
| phpMyAdmin | http://localhost:8080 (user `ba_user`, password `ba_password`) |

## Formulas (as implemented in the API)

Descriptive analytics (`app/Services/DescriptiveAnalytics.php`, all accepting optional `date_from`, `date_to`, `channel`):

- **Revenue** = Σ sales.total_amount; **orders** = count of sales; **average order value** = revenue ÷ orders.
- **Marketing spend** = Σ campaigns.spend (weeks overlapping the filtered date range, so the spend window lines up with the revenue window).
- **Revenue per peso** = revenue ÷ marketing spend (per channel: that channel's revenue ÷ its spend).
- **Mean** = Σx/n; **median** = middle value (or mean of the two middle values); **range** = max − min.
- **Standard deviation is the sample version:** SD = √( Σ(x − mean)² / (n − 1) ).
- **Pearson correlation** r = Σ(x−x̄)(y−ȳ) / √( Σ(x−x̄)² · Σ(y−ȳ)² ), computed on the 52 weekly series (spend, discount %, orders, revenue). Values near +1 = move together; near 0 = no linear link.

Predictive analytics (`app/Services/Regression.php` + `app/Services/PredictiveAnalytics.php`, `app/Support`-free — no statistical libraries; the linear system is solved from scratch):

- **Model:** weekly_revenue = b₀ + b₁·spend + b₂·discount_percent. The coefficients come from the **normal equations (XᵀX)b = Xᵀy** (X has an implicit first column of 1s for the intercept), solved by **Gaussian elimination with partial pivoting** — singular (collinear) predictors return no model rather than a garbage fit.
- **R²** = 1 − SS_res / SS_tot, where SS_res = Σ(y − ŷ)² and SS_tot = Σ(y − ȳ)² over the (filtered) weeks. Share of week-to-week revenue variance the two predictors explain.
- **Adjusted R²** = 1 − (1 − R²)(n − 1)/(n − k − 1), k = 2 predictors — penalizes the model for its predictors so it isn't flattered by a small sample.
- **RMSE** = √(SS_res / n) — typical size of one week's prediction error, in pesos.
- **Interpretation:** a spend coefficient of b₁ means each extra ₱1,000 of weekly spend is associated with b₁·1000 more weekly revenue, holding the other predictor constant.
- **Forecast:** simple OLS trend of revenue on the week index (t = 0…n−1) projected to the next 4 Mondays — labeled "simple trend projection"; it is a straight-line continuation, not a causal forecast.
- **Predict** applies the fitted equation to a hypothetical spend + discount week; valid only inside the observed data range.

Prescriptive analytics (`app/Services/PrescriptiveAnalytics.php` — no new libraries):

- **Channel ROI** = channel revenue ÷ channel spend over all 52 campaign weeks (**average return** method, documented on the endpoint; a per-channel regression slope was the alternative and was not used). Channels are ranked by ROI descending.
- **Budget allocation** is a greedy fill: every channel starts at the **min share** (default 10%), then the budget left over goes to the channels in ROI order, each capped at the **max share** (default 40%). Expected revenue per channel = allocated pesos × that channel's ROI; **uplift** is the recommended revenue minus an even 25/25/25/25 split, as a percent. With four channels, validation bounds min share to 0–25% and max share to 25–100% so the caps can both leave room and cover the budget.
- **What-if** rescales the average observed weekly budget through the fitted model: baseline = model prediction at the current average spend and discount; projected = same equation at the scaled budget (linear, so valid inside the observed range). An optional channel mix (percents summing to 100%) splits the new budget by ROI.
- **Recommendations and process summary** are generated from the data each request: the top/bottom ROI channels, the allocator's uplift versus an even split, the discount↔orders finding, the fitted spend effect, and the recommended split — nothing hardcoded.

Case-study notes: the weekly revenue series includes weeks with zero sales (spend still counts) so ROI is measured over every campaign week; the top-products list uses transaction line totals within the filtered window.

## Demo guide (8–10 minutes)

1. **Case study** (`/case-study`): Clack & Co., the problem (finding the best advertising strategy), the decision (the budget split), and the data — five tables with counts pulled from the API.
2. **Data** (`/data` + phpMyAdmin at `http://localhost:8080`): five related tables with 50+ records each — add, edit, or delete a product to show CRUD persisting to MySQL.
3. **Descriptive** (`/descriptive`): KPIs, weekly trend, channel comparison, statistics, correlation matrix. Show the date/channel filters refetching without a reload.
4. **Predictive** (`/predictive`): the regression card (R² = 0.67, each extra ₱1,000 spend ≈ ₱4,021 revenue at a fixed discount), actual vs predicted, the 4-week forecast, and a live prediction (spend ₱25,000, discount 10% ⇒ ≈ ₱94,000).
5. **Prescriptive** (`/prescriptive`): ROI ranking (Discord 3.34 > TikTok 3.06 > Facebook 2.87 > Pop-ups 2.31 per ₱1), allocate a budget live (₱100,000 ⇒ 40/40/10/10, +6.3% over an even split), move the what-if slider.
6. **BA process**: the connected Descriptive → Predictive → Prescriptive cards on the Case Study page — findings generated from the data, arrows showing what each step hands to the next.
7. **Rating Sheet** (`/rating-sheet`): Print / Save as PDF hands over the sheet.
8. **Limitations**: 52 weeks of seed data, linear model valid only inside the observed ranges, forecast is a straight-line trend, projections assume the data-generating behavior continues.

## Questions the professor might ask

- **Why linear regression?** It answers the decision directly: "how much revenue for a given spend and discount?" With 52 weeks of data it is estimable and explainable — each coefficient has a peso meaning, and goodness of fit (R², adjusted R², RMSE) is quantified.
- **What does R² mean here?** About 67% of the week-to-week variance in revenue is explained by spend and the discount level together; the rest is weekly noise, priced at RMSE ≈ ₱8,321 per week.
- **How does the allocation rule work?** Every channel starts at the minimum share (10%), leftover budget goes to the best-ROI channel first and up to its cap (40%), then the next. Caps matter because the revenue model is linear in spend — without them the "optimal" split would put 100% in one channel, which is unrealistic.
- **How do the three steps connect?** Descriptive finds the best channel by return per peso and hands the weekly series to Predictive; Predictive hands the fitted spend effect and disqualifies nothing — Prescriptive combines the ROI ranking and the model to produce the recommended split.
- **How is database integration shown?** Laravel reads MySQL via Eloquent (five FK-related tables, orphans prevented by constraints); the frontend only talks to the REST API — refresh the dashboard and every chart refetches.
- **Who contributed what?** Suggested split (see About): John Niño P. Amba — database, seeding, backend API; Juvert N. Genabe — analytics logic and Case Study; Danfred Ando — frontend, charts, Rating Sheet. Editable on the Rating Sheet.

## Status

All seven phases complete: Dockerized Laravel 12 + MySQL backend with a deterministic seed (five tables, 60/55/52/300/1071 records), full CRUD API + Data Manager page, and three analytics layers — Descriptive (7 endpoints + Dashboard/Descriptive pages), Predictive (from-scratch regression engine, /model, /actual-vs-predicted, /forecast, /predict + Predictive page), Prescriptive (channel ROI, capped budget allocator, what-if, generated recommendations + Prescriptive page) — plus the Case Study page with the connected BA-process flow, the printable Rating Sheet, and the About page. 30 backend tests pass; the frontend type-checks clean (`npx tsc`) and every page has loading, empty, and error states.
