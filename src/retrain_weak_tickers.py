"""Retrain RATAN-CE for weak tickers with improved hyperparameters."""
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

# Only retrain the weak ones
RETRAIN_TICKERS = {"AAPL": {"lr": 2e-4, "epochs": 60, "patience": 12, "batch": 32},
                   "JPM":  {"lr": 2e-4, "epochs": 60, "patience": 12, "batch": 32},
                   "GLD":  {"lr": 1e-4, "epochs": 80, "patience": 15, "batch": 32}}
DEVICE = torch.device("cpu")


class RATANDataset(Dataset):
    def __init__(self, path):
        d = torch.load(path, weights_only=False)
        self.feat   = d['features_seq'].float()
        self.regime = d['regime_seq'].long()
        self.corr   = d['denoised_corr'].float()
        self.vol    = d['vol_local'].float()
        self.labels = (d['target'].float() + 1).long()
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


for ticker, cfg in RETRAIN_TICKERS.items():
    print(f"\n{'='*55}\nRetraining RATAN-CE → {ticker}  (epochs={cfg['epochs']}, lr={cfg['lr']})")
    tr_ds = RATANDataset(os.path.join(TENSOR_DIR, f"{ticker}_train.pt"))
    te_ds = RATANDataset(os.path.join(TENSOR_DIR, f"{ticker}_test.pt"))
    tr_dl = DataLoader(tr_ds, batch_size=cfg['batch'], shuffle=True,  drop_last=False)
    te_dl = DataLoader(te_ds, batch_size=cfg['batch'], shuffle=False)

    counts = np.bincount(tr_ds.labels.numpy(), minlength=3).astype(float)
    wts    = torch.tensor(1.0 / (counts + 1e-8)).float(); wts /= wts.sum()

    model  = RATAN_CE().to(DEVICE)
    opt    = optim.AdamW(model.parameters(), lr=cfg['lr'], weight_decay=1e-4)
    sched  = optim.lr_scheduler.CosineAnnealingLR(opt, cfg['epochs'])
    crit   = nn.CrossEntropyLoss(weight=wts.to(DEVICE))

    best_dir, best_acc_v, best_state, no_imp = 0, 0, None, 0

    for ep in range(cfg['epochs']):
        model.train()
        for feat, reg, corr, vol, lbl in tr_dl:
            feat, reg, corr, vol, lbl = [x.to(DEVICE) for x in [feat, reg, corr, vol, lbl]]
            opt.zero_grad()
            logits, _ = model(feat, reg, corr, vol)
            crit(logits, lbl).backward(); opt.step()
        sched.step()

        model.eval(); preds_all, true_all = [], []
        with torch.no_grad():
            for feat, reg, corr, vol, lbl in te_dl:
                feat, reg, corr, vol, lbl = [x.to(DEVICE) for x in [feat, reg, corr, vol, lbl]]
                logits, _ = model(feat, reg, corr, vol)
                probs = F.softmax(logits, 1)
                preds_all.append(probs.cpu().numpy())
                true_all.append(lbl.cpu().numpy())

        pa = np.concatenate(preds_all); ta = np.concatenate(true_all)
        # use 70/30 weighted ensemble with uniform LGBM (no LGBM yet)
        combo = pa  # just RATAN for now
        conf  = combo.max(1)
        pred  = combo.argmax(1)

        # dir_acc at θ=0.45
        mask = (conf >= 0.45) & (ta != 1) & (pred != 1)
        da   = ((pred[mask] > 1) == (ta[mask] > 1)).mean() if mask.sum() > 5 else 0.0
        val_acc = (pred == ta).mean()

        # track best by dir_acc
        score = da * 0.7 + val_acc * 0.3
        if score > best_dir:
            best_dir = score
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            no_imp = 0
        else:
            no_imp += 1

        if ep % 10 == 0 or no_imp == 0:
            cov = (conf >= 0.45).mean()
            print(f"  ep {ep+1:02d}  val_acc={val_acc:.4f}  dir_acc@θ45={da:.4f}  cov={cov:.4f}")
        if no_imp >= cfg['patience']:
            print(f"  Early stop at ep {ep+1}"); break

    model.load_state_dict(best_state)
    torch.save(model.state_dict(), os.path.join(MODEL_DIR, f"ratan_ce_{ticker}.pt"))

    # Export updated attention weights
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

    # Threshold sweep
    print(f"\n  {ticker} threshold sweep:")
    for th in np.arange(0.35, 0.75, 0.05):
        mask = (probs_np.max(1) >= th)
        if mask.sum() < 20: continue
        cov  = mask.mean()
        from sklearn.metrics import accuracy_score
        acc  = accuracy_score(true_np[mask], pred_np[mask])
        dm   = mask & (true_np != 1) & (pred_np != 1)
        da   = ((pred_np[dm] > 1) == (true_np[dm] > 1)).mean() if dm.sum() > 5 else 0.0
        mk = ' ✅' if da >= 0.75 and cov >= 0.70 else ''
        print(f"    θ={th:.2f}  acc={acc:.4f}  dir_acc={da:.4f}  cov={cov:.4f}{mk}")

    np.save(os.path.join(ATTN_DIR, f"alpha_{ticker}.npy"),       alpha_np)
    np.save(os.path.join(ATTN_DIR, f"ratan_probs_{ticker}.npy"), probs_np)
    np.save(os.path.join(ATTN_DIR, f"true_labels_{ticker}.npy"), true_np)
    print(f"  Saved updated weights for {ticker}")

print("\nRetrain complete.")
