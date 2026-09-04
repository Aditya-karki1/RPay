"""
Return-risk scorer — synthetic data generation + logistic regression training.

Features
--------
order_total       : INR value of the order
return_rate       : user's historical return rate (returns / total_orders), 0–1
prev_returns      : count of prior returns by this user
total_orders      : total orders by this user
days_since_order  : 0–7 (days elapsed since order was placed)
num_items         : items in the order
is_first_order    : 1 if this is the user's very first order, else 0

Label
-----
1 = flag for manual review  |  0 = safe to auto-approve
"""

import json, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix,
    precision_score, recall_score, f1_score, roc_auc_score
)

RNG = np.random.default_rng(42)
N   = 3000

# ── 1. Generate synthetic users ──────────────────────────────────────────────
total_orders  = RNG.integers(1, 51, N)
prev_returns  = np.array([RNG.integers(0, min(t + 1, 12)) for t in total_orders])
return_rate   = np.where(total_orders > 1, prev_returns / total_orders, 0.0)
is_first_order = (total_orders == 1).astype(int)

_buckets = RNG.choice([0, 1, 2], size=N, p=[0.45, 0.35, 0.20])
_low  = RNG.integers(500,  3000,  N)
_mid  = RNG.integers(3000, 8000,  N)
_high = RNG.integers(8000, 25000, N)
order_total = np.where(_buckets == 0, _low, np.where(_buckets == 1, _mid, _high))

days_since_order = RNG.integers(0, 8, N)
num_items        = RNG.integers(1, 9, N)

# ── 2. Label logic (domain knowledge encoded as rules, then noise added) ─────
def compute_risk(i):
    score = 0
    if return_rate[i] > 0.40:              score += 35
    elif return_rate[i] > 0.25:            score += 18
    if order_total[i] > 12000:             score += 25
    elif order_total[i] > 7000:            score += 12
    if prev_returns[i] >= 3:               score += 30
    elif prev_returns[i] >= 2:             score += 15
    if is_first_order[i] and order_total[i] > 5000: score += 22
    if days_since_order[i] >= 6:           score += 10
    if num_items[i] >= 6:                  score += 8
    return 1 if score >= 45 else 0

labels = np.array([compute_risk(i) for i in range(N)])

# Add realistic label noise (~8%)
flip_mask = RNG.random(N) < 0.08
labels[flip_mask] = 1 - labels[flip_mask]

# ── 3. Build feature matrix ──────────────────────────────────────────────────
FEATURES = ['order_total', 'return_rate', 'prev_returns',
            'total_orders', 'days_since_order', 'num_items', 'is_first_order']

X = np.column_stack([
    order_total,
    return_rate,
    prev_returns,
    total_orders,
    days_since_order,
    num_items,
    is_first_order,
])

X_train, X_test, y_train, y_test = train_test_split(
    X, labels, test_size=0.2, random_state=42, stratify=labels
)

print(f"Training set : {len(X_train)} samples  ({y_train.mean()*100:.1f}% flagged)")
print(f"Test set     : {len(X_test)}  samples  ({y_test.mean()*100:.1f}% flagged)\n")

# ── 4. Train ─────────────────────────────────────────────────────────────────
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('clf',    LogisticRegression(C=1.0, class_weight='balanced', max_iter=500, random_state=42)),
])
pipe.fit(X_train, y_train)

# ── 5. Evaluate ──────────────────────────────────────────────────────────────
y_pred  = pipe.predict(X_test)
y_prob  = pipe.predict_proba(X_test)[:, 1]

print("── Test-set metrics ─────────────────────────────────────────────────")
print(classification_report(y_test, y_pred, target_names=['auto-approve', 'manual-review']))

cm = confusion_matrix(y_test, y_pred)
tn, fp, fn, tp = cm.ravel()
print(f"Confusion matrix  TN={tn}  FP={fp}  FN={fn}  TP={tp}")
print(f"Precision : {precision_score(y_test, y_pred):.3f}")
print(f"Recall    : {recall_score(y_test, y_pred):.3f}")
print(f"F1        : {f1_score(y_test, y_pred):.3f}")
print(f"ROC-AUC   : {roc_auc_score(y_test, y_prob):.3f}")
print(f"\nFalse-positive cost : {fp} genuine low-risk returns incorrectly flagged for manual review")
print(f"False-negative cost : {fn} risky returns that slipped through to auto-approve")

# ── 6. Export coefficients to JSON for pure-JS inference ─────────────────────
scaler = pipe.named_steps['scaler']
clf    = pipe.named_steps['clf']

model = {
    "features"     : FEATURES,
    "scaler_mean"  : scaler.mean_.tolist(),
    "scaler_scale" : scaler.scale_.tolist(),
    "coef"         : clf.coef_[0].tolist(),
    "intercept"    : float(clf.intercept_[0]),
    "threshold"    : 0.50,          # P(flag) >= threshold → manual review
    "metrics"      : {
        "precision" : round(float(precision_score(y_test, y_pred)), 3),
        "recall"    : round(float(recall_score(y_test, y_pred)), 3),
        "f1"        : round(float(f1_score(y_test, y_pred)), 3),
        "roc_auc"   : round(float(roc_auc_score(y_test, y_prob)), 3),
        "fp_cost"   : int(fp),
        "fn_cost"   : int(fn),
        "test_size" : int(len(X_test)),
    }
}

out = "server/ml/model.json"
with open(out, "w") as f:
    json.dump(model, f, indent=2)

print(f"\n✅  Model exported → {out}")
print("    Load it with scorer.js — no extra dependencies needed.")
