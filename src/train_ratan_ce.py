"""Train RATAN-CE for all tickers, skipping already-completed ones."""
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import os, random, warnings
warnings.filterwarnings("ignore")

SEED = 25
np.random.seed(SEED); torch.manual_seed(SEED); random.seed(SEED)

ROOT       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TENSOR_DIR = os.path.join(ROOT, "data/features/ratan_tensors")
MODEL_DIR  = os.path.join(ROOT, "models")
ATTN_DIR   = os.path.join(ROOT, "data/features/attention_weights")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(ATTN_DIR,  exist_ok=True)

CORE_TICKERS = ["SPY", "AAPL", "MSFT", "JPM", "GLD"]
EPOCHS, LR, BATCH = 35, 3e-4, 64
DEVICE = torch.device("cpu")


class RATANDataset(Dataset):
    def __init__(self, path):
        d = torch.load(path, weights_only=False)
        self.feat   = d['features_seq'].float()
        self.regime = d['regime_seq'].long()
        self.corr   = d['denoised_corr'].float()
        self.vol    = d['vol_local'].float()
        self.labels = (d['target'].float() + 1).long()  # {-1,0,1}→{0,1,2}
    def __len__(self): return len(self.labels)
    def __getitem__(self, i):
        return self.feat[i], self.regime[i], self.corr[i], self.vol[i], self.labels[i]


class RegimeGatedConv(nn.Module):
    def __init__(self, n_feat=90, n_reg=3, hidden=192):
        super().__init__()
        self.c3 = nn.Conv1d(n_feat, hidden//3, 3, padding=1)
        self.c5 = nn.Conv1d(n_feat, hidden//3, 5, padding=2)
        self.c7 = nn.Conv1d(n_feat, hidden//3, 7, padding=3)
        self.gate = nn.Embedding(n_reg, hidden)
        self.norm = nn.LayerNorm(hidden)
    def forward(self, x, reg):
        xt = x.transpose(1, 2)
        c  = torch.cat([self.c3(xt), self.c5(xt), self.c7(xt)], 1).transpose(1, 2)
        g  = torch.sigmoid(self.gate(reg[:, -1])).unsqueeze(1)
        return self.norm(c * g)


class FeatureAttn(nn.Module):
    def __init__(self, hidden=192, n_feat=90):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(hidden, 128), nn.ReLU(), nn.Linear(128, n_feat))
    def forward(self, h):
        return F.softmax(self.net(h.mean(1)), dim=-1)


class RATAN_CE(nn.Module):
    def __init__(self, n_feat=90, n_cls=3, n_reg=3, hidden=192):
        super().__init__()
        self.rgc   = RegimeGatedConv(n_feat, n_reg, hidden)
        self.fattn = FeatureAttn(hidden, n_feat)
        self.cattn = nn.MultiheadAttention(hidden, 4, batch_first=True, dropout=0.1)
        self.head  = nn.Sequential(
            nn.Linear(hidden, 64), nn.ReLU(), nn.Dropout(0.3), nn.Linear(64, n_cls)
        )
    def forward(self, feat, reg, corr, vol):
        h     = self.rgc(feat, reg)
        h, _  = self.cattn(h, h, h)
        alpha  = self.fattn(h)
        logits = self.head(h.mean(1))
        return logits, alpha


results = {}

for ticker in CORE_TICKERS:
    alpha_path = os.path.join(ATTN_DIR, f"alpha_{ticker}.npy")
    if os.path.exists(alpha_path):
        print(f"[SKIP] {ticker} — attention weights already exported.")
        results[ticker] = {"skipped": True}
        continue

    print(f"\n{'='*50}\nTraining RATAN-CE → {ticker}")
    tr_ds = RATANDataset(os.path.join(TENSOR_DIR, f"{ticker}_train.pt"))
    te_ds = RATANDataset(os.path.join(TENSOR_DIR, f"{ticker}_test.pt"))
    tr_dl = DataLoader(tr_ds, batch_size=BATCH, shuffle=True,  drop_last=False)
    te_dl = DataLoader(te_ds, batch_size=BATCH, shuffle=False)

    counts = np.bincount(tr_ds.labels.numpy(), minlength=3).astype(float)
    wts    = torch.tensor(1.0 / (counts + 1e-8)).float()
    wts   /= wts.sum()

    model  = RATAN_CE().to(DEVICE)
    opt    = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    sched  = optim.lr_scheduler.CosineAnnealingLR(opt, EPOCHS)
    crit   = nn.CrossEntropyLoss(weight=wts.to(DEVICE))

    best_acc, best_state, no_imp = 0, None, 0
    patience = 8

    for ep in range(EPOCHS):
        model.train(); tr_loss = 0
        for feat, reg, corr, vol, lbl in tr_dl:
            feat, reg, corr, vol, lbl = [x.to(DEVICE) for x in [feat, reg, corr, vol, lbl]]
            opt.zero_grad()
            logits, _ = model(feat, reg, corr, vol)
            loss = crit(logits, lbl); loss.backward(); opt.step()
            tr_loss += loss.item()
        sched.step()

        model.eval(); correct = total = 0
        with torch.no_grad():
            for feat, reg, corr, vol, lbl in te_dl:
                feat, reg, corr, vol, lbl = [x.to(DEVICE) for x in [feat, reg, corr, vol, lbl]]
                preds = model(feat, reg, corr, vol)[0].argmax(1)
                correct += (preds == lbl).sum().item(); total += len(lbl)
        val_acc = correct / total

        if val_acc > best_acc:
            best_acc = val_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            no_imp = 0
        else:
            no_imp += 1

        if ep % 5 == 0 or no_imp == 0:
            print(f"  ep {ep+1:02d}  loss={tr_loss/len(tr_dl):.4f}  val={val_acc:.4f}  best={best_acc:.4f}")
        if no_imp >= patience:
            print(f"  Early stop at ep {ep+1}"); break

    model.load_state_dict(best_state)
    torch.save(model.state_dict(), os.path.join(MODEL_DIR, f"ratan_ce_{ticker}.pt"))

    # Export attention weights + probs
    model.eval()
    alphas, probs_all, true_all = [], [], []
    with torch.no_grad():
        for feat, reg, corr, vol, lbl in te_dl:
            feat, reg, corr, vol, lbl = [x.to(DEVICE) for x in [feat, reg, corr, vol, lbl]]
            logits, alpha = model(feat, reg, corr, vol)
            alphas.append(alpha.cpu().numpy())
            probs_all.append(F.softmax(logits, 1).cpu().numpy())
            true_all.append(lbl.cpu().numpy())

    alpha_np = np.concatenate(alphas)
    probs_np  = np.concatenate(probs_all)
    true_np   = np.concatenate(true_all)
    pred_np   = probs_np.argmax(1)

    acc = (pred_np == true_np).mean()
    mask = (true_np != 1) & (pred_np != 1)
    dir_acc = ((pred_np[mask] > 1) == (true_np[mask] > 1)).mean() if mask.sum() > 0 else 0.0

    np.save(os.path.join(ATTN_DIR, f"alpha_{ticker}.npy"),       alpha_np)
    np.save(os.path.join(ATTN_DIR, f"ratan_probs_{ticker}.npy"), probs_np)
    np.save(os.path.join(ATTN_DIR, f"true_labels_{ticker}.npy"), true_np)

    pred_dist = dict(zip(*[x.tolist() for x in np.unique(pred_np, return_counts=True)]))
    results[ticker] = {"accuracy": float(acc), "dir_accuracy": float(dir_acc), "n_test": len(true_np)}
    print(f"  → acc={acc:.4f}  dir_acc={dir_acc:.4f}  pred_dist={pred_dist}")

print("\n" + "="*60)
print(f"{'Ticker':<8} {'Accuracy':>10} {'Dir_Acc':>10}")
print("-"*32)
for t, r in results.items():
    if r.get("skipped"):
        a = np.load(os.path.join(ATTN_DIR, f"ratan_probs_{t}.npy"))
        tr = np.load(os.path.join(ATTN_DIR, f"true_labels_{t}.npy"))
        p = a.argmax(1)
        acc = (p == tr).mean()
        m = (tr != 1) & (p != 1)
        da = ((p[m] > 1) == (tr[m] > 1)).mean() if m.sum() > 0 else 0.0
        print(f"{t:<8} {acc:>10.4f} {da:>10.4f}  (loaded)")
    else:
        print(f"{t:<8} {r['accuracy']:>10.4f} {r['dir_accuracy']:>10.4f}")
print("="*60)
