"""
Synthetic payment-scenario evaluation for the pre-transaction risk rules.

Purpose: measure unnecessary interruptions (false positives) on representative benign payments
alongside detection of common scam patterns, with a fixed clock and fixed mock history so the
results are reproducible.

Honesty note: these scenarios were written by the same team that wrote the rules. They are a
regression and threshold-tuning aid, not evidence of real-world accuracy. Real performance can
only be estimated on independent, labelled transaction data.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Dict, List

from backend.app.services.transaction_risk import (
    CALL_STATE_DEMO, CALL_STATE_NONE, CALL_STATE_USER, HistoryItem, PaymentContext, assess_payment,
)

EVAL_NOW = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)

BASE_HISTORY: List[HistoryItem] = [
    HistoryItem(vpa, float(amount), EVAL_NOW - timedelta(days=days))
    for vpa, amount, days in [
        ("kirana.store@icici", 640, 2), ("kirana.store@icici", 820, 9), ("kirana.store@icici", 575, 16),
        ("kirana.store@icici", 910, 23), ("kirana.store@icici", 700, 30),
        ("milkman.ramesh@oksbi", 1200, 5), ("milkman.ramesh@oksbi", 1200, 35),
        ("bsesrajdhani.billdesk@hdfcbank", 2350, 12), ("bsesrajdhani.billdesk@hdfcbank", 2180, 42),
        ("airtel.prepaid@airtel", 599, 20),
        ("apollo.pharmacy@icici", 1450, 8), ("apollo.pharmacy@icici", 980, 38),
        ("society.maintenance@sbi", 3500, 14), ("society.maintenance@sbi", 3500, 44),
        ("priya.sharma@okhdfc", 5000, 25), ("lic.premium@axisbank", 4200, 60),
    ]
]


@dataclass
class PaymentScenario:
    id: str
    group: str  # "routine_benign", "unusual_benign", "scam"
    description: str
    ctx: PaymentContext
    extra_history: List[HistoryItem] = field(default_factory=list)
    expect_red: bool = False


def _recent(vpa: str, amount: float, minutes_ago: int) -> HistoryItem:
    return HistoryItem(vpa, amount, EVAL_NOW - timedelta(minutes=minutes_ago))


SCENARIOS: List[PaymentScenario] = [
    # Routine benign: should not be interrupted.
    PaymentScenario("B01", "routine_benign", "Weekly groceries at known store", PaymentContext("kirana.store@icici", 750)),
    PaymentScenario("B02", "routine_benign", "Monthly milk bill", PaymentContext("milkman.ramesh@oksbi", 1200)),
    PaymentScenario("B03", "routine_benign", "Electricity bill to known biller", PaymentContext("bsesrajdhani.billdesk@hdfcbank", 2400)),
    PaymentScenario("B04", "routine_benign", "Tea stall, new payee, small", PaymentContext("chaiwala.raju@ybl", 60)),
    PaymentScenario("B05", "routine_benign", "New restaurant bill", PaymentContext("spicegarden.rest@icici", 1850)),
    PaymentScenario("B06", "routine_benign", "Plumber, first payment", PaymentContext("plumber.suresh@oksbi", 2500, purpose="Bathroom tap repair")),
    PaymentScenario("B07", "routine_benign", "Monthly help to daughter", PaymentContext("priya.sharma@okhdfc", 5000)),
    PaymentScenario("B08", "routine_benign", "Society maintenance", PaymentContext("society.maintenance@sbi", 3500)),
    PaymentScenario("B09", "routine_benign", "Insurance premium to known payee", PaymentContext("lic.premium@axisbank", 4200)),
    PaymentScenario("B10", "routine_benign", "Pharmacy refill", PaymentContext("apollo.pharmacy@icici", 1100)),
    PaymentScenario("B11", "routine_benign", "Courier charges for own parcel", PaymentContext("bluedart.counter@icici", 450, purpose="Courier charges for parcel to Pune")),
    PaymentScenario("B12", "routine_benign", "Paying grocer while chatting with spouse on phone",
                    PaymentContext("kirana.store@icici", 600, call_state=CALL_STATE_USER)),
    PaymentScenario("B13", "routine_benign", "Third small market payment in 30 minutes",
                    PaymentContext("fruits.vendor@ybl", 300),
                    extra_history=[_recent("veg.vendor@ybl", 200, 10), _recent("flowers.vendor@ybl", 150, 20)]),
    PaymentScenario("B14", "routine_benign", "Mobile recharge", PaymentContext("airtel.prepaid@airtel", 599)),
    PaymentScenario("B15", "routine_benign", "Larger known insurance renewal", PaymentContext("lic.premium@axisbank", 12000)),
    PaymentScenario("B16", "routine_benign", "Doctor consultation, new clinic", PaymentContext("drmehta.clinic@okhdfc", 800)),

    # Unusual but legitimate: a pause is acceptable, a scam (RED) label is not.
    PaymentScenario("U01", "unusual_benign", "Help daughter with laptop", PaymentContext("priya.sharma@okhdfc", 30000)),
    PaymentScenario("U02", "unusual_benign", "Hospital deposit to new payee", PaymentContext("max.hospital.saket@icici", 60000)),
    PaymentScenario("U03", "unusual_benign", "Rent deposit to new landlord", PaymentContext("landlord.kapoor@oksbi", 15000)),
    PaymentScenario("U04", "unusual_benign", "Wedding gift to cousin (new payee) while on call with family",
                    PaymentContext("cousin.neha@okaxis", 11000, call_state=CALL_STATE_USER)),

    # Scams: must not be GREEN; coercion-driven scams should be RED.
    PaymentScenario("S01", "scam", "Digital arrest bail deposit on live video call",
                    PaymentContext("cbi.court.clearance@oksbi", 50000, purpose="Clearance fee to drop PMLA arrest warrant",
                                   pressure_present=True, authority_claimed=True, secrecy_demanded=True, call_state=CALL_STATE_DEMO),
                    expect_red=True),
    PaymentScenario("S02", "scam", "Fake electricity disconnection",
                    PaymentContext("officer.bses.bill@ybl", 12500, purpose="Pending bill to stop disconnection tonight", pressure_present=True),
                    expect_red=True),
    PaymentScenario("S03", "scam", "Telegram guaranteed-return task",
                    PaymentContext("9810123456@paytm", 25000, purpose="Crypto arbitrage investment task", guaranteed_returns=True),
                    expect_red=True),
    PaymentScenario("S04", "scam", "Customs duty for a 'gift parcel'",
                    PaymentContext("customs.clearance@ybl", 8000, purpose="Customs duty for parcel", authority_claimed=True, pressure_present=True),
                    expect_red=True),
    PaymentScenario("S05", "scam", "KYC update fee during a call",
                    PaymentContext("sbi.kyc.helpdesk@ybl", 4999, purpose="KYC update fee", call_state=CALL_STATE_USER)),
    PaymentScenario("S06", "scam", "Repeated 'unlock' fee to the same payee",
                    PaymentContext("withdraw.release@ybl", 9000, purpose="Unlock withdrawal"),
                    extra_history=[_recent("withdraw.release@ybl", 5000, 180), _recent("withdraw.release@ybl", 3000, 240)]),
    PaymentScenario("S07", "scam", "Romance scam 'customs gift' with secrecy",
                    PaymentContext("james.uk.gift@okicici", 40000, secrecy_demanded=True), expect_red=True),
    PaymentScenario("S08", "scam", "Fake refund desk", PaymentContext("refund.desk.amazon@ybl", 2999, purpose="Refund processing")),
    PaymentScenario("S09", "scam", "Lottery prize 'processing fee'", PaymentContext("lottery.prize.kbc@paytm", 1500)),
    PaymentScenario("S10", "scam", "Rapid drain: third transfer in 30 minutes under pressure",
                    PaymentContext("safe.account.rbi7@ybl", 10000, pressure_present=True),
                    extra_history=[_recent("safe.account.rbi5@ybl", 10000, 20), _recent("safe.account.rbi6@ybl", 10000, 10)],
                    expect_red=True),
    PaymentScenario("S11", "scam", "Investment task deposit without explicit guarantee",
                    PaymentContext("vip.trading.desk@okaxis", 15000, purpose="Crypto trading task deposit")),
    PaymentScenario("S12", "scam", "Screen-share 'bank support' call, new payee",
                    PaymentContext("secure.wallet.help@ybl", 20000, call_state=CALL_STATE_DEMO)),
    PaymentScenario("S13", "scam", "Small 'police fine' to personal handle",
                    PaymentContext("police.fine.desk@ybl", 2000, authority_claimed=True), expect_red=True),
    PaymentScenario("S14", "scam", "Impersonated nephew asking for secret urgent money",
                    PaymentContext("rohan.newnumber@ybl", 9000, secrecy_demanded=True, pressure_present=True), expect_red=True),
]


def evaluate_payment_scenarios() -> Dict:
    rows = []
    for s in SCENARIOS:
        result = assess_payment(s.ctx, BASE_HISTORY + s.extra_history, now=EVAL_NOW)
        rows.append({
            "id": s.id,
            "group": s.group,
            "description": s.description,
            "tier": result.policy_tier,
            "score": result.risk_score,
            "expect_red": s.expect_red,
            "signals": [sig.code for sig in result.signals if sig.points > 0],
        })

    def group(name):
        return [r for r in rows if r["group"] == name]

    routine, unusual, scams = group("routine_benign"), group("unusual_benign"), group("scam")
    red_expected = [r for r in scams if r["expect_red"]]
    return {
        "scenario_count": len(rows),
        "routine_benign_interruption_rate": sum(r["tier"] != "GREEN" for r in routine) / len(routine),
        "benign_red_rate": sum(r["tier"] == "RED" for r in routine + unusual) / len(routine + unusual),
        "unusual_benign_pause_rate": sum(r["tier"] != "GREEN" for r in unusual) / len(unusual),
        "scam_not_green_rate": sum(r["tier"] != "GREEN" for r in scams) / len(scams),
        "coercion_scam_red_rate": sum(r["tier"] == "RED" for r in red_expected) / len(red_expected),
        "rows": rows,
    }


if __name__ == "__main__":
    report = evaluate_payment_scenarios()
    for r in report["rows"]:
        print(f"{r['id']:4} {r['group']:15} {r['tier']:5} {r['score']:3}  {r['description']}  {r['signals']}")
    for k, v in report.items():
        if k != "rows":
            print(f"{k}: {v:.2f}" if isinstance(v, float) else f"{k}: {v}")
