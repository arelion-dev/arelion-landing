---
title: "Life OS: a private dashboard for health, money and time"
date: "2026-07-30T18:45:00.000Z"
description: "One read-only page that aggregates health, net worth and the week ahead from separate SQLite databases I already own. About 350 lines of python stdlib, a React SPA, and no port open to the internet."
tags: ["Life OS", "Self-hosted", "React"]
private: true
---

**Life OS** is a single read-only page that pulls health, wealth and my week into one view, served only inside my private network, with **zero write paths and zero ports open to the internet**.

One question, "am I sleeping enough and can I afford to slow down", used to mean opening five things: a fitness app, two banking apps, a spreadsheet, and my notes. Each held a true fragment while none held the question, so every check-in cost fifteen minutes and I stopped bothering.

**All screenshots below run on mock data.** I wired the app to a fake API for this article. Every account name, balance, heart rate and calendar entry you see is invented. The interface is in French because I am the only user.

![The week view: calendar, follow-ups, focus items and open todos, aggregated from an ICS file and my notes vault](assets/week.png)

## The data already existed, the aggregation did not

I already had the pieces. A health service syncs Fitbit into `health.sqlite`, a wealth service ingests bank statements into `wealth.sqlite`, and my notes live in an Obsidian vault. Three services, each with its own owner and its own schema.

The tempting move is to build a fourth database that copies all of it. That's how you end up with a sync job to babysit and two numbers that disagree.

So I inverted it: **the dashboard owns no data at all.** It's a reader. Every domain database stays owned by the service that writes it, and the dashboard opens each one in read-only mode:

```python
def ro(db_path: str) -> sqlite3.Connection:
    """Connexion STRICTEMENT read-only. Toute ecriture leve OperationalError."""
    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con
```

That `?mode=ro` URI flag is the entire access control model for data. SQLite enforces it at the driver level, so a bug in my HTTP handler can't turn into a mutation.

The opinion: for personal infrastructure, a read-only view over databases somebody else owns beats a warehouse you have to keep in sync. The dashboard can be wrong about presentation, but it can't be wrong about the numbers, because it holds none of its own.

**Three databases, one page, zero copies of the data.**

The write path is separate and deliberate: I talk to a Telegram bot to log anything. **Telegram writes, the web reads.** No forms, no edit buttons, no CSRF surface, no accidental double entry from a phone in a pocket.

## The network is the authentication

There's no login screen and no session cookie. There's no password to leak either, because the server won't bind a public interface:

```python
def tailscale_ip() -> str:
    """IP Tailscale de la box. Fail loud si absente: on ne bind PAS 0.0.0.0."""
    try:
        ip = subprocess.check_output(["tailscale", "ip", "-4"], text=True).strip().splitlines()[0]
    except Exception as e:
        sys.exit(f"REFUS: pas d'IP Tailscale ({e}). On ne bind pas une interface publique.")
    if not ip or ip.startswith("0."):
        sys.exit(f"REFUS: IP Tailscale invalide ({ip!r}).")
    return ip
```

If Tailscale is down, the dashboard doesn't start. It won't fall back to localhost, and it won't helpfully bind everything either. A dashboard holding my medical and financial history should fail closed, and fail loudly.

The part I care about more is that **a test proves this on every commit**. My pre-commit script boots the real server on a scratch port and then runs a negative test: if `127.0.0.1` answers, the bind is too wide and the check fails.

```bash
# le bind doit etre Tailnet-only : localhost NE doit PAS repondre
if curl -sf "http://127.0.0.1:$PORT/api/ping" >/dev/null 2>&1; then
  fail "repond sur 127.0.0.1 -> bind trop large (pas Tailnet-only)"
fi

# read-only prouve, pas commente
python3 -c "
import sqlite3
c=sqlite3.connect('file:/opt/health/health.sqlite?mode=ro',uri=True)
try:
    c.execute('CREATE TABLE _probe(x)'); raise SystemExit('ECRITURE POSSIBLE')
except sqlite3.OperationalError: pass
" || fail \"la DB n'est PAS read-only\"
```

The same script greps the source for `INSERT`, `UPDATE`, `DELETE`, `DROP` and `ALTER` and refuses the commit if any appear. Read-only is a property I verify on every change.

## Numbers that decay must be computed at read time

Bank statements are snapshots. A mortgage balance keeps changing.

My first version stored the loan balance like any other account, from the last PDF statement. It was correct on the day of ingestion and wrong every day after. Worse, it was wrong in the one direction nobody questions: the debt looked bigger than it was, my net worth looked lower than reality, and the figure never moved, so nothing on the screen told me it was stale.

The fix was to stop storing the answer and store the anchor instead. The database keeps a balance, a date, a rate and a monthly payment. The API amortizes forward to today on every request:

```python
def amortized(loan):
    """Solde restant du AUJOURD'HUI, calcule par amortissement depuis l'ancrage."""
    anchor = date.fromisoformat(loan["anchor_date"])
    today = date.today()
    m = (today.year - anchor.year) * 12 + (today.month - anchor.month)
    if today.day < (loan["pay_day"] or 1):
        m -= 1
    m = max(0, m)
    r = (loan["rate_pct"] or 0) / 100 / 12
    bal, pay = loan["anchor_balance"], loan["monthly_payment"] or 0
    for _ in range(m):
        bal = max(0, bal - max(0, pay - bal * r))
    return round(bal, 2), m
```

Crypto gets the same treatment. Holdings store a quantity only, and the value is quantity multiplied by the latest price at read time. A stored valuation is a lie with a timestamp.

The loop is a few hundred iterations at worst and the whole request stays under a few milliseconds, so there's no reason to cache it. The opinion: **for a single-user dashboard, recompute everything on every request.** A cache here would only buy you staleness bugs.

![Net worth, allocation by asset class, and an explicit "still missing" panel for accounts with no statement yet](assets/wealth.png)

> **War story.** For two weeks my net worth was wrong by the price of an apartment while the screen looked perfectly healthy: the mortgage had a statement and counted as debt, the flat had no valuation row and counted as zero, so net worth silently became "assets minus a mortgage on an asset that does not exist". No error, no empty state, just a confident number hundreds of thousands too low. The fix is four lines:
>
> ```python
> property_missing = any(r["kind"] == "property" and eur(r) is None for r in rows)
> net_incomplete = debt_total > 0 and property_missing
> ```
>
> When that flag is true the front end paints the tile amber and labels it "incomplet" with the reason. A dashboard that can't say "I don't know" will eventually lie to you with a straight face. Every panel now carries its own completeness state: the wealth view shows a count of valued accounts out of total, and names the ones still missing.

## Every derived metric shows its formula

The health view has a Recovery score. Recovery scores are exactly the kind of number that becomes a black box you half trust and can't argue with. So the formula lives in about eight readable lines, and the ratio is clamped so one freak night can't swing the score:

```python
def _recovery(hrv_today, baseline, sleep_h, resting):
    """Recovery HRV-based (0-100) : 60% HRV vs baseline + 25% sommeil + 15% FC repos."""
    if not hrv_today or not baseline:
        return None
    ratio = max(0.6, min(1.4, hrv_today / baseline))
    hrv_norm = (ratio - 0.6) / 0.8 * 100
    sleep_norm = min(100, (sleep_h or 0) / 8 * 100)
    hr_norm = max(0, min(100, (70 - (resting or 60)) / 30 * 100))
    return round(0.6 * hrv_norm + 0.25 * sleep_norm + 0.15 * hr_norm)
```

Note the early `return None`. When there's no HRV data, the server returns nothing rather than guessing. The front end then falls back to a cruder sleep-plus-resting-heart-rate estimate and **labels the tile "proxy" instead of "HRV"**. The same panel is honest about the resting heart rate too: the device doesn't expose a true resting value, so the card carries a small `*proxy hr_min` chip.

Labelling a proxy costs one chip in the UI and saves you from trusting a number you invented.

![The health view. The "HRV" chip on Recovery means the score used real variability data. Without it the same tile reads "proxy"](assets/health.png)

## The API is 350 lines of stdlib, the dependencies live in the front end

The API is about 350 lines of python standard library. `http.server`, `sqlite3`, `json`, `re`. No framework and no ORM, nothing extra to patch on a machine I'd rather not babysit. The same handler serves the JSON endpoints and the compiled front end out of `web/dist`, with an index fallback for client-side routing.

The front end is where I spent the dependencies: React with Vite, Tailwind, Recharts for the charts, Framer Motion for the transitions, Lucide for icons. Four endpoints feed all of it: `/api/health`, `/api/wealth`, `/api/agenda`, `/api/rates`, plus `/api/ping` for the smoke test.

Aggregation that depends on a toggle happens in the browser rather than the API. The personal versus consolidated switch, the currency switch and the anonymous mode all recompute client side from one payload:

```ts
export function aggregate(accounts: WealthAccount[], includePro: boolean): Agg {
  const inScope = (a: WealthAccount) => a.scope === "perso" || (includePro && a.scope === "pro");
  const assets = accounts.filter((a) => inScope(a) && a.kind !== "debt" && a.amount_eur != null);
  const debts = accounts.filter((a) => inScope(a) && a.kind === "debt" && a.amount_eur != null);
  const brut = assets.reduce((s, a) => s + (a.amount_eur || 0), 0);
  const debt = debts.reduce((s, a) => s + (a.amount_eur || 0), 0);
  ...
}
```

One request, instant toggles, and an API that stays a dumb pipe. The opinion: push view-level aggregation to the client when the whole dataset is a few kilobytes. Every filter you move into the API becomes a query parameter you have to version.

![The allocation view breaks the same payload down by asset class and then by account, client side](assets/allocation.png)

The simulator reuses that aggregate as its starting point, so it holds no hardcoded figure. It won't render until the real wealth payload has loaded, which is why the projection always starts from the actual net worth rather than a placeholder.

![The projection simulator, seeded from live net worth. The summary line restates the maths in plain language before showing the chart](assets/simulate.png)

The Monte Carlo mode runs 500 paths in the browser with a deterministic engine: I supply mean return and volatility, it composes and reports percentiles. It predicts nothing. It only says what my own assumptions imply, which is the only honest thing a projection can do.

![500 paths, the p10 to p90 band, and the probability of hitting a target. The inputs are assumptions rather than forecasts](assets/montecarlo.png)

## The week view is a text parser, and that is fine

The agenda panel has the least impressive architecture and the highest daily value. A script on my laptop parses my notes vault with regular expressions, pulls focus items, open checkboxes and pending follow-ups, and pushes a JSON file to the box. The box parses a calendar ICS file for the next seven days and merges the two.

Recurring events are dropped on purpose. Standups and weekly syncs are noise on a "what is different this week" screen:

```python
for block in raw.split("BEGIN:VEVENT")[1:]:
    block = block.split("END:VEVENT")[0]
    if "RRULE" in block:  # recurrents = bruit (standups...), on saute
        continue
```

Regex over ICS is wrong in general. It works because I control the one calendar exporter, and the worst failure mode is a missing line on a page I look at daily. I wouldn't ship this for anyone else. For me it replaced a real product.

## Three limits I know about and have not fixed

**The tailnet is the whole perimeter.** Any device on my private network can read everything with no second factor. That is an accepted tradeoff for a single-user tool rather than a design I would hand to a family or a team. Adding real per-user auth means adding an identity store, which means adding a write path, which is the thing I removed on purpose.

**The static file guard uses a prefix check, which is the wrong comparison.** The handler resolves the requested path and compares it with `str(target).startswith(str(WEB_DIR))`. A sibling directory whose name starts with the same string would pass. It can't happen with my current layout, and it's still the wrong comparison. `Path.is_relative_to` is the correct one and it's on my list.

**The dashboard is coupled to schemas it does not own.** The queries are raw SQL strings against tables another service writes. If a column gets renamed, a chart goes blank at runtime with nothing failing at build time. The smoke test catches a totally broken payload but misses a quietly missing column.

## Who has this problem

Anyone whose truth is spread across systems that each hold a correct fragment and no view of the whole: an operator reading three SaaS dashboards to answer one question, a finance team reconciling a bank export against an internal ledger, an ops team where the answer exists in four tools and lives in nobody's head. The pattern transfers directly. Leave every system owning its own data, add a read-only reader over the top, compute the decaying numbers at read time, and make every panel say out loud when it doesn't know.
