-- ============================================================
--  CHIRO UI v7.2  |  ROBLOX PROFILE, RAYFIELD SETTINGS & KEYBIND
--  Features:
--    1. Roblox Profile Card:
--       Avatar headshot (rbxthumb), DisplayName, @Username,
--       online/in-game indicator dot.
--    2. Rayfield Gen2 Settings:
--       - Settings Gear button in topbar that jumps to Settings tab.
--       - "Show Profile" toggle to show/hide the Roblox profile card.
--       - "UI Toggle Keybind" (default RightShift) - dynamically rebindable!
--    3. Top-Level Dropdown & MultiDropdown:
--       Rendered via ScreenGui DropdownLayer (ZIndex = 8900)
--       Guaranteed to show ON TOP of all tabs, cards, and frames!
--    4. MultiDropdown:
--       Interactive checkboxes with [âœ“] icon, multi-selection,
--       summary text ("Option 1, Option 2" / "3 Selected").
--    5. In-Window Loader: Tab loading strictly inside UI (not fullscreen).
--    6. Key System: KeySystem = true/false with verify & get key.
--    7. Element Tags: Pill badges [NEW], [HOT], [MULTI], [BETA].
--    8. Assets & Icons: Assets.lua (Close, Min) + Lucide icon set.
--    9. iOS Components: iOS Toggle, iOS Slider with spring knob.
-- ============================================================

local TweenService    = game:GetService("TweenService")
local UserInputService= game:GetService("UserInputService")
local RunService      = game:GetService("RunService")
local CoreGui         = game:GetService("CoreGui")
local Players         = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local StatsService    = game:GetService("Stats")

local LocalPlayer = Players.LocalPlayer
local CurrentPlaceId  = game.PlaceId
local CurrentGameId   = game.GameId
local CurrentJobId    = game.JobId ~= "" and game.JobId or "Local"

-- ============================================================
--  ASSET & ICON REPOSITORY
-- ============================================================
local Assets = {
    Close = "rbxassetid://9886659671",
    Min   = "rbxassetid://9886659276",
}

local LucideIcons = {
    ["lucide-accessibility"] = "rbxassetid://10709751939",
    ["lucide-activity"] = "rbxassetid://10709752035",
    ["lucide-air-vent"] = "rbxassetid://10709752131",
    ["lucide-airplay"] = "rbxassetid://10709752254",
    ["lucide-alarm-check"] = "rbxassetid://10709752405",
    ["lucide-alarm-clock"] = "rbxassetid://10709752630",
    ["lucide-alarm-clock-off"] = "rbxassetid://10709752508",
    ["lucide-alarm-minus"] = "rbxassetid://10709752732",
    ["lucide-alarm-plus"] = "rbxassetid://10709752825",
    ["lucide-album"] = "rbxassetid://10709752906",
    ["lucide-alert-circle"] = "rbxassetid://10709752996",
    ["lucide-alert-octagon"] = "rbxassetid://10709753064",
    ["lucide-alert-triangle"] = "rbxassetid://10709753149",
    ["lucide-align-center"] = "rbxassetid://10709753570",
    ["lucide-align-center-horizontal"] = "rbxassetid://10709753272",
    ["lucide-align-center-vertical"] = "rbxassetid://10709753421",
    ["lucide-align-end-horizontal"] = "rbxassetid://10709753692",
    ["lucide-align-end-vertical"] = "rbxassetid://10709753808",
    ["lucide-align-horizontal-distribute-center"] = "rbxassetid://10747779791",
    ["lucide-align-horizontal-distribute-end"] = "rbxassetid://10747784534",
    ["lucide-align-horizontal-distribute-start"] = "rbxassetid://10709754118",
    ["lucide-align-horizontal-justify-center"] = "rbxassetid://10709754204",
    ["lucide-align-horizontal-justify-end"] = "rbxassetid://10709754317",
    ["lucide-align-horizontal-justify-start"] = "rbxassetid://10709754436",
    ["lucide-align-horizontal-space-around"] = "rbxassetid://10709754590",
    ["lucide-align-horizontal-space-between"] = "rbxassetid://10709754749",
    ["lucide-align-justify"] = "rbxassetid://10709759610",
    ["lucide-align-left"] = "rbxassetid://10709759764",
    ["lucide-align-right"] = "rbxassetid://10709759895",
    ["lucide-align-start-horizontal"] = "rbxassetid://10709760051",
    ["lucide-align-start-vertical"] = "rbxassetid://10709760244",
    ["lucide-align-vertical-distribute-center"] = "rbxassetid://10709760351",
    ["lucide-align-vertical-distribute-end"] = "rbxassetid://10709760434",
    ["lucide-align-vertical-distribute-start"] = "rbxassetid://10709760612",
    ["lucide-align-vertical-justify-center"] = "rbxassetid://10709760814",
    ["lucide-align-vertical-justify-end"] = "rbxassetid://10709761003",
    ["lucide-align-vertical-justify-start"] = "rbxassetid://10709761176",
    ["lucide-align-vertical-space-around"] = "rbxassetid://10709761324",
    ["lucide-align-vertical-space-between"] = "rbxassetid://10709761434",
    ["lucide-anchor"] = "rbxassetid://10709761530",
    ["lucide-angry"] = "rbxassetid://10709761629",
    ["lucide-annoyed"] = "rbxassetid://10709761722",
    ["lucide-aperture"] = "rbxassetid://10709761813",
    ["lucide-apple"] = "rbxassetid://10709761889",
    ["lucide-archive"] = "rbxassetid://10709762233",
    ["lucide-archive-restore"] = "rbxassetid://10709762058",
    ["lucide-armchair"] = "rbxassetid://10709762327",
    ["lucide-arrow-big-down"] = "rbxassetid://10747796644",
    ["lucide-arrow-big-left"] = "rbxassetid://10709762574",
    ["lucide-arrow-big-right"] = "rbxassetid://10709762727",
    ["lucide-arrow-big-up"] = "rbxassetid://10709762879",
    ["lucide-arrow-down"] = "rbxassetid://10709767827",
    ["lucide-arrow-down-circle"] = "rbxassetid://10709763034",
    ["lucide-arrow-down-left"] = "rbxassetid://10709767656",
    ["lucide-arrow-down-right"] = "rbxassetid://10709767750",
    ["lucide-arrow-left"] = "rbxassetid://10709768114",
    ["lucide-arrow-left-circle"] = "rbxassetid://10709767936",
    ["lucide-arrow-left-right"] = "rbxassetid://10709768019",
    ["lucide-arrow-right"] = "rbxassetid://10709768347",
    ["lucide-arrow-right-circle"] = "rbxassetid://10709768226",
    ["lucide-arrow-up"] = "rbxassetid://10709768939",
    ["lucide-arrow-up-circle"] = "rbxassetid://10709768432",
    ["lucide-arrow-up-down"] = "rbxassetid://10709768538",
    ["lucide-arrow-up-left"] = "rbxassetid://10709768661",
    ["lucide-arrow-up-right"] = "rbxassetid://10709768787",
    ["lucide-asterisk"] = "rbxassetid://10709769095",
    ["lucide-at-sign"] = "rbxassetid://10709769286",
    ["lucide-award"] = "rbxassetid://10709769406",
    ["lucide-axe"] = "rbxassetid://10709769508",
    ["lucide-axis-3d"] = "rbxassetid://10709769598",
    ["lucide-baby"] = "rbxassetid://10709769732",
    ["lucide-backpack"] = "rbxassetid://10709769841",
    ["lucide-baggage-claim"] = "rbxassetid://10709769935",
    ["lucide-banana"] = "rbxassetid://10709770005",
    ["lucide-banknote"] = "rbxassetid://10709770178",
    ["lucide-bar-chart"] = "rbxassetid://10709773755",
    ["lucide-bar-chart-2"] = "rbxassetid://10709770317",
    ["lucide-bar-chart-3"] = "rbxassetid://10709770431",
    ["lucide-bar-chart-4"] = "rbxassetid://10709770560",
    ["lucide-bar-chart-horizontal"] = "rbxassetid://10709773669",
    ["lucide-barcode"] = "rbxassetid://10747360675",
    ["lucide-baseline"] = "rbxassetid://10709773863",
    ["lucide-bath"] = "rbxassetid://10709773963",
    ["lucide-battery"] = "rbxassetid://10709774640",
    ["lucide-battery-charging"] = "rbxassetid://10709774068",
    ["lucide-battery-full"] = "rbxassetid://10709774206",
    ["lucide-battery-low"] = "rbxassetid://10709774370",
    ["lucide-battery-medium"] = "rbxassetid://10709774513",
    ["lucide-beaker"] = "rbxassetid://10709774756",
    ["lucide-bed"] = "rbxassetid://10709775036",
    ["lucide-bed-double"] = "rbxassetid://10709774864",
    ["lucide-bed-single"] = "rbxassetid://10709774968",
    ["lucide-beer"] = "rbxassetid://10709775167",
    ["lucide-bell"] = "rbxassetid://10709775704",
    ["lucide-bell-minus"] = "rbxassetid://10709775241",
    ["lucide-bell-off"] = "rbxassetid://10709775320",
    ["lucide-bell-plus"] = "rbxassetid://10709775448",
    ["lucide-bell-ring"] = "rbxassetid://10709775560",
    ["lucide-bike"] = "rbxassetid://10709775894",
    ["lucide-binary"] = "rbxassetid://10709776050",
    ["lucide-bitcoin"] = "rbxassetid://10709776126",
    ["lucide-bluetooth"] = "rbxassetid://10709776655",
    ["lucide-bluetooth-connected"] = "rbxassetid://10709776240",
    ["lucide-bluetooth-off"] = "rbxassetid://10709776344",
    ["lucide-bluetooth-searching"] = "rbxassetid://10709776501",
    ["lucide-bold"] = "rbxassetid://10747813908",
    ["lucide-bomb"] = "rbxassetid://10709781460",
    ["lucide-bone"] = "rbxassetid://10709781605",
    ["lucide-book"] = "rbxassetid://10709781824",
    ["lucide-book-open"] = "rbxassetid://10709781717",
    ["lucide-bookmark"] = "rbxassetid://10709782154",
    ["lucide-bookmark-minus"] = "rbxassetid://10709781919",
    ["lucide-bookmark-plus"] = "rbxassetid://10709782044",
    ["lucide-bot"] = "rbxassetid://10709782230",
    ["lucide-box"] = "rbxassetid://10709782497",
    ["lucide-box-select"] = "rbxassetid://10709782342",
    ["lucide-boxes"] = "rbxassetid://10709782582",
    ["lucide-briefcase"] = "rbxassetid://10709782662",
    ["lucide-brush"] = "rbxassetid://10709782758",
    ["lucide-bug"] = "rbxassetid://10709782845",
    ["lucide-building"] = "rbxassetid://10709783051",
    ["lucide-building-2"] = "rbxassetid://10709782939",
    ["lucide-bus"] = "rbxassetid://10709783137",
    ["lucide-cake"] = "rbxassetid://10709783217",
    ["lucide-calculator"] = "rbxassetid://10709783311",
    ["lucide-calendar"] = "rbxassetid://10709789505",
    ["lucide-calendar-check"] = "rbxassetid://10709783474",
    ["lucide-calendar-check-2"] = "rbxassetid://10709783392",
    ["lucide-calendar-clock"] = "rbxassetid://10709783577",
    ["lucide-calendar-days"] = "rbxassetid://10709783673",
    ["lucide-calendar-heart"] = "rbxassetid://10709783835",
    ["lucide-calendar-minus"] = "rbxassetid://10709783959",
    ["lucide-calendar-off"] = "rbxassetid://10709788784",
    ["lucide-calendar-plus"] = "rbxassetid://10709788937",
    ["lucide-calendar-range"] = "rbxassetid://10709789053",
    ["lucide-calendar-search"] = "rbxassetid://10709789200",
    ["lucide-calendar-x"] = "rbxassetid://10709789407",
    ["lucide-calendar-x-2"] = "rbxassetid://10709789329",
    ["lucide-camera"] = "rbxassetid://10709789686",
    ["lucide-camera-off"] = "rbxassetid://10747822677",
    ["lucide-car"] = "rbxassetid://10709789810",
    ["lucide-carrot"] = "rbxassetid://10709789960",
    ["lucide-cast"] = "rbxassetid://10709790097",
    ["lucide-charge"] = "rbxassetid://10709790202",
    ["lucide-check"] = "rbxassetid://10709790644",
    ["lucide-check-circle"] = "rbxassetid://10709790387",
    ["lucide-check-circle-2"] = "rbxassetid://10709790298",
    ["lucide-check-square"] = "rbxassetid://10709790537",
    ["lucide-chef-hat"] = "rbxassetid://10709790757",
    ["lucide-cherry"] = "rbxassetid://10709790875",
    ["lucide-chevron-down"] = "rbxassetid://10709790948",
    ["lucide-chevron-first"] = "rbxassetid://10709791015",
    ["lucide-chevron-last"] = "rbxassetid://10709791130",
    ["lucide-chevron-left"] = "rbxassetid://10709791281",
    ["lucide-chevron-right"] = "rbxassetid://10709791437",
    ["lucide-chevron-up"] = "rbxassetid://10709791523",
    ["lucide-chevrons-down"] = "rbxassetid://10709796864",
    ["lucide-chevrons-down-up"] = "rbxassetid://10709791632",
    ["lucide-chevrons-left"] = "rbxassetid://10709797151",
    ["lucide-chevrons-left-right"] = "rbxassetid://10709797006",
    ["lucide-chevrons-right"] = "rbxassetid://10709797382",
    ["lucide-chevrons-right-left"] = "rbxassetid://10709797274",
    ["lucide-chevrons-up"] = "rbxassetid://10709797622",
    ["lucide-chevrons-up-down"] = "rbxassetid://10709797508",
    ["lucide-chrome"] = "rbxassetid://10709797725",
    ["lucide-circle"] = "rbxassetid://10709798174",
    ["lucide-circle-dot"] = "rbxassetid://10709797837",
    ["lucide-circle-ellipsis"] = "rbxassetid://10709797985",
    ["lucide-circle-slashed"] = "rbxassetid://10709798100",
    ["lucide-citrus"] = "rbxassetid://10709798276",
    ["lucide-clapperboard"] = "rbxassetid://10709798350",
    ["lucide-clipboard"] = "rbxassetid://10709799288",
    ["lucide-clipboard-check"] = "rbxassetid://10709798443",
    ["lucide-clipboard-copy"] = "rbxassetid://10709798574",
    ["lucide-clipboard-edit"] = "rbxassetid://10709798682",
    ["lucide-clipboard-list"] = "rbxassetid://10709798792",
    ["lucide-clipboard-signature"] = "rbxassetid://10709798890",
    ["lucide-clipboard-type"] = "rbxassetid://10709798999",
    ["lucide-clipboard-x"] = "rbxassetid://10709799124",
    ["lucide-clock"] = "rbxassetid://10709805144",
    ["lucide-clock-1"] = "rbxassetid://10709799535",
    ["lucide-clock-10"] = "rbxassetid://10709799718",
    ["lucide-clock-11"] = "rbxassetid://10709799818",
    ["lucide-clock-12"] = "rbxassetid://10709799962",
    ["lucide-clock-2"] = "rbxassetid://10709803876",
    ["lucide-clock-3"] = "rbxassetid://10709803989",
    ["lucide-clock-4"] = "rbxassetid://10709804164",
    ["lucide-clock-5"] = "rbxassetid://10709804291",
    ["lucide-clock-6"] = "rbxassetid://10709804435",
    ["lucide-clock-7"] = "rbxassetid://10709804599",
    ["lucide-clock-8"] = "rbxassetid://10709804784",
    ["lucide-clock-9"] = "rbxassetid://10709804996",
    ["lucide-cloud"] = "rbxassetid://10709806740",
    ["lucide-cloud-cog"] = "rbxassetid://10709805262",
    ["lucide-cloud-drizzle"] = "rbxassetid://10709805371",
    ["lucide-cloud-fog"] = "rbxassetid://10709805477",
    ["lucide-cloud-hail"] = "rbxassetid://10709805596",
    ["lucide-cloud-lightning"] = "rbxassetid://10709805727",
    ["lucide-cloud-moon"] = "rbxassetid://10709805942",
    ["lucide-cloud-moon-rain"] = "rbxassetid://10709805838",
    ["lucide-cloud-off"] = "rbxassetid://10709806060",
    ["lucide-cloud-rain"] = "rbxassetid://10709806277",
    ["lucide-cloud-rain-wind"] = "rbxassetid://10709806166",
    ["lucide-cloud-snow"] = "rbxassetid://10709806374",
    ["lucide-cloud-sun"] = "rbxassetid://10709806631",
    ["lucide-cloud-sun-rain"] = "rbxassetid://10709806475",
    ["lucide-cloudy"] = "rbxassetid://10709806859",
    ["lucide-clover"] = "rbxassetid://10709806995",
    ["lucide-code"] = "rbxassetid://10709810463",
    ["lucide-code-2"] = "rbxassetid://10709807111",
    ["lucide-codepen"] = "rbxassetid://10709810534",
    ["lucide-codesandbox"] = "rbxassetid://10709810676",
    ["lucide-coffee"] = "rbxassetid://10709810814",
    ["lucide-cog"] = "rbxassetid://10709810948",
    ["lucide-coins"] = "rbxassetid://10709811110",
    ["lucide-columns"] = "rbxassetid://10709811261",
    ["lucide-command"] = "rbxassetid://10709811365",
    ["lucide-compass"] = "rbxassetid://10709811445",
    ["lucide-component"] = "rbxassetid://10709811595",
    ["lucide-concierge-bell"] = "rbxassetid://10709811706",
    ["lucide-connection"] = "rbxassetid://10747361219",
    ["lucide-contact"] = "rbxassetid://10709811834",
    ["lucide-contrast"] = "rbxassetid://10709811939",
    ["lucide-cookie"] = "rbxassetid://10709812067",
    ["lucide-copy"] = "rbxassetid://10709812159",
    ["lucide-copyleft"] = "rbxassetid://10709812251",
    ["lucide-copyright"] = "rbxassetid://10709812311",
    ["lucide-corner-down-left"] = "rbxassetid://10709812396",
    ["lucide-corner-down-right"] = "rbxassetid://10709812485",
    ["lucide-corner-left-down"] = "rbxassetid://10709812632",
    ["lucide-corner-left-up"] = "rbxassetid://10709812784",
    ["lucide-corner-right-down"] = "rbxassetid://10709812939",
    ["lucide-corner-right-up"] = "rbxassetid://10709813094",
    ["lucide-corner-up-left"] = "rbxassetid://10709813185",
    ["lucide-corner-up-right"] = "rbxassetid://10709813281",
    ["lucide-cpu"] = "rbxassetid://10709813383",
    ["lucide-croissant"] = "rbxassetid://10709818125",
    ["lucide-crop"] = "rbxassetid://10709818245",
    ["lucide-cross"] = "rbxassetid://10709818399",
    ["lucide-crosshair"] = "rbxassetid://10709818534",
    ["lucide-crown"] = "rbxassetid://10709818626",
    ["lucide-cup-soda"] = "rbxassetid://10709818763",
    ["lucide-curly-braces"] = "rbxassetid://10709818847",
    ["lucide-currency"] = "rbxassetid://10709818931",
    ["lucide-database"] = "rbxassetid://10709818996",
    ["lucide-delete"] = "rbxassetid://10709819059",
    ["lucide-diamond"] = "rbxassetid://10709819149",
    ["lucide-dice-1"] = "rbxassetid://10709819266",
    ["lucide-dice-2"] = "rbxassetid://10709819361",
    ["lucide-dice-3"] = "rbxassetid://10709819508",
    ["lucide-dice-4"] = "rbxassetid://10709819670",
    ["lucide-dice-5"] = "rbxassetid://10709819801",
    ["lucide-dice-6"] = "rbxassetid://10709819896",
    ["lucide-dices"] = "rbxassetid://10723343321",
    ["lucide-diff"] = "rbxassetid://10723343416",
    ["lucide-disc"] = "rbxassetid://10723343537",
    ["lucide-divide"] = "rbxassetid://10723343805",
    ["lucide-divide-circle"] = "rbxassetid://10723343636",
    ["lucide-divide-square"] = "rbxassetid://10723343737",
    ["lucide-dollar-sign"] = "rbxassetid://10723343958",
    ["lucide-download"] = "rbxassetid://10723344270",
    ["lucide-download-cloud"] = "rbxassetid://10723344088",
    ["lucide-droplet"] = "rbxassetid://10723344432",
    ["lucide-droplets"] = "rbxassetid://10734883356",
    ["lucide-drumstick"] = "rbxassetid://10723344737",
    ["lucide-edit"] = "rbxassetid://10734883598",
    ["lucide-edit-2"] = "rbxassetid://10723344885",
    ["lucide-edit-3"] = "rbxassetid://10723345088",
    ["lucide-egg"] = "rbxassetid://10723345518",
    ["lucide-egg-fried"] = "rbxassetid://10723345347",
    ["lucide-electricity"] = "rbxassetid://10723345749",
    ["lucide-electricity-off"] = "rbxassetid://10723345643",
    ["lucide-equal"] = "rbxassetid://10723345990",
    ["lucide-equal-not"] = "rbxassetid://10723345866",
    ["lucide-eraser"] = "rbxassetid://10723346158",
    ["lucide-euro"] = "rbxassetid://10723346372",
    ["lucide-expand"] = "rbxassetid://10723346553",
    ["lucide-external-link"] = "rbxassetid://10723346684",
    ["lucide-eye"] = "rbxassetid://10723346959",
    ["lucide-eye-off"] = "rbxassetid://10723346871",
    ["lucide-factory"] = "rbxassetid://10723347051",
    ["lucide-fan"] = "rbxassetid://10723354359",
    ["lucide-fast-forward"] = "rbxassetid://10723354521",
    ["lucide-feather"] = "rbxassetid://10723354671",
    ["lucide-figma"] = "rbxassetid://10723354801",
    ["lucide-file"] = "rbxassetid://10723374641",
    ["lucide-file-archive"] = "rbxassetid://10723354921",
    ["lucide-file-audio"] = "rbxassetid://10723355148",
    ["lucide-file-audio-2"] = "rbxassetid://10723355026",
    ["lucide-file-axis-3d"] = "rbxassetid://10723355272",
    ["lucide-file-badge"] = "rbxassetid://10723355622",
    ["lucide-file-badge-2"] = "rbxassetid://10723355451",
    ["lucide-file-bar-chart"] = "rbxassetid://10723355887",
    ["lucide-file-bar-chart-2"] = "rbxassetid://10723355746",
    ["lucide-file-box"] = "rbxassetid://10723355989",
    ["lucide-file-check"] = "rbxassetid://10723356210",
    ["lucide-file-check-2"] = "rbxassetid://10723356100",
    ["lucide-file-clock"] = "rbxassetid://10723356329",
    ["lucide-file-code"] = "rbxassetid://10723356507",
    ["lucide-file-cog"] = "rbxassetid://10723356830",
    ["lucide-file-cog-2"] = "rbxassetid://10723356676",
    ["lucide-file-diff"] = "rbxassetid://10723357039",
    ["lucide-file-digit"] = "rbxassetid://10723357151",
    ["lucide-file-down"] = "rbxassetid://10723357322",
    ["lucide-file-edit"] = "rbxassetid://10723357495",
    ["lucide-file-heart"] = "rbxassetid://10723357637",
    ["lucide-file-image"] = "rbxassetid://10723357790",
    ["lucide-file-input"] = "rbxassetid://10723357933",
    ["lucide-file-json"] = "rbxassetid://10723364435",
    ["lucide-file-json-2"] = "rbxassetid://10723364361",
    ["lucide-file-key"] = "rbxassetid://10723364605",
    ["lucide-file-key-2"] = "rbxassetid://10723364515",
    ["lucide-file-line-chart"] = "rbxassetid://10723364725",
    ["lucide-file-lock"] = "rbxassetid://10723364957",
    ["lucide-file-lock-2"] = "rbxassetid://10723364861",
    ["lucide-file-minus"] = "rbxassetid://10723365254",
    ["lucide-file-minus-2"] = "rbxassetid://10723365086",
    ["lucide-file-output"] = "rbxassetid://10723365457",
    ["lucide-file-pie-chart"] = "rbxassetid://10723365598",
    ["lucide-file-plus"] = "rbxassetid://10723365877",
    ["lucide-file-plus-2"] = "rbxassetid://10723365766",
    ["lucide-file-question"] = "rbxassetid://10723365987",
    ["lucide-file-scan"] = "rbxassetid://10723366167",
    ["lucide-file-search"] = "rbxassetid://10723366550",
    ["lucide-file-search-2"] = "rbxassetid://10723366340",
    ["lucide-file-signature"] = "rbxassetid://10723366741",
    ["lucide-file-spreadsheet"] = "rbxassetid://10723366962",
    ["lucide-file-symlink"] = "rbxassetid://10723367098",
    ["lucide-file-terminal"] = "rbxassetid://10723367244",
    ["lucide-file-text"] = "rbxassetid://10723367380",
    ["lucide-file-type"] = "rbxassetid://10723367606",
    ["lucide-file-type-2"] = "rbxassetid://10723367509",
    ["lucide-file-up"] = "rbxassetid://10723367734",
    ["lucide-file-video"] = "rbxassetid://10723373884",
    ["lucide-file-video-2"] = "rbxassetid://10723367834",
    ["lucide-file-volume"] = "rbxassetid://10723374172",
    ["lucide-file-volume-2"] = "rbxassetid://10723374030",
    ["lucide-file-warning"] = "rbxassetid://10723374276",
    ["lucide-file-x"] = "rbxassetid://10723374544",
    ["lucide-file-x-2"] = "rbxassetid://10723374378",
    ["lucide-files"] = "rbxassetid://10723374759",
    ["lucide-film"] = "rbxassetid://10723374981",
    ["lucide-filter"] = "rbxassetid://10723375128",
    ["lucide-fingerprint"] = "rbxassetid://10723375250",
    ["lucide-flag"] = "rbxassetid://10723375890",
    ["lucide-flag-off"] = "rbxassetid://10723375443",
    ["lucide-flag-triangle-left"] = "rbxassetid://10723375608",
    ["lucide-flag-triangle-right"] = "rbxassetid://10723375727",
    ["lucide-flame"] = "rbxassetid://10723376114",
    ["lucide-flashlight"] = "rbxassetid://10723376471",
    ["lucide-flashlight-off"] = "rbxassetid://10723376365",
    ["lucide-flask-conical"] = "rbxassetid://10734883986",
    ["lucide-flask-round"] = "rbxassetid://10723376614",
    ["lucide-flip-horizontal"] = "rbxassetid://10723376884",
    ["lucide-flip-horizontal-2"] = "rbxassetid://10723376745",
    ["lucide-flip-vertical"] = "rbxassetid://10723377138",
    ["lucide-flip-vertical-2"] = "rbxassetid://10723377026",
    ["lucide-flower"] = "rbxassetid://10747830374",
    ["lucide-flower-2"] = "rbxassetid://10723377305",
    ["lucide-focus"] = "rbxassetid://10723377537",
    ["lucide-folder"] = "rbxassetid://10723387563",
    ["lucide-folder-archive"] = "rbxassetid://10723384478",
    ["lucide-folder-check"] = "rbxassetid://10723384605",
    ["lucide-folder-clock"] = "rbxassetid://10723384731",
    ["lucide-folder-closed"] = "rbxassetid://10723384893",
    ["lucide-folder-cog"] = "rbxassetid://10723385213",
    ["lucide-folder-cog-2"] = "rbxassetid://10723385036",
    ["lucide-folder-down"] = "rbxassetid://10723385338",
    ["lucide-folder-edit"] = "rbxassetid://10723385445",
    ["lucide-folder-heart"] = "rbxassetid://10723385545",
    ["lucide-folder-input"] = "rbxassetid://10723385721",
    ["lucide-folder-key"] = "rbxassetid://10723385848",
    ["lucide-folder-lock"] = "rbxassetid://10723386005",
    ["lucide-folder-minus"] = "rbxassetid://10723386127",
    ["lucide-folder-open"] = "rbxassetid://10723386277",
    ["lucide-folder-output"] = "rbxassetid://10723386386",
    ["lucide-folder-plus"] = "rbxassetid://10723386531",
    ["lucide-folder-search"] = "rbxassetid://10723386787",
    ["lucide-folder-search-2"] = "rbxassetid://10723386674",
    ["lucide-folder-symlink"] = "rbxassetid://10723386930",
    ["lucide-folder-tree"] = "rbxassetid://10723387085",
    ["lucide-folder-up"] = "rbxassetid://10723387265",
    ["lucide-folder-x"] = "rbxassetid://10723387448",
    ["lucide-folders"] = "rbxassetid://10723387721",
    ["lucide-form-input"] = "rbxassetid://10723387841",
    ["lucide-forward"] = "rbxassetid://10723388016",
    ["lucide-frame"] = "rbxassetid://10723394389",
    ["lucide-framer"] = "rbxassetid://10723394565",
    ["lucide-frown"] = "rbxassetid://10723394681",
    ["lucide-fuel"] = "rbxassetid://10723394846",
    ["lucide-function-square"] = "rbxassetid://10723395041",
    ["lucide-gamepad"] = "rbxassetid://10723395457",
    ["lucide-gamepad-2"] = "rbxassetid://10723395215",
    ["lucide-gauge"] = "rbxassetid://10723395708",
    ["lucide-gavel"] = "rbxassetid://10723395896",
    ["lucide-gem"] = "rbxassetid://10723396000",
    ["lucide-ghost"] = "rbxassetid://10723396107",
    ["lucide-gift"] = "rbxassetid://10723396402",
    ["lucide-gift-card"] = "rbxassetid://10723396225",
    ["lucide-git-branch"] = "rbxassetid://10723396676",
    ["lucide-git-branch-plus"] = "rbxassetid://10723396542",
    ["lucide-git-commit"] = "rbxassetid://10723396812",
    ["lucide-git-compare"] = "rbxassetid://10723396954",
    ["lucide-git-fork"] = "rbxassetid://10723397049",
    ["lucide-git-merge"] = "rbxassetid://10723397165",
    ["lucide-git-pull-request"] = "rbxassetid://10723397431",
    ["lucide-git-pull-request-closed"] = "rbxassetid://10723397268",
    ["lucide-git-pull-request-draft"] = "rbxassetid://10734884302",
    ["lucide-glass"] = "rbxassetid://10723397788",
    ["lucide-glass-2"] = "rbxassetid://10723397529",
    ["lucide-glass-water"] = "rbxassetid://10723397678",
    ["lucide-glasses"] = "rbxassetid://10723397895",
    ["lucide-globe"] = "rbxassetid://10723404337",
    ["lucide-globe-2"] = "rbxassetid://10723398002",
    ["lucide-grab"] = "rbxassetid://10723404472",
    ["lucide-graduation-cap"] = "rbxassetid://10723404691",
    ["lucide-grape"] = "rbxassetid://10723404822",
    ["lucide-grid"] = "rbxassetid://10723404936",
    ["lucide-grip-horizontal"] = "rbxassetid://10723405089",
    ["lucide-grip-vertical"] = "rbxassetid://10723405236",
    ["lucide-hammer"] = "rbxassetid://10723405360",
    ["lucide-hand"] = "rbxassetid://10723405649",
    ["lucide-hand-metal"] = "rbxassetid://10723405508",
    ["lucide-hard-drive"] = "rbxassetid://10723405749",
    ["lucide-hard-hat"] = "rbxassetid://10723405859",
    ["lucide-hash"] = "rbxassetid://10723405975",
    ["lucide-haze"] = "rbxassetid://10723406078",
    ["lucide-headphones"] = "rbxassetid://10723406165",
    ["lucide-heart"] = "rbxassetid://10723406885",
    ["lucide-heart-crack"] = "rbxassetid://10723406299",
    ["lucide-heart-handshake"] = "rbxassetid://10723406480",
    ["lucide-heart-off"] = "rbxassetid://10723406662",
    ["lucide-heart-pulse"] = "rbxassetid://10723406795",
    ["lucide-help-circle"] = "rbxassetid://10723406988",
    ["lucide-hexagon"] = "rbxassetid://10723407092",
    ["lucide-highlighter"] = "rbxassetid://10723407192",
    ["lucide-history"] = "rbxassetid://10723407335",
    ["lucide-home"] = "rbxassetid://10723407389",
    ["lucide-hourglass"] = "rbxassetid://10723407498",
    ["lucide-ice-cream"] = "rbxassetid://10723414308",
    ["lucide-image"] = "rbxassetid://10723415040",
    ["lucide-image-minus"] = "rbxassetid://10723414487",
    ["lucide-image-off"] = "rbxassetid://10723414677",
    ["lucide-image-plus"] = "rbxassetid://10723414827",
    ["lucide-import"] = "rbxassetid://10723415205",
    ["lucide-inbox"] = "rbxassetid://10723415335",
    ["lucide-indent"] = "rbxassetid://10723415494",
    ["lucide-indian-rupee"] = "rbxassetid://10723415642",
    ["lucide-infinity"] = "rbxassetid://10723415766",
    ["lucide-info"] = "rbxassetid://10723415903",
    ["lucide-inspect"] = "rbxassetid://10723416057",
    ["lucide-italic"] = "rbxassetid://10723416195",
    ["lucide-japanese-yen"] = "rbxassetid://10723416363",
    ["lucide-joystick"] = "rbxassetid://10723416527",
    ["lucide-key"] = "rbxassetid://10723416652",
    ["lucide-keyboard"] = "rbxassetid://10723416765",
    ["lucide-lamp"] = "rbxassetid://10723417513",
    ["lucide-lamp-ceiling"] = "rbxassetid://10723416922",
    ["lucide-lamp-desk"] = "rbxassetid://10723417016",
    ["lucide-lamp-floor"] = "rbxassetid://10723417131",
    ["lucide-lamp-wall-down"] = "rbxassetid://10723417240",
    ["lucide-lamp-wall-up"] = "rbxassetid://10723417356",
    ["lucide-landmark"] = "rbxassetid://10723417608",
    ["lucide-languages"] = "rbxassetid://10723417703",
    ["lucide-laptop"] = "rbxassetid://10723423881",
    ["lucide-laptop-2"] = "rbxassetid://10723417797",
    ["lucide-lasso"] = "rbxassetid://10723424235",
    ["lucide-lasso-select"] = "rbxassetid://10723424058",
    ["lucide-laugh"] = "rbxassetid://10723424372",
    ["lucide-layers"] = "rbxassetid://10723424505",
    ["lucide-layout"] = "rbxassetid://10723425376",
    ["lucide-layout-dashboard"] = "rbxassetid://10723424646",
    ["lucide-layout-grid"] = "rbxassetid://10723424838",
    ["lucide-layout-list"] = "rbxassetid://10723424963",
    ["lucide-layout-template"] = "rbxassetid://10723425187",
    ["lucide-leaf"] = "rbxassetid://10723425539",
    ["lucide-library"] = "rbxassetid://10723425615",
    ["lucide-life-buoy"] = "rbxassetid://10723425685",
    ["lucide-lightbulb"] = "rbxassetid://10723425852",
    ["lucide-lightbulb-off"] = "rbxassetid://10723425762",
    ["lucide-line-chart"] = "rbxassetid://10723426393",
    ["lucide-link"] = "rbxassetid://10723426722",
    ["lucide-link-2"] = "rbxassetid://10723426595",
    ["lucide-link-2-off"] = "rbxassetid://10723426513",
    ["lucide-list"] = "rbxassetid://10723433811",
    ["lucide-list-checks"] = "rbxassetid://10734884548",
    ["lucide-list-end"] = "rbxassetid://10723426886",
    ["lucide-list-minus"] = "rbxassetid://10723426986",
    ["lucide-list-music"] = "rbxassetid://10723427081",
    ["lucide-list-ordered"] = "rbxassetid://10723427199",
    ["lucide-list-plus"] = "rbxassetid://10723427334",
    ["lucide-list-start"] = "rbxassetid://10723427494",
    ["lucide-list-video"] = "rbxassetid://10723427619",
    ["lucide-list-x"] = "rbxassetid://10723433655",
    ["lucide-loader"] = "rbxassetid://10723434070",
    ["lucide-loader-2"] = "rbxassetid://10723433935",
    ["lucide-locate"] = "rbxassetid://10723434557",
    ["lucide-locate-fixed"] = "rbxassetid://10723434236",
    ["lucide-locate-off"] = "rbxassetid://10723434379",
    ["lucide-lock"] = "rbxassetid://10723434711",
    ["lucide-log-in"] = "rbxassetid://10723434830",
    ["lucide-log-out"] = "rbxassetid://10723434906",
    ["lucide-luggage"] = "rbxassetid://10723434993",
    ["lucide-magnet"] = "rbxassetid://10723435069",
    ["lucide-mail"] = "rbxassetid://10734885430",
    ["lucide-mail-check"] = "rbxassetid://10723435182",
    ["lucide-mail-minus"] = "rbxassetid://10723435261",
    ["lucide-mail-open"] = "rbxassetid://10723435342",
    ["lucide-mail-plus"] = "rbxassetid://10723435443",
    ["lucide-mail-question"] = "rbxassetid://10723435515",
    ["lucide-mail-search"] = "rbxassetid://10734884739",
    ["lucide-mail-warning"] = "rbxassetid://10734885015",
    ["lucide-mail-x"] = "rbxassetid://10734885247",
    ["lucide-mails"] = "rbxassetid://10734885614",
    ["lucide-map"] = "rbxassetid://10734886202",
    ["lucide-map-pin"] = "rbxassetid://10734886004",
    ["lucide-map-pin-off"] = "rbxassetid://10734885803",
    ["lucide-maximize"] = "rbxassetid://10734886735",
    ["lucide-maximize-2"] = "rbxassetid://10734886496",
    ["lucide-medal"] = "rbxassetid://10734887072",
    ["lucide-megaphone"] = "rbxassetid://10734887454",
    ["lucide-megaphone-off"] = "rbxassetid://10734887311",
    ["lucide-meh"] = "rbxassetid://10734887603",
    ["lucide-menu"] = "rbxassetid://10734887784",
    ["lucide-message-circle"] = "rbxassetid://10734888000",
    ["lucide-message-square"] = "rbxassetid://10734888228",
    ["lucide-mic"] = "rbxassetid://10734888864",
    ["lucide-mic-2"] = "rbxassetid://10734888430",
    ["lucide-mic-off"] = "rbxassetid://10734888646",
    ["lucide-microscope"] = "rbxassetid://10734889106",
    ["lucide-microwave"] = "rbxassetid://10734895076",
    ["lucide-milestone"] = "rbxassetid://10734895310",
    ["lucide-minimize"] = "rbxassetid://10734895698",
    ["lucide-minimize-2"] = "rbxassetid://10734895530",
    ["lucide-minus"] = "rbxassetid://10734896206",
    ["lucide-minus-circle"] = "rbxassetid://10734895856",
    ["lucide-minus-square"] = "rbxassetid://10734896029",
    ["lucide-monitor"] = "rbxassetid://10734896881",
    ["lucide-monitor-off"] = "rbxassetid://10734896360",
    ["lucide-monitor-speaker"] = "rbxassetid://10734896512",
    ["lucide-moon"] = "rbxassetid://10734897102",
    ["lucide-more-horizontal"] = "rbxassetid://10734897250",
    ["lucide-more-vertical"] = "rbxassetid://10734897387",
    ["lucide-mountain"] = "rbxassetid://10734897956",
    ["lucide-mountain-snow"] = "rbxassetid://10734897665",
    ["lucide-mouse"] = "rbxassetid://10734898592",
    ["lucide-mouse-pointer"] = "rbxassetid://10734898476",
    ["lucide-mouse-pointer-2"] = "rbxassetid://10734898194",
    ["lucide-mouse-pointer-click"] = "rbxassetid://10734898355",
    ["lucide-move"] = "rbxassetid://10734900011",
    ["lucide-move-3d"] = "rbxassetid://10734898756",
    ["lucide-move-diagonal"] = "rbxassetid://10734899164",
    ["lucide-move-diagonal-2"] = "rbxassetid://10734898934",
    ["lucide-move-horizontal"] = "rbxassetid://10734899414",
    ["lucide-move-vertical"] = "rbxassetid://10734899821",
    ["lucide-music"] = "rbxassetid://10734905958",
    ["lucide-music-2"] = "rbxassetid://10734900215",
    ["lucide-music-3"] = "rbxassetid://10734905665",
    ["lucide-music-4"] = "rbxassetid://10734905823",
    ["lucide-navigation"] = "rbxassetid://10734906744",
    ["lucide-navigation-2"] = "rbxassetid://10734906332",
    ["lucide-navigation-2-off"] = "rbxassetid://10734906144",
    ["lucide-navigation-off"] = "rbxassetid://10734906580",
    ["lucide-network"] = "rbxassetid://10734906975",
    ["lucide-newspaper"] = "rbxassetid://10734907168",
    ["lucide-octagon"] = "rbxassetid://10734907361",
    ["lucide-option"] = "rbxassetid://10734907649",
    ["lucide-outdent"] = "rbxassetid://10734907933",
    ["lucide-package"] = "rbxassetid://10734909540",
    ["lucide-package-2"] = "rbxassetid://10734908151",
    ["lucide-package-check"] = "rbxassetid://10734908384",
    ["lucide-package-minus"] = "rbxassetid://10734908626",
    ["lucide-package-open"] = "rbxassetid://10734908793",
    ["lucide-package-plus"] = "rbxassetid://10734909016",
    ["lucide-package-search"] = "rbxassetid://10734909196",
    ["lucide-package-x"] = "rbxassetid://10734909375",
    ["lucide-paint-bucket"] = "rbxassetid://10734909847",
    ["lucide-paintbrush"] = "rbxassetid://10734910187",
    ["lucide-paintbrush-2"] = "rbxassetid://10734910030",
    ["lucide-palette"] = "rbxassetid://10734910430",
    ["lucide-palmtree"] = "rbxassetid://10734910680",
    ["lucide-paperclip"] = "rbxassetid://10734910927",
    ["lucide-party-popper"] = "rbxassetid://10734918735",
    ["lucide-pause"] = "rbxassetid://10734919336",
    ["lucide-pause-circle"] = "rbxassetid://10735024209",
    ["lucide-pause-octagon"] = "rbxassetid://10734919143",
    ["lucide-pen-tool"] = "rbxassetid://10734919503",
    ["lucide-pencil"] = "rbxassetid://10734919691",
    ["lucide-percent"] = "rbxassetid://10734919919",
    ["lucide-person-standing"] = "rbxassetid://10734920149",
    ["lucide-phone"] = "rbxassetid://10734921524",
    ["lucide-phone-call"] = "rbxassetid://10734920305",
    ["lucide-phone-forwarded"] = "rbxassetid://10734920508",
    ["lucide-phone-incoming"] = "rbxassetid://10734920694",
    ["lucide-phone-missed"] = "rbxassetid://10734920845",
    ["lucide-phone-off"] = "rbxassetid://10734921077",
    ["lucide-phone-outgoing"] = "rbxassetid://10734921288",
    ["lucide-pie-chart"] = "rbxassetid://10734921727",
    ["lucide-piggy-bank"] = "rbxassetid://10734921935",
    ["lucide-pin"] = "rbxassetid://10734922324",
    ["lucide-pin-off"] = "rbxassetid://10734922180",
    ["lucide-pipette"] = "rbxassetid://10734922497",
    ["lucide-pizza"] = "rbxassetid://10734922774",
    ["lucide-plane"] = "rbxassetid://10734922971",
    ["lucide-play"] = "rbxassetid://10734923549",
    ["lucide-play-circle"] = "rbxassetid://10734923214",
    ["lucide-plus"] = "rbxassetid://10734924532",
    ["lucide-plus-circle"] = "rbxassetid://10734923868",
    ["lucide-plus-square"] = "rbxassetid://10734924219",
    ["lucide-podcast"] = "rbxassetid://10734929553",
    ["lucide-pointer"] = "rbxassetid://10734929723",
    ["lucide-pound-sterling"] = "rbxassetid://10734929981",
    ["lucide-power"] = "rbxassetid://10734930466",
    ["lucide-power-off"] = "rbxassetid://10734930257",
    ["lucide-printer"] = "rbxassetid://10734930632",
    ["lucide-puzzle"] = "rbxassetid://10734930886",
    ["lucide-quote"] = "rbxassetid://10734931234",
    ["lucide-radio"] = "rbxassetid://10734931596",
    ["lucide-radio-receiver"] = "rbxassetid://10734931402",
    ["lucide-rectangle-horizontal"] = "rbxassetid://10734931777",
    ["lucide-rectangle-vertical"] = "rbxassetid://10734932081",
    ["lucide-recycle"] = "rbxassetid://10734932295",
    ["lucide-redo"] = "rbxassetid://10734932822",
    ["lucide-redo-2"] = "rbxassetid://10734932586",
    ["lucide-refresh-ccw"] = "rbxassetid://10734933056",
    ["lucide-refresh-cw"] = "rbxassetid://10734933222",
    ["lucide-refrigerator"] = "rbxassetid://10734933465",
    ["lucide-regex"] = "rbxassetid://10734933655",
    ["lucide-repeat"] = "rbxassetid://10734933966",
    ["lucide-repeat-1"] = "rbxassetid://10734933826",
    ["lucide-reply"] = "rbxassetid://10734934252",
    ["lucide-reply-all"] = "rbxassetid://10734934132",
    ["lucide-rewind"] = "rbxassetid://10734934347",
    ["lucide-rocket"] = "rbxassetid://10734934585",
    ["lucide-rocking-chair"] = "rbxassetid://10734939942",
    ["lucide-rotate-3d"] = "rbxassetid://10734940107",
    ["lucide-rotate-ccw"] = "rbxassetid://10734940376",
    ["lucide-rotate-cw"] = "rbxassetid://10734940654",
    ["lucide-rss"] = "rbxassetid://10734940825",
    ["lucide-ruler"] = "rbxassetid://10734941018",
    ["lucide-russian-ruble"] = "rbxassetid://10734941199",
    ["lucide-sailboat"] = "rbxassetid://10734941354",
    ["lucide-save"] = "rbxassetid://10734941499",
    ["lucide-scale"] = "rbxassetid://10734941912",
    ["lucide-scale-3d"] = "rbxassetid://10734941739",
    ["lucide-scaling"] = "rbxassetid://10734942072",
    ["lucide-scan"] = "rbxassetid://10734942565",
    ["lucide-scan-face"] = "rbxassetid://10734942198",
    ["lucide-scan-line"] = "rbxassetid://10734942351",
    ["lucide-scissors"] = "rbxassetid://10734942778",
    ["lucide-screen-share"] = "rbxassetid://10734943193",
    ["lucide-screen-share-off"] = "rbxassetid://10734942967",
    ["lucide-scroll"] = "rbxassetid://10734943448",
    ["lucide-search"] = "rbxassetid://10734943674",
    ["lucide-send"] = "rbxassetid://10734943902",
    ["lucide-separator-horizontal"] = "rbxassetid://10734944115",
    ["lucide-separator-vertical"] = "rbxassetid://10734944326",
    ["lucide-server"] = "rbxassetid://10734949856",
    ["lucide-server-cog"] = "rbxassetid://10734944444",
    ["lucide-server-crash"] = "rbxassetid://10734944554",
    ["lucide-server-off"] = "rbxassetid://10734944668",
    ["lucide-settings"] = "rbxassetid://10734950309",
    ["lucide-settings-2"] = "rbxassetid://10734950020",
    ["lucide-share"] = "rbxassetid://10734950813",
    ["lucide-share-2"] = "rbxassetid://10734950553",
    ["lucide-sheet"] = "rbxassetid://10734951038",
    ["lucide-shield"] = "rbxassetid://10734951847",
    ["lucide-shield-alert"] = "rbxassetid://10734951173",
    ["lucide-shield-check"] = "rbxassetid://10734951367",
    ["lucide-shield-close"] = "rbxassetid://10734951535",
    ["lucide-shield-off"] = "rbxassetid://10734951684",
    ["lucide-shirt"] = "rbxassetid://10734952036",
    ["lucide-shopping-bag"] = "rbxassetid://10734952273",
    ["lucide-shopping-cart"] = "rbxassetid://10734952479",
    ["lucide-shovel"] = "rbxassetid://10734952773",
    ["lucide-shower-head"] = "rbxassetid://10734952942",
    ["lucide-shrink"] = "rbxassetid://10734953073",
    ["lucide-shrub"] = "rbxassetid://10734953241",
    ["lucide-shuffle"] = "rbxassetid://10734953451",
    ["lucide-sidebar"] = "rbxassetid://10734954301",
    ["lucide-sidebar-close"] = "rbxassetid://10734953715",
    ["lucide-sidebar-open"] = "rbxassetid://10734954000",
    ["lucide-sigma"] = "rbxassetid://10734954538",
    ["lucide-signal"] = "rbxassetid://10734961133",
    ["lucide-signal-high"] = "rbxassetid://10734954807",
    ["lucide-signal-low"] = "rbxassetid://10734955080",
    ["lucide-signal-medium"] = "rbxassetid://10734955336",
    ["lucide-signal-zero"] = "rbxassetid://10734960878",
    ["lucide-siren"] = "rbxassetid://10734961284",
    ["lucide-skip-back"] = "rbxassetid://10734961526",
    ["lucide-skip-forward"] = "rbxassetid://10734961809",
    ["lucide-skull"] = "rbxassetid://10734962068",
    ["lucide-slack"] = "rbxassetid://10734962339",
    ["lucide-slash"] = "rbxassetid://10734962600",
    ["lucide-slice"] = "rbxassetid://10734963024",
    ["lucide-sliders"] = "rbxassetid://10734963400",
    ["lucide-sliders-horizontal"] = "rbxassetid://10734963191",
    ["lucide-smartphone"] = "rbxassetid://10734963940",
    ["lucide-smartphone-charging"] = "rbxassetid://10734963671",
    ["lucide-smile"] = "rbxassetid://10734964441",
    ["lucide-smile-plus"] = "rbxassetid://10734964188",
    ["lucide-snowflake"] = "rbxassetid://10734964600",
    ["lucide-sofa"] = "rbxassetid://10734964852",
    ["lucide-sort-asc"] = "rbxassetid://10734965115",
    ["lucide-sort-desc"] = "rbxassetid://10734965287",
    ["lucide-speaker"] = "rbxassetid://10734965419",
    ["lucide-sprout"] = "rbxassetid://10734965572",
    ["lucide-square"] = "rbxassetid://10734965702",
    ["lucide-star"] = "rbxassetid://10734966248",
    ["lucide-star-half"] = "rbxassetid://10734965897",
    ["lucide-star-off"] = "rbxassetid://10734966097",
    ["lucide-stethoscope"] = "rbxassetid://10734966384",
    ["lucide-sticker"] = "rbxassetid://10734972234",
    ["lucide-sticky-note"] = "rbxassetid://10734972463",
    ["lucide-stop-circle"] = "rbxassetid://10734972621",
    ["lucide-stretch-horizontal"] = "rbxassetid://10734972862",
    ["lucide-stretch-vertical"] = "rbxassetid://10734973130",
    ["lucide-strikethrough"] = "rbxassetid://10734973290",
    ["lucide-subscript"] = "rbxassetid://10734973457",
    ["lucide-sun"] = "rbxassetid://10734974297",
    ["lucide-sun-dim"] = "rbxassetid://10734973645",
    ["lucide-sun-medium"] = "rbxassetid://10734973778",
    ["lucide-sun-moon"] = "rbxassetid://10734973999",
    ["lucide-sun-snow"] = "rbxassetid://10734974130",
    ["lucide-sunrise"] = "rbxassetid://10734974522",
    ["lucide-sunset"] = "rbxassetid://10734974689",
    ["lucide-superscript"] = "rbxassetid://10734974850",
    ["lucide-swiss-franc"] = "rbxassetid://10734975024",
    ["lucide-switch-camera"] = "rbxassetid://10734975214",
    ["lucide-sword"] = "rbxassetid://10734975486",
    ["lucide-swords"] = "rbxassetid://10734975692",
    ["lucide-syringe"] = "rbxassetid://10734975932",
    ["lucide-table"] = "rbxassetid://10734976230",
    ["lucide-table-2"] = "rbxassetid://10734976097",
    ["lucide-tablet"] = "rbxassetid://10734976394",
    ["lucide-tag"] = "rbxassetid://10734976528",
    ["lucide-tags"] = "rbxassetid://10734976739",
    ["lucide-target"] = "rbxassetid://10734977012",
    ["lucide-tent"] = "rbxassetid://10734981750",
    ["lucide-terminal"] = "rbxassetid://10734982144",
    ["lucide-terminal-square"] = "rbxassetid://10734981995",
    ["lucide-text-cursor"] = "rbxassetid://10734982395",
    ["lucide-text-cursor-input"] = "rbxassetid://10734982297",
    ["lucide-thermometer"] = "rbxassetid://10734983134",
    ["lucide-thermometer-snowflake"] = "rbxassetid://10734982571",
    ["lucide-thermometer-sun"] = "rbxassetid://10734982771",
    ["lucide-thumbs-down"] = "rbxassetid://10734983359",
    ["lucide-thumbs-up"] = "rbxassetid://10734983629",
    ["lucide-ticket"] = "rbxassetid://10734983868",
    ["lucide-timer"] = "rbxassetid://10734984606",
    ["lucide-timer-off"] = "rbxassetid://10734984138",
    ["lucide-timer-reset"] = "rbxassetid://10734984355",
    ["lucide-toggle-left"] = "rbxassetid://10734984834",
    ["lucide-toggle-right"] = "rbxassetid://10734985040",
    ["lucide-tornado"] = "rbxassetid://10734985247",
    ["lucide-toy-brick"] = "rbxassetid://10747361919",
    ["lucide-train"] = "rbxassetid://10747362105",
    ["lucide-trash"] = "rbxassetid://10747362393",
    ["lucide-trash-2"] = "rbxassetid://10747362241",
    ["lucide-tree-deciduous"] = "rbxassetid://10747362534",
    ["lucide-tree-pine"] = "rbxassetid://10747362748",
    ["lucide-trees"] = "rbxassetid://10747363016",
    ["lucide-trending-down"] = "rbxassetid://10747363205",
    ["lucide-trending-up"] = "rbxassetid://10747363465",
    ["lucide-triangle"] = "rbxassetid://10747363621",
    ["lucide-trophy"] = "rbxassetid://10747363809",
    ["lucide-truck"] = "rbxassetid://10747364031",
    ["lucide-tv"] = "rbxassetid://10747364593",
    ["lucide-tv-2"] = "rbxassetid://10747364302",
    ["lucide-type"] = "rbxassetid://10747364761",
    ["lucide-umbrella"] = "rbxassetid://10747364971",
    ["lucide-underline"] = "rbxassetid://10747365191",
    ["lucide-undo"] = "rbxassetid://10747365484",
    ["lucide-undo-2"] = "rbxassetid://10747365359",
    ["lucide-unlink"] = "rbxassetid://10747365771",
    ["lucide-unlink-2"] = "rbxassetid://10747397871",
    ["lucide-unlock"] = "rbxassetid://10747366027",
    ["lucide-upload"] = "rbxassetid://10747366434",
    ["lucide-upload-cloud"] = "rbxassetid://10747366266",
    ["lucide-usb"] = "rbxassetid://10747366606",
    ["lucide-user"] = "rbxassetid://10747373176",
    ["lucide-user-check"] = "rbxassetid://10747371901",
    ["lucide-user-cog"] = "rbxassetid://10747372167",
    ["lucide-user-minus"] = "rbxassetid://10747372346",
    ["lucide-user-plus"] = "rbxassetid://10747372702",
    ["lucide-user-x"] = "rbxassetid://10747372992",
    ["lucide-users"] = "rbxassetid://10747373426",
    ["lucide-utensils"] = "rbxassetid://10747373821",
    ["lucide-utensils-crossed"] = "rbxassetid://10747373629",
    ["lucide-venetian-mask"] = "rbxassetid://10747374003",
    ["lucide-verified"] = "rbxassetid://10747374131",
    ["lucide-vibrate"] = "rbxassetid://10747374489",
    ["lucide-vibrate-off"] = "rbxassetid://10747374269",
    ["lucide-video"] = "rbxassetid://10747374938",
    ["lucide-video-off"] = "rbxassetid://10747374721",
    ["lucide-view"] = "rbxassetid://10747375132",
    ["lucide-voicemail"] = "rbxassetid://10747375281",
    ["lucide-volume"] = "rbxassetid://10747376008",
    ["lucide-volume-1"] = "rbxassetid://10747375450",
    ["lucide-volume-2"] = "rbxassetid://10747375679",
    ["lucide-volume-x"] = "rbxassetid://10747375880",
    ["lucide-wallet"] = "rbxassetid://10747376205",
    ["lucide-wand"] = "rbxassetid://10747376565",
    ["lucide-wand-2"] = "rbxassetid://10747376349",
    ["lucide-watch"] = "rbxassetid://10747376722",
    ["lucide-waves"] = "rbxassetid://10747376931",
    ["lucide-webcam"] = "rbxassetid://10747381992",
    ["lucide-wifi"] = "rbxassetid://10747382504",
    ["lucide-wifi-off"] = "rbxassetid://10747382268",
    ["lucide-wind"] = "rbxassetid://10747382750",
    ["lucide-wrap-text"] = "rbxassetid://10747383065",
    ["lucide-wrench"] = "rbxassetid://10747383470",
    ["lucide-x"] = "rbxassetid://10747384394",
    ["lucide-x-circle"] = "rbxassetid://10747383819",
    ["lucide-x-octagon"] = "rbxassetid://10747384037",
    ["lucide-x-square"] = "rbxassetid://10747384217",
    ["lucide-zoom-in"] = "rbxassetid://10747384552",
    ["lucide-zoom-out"] = "rbxassetid://10747384679",
}

-- Auto-register shorthand icon names (without 'lucide-' prefix)
for k, v in pairs(LucideIcons) do
    local clean = string.gsub(k, '^lucide%-', '')
    LucideIcons[clean] = v
end

-- Dynamic live sync from GitHub repository
task.spawn(function()
    pcall(function()
        local raw = game:HttpGet('https://raw.githubusercontent.com/leviiexesc/chiro_UI/refs/heads/main/icons.lua')
        local loaded = loadstring(raw)()
        if loaded and loaded.assets then
            for k, v in pairs(loaded.assets) do
                LucideIcons[k] = v
                LucideIcons[string.gsub(k, '^lucide%-', '')] = v
            end
        end
    end)
end)

local function resolveIcon(iconName)
    if not iconName or iconName == "" then return nil end
    if type(iconName) == "string" and (string.sub(iconName, 1, 10) == "rbxassetid" or string.sub(iconName, 1, 4) == "http") then
        return iconName
    end
    local clean = string.lower(iconName):gsub("^lucide%-", ""):gsub("_", "-")
    return LucideIcons["lucide-" .. clean]
        or LucideIcons[clean]
        or LucideIcons["lucide-activity"] -- safe fallback (always exists)
end

-- ============================================================
--  UTILITY FUNCTIONS
-- ============================================================
local function getGuiParent()
    local ok, res = pcall(function() return CoreGui end)
    return (ok and res) and CoreGui or LocalPlayer:WaitForChild("PlayerGui")
end

local function clamp(v, mn, mx) return math.max(mn, math.min(mx, v)) end

local function quickTween(obj, duration, props, easingStyle, easingDir)
    local info = TweenInfo.new(duration or 0.2, easingStyle or Enum.EasingStyle.Quad, easingDir or Enum.EasingDirection.Out)
    local tw = TweenService:Create(obj, info, props)
    tw:Play()
    return tw
end

local function makeCorner(parent, radius)
    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, radius or 8)
    c.Parent = parent
    return c
end

local function makeStroke(parent, color, thickness)
    local s = Instance.new("UIStroke")
    s.Color = color or Color3.fromRGB(45, 45, 52)
    s.Thickness = thickness or 1
    s.Parent = parent
    return s
end

local function makeDraggable(handle, target, onDragCallback)
    local dragging, dragStart, startPos = false, nil, nil
    handle.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = target.Position
            if onDragCallback then onDragCallback() end
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then dragging = false end
            end)
        end
    end)
    UserInputService.InputChanged:Connect(function(input)
        if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
            local delta = input.Position - dragStart
            target.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
            if onDragCallback then onDragCallback() end
        end
    end)
end

-- ============================================================
--  THEMES
-- ============================================================
local Themes = {
    Dark = {
        BG         = Color3.fromRGB(9, 9, 12),
        Surface    = Color3.fromRGB(15, 15, 19),
        Card       = Color3.fromRGB(20, 20, 26),
        CardHover  = Color3.fromRGB(26, 26, 34),
        Sidebar    = Color3.fromRGB(13, 13, 17),
        Topbar     = Color3.fromRGB(11, 11, 14),
        Border     = Color3.fromRGB(38, 38, 48),
        BorderHover= Color3.fromRGB(75, 75, 90),
        Accent     = Color3.fromRGB(255, 255, 255),
        Text       = Color3.fromRGB(240, 240, 245),
        TextMuted  = Color3.fromRGB(130, 130, 142),
        TextFaint  = Color3.fromRGB(75, 75, 88),
        ToggleOn   = Color3.fromRGB(30, 215, 96),
        ToggleOff  = Color3.fromRGB(48, 48, 58),
        InputBG    = Color3.fromRGB(16, 16, 22),
    },
    Light = {
        BG         = Color3.fromRGB(246, 246, 249),
        Surface    = Color3.fromRGB(255, 255, 255),
        Card       = Color3.fromRGB(255, 255, 255),
        CardHover  = Color3.fromRGB(242, 242, 247),
        Sidebar    = Color3.fromRGB(240, 240, 245),
        Topbar     = Color3.fromRGB(235, 235, 242),
        Border     = Color3.fromRGB(218, 218, 228),
        BorderHover= Color3.fromRGB(170, 170, 185),
        Accent     = Color3.fromRGB(15, 15, 20),
        Text       = Color3.fromRGB(15, 15, 22),
        TextMuted  = Color3.fromRGB(105, 105, 118),
        TextFaint  = Color3.fromRGB(165, 165, 175),
        ToggleOn   = Color3.fromRGB(30, 215, 96),
        ToggleOff  = Color3.fromRGB(210, 210, 220),
        InputBG    = Color3.fromRGB(240, 240, 245),
    }
}

-- ============================================================
--  LIBRARY INITIALIZATION
-- ============================================================
local Chiro = {}
Chiro.__index = Chiro

local ParentGui = getGuiParent()
for _, c in ipairs(ParentGui:GetChildren()) do
    if c.Name == "ChiroUI_v7" then c:Destroy() end
end

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "ChiroUI_v7"
ScreenGui.ResetOnSpawn = false
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
ScreenGui.Parent = ParentGui

-- ============================================================
--  TOP-LEVEL DROPDOWN LAYER (ZIndex = 8900)
-- ============================================================
local DropdownLayer = Instance.new("Frame")
DropdownLayer.Name = "DropdownLayer"
DropdownLayer.Size = UDim2.new(1, 0, 1, 0)
DropdownLayer.BackgroundTransparency = 1
DropdownLayer.ZIndex = 8900
DropdownLayer.Parent = ScreenGui

local DropdownBackdrop = Instance.new("TextButton")
DropdownBackdrop.Name = "DropdownBackdrop"
DropdownBackdrop.Size = UDim2.new(1, 0, 1, 0)
DropdownBackdrop.BackgroundTransparency = 1
DropdownBackdrop.Text = ""
DropdownBackdrop.Visible = false
DropdownBackdrop.ZIndex = 8901
DropdownBackdrop.Parent = DropdownLayer

local ActiveFloatingMenu = nil
local ActiveOwnerBtn = nil
local ActiveCloseCallback = nil

local function closeActiveDropdown()
    if ActiveFloatingMenu and ActiveFloatingMenu.Parent then
        if ActiveCloseCallback then ActiveCloseCallback() end
        local menuToDestroy = ActiveFloatingMenu
        ActiveFloatingMenu = nil
        ActiveOwnerBtn = nil
        ActiveCloseCallback = nil
        DropdownBackdrop.Visible = false
        quickTween(menuToDestroy, 0.15, { Size = UDim2.new(menuToDestroy.Size.X.Scale, menuToDestroy.Size.X.Offset, 0, 0) })
        task.delay(0.18, function()
            if menuToDestroy and menuToDestroy.Parent then
                menuToDestroy:Destroy()
            end
        end)
    end
end

DropdownBackdrop.MouseButton1Click:Connect(closeActiveDropdown)

-- ============================================================
--  NOTIFICATIONS / TOASTS (ZIndex = 9500)
-- ============================================================
local NotifHolder = Instance.new("Frame")
NotifHolder.Name = "NotifHolder"
NotifHolder.Size = UDim2.new(0, 310, 1, -24)
NotifHolder.Position = UDim2.new(1, -325, 0, 12)
NotifHolder.BackgroundTransparency = 1
NotifHolder.ZIndex = 9500
NotifHolder.Parent = ScreenGui

local NotifLayout = Instance.new("UIListLayout")
NotifLayout.SortOrder = Enum.SortOrder.LayoutOrder
NotifLayout.VerticalAlignment = Enum.VerticalAlignment.Bottom
NotifLayout.Padding = UDim.new(0, 8)
NotifLayout.Parent = NotifHolder

function Chiro:Notify(cfg)
    cfg = cfg or {}
    local title   = cfg.Title   or "CHIRO"
    local content = cfg.Content or ""
    local duration= cfg.Duration or 3.5
    local kind    = cfg.Kind    or "info"
    local iconId  = resolveIcon(cfg.Icon) or LucideIcons["lucide-bell"]

    local accentColors = {
        info    = Color3.fromRGB(255, 255, 255),
        success = Color3.fromRGB(30, 215, 96),
        warn    = Color3.fromRGB(245, 158, 11),
        error   = Color3.fromRGB(239, 68, 68),
    }
    local accent = accentColors[kind] or accentColors.info

    local Toast = Instance.new("Frame")
    Toast.Size = UDim2.new(1, 0, 0, 68)
    Toast.Position = UDim2.new(1, 20, 0, 0)
    Toast.BackgroundColor3 = Color3.fromRGB(16, 16, 22)
    Toast.BorderSizePixel = 0
    Toast.ZIndex = 9501
    Toast.Parent = NotifHolder
    makeCorner(Toast, 10)
    local tStroke = makeStroke(Toast, Color3.fromRGB(45, 45, 58), 1)

    local Stripe = Instance.new("Frame")
    Stripe.Size = UDim2.new(0, 3, 1, -16)
    Stripe.Position = UDim2.new(0, 8, 0, 8)
    Stripe.BackgroundColor3 = accent
    Stripe.BorderSizePixel = 0
    Stripe.Parent = Toast
    makeCorner(Stripe, 2)

    local IconImg = Instance.new("ImageLabel")
    IconImg.Size = UDim2.fromOffset(16, 16)
    IconImg.Position = UDim2.new(0, 18, 0, 12)
    IconImg.BackgroundTransparency = 1
    IconImg.Image = iconId
    IconImg.ImageColor3 = accent
    IconImg.ScaleType = Enum.ScaleType.Fit
    IconImg.Parent = Toast

    local TitleLbl = Instance.new("TextLabel")
    TitleLbl.Size = UDim2.new(1, -44, 0, 18)
    TitleLbl.Position = UDim2.new(0, 40, 0, 10)
    TitleLbl.BackgroundTransparency = 1
    TitleLbl.Font = Enum.Font.GothamBold
    TitleLbl.Text = title
    TitleLbl.TextColor3 = Color3.fromRGB(245, 245, 250)
    TitleLbl.TextSize = 12
    TitleLbl.TextXAlignment = Enum.TextXAlignment.Left
    TitleLbl.Parent = Toast

    local BodyLbl = Instance.new("TextLabel")
    BodyLbl.Size = UDim2.new(1, -44, 0, 26)
    BodyLbl.Position = UDim2.new(0, 40, 0, 28)
    BodyLbl.BackgroundTransparency = 1
    BodyLbl.Font = Enum.Font.Gotham
    BodyLbl.Text = content
    BodyLbl.TextColor3 = Color3.fromRGB(155, 155, 165)
    BodyLbl.TextSize = 11
    BodyLbl.TextXAlignment = Enum.TextXAlignment.Left
    BodyLbl.TextWrapped = true
    BodyLbl.Parent = Toast

    local PBarBg = Instance.new("Frame")
    PBarBg.Size = UDim2.new(1, 0, 0, 2)
    PBarBg.Position = UDim2.new(0, 0, 1, -2)
    PBarBg.BackgroundColor3 = Color3.fromRGB(28, 28, 36)
    PBarBg.BorderSizePixel = 0
    PBarBg.Parent = Toast

    local PBarFill = Instance.new("Frame")
    PBarFill.Size = UDim2.new(1, 0, 1, 0)
    PBarFill.BackgroundColor3 = accent
    PBarFill.BorderSizePixel = 0
    PBarFill.Parent = PBarBg

    quickTween(Toast, 0.28, { Position = UDim2.new(0, 0, 0, 0) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
    quickTween(PBarFill, duration, { Size = UDim2.new(0, 0, 1, 0) }, Enum.EasingStyle.Linear)

    task.delay(duration, function()
        if Toast and Toast.Parent then
            quickTween(Toast, 0.22, { Position = UDim2.new(1, 30, 0, 0), BackgroundTransparency = 1 })
            task.delay(0.25, function() if Toast and Toast.Parent then Toast:Destroy() end end)
        end
    end)
end

-- ============================================================
--  MODAL POPUPS
-- ============================================================
function Chiro:Popup(cfg)
    cfg = cfg or {}
    local title   = cfg.Title   or "Notice"
    local body    = cfg.Body    or ""
    local buttons = cfg.Buttons or { { Text = "Close", Kind = "primary" } }

    local Backdrop = Instance.new("Frame")
    Backdrop.Size = UDim2.new(1, 0, 1, 0)
    Backdrop.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    Backdrop.BackgroundTransparency = 1
    Backdrop.ZIndex = 8800
    Backdrop.Parent = ScreenGui
    quickTween(Backdrop, 0.25, { BackgroundTransparency = 0.5 })

    local Modal = Instance.new("Frame")
    Modal.Size = UDim2.fromOffset(360, 160)
    Modal.Position = UDim2.new(0.5, -180, 0.5, -80)
    Modal.BackgroundColor3 = Color3.fromRGB(18, 18, 24)
    Modal.BorderSizePixel = 0
    Modal.ZIndex = 8801
    Modal.Parent = ScreenGui
    makeCorner(Modal, 12)
    makeStroke(Modal, Color3.fromRGB(50, 50, 65), 1.5)

    Modal.Size = UDim2.fromOffset(310, 140)
    Modal.Position = UDim2.new(0.5, -155, 0.5, -70)
    quickTween(Modal, 0.25, { Size = UDim2.fromOffset(360, 160), Position = UDim2.new(0.5, -180, 0.5, -80) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)

    local MTitle = Instance.new("TextLabel")
    MTitle.Size = UDim2.new(1, -32, 0, 22)
    MTitle.Position = UDim2.new(0, 16, 0, 16)
    MTitle.BackgroundTransparency = 1
    MTitle.Font = Enum.Font.GothamBold
    MTitle.Text = title
    MTitle.TextColor3 = Color3.fromRGB(245, 245, 250)
    MTitle.TextSize = 15
    MTitle.TextXAlignment = Enum.TextXAlignment.Left
    MTitle.ZIndex = 8802
    MTitle.Parent = Modal

    local MBody = Instance.new("TextLabel")
    MBody.Size = UDim2.new(1, -32, 0, 48)
    MBody.Position = UDim2.new(0, 16, 0, 44)
    MBody.BackgroundTransparency = 1
    MBody.Font = Enum.Font.Gotham
    MBody.Text = body
    MBody.TextColor3 = Color3.fromRGB(150, 150, 165)
    MBody.TextSize = 12
    MBody.TextWrapped = true
    MBody.TextXAlignment = Enum.TextXAlignment.Left
    MBody.TextYAlignment = Enum.TextYAlignment.Top
    MBody.ZIndex = 8802
    MBody.Parent = Modal

    local BtnRow = Instance.new("Frame")
    BtnRow.Size = UDim2.new(1, -32, 0, 32)
    BtnRow.Position = UDim2.new(0, 16, 1, -44)
    BtnRow.BackgroundTransparency = 1
    BtnRow.ZIndex = 8802
    BtnRow.Parent = Modal

    local BLayout = Instance.new("UIListLayout")
    BLayout.FillDirection = Enum.FillDirection.Horizontal
    BLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
    BLayout.Padding = UDim.new(0, 8)
    BLayout.Parent = BtnRow

    local function dismiss()
        quickTween(Backdrop, 0.2, { BackgroundTransparency = 1 })
        quickTween(Modal, 0.2, { Size = UDim2.fromOffset(320, 140), Position = UDim2.new(0.5, -160, 0.5, -70) })
        task.delay(0.22, function()
            Backdrop:Destroy()
            Modal:Destroy()
        end)
    end

    for _, b in ipairs(buttons) do
        local isPrim = b.Kind == "primary"
        local Btn = Instance.new("TextButton")
        Btn.Size = UDim2.new(0, 90, 1, 0)
        Btn.BackgroundColor3 = isPrim and Color3.fromRGB(255, 255, 255) or Color3.fromRGB(30, 30, 38)
        Btn.BorderSizePixel = 0
        Btn.Font = Enum.Font.GothamBold
        Btn.Text = b.Text or "OK"
        Btn.TextColor3 = isPrim and Color3.fromRGB(0, 0, 0) or Color3.fromRGB(210, 210, 220)
        Btn.TextSize = 12
        Btn.AutoButtonColor = false
        Btn.ZIndex = 8803
        Btn.Parent = BtnRow
        makeCorner(Btn, 8)

        Btn.MouseButton1Click:Connect(function()
            if b.Callback then b.Callback() end
            dismiss()
        end)
    end
end

-- ============================================================
--  TAG PILL HELPER
-- ============================================================
local function makeTagPill(parent, tagText, tagColor)
    if not tagText or tagText == "" then return nil end
    local Pill = Instance.new("Frame")
    Pill.Name = "TagPill"
    Pill.Size = UDim2.new(0, 0, 0, 16)
    Pill.AutomaticSize = Enum.AutomaticSize.X
    Pill.BackgroundColor3 = Color3.fromRGB(28, 28, 36)
    Pill.BorderSizePixel = 0
    Pill.Parent = parent
    makeCorner(Pill, 4)
    local ps = makeStroke(Pill, tagColor or Color3.fromRGB(60, 60, 75), 1)

    local PPad = Instance.new("UIPadding")
    PPad.PaddingLeft = UDim.new(0, 6)
    PPad.PaddingRight = UDim.new(0, 6)
    PPad.Parent = Pill

    local PTxt = Instance.new("TextLabel")
    PTxt.Size = UDim2.new(0, 0, 1, 0)
    PTxt.AutomaticSize = Enum.AutomaticSize.X
    PTxt.BackgroundTransparency = 1
    PTxt.Font = Enum.Font.GothamBold
    PTxt.Text = string.upper(tagText)
    PTxt.TextColor3 = tagColor or Color3.fromRGB(200, 200, 215)
    PTxt.TextSize = 8
    PTxt.Parent = Pill
    return Pill
end

-- ============================================================
--  WINDOW CREATOR
-- ============================================================
function Chiro:CreateWindow(cfg)
    cfg = cfg or {}
    local wTitle     = cfg.Title     or "CHIRO"
    local wSub       = cfg.SubTitle  or "SYSTEM // v7.2"
    local wTag       = cfg.Tag       or nil
    local wSize      = cfg.Size      or UDim2.fromOffset(720, 500)
    local toggleKey  = cfg.ToggleKey or Enum.KeyCode.RightShift
    local keySystem  = cfg.KeySystem == true
    local correctKey = cfg.Key       or "CHIRO-2026"
    local keyLink    = cfg.KeyLink   or "https://discord.gg/chiro"

    local currentTheme = Themes.Dark

    local Win = {
        Tabs = {},
        ActiveTab = nil,
        _themeName = "Dark",
        _objects = {
            MainFrames = {},
            Sidebars   = {},
            Topbars    = {},
            Cards      = {},
            Strokes    = {},
            Texts      = {},
            MutedTexts = {},
        }
    }

    local function register(cat, obj)
        table.insert(Win._objects[cat], obj)
    end

    function Win:SetTheme(tName)
        local t = Themes[tName] or Themes.Dark
        currentTheme = t
        Win._themeName = tName
        local spd = 0.3
        for _, o in ipairs(Win._objects.MainFrames) do quickTween(o, spd, { BackgroundColor3 = t.BG }) end
        for _, o in ipairs(Win._objects.Sidebars)   do quickTween(o, spd, { BackgroundColor3 = t.Sidebar }) end
        for _, o in ipairs(Win._objects.Topbars)    do quickTween(o, spd, { BackgroundColor3 = t.Topbar }) end
        for _, o in ipairs(Win._objects.Cards)      do quickTween(o, spd, { BackgroundColor3 = t.Card }) end
        for _, o in ipairs(Win._objects.Strokes)    do quickTween(o, spd, { Color = t.Border }) end
        for _, o in ipairs(Win._objects.Texts)      do quickTween(o, spd, { TextColor3 = t.Text }) end
        for _, o in ipairs(Win._objects.MutedTexts) do quickTween(o, spd, { TextColor3 = t.TextMuted }) end
    end

    -- Dynamic Keybind Setter
    function Win:SetToggleKey(newKey)
        if newKey and typeof(newKey) == "EnumItem" then
            toggleKey = newKey
        end
    end

    -- ---- ROOT WINDOW FRAME ----
    local MainFrame = Instance.new("Frame")
    MainFrame.Name = "ChiroRoot"
    MainFrame.Size = wSize
    MainFrame.Position = UDim2.new(0.5, -(wSize.X.Offset/2), 0.5, -(wSize.Y.Offset/2))
    MainFrame.BackgroundColor3 = currentTheme.BG
    MainFrame.BorderSizePixel = 0
    MainFrame.ClipsDescendants = true
    MainFrame.Parent = ScreenGui
    register("MainFrames", MainFrame)
    makeCorner(MainFrame, 10)

    -- Dynamic Cyber Glow Outline
    local GlowStroke = makeStroke(MainFrame, Color3.fromRGB(255, 255, 255), 1.5)
    local GlowGrad = Instance.new("UIGradient")
    GlowGrad.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(30, 30, 30)),
        ColorSequenceKeypoint.new(0.45, Color3.fromRGB(70, 70, 70)),
        ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 255, 255)),
        ColorSequenceKeypoint.new(0.55, Color3.fromRGB(70, 70, 70)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(30, 30, 30)),
    })
    GlowGrad.Parent = GlowStroke

    local rot = 0
    RunService.RenderStepped:Connect(function(dt)
        if MainFrame and MainFrame.Parent then
            rot = (rot + dt * 50) % 360
            GlowGrad.Rotation = rot
        end
    end)

    -- ---- TOPBAR ----
    local Topbar = Instance.new("Frame")
    Topbar.Name = "Topbar"
    Topbar.Size = UDim2.new(1, 0, 0, 44)
    Topbar.BackgroundColor3 = currentTheme.Topbar
    Topbar.BorderSizePixel = 0
    Topbar.Parent = MainFrame
    register("Topbars", Topbar)
    makeCorner(Topbar, 10)

    local TopbarCover = Instance.new("Frame")
    TopbarCover.Size = UDim2.new(1, 0, 0, 8)
    TopbarCover.Position = UDim2.new(0, 0, 1, -8)
    TopbarCover.BackgroundColor3 = currentTheme.Topbar
    TopbarCover.BorderSizePixel = 0
    TopbarCover.Parent = Topbar
    register("Topbars", TopbarCover)

    makeDraggable(Topbar, MainFrame, closeActiveDropdown)

    local BrandDot = Instance.new("Frame")
    BrandDot.Size = UDim2.fromOffset(6, 6)
    BrandDot.Position = UDim2.new(0, 14, 0.5, -3)
    BrandDot.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    BrandDot.BorderSizePixel = 0
    BrandDot.Parent = Topbar
    makeCorner(BrandDot, 3)

    local TitleLabel = Instance.new("TextLabel")
    TitleLabel.Size = UDim2.new(0, 0, 0, 22)
    TitleLabel.AutomaticSize = Enum.AutomaticSize.X
    TitleLabel.Position = UDim2.new(0, 26, 0.5, -11)
    TitleLabel.BackgroundTransparency = 1
    TitleLabel.Font = Enum.Font.GothamBold
    TitleLabel.Text = wTitle
    TitleLabel.TextColor3 = currentTheme.Text
    TitleLabel.TextSize = 14
    TitleLabel.TextXAlignment = Enum.TextXAlignment.Left
    TitleLabel.Parent = Topbar
    register("Texts", TitleLabel)

    if wTag then
        local wPill = makeTagPill(Topbar, wTag, Color3.fromRGB(30, 215, 96))
        wPill.Position = UDim2.new(0, 86, 0.5, -8)
    end

    local SubLabel = Instance.new("TextLabel")
    SubLabel.Size = UDim2.new(0, 120, 0, 16)
    SubLabel.Position = UDim2.new(0.5, -60, 0.5, -8)
    SubLabel.BackgroundTransparency = 1
    SubLabel.Font = Enum.Font.Code
    SubLabel.Text = wSub
    SubLabel.TextColor3 = currentTheme.TextMuted
    SubLabel.TextSize = 10
    SubLabel.Parent = Topbar
    register("MutedTexts", SubLabel)

    -- Topbar Action Buttons
    local function makeTopBtn(iconAsset, xOffset, callback)
        local Btn = Instance.new("ImageButton")
        Btn.Size = UDim2.fromOffset(26, 26)
        Btn.Position = UDim2.new(1, xOffset, 0.5, -13)
        Btn.BackgroundColor3 = Color3.fromRGB(20, 20, 26)
        Btn.BorderSizePixel = 0
        Btn.Image = iconAsset
        Btn.ImageColor3 = Color3.fromRGB(160, 160, 170)
        Btn.ScaleType = Enum.ScaleType.Fit
        Btn.AutoButtonColor = false
        Btn.Parent = Topbar
        makeCorner(Btn, 6)

        local Pad = Instance.new("UIPadding")
        Pad.PaddingLeft = UDim.new(0, 5)
        Pad.PaddingRight = UDim.new(0, 5)
        Pad.PaddingTop = UDim.new(0, 5)
        Pad.PaddingBottom = UDim.new(0, 5)
        Pad.Parent = Btn

        Btn.MouseEnter:Connect(function()
            quickTween(Btn, 0.12, { BackgroundColor3 = Color3.fromRGB(255, 255, 255), ImageColor3 = Color3.fromRGB(0, 0, 0) })
        end)
        Btn.MouseLeave:Connect(function()
            quickTween(Btn, 0.12, { BackgroundColor3 = Color3.fromRGB(20, 20, 26), ImageColor3 = Color3.fromRGB(160, 160, 170) })
        end)
        Btn.MouseButton1Click:Connect(callback)
        return Btn
    end

    local isMinimized = false
    makeTopBtn(Assets.Close, -34, function()
        closeActiveDropdown()
        MainFrame.Visible = false
        Chiro:Notify({ Title = "CHIRO MINIMIZED", Content = "Click the floating 'C' icon or press " .. tostring(toggleKey.Name) .. " to reopen.", Duration = 3 })
    end)
    makeTopBtn(Assets.Min, -66, function()
        closeActiveDropdown()
        isMinimized = not isMinimized
        quickTween(MainFrame, 0.25, { Size = isMinimized and UDim2.new(wSize.X.Scale, wSize.X.Offset, 0, 44) or wSize }, Enum.EasingStyle.Cubic)
    end)
    -- Rayfield Gen2 Settings Gear Icon Button
    makeTopBtn(LucideIcons["lucide-settings"], -98, function()
        closeActiveDropdown()
        for _, t in ipairs(Win.Tabs) do
            if string.lower(t.Name) == "settings" and t._selectTab then
                t._selectTab()
                Chiro:Notify({ Title = "SETTINGS", Content = "Jumped to Settings configuration.", Kind = "info", Duration = 2 })
                break
            end
        end
    end)

    -- Keyboard Toggle
    UserInputService.InputBegan:Connect(function(input, processed)
        if not processed and input.KeyCode == toggleKey then
            closeActiveDropdown()
            MainFrame.Visible = not MainFrame.Visible
        end
    end)

    -- ---- SIDEBAR CONTAINER ----
    local Sidebar = Instance.new("Frame")
    Sidebar.Name = "Sidebar"
    Sidebar.Size = UDim2.new(0, 170, 1, -44)
    Sidebar.Position = UDim2.new(0, 0, 0, 44)
    Sidebar.BackgroundColor3 = currentTheme.Sidebar
    Sidebar.BorderSizePixel = 0
    Sidebar.Parent = MainFrame
    register("Sidebars", Sidebar)

    -- Sidebar Tab Search Bar
    local TabSearchFrame = Instance.new("Frame")
    TabSearchFrame.Size = UDim2.new(1, -14, 0, 30)
    TabSearchFrame.Position = UDim2.new(0, 7, 0, 8)
    TabSearchFrame.BackgroundColor3 = currentTheme.Card
    TabSearchFrame.BorderSizePixel = 0
    TabSearchFrame.Parent = Sidebar
    register("Cards", TabSearchFrame)
    makeCorner(TabSearchFrame, 7)
    local TSS = makeStroke(TabSearchFrame, currentTheme.Border, 1)
    register("Strokes", TSS)

    local TSIco = Instance.new("ImageLabel")
    TSIco.Size = UDim2.fromOffset(12, 12)
    TSIco.Position = UDim2.new(0, 8, 0.5, -6)
    TSIco.BackgroundTransparency = 1
    TSIco.Image = LucideIcons["lucide-search"]
    TSIco.ImageColor3 = currentTheme.TextFaint
    TSIco.ScaleType = Enum.ScaleType.Fit
    TSIco.Parent = TabSearchFrame

    local TabSearchInput = Instance.new("TextBox")
    TabSearchInput.Size = UDim2.new(1, -28, 1, 0)
    TabSearchInput.Position = UDim2.new(0, 24, 0, 0)
    TabSearchInput.BackgroundTransparency = 1
    TabSearchInput.Font = Enum.Font.Gotham
    TabSearchInput.PlaceholderText = "Search tabs..."
    TabSearchInput.PlaceholderColor3 = currentTheme.TextFaint
    TabSearchInput.Text = ""
    TabSearchInput.TextColor3 = currentTheme.Text
    TabSearchInput.TextSize = 11
    TabSearchInput.ClearTextOnFocus = false
    TabSearchInput.Parent = TabSearchFrame
    register("Texts", TabSearchInput)

    TabSearchInput.Focused:Connect(function() quickTween(TSS, 0.15, { Color = Color3.fromRGB(120, 120, 135) }) end)
    TabSearchInput.FocusLost:Connect(function() quickTween(TSS, 0.15, { Color = currentTheme.Border }) end)

    -- Tab Button Scroll Container (Default size accommodates profile card at bottom)
    local TabList = Instance.new("ScrollingFrame")
    TabList.Name = "TabList"
    TabList.Size = UDim2.new(1, -14, 1, -120)
    TabList.Position = UDim2.new(0, 7, 0, 44)
    TabList.BackgroundTransparency = 1
    TabList.BorderSizePixel = 0
    TabList.ScrollBarThickness = 2
    TabList.ScrollBarImageColor3 = Color3.fromRGB(45, 45, 55)
    TabList.CanvasSize = UDim2.new(0, 0, 0, 0)
    TabList.AutomaticCanvasSize = Enum.AutomaticSize.Y
    TabList.Parent = Sidebar

    local TabListLayout = Instance.new("UIListLayout")
    TabListLayout.SortOrder = Enum.SortOrder.LayoutOrder
    TabListLayout.Padding = UDim.new(0, 4)
    TabListLayout.Parent = TabList

    TabSearchInput:GetPropertyChangedSignal("Text"):Connect(function()
        local q = string.lower(TabSearchInput.Text)
        for _, t in ipairs(Win.Tabs) do
            t._btn.Visible = q == "" or string.find(string.lower(t.Name), q, 1, true) ~= nil
        end
    end)

    -- ============================================================
    --  ROBLOX PLAYER PROFILE CARD (Bottom-Left Sidebar)
    -- ============================================================
    local ProfileCard = Instance.new("Frame")
    ProfileCard.Name = "ProfileCard"
    ProfileCard.Size = UDim2.new(1, -14, 0, 60)
    ProfileCard.Position = UDim2.new(0, 7, 1, -68)
    ProfileCard.BackgroundColor3 = currentTheme.Card
    ProfileCard.BorderSizePixel = 0
    ProfileCard.Parent = Sidebar
    register("Cards", ProfileCard)
    makeCorner(ProfileCard, 9)
    local profStroke = makeStroke(ProfileCard, currentTheme.Border, 1)
    register("Strokes", profStroke)

    -- Avatar Headshot Frame
    local AvatarFrame = Instance.new("Frame")
    AvatarFrame.Size = UDim2.fromOffset(40, 40)
    AvatarFrame.Position = UDim2.new(0, 8, 0.5, -20)
    AvatarFrame.BackgroundColor3 = Color3.fromRGB(22, 22, 28)
    AvatarFrame.BorderSizePixel = 0
    AvatarFrame.Parent = ProfileCard
    makeCorner(AvatarFrame, 20)
    makeStroke(AvatarFrame, Color3.fromRGB(55, 55, 70), 1)

    local AvatarImg = Instance.new("ImageLabel")
    AvatarImg.Size = UDim2.new(1, 0, 1, 0)
    AvatarImg.BackgroundTransparency = 1
    AvatarImg.Image = "rbxthumb://type=AvatarHeadShot&id=" .. tostring(LocalPlayer.UserId) .. "&w=150&h=150"
    AvatarImg.ScaleType = Enum.ScaleType.Fit
    AvatarImg.Parent = AvatarFrame
    makeCorner(AvatarImg, 20)

    -- Online Status Dot
    local StatusDot = Instance.new("Frame")
    StatusDot.Size = UDim2.fromOffset(8, 8)
    StatusDot.Position = UDim2.new(0, 38, 0.5, 9)
    StatusDot.BackgroundColor3 = Color3.fromRGB(30, 215, 96)
    StatusDot.BorderSizePixel = 0
    StatusDot.ZIndex = 5
    StatusDot.Parent = ProfileCard
    makeCorner(StatusDot, 4)
    makeStroke(StatusDot, Color3.fromRGB(15, 15, 20), 1)

    -- Player Display Name
    local DisplayNameLbl = Instance.new("TextLabel")
    DisplayNameLbl.Size = UDim2.new(1, -56, 0, 16)
    DisplayNameLbl.Position = UDim2.new(0, 52, 0, 12)
    DisplayNameLbl.BackgroundTransparency = 1
    DisplayNameLbl.Font = Enum.Font.GothamBold
    DisplayNameLbl.Text = LocalPlayer.DisplayName
    DisplayNameLbl.TextColor3 = currentTheme.Text
    DisplayNameLbl.TextSize = 12
    DisplayNameLbl.TextXAlignment = Enum.TextXAlignment.Left
    DisplayNameLbl.TextTruncate = Enum.TextTruncate.AtEnd
    DisplayNameLbl.Parent = ProfileCard
    register("Texts", DisplayNameLbl)

    -- Player @Username
    local UsernameLbl = Instance.new("TextLabel")
    UsernameLbl.Size = UDim2.new(1, -56, 0, 14)
    UsernameLbl.Position = UDim2.new(0, 52, 0, 28)
    UsernameLbl.BackgroundTransparency = 1
    UsernameLbl.Font = Enum.Font.Gotham
    UsernameLbl.Text = "@" .. LocalPlayer.Name
    UsernameLbl.TextColor3 = currentTheme.TextMuted
    UsernameLbl.TextSize = 10
    UsernameLbl.TextXAlignment = Enum.TextXAlignment.Left
    UsernameLbl.TextTruncate = Enum.TextTruncate.AtEnd
    UsernameLbl.Parent = ProfileCard
    register("MutedTexts", UsernameLbl)

    -- In-Game Status Pill
    local StatusPill = Instance.new("Frame")
    StatusPill.Size = UDim2.new(0, 48, 0, 12)
    StatusPill.Position = UDim2.new(0, 52, 0, 44)
    StatusPill.BackgroundColor3 = Color3.fromRGB(18, 28, 22)
    StatusPill.BorderSizePixel = 0
    StatusPill.Parent = ProfileCard
    makeCorner(StatusPill, 3)

    local StatusTxt = Instance.new("TextLabel")
    StatusTxt.Size = UDim2.new(1, 0, 1, 0)
    StatusTxt.BackgroundTransparency = 1
    StatusTxt.Font = Enum.Font.GothamBold
    StatusTxt.Text = "IN-GAME"
    StatusTxt.TextColor3 = Color3.fromRGB(30, 215, 96)
    StatusTxt.TextSize = 8
    StatusTxt.Parent = StatusPill

    -- Show Profile Controller Function
    local isProfileVisible = true
    function Win:SetProfileVisible(show)
        isProfileVisible = show
        ProfileCard.Visible = show
        if show then
            quickTween(TabList, 0.2, { Size = UDim2.new(1, -14, 1, -120) })
        else
            quickTween(TabList, 0.2, { Size = UDim2.new(1, -14, 1, -52) })
        end
    end

    -- ---- CONTENT HOLDER ----
    local ContentHolder = Instance.new("Frame")
    ContentHolder.Name = "ContentHolder"
    ContentHolder.Size = UDim2.new(1, -170, 1, -44)
    ContentHolder.Position = UDim2.new(0, 170, 0, 44)
    ContentHolder.BackgroundTransparency = 1
    ContentHolder.ClipsDescendants = true
    ContentHolder.Parent = MainFrame

    -- Element Search Bar
    local ESearchFrame = Instance.new("Frame")
    ESearchFrame.Size = UDim2.new(1, -16, 0, 32)
    ESearchFrame.Position = UDim2.new(0, 8, 0, 6)
    ESearchFrame.BackgroundColor3 = currentTheme.Card
    ESearchFrame.BorderSizePixel = 0
    ESearchFrame.Parent = ContentHolder
    register("Cards", ESearchFrame)
    makeCorner(ESearchFrame, 8)
    local ESS = makeStroke(ESearchFrame, currentTheme.Border, 1)
    register("Strokes", ESS)

    local ESIco = Instance.new("ImageLabel")
    ESIco.Size = UDim2.fromOffset(13, 13)
    ESIco.Position = UDim2.new(0, 9, 0.5, -6)
    ESIco.BackgroundTransparency = 1
    ESIco.Image = LucideIcons["lucide-search"]
    ESIco.ImageColor3 = currentTheme.TextFaint
    ESIco.ScaleType = Enum.ScaleType.Fit
    ESIco.Parent = ESearchFrame

    local ESearchInput = Instance.new("TextBox")
    ESearchInput.Size = UDim2.new(1, -32, 1, 0)
    ESearchInput.Position = UDim2.new(0, 28, 0, 0)
    ESearchInput.BackgroundTransparency = 1
    ESearchInput.Font = Enum.Font.Gotham
    ESearchInput.PlaceholderText = "Search components & features..."
    ESearchInput.PlaceholderColor3 = currentTheme.TextFaint
    ESearchInput.Text = ""
    ESearchInput.TextColor3 = currentTheme.Text
    ESearchInput.TextSize = 11
    ESearchInput.ClearTextOnFocus = false
    ESearchInput.Parent = ESearchFrame
    register("Texts", ESearchInput)

    ESearchInput.Focused:Connect(function() quickTween(ESS, 0.15, { Color = Color3.fromRGB(120, 120, 135) }) end)
    ESearchInput.FocusLost:Connect(function() quickTween(ESS, 0.15, { Color = currentTheme.Border }) end)

    -- Tab Content Scroll View
    local TabScroll = Instance.new("ScrollingFrame")
    TabScroll.Name = "TabScroll"
    TabScroll.Size = UDim2.new(1, 0, 1, -44)
    TabScroll.Position = UDim2.new(0, 0, 0, 44)
    TabScroll.BackgroundTransparency = 1
    TabScroll.BorderSizePixel = 0
    TabScroll.ScrollBarThickness = 3
    TabScroll.ScrollBarImageColor3 = Color3.fromRGB(45, 45, 55)
    TabScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
    TabScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
    TabScroll.Parent = ContentHolder

    local TScrollLayout = Instance.new("UIListLayout")
    TScrollLayout.SortOrder = Enum.SortOrder.LayoutOrder
    TScrollLayout.Padding = UDim.new(0, 6)
    TScrollLayout.Parent = TabScroll

    local TScrollPad = Instance.new("UIPadding")
    TScrollPad.PaddingLeft = UDim.new(0, 8)
    TScrollPad.PaddingRight = UDim.new(0, 10)
    TScrollPad.PaddingTop = UDim.new(0, 4)
    TScrollPad.PaddingBottom = UDim.new(0, 10)
    TScrollPad.Parent = TabScroll

    TabScroll:GetPropertyChangedSignal("CanvasPosition"):Connect(closeActiveDropdown)

    ESearchInput:GetPropertyChangedSignal("Text"):Connect(function()
        if not Win.ActiveTab then return end
        local q = string.lower(ESearchInput.Text)
        for _, el in ipairs(Win.ActiveTab._elements) do
            if el._frame then
                el._frame.Visible = q == "" or string.find(el._name, q, 1, true) ~= nil
            end
        end
    end)

    -- ============================================================
    -- ============================================================
    --  IN-WINDOW TAB LOADER
    -- ============================================================
    -- ============================================================
    local InWindowLoader = Instance.new("Frame")
    InWindowLoader.Name = "InWindowLoader"
    InWindowLoader.Size = UDim2.new(1, 0, 1, 0)
    InWindowLoader.Position = UDim2.new(0, 0, 0, 0)
    InWindowLoader.BackgroundColor3 = currentTheme.BG
    InWindowLoader.BorderSizePixel = 0
    InWindowLoader.ZIndex = 600
    InWindowLoader.Parent = ContentHolder

    local SpinnerFrame = Instance.new("Frame")
    SpinnerFrame.Size = UDim2.fromOffset(50, 50)
    SpinnerFrame.Position = UDim2.new(0.5, -25, 0.5, -45)
    SpinnerFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
    SpinnerFrame.BorderSizePixel = 0
    SpinnerFrame.ZIndex = 601
    SpinnerFrame.Parent = InWindowLoader
    makeCorner(SpinnerFrame, 12)
    local spinStroke = makeStroke(SpinnerFrame, Color3.fromRGB(70, 70, 85), 1.5)

    local spinGrad = Instance.new("UIGradient")
    spinGrad.Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(35, 35, 35)),
        ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255, 255, 255)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(35, 35, 35)),
    })
    spinGrad.Parent = spinStroke

    local sRot = 0
    local spinConn = RunService.RenderStepped:Connect(function(dt)
        if SpinnerFrame and SpinnerFrame.Parent then
            sRot = (sRot + dt * 80) % 360
            spinGrad.Rotation = sRot
        end
    end)

    local SpinIcon = Instance.new("ImageLabel")
    SpinIcon.Size = UDim2.fromOffset(24, 24)
    SpinIcon.Position = UDim2.new(0.5, -12, 0.5, -12)
    SpinIcon.BackgroundTransparency = 1
    SpinIcon.Image = LucideIcons["lucide-activity"]
    SpinIcon.ImageColor3 = Color3.fromRGB(255, 255, 255)
    SpinIcon.ScaleType = Enum.ScaleType.Fit
    SpinIcon.ZIndex = 602
    SpinIcon.Parent = SpinnerFrame

    local LoadTitle = Instance.new("TextLabel")
    LoadTitle.Size = UDim2.new(1, 0, 0, 18)
    LoadTitle.Position = UDim2.new(0, 0, 0.5, 15)
    LoadTitle.BackgroundTransparency = 1
    LoadTitle.Font = Enum.Font.GothamBold
    LoadTitle.Text = "LOADING MODULES..."
    LoadTitle.TextColor3 = Color3.fromRGB(230, 230, 240)
    LoadTitle.TextSize = 12
    LoadTitle.ZIndex = 601
    LoadTitle.Parent = InWindowLoader

    local LoadSub = Instance.new("TextLabel")
    LoadSub.Size = UDim2.new(1, 0, 0, 14)
    LoadSub.Position = UDim2.new(0, 0, 0.5, 35)
    LoadSub.BackgroundTransparency = 1
    LoadSub.Font = Enum.Font.Code
    LoadSub.Text = "Initializing UI Tabs & Components"
    LoadSub.TextColor3 = Color3.fromRGB(120, 120, 135)
    LoadSub.TextSize = 9
    LoadSub.ZIndex = 601
    LoadSub.Parent = InWindowLoader

    local function dismissInWindowLoader()
        task.delay(1.0, function()
            spinConn:Disconnect()
            quickTween(InWindowLoader, 0.35, { BackgroundTransparency = 1 })
            for _, child in ipairs(InWindowLoader:GetDescendants()) do
                if child:IsA("Frame") or child:IsA("ImageLabel") then
                    pcall(function() quickTween(child, 0.25, { BackgroundTransparency = 1 }) end)
                elseif child:IsA("TextLabel") then
                    pcall(function() quickTween(child, 0.25, { TextTransparency = 1 }) end)
                end
            end
            task.delay(0.35, function()
                InWindowLoader.Visible = false
                InWindowLoader:Destroy()
            end)
        end)
    end

    -- ============================================================
    --  KEY SYSTEM VIEW
    -- ============================================================
    if keySystem then
        local KeyModal = Instance.new("Frame")
        KeyModal.Name = "KeySystemView"
        KeyModal.Size = UDim2.new(1, 0, 1, 0)
        KeyModal.BackgroundColor3 = currentTheme.BG
        KeyModal.BorderSizePixel = 0
        KeyModal.ZIndex = 700
        KeyModal.Parent = ContentHolder

        local KeyCard = Instance.new("Frame")
        KeyCard.Size = UDim2.fromOffset(360, 220)
        KeyCard.Position = UDim2.new(0.5, -180, 0.5, -110)
        KeyCard.BackgroundColor3 = Color3.fromRGB(16, 16, 22)
        KeyCard.BorderSizePixel = 0
        KeyCard.ZIndex = 701
        KeyCard.Parent = KeyModal
        makeCorner(KeyCard, 12)
        local keyStroke = makeStroke(KeyCard, Color3.fromRGB(50, 50, 65), 1.5)

        local LockIco = Instance.new("ImageLabel")
        LockIco.Size = UDim2.fromOffset(26, 26)
        LockIco.Position = UDim2.new(0.5, -13, 0, 16)
        LockIco.BackgroundTransparency = 1
        LockIco.Image = LucideIcons["lock"]
        LockIco.ImageColor3 = Color3.fromRGB(255, 255, 255)
        LockIco.ScaleType = Enum.ScaleType.Fit
        LockIco.ZIndex = 702
        LockIco.Parent = KeyCard

        local KTitle = Instance.new("TextLabel")
        KTitle.Size = UDim2.new(1, -20, 0, 20)
        KTitle.Position = UDim2.new(0, 10, 0, 48)
        KTitle.BackgroundTransparency = 1
        KTitle.Font = Enum.Font.GothamBold
        KTitle.Text = "SECURITY ACCESS REQUIRED"
        KTitle.TextColor3 = Color3.fromRGB(240, 240, 250)
        KTitle.TextSize = 13
        KTitle.ZIndex = 702
        KTitle.Parent = KeyCard

        local KSub = Instance.new("TextLabel")
        KSub.Size = UDim2.new(1, -30, 0, 16)
        KSub.Position = UDim2.new(0, 15, 0, 68)
        KSub.BackgroundTransparency = 1
        KSub.Font = Enum.Font.Gotham
        KSub.Text = "Please enter your license key to unlock Chiro UI."
        KSub.TextColor3 = Color3.fromRGB(130, 130, 145)
        KSub.TextSize = 10
        KSub.ZIndex = 702
        KSub.Parent = KeyCard

        local KInputBox = Instance.new("TextBox")
        KInputBox.Size = UDim2.new(1, -32, 0, 34)
        KInputBox.Position = UDim2.new(0, 16, 0, 94)
        KInputBox.BackgroundColor3 = Color3.fromRGB(11, 11, 15)
        KInputBox.BorderSizePixel = 0
        KInputBox.Font = Enum.Font.Code
        KInputBox.PlaceholderText = "Enter license key (e.g. CHIRO-2026)..."
        KInputBox.PlaceholderColor3 = Color3.fromRGB(80, 80, 95)
        KInputBox.Text = ""
        KInputBox.TextColor3 = Color3.fromRGB(255, 255, 255)
        KInputBox.TextSize = 12
        KInputBox.ClearTextOnFocus = false
        KInputBox.ZIndex = 702
        KInputBox.Parent = KeyCard
        makeCorner(KInputBox, 8)
        local kiStroke = makeStroke(KInputBox, Color3.fromRGB(45, 45, 60), 1)

        KInputBox.Focused:Connect(function() quickTween(kiStroke, 0.15, { Color = Color3.fromRGB(140, 140, 160) }) end)
        KInputBox.FocusLost:Connect(function() quickTween(kiStroke, 0.15, { Color = Color3.fromRGB(45, 45, 60) }) end)

        local StatusLbl = Instance.new("TextLabel")
        StatusLbl.Size = UDim2.new(1, -32, 0, 16)
        StatusLbl.Position = UDim2.new(0, 16, 0, 134)
        StatusLbl.BackgroundTransparency = 1
        StatusLbl.Font = Enum.Font.GothamMedium
        StatusLbl.Text = ""
        StatusLbl.TextColor3 = Color3.fromRGB(240, 70, 70)
        StatusLbl.TextSize = 10
        StatusLbl.ZIndex = 702
        StatusLbl.Parent = KeyCard

        local KBtnRow = Instance.new("Frame")
        KBtnRow.Size = UDim2.new(1, -32, 0, 34)
        KBtnRow.Position = UDim2.new(0, 16, 1, -48)
        KBtnRow.BackgroundTransparency = 1
        KBtnRow.ZIndex = 702
        KBtnRow.Parent = KeyCard

        local GetKeyBtn = Instance.new("TextButton")
        GetKeyBtn.Size = UDim2.new(0.48, -4, 1, 0)
        GetKeyBtn.Position = UDim2.new(0, 0, 0, 0)
        GetKeyBtn.BackgroundColor3 = Color3.fromRGB(26, 26, 34)
        GetKeyBtn.BorderSizePixel = 0
        GetKeyBtn.Font = Enum.Font.GothamBold
        GetKeyBtn.Text = "Get Key"
        GetKeyBtn.TextColor3 = Color3.fromRGB(200, 200, 215)
        GetKeyBtn.TextSize = 12
        GetKeyBtn.AutoButtonColor = false
        GetKeyBtn.ZIndex = 703
        GetKeyBtn.Parent = KBtnRow
        makeCorner(GetKeyBtn, 8)
        makeStroke(GetKeyBtn, Color3.fromRGB(50, 50, 65), 1)

        GetKeyBtn.MouseButton1Click:Connect(function()
            pcall(function() setclipboard(keyLink) end)
            Chiro:Notify({ Title = "KEY LINK COPIED", Content = "Paste into browser to obtain key.", Kind = "info", Duration = 3 })
        end)

        local VerifyBtn = Instance.new("TextButton")
        VerifyBtn.Size = UDim2.new(0.52, -4, 1, 0)
        VerifyBtn.Position = UDim2.new(0.48, 4, 0, 0)
        VerifyBtn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        VerifyBtn.BorderSizePixel = 0
        VerifyBtn.Font = Enum.Font.GothamBold
        VerifyBtn.Text = "Verify Key"
        VerifyBtn.TextColor3 = Color3.fromRGB(0, 0, 0)
        VerifyBtn.TextSize = 12
        VerifyBtn.AutoButtonColor = false
        VerifyBtn.ZIndex = 703
        VerifyBtn.Parent = KBtnRow
        makeCorner(VerifyBtn, 8)

        local function checkKey()
            local entered = KInputBox.Text:gsub("%s+", "")
            if entered == correctKey then
                StatusLbl.TextColor3 = Color3.fromRGB(30, 215, 96)
                StatusLbl.Text = "âœ“ ACCESS GRANTED â€” UNLOCKING..."
                LockIco.Image = LucideIcons["unlock"]
                LockIco.ImageColor3 = Color3.fromRGB(30, 215, 96)
                quickTween(keyStroke, 0.3, { Color = Color3.fromRGB(30, 215, 96) })
                task.delay(0.45, function()
                    quickTween(KeyModal, 0.3, { BackgroundTransparency = 1 })
                    quickTween(KeyCard, 0.25, { Size = UDim2.fromOffset(320, 180), Position = UDim2.new(0.5, -160, 0.5, -90) })
                    task.delay(0.3, function()
                        KeyModal.Visible = false
                        KeyModal:Destroy()
                        dismissInWindowLoader()
                        Chiro:Notify({ Title = "KEY VERIFIED", Content = "Welcome to Chiro UI v7.2.", Kind = "success", Duration = 4 })
                    end)
                end)
            else
                StatusLbl.TextColor3 = Color3.fromRGB(239, 68, 68)
                StatusLbl.Text = "âœ— INVALID KEY. PLEASE TRY AGAIN."
                quickTween(kiStroke, 0.15, { Color = Color3.fromRGB(239, 68, 68) })
                local origX = KeyCard.Position.X.Offset
                task.spawn(function()
                    for _, offset in ipairs({ -8, 8, -6, 6, -3, 3, 0 }) do
                        KeyCard.Position = UDim2.new(0.5, origX + offset, KeyCard.Position.Y.Scale, KeyCard.Position.Y.Offset)
                        task.wait(0.03)
                    end
                end)
            end
        end

        VerifyBtn.MouseButton1Click:Connect(checkKey)
        KInputBox.FocusLost:Connect(function(enter) if enter then checkKey() end end)
    else
        dismissInWindowLoader()
    end

    -- ============================================================
    --  BASE CARD HELPER
    -- ============================================================
    local function createBaseCard(height)
        local Card = Instance.new("Frame")
        Card.Size = UDim2.new(1, 0, 0, height or 44)
        Card.BackgroundColor3 = currentTheme.Card
        Card.BorderSizePixel = 0
        Card.Parent = TabScroll
        register("Cards", Card)
        makeCorner(Card, 8)
        local cs = makeStroke(Card, currentTheme.Border, 1)
        register("Strokes", cs)

        Card.MouseEnter:Connect(function()
            quickTween(Card, 0.15, { BackgroundColor3 = currentTheme.CardHover })
            quickTween(cs, 0.15, { Color = currentTheme.BorderHover })
        end)
        Card.MouseLeave:Connect(function()
            quickTween(Card, 0.15, { BackgroundColor3 = currentTheme.Card })
            quickTween(cs, 0.15, { Color = currentTheme.Border })
        end)
        return Card
    end

    -- ============================================================
    --  TAB CREATOR METHOD
    -- ============================================================
    function Win:CreateTab(tabCfg)
        tabCfg = tabCfg or {}
        local tabName = tabCfg.Name or "Tab"
        local iconId  = resolveIcon(tabCfg.Icon)
        local tabTag  = tabCfg.Tag

        local Tab = { Name = tabName, _elements = {} }

        local TBtn = Instance.new("TextButton")
        TBtn.Name = tabName .. "Btn"
        TBtn.Size = UDim2.new(1, 0, 0, 34)
        TBtn.BackgroundColor3 = Color3.fromRGB(16, 16, 21)
        TBtn.BorderSizePixel = 0
        TBtn.Text = ""
        TBtn.AutoButtonColor = false
        TBtn.Parent = TabList
        makeCorner(TBtn, 7)
        Tab._btn = TBtn

        local TBStroke = makeStroke(TBtn, Color3.fromRGB(35, 35, 45), 1)
        TBStroke.Transparency = 1

        if iconId then
            local tIco = Instance.new("ImageLabel")
            tIco.Size = UDim2.fromOffset(14, 14)
            tIco.Position = UDim2.new(0, 8, 0.5, -7)
            tIco.BackgroundTransparency = 1
            tIco.Image = iconId
            tIco.ImageColor3 = currentTheme.TextMuted
            tIco.ScaleType = Enum.ScaleType.Fit
            tIco.Parent = TBtn
        end

        local TBLbl = Instance.new("TextLabel")
        TBLbl.Size = UDim2.new(1, (iconId and -30 or -12) - (tabTag and 40 or 0), 1, 0)
        TBLbl.Position = UDim2.new(0, iconId and 28 or 10, 0, 0)
        TBLbl.BackgroundTransparency = 1
        TBLbl.Font = Enum.Font.GothamMedium
        TBLbl.Text = tabName
        TBLbl.TextColor3 = currentTheme.TextMuted
        TBLbl.TextSize = 12
        TBLbl.TextXAlignment = Enum.TextXAlignment.Left
        TBLbl.TextTruncate = Enum.TextTruncate.AtEnd
        TBLbl.Parent = TBtn
        register("MutedTexts", TBLbl)

        if tabTag then
            local tp = makeTagPill(TBtn, tabTag, Color3.fromRGB(30, 215, 96))
            tp.Position = UDim2.new(1, -38, 0.5, -8)
        end

        local function switchTab()
            closeActiveDropdown()
            for _, t in ipairs(Win.Tabs) do
                if t._btn then
                    quickTween(t._btn, 0.15, { BackgroundColor3 = Color3.fromRGB(16, 16, 21) })
                    local lb = t._btn:FindFirstChildOfClass("TextLabel")
                    if lb then quickTween(lb, 0.15, { TextColor3 = currentTheme.TextMuted }) end
                    local st = t._btn:FindFirstChildOfClass("UIStroke")
                    if st then quickTween(st, 0.15, { Transparency = 1 }) end
                end
                if t._elements then
                    for _, el in ipairs(t._elements) do
                        if el._frame then el._frame.Visible = false end
                    end
                end
            end

            quickTween(TBtn, 0.18, { BackgroundColor3 = Color3.fromRGB(28, 28, 36) })
            quickTween(TBLbl, 0.18, { TextColor3 = currentTheme.Text })
            quickTween(TBStroke, 0.18, { Transparency = 0 })
            Win.ActiveTab = Tab
            ESearchInput.Text = ""

            for i, el in ipairs(Tab._elements) do
                if el._frame then
                    el._frame.Visible = true
                    local origPos = el._frame.Position
                    el._frame.Position = UDim2.new(origPos.X.Scale, origPos.X.Offset, origPos.Y.Scale, origPos.Y.Offset + 6)
                    quickTween(el._frame, 0.18 + (i * 0.02), { Position = origPos }, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
                end
            end
        end

        Tab._selectTab = switchTab
        TBtn.MouseButton1Click:Connect(switchTab)
        table.insert(Win.Tabs, Tab)
        if #Win.Tabs == 1 then task.defer(switchTab) end

        -- ---- SECTION ----
        function Tab:CreateSection(secTitle)
            local Sec = Instance.new("Frame")
            Sec.Size = UDim2.new(1, 0, 0, 22)
            Sec.BackgroundTransparency = 1
            Sec.LayoutOrder = #Tab._elements + 1
            Sec.Parent = TabScroll

            local SecLine = Instance.new("Frame")
            SecLine.Size = UDim2.new(1, -90, 0, 1)
            SecLine.Position = UDim2.new(0, 0, 0.5, 0)
            SecLine.BackgroundColor3 = currentTheme.Border
            SecLine.BorderSizePixel = 0
            SecLine.Parent = Sec
            register("Strokes", Instance.new("UIStroke"))

            local SecLbl = Instance.new("TextLabel")
            SecLbl.Size = UDim2.new(0, 0, 1, 0)
            SecLbl.AutomaticSize = Enum.AutomaticSize.X
            SecLbl.Position = UDim2.new(1, -86, 0, 0)
            SecLbl.BackgroundTransparency = 1
            SecLbl.Font = Enum.Font.GothamBold
            SecLbl.Text = string.upper(secTitle)
            SecLbl.TextColor3 = currentTheme.TextFaint
            SecLbl.TextSize = 9
            SecLbl.Parent = Sec
            register("MutedTexts", SecLbl)

            table.insert(Tab._elements, { _frame = Sec, _name = string.lower(secTitle) })
            return Sec
        end

        -- ---- BUTTON ----
        function Tab:CreateButton(bCfg)
            bCfg = bCfg or {}
            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1

            local bIcon = resolveIcon(bCfg.Icon)
            local offsetLeft = 12

            if bIcon then
                local bImg = Instance.new("ImageLabel")
                bImg.Size = UDim2.fromOffset(15, 15)
                bImg.Position = UDim2.new(0, 12, 0.5, -7)
                bImg.BackgroundTransparency = 1
                bImg.Image = bIcon
                bImg.ImageColor3 = currentTheme.TextMuted
                bImg.ScaleType = Enum.ScaleType.Fit
                bImg.Parent = Card
                offsetLeft = 34
            end

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, offsetLeft, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = bCfg.Name or "Button"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            if bCfg.Tag then
                local bTag = makeTagPill(Card, bCfg.Tag, bCfg.TagColor or Color3.fromRGB(30, 215, 96))
                bTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)
                NLbl:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
                    bTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)
                end)
            end

            local ActBtn = Instance.new("TextButton")
            ActBtn.Size = UDim2.new(0, 80, 0, 28)
            ActBtn.Position = UDim2.new(1, -90, 0.5, -14)
            ActBtn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
            ActBtn.BorderSizePixel = 0
            ActBtn.Font = Enum.Font.GothamBold
            ActBtn.Text = bCfg.Label or "Run"
            ActBtn.TextColor3 = Color3.fromRGB(0, 0, 0)
            ActBtn.TextSize = 11
            ActBtn.AutoButtonColor = false
            ActBtn.Parent = Card
            makeCorner(ActBtn, 7)

            ActBtn.MouseEnter:Connect(function() quickTween(ActBtn, 0.1, { BackgroundColor3 = Color3.fromRGB(215, 215, 220) }) end)
            ActBtn.MouseLeave:Connect(function() quickTween(ActBtn, 0.1, { BackgroundColor3 = Color3.fromRGB(255, 255, 255) }) end)

            ActBtn.MouseButton1Click:Connect(function()
                quickTween(ActBtn, 0.06, { Size = UDim2.new(0, 74, 0, 24) })
                task.delay(0.06, function()
                    quickTween(ActBtn, 0.14, { Size = UDim2.new(0, 80, 0, 28) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
                end)
                if bCfg.Callback then bCfg.Callback() end
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(bCfg.Name or "button") })
            return Card
        end

        -- ---- TOGGLE (iOS Style) ----
        function Tab:CreateToggle(tCfg)
            tCfg = tCfg or {}
            local state = tCfg.Default == true
            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1

            local tIcon = resolveIcon(tCfg.Icon)
            local offsetLeft = 12

            if tIcon then
                local tImg = Instance.new("ImageLabel")
                tImg.Size = UDim2.fromOffset(15, 15)
                tImg.Position = UDim2.new(0, 12, 0.5, -7)
                tImg.BackgroundTransparency = 1
                tImg.Image = tIcon
                tImg.ImageColor3 = currentTheme.TextMuted
                tImg.ScaleType = Enum.ScaleType.Fit
                tImg.Parent = Card
                offsetLeft = 34
            end

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, offsetLeft, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = tCfg.Name or "Toggle"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            if tCfg.Tag then
                local tTag = makeTagPill(Card, tCfg.Tag, tCfg.TagColor or Color3.fromRGB(245, 158, 11))
                tTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)
                NLbl:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
                    tTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)
                end)
            end

            local PillTrack = Instance.new("Frame")
            PillTrack.Size = UDim2.fromOffset(44, 26)
            PillTrack.Position = UDim2.new(1, -54, 0.5, -13)
            PillTrack.BackgroundColor3 = state and currentTheme.ToggleOn or currentTheme.ToggleOff
            PillTrack.BorderSizePixel = 0
            PillTrack.Parent = Card
            makeCorner(PillTrack, 13)

            local Knob = Instance.new("Frame")
            Knob.Size = UDim2.fromOffset(20, 20)
            Knob.Position = UDim2.new(0, state and 21 or 3, 0.5, -10)
            Knob.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
            Knob.BorderSizePixel = 0
            Knob.Parent = PillTrack
            makeCorner(Knob, 10)
            makeStroke(Knob, Color3.fromRGB(200, 200, 210), 0.5)

            local HitBtn = Instance.new("TextButton")
            HitBtn.Size = UDim2.new(1, 0, 1, 0)
            HitBtn.BackgroundTransparency = 1
            HitBtn.Text = ""
            HitBtn.Parent = Card

            HitBtn.MouseButton1Click:Connect(function()
                state = not state
                local knobTarget = state and 21 or 3
                local trackColor = state and currentTheme.ToggleOn or currentTheme.ToggleOff

                quickTween(Knob, 0.16, { Position = UDim2.new(0, knobTarget, 0.5, -10), Size = UDim2.fromOffset(23, 20) }, Enum.EasingStyle.Quad)
                task.delay(0.16, function()
                    quickTween(Knob, 0.12, { Size = UDim2.fromOffset(20, 20) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
                end)
                quickTween(PillTrack, 0.2, { BackgroundColor3 = trackColor })
                if tCfg.Callback then tCfg.Callback(state) end
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(tCfg.Name or "toggle") })
            return Card
        end

        -- ---- SLIDER (iOS Style) ----
        function Tab:CreateSlider(sCfg)
            sCfg = sCfg or {}
            local min  = sCfg.Min or 0
            local max  = sCfg.Max or 100
            local dec  = sCfg.Decimals or 0
            local val  = clamp(sCfg.Default or min, min, max)

            local Card = createBaseCard(58)
            Card.LayoutOrder = #Tab._elements + 1

            local sIcon = resolveIcon(sCfg.Icon)
            local offsetLeft = 12

            if sIcon then
                local sImg = Instance.new("ImageLabel")
                sImg.Size = UDim2.fromOffset(15, 15)
                sImg.Position = UDim2.new(0, 12, 0, 9)
                sImg.BackgroundTransparency = 1
                sImg.Image = sIcon
                sImg.ImageColor3 = currentTheme.TextMuted
                sImg.ScaleType = Enum.ScaleType.Fit
                sImg.Parent = Card
                offsetLeft = 34
            end

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 0, 18)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, offsetLeft, 0, 8)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = sCfg.Name or "Slider"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            if sCfg.Tag then
                local sTag = makeTagPill(Card, sCfg.Tag, sCfg.TagColor or Color3.fromRGB(30, 215, 96))
                sTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0, 8)
                NLbl:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
                    sTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0, 8)
                end)
            end

            local ValLbl = Instance.new("TextLabel")
            ValLbl.Size = UDim2.new(0.3, -12, 0, 18)
            ValLbl.Position = UDim2.new(0.7, 0, 0, 8)
            ValLbl.BackgroundTransparency = 1
            ValLbl.Font = Enum.Font.GothamBold
            ValLbl.Text = tostring(val)
            ValLbl.TextColor3 = currentTheme.TextMuted
            ValLbl.TextSize = 12
            ValLbl.TextXAlignment = Enum.TextXAlignment.Right
            ValLbl.Parent = Card
            register("MutedTexts", ValLbl)

            local Track = Instance.new("Frame")
            Track.Size = UDim2.new(1, -24, 0, 7)
            Track.Position = UDim2.new(0, 12, 0, 36)
            Track.BackgroundColor3 = Color3.fromRGB(42, 42, 54)
            Track.BorderSizePixel = 0
            Track.Parent = Card
            makeCorner(Track, 4)

            local fillPct = (val - min) / math.max(max - min, 0.001)
            local Fill = Instance.new("Frame")
            Fill.Size = UDim2.new(fillPct, 0, 1, 0)
            Fill.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
            Fill.BorderSizePixel = 0
            Fill.Parent = Track
            makeCorner(Fill, 4)

            local Thumb = Instance.new("Frame")
            Thumb.Size = UDim2.fromOffset(22, 22)
            Thumb.Position = UDim2.new(fillPct, -11, 0.5, -11)
            Thumb.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
            Thumb.BorderSizePixel = 0
            Thumb.ZIndex = 3
            Thumb.Parent = Track
            makeCorner(Thumb, 11)
            makeStroke(Thumb, Color3.fromRGB(180, 180, 195), 0.5)

            local dragging = false

            local function updateSlider(absX)
                local tPos = Track.AbsolutePosition.X
                local tSize = Track.AbsoluteSize.X
                local pct = clamp((absX - tPos) / tSize, 0, 1)
                local raw = min + (max - min) * pct
                val = dec == 0 and math.floor(raw + 0.5) or math.floor(raw * 10^dec + 0.5) / 10^dec
                ValLbl.Text = tostring(val)
                Fill.Size = UDim2.new(pct, 0, 1, 0)
                Thumb.Position = UDim2.new(pct, -11, 0.5, -11)
                if sCfg.Callback then sCfg.Callback(val) end
            end

            local TouchArea = Instance.new("TextButton")
            TouchArea.Size = UDim2.new(1, 0, 3, 0)
            TouchArea.Position = UDim2.new(0, 0, -1, 0)
            TouchArea.BackgroundTransparency = 1
            TouchArea.Text = ""
            TouchArea.ZIndex = 5
            TouchArea.Parent = Track

            TouchArea.InputBegan:Connect(function(input)
                if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
                    dragging = true
                    quickTween(Thumb, 0.14, { Size = UDim2.fromOffset(28, 28) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
                    updateSlider(input.Position.X)
                end
            end)
            TouchArea.InputEnded:Connect(function(input)
                if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
                    dragging = false
                    quickTween(Thumb, 0.14, { Size = UDim2.fromOffset(22, 22) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
                end
            end)
            UserInputService.InputChanged:Connect(function(input)
                if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
                    updateSlider(input.Position.X)
                end
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(sCfg.Name or "slider") })
            return Card
        end

        -- ============================================================
        --  DROPDOWN (Single-Select, Top-Level Overlay)
        -- ============================================================
        function Tab:CreateDropdown(dCfg)
            dCfg = dCfg or {}
            local options = dCfg.Options or {}
            local current = dCfg.Default or options[1] or ""

            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1

            local dIcon = resolveIcon(dCfg.Icon)
            local offsetLeft = 12

            if dIcon then
                local dImg = Instance.new("ImageLabel")
                dImg.Size = UDim2.fromOffset(15, 15)
                dImg.Position = UDim2.new(0, 12, 0.5, -7)
                dImg.BackgroundTransparency = 1
                dImg.Image = dIcon
                dImg.ImageColor3 = currentTheme.TextMuted
                dImg.ScaleType = Enum.ScaleType.Fit
                dImg.Parent = Card
                offsetLeft = 34
            end

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, offsetLeft, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = dCfg.Name or "Dropdown"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            if dCfg.Tag then
                local dTag = makeTagPill(Card, dCfg.Tag, dCfg.TagColor or Color3.fromRGB(30, 215, 96))
                dTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)
            end

            local SelBtn = Instance.new("TextButton")
            SelBtn.Size = UDim2.new(0, 140, 0, 28)
            SelBtn.Position = UDim2.new(1, -150, 0.5, -14)
            SelBtn.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
            SelBtn.BorderSizePixel = 0
            SelBtn.Font = Enum.Font.GothamMedium
            SelBtn.Text = current .. "   "
            SelBtn.TextColor3 = currentTheme.Text
            SelBtn.TextSize = 11
            SelBtn.TextTruncate = Enum.TextTruncate.AtEnd
            SelBtn.AutoButtonColor = false
            SelBtn.Parent = Card
            makeCorner(SelBtn, 7)
            local sbs = makeStroke(SelBtn, currentTheme.Border, 1)

            local Chev = Instance.new("ImageLabel")
            Chev.Size = UDim2.fromOffset(12, 12)
            Chev.Position = UDim2.new(1, -18, 0.5, -6)
            Chev.BackgroundTransparency = 1
            Chev.Image = LucideIcons["lucide-chevron-down"]
            Chev.ImageColor3 = currentTheme.TextMuted
            Chev.ScaleType = Enum.ScaleType.Fit
            Chev.Parent = SelBtn

            SelBtn.MouseButton1Click:Connect(function()
                if ActiveFloatingMenu and ActiveOwnerBtn == SelBtn then
                    closeActiveDropdown()
                    return
                end

                closeActiveDropdown()

                local btnPos = SelBtn.AbsolutePosition
                local btnSize = SelBtn.AbsoluteSize
                local maxH = math.min(#options * 28 + 10, 160)
                local screenH = ScreenGui.AbsoluteSize.Y
                local openUp = (btnPos.Y + btnSize.Y + maxH + 10 > screenH) and (btnPos.Y - maxH - 4 > 10)

                local Menu = Instance.new("ScrollingFrame")
                Menu.Name = "FloatingDropdownList"
                Menu.Size = UDim2.fromOffset(btnSize.X, 0)
                Menu.Position = openUp and UDim2.fromOffset(btnPos.X, btnPos.Y - maxH - 4) or UDim2.fromOffset(btnPos.X, btnPos.Y + btnSize.Y + 4)
                Menu.BackgroundColor3 = Color3.fromRGB(18, 18, 25)
                Menu.BorderSizePixel = 0
                Menu.ZIndex = 8902
                Menu.ScrollBarThickness = 2
                Menu.ScrollBarImageColor3 = Color3.fromRGB(55, 55, 68)
                Menu.CanvasSize = UDim2.new(0, 0, 0, 0)
                Menu.AutomaticCanvasSize = Enum.AutomaticSize.Y
                Menu.Parent = DropdownLayer
                makeCorner(Menu, 8)
                makeStroke(Menu, Color3.fromRGB(50, 50, 65), 1.5)

                local MLayout = Instance.new("UIListLayout")
                MLayout.SortOrder = Enum.SortOrder.LayoutOrder
                MLayout.Padding = UDim.new(0, 2)
                MLayout.Parent = Menu

                local MPadding = Instance.new("UIPadding")
                MPadding.PaddingLeft = UDim.new(0, 4)
                MPadding.PaddingRight = UDim.new(0, 4)
                MPadding.PaddingTop = UDim.new(0, 4)
                MPadding.PaddingBottom = UDim.new(0, 4)
                MPadding.Parent = Menu

                for _, opt in ipairs(options) do
                    local OptBtn = Instance.new("TextButton")
                    OptBtn.Size = UDim2.new(1, 0, 0, 26)
                    OptBtn.BackgroundColor3 = opt == current and Color3.fromRGB(28, 28, 38) or Color3.fromRGB(18, 18, 25)
                    OptBtn.BorderSizePixel = 0
                    OptBtn.Font = Enum.Font.GothamMedium
                    OptBtn.Text = opt
                    OptBtn.TextColor3 = opt == current and Color3.fromRGB(255, 255, 255) or Color3.fromRGB(160, 160, 175)
                    OptBtn.TextSize = 11
                    OptBtn.AutoButtonColor = false
                    OptBtn.ZIndex = 8903
                    OptBtn.Parent = Menu
                    makeCorner(OptBtn, 6)

                    OptBtn.MouseEnter:Connect(function()
                        quickTween(OptBtn, 0.1, { BackgroundColor3 = Color3.fromRGB(34, 34, 46) })
                    end)
                    OptBtn.MouseLeave:Connect(function()
                        quickTween(OptBtn, 0.1, { BackgroundColor3 = opt == current and Color3.fromRGB(28, 28, 38) or Color3.fromRGB(18, 18, 25) })
                    end)

                    OptBtn.MouseButton1Click:Connect(function()
                        current = opt
                        SelBtn.Text = opt .. "   "
                        closeActiveDropdown()
                        if dCfg.Callback then dCfg.Callback(opt) end
                    end)
                end

                DropdownBackdrop.Visible = true
                ActiveFloatingMenu = Menu
                ActiveOwnerBtn = SelBtn
                quickTween(Menu, 0.18, { Size = UDim2.fromOffset(btnSize.X, maxH) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
                quickTween(Chev, 0.18, { Rotation = 180 })

                ActiveCloseCallback = function()
                    quickTween(Chev, 0.15, { Rotation = 0 })
                end
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(dCfg.Name or "dropdown") })
            return Card
        end

        -- ============================================================
        --  MULTI-DROPDOWN (Interactive Checkboxes, Top-Level Overlay)
        -- ============================================================
        function Tab:CreateMultiDropdown(mCfg)
            mCfg = mCfg or {}
            local options = mCfg.Options or {}
            local selectedMap = {}
            if mCfg.Default then
                for _, def in ipairs(mCfg.Default) do
                    selectedMap[def] = true
                end
            end

            local function getSelectedList()
                local list = {}
                for _, opt in ipairs(options) do
                    if selectedMap[opt] then table.insert(list, opt) end
                end
                return list
            end

            local function getSummaryText()
                local list = getSelectedList()
                if #list == 0 then return "None selected" end
                if #list <= 2 then return table.concat(list, ", ") end
                return tostring(#list) .. " Selected"
            end

            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1

            local mIcon = resolveIcon(mCfg.Icon) or LucideIcons["lucide-box"]
            local offsetLeft = 34

            local mImg = Instance.new("ImageLabel")
            mImg.Size = UDim2.fromOffset(15, 15)
            mImg.Position = UDim2.new(0, 12, 0.5, -7)
            mImg.BackgroundTransparency = 1
            mImg.Image = mIcon
            mImg.ImageColor3 = currentTheme.TextMuted
            mImg.ScaleType = Enum.ScaleType.Fit
            mImg.Parent = Card

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, offsetLeft, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = mCfg.Name or "Multi-Dropdown"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            local defTag = mCfg.Tag or "MULTI"
            local mTag = makeTagPill(Card, defTag, mCfg.TagColor or Color3.fromRGB(168, 85, 247))
            mTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)

            local SelBtn = Instance.new("TextButton")
            SelBtn.Size = UDim2.new(0, 150, 0, 28)
            SelBtn.Position = UDim2.new(1, -160, 0.5, -14)
            SelBtn.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
            SelBtn.BorderSizePixel = 0
            SelBtn.Font = Enum.Font.GothamMedium
            SelBtn.Text = getSummaryText() .. "   "
            SelBtn.TextColor3 = currentTheme.Text
            SelBtn.TextSize = 11
            SelBtn.TextTruncate = Enum.TextTruncate.AtEnd
            SelBtn.AutoButtonColor = false
            SelBtn.Parent = Card
            makeCorner(SelBtn, 7)
            makeStroke(SelBtn, currentTheme.Border, 1)

            local Chev = Instance.new("ImageLabel")
            Chev.Size = UDim2.fromOffset(12, 12)
            Chev.Position = UDim2.new(1, -18, 0.5, -6)
            Chev.BackgroundTransparency = 1
            Chev.Image = LucideIcons["lucide-chevron-down"]
            Chev.ImageColor3 = currentTheme.TextMuted
            Chev.ScaleType = Enum.ScaleType.Fit
            Chev.Parent = SelBtn

            SelBtn.MouseButton1Click:Connect(function()
                if ActiveFloatingMenu and ActiveOwnerBtn == SelBtn then
                    closeActiveDropdown()
                    return
                end

                closeActiveDropdown()

                local btnPos = SelBtn.AbsolutePosition
                local btnSize = SelBtn.AbsoluteSize
                local maxH = math.min(#options * 32 + 10, 180)
                local screenH = ScreenGui.AbsoluteSize.Y
                local openUp = (btnPos.Y + btnSize.Y + maxH + 10 > screenH) and (btnPos.Y - maxH - 4 > 10)

                local Menu = Instance.new("ScrollingFrame")
                Menu.Name = "FloatingMultiDropdownList"
                Menu.Size = UDim2.fromOffset(btnSize.X, 0)
                Menu.Position = openUp and UDim2.fromOffset(btnPos.X, btnPos.Y - maxH - 4) or UDim2.fromOffset(btnPos.X, btnPos.Y + btnSize.Y + 4)
                Menu.BackgroundColor3 = Color3.fromRGB(18, 18, 25)
                Menu.BorderSizePixel = 0
                Menu.ZIndex = 8902
                Menu.ScrollBarThickness = 2
                Menu.ScrollBarImageColor3 = Color3.fromRGB(55, 55, 68)
                Menu.CanvasSize = UDim2.new(0, 0, 0, 0)
                Menu.AutomaticCanvasSize = Enum.AutomaticSize.Y
                Menu.Parent = DropdownLayer
                makeCorner(Menu, 8)
                makeStroke(Menu, Color3.fromRGB(50, 50, 65), 1.5)

                local MLayout = Instance.new("UIListLayout")
                MLayout.SortOrder = Enum.SortOrder.LayoutOrder
                MLayout.Padding = UDim.new(0, 2)
                MLayout.Parent = Menu

                local MPadding = Instance.new("UIPadding")
                MPadding.PaddingLeft = UDim.new(0, 4)
                MPadding.PaddingRight = UDim.new(0, 4)
                MPadding.PaddingTop = UDim.new(0, 4)
                MPadding.PaddingBottom = UDim.new(0, 4)
                MPadding.Parent = Menu

                for _, opt in ipairs(options) do
                    local isChecked = selectedMap[opt] == true

                    local OptRow = Instance.new("TextButton")
                    OptRow.Size = UDim2.new(1, 0, 0, 30)
                    OptRow.BackgroundColor3 = isChecked and Color3.fromRGB(24, 30, 26) or Color3.fromRGB(18, 18, 25)
                    OptRow.BorderSizePixel = 0
                    OptRow.Text = ""
                    OptRow.AutoButtonColor = false
                    OptRow.ZIndex = 8903
                    OptRow.Parent = Menu
                    makeCorner(OptRow, 6)

                    local CheckBox = Instance.new("Frame")
                    CheckBox.Size = UDim2.fromOffset(16, 16)
                    CheckBox.Position = UDim2.new(0, 8, 0.5, -8)
                    CheckBox.BackgroundColor3 = isChecked and Color3.fromRGB(30, 215, 96) or Color3.fromRGB(24, 24, 32)
                    CheckBox.BorderSizePixel = 0
                    CheckBox.ZIndex = 8904
                    CheckBox.Parent = OptRow
                    makeCorner(CheckBox, 4)
                    local cbs = makeStroke(CheckBox, isChecked and Color3.fromRGB(30, 215, 96) or Color3.fromRGB(60, 60, 75), 1)

                    local CheckImg = Instance.new("ImageLabel")
                    CheckImg.Size = UDim2.fromOffset(12, 12)
                    CheckImg.Position = UDim2.new(0.5, -6, 0.5, -6)
                    CheckImg.BackgroundTransparency = 1
                    CheckImg.Image = LucideIcons["check"]
                    CheckImg.ImageColor3 = Color3.fromRGB(0, 0, 0)
                    CheckImg.ScaleType = Enum.ScaleType.Fit
                    CheckImg.Visible = isChecked
                    CheckImg.ZIndex = 8905
                    CheckImg.Parent = CheckBox

                    local RowLbl = Instance.new("TextLabel")
                    RowLbl.Size = UDim2.new(1, -34, 1, 0)
                    RowLbl.Position = UDim2.new(0, 30, 0, 0)
                    RowLbl.BackgroundTransparency = 1
                    RowLbl.Font = Enum.Font.GothamMedium
                    RowLbl.Text = opt
                    RowLbl.TextColor3 = isChecked and Color3.fromRGB(255, 255, 255) or Color3.fromRGB(160, 160, 175)
                    RowLbl.TextSize = 11
                    RowLbl.TextXAlignment = Enum.TextXAlignment.Left
                    RowLbl.ZIndex = 8904
                    RowLbl.Parent = OptRow

                    OptRow.MouseButton1Click:Connect(function()
                        selectedMap[opt] = not selectedMap[opt]
                        local nowChecked = selectedMap[opt] == true

                        CheckImg.Visible = nowChecked
                        quickTween(CheckBox, 0.12, { BackgroundColor3 = nowChecked and Color3.fromRGB(30, 215, 96) or Color3.fromRGB(24, 24, 32) })
                        quickTween(cbs, 0.12, { Color = nowChecked and Color3.fromRGB(30, 215, 96) or Color3.fromRGB(60, 60, 75) })
                        quickTween(OptRow, 0.12, { BackgroundColor3 = nowChecked and Color3.fromRGB(24, 30, 26) or Color3.fromRGB(18, 18, 25) })
                        RowLbl.TextColor3 = nowChecked and Color3.fromRGB(255, 255, 255) or Color3.fromRGB(160, 160, 175)

                        SelBtn.Text = getSummaryText() .. "   "

                        if mCfg.Callback then
                            mCfg.Callback(getSelectedList())
                        end
                    end)
                end

                DropdownBackdrop.Visible = true
                ActiveFloatingMenu = Menu
                ActiveOwnerBtn = SelBtn
                quickTween(Menu, 0.18, { Size = UDim2.fromOffset(btnSize.X, maxH) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
                quickTween(Chev, 0.18, { Rotation = 180 })

                ActiveCloseCallback = function()
                    quickTween(Chev, 0.15, { Rotation = 0 })
                end
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(mCfg.Name or "multidropdown") })
            return Card
        end

        -- ---- INPUT ----
        function Tab:CreateInput(iCfg)
            iCfg = iCfg or {}
            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1

            local iIcon = resolveIcon(iCfg.Icon)
            local offsetLeft = 12

            if iIcon then
                local iImg = Instance.new("ImageLabel")
                iImg.Size = UDim2.fromOffset(15, 15)
                iImg.Position = UDim2.new(0, 12, 0.5, -7)
                iImg.BackgroundTransparency = 1
                iImg.Image = iIcon
                iImg.ImageColor3 = currentTheme.TextMuted
                iImg.ScaleType = Enum.ScaleType.Fit
                iImg.Parent = Card
                offsetLeft = 34
            end

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, offsetLeft, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = iCfg.Name or "Input"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            if iCfg.Tag then
                local iTag = makeTagPill(Card, iCfg.Tag, iCfg.TagColor or Color3.fromRGB(30, 215, 96))
                iTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)
            end

            local Box = Instance.new("TextBox")
            Box.Size = UDim2.new(0, 160, 0, 28)
            Box.Position = UDim2.new(1, -170, 0.5, -14)
            Box.BackgroundColor3 = currentTheme.InputBG
            Box.BorderSizePixel = 0
            Box.Font = Enum.Font.Gotham
            Box.PlaceholderText = iCfg.Placeholder or "Type here..."
            Box.PlaceholderColor3 = currentTheme.TextFaint
            Box.Text = iCfg.Default or ""
            Box.TextColor3 = currentTheme.Text
            Box.TextSize = 12
            Box.ClearTextOnFocus = false
            Box.Parent = Card
            makeCorner(Box, 7)
            local bs = makeStroke(Box, currentTheme.Border, 1)

            Box.Focused:Connect(function() quickTween(bs, 0.15, { Color = Color3.fromRGB(140, 140, 160) }) end)
            Box.FocusLost:Connect(function(enter)
                quickTween(bs, 0.15, { Color = currentTheme.Border })
                if iCfg.Callback then iCfg.Callback(Box.Text, enter) end
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(iCfg.Name or "input") })
            return Card
        end

        -- ---- KEYBIND ----
        function Tab:CreateKeybind(kCfg)
            kCfg = kCfg or {}
            local key = kCfg.Default or Enum.KeyCode.Unknown
            local listening = false

            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, 12, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = kCfg.Name or "Keybind"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            if kCfg.Tag then
                local kTag = makeTagPill(Card, kCfg.Tag, kCfg.TagColor or Color3.fromRGB(30, 215, 96))
                kTag.Position = UDim2.new(0, 12 + NLbl.AbsoluteSize.X + 8, 0.5, -8)
            end

            local KBtn = Instance.new("TextButton")
            KBtn.Size = UDim2.new(0, 90, 0, 26)
            KBtn.Position = UDim2.new(1, -100, 0.5, -13)
            KBtn.BackgroundColor3 = Color3.fromRGB(22, 22, 28)
            KBtn.BorderSizePixel = 0
            KBtn.Font = Enum.Font.Code
            KBtn.Text = key.Name or "None"
            KBtn.TextColor3 = Color3.fromRGB(200, 200, 215)
            KBtn.TextSize = 11
            KBtn.AutoButtonColor = false
            KBtn.Parent = Card
            makeCorner(KBtn, 6)
            makeStroke(KBtn, currentTheme.Border, 1)

            KBtn.MouseButton1Click:Connect(function()
                if listening then return end
                listening = true
                KBtn.Text = "..."
                local conn
                conn = UserInputService.InputBegan:Connect(function(inp, proc)
                    if not proc and inp.KeyCode ~= Enum.KeyCode.Unknown then
                        key = inp.KeyCode
                        KBtn.Text = key.Name
                        listening = false
                        conn:Disconnect()
                        if kCfg.Callback then kCfg.Callback(key) end
                    end
                end)
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(kCfg.Name or "keybind") })
            return Card
        end

        -- ---- COLOR PICKER ----
        function Tab:CreateColorPicker(cCfg)
            cCfg = cCfg or {}
            local col = cCfg.Default or Color3.fromRGB(255, 80, 120)
            local isOpen = false

            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1
            Card.ClipsDescendants = false

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, 12, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = cCfg.Name or "Color"
            NLbl.TextColor3 = currentTheme.Text
            NLbl.TextSize = 13
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("Texts", NLbl)

            if cCfg.Tag then
                local cTag = makeTagPill(Card, cCfg.Tag, cCfg.TagColor or Color3.fromRGB(30, 215, 96))
                cTag.Position = UDim2.new(0, 12 + NLbl.AbsoluteSize.X + 8, 0.5, -8)
            end

            local Swatch = Instance.new("Frame")
            Swatch.Size = UDim2.fromOffset(36, 24)
            Swatch.Position = UDim2.new(1, -50, 0.5, -12)
            Swatch.BackgroundColor3 = col
            Swatch.BorderSizePixel = 0
            Swatch.Parent = Card
            makeCorner(Swatch, 6)
            makeStroke(Swatch, currentTheme.Border, 1)

            local SBtn = Instance.new("TextButton")
            SBtn.Size = UDim2.new(1, 0, 1, 0)
            SBtn.BackgroundTransparency = 1
            SBtn.Text = ""
            SBtn.Parent = Swatch

            local PPanel = Instance.new("Frame")
            PPanel.Size = UDim2.fromOffset(190, 0)
            PPanel.Position = UDim2.new(1, -200, 1, 6)
            PPanel.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
            PPanel.BorderSizePixel = 0
            PPanel.Visible = false
            PPanel.ZIndex = 350
            PPanel.Parent = Card
            makeCorner(PPanel, 8)
            makeStroke(PPanel, currentTheme.Border, 1)

            local H, S, V = col:ToHSV()

            local function addCSlider(name, yPos, defaultPct)
                local L = Instance.new("TextLabel")
                L.Size = UDim2.fromOffset(16, 12)
                L.Position = UDim2.new(0, 8, 0, yPos)
                L.BackgroundTransparency = 1
                L.Font = Enum.Font.Code
                L.Text = name
                L.TextColor3 = currentTheme.TextMuted
                L.TextSize = 9
                L.ZIndex = 351
                L.Parent = PPanel

                local Track = Instance.new("Frame")
                Track.Size = UDim2.new(1, -36, 0, 6)
                Track.Position = UDim2.new(0, 26, 0, yPos + 3)
                Track.BackgroundColor3 = Color3.fromRGB(38, 38, 48)
                Track.BorderSizePixel = 0
                Track.ZIndex = 351
                Track.Parent = PPanel
                makeCorner(Track, 3)

                local Kn = Instance.new("Frame")
                Kn.Size = UDim2.fromOffset(12, 12)
                Kn.Position = UDim2.new(defaultPct, -6, 0.5, -6)
                Kn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
                Kn.BorderSizePixel = 0
                Kn.ZIndex = 352
                Kn.Parent = Track
                makeCorner(Kn, 6)

                local cDragging = false
                local TBtn = Instance.new("TextButton")
                TBtn.Size = UDim2.new(1, 0, 3, 0)
                TBtn.Position = UDim2.new(0, 0, -1, 0)
                TBtn.BackgroundTransparency = 1
                TBtn.Text = ""
                TBtn.ZIndex = 353
                TBtn.Parent = Track

                TBtn.InputBegan:Connect(function(inp)
                    if inp.UserInputType == Enum.UserInputType.MouseButton1 then
                        cDragging = true
                        local pct = clamp((inp.Position.X - Track.AbsolutePosition.X) / Track.AbsoluteSize.X, 0, 1)
                        Kn.Position = UDim2.new(pct, -6, 0.5, -6)
                        if name == "H" then H = pct elseif name == "S" then S = pct else V = pct end
                        col = Color3.fromHSV(H, S, V)
                        Swatch.BackgroundColor3 = col
                        if cCfg.Callback then cCfg.Callback(col) end
                    end
                end)
                TBtn.InputEnded:Connect(function(inp)
                    if inp.UserInputType == Enum.UserInputType.MouseButton1 then cDragging = false end
                end)
                UserInputService.InputChanged:Connect(function(inp)
                    if cDragging and inp.UserInputType == Enum.UserInputType.MouseMovement then
                        local pct = clamp((inp.Position.X - Track.AbsolutePosition.X) / Track.AbsoluteSize.X, 0, 1)
                        Kn.Position = UDim2.new(pct, -6, 0.5, -6)
                        if name == "H" then H = pct elseif name == "S" then S = pct else V = pct end
                        col = Color3.fromHSV(H, S, V)
                        Swatch.BackgroundColor3 = col
                        if cCfg.Callback then cCfg.Callback(col) end
                    end
                end)
            end

            addCSlider("H", 10, H)
            addCSlider("S", 34, S)
            addCSlider("V", 58, V)

            SBtn.MouseButton1Click:Connect(function()
                isOpen = not isOpen
                PPanel.Visible = isOpen
                if isOpen then
                    quickTween(PPanel, 0.18, { Size = UDim2.fromOffset(190, 80) }, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
                else
                    quickTween(PPanel, 0.14, { Size = UDim2.fromOffset(190, 0) })
                    task.delay(0.15, function() PPanel.Visible = false end)
                end
            end)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(cCfg.Name or "color") })
            return Card
        end

        -- ---- STAT ----
        function Tab:CreateStat(stCfg)
            stCfg = stCfg or {}
            local Card = createBaseCard(44)
            Card.LayoutOrder = #Tab._elements + 1

            local sIcon = resolveIcon(stCfg.Icon)
            local offsetLeft = 12

            if sIcon then
                local sImg = Instance.new("ImageLabel")
                sImg.Size = UDim2.fromOffset(15, 15)
                sImg.Position = UDim2.new(0, 12, 0.5, -7)
                sImg.BackgroundTransparency = 1
                sImg.Image = sIcon
                sImg.ImageColor3 = currentTheme.TextMuted
                sImg.ScaleType = Enum.ScaleType.Fit
                sImg.Parent = Card
                offsetLeft = 34
            end

            local NLbl = Instance.new("TextLabel")
            NLbl.Size = UDim2.new(0, 0, 1, 0)
            NLbl.AutomaticSize = Enum.AutomaticSize.X
            NLbl.Position = UDim2.new(0, offsetLeft, 0, 0)
            NLbl.BackgroundTransparency = 1
            NLbl.Font = Enum.Font.GothamMedium
            NLbl.Text = stCfg.Name or "Stat"
            NLbl.TextColor3 = currentTheme.TextMuted
            NLbl.TextSize = 12
            NLbl.TextXAlignment = Enum.TextXAlignment.Left
            NLbl.Parent = Card
            register("MutedTexts", NLbl)

            if stCfg.Tag then
                local stTag = makeTagPill(Card, stCfg.Tag, stCfg.TagColor or Color3.fromRGB(30, 215, 96))
                stTag.Position = UDim2.new(0, offsetLeft + NLbl.AbsoluteSize.X + 8, 0.5, -8)
            end

            local VLbl = Instance.new("TextLabel")
            VLbl.Size = UDim2.new(0.4, -12, 1, 0)
            VLbl.Position = UDim2.new(0.6, 0, 0, 0)
            VLbl.BackgroundTransparency = 1
            VLbl.Font = Enum.Font.GothamBold
            VLbl.Text = tostring(stCfg.Value or "â€”")
            VLbl.TextColor3 = currentTheme.Text
            VLbl.TextSize = 13
            VLbl.TextXAlignment = Enum.TextXAlignment.Right
            VLbl.Parent = Card
            register("Texts", VLbl)

            local El = { _frame = Card }
            function El:SetValue(newVal) VLbl.Text = tostring(newVal) end
            table.insert(Tab._elements, { _frame = Card, _name = string.lower(stCfg.Name or "stat") })
            return El
        end

        -- ---- PARAGRAPH ----
        function Tab:CreateParagraph(pCfg)
            pCfg = pCfg or {}
            local Card = createBaseCard(0)
            Card.AutomaticSize = Enum.AutomaticSize.Y
            Card.LayoutOrder = #Tab._elements + 1

            local PPad = Instance.new("UIPadding")
            PPad.PaddingLeft = UDim.new(0, 12)
            PPad.PaddingRight = UDim.new(0, 12)
            PPad.PaddingTop = UDim.new(0, 10)
            PPad.PaddingBottom = UDim.new(0, 10)
            PPad.Parent = Card

            local PLayout = Instance.new("UIListLayout")
            PLayout.SortOrder = Enum.SortOrder.LayoutOrder
            PLayout.Padding = UDim.new(0, 4)
            PLayout.Parent = Card

            local Title = Instance.new("TextLabel")
            Title.Size = UDim2.new(1, 0, 0, 16)
            Title.AutomaticSize = Enum.AutomaticSize.Y
            Title.BackgroundTransparency = 1
            Title.Font = Enum.Font.GothamBold
            Title.Text = pCfg.Title or ""
            Title.TextColor3 = currentTheme.Text
            Title.TextSize = 12
            Title.TextXAlignment = Enum.TextXAlignment.Left
            Title.LayoutOrder = 1
            Title.Parent = Card
            register("Texts", Title)

            local Body = Instance.new("TextLabel")
            Body.Size = UDim2.new(1, 0, 0, 0)
            Body.AutomaticSize = Enum.AutomaticSize.Y
            Body.BackgroundTransparency = 1
            Body.Font = Enum.Font.Gotham
            Body.Text = pCfg.Content or ""
            Body.TextColor3 = currentTheme.TextMuted
            Body.TextSize = 11
            Body.TextXAlignment = Enum.TextXAlignment.Left
            Body.TextWrapped = true
            Body.LayoutOrder = 2
            Body.Parent = Card
            register("MutedTexts", Body)

            table.insert(Tab._elements, { _frame = Card, _name = string.lower(pCfg.Title or "paragraph") })
            return Card
        end

        return Tab
    end

    return Win
end

-- ============================================================
--  SHOWCASE DEMO
-- ============================================================
local Window = Chiro:CreateWindow({
    Title = "CHIRO",
    SubTitle = "v7.2 // CYBER",
    Tag = "PRO",
    KeySystem = false,
    Key = "CHIRO-2026",
    KeyLink = "https://discord.gg/chiro",
    ToggleKey = Enum.KeyCode.RightShift,
})

-- â”€â”€ 1. MAIN TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
local MainTab = Window:CreateTab({ Name = "Main", Icon = "zap", Tag = "HOT" })

MainTab:CreateSection("Dropdowns (Show on Top)")

MainTab:CreateDropdown({
    Name = "Visual Graphics",
    Icon = "palette",
    Tag = "TOP",
    TagColor = Color3.fromRGB(30, 215, 96),
    Options = { "Ultra High 4K", "Cinematic Cyber", "Optimized 60FPS", "Performance Low" },
    Default = "Cinematic Cyber",
    Callback = function(choice)
        Chiro:Notify({ Title = "GRAPHICS CHANGED", Content = "Selected: " .. choice, Duration = 2 })
    end
})

MainTab:CreateMultiDropdown({
    Name = "Active Visual Filters",
    Icon = "box",
    Tag = "MULTI",
    TagColor = Color3.fromRGB(168, 85, 247),
    Options = { "Bloom Glow", "Motion Blur", "Anti-Aliasing", "Shadow Details", "Color Grading" },
    Default = { "Bloom Glow", "Color Grading" },
    Callback = function(selectedList)
        Chiro:Notify({ Title = "FILTERS UPDATED", Content = "Active: " .. table.concat(selectedList, ", "), Duration = 2.5 })
    end
})

MainTab:CreateSection("Featured Controls")

MainTab:CreateButton({
    Name = "Trigger Alert Notification",
    Icon = "bell",
    Tag = "NEW",
    TagColor = Color3.fromRGB(30, 215, 96),
    Label = "Fire",
    Callback = function()
        Chiro:Notify({ Title = "ALERT TRIGGERED", Content = "Button action executed with success!", Kind = "success", Duration = 3 })
    end
})

MainTab:CreateToggle({
    Name = "Cyber Glow FX",
    Icon = "zap",
    Tag = "BETA",
    TagColor = Color3.fromRGB(168, 85, 247),
    Default = true,
    Callback = function(state) end
})

MainTab:CreateSlider({
    Name = "Haptic Sensitivity",
    Icon = "gauge",
    Tag = "iOS",
    TagColor = Color3.fromRGB(59, 130, 246),
    Min = 0,
    Max = 100,
    Default = 75,
    Decimals = 0,
    Callback = function(v) end
})

-- â”€â”€ 2. COMPONENTS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
local CompTab = Window:CreateTab({ Name = "Components", Icon = "box" })

CompTab:CreateSection("Inputs & Color")

CompTab:CreateInput({
    Name = "Custom Command",
    Icon = "zap",
    Placeholder = "Enter script or command...",
    Callback = function(txt, enter)
        if enter then
            Chiro:Notify({ Title = "COMMAND ENTERED", Content = txt, Duration = 3 })
        end
    end
})

CompTab:CreateColorPicker({
    Name = "Accent Theme Color",
    Icon = "palette",
    Default = Color3.fromRGB(30, 215, 96),
    Callback = function(col) end
})

-- â”€â”€ 3. TELEMETRY & GAME TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
local GameTab = Window:CreateTab({ Name = "Game", Icon = "gamepad" })

GameTab:CreateSection("Session Identifiers")

local pidStat = GameTab:CreateStat({ Name = "Place ID", Icon = "info", Tag = "LIVE", Value = tostring(CurrentPlaceId) })
local gidStat = GameTab:CreateStat({ Name = "Universe ID", Icon = "info", Value = tostring(CurrentGameId) })

GameTab:CreateSection("Live Performance")

local fpsStat = GameTab:CreateStat({ Name = "Frames Per Second", Icon = "activity", Value = "60 FPS" })
local pingStat= GameTab:CreateStat({ Name = "Network Latency", Icon = "wifi", Value = "0 MS" })
local memStat = GameTab:CreateStat({ Name = "Client Memory", Icon = "cpu", Value = "0 MB" })

local gCount, gLast = 0, os.clock()
RunService.RenderStepped:Connect(function()
    gCount += 1
    local now = os.clock()
    if now - gLast >= 0.4 then
        local liveFps = math.floor(gCount / (now - gLast) + 0.5)
        gCount = 0
        gLast = now
        fpsStat:SetValue(liveFps .. " FPS")
    end
end)

task.spawn(function()
    while ScreenGui and ScreenGui.Parent do
        pcall(function()
            local mem = math.floor(StatsService:GetTotalMemoryUsageMb())
            local ping= math.floor(StatsService.Network.ServerStatsItem["Data Ping"]:GetValue())
            pingStat:SetValue(ping .. " MS")
            memStat:SetValue(mem .. " MB")
        end)
        task.wait(0.4)
    end
end)

-- â”€â”€ 4. RAYFIELD-STYLE SETTINGS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
local SetTab = Window:CreateTab({ Name = "Settings", Icon = "settings" })

SetTab:CreateSection("Rayfield-Style Profile & Display")

-- Toggle Show/Hide Profile
SetTab:CreateToggle({
    Name = "Show Profile",
    Icon = "user",
    Tag = "PROFILE",
    TagColor = Color3.fromRGB(59, 130, 246),
    Default = true,
    Callback = function(show)
        Window:SetProfileVisible(show)
        Chiro:Notify({ Title = "PROFILE VISIBILITY", Content = "Roblox Profile " .. (show and "Shown" or "Hidden"), Duration = 2 })
    end
})

SetTab:CreateSection("Keybinds & Controls")

-- Dynamic Keybind (Default RightShift, rebindable to any key)
SetTab:CreateKeybind({
    Name = "UI Toggle Keybind",
    Tag = "REBIND",
    TagColor = Color3.fromRGB(30, 215, 96),
    Default = Enum.KeyCode.RightShift,
    Callback = function(newKey)
        Window:SetToggleKey(newKey)
        Chiro:Notify({ Title = "KEYBIND UPDATED", Content = "UI Toggle bound to: " .. tostring(newKey.Name), Kind = "success", Duration = 3 })
    end
})

SetTab:CreateSection("Appearance & Theme")

SetTab:CreateDropdown({
    Name = "Interface Theme",
    Icon = "palette",
    Options = { "Dark", "Light" },
    Default = "Dark",
    Callback = function(th) Window:SetTheme(th) end
})

SetTab:CreateParagraph({
    Title = "Chiro UI v7.2 Features",
    Content = "Includes full Roblox player headshot profile card with in-game badge, Rayfield-style Settings gear button in the topbar, dynamically rebindable RightShift toggle key, and top-level dropdown overlays."
})

print("[Chiro v7.2] Script initialized successfully with Profile & Settings.")
