-- ==============================================================================
-- 🔒 CHIRO UI — SECURITY ENFORCEMENT & INTEGRITY NOTICE
-- ==============================================================================
-- Direct unauthenticated execution from raw GitHub is permanently disabled.
-- Source code is dynamically delivered via encrypted server-side payload delivery.
--
-- To execute Chiro UI with your license key, use the official protected loader:
--
-- getgenv().Key = "YOUR_CHIRO_KEY"
-- loadstring(game:HttpGet("https://raw.githubusercontent.com/leviiexesc/chiro_UI/main/chiro_loader.lua"))()
--
-- Or via direct server endpoint:
-- loadstring(game:HttpGet("https://chiro-license-center.onrender.com/api/v1/client/loader"))()
-- ==============================================================================

local StarterGui = game:GetService("StarterGui")
pcall(function()
    StarterGui:SetCore("SendNotification", {
        Title = "Chiro Security",
        Text = "Direct GitHub loading is disabled! Please use chiro_loader.lua.",
        Duration = 10,
    })
end)

error("[CHIRO SECURITY] Direct raw GitHub execution is disabled. Use chiro_loader.lua with a valid license key.")
