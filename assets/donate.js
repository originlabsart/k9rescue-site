/* K9 Rescue donate widget. Builds a SOL or USDC transfer to K9 Rescue's wallet in the browser and hands it to the
   donor's own wallet to sign and send; this site never holds keys or funds.
   - Desktop: finds wallets through the Wallet Standard (Phantom, Solflare, Backpack, Trust, Jupiter...) with a
     fallback to the older window.phantom / window.solflare providers.
   - Phone or no wallet: the label's barcode is a live Solana Pay QR (amount filled in), plus a Solana Pay link and
     "open this page inside Phantom / Solflare" links.
   @solana/web3.js is vendored and only loaded when someone actually starts a donation. */
(() => {
  const C = window.K9 || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $("[data-dw]");
  if (!root) return;

  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const ATA_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  const TOKENS = {
    SOL: { presets: [0.1, 0.25, 0.5, 1], min: 0.001, decimals: 9, start: 0.25 },
    USDC: { presets: [10, 25, 50, 100], min: 1, decimals: 6, start: 25 },
  };
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const state = { token: "SOL", amount: TOKENS.SOL.start, solUsd: 0 };

  /* ------------------------------------------------ amount UI */
  const presetsEl = $("[data-presets]", root), input = $("[data-amount-input]", root), unit = $("[data-unit]", root);
  const impact = $("[data-impact]", root), go = $("[data-dw-go]", root);
  const fmtAmt = (n) => (state.token === "SOL" ? String(+n.toFixed(4)) : String(+n.toFixed(2)));

  function drawPresets() {
    const t = TOKENS[state.token];
    presetsEl.innerHTML = t.presets.map((v) => `<button type="button" data-v="${v}">${v}</button>`).join("");
    $$("button", presetsEl).forEach((b) => b.addEventListener("click", () => { input.value = ""; setAmount(Number(b.dataset.v)); }));
    unit.textContent = state.token;
    input.placeholder = "Other";
    markPreset();
  }
  function markPreset() {
    $$("button", presetsEl).forEach((b) => b.classList.toggle("on", !input.value && Number(b.dataset.v) === state.amount));
  }
  function setAmount(v) {
    state.amount = v > 0 ? v : 0;
    markPreset(); drawImpact(); updateSolPay();
  }
  function usdValue() { return state.token === "USDC" ? state.amount : state.amount * (state.solUsd || 0); }
  function drawImpact() {
    const t = TOKENS[state.token];
    if (!state.amount) { impact.innerHTML = "Pick or type an amount."; go.disabled = true; return; }
    if (state.amount < t.min) { impact.innerHTML = `The smallest drop is ${t.min} ${state.token}.`; go.disabled = true; return; }
    go.disabled = false;
    const u = usdValue();
    if (!u) { impact.innerHTML = `${fmtAmt(state.amount)} ${state.token} for K9 Rescue.`; return; }
    const bags = u / (C.FOOD_BAG_USD || 11);
    const what = bags >= 2 ? `<b>${Math.floor(bags)} × 10kg bags of feed</b>`
      : bags >= 1 ? `<b>1 × 10kg bag of feed</b>`
      : `<b>part of a 10kg bag of feed</b>`;
    impact.innerHTML = `≈ $${u.toLocaleString("en-US", { maximumFractionDigits: u < 10 ? 2 : 0 })} · ${what} for frontline strays`;
  }
  input.addEventListener("input", () => {
    const v = Number(input.value.replace(",", ".").replace(/[^\d.]/g, ""));
    setAmount(Number.isFinite(v) ? v : 0);
  });
  $$("[data-token]", root).forEach((b) => b.addEventListener("click", () => {
    if (state.token === b.dataset.token) return;
    state.token = b.dataset.token;
    $$("[data-token]", root).forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    input.value = "";
    drawPresets(); setAmount(TOKENS[state.token].start);
  }));
  document.addEventListener("k9:stats", (e) => { state.solUsd = e.detail.solUsd || state.solUsd; drawImpact(); });
  if (window.K9_STATS) state.solUsd = window.K9_STATS.solUsd || 0;

  /* ------------------------------------------------ Solana Pay link + QR (any phone wallet) */
  const solPayLink = $("[data-solpay]", root);
  function solPayUrl() {
    const q = new URLSearchParams();
    if (state.amount > 0) q.set("amount", fmtAmt(state.amount));
    if (state.token === "USDC") q.set("spl-token", USDC_MINT);
    q.set("label", "K9 Rescue");
    q.set("message", "Thank you for helping K9 Rescue's dogs");
    return `solana:${C.WALLET}?${q.toString().replace(/\+/g, "%20")}`;
  }
  let qrT;
  function updateSolPay() {
    solPayLink.href = solPayUrl();
    clearTimeout(qrT); qrT = setTimeout(drawQr, 120);     // the label's barcode follows the amount
  }
  // On a computer a solana: link usually goes nowhere, so point at the barcode instead.
  solPayLink.addEventListener("click", (e) => {
    if (isMobile) return;
    e.preventDefault();
    const box = $("[data-qr]", root);
    box.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 500 });
    window.k9Toast && window.k9Toast("Scan the code on the label with your phone's wallet");
  });
  function drawQr() {
    const box = $("[data-qr]", root);
    box.innerHTML = "";
    if (window.QRCode) new QRCode(box, { text: solPayUrl(), width: 360, height: 360, colorDark: "#15110C", colorLight: "#FFFFFF", correctLevel: QRCode.CorrectLevel.M });
  }

  // Every label gets a drop number; it moves on after each drop sent from this browser.
  const dropEl = $("[data-drop-no]", root);
  let dropNo = 1000 + Math.floor(Math.random() * 8000);
  const showDrop = () => (dropEl.textContent = String(dropNo).padStart(4, "0"));
  showDrop();

  /* ------------------------------------------------ panels */
  function showPanel(name) {
    $$("[data-panel]", root).forEach((p) => (p.hidden = p.dataset.panel !== name));
  }
  const hidePanels = () => $$("[data-panel]", root).forEach((p) => (p.hidden = true));
  $$("[data-dw-back]", root).forEach((b) => b.addEventListener("click", hidePanels));

  /* ------------------------------------------------ wallet discovery */
  const wallets = [];
  const canSend = (w) => w.features && w.features["standard:connect"] && w.features["solana:signAndSendTransaction"]
    && (w.chains || []).some((c) => c.startsWith("solana:"));
  const api = Object.freeze({
    register(...ws) {
      for (const w of ws) if (canSend(w) && !wallets.some((x) => x.name === w.name)) wallets.push(w);
      queueMicrotask(drawWallets); // wallets can register while this script is still running
      return () => {};
    },
  });
  addEventListener("wallet-standard:register-wallet", (e) => { try { e.detail(api); } catch { /* a wallet that misbehaves */ } });
  try { dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: api })); } catch { /* old browser */ }

  function legacyWallets() {
    const out = [];
    const ph = window.phantom && window.phantom.solana;
    if (ph && ph.isPhantom) out.push({ name: "Phantom", icon: "", legacy: ph });
    if (window.solflare && window.solflare.isSolflare) out.push({ name: "Solflare", icon: "", legacy: window.solflare });
    if (window.backpack && window.backpack.isBackpack) out.push({ name: "Backpack", icon: "", legacy: window.backpack });
    return out.filter((l) => !wallets.some((w) => w.name.toLowerCase().startsWith(l.name.toLowerCase())));
  }
  const allWallets = () => [...wallets, ...legacyWallets()];

  function drawWallets() {
    const list = $("[data-wallet-list]", root);
    if (!list) return;
    const ws = allWallets();
    list.innerHTML = "";
    for (const w of ws) {
      const b = document.createElement("button");
      b.type = "button";
      const img = document.createElement("img");
      img.alt = ""; img.src = w.icon || "assets/brand/favicon-48.png";
      const name = document.createElement("span"); name.textContent = w.name;
      const tag = document.createElement("small"); tag.textContent = "Detected";
      b.append(img, name, tag);
      b.addEventListener("click", () => donateWith(w));
      list.appendChild(b);
    }
    $("[data-nowallet]", root).hidden = ws.length > 0;
  }

  // Open this page inside a mobile wallet's own browser, where the wallet is injected.
  const here = () => location.href.split("#")[0] + "#give";
  $("[data-open-phantom]", root).href = `https://phantom.app/ul/browse/${encodeURIComponent(here())}?ref=${encodeURIComponent(location.origin)}`;
  $("[data-open-solflare]", root).href = `https://solflare.com/ul/v1/browse/${encodeURIComponent(here())}?ref=${encodeURIComponent(location.origin)}`;

  go.addEventListener("click", () => {
    if (go.disabled) return;
    const ws = allWallets();
    if (ws.length === 1) return donateWith(ws[0]);
    drawWallets();
    showPanel("wallets");
  });

  /* ------------------------------------------------ chain helpers */
  let web3P;
  function loadWeb3() {
    if (window.solanaWeb3) return Promise.resolve(window.solanaWeb3);
    if (!web3P) web3P = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "assets/vendor/solana-web3-1.98.0.iife.min.js";
      s.onload = () => res(window.solanaWeb3);
      s.onerror = () => { web3P = null; rej(new Error("Couldn't load the Solana library. Check your connection and try again.")); };
      document.head.appendChild(s);
    });
    return web3P;
  }
  // Warm the library up once the widget scrolls into view, so the first click is instant.
  new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { loadWeb3().catch(() => {}); o.disconnect(); } }, { rootMargin: "300px" }).observe(root);

  async function rpc(method, params) {
    const r = await fetch(C.RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message || method);
    return j.result;
  }
  async function blockhash() {
    try {
      const r = await fetch(C.BLOCKHASH_URL, { cache: "no-store" });
      const j = await r.json();
      if (j.blockhash) return j;
    } catch { /* fall back to the public RPC */ }
    return (await rpc("getLatestBlockhash", [{ commitment: "confirmed" }])).value;
  }

  function u64le(n) {
    const b = new Uint8Array(8);
    let x = BigInt(n);
    for (let i = 0; i < 8; i++) { b[i] = Number(x & 0xffn); x >>= 8n; }
    return b;
  }
  const units = (amount, decimals) => BigInt(Math.round(amount * 10 ** decimals));

  async function buildTx(web3, from) {
    const to = new web3.PublicKey(C.WALLET);
    const { blockhash: bh, lastValidBlockHeight } = await blockhash();
    const tx = new web3.Transaction({ feePayer: from, blockhash: bh, lastValidBlockHeight });
    if (state.token === "SOL") {
      // System Program Transfer: [u32 LE 2, u64 LE lamports]. Encoded by hand because web3.js's own encoder
      // reaches for a global Buffer, which browsers don't have.
      const data = new Uint8Array(12);
      data[0] = 2; data.set(u64le(units(state.amount, 9)), 4);
      tx.add(new web3.TransactionInstruction({
        programId: web3.SystemProgram.programId, data,
        keys: [{ pubkey: from, isSigner: true, isWritable: true }, { pubkey: to, isSigner: false, isWritable: true }],
      }));
      return tx;
    }
    const mint = new web3.PublicKey(USDC_MINT), tp = new web3.PublicKey(TOKEN_PROGRAM), ap = new web3.PublicKey(ATA_PROGRAM);
    const ata = (owner) => web3.PublicKey.findProgramAddressSync([owner.toBuffer(), tp.toBuffer(), mint.toBuffer()], ap)[0];
    const src = ata(from), dst = ata(to);
    // Create K9 Rescue's USDC account if it doesn't exist yet (idempotent: a no-op when it does).
    tx.add(new web3.TransactionInstruction({
      programId: ap, data: Uint8Array.of(1),
      keys: [
        { pubkey: from, isSigner: true, isWritable: true },
        { pubkey: dst, isSigner: false, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: false },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: tp, isSigner: false, isWritable: false },
      ],
    }));
    // TransferChecked: [12, amount u64 LE, decimals]
    const data = new Uint8Array(10);
    data[0] = 12; data.set(u64le(units(state.amount, 6)), 1); data[9] = 6;
    tx.add(new web3.TransactionInstruction({
      programId: tp, data,
      keys: [
        { pubkey: src, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: dst, isSigner: false, isWritable: true },
        { pubkey: from, isSigner: true, isWritable: false },
      ],
    }));
    return tx;
  }

  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  function b58(bytes) {
    let n = 0n;
    for (const b of bytes) n = n * 256n + BigInt(b);
    let s = "";
    while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
    for (const b of bytes) { if (b === 0) s = "1" + s; else break; }
    return s;
  }

  async function confirm(sig) {
    for (let i = 0; i < 45; i++) {
      try {
        const r = await rpc("getSignatureStatuses", [[sig], { searchTransactionHistory: false }]);
        const st = r && r.value && r.value[0];
        if (st && st.err) throw Object.assign(new Error("The network rejected the transaction."), { onchain: true });
        if (st && (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized")) return true;
      } catch (e) { if (e.onchain) throw e; }
      await sleep(1500);
    }
    return false;
  }

  /* ------------------------------------------------ the donation */
  const st = { h: $("[data-st-h]", root), p: $("[data-st-p]", root), spin: $("[data-spin]", root), act: $("[data-st-actions]", root) };
  // mode: "" = working (spinner); "done" / "fail" swap the spinner for a rubber stamp reading `stamp`.
  function status(h, p, mode, actions = "", stamp = "") {
    showPanel("status");
    st.h.textContent = h; st.p.innerHTML = p;
    st.spin.className = "spin" + (mode ? " " + mode : "");
    st.spin.dataset.stamp = stamp;
    st.act.innerHTML = actions;
    $$("[data-again]", st.act).forEach((b) => b.addEventListener("click", hidePanels));
  }
  const again = (label = "Done") => `<button type="button" data-again>${label}</button>`;

  function friendly(e) {
    const m = String((e && (e.message || e)) || "");
    if (e && (e.code === 4001 || /reject|denied|cancel|declined|closed/i.test(m))) return null; // they said no
    if (/insufficient|0x1\b|debit an account|no record of a prior credit/i.test(m))
      return `Your wallet doesn't have enough ${state.token} for this gift plus the network fee.`;
    return m.length > 160 ? m.slice(0, 160) + "…" : m || "Something went wrong.";
  }

  async function donateWith(w) {
    const amount = state.amount, token = state.token;
    status("Connecting…", `Opening ${w.name}.`);
    try {
      const web3 = await loadWeb3();
      let from, send;
      if (w.legacy) {
        const p = w.legacy;
        const r = await p.connect();
        from = new web3.PublicKey(String((r && r.publicKey) || p.publicKey));
        send = async (tx) => { const out = await p.signAndSendTransaction(tx); return typeof out === "string" ? out : out.signature; };
      } else {
        const { accounts } = await w.features["standard:connect"].connect();
        const acc = (accounts || []).find((a) => (a.chains || []).includes("solana:mainnet")) || (accounts || [])[0];
        if (!acc) throw new Error("No account was shared by the wallet.");
        from = new web3.PublicKey(acc.address);
        send = async (tx) => {
          const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
          const [out] = await w.features["solana:signAndSendTransaction"].signAndSendTransaction({ account: acc, transaction: bytes, chain: "solana:mainnet" });
          return typeof out.signature === "string" ? out.signature : b58(out.signature);
        };
      }
      const tx = await buildTx(web3, from);
      status("Approve in your wallet", `${amount} ${token} to K9 Rescue. Check the amount and approve.`);
      const sig = await send(tx);
      const link = `https://solscan.io/tx/${sig}`;
      status("Sending…", `Your gift is on its way. <a href="${link}" target="_blank" rel="noopener">View on Solscan</a>`);
      const ok = await confirm(sig);
      window.k9AddMine && window.k9AddMine({ sig, time: Math.floor(Date.now() / 1000), sol: token === "SOL" ? amount : 0, usdc: token === "USDC" ? amount : 0, from: from.toBase58(), kind: "donation", mine: true });
      const share = shareLink(amount, token);
      const drop = String(dropNo).padStart(4, "0");
      dropNo += 1; showDrop();
      if (ok) {
        status(`Drop № ${drop} delivered`, `${amount} ${token} just reached K9 Rescue. That's real food and real vet care for dogs who had nobody.`, "done",
          `<a class="primary" href="${share}" target="_blank" rel="noopener">Share on X</a><a href="${link}" target="_blank" rel="noopener">Receipt ↗</a>${again("Send another")}`, "Sent");
        celebrate();
      } else {
        status(`Drop № ${drop} on its way`, `Sent, and still confirming. It usually takes a few seconds more. <a href="${link}" target="_blank" rel="noopener">Check it on Solscan</a>`, "done",
          `<a class="primary" href="${share}" target="_blank" rel="noopener">Share on X</a>${again()}`, "Sent");
      }
    } catch (e) {
      const msg = friendly(e);
      if (msg === null) { status("Nothing sent", "No problem. The label is still here when you're ready.", "fail", again("Back to the label"), "Cancelled"); return; }
      status("That didn't go through", msg + " Nothing was taken from your wallet unless Solscan shows it.", "fail", again("Try again"), "Not sent");
    }
  }

  function shareLink(amount, token) {
    const url = C.SITE_URL || location.origin + location.pathname;
    const text = `I just gave ${amount} ${token} to @k9_rescue for the forgotten dogs of Ukraine and Eastern Europe. Every gift is public on-chain 🐾`;
    return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }

  function celebrate() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = root.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.3;
    for (let i = 0; i < 26; i++) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("class", "paw-burst");
      s.innerHTML = '<use href="#paw"/>';
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
      s.style.left = cx + "px"; s.style.top = cy + "px";
      s.style.setProperty("--dx", `${Math.cos(a) * d}px`);
      s.style.setProperty("--dy", `${Math.sin(a) * d - 80}px`);
      s.style.setProperty("--rot", `${(Math.random() - 0.5) * 120}deg`);
      if (i % 3 === 0) s.style.fill = "#ED6967";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1700);
    }
  }

  drawPresets();
  setAmount(state.amount);
})();
