<#
.SYNOPSIS
  cvf_host_check.ps1 - one advisory host-load reading before a heavy job (Windows).

.DESCRIPTION
  What it is: a single bounded sample (default 3 s) of this computer's memory commit, available RAM,
  CPU, disk activity/latency/queue and free space, turned into one verdict: OK, BUSY, PRESSURE or
  UNKNOWN, plus a suggested number of parallel workers. Memory is the primary signal.

  Read this before relying on it:
  - It is a SNAPSHOT (a single moment), not a trend. The same machine can move from PRESSURE to BUSY
    within a minute.
  - It is machine-wide. It CANNOT name the culprit (which agent, job, VM or process caused the load).
  - It says NOTHING about SSD wear or drive health. "Disk busy" is not "disk dying".
  - It costs several seconds and noticeable CPU per sample (performance-counter start-up). Run it once
    before a heavy job; never call it in a tight loop. Total sampling time is bounded: SampleSeconds + 6 s;
    anything not collected by then is reported as UNKNOWN.
  - ADVISORY ONLY: it never blocks, kills, pauses or deletes anything, starts no background process
    (the counter read runs on an in-process thread that ends with the script), needs no admin rights,
    installs nothing and uses no network. A missing or failed counter is reported as UNKNOWN, never as
    OK. Native Windows counters and CIM only.
  - All thresholds below are tunable PROPOSALS, not validated or industry limits.
  - OK requires these to be measured: memory commit %, available RAM, CPU, system-disk activity and free
    space of the -Path volume. Otherwise the verdict is UNKNOWN (a PRESSURE or BUSY finding still wins).
    If only the project's disk (the -Path volume) activity is missing, the verdict can be OK but the
    message says that disk could not be measured.
  - Available RAM is judged on the MEDIAN of the readings taken during the sample (at least 3: a
    SampleSeconds below 3 is raised to 3).
  - suggestedMaxWorkers is a heuristic: clamp(floor(availableMemoryMB / 1500), 1, logical cores), at most
    2 when memory commit is >= 90%; 1 under PRESSURE; null when the memory signal is unknown.

  Output: a short human message by default (English; -Lang vi for Vietnamese). With -Json exactly one
  JSON object on stdout (schema cvf.hostCheck@1; technical `reasons` plus plain-language `plainReasons`).
  No host name, user name, path, error text or command line is emitted; failures use fixed categories.
  Progress lines of -WaitSeconds go to stderr.

  Exit code contract: exit code 0 for any well-formed command line; callers must treat any other exit
  code or empty output as UNKNOWN. The only other exit code is 3, on PRESSURE when -FailOnPressure is
  given. Bad or out-of-range VALUES are clamped or defaulted, never fatal. A MALFORMED command line is
  rejected by PowerShell itself before this script runs (non-zero exit, empty stdout): a value-less
  trailing parameter, a duplicated switch, or an ambiguous parameter-name prefix.

  Network location: if -Path is a UNC path or a network drive, host load for it cannot be measured;
  free space and that disk are UNKNOWN and the message says so in plain words.

.PARAMETER SampleSeconds   Length of the live sample, 1..10 (default 3; raised to at least 3 readings).
.PARAMETER Path            A path whose volume is checked for free space and disk activity (default: current dir).
.PARAMETER Json            Emit one JSON object instead of the human message.
.PARAMETER Lang            'en' (default) or 'vi'.
.PARAMETER FromSampleJson  Skip sampling; compute the verdict from a metrics JSON file (tests, deterministic reuse).
                           The file may hold one object or an array; an array is consumed one element per
                           re-sample of the wait loop (the last element repeats). It accepts this tool's own
                           -Json output. Optional top-level availableMemoryMBReadings (array) is reduced to
                           its median. Out-of-range values (percent outside 0..100, negatives, NaN) are UNKNOWN.
.PARAMETER WaitSeconds     0..1800 (default 0). While the verdict is PRESSURE for a reason that time can fix
                           (memory, CPU or disk activity), re-sample every IntervalSeconds until it is not
                           PRESSURE or the remaining wait time is below the interval. A PRESSURE that is only
                           low free disk space is never waited on.
.PARAMETER IntervalSeconds Seconds between re-samples while waiting (default 20, minimum 10; 0 is allowed only
                           together with -FromSampleJson).
.PARAMETER FailOnPressure  Exit 3 when the final verdict is PRESSURE.
.PARAMETER ForceCounterPath  Hidden test hook: 'perflib' skips the English counter names and uses the
                           locale-independent Perflib index mapping; 'cim' skips performance counters.
.PARAMETER ForceBudgetMs   Hidden test hook: total live-sampling budget in milliseconds (forces the
                           abandoned-read path, so everything not collected in time is UNKNOWN).
#>
param(
    [string]$SampleSeconds = '3',
    [string]$Path = '.',
    [switch]$Json,
    [string]$Lang = 'en',
    [string]$FromSampleJson = '',
    [string]$WaitSeconds = '0',
    [string]$IntervalSeconds = '20',
    [switch]$FailOnPressure,
    [string]$ForceCounterPath = '',
    [string]$ForceBudgetMs = '',
    [Parameter(ValueFromRemainingArguments = $true)][object[]]$IgnoredArguments
)

# ---- Tunable PROPOSALS (single place; not validated against real jobs) --------------------------------
$Thresholds = [ordered]@{
    PressureCommitPercent          = 97      # memory commit >= this => PRESSURE
    PressureCommitLowAvailPercent  = 93      # memory commit >= this AND available below the next line => PRESSURE
    PressureCommitLowAvailMB       = 1500
    PressureAvailableMB            = 500     # available RAM (median of readings) < this => PRESSURE
    PressureDiskActivePercent      = 90      # disk active >= this AND (write latency or queue below) => PRESSURE
    PressureDiskWriteSec           = 0.020   # avg sec/write >= this (20 ms)
    PressureDiskQueue              = 4       # queue length >= this
    PressureFreeGB                 = 2       # free space on the -Path volume < this => PRESSURE
    BusyCommitPercent              = 90
    BusyAvailableMB                = 1500
    BusyCpuPercent                 = 85
    BusyDiskActivePercent          = 70
    MBPerWorker                    = 1500    # suggestedMaxWorkers heuristic
    WorkersCapWhenCommitHigh       = 2       # suggestedMaxWorkers cap when commit >= BusyCommitPercent
    SamplingBudgetExtraSeconds     = 6       # live sampling must finish within SampleSeconds + this
    MinReadings                    = 3       # readings taken inside the sample window
}

$SchemaName = 'cvf.hostCheck@1'

# Key metrics, units and sane ranges (values outside the range are treated as UNKNOWN).
$MetricUnits = [ordered]@{
    memoryCommitPercent      = 'percent'
    availableMemoryMB        = 'MB'
    cpuPercent               = 'percent'
    systemDiskActivePercent  = 'percent'
    systemDiskAvgSecPerRead  = 'seconds'
    systemDiskAvgSecPerWrite = 'seconds'
    systemDiskQueueLength    = 'requests'
    repoDiskActivePercent    = 'percent'
    repoDiskAvgSecPerRead    = 'seconds'
    repoDiskAvgSecPerWrite   = 'seconds'
    repoDiskQueueLength      = 'requests'
    freeSpaceGB              = 'GB'
}
$UnitMax = @{ percent = 100.0; MB = 1e9; seconds = 1e6; requests = 1e6; GB = 1e9 }
$RequiredForOk = @('memoryCommitPercent', 'availableMemoryMB', 'cpuPercent', 'systemDiskActivePercent', 'freeSpaceGB')

# Fixed failure categories (never exception text or paths).
$Categories = @('sample file not found', 'sample file is not valid JSON', 'sampling failed', 'unsupported platform')

# Vietnamese text is stored as ASCII %uXXXX code-point escapes (hex) and decoded at run time (file stays ASCII).
$Text = @{
    en = @{
        OK                                 = 'This computer looks idle enough. Heavy work can run.'
        UNKNOWN                            = 'Could not measure this computer''s load. That does not mean it is healthy. You can try the job and watch whether the machine slows down.'
        PRESSURE_memory                    = 'This computer is short of memory. Consider closing apps you do not need or waiting a little, then run again; running now risks slowness or failures. CVF does not stop anything on its own - you decide.'
        PRESSURE_disk                      = 'The disk is working at full capacity. Consider waiting for it to calm down, then run again; running now risks slowness. CVF does not stop anything on its own - you decide.'
        PRESSURE_full                      = 'The disk is nearly full. Free up disk space before heavy work; waiting will not help. CVF does not delete anything - you decide.'
        PRESSURE_fullExtra                 = 'Also, the disk is nearly full: free up disk space.'
        BUSY_memory                        = 'This computer is using a lot of memory. Work can still run but may be slow. Consider closing apps you do not need first.'
        BUSY_disk                          = 'The disk is fairly busy. Work can still run but file operations may be slow.'
        BUSY_cpu                           = 'The processor is very busy right now. Work can still run but may be slower; consider waiting for the other work to finish.'
        projDisk                           = 'The project''s disk could not be measured.'
        netDisk                            = 'The project is on a network location; host load for a network location cannot be measured.'
        moment                             = 'This is a single moment and can change within a minute.'
        why                                = 'Why'
        workers                            = 'Suggested parallel workers (heuristic)'
        notMeasured                        = 'Not measured'
        waited                             = 'Waited'
        seconds                            = 's'
        stillPressure                      = 'Still under pressure after waiting.'
        unkPlain                           = 'Some key readings could not be taken.'
        'cat_unsupported platform'         = 'this check only measures Windows computers'
        'cat_sampling failed'              = 'the measurement did not work'
        'cat_sample file not found'        = 'the sample file was not found'
        'cat_sample file is not valid JSON' = 'the sample file is not valid JSON'
        un_memory                          = 'memory'
        un_cpu                             = 'processor'
        un_sysDisk                         = 'system disk'
        un_repoDisk                        = 'project disk'
        un_freeSpace                       = 'free disk space'
        pr_commit                          = 'memory is {0}% in use'
        pr_commitLow                       = 'memory is almost full ({0}% in use, only {1} MB free)'
        pr_avail                           = 'only {0} MB of memory is free'
        pr_cpu                             = 'the processor is {0}% busy'
        pr_systemDiskBusy                  = 'the system disk is {0}% busy'
        pr_systemDiskSlow                  = 'the system disk is {0}% busy and slow to respond'
        pr_repoDiskBusy                    = 'the project''s disk is {0}% busy'
        pr_repoDiskSlow                    = 'the project''s disk is {0}% busy and slow to respond'
        pr_free                            = 'only {0} GB of disk space is left'
    }
    vi = @{
        OK                                 = 'M%u00e1y t%u00ednh %u0111ang r%u1ea3nh. C%u00f3 th%u1ec3 ch%u1ea1y c%u00f4ng vi%u1ec7c n%u1eb7ng.'
        UNKNOWN                            = 'Ch%u01b0a %u0111o %u0111%u01b0%u1ee3c t%u00ecnh tr%u1ea1ng m%u00e1y. Kh%u00f4ng c%u00f3 ngh%u0129a l%u00e0 m%u00e1y kh%u1ecfe. C%u00f3 th%u1ec3 ch%u1ea1y th%u1eed v%u00e0 quan s%u00e1t xem m%u00e1y c%u00f3 ch%u1eadm kh%u00f4ng.'
        PRESSURE_memory                    = 'M%u00e1y t%u00ednh %u0111ang thi%u1ebfu b%u1ed9 nh%u1edb. N%u00ean %u0111%u00f3ng b%u1edbt %u1ee9ng d%u1ee5ng kh%u00f4ng c%u1ea7n thi%u1ebft ho%u1eb7c ch%u1edd m%u1ed9t l%u00fac r%u1ed3i ch%u1ea1y l%u1ea1i, v%u00ec ch%u1ea1y l%u00fac n%u00e0y d%u1ec5 b%u1ecb ch%u1eadm ho%u1eb7c l%u1ed7i. CVF kh%u00f4ng t%u1ef1 %u0111%u1ed9ng d%u1eebng g%u00ec c%u1ea3 - b%u1ea1n quy%u1ebft %u0111%u1ecbnh.'
        PRESSURE_disk                      = '%u1ed4 %u0111%u0129a %u0111ang ho%u1ea1t %u0111%u1ed9ng h%u1ebft c%u00f4ng su%u1ea5t. N%u00ean ch%u1edd %u1ed5 %u0111%u0129a b%u1edbt b%u1eadn r%u1ed3i ch%u1ea1y l%u1ea1i, v%u00ec ch%u1ea1y l%u00fac n%u00e0y d%u1ec5 b%u1ecb ch%u1eadm. CVF kh%u00f4ng t%u1ef1 %u0111%u1ed9ng d%u1eebng g%u00ec c%u1ea3 - b%u1ea1n quy%u1ebft %u0111%u1ecbnh.'
        PRESSURE_full                      = '%u1ed4 %u0111%u0129a g%u1ea7n %u0111%u1ea7y. C%u1ea7n gi%u1ea3i ph%u00f3ng dung l%u01b0%u1ee3ng %u1ed5 %u0111%u0129a tr%u01b0%u1edbc khi ch%u1ea1y vi%u1ec7c n%u1eb7ng; ch%u1edd %u0111%u1ee3i s%u1ebd kh%u00f4ng gi%u00fap %u0111%u01b0%u1ee3c. CVF kh%u00f4ng t%u1ef1 x%u00f3a g%u00ec c%u1ea3 - b%u1ea1n quy%u1ebft %u0111%u1ecbnh.'
        PRESSURE_fullExtra                 = 'Ngo%u00e0i ra, %u1ed5 %u0111%u0129a g%u1ea7n %u0111%u1ea7y: c%u1ea7n gi%u1ea3i ph%u00f3ng dung l%u01b0%u1ee3ng %u1ed5 %u0111%u0129a.'
        BUSY_memory                        = 'M%u00e1y t%u00ednh %u0111ang d%u00f9ng nhi%u1ec1u b%u1ed9 nh%u1edb. V%u1eabn ch%u1ea1y %u0111%u01b0%u1ee3c nh%u01b0ng c%u00f3 th%u1ec3 ch%u1eadm. N%u00ean %u0111%u00f3ng b%u1edbt %u1ee9ng d%u1ee5ng kh%u00f4ng c%u1ea7n thi%u1ebft tr%u01b0%u1edbc khi ch%u1ea1y.'
        BUSY_disk                          = '%u1ed4 %u0111%u0129a %u0111ang kh%u00e1 b%u1eadn. V%u1eabn ch%u1ea1y %u0111%u01b0%u1ee3c nh%u01b0ng thao t%u00e1c v%u1edbi t%u1ec7p c%u00f3 th%u1ec3 ch%u1eadm.'
        BUSY_cpu                           = 'B%u1ed9 x%u1eed l%u00fd %u0111ang r%u1ea5t b%u1eadn. V%u1eabn ch%u1ea1y %u0111%u01b0%u1ee3c nh%u01b0ng c%u00f3 th%u1ec3 ch%u1eadm h%u01a1n; n%u00ean ch%u1edd c%u00e1c vi%u1ec7c kh%u00e1c xong r%u1ed3i ch%u1ea1y.'
        projDisk                           = 'Ch%u01b0a %u0111o %u0111%u01b0%u1ee3c %u1ed5 %u0111%u0129a ch%u1ee9a d%u1ef1 %u00e1n.'
        netDisk                            = 'D%u1ef1 %u00e1n n%u1eb1m tr%u00ean v%u1ecb tr%u00ed m%u1ea1ng; kh%u00f4ng th%u1ec3 %u0111o t%u1ea3i c%u1ee7a m%u1ed9t v%u1ecb tr%u00ed m%u1ea1ng.'
        moment                             = '%u0110%u00e2y ch%u1ec9 l%u00e0 t%u00ecnh tr%u1ea1ng t%u1ea1i m%u1ed9t th%u1eddi %u0111i%u1ec3m v%u00e0 c%u00f3 th%u1ec3 thay %u0111%u1ed5i trong v%u00f2ng m%u1ed9t ph%u00fat.'
        why                                = 'L%u00fd do'
        workers                            = 'S%u1ed1 vi%u1ec7c ch%u1ea1y song song g%u1ee3i %u00fd (%u01b0%u1edbc l%u01b0%u1ee3ng)'
        notMeasured                        = 'Ch%u01b0a %u0111o %u0111%u01b0%u1ee3c'
        waited                             = '%u0110%u00e3 ch%u1edd'
        seconds                            = 'gi%u00e2y'
        stillPressure                      = 'V%u1eabn qu%u00e1 t%u1ea3i sau khi ch%u1edd.'
        unkPlain                           = 'M%u1ed9t s%u1ed1 ch%u1ec9 s%u1ed1 quan tr%u1ecdng ch%u01b0a %u0111o %u0111%u01b0%u1ee3c.'
        'cat_unsupported platform'         = 'ph%u00e9p %u0111o n%u00e0y ch%u1ec9 ch%u1ea1y tr%u00ean m%u00e1y Windows'
        'cat_sampling failed'              = 'vi%u1ec7c %u0111o kh%u00f4ng th%u00e0nh c%u00f4ng'
        'cat_sample file not found'        = 'kh%u00f4ng t%u00ecm th%u1ea5y t%u1ec7p m%u1eabu'
        'cat_sample file is not valid JSON' = 't%u1ec7p m%u1eabu kh%u00f4ng %u0111%u00fang %u0111%u1ecbnh d%u1ea1ng JSON'
        un_memory                          = 'b%u1ed9 nh%u1edb'
        un_cpu                             = 'b%u1ed9 x%u1eed l%u00fd'
        un_sysDisk                         = '%u1ed5 %u0111%u0129a h%u1ec7 th%u1ed1ng'
        un_repoDisk                        = '%u1ed5 %u0111%u0129a ch%u1ee9a d%u1ef1 %u00e1n'
        un_freeSpace                       = 'dung l%u01b0%u1ee3ng %u1ed5 %u0111%u0129a c%u00f2n tr%u1ed1ng'
        pr_commit                          = 'b%u1ed9 nh%u1edb %u0111%u00e3 d%u00f9ng t%u1edbi {0}%'
        pr_commitLow                       = 'b%u1ed9 nh%u1edb g%u1ea7n %u0111%u1ea7y (%u0111%u00e3 d%u00f9ng {0}%, ch%u1ec9 c%u00f2n tr%u1ed1ng {1} MB)'
        pr_avail                           = 'b%u1ed9 nh%u1edb tr%u1ed1ng c%u00f2n {0} MB'
        pr_cpu                             = 'b%u1ed9 x%u1eed l%u00fd %u0111ang b%u1eadn {0}%'
        pr_systemDiskBusy                  = '%u1ed5 %u0111%u0129a h%u1ec7 th%u1ed1ng %u0111ang ho%u1ea1t %u0111%u1ed9ng {0}%'
        pr_systemDiskSlow                  = '%u1ed5 %u0111%u0129a h%u1ec7 th%u1ed1ng %u0111ang ho%u1ea1t %u0111%u1ed9ng {0}% v%u00e0 ph%u1ea3n h%u1ed3i ch%u1eadm'
        pr_repoDiskBusy                    = '%u1ed5 %u0111%u0129a ch%u1ee9a d%u1ef1 %u00e1n %u0111ang ho%u1ea1t %u0111%u1ed9ng {0}%'
        pr_repoDiskSlow                    = '%u1ed5 %u0111%u0129a ch%u1ee9a d%u1ef1 %u00e1n %u0111ang ho%u1ea1t %u0111%u1ed9ng {0}% v%u00e0 ph%u1ea3n h%u1ed3i ch%u1eadm'
        pr_free                            = '%u1ed5 %u0111%u0129a ch%u1ec9 c%u00f2n tr%u1ed1ng {0} GB'
    }
}

# ---- helpers -------------------------------------------------------------------------------------------
function ConvertFrom-UEscape([string]$s) {
    return [regex]::Replace($s, '%u([0-9a-fA-F]{4})', [System.Text.RegularExpressions.MatchEvaluator]{
        param($m) [string][char][Convert]::ToInt32($m.Groups[1].Value, 16) })
}

function Get-Label([string]$lang, [string]$key) {
    return (ConvertFrom-UEscape $script:Text[$lang][$key])
}

function Format-Num($v, [string]$fmt = '0.###') {
    if ($null -eq $v) { return 'n/a' }
    return [string]::Format([System.Globalization.CultureInfo]::InvariantCulture, '{0:' + $fmt + '}', [double]$v)
}

function ConvertTo-ClampedInt([string]$s, [int]$default, [int]$min, [int]$max) {
    $d = 0.0
    $ok = [double]::TryParse([string]$s, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$d)
    if (-not $ok -or [double]::IsNaN($d) -or [double]::IsInfinity($d)) { return $default }
    if ($d -lt $min) { return $min }
    if ($d -gt $max) { return $max }
    return [int][math]::Floor($d)
}

function Write-Err([string]$line) { [Console]::Error.WriteLine($line) }

function ConvertTo-AsciiJson($obj) {
    $j = ConvertTo-Json -InputObject $obj -Depth 6 -Compress
    # Windows PowerShell 5.1 escapes < > & ' as unicode escapes; restore them (still valid JSON inside strings).
    $bs = [string][char]92
    $j = $j.Replace($bs + 'u003c', '<').Replace($bs + 'u003e', '>').Replace($bs + 'u0026', '&').Replace($bs + 'u0027', "'")
    return [regex]::Replace($j, '[^\x00-\x7F]', [System.Text.RegularExpressions.MatchEvaluator]{
        param($m) ('\u{0:x4}' -f [int][char]$m.Value) })
}

function Get-Median($list) {
    if ($null -eq $list) { return $null }
    $arr = @($list | Sort-Object)
    if ($arr.Count -eq 0) { return $null }
    $mid = [int][math]::Floor($arr.Count / 2)
    if (($arr.Count % 2) -eq 1) { return [double]$arr[$mid] }
    return (([double]$arr[$mid - 1] + [double]$arr[$mid]) / 2.0)
}

function Get-Mean($list) {
    if ($null -eq $list -or $list.Count -eq 0) { return $null }
    $sum = 0.0; foreach ($x in $list) { $sum += [double]$x }
    return ($sum / $list.Count)
}

# ---- live sampling (Windows) -----------------------------------------------------------------------------
# The counter read runs on an in-process runspace so it can be abandoned when the time budget is spent.
$CollectorScript = @'
param($Paths, $Names, $Seconds)
$raw = $null
try { $raw = Get-Counter -Counter $Paths -SampleInterval 1 -MaxSamples $Seconds -ErrorAction SilentlyContinue } catch { $raw = $null }
foreach ($set in @($raw)) {
    if ($null -eq $set) { continue }
    foreach ($s in $set.CounterSamples) {
        $p = ([string]$s.Path).ToLowerInvariant(); $key = $null
        foreach ($k in $Names.Keys) {
            if ($p.EndsWith('\' + ([string]$Names[$k]).ToLowerInvariant())) { $key = $k; break }
        }
        if (-not $key) { continue }
        $v = [double]$s.CookedValue
        if ([double]::IsNaN($v) -or [double]::IsInfinity($v)) { continue }
        [pscustomobject]@{ k = [string]$key; i = [string]$s.InstanceName; v = $v }
    }
}
'@

$script:Abandoned = $false

function Invoke-CounterCollect {
    param([string[]]$Paths, [hashtable]$Names, [int]$Seconds, [int]$TimeoutMs, [hashtable]$Series)
    if ($TimeoutMs -lt 200) { return }
    $ps = [powershell]::Create()
    try {
        [void]$ps.AddScript($script:CollectorScript).AddArgument($Paths).AddArgument($Names).AddArgument($Seconds)
        $ar = $ps.BeginInvoke()
        if ($ar.AsyncWaitHandle.WaitOne($TimeoutMs)) {
            $rows = $ps.EndInvoke($ar)
            foreach ($r in $rows) {
                $key = [string]$r.k; $inst = [string]$r.i
                if (-not $Series.ContainsKey($key)) { $Series[$key] = @{} }
                if (-not $Series[$key].ContainsKey($inst)) { $Series[$key][$inst] = New-Object System.Collections.ArrayList }
                [void]$Series[$key][$inst].Add([double]$r.v)
            }
            $ps.Dispose()
        } else {
            $script:Abandoned = $true          # budget spent: whatever was not collected stays UNKNOWN
            [void]$ps.BeginStop($null, $null)
        }
    } catch {
        $script:Abandoned = $true
    }
}

function Find-DiskInstance([hashtable]$Series, [string]$key, [string]$letter) {
    # physical-disk instance names look like "0 C:" or "1 D: G:"
    if (-not $letter -or -not $Series.ContainsKey($key)) { return $null }
    foreach ($inst in $Series[$key].Keys) {
        if ($inst -match ('(^|\s)' + [regex]::Escape($letter) + '(\s|$)')) { return $inst }
    }
    return $null
}

function Get-CimSafe([string]$ClassName, [int]$RemainingMs) {
    # The CIM timeout never exceeds 5 s nor the remaining budget (at least 1 s); skipped when under 1 s remains.
    if ($RemainingMs -lt 1000) { return $null }
    $t = [uint32][math]::Max(1, [math]::Min(5, [math]::Floor($RemainingMs / 1000.0)))
    try { return (Get-CimInstance -ClassName $ClassName -OperationTimeoutSec $t -ErrorAction Stop) } catch { return $null }
}

function Get-LiveSample {
    param([int]$Seconds, [string]$TargetPath, [string]$Force, [int]$BudgetMsOverride = 0)

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $budget = $Seconds + $script:Thresholds.SamplingBudgetExtraSeconds
    if ($BudgetMsOverride -gt 0) { $budget = $BudgetMsOverride / 1000.0 }   # hidden test hook
    $readings = [math]::Max($Seconds, $script:Thresholds.MinReadings)
    function Get-RemainingMs { return [int][math]::Max(0, ($budget - $sw.Elapsed.TotalSeconds) * 1000) }

    # CIM first (quick): total RAM for context, and fallback values for memory/CPU.
    $cimAvail = $null; $cimCommit = $null; $cimCpu = $null; $totalMB = $null
    if ((Get-RemainingMs) -ge 1000) {
        $os = Get-CimSafe 'Win32_OperatingSystem' (Get-RemainingMs)
        if ($null -ne $os) {
            try {
                $totalMB = [math]::Round([double]$os.TotalVisibleMemorySize / 1024.0, 0)
                $cimAvail = [double]$os.FreePhysicalMemory / 1024.0
                if ([double]$os.TotalVirtualMemorySize -gt 0) {
                    $cimCommit = 100.0 * ([double]$os.TotalVirtualMemorySize - [double]$os.FreeVirtualMemory) / [double]$os.TotalVirtualMemorySize
                }
            } catch { }
        }
    }

    $english = [ordered]@{
        idle   = @('PhysicalDisk', '% Idle Time', '(*)')
        rlat   = @('PhysicalDisk', 'Avg. Disk sec/Read', '(*)')
        wlat   = @('PhysicalDisk', 'Avg. Disk sec/Write', '(*)')
        queue  = @('PhysicalDisk', 'Current Disk Queue Length', '(*)')
        cpu    = @('Processor', '% Processor Time', '(_Total)')
        avail  = @('Memory', 'Available MBytes', '')
        commit = @('Memory', '% Committed Bytes In Use', '')
    }
    $series = @{}
    if ($Force -ne 'cim') {
        if ($Force -ne 'perflib') {
            $paths = @(); $names = @{}
            foreach ($k in $english.Keys) { $n = $english[$k]; $paths += ('\' + $n[0] + $n[2] + '\' + $n[1]); $names[$k] = $n[1] }
            Invoke-CounterCollect -Paths $paths -Names $names -Seconds $readings -TimeoutMs (Get-RemainingMs) -Series $series
        }
        # Locale fallback: retry ONLY the keys that are still missing, and only when the localized names differ.
        $missing = @($english.Keys | Where-Object { -not $series.ContainsKey($_) })
        if ($missing.Count -gt 0 -and -not $script:Abandoned -and (Get-RemainingMs) -gt 3000) {
            try {
                $base = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Perflib'
                $e = (Get-ItemProperty -Path "$base\009" -Name Counter -ErrorAction Stop).Counter
                $l = (Get-ItemProperty -Path "$base\CurrentLanguage" -Name Counter -ErrorAction Stop).Counter
                $eng = @{}; $loc = @{}
                for ($i = 0; $i -lt $e.Count - 1; $i += 2) { $nm = $e[$i + 1]; if (-not $eng.ContainsKey($nm)) { $eng[$nm] = $e[$i] } }
                for ($i = 0; $i -lt $l.Count - 1; $i += 2) { $loc[$l[$i]] = $l[$i + 1] }
                $paths2 = @(); $names2 = @{}
                foreach ($k in $missing) {
                    $a = $english[$k]; $o = $a[0]; $c2 = $a[1]
                    if ($eng.ContainsKey($a[0]) -and $loc.ContainsKey($eng[$a[0]])) { $o = $loc[$eng[$a[0]]] }
                    if ($eng.ContainsKey($a[1]) -and $loc.ContainsKey($eng[$a[1]])) { $c2 = $loc[$eng[$a[1]]] }
                    $same = (($o -ieq $a[0]) -and ($c2 -ieq $a[1]))
                    if ($same -and $Force -ne 'perflib') { continue }   # nothing new to try for this key
                    $paths2 += ('\' + $o + $a[2] + '\' + $c2); $names2[$k] = $c2
                }
                if ($paths2.Count -gt 0) {
                    $secs2 = [int][math]::Max(1, [math]::Min($readings, [math]::Floor((Get-RemainingMs) / 1000.0) - 3))
                    Invoke-CounterCollect -Paths $paths2 -Names $names2 -Seconds $secs2 -TimeoutMs (Get-RemainingMs) -Series $series
                }
            } catch { }
        }
    }
    if (-not $series.ContainsKey('cpu') -and (Get-RemainingMs) -ge 1000) {
        $procs = Get-CimSafe 'Win32_Processor' (Get-RemainingMs)
        if ($null -ne $procs) {
            try {
                $lp = @($procs | ForEach-Object { $_.LoadPercentage } | Where-Object { $null -ne $_ })
                if ($lp.Count -gt 0) { $cimCpu = (($lp | Measure-Object -Average).Average) }
            } catch { }
        }
    }

    function First-Series([string]$key, [bool]$Median) {
        if (-not $series.ContainsKey($key)) { return $null }
        foreach ($inst in $series[$key].Keys) {
            if ($Median) { return (Get-Median $series[$key][$inst]) }
            return (Get-Mean $series[$key][$inst])
        }
        return $null
    }
    function Clamp([object]$v, [double]$lo, [double]$hi) {
        if ($null -eq $v) { return $null }
        return [math]::Min($hi, [math]::Max($lo, [double]$v))
    }

    $vals = [ordered]@{}
    foreach ($k in $script:MetricUnits.Keys) { $vals[$k] = $null }
    $c = First-Series 'commit' $false; if ($null -eq $c) { $c = $cimCommit }
    $vals['memoryCommitPercent'] = Clamp $c 0 100
    $a = First-Series 'avail' $true;   if ($null -eq $a) { $a = $cimAvail }
    if ($null -ne $a) { $vals['availableMemoryMB'] = [math]::Max(0.0, [double]$a) }
    $u = First-Series 'cpu' $false;    if ($null -eq $u) { $u = $cimCpu }
    $vals['cpuPercent'] = Clamp $u 0 100

    # volumes
    $sysLetter = $null; if ($env:SystemDrive) { $sysLetter = $env:SystemDrive.TrimEnd('\').ToUpperInvariant() }
    $repoLetter = $null
    $netPath = $false
    try {
        $full = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($TargetPath)
        $root = [System.IO.Path]::GetPathRoot($full)
        if ($root -match '^(\\\\|//)') { $netPath = $true }
        elseif ($root -match '^[A-Za-z]:') {
            $repoLetter = $root.Substring(0, 2).ToUpperInvariant()
            try {
                $dt = (New-Object System.IO.DriveInfo ($repoLetter.Substring(0, 1))).DriveType
                if ($dt -eq [System.IO.DriveType]::Network) { $netPath = $true; $repoLetter = $null }
            } catch { }
        }
    } catch { }
    $instSys = Find-DiskInstance $series 'idle' $sysLetter
    $instRepo = Find-DiskInstance $series 'idle' $repoLetter
    foreach ($role in @(@('system', $instSys), @('repo', $instRepo))) {
        $inst = $role[1]; if (-not $inst) { continue }
        $idle = Get-Mean $series['idle'][$inst]
        if ($null -ne $idle) { $vals[$role[0] + 'DiskActivePercent'] = 100.0 - (Clamp $idle 0 100) }
        foreach ($pair in @(@('rlat', 'AvgSecPerRead'), @('wlat', 'AvgSecPerWrite'), @('queue', 'QueueLength'))) {
            if ($series.ContainsKey($pair[0]) -and $series[$pair[0]].ContainsKey($inst)) {
                $vals[$role[0] + 'Disk' + $pair[1]] = Get-Mean $series[$pair[0]][$inst]
            }
        }
    }
    $same = $null
    if ($instSys -and $instRepo) { $same = ($instSys -eq $instRepo) }

    if ($repoLetter) {
        try {
            $di = New-Object System.IO.DriveInfo ($repoLetter.Substring(0, 1))
            $okType = ($di.DriveType -eq [System.IO.DriveType]::Fixed -or $di.DriveType -eq [System.IO.DriveType]::Removable)
            if ($okType -and $di.IsReady) { $vals['freeSpaceGB'] = [double]$di.AvailableFreeSpace / 1GB }
        } catch { }
    }

    $ctx = [ordered]@{ logicalCores = [Environment]::ProcessorCount; totalMemoryMB = $totalMB; systemAndRepoOnSameDisk = $same; projectOnNetworkPath = $netPath }
    return @{ values = $vals; context = $ctx; sampleSeconds = [int]$readings }
}

# ---- fixture reading -------------------------------------------------------------------------------------
function Test-LocalSampleFile([string]$File) {
    # No network lookups: UNC-style paths and network drives are treated as "not found" without touching them.
    if ($File -match '^(\\\\|//)') { return $false }
    if ($File -match '^([A-Za-z]):') {
        try {
            $di = New-Object System.IO.DriveInfo ($Matches[1])
            if ($di.DriveType -ne [System.IO.DriveType]::Fixed -and $di.DriveType -ne [System.IO.DriveType]::Removable) { return $false }
        } catch { return $false }
    }
    try { return (Test-Path -LiteralPath $File -PathType Leaf -ErrorAction Stop) } catch { return $false }
}

function Read-FixtureSequence([string]$File) {
    if (-not (Test-LocalSampleFile $File)) { throw 'sample file not found' }
    $raw = $null
    try { $raw = Get-Content -LiteralPath $File -Raw -Encoding UTF8 -ErrorAction Stop } catch { throw 'sample file not found' }
    $parsed = $null
    try { $parsed = ConvertFrom-Json -InputObject $raw -ErrorAction Stop } catch { throw 'sample file is not valid JSON' }
    $seq = @($parsed)
    if ($seq.Count -eq 0) { throw 'sample file is not valid JSON' }
    return $seq
}

function ConvertTo-MetricNumber($v, [string]$unit) {
    if ($v -is [System.Management.Automation.PSCustomObject]) {
        if ($v.PSObject.Properties['value']) { $v = $v.value } else { return $null }
    }
    if (-not ($v -is [int] -or $v -is [long] -or $v -is [double] -or $v -is [decimal] -or $v -is [single])) { return $null }
    try { $d = [double]$v } catch { return $null }
    if ([double]::IsNaN($d) -or [double]::IsInfinity($d) -or $d -lt 0) { return $null }
    if ($unit -and $script:UnitMax.ContainsKey($unit) -and $d -gt $script:UnitMax[$unit]) { return $null }
    return $d
}

function Get-FixtureSample($el) {
    $src = $el
    if ($null -ne $el -and $el.PSObject.Properties['metrics']) { $src = $el.metrics }
    $vals = [ordered]@{}
    foreach ($k in $script:MetricUnits.Keys) {
        $vals[$k] = $null
        if ($null -ne $src -and $src.PSObject.Properties[$k]) { $vals[$k] = ConvertTo-MetricNumber $src.$k $script:MetricUnits[$k] }
    }
    if ($null -ne $el -and $el.PSObject.Properties['availableMemoryMBReadings']) {
        $rd = @(@($el.availableMemoryMBReadings) | ForEach-Object { ConvertTo-MetricNumber $_ 'MB' } | Where-Object { $null -ne $_ })
        if ($rd.Count -gt 0) { $vals['availableMemoryMB'] = Get-Median $rd }
    }
    $cores = $null; $total = $null; $same = $null; $net = $null; $secs = 0
    if ($null -ne $el -and $el.PSObject.Properties['context'] -and $null -ne $el.context) {
        $cx = $el.context
        if ($cx.PSObject.Properties['logicalCores']) {
            $cv = $cx.logicalCores
            if ($cv -is [int] -or $cv -is [long] -or $cv -is [double] -or $cv -is [decimal] -or $cv -is [single]) {
                $cd = [double]$cv
                if (-not [double]::IsNaN($cd)) { $cores = $cd }   # clamped to 1..4096 below
            }
        }
        if ($cx.PSObject.Properties['totalMemoryMB']) { $total = ConvertTo-MetricNumber $cx.totalMemoryMB 'MB' }
        if ($cx.PSObject.Properties['systemAndRepoOnSameDisk'] -and $cx.systemAndRepoOnSameDisk -is [bool]) { $same = [bool]$cx.systemAndRepoOnSameDisk }
        if ($cx.PSObject.Properties['projectOnNetworkPath'] -and $cx.projectOnNetworkPath -is [bool]) { $net = [bool]$cx.projectOnNetworkPath }
    }
    if ($null -ne $el -and $el.PSObject.Properties['sampleSeconds']) {
        $s = ConvertTo-MetricNumber $el.sampleSeconds ''
        if ($null -ne $s) { $secs = [int][math]::Min(10, [math]::Floor($s)) }
    }
    if ($null -eq $cores) { $cores = [Environment]::ProcessorCount }
    $coresInt = [int][math]::Max(1, [math]::Floor([math]::Min([double]$cores, 4096.0)))
    $ctx = [ordered]@{ logicalCores = $coresInt; totalMemoryMB = $total; systemAndRepoOnSameDisk = $same; projectOnNetworkPath = $net }
    return @{ values = $vals; context = $ctx; sampleSeconds = $secs }
}

# ---- verdict ---------------------------------------------------------------------------------------------
function Get-HostVerdict {
    param([System.Collections.IDictionary]$Values, $Cores, [string[]]$ExtraReasons)
    $T = $script:Thresholds
    $findings = New-Object System.Collections.ArrayList
    function Add-Finding([string]$level, [string]$cls, [string]$tech, [string]$pk, $a, $b) {
        [void]$findings.Add(@{ level = $level; cls = $cls; tech = $tech; pk = $pk; a = $a; b = $b })
    }
    $unknown = New-Object System.Collections.ArrayList
    foreach ($k in $script:MetricUnits.Keys) { if ($null -eq $Values[$k]) { [void]$unknown.Add($k) } }

    $commit = $Values['memoryCommitPercent']; $avail = $Values['availableMemoryMB']; $cpu = $Values['cpuPercent']
    if ($null -ne $commit) {
        if ($commit -ge $T.PressureCommitPercent) {
            Add-Finding 'PRESSURE' 'memory' "PRESSURE: memory commit $(Format-Num $commit)% >= $($T.PressureCommitPercent)%" 'commit' $commit $null
        } elseif ($commit -ge $T.PressureCommitLowAvailPercent -and $null -ne $avail -and $avail -lt $T.PressureCommitLowAvailMB) {
            Add-Finding 'PRESSURE' 'memory' "PRESSURE: memory commit $(Format-Num $commit)% >= $($T.PressureCommitLowAvailPercent)% with available RAM $(Format-Num $avail) MB < $($T.PressureCommitLowAvailMB) MB" 'commitLow' $commit $avail
        } elseif ($commit -ge $T.BusyCommitPercent) {
            Add-Finding 'BUSY' 'memory' "BUSY: memory commit $(Format-Num $commit)% >= $($T.BusyCommitPercent)%" 'commit' $commit $null
        }
    }
    if ($null -ne $avail) {
        if ($avail -lt $T.PressureAvailableMB) {
            Add-Finding 'PRESSURE' 'memory' "PRESSURE: available RAM $(Format-Num $avail) MB < $($T.PressureAvailableMB) MB" 'avail' $avail $null
        } elseif ($avail -lt $T.BusyAvailableMB) {
            Add-Finding 'BUSY' 'memory' "BUSY: available RAM $(Format-Num $avail) MB < $($T.BusyAvailableMB) MB" 'avail' $avail $null
        }
    }
    if ($null -ne $cpu -and $cpu -ge $T.BusyCpuPercent) {
        Add-Finding 'BUSY' 'cpu' "BUSY: CPU $(Format-Num $cpu)% >= $($T.BusyCpuPercent)%" 'cpu' $cpu $null
    }
    foreach ($role in @('system', 'repo')) {
        $act = $Values[$role + 'DiskActivePercent']
        if ($null -eq $act) { continue }
        $wr = $Values[$role + 'DiskAvgSecPerWrite']; $q = $Values[$role + 'DiskQueueLength']
        $slow = (($null -ne $wr -and $wr -ge $T.PressureDiskWriteSec) -or ($null -ne $q -and $q -ge $T.PressureDiskQueue))
        if ($act -ge $T.PressureDiskActivePercent -and $slow) {
            Add-Finding 'PRESSURE' 'disk' "PRESSURE: $role disk active $(Format-Num $act)% >= $($T.PressureDiskActivePercent)% with write latency $(Format-Num $wr) s or queue $(Format-Num $q)" ($role + 'DiskSlow') $act $null
        } elseif ($act -ge $T.BusyDiskActivePercent) {
            Add-Finding 'BUSY' 'disk' "BUSY: $role disk active $(Format-Num $act)% >= $($T.BusyDiskActivePercent)%" ($role + 'DiskBusy') $act $null
        }
    }
    $free = $Values['freeSpaceGB']
    if ($null -ne $free -and $free -lt $T.PressureFreeGB) {
        Add-Finding 'PRESSURE' 'full' "PRESSURE: free space $(Format-Num $free) GB < $($T.PressureFreeGB) GB" 'free' $free $null
    }

    $memoryMissing = ($null -eq $commit -or $null -eq $avail)
    $missingOther = @($script:RequiredForOk | Where-Object { $_ -notin @('memoryCommitPercent', 'availableMemoryMB') -and $null -eq $Values[$_] })
    $unkReasons = New-Object System.Collections.ArrayList
    if ($ExtraReasons) { foreach ($x in $ExtraReasons) { [void]$unkReasons.Add('UNKNOWN: ' + $x) } }
    if ($memoryMissing) { [void]$unkReasons.Add('UNKNOWN: memory signal (commit or available RAM) is missing') }
    if ($missingOther.Count -gt 0) { [void]$unkReasons.Add('UNKNOWN: required metric(s) missing: ' + ($missingOther -join ', ')) }

    $press = @($findings | Where-Object { $_.level -eq 'PRESSURE' })
    $busy = @($findings | Where-Object { $_.level -eq 'BUSY' })
    # Priority: PRESSURE, BUSY (positive findings stand even if other metrics are missing), UNKNOWN, OK.
    $verdict = 'OK'; $top = @(); $reasons = @()
    if ($press.Count -gt 0) { $verdict = 'PRESSURE'; $top = $press }
    elseif ($busy.Count -gt 0) { $verdict = 'BUSY'; $top = $busy }
    elseif ($unkReasons.Count -gt 0) { $verdict = 'UNKNOWN' }
    $ordered = @($press) + @($busy)
    if ($verdict -eq 'UNKNOWN') { $reasons = @($unkReasons) }
    elseif ($verdict -eq 'OK') { $reasons = @('no PRESSURE or BUSY rule fired') }
    else { $reasons = @($ordered | ForEach-Object { $_.tech }) }

    # message class: memory, then disk activity, then CPU, then nearly-full disk
    $msgKey = $verdict
    if ($top.Count -gt 0) {
        foreach ($cls in @('memory', 'disk', 'cpu', 'full')) {
            if (@($top | Where-Object { $_.cls -eq $cls }).Count -gt 0) { $msgKey = $verdict + '_' + $cls; break }
        }
    }
    $hasFull = (@($press | Where-Object { $_.cls -eq 'full' }).Count -gt 0)
    $waitable = (@($press | Where-Object { $_.cls -ne 'full' }).Count -gt 0)

    $cores2 = 1; if ($null -ne $Cores -and [double]$Cores -ge 1) { $cores2 = [int][math]::Floor([double]$Cores) }
    $workers = $null
    if ($verdict -eq 'PRESSURE') { $workers = 1 }
    elseif (-not $memoryMissing) {
        $workers = [int][math]::Floor([double]$avail / $T.MBPerWorker)
        if ($workers -gt $cores2) { $workers = $cores2 }
        if ($commit -ge $T.BusyCommitPercent -and $workers -gt $T.WorkersCapWhenCommitHigh) { $workers = $T.WorkersCapWhenCommitHigh }
        if ($workers -lt 1) { $workers = 1 }
    }
    return @{
        verdict = $verdict; reasons = @($reasons); findings = @($ordered); unknownMetrics = @($unknown)
        suggestedMaxWorkers = $workers; msgKey = $msgKey; hasFull = $hasFull; waitable = $waitable
        extra = @($ExtraReasons)
    }
}

# ---- plain-language rendering -------------------------------------------------------------------------------
function Get-PlainReason($f, [string]$lang) {
    $a = $null; $b = $null
    switch ($f.pk) {
        'free'  { $a = Format-Num $f.a '0.0' }
        'avail' { $a = Format-Num $f.a '0' }
        'commitLow' { $a = Format-Num $f.a '0'; $b = Format-Num $f.b '0' }
        default { $a = Format-Num $f.a '0' }
    }
    $tpl = Get-Label $lang ('pr_' + $f.pk)
    return ($tpl.Replace('{0}', [string]$a).Replace('{1}', [string]$b))
}

function Get-UnknownGroups($unknownMetrics, [string]$lang) {
    $groups = New-Object System.Collections.ArrayList
    foreach ($m in @($unknownMetrics)) {
        $g = $null
        if ($m -in @('memoryCommitPercent', 'availableMemoryMB')) { $g = 'memory' }
        elseif ($m -eq 'cpuPercent') { $g = 'cpu' }
        elseif ($m -eq 'systemDiskActivePercent') { $g = 'sysDisk' }
        elseif ($m -eq 'repoDiskActivePercent') { $g = 'repoDisk' }
        elseif ($m -eq 'freeSpaceGB') { $g = 'freeSpace' }
        if ($g -and -not $groups.Contains($g)) { [void]$groups.Add($g) }
    }
    return @($groups | ForEach-Object { Get-Label $lang ('un_' + $_) })
}

# ---- output ----------------------------------------------------------------------------------------------
function New-ResultObject {
    param($Sample, $Verdict, [int]$SampleSecs, [int]$Waited, [bool]$TimedOut, [int]$Taken, [string]$LangCode, [string]$WaitNote = '')
    $metrics = [ordered]@{}
    foreach ($k in $script:MetricUnits.Keys) {
        $v = $Sample.values[$k]
        if ($null -ne $v) { $v = [math]::Round([double]$v, 4) }
        $metrics[$k] = [ordered]@{ value = $v; unit = $script:MetricUnits[$k] }
    }
    $msg = Get-Label $LangCode $Verdict.msgKey
    if ($Verdict.verdict -eq 'PRESSURE' -and $Verdict.hasFull -and $Verdict.msgKey -ne 'PRESSURE_full') {
        $msg = $msg + ' ' + (Get-Label $LangCode 'PRESSURE_fullExtra')
    }
    $onNet = ($Sample.context.Contains('projectOnNetworkPath') -and $Sample.context['projectOnNetworkPath'] -eq $true)
    if ($onNet) {
        $msg = $msg + ' ' + (Get-Label $LangCode 'netDisk')
    } elseif ($Verdict.verdict -ne 'UNKNOWN' -and $null -eq $Sample.values['repoDiskActivePercent']) {
        $msg = $msg + ' ' + (Get-Label $LangCode 'projDisk')
    }
    $ctxOut = [ordered]@{}
    foreach ($ck in $Sample.context.Keys) { $ctxOut[$ck] = $Sample.context[$ck] }
    if (-not $ctxOut.Contains('projectOnNetworkPath')) { $ctxOut['projectOnNetworkPath'] = $null }
    $noteOut = $null; if ($WaitNote) { $noteOut = $WaitNote }
    $plain = @()
    if ($Verdict.verdict -eq 'PRESSURE' -or $Verdict.verdict -eq 'BUSY') {
        $plain = @($Verdict.findings | ForEach-Object { Get-PlainReason $_ $LangCode })
    } elseif ($Verdict.verdict -eq 'UNKNOWN') {
        $cats = @($Verdict.extra | Where-Object { $_ })
        if ($cats.Count -gt 0) { $plain = @($cats | ForEach-Object { Get-Label $LangCode ('cat_' + $_) }) }
        else { $plain = @(Get-Label $LangCode 'unkPlain') }
    }
    return [ordered]@{
        schema              = $script:SchemaName
        timestampUtc        = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        sampleSeconds       = $SampleSecs
        metrics             = $metrics
        context             = $ctxOut
        verdict             = $Verdict.verdict
        reasons             = @($Verdict.reasons)
        plainReasons        = @($plain)
        unknownMetrics      = @($Verdict.unknownMetrics)
        plainUnknown        = @(Get-UnknownGroups $Verdict.unknownMetrics $LangCode)
        suggestedMaxWorkers = $Verdict.suggestedMaxWorkers
        suggestedMaxWorkersBasis = 'heuristic: clamp(floor(availableMemoryMB / 1500), 1, logicalCores), at most 2 when memory commit >= 90%; 1 under PRESSURE; null when memory is unknown'
        message             = $msg
        waitedSeconds       = $Waited
        waitTimedOut        = $TimedOut
        waitNote            = $noteOut
        samplesTaken        = $Taken
        notes               = 'Advisory single-moment snapshot, not a trend; machine-wide, cannot name the culprit; says nothing about SSD wear or drive health. Contract: exit code 0 for any well-formed command line; callers must treat any other exit code or empty output as UNKNOWN.'
    }
}

function Write-Result($Result, [bool]$AsJson, [string]$LangCode) {
    if ($AsJson) {
        [Console]::Out.WriteLine((ConvertTo-AsciiJson $Result))
        return
    }
    $L = { param($key) Get-Label $LangCode $key }
    $lines = New-Object System.Collections.ArrayList
    [void]$lines.Add(('CVF host check: {0} - {1}' -f $Result.verdict, $Result.message))
    if (@($Result.plainReasons).Count -gt 0) { [void]$lines.Add(('{0}: {1}' -f (& $L 'why'), (@($Result.plainReasons) -join '; '))) }
    if (@($Result.plainUnknown).Count -gt 0) { [void]$lines.Add(('{0}: {1}' -f (& $L 'notMeasured'), (@($Result.plainUnknown) -join ', '))) }
    if ($Result.verdict -ne 'UNKNOWN' -and $null -ne $Result.suggestedMaxWorkers) { [void]$lines.Add(('{0}: {1}' -f (& $L 'workers'), $Result.suggestedMaxWorkers)) }
    if ($Result.waitedSeconds -gt 0) { [void]$lines.Add(('{0} {1} {2}.' -f (& $L 'waited'), $Result.waitedSeconds, (& $L 'seconds'))) }
    if ($Result.waitTimedOut) { [void]$lines.Add((& $L 'stillPressure')) }
    [void]$lines.Add((& $L 'moment'))
    $oldEnc = $null
    if ($LangCode -eq 'vi') {
        try { $oldEnc = [Console]::OutputEncoding; [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch { }
    }
    foreach ($ln in $lines) { [Console]::Out.WriteLine([string]$ln) }
    if ($null -ne $oldEnc) { try { [Console]::OutputEncoding = $oldEnc } catch { } }
}

# An abandoned counter read could keep the process alive, so it is ended hard - but ONLY when this process
# was started to run this very script (powershell ... -File <this script>); a caller's own session is never killed.
function Test-StartedAsChildScript {
    try {
        $leaf = [string]$PSCommandPath
        if (-not $leaf) { return $false }
        $leaf = $leaf.Substring($leaf.LastIndexOfAny([char[]]@([char]92, [char]47)) + 1)
        $a = [Environment]::GetCommandLineArgs()
        for ($i = 0; $i -lt $a.Count - 1; $i++) {
            if ($a[$i] -ieq '-File' -or $a[$i] -ieq '-f') {
                $t = [string]$a[$i + 1]
                $t = $t.Substring($t.LastIndexOfAny([char[]]@([char]92, [char]47)) + 1)
                if ($t -ieq $leaf) { return $true }
            }
        }
    } catch { }
    return $false
}

function Exit-Script([int]$Code) {
    if ($script:Abandoned -and (Test-StartedAsChildScript)) { [Environment]::Exit($Code) }
    exit $Code
}

# ---- main ------------------------------------------------------------------------------------------------
$LangCode = 'en'; if ($Lang -eq 'vi') { $LangCode = 'vi' }
$finalResult = $null
$ErrorActionPreference = 'Stop'   # unexpected failures land in the catch below; counter calls opt out explicitly
try {
    $fixtureMode = (-not [string]::IsNullOrEmpty($FromSampleJson))
    $sampleSecs = ConvertTo-ClampedInt $SampleSeconds 3 1 10
    $waitSecs = ConvertTo-ClampedInt $WaitSeconds 0 0 1800
    $minInterval = 10; if ($fixtureMode) { $minInterval = 0 }
    $intervalSecs = ConvertTo-ClampedInt $IntervalSeconds 20 $minInterval 1800

    $onWindows = $true
    if ($PSVersionTable.PSEdition -eq 'Core' -and $IsWindows -eq $false) { $onWindows = $false }

    $fixtures = $null
    if ($fixtureMode) { $fixtures = Read-FixtureSequence $FromSampleJson }
    $budgetOverride = ConvertTo-ClampedInt $ForceBudgetMs 0 0 600000

    $taken = 0
    $sw = $null
    $again = $false
    do {
        $extra = @()
        if ($fixtureMode) {
            $idx = [math]::Min($taken, $fixtures.Count - 1)
            $sample = Get-FixtureSample $fixtures[$idx]
            $secs = $sample.sampleSeconds
        } elseif (-not $onWindows) {
            $empty = [ordered]@{}; foreach ($k in $MetricUnits.Keys) { $empty[$k] = $null }
            $sample = @{ values = $empty; context = [ordered]@{ logicalCores = [Environment]::ProcessorCount; totalMemoryMB = $null; systemAndRepoOnSameDisk = $null } }
            $extra = @('unsupported platform')
            $secs = 0
        } else {
            $sample = Get-LiveSample -Seconds $sampleSecs -TargetPath $Path -Force $ForceCounterPath -BudgetMsOverride $budgetOverride
            $secs = $sample.sampleSeconds
        }
        $taken++
        $verdict = Get-HostVerdict -Values $sample.values -Cores $sample.context.logicalCores -ExtraReasons $extra
        if ($null -eq $sw) { $sw = [System.Diagnostics.Stopwatch]::StartNew() }
        $remaining = $waitSecs - $sw.Elapsed.TotalSeconds
        # Wait only for pressure that time can fix, and only if a full interval still fits in the wait budget.
        $again = ($verdict.verdict -eq 'PRESSURE' -and $verdict.waitable -and $waitSecs -gt 0 -and $remaining -gt 0 -and $remaining -ge $intervalSecs)
        if ($again) {
            $pause = [double]$intervalSecs
            $waitedNow = [int][math]::Floor($sw.Elapsed.TotalSeconds)
            if ($pause -ge 1) { $nextText = ('next reading in {0} s' -f [int][math]::Ceiling($pause)) } else { $nextText = 'next reading shortly' }
            Write-Err ('cvf_host_check: PRESSURE (reading {0}); waited {1} of {2} s, {3}' -f $taken, $waitedNow, $waitSecs, $nextText)
            if ($pause -lt 0.05) { $pause = 0.05 }
            Start-Sleep -Milliseconds ([int]($pause * 1000))
        }
    } while ($again)
    $waited = [int][math]::Floor($sw.Elapsed.TotalSeconds)
    if ($taken -le 1) { $waited = 0 }
    # waitTimedOut: at least one wait interval really elapsed and the last verdict is still PRESSURE.
    $timedOut = ($taken -gt 1 -and $verdict.verdict -eq 'PRESSURE')
    $waitNote = ''
    if ($waitSecs -gt 0 -and $verdict.verdict -eq 'PRESSURE' -and $taken -le 1) {
        if ($verdict.waitable) { $waitNote = 'the wait was shorter than the interval, so no new reading was taken' }
        else { $waitNote = 'not waited: low free disk space does not clear by itself' }
    }
    $finalResult = New-ResultObject -Sample $sample -Verdict $verdict -SampleSecs $secs -Waited $waited -TimedOut $timedOut -Taken $taken -LangCode $LangCode -WaitNote $waitNote
} catch {
    # Advisory tools must not break callers: report UNKNOWN with a FIXED category (never exception text or paths).
    try {
        $cat = 'sampling failed'
        $m = [string]$_.Exception.Message
        if ($Categories -contains $m) { $cat = $m }
        $empty = [ordered]@{}; foreach ($k in $MetricUnits.Keys) { $empty[$k] = $null }
        $sample = @{ values = $empty; context = [ordered]@{ logicalCores = 1; totalMemoryMB = $null; systemAndRepoOnSameDisk = $null } }
        $verdict = Get-HostVerdict -Values $sample.values -Cores 1 -ExtraReasons @($cat)
        $finalResult = New-ResultObject -Sample $sample -Verdict $verdict -SampleSecs 0 -Waited 0 -TimedOut $false -Taken 0 -LangCode $LangCode
    } catch {
        [Console]::Out.WriteLine('{"schema":"cvf.hostCheck@1","verdict":"UNKNOWN","reasons":["UNKNOWN: sampling failed"],"suggestedMaxWorkers":null}')
        Exit-Script 0
    }
}

try { Write-Result -Result $finalResult -AsJson ([bool]$Json) -LangCode $LangCode } catch { }
$exitCode = 0
if ($FailOnPressure -and $finalResult.verdict -eq 'PRESSURE') { $exitCode = 3 }
Exit-Script $exitCode
