-- ==============================================================================
-- ⚡ CHIRO UI v8.5 — CYBER HUB & GAME LAUNCHER
-- Modern Gen-Z UI Hub with Game Hub, Job ID Joiner, and Security Core
-- ==============================================================================

local Chiro = loadstring(game:HttpGet("https://raw.githubusercontent.com/leviiexesc/chiro_UI/main/chiro_lib.luau"))()

local Window = Chiro:CreateWindow({
    Title     = "CHIRO",
    SubTitle  = "v8.5 // GEN-Z CYBER",
    Tag       = "PRO",
    Logo      = "rbxassetid://10709775241",
    Theme     = "Cyberpunk",
    ToggleKey = Enum.KeyCode.RightShift,
    KeySystem = {
        Enabled     = true,
        ApiBase     = "https://chiro-license-center.onrender.com/api/v1/client",
        SaveKey     = true,
        KeyFile     = "chiro_license.key",
        ProductSlug = "chiro-pro-cyber",
    },
})

-- ── 1. MAIN TAB ──────────────────────────────────────────────
local MainTab = Window:CreateTab({ Name = "Main", Icon = "zap", Tag = "HOT" })

MainTab:CreateSection("Visual Enhancements")

MainTab:CreateDropdown({
    Name     = "Visual Graphics",
    Icon     = "palette",
    Tag      = "TOP",
    TagColor = Color3.fromRGB(0, 242, 254),
    Options  = { "Ultra High 4K", "Cinematic Cyber", "Optimized 60FPS", "Performance Low" },
    Default  = "Cinematic Cyber",
    Callback = function(choice)
        Chiro:Notify({ Title = "GRAPHICS CHANGED", Content = "Selected: " .. choice, Duration = 2 })
    end
})

MainTab:CreateMultiDropdown({
    Name     = "Active Visual Filters",
    Icon     = "box",
    Tag      = "MULTI",
    TagColor = Color3.fromRGB(168, 85, 247),
    Options  = { "Bloom Glow", "Motion Blur", "Anti-Aliasing", "Shadow Details", "Color Grading" },
    Default  = { "Bloom Glow", "Color Grading" },
    Callback = function(selectedList)
        Chiro:Notify({ Title = "FILTERS UPDATED", Content = "Active: " .. table.concat(selectedList, ", "), Duration = 2.5 })
    end
})

MainTab:CreateSection("Featured Controls")

MainTab:CreateButton({
    Name     = "Trigger Alert Notification",
    Icon     = "bell",
    Tag      = "NEW",
    TagColor = Color3.fromRGB(0, 242, 254),
    Label    = "Ping",
    Callback = function()
        Chiro:Notify({
            Title    = "SYSTEM ALERT",
            Content  = "Chiro UI v8.5 Cyber engine running at peak performance!",
            Kind     = "info",
            Duration = 3,
        })
    end
})

MainTab:CreateToggle({
    Name     = "Auto Farm Assist",
    Icon     = "activity",
    Default  = false,
    Callback = function(state)
        Chiro:Notify({ Title = "AUTO FARM", Content = state and "Enabled" or "Disabled", Duration = 2 })
    end
})

MainTab:CreateSlider({
    Name     = "Player Speed Boost",
    Icon     = "zap",
    Min      = 16,
    Max      = 250,
    Default  = 16,
    Callback = function(val)
        pcall(function()
            local char = game.Players.LocalPlayer.Character
            if char and char:FindFirstChildOfClass("Humanoid") then
                char:FindFirstChildOfClass("Humanoid").WalkSpeed = val
            end
        end)
    end
})

-- ── 2. COMPONENTS TAB ────────────────────────────────────────
local CompTab = Window:CreateTab({ Name = "Components", Icon = "box" })

CompTab:CreateSection("Inputs & Controls")

CompTab:CreateInput({
    Name        = "Custom Command",
    Icon        = "zap",
    Placeholder = "Enter script or command...",
    Callback    = function(txt, enter)
        if enter then
            Chiro:Notify({ Title = "COMMAND ENTERED", Content = txt, Duration = 3 })
        end
    end
})

CompTab:CreateColorPicker({
    Name     = "Accent Theme Color",
    Icon     = "palette",
    Default  = Color3.fromRGB(0, 242, 254),
    Callback = function(col) end
})

-- ── 3. TELEMETRY & GAME TAB ──────────────────────────────────
local GameTab = Window:CreateTab({ Name = "Game", Icon = "gamepad" })

GameTab:CreateSection("Game Overview")

local CurrentPlaceId = game.PlaceId
local CurrentGameId = game.GameId
local CurrentJobId = game.JobId ~= "" and game.JobId or "Local"

local ExecutorName = "Roblox"
pcall(function()
    if identifyexecutor then
        local name, ver = identifyexecutor()
        ExecutorName = tostring(name) .. (ver and (" " .. tostring(ver)) or "")
    elseif getexecutorname then
        ExecutorName = tostring(getexecutorname())
    end
end)

local GameName = "Game #" .. tostring(CurrentPlaceId)
pcall(function()
    local product = game:GetService("MarketplaceService"):GetProductInfo(CurrentPlaceId)
    if product and product.Name then GameName = product.Name end
end)

local GameIconAsset = "rbxthumb://type=Asset&id=" .. tostring(CurrentPlaceId) .. "&w=150&h=150"

GameTab:CreateBanner({
    Title    = GameName,
    SubTitle = "Place ID: " .. tostring(CurrentPlaceId) .. "  •  Universe ID: " .. tostring(CurrentGameId) .. "\nExecutor: " .. ExecutorName,
    Image    = GameIconAsset,
    Tag      = "LIVE",
    TagColor = Color3.fromRGB(0, 242, 254),
})

GameTab:CreateSection("Server & Job ID Tools")

local jobIdStat = GameTab:CreateStat({
    Name  = "Current Job ID",
    Icon  = "server",
    Tag   = "SERVER",
    Value = string.sub(CurrentJobId, 1, 14) .. (string.len(CurrentJobId) > 14 and "..." or ""),
})

GameTab:CreateButton({
    Name     = "Copy Current Job ID",
    Icon     = "lucide-copy",
    Tag      = "CLIP",
    TagColor = Color3.fromRGB(59, 130, 246),
    Label    = "Copy",
    Callback = function()
        pcall(function()
            if setclipboard then setclipboard(game.JobId) end
        end)
        Chiro:Notify({
            Title    = "JOB ID COPIED",
            Content  = "Copied server Job ID to clipboard!",
            Kind     = "success",
            Duration = 3,
        })
    end,
})

local targetJobId = ""
GameTab:CreateInput({
    Name        = "Join Server by Job ID",
    Icon        = "lucide-server",
    Tag         = "INPUT",
    TagColor    = Color3.fromRGB(168, 85, 247),
    Placeholder = "Paste Job ID here...",
    Default     = "",
    Callback    = function(txt)
        targetJobId = txt:gsub("%s+", "")
    end,
})

GameTab:CreateButton({
    Name     = "Connect to Job ID Server",
    Icon     = "lucide-log-in",
    Tag      = "TELEPORT",
    TagColor = Color3.fromRGB(0, 242, 254),
    Label    = "Join",
    Callback = function()
        if targetJobId == "" then
            Chiro:Notify({
                Title    = "JOIN ERROR",
                Content  = "Please enter or paste a valid Job ID first.",
                Kind     = "error",
                Duration = 3,
            })
            return
        end
        Chiro:Notify({
            Title    = "TELEPORTING",
            Content  = "Joining server: " .. string.sub(targetJobId, 1, 16) .. "...",
            Kind     = "info",
            Duration = 4,
        })
        pcall(function()
            game:GetService("TeleportService"):TeleportToPlaceInstance(CurrentPlaceId, targetJobId, game.Players.LocalPlayer)
        end)
    end,
})

GameTab:CreateButton({
    Name     = "Rejoin Same Server",
    Icon     = "lucide-refresh-cw",
    Label    = "Rejoin",
    Callback = function()
        Chiro:Notify({ Title = "REJOINING", Content = "Reconnecting to this place...", Kind = "info", Duration = 3 })
        pcall(function()
            if game.JobId and game.JobId ~= "" then
                game:GetService("TeleportService"):TeleportToPlaceInstance(CurrentPlaceId, game.JobId, game.Players.LocalPlayer)
            else
                game:GetService("TeleportService"):Teleport(CurrentPlaceId, game.Players.LocalPlayer)
            end
        end)
    end,
})

-- ── 4. SETTINGS TAB ──────────────────────────────────────────
local SetTab = Window:CreateTab({ Name = "Settings", Icon = "settings" })

SetTab:CreateSection("Profile & Display")

SetTab:CreateToggle({
    Name     = "Show Profile",
    Icon     = "user",
    Tag      = "PROFILE",
    TagColor = Color3.fromRGB(59, 130, 246),
    Default  = true,
    Callback = function(show)
        Window:SetProfileVisible(show)
    end
})

SetTab:CreateSection("Keybinds & Controls")

SetTab:CreateKeybind({
    Name     = "UI Toggle Keybind",
    Tag      = "REBIND",
    TagColor = Color3.fromRGB(0, 242, 254),
    Default  = Enum.KeyCode.RightShift,
    Callback = function(newKey)
        Window:SetToggleKey(newKey)
        Chiro:Notify({ Title = "KEYBIND UPDATED", Content = "UI Toggle bound to: " .. tostring(newKey.Name), Kind = "success", Duration = 3 })
    end
})

SetTab:CreateSection("Appearance & Theme")

SetTab:CreateDropdown({
    Name     = "Interface Theme",
    Icon     = "palette",
    Options  = { "Cyberpunk", "Synthwave", "TokyoNight", "ToxicEmerald", "Midnight", "Dark", "Light" },
    Default  = "Cyberpunk",
    Callback = function(th) Window:SetTheme(th) end
})

-- Select MainTab on launch
task.defer(function()
    if MainTab and MainTab._selectTab then
        MainTab._selectTab()
    end
end)

Chiro:Notify({
    Title    = "CHIRO v8.5 CYBER HUB",
    Content  = "UI Loaded successfully! Tap the floating 'C' button or press RightShift to toggle.",
    Kind     = "info",
    Duration = 5,
})

return Window
