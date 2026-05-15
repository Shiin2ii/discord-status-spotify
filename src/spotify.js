import { spawn } from 'child_process';

// ── PowerShell script (SMTC with AsTask bridge) ───────────────────────────────
//
// Uses Windows System Media Transport Controls to read currently playing media.
// No Spotify API, no Premium required.
//
// The AsTask bridge is required to properly await WinRT IAsyncOperation in
// a console/non-UI thread (simple .GetResults() polling causes timeouts).
//
const PS_SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object {
        $_.Name -eq 'AsTask' -and
        $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1'
    })[0]

function Await($WinRtTask, $ResultType) {
    $specific = $asTaskGeneric.MakeGenericMethod($ResultType)
    $task = $specific.Invoke($null, @($WinRtTask))
    $task.Wait(-1) | Out-Null
    return $task.Result
}

[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]

$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) \`
             ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

# Prefer Spotify session; fall back to whatever is currently active
$session = $null
foreach ($s in $mgr.GetSessions()) {
    if ($s.SourceAppUserModelId -like '*Spotify*') {
        $session = $s
        break
    }
}
if ($null -eq $session) { $session = $mgr.GetCurrentSession() }
if ($null -eq $session) { Write-Output '{}'; exit }

$props = Await ($session.TryGetMediaPropertiesAsync()) \`
               ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
$pb = $session.GetPlaybackInfo()
$tl = $session.GetTimelineProperties()

$result = [pscustomobject]@{
    title         = [string]$props.Title
    artist        = [string]$props.Artist
    albumTitle    = [string]$props.AlbumTitle
    isPlaying     = ($pb.PlaybackStatus.ToString() -eq 'Playing')
    positionMs    = [long]$tl.Position.TotalMilliseconds
    durationMs    = [long]$tl.EndTime.TotalMilliseconds
    lastUpdatedMs = $tl.LastUpdatedTime.ToUnixTimeMilliseconds()
    sourceApp     = [string]$session.SourceAppUserModelId
}
Write-Output ($result | ConvertTo-Json -Compress)
`.trim();

// ── Encode as Base64-UTF16LE for -EncodedCommand ──────────────────────────────
const ENCODED_SCRIPT = Buffer.from(PS_SCRIPT, 'utf16le').toString('base64');

// ── PowerShell runner ─────────────────────────────────────────────────────────

function runPowerShell() {
  return new Promise((resolve, reject) => {
    const proc = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-EncodedCommand',
      ENCODED_SCRIPT,
    ]);

    // Force UTF-8 so Vietnamese/non-ASCII titles are read correctly
    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PowerShell exited ${code}: ${stderr.trim()}`));
      } else {
        resolve(stdout.trim());
      }
    });

    proc.on('error', (err) => reject(err));
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Synthetic stable track ID from title + artist.
 * Used for change detection and lyrics caching.
 */
function makeTrackId(title, artist) {
  return `${title}::${artist}`.toLowerCase().replace(/\s+/g, '-');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the currently playing track from Windows SMTC,
 * or null if nothing is playing / no media session found.
 *
 * @returns {Promise<{
 *   isPlaying: boolean,
 *   trackId: string,
 *   trackName: string,
 *   artistName: string,
 *   albumName: string,
 *   progressMs: number,
 *   durationMs: number,
 *   albumArtUrl: string,
 * }|null>}
 */
export async function getCurrentTrack() {
  let raw;
  try {
    raw = await runPowerShell();
  } catch (err) {
    throw new Error(`SMTC error: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  // Empty object = no active session
  if (!data?.title) return null;

  // Adjust position for time elapsed since SMTC last reported it
  const smtcAge = Math.max(0, Date.now() - (data.lastUpdatedMs || Date.now()));
  const rawProgress = data.isPlaying
    ? data.positionMs + smtcAge
    : data.positionMs;
  const progressMs = Math.min(Math.max(0, rawProgress), data.durationMs || 0);

  return {
    isPlaying: !!data.isPlaying,
    trackId: makeTrackId(data.title, data.artist),
    trackName: data.title,
    artistName: data.artist,
    albumName: data.albumTitle || '',
    progressMs,
    durationMs: data.durationMs || 0,
    albumArtUrl: '',
  };
}
