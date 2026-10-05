-- ==============================================================================
-- ⚡ CHIRO UI — INDEPENDENT FLOATING CYBER TOGGLE BUTTON
-- Universal Mobile & PC Toggle Button for Chiro Hub
-- ==============================================================================

repeat task.wait() until game:IsLoaded()

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local CoreGui = game:GetService("CoreGui")
local LocalPlayer = Players.LocalPlayer or Players.PlayerAdded:Wait()

local function getGuiParent()
    if gethui then return gethui() end
    if CoreGui and pcall(function() return CoreGui.Name end) then return CoreGui end
    return LocalPlayer:WaitForChild("PlayerGui")
end

local ParentGui = getGuiParent()

-- Clean up any existing standalone toggle
for _, old in ipairs(ParentGui:GetChildren()) do
    if old.Name == "ChiroStandaloneToggleGui" then
        old:Destroy()
    end
end

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "ChiroStandaloneToggleGui"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Parent = ParentGui

-- ── 1. Find or Launch Chiro UI ───────────────────────────────────────────────
local function findChiroRoot()
    if _G.ChiroUI_Root and _G.ChiroUI_Root.Parent then
        return _G.ChiroUI_Root
    end

    local searchRoots = { gethui and gethui(), CoreGui, LocalPlayer and LocalPlayer:FindFirstChildOfClass("PlayerGui") }
    for _, root in ipairs(searchRoots) do
        if root then
            local ui = root:FindFirstChild("ChiroUI_v8") or root:FindFirstChild("ChiroUI_v7")
            if ui then
                local win = ui:FindFirstChild("ChiroRoot") or ui:FindFirstChildWhichIsA("Frame")
                if win then return win end
            end
        end
    end
    return nil
end

local function toggleChiroUI()
    if _G.ChiroToggle then
        local ok, res = pcall(_G.ChiroToggle)
        if ok then return end
    end

    local root = findChiroRoot()
    if root then
        root.Visible = not root.Visible
        if root.Visible then
            local scale = root:FindFirstChildOfClass("UIScale")
            if scale then
                scale.Scale = 0.92
                TweenService:Create(scale, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()
            end
        end
    else
        -- If UI is not found, automatically launch it seamlessly!
        pcall(function()
            game:GetService("StarterGui"):SetCore("SendNotification", {
                Title = "Chiro UI",
                Text = "Chiro Hub not found. Auto-launching Chiro v8.5...",
                Duration = 4,
            })
        end)
        task.spawn(function()
            local success, err = pcall(function()
                loadstring(game:HttpGet("https://raw.githubusercontent.com/leviiexesc/chiro_UI/main/chiro_v8.luau"))()
            end)
            if not success then
                pcall(function()
                    game:GetService("StarterGui"):SetCore("SendNotification", {
                        Title = "Launch Error",
                        Text = "Could not load chiro_v8: " .. tostring(err),
                        Duration = 6,
                    })
                end)
            end
        end)
    end
end

-- ── 2. Create Modern Gen-Z Floating Button ────────────────────────────────────
local ButtonContainer = Instance.new("Frame")
ButtonContainer.Name = "FloatingContainer"
ButtonContainer.Size = UDim2.fromOffset(50, 50)
ButtonContainer.Position = UDim2.new(0, 20, 0.45, 0)
ButtonContainer.BackgroundColor3 = Color3.fromRGB(11, 13, 20)
ButtonContainer.BorderSizePixel = 0
ButtonContainer.Active = true
ButtonContainer.ZIndex = 9999
ButtonContainer.Parent = ScreenGui

local bCorner = Instance.new("UICorner")
bCorner.CornerRadius = UDim.new(0, 14)
bCorner.Parent = ButtonContainer

-- Rotating Cyber Neon Gradient Stroke
local bStroke = Instance.new("UIStroke")
bStroke.Color = Color3.fromRGB(255, 255, 255)
bStroke.Thickness = 1.6
bStroke.Parent = ButtonContainer

local bGrad = Instance.new("UIGradient")
bGrad.Color = ColorSequence.new({
    ColorSequenceKeypoint.new(0, Color3.fromRGB(0, 242, 254)),
    ColorSequenceKeypoint.new(0.35, Color3.fromRGB(168, 85, 247)),
    ColorSequenceKeypoint.new(0.7, Color3.fromRGB(236, 72, 153)),
    ColorSequenceKeypoint.new(1, Color3.fromRGB(0, 242, 254)),
})
bGrad.Parent = bStroke

local rot = 0
local rotConn = RunService.RenderStepped:Connect(function(dt)
    if ButtonContainer and ButtonContainer.Parent then
        rot = (rot + dt * 60) % 360
        bGrad.Rotation = rot
    end
end)
ButtonContainer.Destroying:Connect(function()
    pcall(function() rotConn:Disconnect() end)
end)

-- Radar Ping Glow Wave
local RadarPing = Instance.new("Frame")
RadarPing.Size = UDim2.fromOffset(50, 50)
RadarPing.Position = UDim2.new(0.5, -25, 0.5, -25)
RadarPing.BackgroundColor3 = Color3.fromRGB(0, 242, 254)
RadarPing.BackgroundTransparency = 0.65
RadarPing.BorderSizePixel = 0
RadarPing.ZIndex = 9998
RadarPing.Parent = ButtonContainer

local rpCorner = Instance.new("UICorner")
rpCorner.CornerRadius = UDim.new(0, 14)
rpCorner.Parent = RadarPing

task.spawn(function()
    while ButtonContainer and ButtonContainer.Parent do
        TweenService:Create(RadarPing, TweenInfo.new(1.2, Enum.EasingStyle.Sine, Enum.EasingDirection.Out), {
            Size = UDim2.fromOffset(66, 66),
            Position = UDim2.new(0.5, -33, 0.5, -33),
            BackgroundTransparency = 1,
        }):Play()
        task.wait(1.25)
        RadarPing.Size = UDim2.fromOffset(50, 50)
        RadarPing.Position = UDim2.new(0.5, -25, 0.5, -25)
        RadarPing.BackgroundTransparency = 0.65
    end
end)

-- Button Interaction & Icon
local MainBtn = Instance.new("TextButton")
MainBtn.Size = UDim2.new(1, 0, 1, 0)
MainBtn.BackgroundTransparency = 1
MainBtn.Font = Enum.Font.GothamBold
MainBtn.Text = "C"
MainBtn.TextColor3 = Color3.fromRGB(0, 242, 254)
MainBtn.TextSize = 22
MainBtn.AutoButtonColor = false
MainBtn.ZIndex = 10000
MainBtn.Parent = ButtonContainer

local BtnScale = Instance.new("UIScale")
BtnScale.Scale = 1
BtnScale.Parent = ButtonContainer

-- Sub-badge text ("CHIRO")
local MiniBadge = Instance.new("TextLabel")
MiniBadge.Size = UDim2.new(1, 0, 0, 10)
MiniBadge.Position = UDim2.new(0, 0, 1, -12)
MiniBadge.BackgroundTransparency = 1
MiniBadge.Font = Enum.Font.GothamBold
MiniBadge.Text = "CHIRO"
MiniBadge.TextColor3 = Color3.fromRGB(168, 85, 247)
MiniBadge.TextSize = 7.5
MiniBadge.TextXAlignment = Enum.TextXAlignment.Center
MiniBadge.ZIndex = 10001
MiniBadge.Parent = ButtonContainer

-- ── 3. Smooth Touch & Mouse Dragging ──────────────────────────────────────────
local dragging = false
local dragStart = nil
local startPos = nil
local hasMoved = false

ButtonContainer.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        dragStart = input.Position
        startPos = ButtonContainer.Position
        hasMoved = false

        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                dragging = false
            end
        end)
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
        local delta = input.Position - dragStart
        if math.abs(delta.X) > 4 or math.abs(delta.Y) > 4 then
            hasMoved = true
        end
        ButtonContainer.Position = UDim2.new(
            startPos.X.Scale,
            startPos.X.Offset + delta.X,
            startPos.Y.Scale,
            startPos.Y.Offset + delta.Y
        )
    end
end)

-- Click with spring bounce
MainBtn.MouseButton1Click:Connect(function()
    if hasMoved then return end

    -- Spring click bounce
    TweenService:Create(BtnScale, TweenInfo.new(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Scale = 0.88 }):Play()
    task.wait(0.08)
    TweenService:Create(BtnScale, TweenInfo.new(0.2, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Scale = 1 }):Play()

    toggleChiroUI()
end)

-- Hover Glow Effect
MainBtn.MouseEnter:Connect(function()
    TweenService:Create(ButtonContainer, TweenInfo.new(0.15), { BackgroundColor3 = Color3.fromRGB(18, 22, 34) }):Play()
    TweenService:Create(MainBtn, TweenInfo.new(0.15), { TextColor3 = Color3.fromRGB(255, 255, 255) }):Play()
end)
MainBtn.MouseLeave:Connect(function()
    TweenService:Create(ButtonContainer, TweenInfo.new(0.15), { BackgroundColor3 = Color3.fromRGB(11, 13, 20) }):Play()
    TweenService:Create(MainBtn, TweenInfo.new(0.15), { TextColor3 = Color3.fromRGB(0, 242, 254) }):Play()
end)

-- Global export
_G.ChiroStandaloneToggle = ScreenGui

pcall(function()
    game:GetService("StarterGui"):SetCore("SendNotification", {
        Title = "Chiro Toggle Active",
        Text = "Floating 'C' toggle button active. Tap or drag anytime!",
        Duration = 3,
    })
end)

return ScreenGui
