/* Everything you're likely to change lives here. */
window.K9 = {
  // Live ledger API (Cloudflare Pages project in ../tracker/ledger-pages). Returns balance, gifts and creator-reward totals.
  TRACKER_URL: "https://k9rescue-ledger.pages.dev/stats",
  REFRESH_SECONDS: 60,

  // The donate widget builds the transfer in the browser and the donor's own wallet signs and sends it.
  // It needs a recent blockhash (worker first, public RPC as fallback) and an RPC to watch for confirmation.
  BLOCKHASH_URL: "https://k9rescue-ledger.pages.dev/blockhash",
  RPC_URL: "https://solana-rpc.publicnode.com",

  // K9 Rescue's published Solana wallet for memecoin projects (Trust Wallet, k9-rescue.org/donate-bitcoin).
  // Self-custody, so SOL, USDC and SPL tokens all land and stay visible on-chain.
  WALLET: "DBcrNadUAmxUXSacsjHSZSeGnUjTPdivZaY8mjwuCbyE",

  // The coin. Fill in at launch; until MINT is set the buy buttons read "Launching soon".
  COIN_NAME: "K9 Rescue",
  TICKER: "K9",              // placeholder: agree the ticker with K9 Rescue
  MINT: "",                  // contract address once launched
  BUY_URL: "",               // e.g. the coin's page on a DEX or launchpad
  CHART_URL: "",             // e.g. DexScreener link

  // Optional campaign goal shown as a progress bar (in SOL sent by the coin). 0 hides it.
  GOAL_SOL: 0,
  GOAL_LABEL: "towards the next frontline spay mission",

  // K9 Rescue's own figure: "£8 / $11 buys a 10kg bag" of feed. Used for the widget's "what it buys" line.
  FOOD_BAG_USD: 11,

  // Address used in share links ("I just gave ... to @k9_rescue").
  SITE_URL: "https://k9rescuecommunity.com",

  K9_SITE: "https://k9-rescue.org",
};
