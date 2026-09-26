-- ==============================================================================
-- ⚡ CHIRO UI — HIGH SECURITY DYNAMIC SCRIPT LOADER
-- Protected Server-Side Script Delivery & Decryption Engine
-- ==============================================================================

repeat task.wait() until game:IsLoaded()

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local StarterGui = game:GetService("StarterGui")
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

-- ── 1. Resolve License Key ───────────────────────────────────────────────────
local _env = (typeof(getgenv) == "function" and getgenv()) or _G
local userKey = _env.Key or _env.CHIRO_KEY or _G.Key or _G.CHIRO_KEY

-- Check local key file if not set in memory
if (not userKey or tostring(userKey) == "" or userKey == "CHIRO-XXXX-XXXX-XXXX") and readfile and isfile and isfile("chiro_key.txt") then
    pcall(function()
        local saved = readfile("chiro_key.txt")
        if saved and #saved > 5 then
            userKey = string.gsub(saved, "%s+", "")
        end
    end)
end

if not userKey or tostring(userKey) == "" or userKey == "CHIRO-XXXX-XXXX-XXXX" then
    notify("Chiro UI Security", "Please specify your key:\ngetgenv().Key = 'YOUR_KEY'", 8)
    return
end

userKey = tostring(userKey):gsub("%s+", "")

-- Save key for convenience
pcall(function()
    if writefile then
        writefile("chiro_key.txt", userKey)
    end
end)

-- ── 2. Hardware Identifier (HWID) Resolver ───────────────────────────────────
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

-- ── 3. Base64 & XOR Decryption Engine ─────────────────────────────────────────
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

-- ── 4. Universal HTTP Request ────────────────────────────────────────────────
local function doHttpRequest(reqOptions)
    local fn = (syn and syn.request) or (http and http.request) or http_request or request or (fluxus and fluxus.request)
    if fn then
        local ok, res = pcall(fn, reqOptions)
        if ok and res then return res end
    end
    return nil
end

-- ── 5. Fetch Protected Payload from License Server ───────────────────────────
notify("Chiro UI", "Authenticating license key...", 4)

local hwid = getHWID()
local placeId = tostring(game.PlaceId or 0)
local jobId = tostring(game.JobId or "")
local productSlug = _env.ProductSlug or _G.ProductSlug or nil

local payloadReq = {
    key = userKey,
    hwid = hwid,
    placeId = placeId,
    jobId = jobId,
    format = "encrypted",
}
if productSlug and tostring(productSlug) ~= "" then
    payloadReq.productSlug = tostring(productSlug)
end

local scriptCode = nil

-- Attempt 1: POST Request with JSON Payload (Fastest & Most Secure)
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
            notify("Chiro UI", "Decrypting secure payload...", 3)
            scriptCode = xorDecrypt(data.data.payload, userKey)
        elseif data.data.script then
            scriptCode = data.data.script
        end
    else
        local errMsg = (data and data.error and data.error.message) or "Verification rejected by server."
        notify("Chiro Security Error", errMsg, 8)
        return
    end
elseif postRes and (postRes.StatusCode == 403 or postRes.StatusCode == 401 or postRes.StatusCode == 429) then
    local resBody = postRes.Body or postRes.body or ""
    local data = nil
    pcall(function() data = HttpService:JSONDecode(resBody) end)
    local errMsg = (data and data.error and data.error.message) or "Access Denied: Invalid key or HWID."
    notify("Chiro Security Error", errMsg, 8)
    return
else
    -- Attempt 2: Fallback to GET Request via game:HttpGet
    local getUrl = GET_FALLBACK_ENDPOINT .. "?key=" .. HttpService:UrlEncode(userKey) .. "&hwid=" .. HttpService:UrlEncode(hwid)
    if productSlug then
        getUrl = getUrl .. "&productSlug=" .. HttpService:UrlEncode(tostring(productSlug))
    end

    local getSuccess, rawScript = pcall(function()
        return game:HttpGet(getUrl)
    end)

    if getSuccess and rawScript and not rawScript:find("Access Denied") then
        scriptCode = rawScript
    else
        notify("Chiro Security Error", "Could not retrieve payload from server.", 8)
        return
    end
end

-- ── 6. Execute Decrypted Script ───────────────────────────────────────────────
if scriptCode and #scriptCode > 50 then
    local execFn, compileErr = loadstring(scriptCode)
    if execFn then
        notify("Chiro UI", "Loaded successfully! Enjoy.", 4)
        execFn()
    else
        notify("Chiro Execution Error", "Compile error: " .. tostring(compileErr), 10)
    end
else
    notify("Chiro Security Error", "Received invalid or empty payload.", 8)
end
