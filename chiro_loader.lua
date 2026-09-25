-- ══════════════════════════════════════════════════════════════
--  Chiro UI v8 — External Loader
--  Usage:
--    1. Set your license key on the getgenv().Key line below
--    2. Run this script in your executor
-- ══════════════════════════════════════════════════════════════

repeat task.wait() until game:IsLoaded() and game.Players.LocalPlayer

getgenv().Key = "CHIRO-XXXX-XXXX-XXXX"  -- ← Replace with your license key

loadstring(game:HttpGet("https://raw.githubusercontent.com/leviiexesc/chiro_UI/main/chiro_v8.luau"))()
