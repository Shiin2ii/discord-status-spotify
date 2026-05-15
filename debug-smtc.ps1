Add-Type -AssemblyName System.Runtime.WindowsRuntime

# Bridge WinRT IAsyncOperation to .NET Task
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object {
        $_.Name -eq 'AsTask' -and
        $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
    })[0]

function Await($WinRtTask, $ResultType) {
    $specific = $asTaskGeneric.MakeGenericMethod($ResultType)
    $task = $specific.Invoke($null, @($WinRtTask))
    $task.Wait(-1) | Out-Null
    return $task.Result
}

[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]

$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) `
             ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])

$sessions = $mgr.GetSessions()
Write-Output "Total sessions: $($sessions.Count)"

foreach ($s in $sessions) {
    Write-Output "---"
    Write-Output "App: $($s.SourceAppUserModelId)"

    $props = Await ($s.TryGetMediaPropertiesAsync()) `
                   ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    Write-Output "Title:  $($props.Title)"
    Write-Output "Artist: $($props.Artist)"

    $pb = $s.GetPlaybackInfo()
    Write-Output "Status: $($pb.PlaybackStatus)"

    $tl = $s.GetTimelineProperties()
    Write-Output "Position: $($tl.Position.TotalMilliseconds)ms"
    Write-Output "Duration: $($tl.EndTime.TotalMilliseconds)ms"
}
