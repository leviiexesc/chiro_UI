--[[
    Chiro UI
    A lightweight black & white Roblox UI library with:
      - Animated gradient background (slow shifting monochrome sheen)
      - Pulsing glow border
      - Tabs, Sections, Buttons, Toggles, Sliders
    Anchored top-left at (15, 35).

    Usage:
        local Chiro = loadstring(readfile("Chiro UI"))() -- or require the module
        local Window = Chiro:CreateWindow({ Title = "Chiro UI" })
        local Tab = Window:CreateTab("Main")
        Tab:CreateButton({ Text = "Click me", Callback = function() print("clicked") end })
        Tab:CreateToggle({ Text = "Enabled", Default = false, Callback = function(v) print(v) end })
        Tab:CreateSlider({ Text = "Speed", Min = 0, Max = 100, Default = 50, Callback = function(v) print(v) end })
]]

local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")

local LocalPlayer = Players.LocalPlayer
local PlayerGui = LocalPlayer:WaitForChild("PlayerGui")

local Chiro = {}
Chiro.__index = Chiro

--// Palette (strict black & white, grayscale only)
local Palette = {
    Background   = Color3.fromRGB(10, 10, 10),
    Panel        = Color3.fromRGB(18, 18, 18),
    PanelLight   = Color3.fromRGB(28, 28, 28),
    Border       = Color3.fromRGB(255, 255, 255),
    Text         = Color3.fromRGB(255, 255, 255),
    SubText      = Color3.fromRGB(170, 170, 170),
    Accent       = Color3.fromRGB(255, 255, 255),
    AccentDim    = Color3.fromRGB(90, 90, 90),
}

local function tween(obj, props, time, style, dir)
    local info = TweenInfo.new(time or 0.25, style or Enum.EasingStyle.Quad, dir or Enum.EasingDirection.Out)
    local t = TweenService:Create(obj, info, props)
    t:Play()
    return t
end

local function corner(obj, radius)
    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, radius or 6)
    c.Parent = obj
    return c
end

local function stroke(obj, thickness, color, transparency)
    local s = Instance.new("UIStroke")
    s.Thickness = thickness or 1
    s.Color = color or Palette.Border
    s.Transparency = transparency or 0.5
    s.Parent = obj
    return s
end

local function makeDraggable(topbar, frame)
    local dragging, dragInput, dragStart, startPos

    topbar.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = frame.Position
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)

    topbar.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
            dragInput = input
        end
    end)

    UserInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            local delta = input.Position - dragStart
            frame.Position = UDim2.new(
                startPos.X.Scale, startPos.X.Offset + delta.X,
                startPos.Y.Scale, startPos.Y.Offset + delta.Y
            )
        end
    end)
end

--// Animated grayscale background: a slowly rotating/shifting gradient
local function attachAnimatedBackground(parent)
    local gradient = Instance.new("UIGradient")
    gradient.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0.0, Color3.fromRGB(15, 15, 15)),
        ColorSequenceKeypoint.new(0.5, Color3.fromRGB(35, 35, 35)),
        ColorSequenceKeypoint.new(1.0, Color3.fromRGB(15, 15, 15)),
    })
    gradient.Rotation = 0
    gradient.Parent = parent

    task.spawn(function()
        while parent.Parent do
            for r = 0, 360, 1 do
                if not parent.Parent then break end
                gradient.Rotation = r
                task.wait(0.04)
            end
        end
    end)

    return gradient
end

--// Pulsing glow border around a frame
local function attachGlow(frame)
    local glowStroke = stroke(frame, 1.5, Palette.Border, 0.6)

    task.spawn(function()
        while frame.Parent do
            tween(glowStroke, { Transparency = 0.15 }, 1.2, Enum.EasingStyle.Sine)
            task.wait(1.2)
            if not frame.Parent then break end
            tween(glowStroke, { Transparency = 0.75 }, 1.2, Enum.EasingStyle.Sine)
            task.wait(1.2)
        end
    end)

    return glowStroke
end

function Chiro:CreateWindow(config)
    config = config or {}
    local title = config.Title or "Chiro UI"

    -- Clean up any previous instance
    local existing = PlayerGui:FindFirstChild("ChiroUI")
    if existing then existing:Destroy() end

    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "ChiroUI"
    screenGui.ResetOnSpawn = false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.Parent = PlayerGui

    local main = Instance.new("Frame")
    main.Name = "Main"
    main.Size = UDim2.new(0, 460, 0, 320)
    main.Position = UDim2.new(0, 15, 0, 35) -- anchored top-left at (15, 35)
    main.BackgroundColor3 = Palette.Background
    main.BorderSizePixel = 0
    main.ClipsDescendants = true
    main.Parent = screenGui
    corner(main, 10)
    attachAnimatedBackground(main)
    attachGlow(main)

    -- Fade+scale in on open
    main.BackgroundTransparency = 1
    main.Size = UDim2.new(0, 400, 0, 280)
    tween(main, { BackgroundTransparency = 0.05, Size = UDim2.new(0, 460, 0, 320) }, 0.35, Enum.EasingStyle.Quint)

    local topbar = Instance.new("Frame")
    topbar.Name = "TopBar"
    topbar.Size = UDim2.new(1, 0, 0, 40)
    topbar.BackgroundColor3 = Palette.Panel
    topbar.BorderSizePixel = 0
    topbar.Parent = main
    corner(topbar, 10)

    local titleLabel = Instance.new("TextLabel")
    titleLabel.BackgroundTransparency = 1
    titleLabel.Position = UDim2.new(0, 14, 0, 0)
    titleLabel.Size = UDim2.new(1, -28, 1, 0)
    titleLabel.Font = Enum.Font.GothamBold
    titleLabel.Text = title
    titleLabel.TextColor3 = Palette.Text
    titleLabel.TextSize = 16
    titleLabel.TextXAlignment = Enum.TextXAlignment.Left
    titleLabel.Parent = topbar

    makeDraggable(topbar, main)

    local tabBar = Instance.new("Frame")
    tabBar.Name = "TabBar"
    tabBar.Position = UDim2.new(0, 0, 0, 40)
    tabBar.Size = UDim2.new(0, 120, 1, -40)
    tabBar.BackgroundColor3 = Palette.Panel
    tabBar.BorderSizePixel = 0
    tabBar.Parent = main

    local tabList = Instance.new("UIListLayout")
    tabList.Padding = UDim.new(0, 4)
    tabList.SortOrder = Enum.SortOrder.LayoutOrder
    tabList.Parent = tabBar

    local tabPad = Instance.new("UIPadding")
    tabPad.PaddingTop = UDim.new(0, 8)
    tabPad.PaddingLeft = UDim.new(0, 8)
    tabPad.PaddingRight = UDim.new(0, 8)
    tabPad.Parent = tabBar

    local pageHolder = Instance.new("Frame")
    pageHolder.Name = "PageHolder"
    pageHolder.Position = UDim2.new(0, 120, 0, 40)
    pageHolder.Size = UDim2.new(1, -120, 1, -40)
    pageHolder.BackgroundTransparency = 1
    pageHolder.Parent = main

    local window = setmetatable({
        ScreenGui = screenGui,
        Main = main,
        TabBar = tabBar,
        PageHolder = pageHolder,
        Tabs = {},
        _firstTab = true,
    }, Chiro)

    -- Toggle visibility with Right Shift
    UserInputService.InputBegan:Connect(function(input, processed)
        if processed then return end
        if input.KeyCode == Enum.KeyCode.RightShift then
            main.Visible = not main.Visible
        end
    end)

    return window
end

function Chiro:CreateTab(name)
    local self = self
    local btn = Instance.new("TextButton")
    btn.Name = name .. "TabButton"
    btn.Size = UDim2.new(1, 0, 0, 32)
    btn.BackgroundColor3 = Palette.PanelLight
    btn.AutoButtonColor = false
    btn.Font = Enum.Font.Gotham
    btn.Text = name
    btn.TextColor3 = Palette.SubText
    btn.TextSize = 14
    btn.BorderSizePixel = 0
    btn.Parent = self.TabBar
    corner(btn, 6)

    local page = Instance.new("ScrollingFrame")
    page.Name = name .. "Page"
    page.Size = UDim2.new(1, 0, 1, 0)
    page.BackgroundTransparency = 1
    page.BorderSizePixel = 0
    page.ScrollBarThickness = 3
    page.ScrollBarImageColor3 = Palette.Border
    page.CanvasSize = UDim2.new(0, 0, 0, 0)
    page.AutomaticCanvasSize = Enum.AutomaticSize.Y
    page.Visible = false
    page.Parent = self.PageHolder

    local layout = Instance.new("UIListLayout")
    layout.Padding = UDim.new(0, 8)
    layout.SortOrder = Enum.SortOrder.LayoutOrder
    layout.Parent = page

    local pad = Instance.new("UIPadding")
    pad.PaddingTop = UDim.new(0, 12)
    pad.PaddingLeft = UDim.new(0, 12)
    pad.PaddingRight = UDim.new(0, 12)
    pad.PaddingBottom = UDim.new(0, 12)
    pad.Parent = page

    local function selectTab()
        for _, t in pairs(self.Tabs) do
            t.Page.Visible = false
            tween(t.Button, { BackgroundColor3 = Palette.PanelLight, TextColor3 = Palette.SubText }, 0.15)
        end
        page.Visible = true
        tween(btn, { BackgroundColor3 = Palette.Border, TextColor3 = Color3.fromRGB(0, 0, 0) }, 0.15)
    end

    btn.MouseButton1Click:Connect(selectTab)

    local tabObj = setmetatable({ Button = btn, Page = page }, { __index = Chiro })
    table.insert(self.Tabs, tabObj)

    if self._firstTab then
        self._firstTab = false
        selectTab()
    end

    return tabObj
end

function Chiro:CreateButton(config)
    config = config or {}
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(1, 0, 0, 34)
    btn.BackgroundColor3 = Palette.Panel
    btn.AutoButtonColor = false
    btn.Font = Enum.Font.Gotham
    btn.Text = config.Text or "Button"
    btn.TextColor3 = Palette.Text
    btn.TextSize = 14
    btn.BorderSizePixel = 0
    btn.Parent = self.Page
    corner(btn, 6)
    local s = stroke(btn, 1, Palette.AccentDim, 0.7)

    btn.MouseEnter:Connect(function() tween(s, { Transparency = 0.2 }, 0.15) end)
    btn.MouseLeave:Connect(function() tween(s, { Transparency = 0.7 }, 0.15) end)
    btn.MouseButton1Down:Connect(function() tween(btn, { BackgroundColor3 = Palette.PanelLight }, 0.1) end)
    btn.MouseButton1Up:Connect(function() tween(btn, { BackgroundColor3 = Palette.Panel }, 0.1) end)
    btn.MouseButton1Click:Connect(function()
        if config.Callback then
            task.spawn(config.Callback)
        end
    end)

    return btn
end

function Chiro:CreateToggle(config)
    config = config or {}
    local state = config.Default or false

    local holder = Instance.new("Frame")
    holder.Size = UDim2.new(1, 0, 0, 34)
    holder.BackgroundColor3 = Palette.Panel
    holder.BorderSizePixel = 0
    holder.Parent = self.Page
    corner(holder, 6)

    local label = Instance.new("TextLabel")
    label.BackgroundTransparency = 1
    label.Position = UDim2.new(0, 12, 0, 0)
    label.Size = UDim2.new(1, -60, 1, 0)
    label.Font = Enum.Font.Gotham
    label.Text = config.Text or "Toggle"
    label.TextColor3 = Palette.Text
    label.TextSize = 14
    label.TextXAlignment = Enum.TextXAlignment.Left
    label.Parent = holder

    local switch = Instance.new("Frame")
    switch.Position = UDim2.new(1, -44, 0.5, -9)
    switch.Size = UDim2.new(0, 34, 0, 18)
    switch.BackgroundColor3 = Palette.AccentDim
    switch.BorderSizePixel = 0
    switch.Parent = holder
    corner(switch, 9)

    local knob = Instance.new("Frame")
    knob.Size = UDim2.new(0, 14, 0, 14)
    knob.Position = UDim2.new(0, 2, 0.5, -7)
    knob.BackgroundColor3 = Palette.Text
    knob.BorderSizePixel = 0
    knob.Parent = switch
    corner(knob, 7)

    local function render()
        if state then
            tween(switch, { BackgroundColor3 = Palette.Border }, 0.15)
            tween(knob, { Position = UDim2.new(1, -16, 0.5, -7), BackgroundColor3 = Color3.fromRGB(0,0,0) }, 0.15)
        else
            tween(switch, { BackgroundColor3 = Palette.AccentDim }, 0.15)
            tween(knob, { Position = UDim2.new(0, 2, 0.5, -7), BackgroundColor3 = Palette.Text }, 0.15)
        end
    end
    render()

    local click = Instance.new("TextButton")
    click.BackgroundTransparency = 1
    click.Size = UDim2.new(1, 0, 1, 0)
    click.Text = ""
    click.Parent = holder
    click.MouseButton1Click:Connect(function()
        state = not state
        render()
        if config.Callback then task.spawn(config.Callback, state) end
    end)

    return holder
end

function Chiro:CreateSlider(config)
    config = config or {}
    local min = config.Min or 0
    local max = config.Max or 100
    local value = config.Default or min

    local holder = Instance.new("Frame")
    holder.Size = UDim2.new(1, 0, 0, 46)
    holder.BackgroundColor3 = Palette.Panel
    holder.BorderSizePixel = 0
    holder.Parent = self.Page
    corner(holder, 6)

    local label = Instance.new("TextLabel")
    label.BackgroundTransparency = 1
    label.Position = UDim2.new(0, 12, 0, 4)
    label.Size = UDim2.new(1, -24, 0, 18)
    label.Font = Enum.Font.Gotham
    label.Text = (config.Text or "Slider") .. ": " .. tostring(value)
    label.TextColor3 = Palette.Text
    label.TextSize = 14
    label.TextXAlignment = Enum.TextXAlignment.Left
    label.Parent = holder

    local track = Instance.new("Frame")
    track.Position = UDim2.new(0, 12, 1, -14)
    track.Size = UDim2.new(1, -24, 0, 6)
    track.BackgroundColor3 = Palette.AccentDim
    track.BorderSizePixel = 0
    track.Parent = holder
    corner(track, 3)

    local fill = Instance.new("Frame")
    fill.Size = UDim2.new((value - min) / (max - min), 0, 1, 0)
    fill.BackgroundColor3 = Palette.Border
    fill.BorderSizePixel = 0
    fill.Parent = track
    corner(fill, 3)

    local dragging = false

    local function setFromX(xPos)
        local rel = math.clamp((xPos - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1)
        value = math.floor(min + (max - min) * rel)
        fill.Size = UDim2.new(rel, 0, 1, 0)
        label.Text = (config.Text or "Slider") .. ": " .. tostring(value)
        if config.Callback then task.spawn(config.Callback, value) end
    end

    track.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            setFromX(input.Position.X)
        end
    end)

    UserInputService.InputChanged:Connect(function(input)
        if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
            setFromX(input.Position.X)
        end
    end)

    UserInputService.InputEnded:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = false
        end
    end)

    return holder
end

return Chiro
