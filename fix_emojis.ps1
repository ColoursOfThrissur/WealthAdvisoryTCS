$base = 'c:\Users\DerikShaju\Desktop\Derik\Projects\WelathAdvisoryDemo\WealthAdvisoryTCS\front end\src\components\overview\'

# ── MeetingIntelligence.jsx ──
$f = $base + 'MeetingIntelligence.jsx'
$c = Get-Content $f -Raw -Encoding UTF8

# Fix corrupted middle-dot separator
$c = $c -replace 'Today [^\$]+ \$\{new', 'Today · ${new'
# More targeted fix for the date label line
$c = $c -replace "Today [^`$]+ `\$\{new Date", "Today · `${new Date"
# Fix Daily · line
$c = $c -replace 'Daily [^ ]+ \$\{fmtTime', 'Daily · ${fmtTime'

# Replace emoji icon divs with lucide icons - need to add imports too
# 📅 calendar not connected (today tab)
$c = $c -replace '<div className="ov-meetings-empty__icon">[^<]+</div>\s*\n(\s*<span className="ov-meetings-empty__title">Calendar not connected</span>)', '<div className="ov-meetings-empty__icon"><Calendar size={24} /></div>' + "`n" + '            <span className="ov-meetings-empty__title">Calendar not connected</span>'
# ☀️ no meetings today  
$c = $c -replace '<div className="ov-meetings-empty__icon">[^<]+</div>\s*\n(\s*<span className="ov-meetings-empty__title">No meetings today</span>)', '<div className="ov-meetings-empty__icon"><Sun size={24} /></div>' + "`n" + '            <span className="ov-meetings-empty__title">No meetings today</span>'
# 🗓️ no upcoming meetings
$c = $c -replace '<div className="ov-meetings-empty__icon">[^<]+</div>\s*\n(\s*<span className="ov-meetings-empty__title">No meetings in the next', '<div className="ov-meetings-empty__icon"><CalendarDays size={24} /></div>' + "`n" + '            <span className="ov-meetings-empty__title">No meetings in the next'

# Add Calendar, Sun, CalendarDays to lucide import
$c = $c -replace "import \{ ChevronRight, RefreshCw, SlidersHorizontal, AlertTriangle \} from 'lucide-react';", "import { ChevronRight, RefreshCw, SlidersHorizontal, AlertTriangle, Calendar, Sun, CalendarDays } from 'lucide-react';"

Set-Content $f $c -NoNewline -Encoding UTF8
Write-Host "MeetingIntelligence.jsx done"

# ── MassMailerChat.jsx ──
$f = $base + 'MassMailerChat.jsx'
$c = Get-Content $f -Raw -Encoding UTF8

# Fix corrupted arrow (SUB control char \u001A -> →)
$c = $c -replace '<div className="mail-allocation-arrow">[^<]+</div>', '<div className="mail-allocation-arrow"><ArrowRight size={18} /></div>'
# Fix corrupted middle-dot separators
$c = $c -replace '([0-9]+)y [^ ]+ \{client\.riskProfile\}', '$1y · {client.riskProfile}'
# Fix corrupted em-dash in header
$c = $c -replace 'Email Preview [^ ]+ \{selectedMailClient\.clientName\}', 'Email Preview — {selectedMailClient.clientName}'
$c = $c -replace 'Market Event Response [^ ]+ \{activeMarketEvent\.title\}', 'Market Event Response — {activeMarketEvent.title}'
# Fix severity separator in meta
$c = $c -replace '\.split\(''T''\)\[0\]\} [^ ]+ \{activeMarketEvent\.severity\} Severity [^ ]+ \{activeMarketEvent\.subtitle\}', ".split('T')[0]} · {activeMarketEvent.severity} Severity · {activeMarketEvent.subtitle}"
# Fix confirmed checkmark (û -> ✓)
$c = $c -replace "'[^']*' Confirmed'", "'✓ Confirmed'"

# Add ArrowRight to lucide import
$c = $c -replace "import \{ Send, X, AlertTriangle, CheckCircle \} from 'lucide-react';", "import { Send, X, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';"

Set-Content $f $c -NoNewline -Encoding UTF8
Write-Host "MassMailerChat.jsx done"

# ── MeetingSettingsModal.jsx ──
$f = $base + 'MeetingSettingsModal.jsx'
$c = Get-Content $f -Raw -Encoding UTF8

# Fix corrupted checkmarks (û -> ✓)
$c = $c -replace "'[^']*' : ''}", "'✓' : ''}"
$c = $c -replace "<span className=""ov-domain-check"">û</span>", '<span className="ov-domain-check">✓</span>'
# Fix em-dash separators in labels
$c = $c -replace 'Personal [^ ]+ select to include', 'Personal — select to include'
$c = $c -replace 'Company [^ ]+ always included', 'Company — always included'

Set-Content $f $c -NoNewline -Encoding UTF8
Write-Host "MeetingSettingsModal.jsx done"

# ── PriorityQueue.jsx ──
$f = $base + 'PriorityQueue.jsx'
$c = Get-Content $f -Raw -Encoding UTF8

# Fix corrupted middle-dot separators (ú -> ·)
$c = $c -replace " ú ", " · "
# Fix corrupted up-arrow in keyContext
$c = $c -replace 'financial planning [^\x20-\x7E]', 'financial planning ↑'
# Fix em-dashes
$c = $c -replace 'retirement age [^ ]+ conservative', 'retirement age — conservative'

Set-Content $f $c -NoNewline -Encoding UTF8
Write-Host "PriorityQueue.jsx done"
