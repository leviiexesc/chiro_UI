-- ==============================================================================
-- ⚡ CHIRO UI — HIGH SECURITY DYNAMIC SCRIPT LOADER & GEN-Z KEY SYSTEM
-- Protected Server-Side Script Delivery & Decryption Engine
-- ==============================================================================

repeat task.wait() until game:IsLoaded()

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local StarterGui = game:GetService("StarterGui")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local CoreGui = game:GetService("CoreGui")
local LocalPlayer = Players.LocalPlayer or Players.PlayerAdded:Wait()

local API_ENDPOINT = "https://chiro-license-center.onrender.com/api/v1/client/get-payload"
local GET_FALLBACK_ENDPOINT = "https://chiro-license-center.onrender.com/api/v1/client/payload"

local function notify(title, msg, dur)
    pcall(function()
        StarterGui:SetCore("SendNotification", {
            Title = title or "Chiro UI",
            Text = msg or "",
            Duration = dur or 6,
        })
    end)
    print("[" .. tostring(title) .. "] " .. tostring(msg))
end

local function setClipboardText(txt)
    pcall(function()
        if setclipboard then
            setclipboard(txt)
        elseif toclipboard then
            toclipboard(txt)
        end
    end)
end

-- ── 1. Resolve Environment & Hardware ────────────────────────────────────────
local _env = (typeof(getgenv) == "function" and getgenv()) or _G
local productSlug = _env.ProductSlug or _G.ProductSlug or nil

local function getHWID()
    local hwid = nil
    pcall(function()
        if gethwid then
            hwid = gethwid()
        elseif syn and syn.get_device_id then
            hwid = syn.get_device_id()
        elseif rbx_get_hwid then
            hwid = rbx_get_hwid()
        elseif identifyexecutor then
            local eName = identifyexecutor()
            hwid = tostring(eName) .. "-" .. tostring(LocalPlayer and LocalPlayer.UserId or "0")
        end
    end)
    if not hwid or tostring(hwid) == "" then
        local uid = tostring(LocalPlayer and LocalPlayer.UserId or "0")
        hwid = "CHIRO-" .. string.upper(string.sub(HttpService:GenerateGUID(false), 1, 8)) .. "-" .. uid
    end
    return tostring(hwid)
end

local ExecutorName = "Roblox"
pcall(function()
    if identifyexecutor then
        local name, ver = identifyexecutor()
        ExecutorName = tostring(name) .. (ver and (" " .. tostring(ver)) or "")
    elseif getexecutorname then
        ExecutorName = tostring(getexecutorname())
    end
end)

local GameName = "Game #" .. tostring(game.PlaceId or 0)
pcall(function()
    local ms = game:GetService("MarketplaceService")
    local info = ms:GetProductInfo(game.PlaceId, Enum.InfoType.Asset)
    if info and info.Name then
        GameName = info.Name
    end
end)

-- ── 2. Decryption Engine ─────────────────────────────────────────────────────
local b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local b64lookup = {}
for i = 1, #b64chars do
    b64lookup[string.byte(b64chars, i)] = i - 1
end

local function base64Decode(data)
    if crypt and crypt.base64decode then
        local ok, res = pcall(crypt.base64decode, data)
        if ok and res then return res end
    end
    if syn and syn.crypt and syn.crypt.base64 and syn.crypt.base64.decode then
        local ok, res = pcall(syn.crypt.base64.decode, data)
        if ok and res then return res end
    end
    if base64_decode then
        local ok, res = pcall(base64_decode, data)
        if ok and res then return res end
    end

    data = string.gsub(data, '[^A-Za-z0-9+/=]', '')
    local output = {}
    local len = #data
    local padding = 0
    if string.sub(data, -2) == "==" then padding = 2
    elseif string.sub(data, -1) == "=" then padding = 1 end

    local i = 1
    while i <= len do
        local b1 = b64lookup[string.byte(data, i)] or 0
        local b2 = b64lookup[string.byte(data, i + 1)] or 0
        local b3 = b64lookup[string.byte(data, i + 2)] or 0
        local b4 = b64lookup[string.byte(data, i + 3)] or 0

        local n = bit32.bor(bit32.lshift(b1, 18), bit32.lshift(b2, 12), bit32.lshift(b3, 6), b4)
        local c1 = bit32.band(bit32.rshift(n, 16), 0xFF)
        local c2 = bit32.band(bit32.rshift(n, 8), 0xFF)
        local c3 = bit32.band(n, 0xFF)

        table.insert(output, string.char(c1))
        if i + 2 <= len - padding then table.insert(output, string.char(c2)) end
        if i + 3 <= len - padding then table.insert(output, string.char(c3)) end
        i = i + 4
    end
    return table.concat(output)
end

local function xorDecrypt(b64Ciphertext, keyStr)
    local raw = base64Decode(b64Ciphertext)
    local keyLen = #keyStr
    local out = {}
    for i = 1, #raw do
        local b = string.byte(raw, i)
        local k = string.byte(keyStr, ((i - 1) % keyLen) + 1)
        table.insert(out, string.char(bit32.bxor(b, k)))
    end
    return table.concat(out)
end

local function doHttpRequest(reqOptions)
    local fn = (syn and syn.request) or (http and http.request) or http_request or request or (fluxus and fluxus.request)
    if fn then
        local ok, res = pcall(fn, reqOptions)
        if ok and res then return res end
    end
    return nil
end

-- ── 3. Payload Fetch & Execution Function ────────────────────────────────────
local function fetchAndExecute(keyToUse)
    local hwid = getHWID()
    local placeId = tostring(game.PlaceId or 0)
    local jobId = tostring(game.JobId or "")
    local robloxUser = LocalPlayer and LocalPlayer.Name or "Unknown"

    local payloadReq = {
        key = keyToUse,
        hwid = hwid,
        placeId = placeId,
        jobId = jobId,
        format = "encrypted",
        executor = ExecutorName,
        robloxUser = robloxUser,
        gameName = GameName,
    }
    if productSlug and tostring(productSlug) ~= "" then
        payloadReq.productSlug = tostring(productSlug)
    end

    local scriptCode = nil

    local postRes = doHttpRequest({
        Url = API_ENDPOINT,
        Method = "POST",
        Headers = {
            ["Content-Type"] = "application/json",
            ["User-Agent"] = "Chiro-Secure-Loader/2.0",
        },
        Body = HttpService:JSONEncode(payloadReq),
    })

    if postRes and (postRes.StatusCode == 200 or postRes.status == 200) then
        local resBody = postRes.Body or postRes.body or ""
        local data = nil
        pcall(function() data = HttpService:JSONDecode(resBody) end)

        if data and data.success and data.data then
            if data.data.format == "encrypted" and data.data.payload then
                scriptCode = xorDecrypt(data.data.payload, keyToUse)
            elseif data.data.script then
                scriptCode = data.data.script
            end
        else
            local errMsg = (data and data.error and data.error.message) or "Verification rejected by server."
            return false, errMsg
        end
    elseif postRes and (postRes.StatusCode == 403 or postRes.StatusCode == 401 or postRes.StatusCode == 429) then
        local resBody = postRes.Body or postRes.body or ""
        local data = nil
        pcall(function() data = HttpService:JSONDecode(resBody) end)
        local errMsg = (data and data.error and data.error.message) or "Access Denied: Invalid key or HWID."
        return false, errMsg
    else
        -- Fallback to GET
        local getUrl = GET_FALLBACK_ENDPOINT .. "?key=" .. HttpService:UrlEncode(keyToUse) .. "&hwid=" .. HttpService:UrlEncode(hwid)
        if productSlug then
            getUrl = getUrl .. "&productSlug=" .. HttpService:UrlEncode(tostring(productSlug))
        end

        local getSuccess, rawScript = pcall(function()
            return game:HttpGet(getUrl)
        end)

        if getSuccess and rawScript and not rawScript:find("Access Denied") then
            scriptCode = rawScript
        else
            return false, "Could not retrieve payload from server."
        end
    end

    if scriptCode and #scriptCode > 50 then
        -- Save working key
        pcall(function()
            if writefile then writefile("chiro_key.txt", keyToUse) end
            _env.Key = keyToUse
            _G.Key = keyToUse
        end)

        local execFn, compileErr = loadstring(scriptCode)
        if execFn then
            notify("Chiro UI", "Payload loaded successfully! Enjoy.", 4)
            execFn()
            return true
        else
            return false, "Compile error: " .. tostring(compileErr)
        end
    else
        return false, "Received empty or corrupted payload."
    end
end

-- ── 4. Modern Gen-Z Key Prompt Modal UI ──────────────────────────────────────
local function showKeyPrompt(initialErr)
    local parentGui = (gethui and gethui()) or CoreGui or (LocalPlayer and LocalPlayer:WaitForChild("PlayerGui"))
    if not parentGui then return end

    if parentGui:FindFirstChild("ChiroLoaderModalOverlay") then return end

    local ScreenGui = Instance.new("ScreenGui")
    ScreenGui.Name = "ChiroLoaderModalOverlay"
    ScreenGui.ResetOnSpawn = false
    ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    ScreenGui.Parent = parentGui

    local Overlay = Instance.new("Frame")
    Overlay.Size = UDim2.new(1, 0, 1, 0)
    Overlay.BackgroundColor3 = Color3.fromRGB(5, 7, 12)
    Overlay.BackgroundTransparency = 0.4
    Overlay.BorderSizePixel = 0
    Overlay.Active = true
    Overlay.ZIndex = 8000
    Overlay.Parent = ScreenGui

    local Modal = Instance.new("Frame")
    Modal.Name = "KeyModal"
    Modal.Size = UDim2.fromOffset(470, 365)
    Modal.AnchorPoint = Vector2.new(0.5, 0.5)
    Modal.Position = UDim2.new(0.5, 0, 0.5, 0)
    Modal.BackgroundColor3 = Color3.fromRGB(12, 14, 22)
    Modal.BorderSizePixel = 0
    Modal.ClipsDescendants = false
    Modal.ZIndex = 8001
    Modal.Parent = Overlay

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 14)
    corner.Parent = Modal

    local MScale = Instance.new("UIScale")
    MScale.Scale = 0.86
    MScale.Parent = Modal
    TweenService:Create(MScale, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()

    -- Dynamic Animated Cyber Gradient Border
    local MStroke = Instance.new("UIStroke")
    MStroke.Color = Color3.fromRGB(255, 255, 255)
    MStroke.Thickness = 1.5
    MStroke.Parent = Modal

    local MGrad = Instance.new("UIGradient")
    MGrad.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 242, 254)),
        ColorSequenceKeypoint.new(0.35, Color3.fromRGB(168, 85, 247)),
        ColorSequenceKeypoint.new(0.7, Color3.fromRGB(236, 72, 153)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 242, 254)),
    })
    MGrad.Parent = MStroke

    local rot = 0
    local conn = RunService.RenderStepped:Connect(function(dt)
        if Modal and Modal.Parent then
            rot = (rot + dt * 60) % 360
            MGrad.Rotation = rot
        end
    end)
    Modal.Destroying:Connect(function()
        pcall(function() conn:Disconnect() end)
    end)

    -- Header Icon
    local IconBadge = Instance.new("Frame")
    IconBadge.Size = UDim2.fromOffset(40, 40)
    IconBadge.Position = UDim2.new(0, 22, 0, 20)
    IconBadge.BackgroundColor3 = Color3.fromRGB(18, 22, 36)
    IconBadge.BorderSizePixel = 0
    IconBadge.ZIndex = 8002
    IconBadge.Parent = Modal

    local ibCorner = Instance.new("UICorner")
    ibCorner.CornerRadius = UDim.new(0, 10)
    ibCorner.Parent = IconBadge

    local IconGrad = Instance.new("UIGradient")
    IconGrad.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 242, 254)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(168, 85, 247)),
    })
    IconGrad.Parent = IconBadge

    local IcoImg = Instance.new("ImageLabel")
    IcoImg.Size = UDim2.fromOffset(22, 22)
    IcoImg.Position = UDim2.new(0.5, -11, 0.5, -11)
    IcoImg.BackgroundTransparency = 1
    IcoImg.Image = "rbxassetid://6031280882"
    IcoImg.ImageColor3 = Color3.fromRGB(255, 255, 255)
    IcoImg.ZIndex = 8003
    IcoImg.Parent = IconBadge

    -- Title & Subtitle
    local TitleLbl = Instance.new("TextLabel")
    TitleLbl.Size = UDim2.new(0, 240, 0, 22)
    TitleLbl.Position = UDim2.new(0, 72, 0, 20)
    TitleLbl.BackgroundTransparency = 1
    TitleLbl.Font = Enum.Font.GothamBold
    TitleLbl.Text = "CHIRO SECURITY SYSTEM"
    TitleLbl.TextColor3 = Color3.fromRGB(248, 250, 252)
    TitleLbl.TextSize = 15
    TitleLbl.TextXAlignment = Enum.TextXAlignment.Left
    TitleLbl.ZIndex = 8002
    TitleLbl.Parent = Modal

    local SubLbl = Instance.new("TextLabel")
    SubLbl.Size = UDim2.new(1, -94, 0, 16)
    SubLbl.Position = UDim2.new(0, 72, 0, 44)
    SubLbl.BackgroundTransparency = 1
    SubLbl.Font = Enum.Font.GothamMedium
    SubLbl.Text = "Enter your license key below or claim a 24h free pass."
    SubLbl.TextColor3 = Color3.fromRGB(148, 163, 184)
    SubLbl.TextSize = 11
    SubLbl.TextXAlignment = Enum.TextXAlignment.Left
    SubLbl.ZIndex = 8002
    SubLbl.Parent = Modal

    -- Close Button [X]
    local CloseBtn = Instance.new("TextButton")
    CloseBtn.Size = UDim2.fromOffset(26, 26)
    CloseBtn.Position = UDim2.new(1, -38, 0, 18)
    CloseBtn.BackgroundColor3 = Color3.fromRGB(20, 24, 38)
    CloseBtn.BorderSizePixel = 0
    CloseBtn.Font = Enum.Font.GothamBold
    CloseBtn.Text = "✕"
    CloseBtn.TextColor3 = Color3.fromRGB(148, 163, 184)
    CloseBtn.TextSize = 12
    CloseBtn.AutoButtonColor = false
    CloseBtn.ZIndex = 8002
    CloseBtn.Parent = Modal
    local cbCorner = Instance.new("UICorner")
    cbCorner.CornerRadius = UDim.new(0, 6)
    cbCorner.Parent = CloseBtn

    CloseBtn.MouseButton1Click:Connect(function()
        ScreenGui:Destroy()
        notify("Chiro Loader", "Key verification closed. Execute again to launch.", 4)
    end)

    -- Device Capsule
    local Capsule = Instance.new("Frame")
    Capsule.Size = UDim2.new(1, -44, 0, 26)
    Capsule.Position = UDim2.new(0, 22, 0, 78)
    Capsule.BackgroundColor3 = Color3.fromRGB(16, 20, 32)
    Capsule.BorderSizePixel = 0
    Capsule.ZIndex = 8002
    Capsule.Parent = Modal
    local capCorner = Instance.new("UICorner")
    capCorner.CornerRadius = UDim.new(0, 7)
    capCorner.Parent = Capsule

    local CapTxt = Instance.new("TextLabel")
    CapTxt.Size = UDim2.new(1, -16, 1, 0)
    CapTxt.Position = UDim2.new(0, 8, 0, 0)
    CapTxt.BackgroundTransparency = 1
    CapTxt.Font = Enum.Font.GothamMedium
    CapTxt.Text = "⚡ " .. string.upper(ExecutorName) .. "  •  🎮 " .. GameName .. "  •  🔒 HWID LOCKED"
    CapTxt.TextColor3 = Color3.fromRGB(140, 155, 180)
    CapTxt.TextSize = 10
    CapTxt.TextXAlignment = Enum.TextXAlignment.Center
    CapTxt.TextTruncate = Enum.TextTruncate.AtEnd
    CapTxt.ZIndex = 8003
    CapTxt.Parent = Capsule

    -- Input Frame
    local InputBoxFrame = Instance.new("Frame")
    InputBoxFrame.Size = UDim2.new(1, -44, 0, 48)
    InputBoxFrame.Position = UDim2.new(0, 22, 0, 118)
    InputBoxFrame.BackgroundColor3 = Color3.fromRGB(15, 18, 29)
    InputBoxFrame.BorderSizePixel = 0
    InputBoxFrame.ZIndex = 8002
    InputBoxFrame.Parent = Modal
    local inCorner = Instance.new("UICorner")
    inCorner.CornerRadius = UDim.new(0, 10)
    inCorner.Parent = InputBoxFrame

    local inStroke = Instance.new("UIStroke")
    inStroke.Color = Color3.fromRGB(38, 46, 72)
    inStroke.Thickness = 1.2
    inStroke.Parent = InputBoxFrame

    local savedKey = (readfile and isfile and isfile("chiro_key.txt") and readfile("chiro_key.txt")) or ""
    local KeyInput = Instance.new("TextBox")
    KeyInput.Size = UDim2.new(1, -120, 1, 0)
    KeyInput.Position = UDim2.new(0, 14, 0, 0)
    KeyInput.BackgroundTransparency = 1
    KeyInput.Font = Enum.Font.GothamMedium
    KeyInput.PlaceholderText = "Paste your license key (CHIRO_...)"
    KeyInput.PlaceholderColor3 = Color3.fromRGB(90, 105, 130)
    KeyInput.Text = initialErr and "" or string.gsub(savedKey, "%s+", "")
    KeyInput.TextColor3 = Color3.fromRGB(248, 250, 252)
    KeyInput.TextSize = 13
    KeyInput.TextXAlignment = Enum.TextXAlignment.Left
    KeyInput.ClearTextOnFocus = false
    KeyInput.ZIndex = 8003
    KeyInput.Parent = InputBoxFrame

    KeyInput.Focused:Connect(function()
        TweenService:Create(inStroke, TweenInfo.new(0.18), { Color = Color3.fromRGB(0, 242, 254) }):Play()
    end)
    KeyInput.FocusLost:Connect(function()
        TweenService:Create(inStroke, TweenInfo.new(0.18), { Color = Color3.fromRGB(38, 46, 72) }):Play()
    end)

    -- Paste Button
    local PasteBtn = Instance.new("TextButton")
    PasteBtn.Size = UDim2.new(0, 60, 0, 30)
    PasteBtn.Position = UDim2.new(1, -66, 0.5, -15)
    PasteBtn.BackgroundColor3 = Color3.fromRGB(24, 30, 48)
    PasteBtn.BorderSizePixel = 0
    PasteBtn.Font = Enum.Font.GothamBold
    PasteBtn.Text = "📋 Paste"
    PasteBtn.TextColor3 = Color3.fromRGB(0, 242, 254)
    PasteBtn.TextSize = 11
    PasteBtn.AutoButtonColor = false
    PasteBtn.ZIndex = 8003
    PasteBtn.Parent = InputBoxFrame
    local pbCorner = Instance.new("UICorner")
    pbCorner.CornerRadius = UDim.new(0, 6)
    pbCorner.Parent = PasteBtn

    PasteBtn.MouseButton1Click:Connect(function()
        pcall(function()
            local clip = (getclipboard and getclipboard()) or nil
            if clip and tostring(clip) ~= "" then
                KeyInput.Text = string.gsub(tostring(clip), "%s+", "")
            end
        end)
    end)

    -- Status Feedback Label
    local StatusLbl = Instance.new("TextLabel")
    StatusLbl.Size = UDim2.new(1, -44, 0, 20)
    StatusLbl.Position = UDim2.new(0, 22, 0, 172)
    StatusLbl.BackgroundTransparency = 1
    StatusLbl.Font = Enum.Font.GothamMedium
    StatusLbl.Text = initialErr and ("❌ " .. tostring(initialErr)) or "🔑 Key required to decrypt and launch script."
    StatusLbl.TextColor3 = initialErr and Color3.fromRGB(244, 63, 94) or Color3.fromRGB(148, 163, 184)
    StatusLbl.TextSize = 11
    StatusLbl.TextXAlignment = Enum.TextXAlignment.Center
    StatusLbl.ZIndex = 8002
    StatusLbl.Parent = Modal

    -- Action Buttons Row
    local ActionRow = Instance.new("Frame")
    ActionRow.Size = UDim2.new(1, -44, 0, 42)
    ActionRow.Position = UDim2.new(0, 22, 0, 200)
    ActionRow.BackgroundTransparency = 1
    ActionRow.ZIndex = 8002
    ActionRow.Parent = Modal

    local FreeKeyBtn = Instance.new("TextButton")
    FreeKeyBtn.Size = UDim2.new(0.48, -4, 1, 0)
    FreeKeyBtn.Position = UDim2.new(0, 0, 0, 0)
    FreeKeyBtn.BackgroundColor3 = Color3.fromRGB(18, 22, 34)
    FreeKeyBtn.BorderSizePixel = 0
    FreeKeyBtn.Font = Enum.Font.GothamBold
    FreeKeyBtn.Text = "✨ GET FREE KEY"
    FreeKeyBtn.TextColor3 = Color3.fromRGB(220, 230, 245)
    FreeKeyBtn.TextSize = 11
    FreeKeyBtn.AutoButtonColor = false
    FreeKeyBtn.ZIndex = 8003
    FreeKeyBtn.Parent = ActionRow
    local fkbCorner = Instance.new("UICorner")
    fkbCorner.CornerRadius = UDim.new(0, 9)
    fkbCorner.Parent = FreeKeyBtn

    FreeKeyBtn.MouseButton1Click:Connect(function()
        local freeUrl = "https://chiro-license-center.onrender.com/free-key"
        setClipboardText(freeUrl)
        FreeKeyBtn.Text = "✓ LINK COPIED!"
        FreeKeyBtn.TextColor3 = Color3.fromRGB(52, 211, 153)
        notify("Chiro Free Key", "Free key checkpoint link copied to clipboard! Open in browser.", 6)
        task.wait(2)
        FreeKeyBtn.Text = "✨ GET FREE KEY"
        FreeKeyBtn.TextColor3 = Color3.fromRGB(220, 230, 245)
    end)

    local DiscordBtn = Instance.new("TextButton")
    DiscordBtn.Size = UDim2.new(0.48, -4, 1, 0)
    DiscordBtn.Position = UDim2.new(0.52, 4, 0, 0)
    DiscordBtn.BackgroundColor3 = Color3.fromRGB(18, 22, 34)
    DiscordBtn.BorderSizePixel = 0
    DiscordBtn.Font = Enum.Font.GothamBold
    DiscordBtn.Text = "💬 DISCORD / HELP"
    DiscordBtn.TextColor3 = Color3.fromRGB(220, 230, 245)
    DiscordBtn.TextSize = 11
    DiscordBtn.AutoButtonColor = false
    DiscordBtn.ZIndex = 8003
    DiscordBtn.Parent = ActionRow
    local dcbCorner = Instance.new("UICorner")
    dcbCorner.CornerRadius = UDim.new(0, 9)
    dcbCorner.Parent = DiscordBtn

    DiscordBtn.MouseButton1Click:Connect(function()
        setClipboardText("https://discord.gg/chiro")
        DiscordBtn.Text = "✓ DISCORD COPIED!"
        DiscordBtn.TextColor3 = Color3.fromRGB(168, 85, 247)
        notify("Chiro Discord", "Discord community link copied to clipboard!", 5)
        task.wait(2)
        DiscordBtn.Text = "💬 DISCORD / HELP"
        DiscordBtn.TextColor3 = Color3.fromRGB(220, 230, 245)
    end)

    -- Unlock Button
    local UnlockBtn = Instance.new("TextButton")
    UnlockBtn.Size = UDim2.new(1, -44, 0, 46)
    UnlockBtn.Position = UDim2.new(0, 22, 0, 252)
    UnlockBtn.BackgroundColor3 = Color3.fromRGB(0, 210, 255)
    UnlockBtn.BorderSizePixel = 0
    UnlockBtn.Font = Enum.Font.GothamBold
    UnlockBtn.Text = "⚡ UNLOCK SCRIPT HUB"
    UnlockBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    UnlockBtn.TextSize = 13
    UnlockBtn.AutoButtonColor = false
    UnlockBtn.ZIndex = 8003
    UnlockBtn.Parent = Modal
    local ubCorner = Instance.new("UICorner")
    ubCorner.CornerRadius = UDim.new(0, 10)
    ubCorner.Parent = UnlockBtn

    local UnlockGrad = Instance.new("UIGradient")
    UnlockGrad.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 210, 255)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(147, 51, 234)),
    })
    UnlockGrad.Parent = UnlockBtn

    local function shakeModal()
        task.spawn(function()
            for _, off in ipairs({ -10, 10, -6, 6, -3, 3, 0 }) do
                Modal.Position = UDim2.new(0.5, off, 0.5, 0)
                task.wait(0.04)
            end
        end)
    end

    local isSubmitting = false
    UnlockBtn.MouseButton1Click:Connect(function()
        if isSubmitting then return end
        local entered = string.gsub(KeyInput.Text, "%s+", "")
        if #entered < 4 then
            StatusLbl.Text = "❌ Please enter a valid license key!"
            StatusLbl.TextColor3 = Color3.fromRGB(244, 63, 94)
            shakeModal()
            return
        end

        isSubmitting = true
        UnlockBtn.Text = "VERIFYING KEY..."
        StatusLbl.Text = "⚡ Decrypting secure payload from server..."
        StatusLbl.TextColor3 = Color3.fromRGB(56, 189, 248)

        task.spawn(function()
            local success, err = fetchAndExecute(entered)
            if success then
                StatusLbl.Text = "✅ Access Granted! Loading UI..."
                StatusLbl.TextColor3 = Color3.fromRGB(52, 211, 153)
                task.wait(0.3)
                TweenService:Create(MScale, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), { Scale = 0.8 }):Play()
                TweenService:Create(Overlay, TweenInfo.new(0.25), { BackgroundTransparency = 1 }):Play()
                task.wait(0.25)
                ScreenGui:Destroy()
            else
                isSubmitting = false
                StatusLbl.Text = "❌ " .. tostring(err or "Verification failed.")
                StatusLbl.TextColor3 = Color3.fromRGB(244, 63, 94)
                UnlockBtn.Text = "RETRY UNLOCK ⚡"
                shakeModal()
            end
        end)
    end)
end

-- ── 5. Main Execution Entry ──────────────────────────────────────────────────
local initialKey = _env.Key or _env.CHIRO_KEY or _G.Key or _G.CHIRO_KEY
if (not initialKey or tostring(initialKey) == "" or initialKey == "CHIRO-XXXX-XXXX-XXXX") and readfile and isfile and isfile("chiro_key.txt") then
    pcall(function()
        local saved = readfile("chiro_key.txt")
        if saved and #saved > 5 then
            initialKey = string.gsub(saved, "%s+", "")
        end
    end)
end

if initialKey and tostring(initialKey) ~= "" and initialKey ~= "CHIRO-XXXX-XXXX-XXXX" then
    initialKey = tostring(initialKey):gsub("%s+", "")
    notify("Chiro UI", "Authenticating saved license key...", 3)
    task.spawn(function()
        local ok, err = fetchAndExecute(initialKey)
        if not ok then
            showKeyPrompt(err)
        end
    end)
else
    showKeyPrompt()
end
