' ============================================================
' launch_vlc.vbs - VLC YouTube Launcher
' Called by Windows when a playvlc:// link is opened.
' Receives: playvlc://localhost?v=VIDEO_ID&t=TIMESTAMP
' ============================================================

Dim shell, fso, log, logPath
Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

logPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\vlc_launch.log"
Set log = fso.CreateTextFile(logPath, True)
log.WriteLine "=== VLC Launch === " & Now()
log.WriteLine "Arguments received: " & WScript.Arguments.Count

' --- Receive argument ---
If WScript.Arguments.Count = 0 Then
    log.WriteLine "ERROR: No argument received"
    log.Close
    MsgBox "VLC Launcher: No URL received." & vbCrLf & _
           "Try clicking the extension again.", vbExclamation, "VLC YouTube Launcher"
    WScript.Quit 1
End If

Dim rawUri
rawUri = WScript.Arguments(0)
log.WriteLine "Raw URI  : " & rawUri

' --- Parse playvlc://localhost?v=VIDEO_ID&t=TIMESTAMP ---
Dim videoId, timestamp, qs, i, part, parts, ytUrl

videoId   = ""
timestamp = "0"

' Find the query string (everything after '?')
Dim qPos
qPos = InStr(rawUri, "?")
If qPos = 0 Then
    log.WriteLine "ERROR: No query string in URI: " & rawUri
    log.Close
    MsgBox "VLC Launcher: Could not parse URL." & vbCrLf & rawUri, vbExclamation, "VLC YouTube Launcher"
    WScript.Quit 1
End If

qs = Mid(rawUri, qPos + 1)
log.WriteLine "Query string: " & qs

' Parse key=value pairs split by &
parts = Split(qs, "&")
For i = 0 To UBound(parts)
    part = parts(i)
    If Left(part, 2) = "v=" Then videoId   = Mid(part, 3)
    If Left(part, 2) = "t=" Then timestamp = Mid(part, 3)
    If part = "skip=1" Then
        log.WriteLine "Glitch trigger received (skip=1). Exiting silently."
        log.Close
        WScript.Quit 0
    End If
Next

' URL-decode the video ID (in case it has encoded chars)
videoId = Replace(videoId, "%2B", "+")
videoId = Replace(videoId, "%2D", "-")
videoId = Replace(videoId, "%5F", "_")

log.WriteLine "Video ID : " & videoId
log.WriteLine "Timestamp: " & timestamp

If videoId = "" Then
    log.WriteLine "ERROR: Empty video ID"
    log.Close
    MsgBox "VLC Launcher: Could not read the video ID." & vbCrLf & _
           "Query was: " & qs, vbExclamation, "VLC YouTube Launcher"
    WScript.Quit 1
End If

' Build clean YouTube URL
ytUrl = "https://www.youtube.com/watch?v=" & videoId
log.WriteLine "YouTube URL: " & ytUrl

' --- Find VLC ---
Dim vlcPath, candidates(7), j
candidates(0) = "C:\Program Files\VideoLAN\VLC\vlc.exe"
candidates(1) = "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe"
candidates(2) = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Programs\VideoLAN\VLC\vlc.exe"
candidates(3) = "D:\VideoLAN\VLC\vlc.exe"
candidates(4) = "D:\VLC\vlc.exe"
candidates(5) = "E:\VideoLAN\VLC\vlc.exe"
candidates(6) = "E:\Program Files\VideoLAN\VLC\vlc.exe"
candidates(7) = "F:\VideoLAN\VLC\vlc.exe"

vlcPath = ""
For j = 0 To 7
    If fso.FileExists(candidates(j)) Then
        vlcPath = candidates(j)
        Exit For
    End If
Next

If vlcPath = "" Then
    log.WriteLine "ERROR: vlc.exe not found in any known location"
    log.Close
    MsgBox "VLC not found!" & vbCrLf & _
           "Please install VLC from https://www.videolan.org/vlc/", _
           vbCritical, "VLC YouTube Launcher"
    WScript.Quit 1
End If

log.WriteLine "VLC path : " & vlcPath

' --- YT-DLP BYPASS (Fixes VLC youtube.lua errors & gets High Quality) ---
Dim ytdlpPath, rawStreamUrl, execObj
ytdlpPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\yt-dlp.exe"

Dim videoUrl, audioUrl
videoUrl = ""
audioUrl = ""

If fso.FileExists(ytdlpPath) Then
    log.WriteLine "yt-dlp found. Extracting High-Quality DASH streams..."
    ' Fetch best video and best audio separately, OR fallback to best combined (livestreams)
    Dim ytdlpCmd
    ytdlpCmd = """" & ytdlpPath & """ -g -f ""bestvideo+bestaudio/best"" """ & ytUrl & """"
    Set execObj = shell.Exec(ytdlpCmd)
    
    ' Wait for yt-dlp to finish
    Do While execObj.Status = 0
        WScript.Sleep 100
    Loop
    
    Dim stdoutStr
    stdoutStr = Trim(execObj.StdOut.ReadAll())
    
    ' Strip carriage returns and split by line feed
    stdoutStr = Replace(stdoutStr, vbCr, "")
    Dim lines
    lines = Split(stdoutStr, vbLf)
    
    If UBound(lines) >= 0 Then
        videoUrl = Trim(lines(0))
    End If
    If UBound(lines) >= 1 Then
        audioUrl = Trim(lines(1))
    End If
    
    If videoUrl <> "" Then
        log.WriteLine "yt-dlp extraction successful!"
        log.WriteLine "Video URL found."
        If audioUrl <> "" Then log.WriteLine "Audio URL found."
        ytUrl = videoUrl
    Else
        log.WriteLine "yt-dlp extraction failed, falling back to standard YouTube URL."
    End If
End If

' --- Launch VLC ---
Dim cmd
cmd = """" & vlcPath & """ """ & ytUrl & """"

' If we have a separate audio stream, tell VLC to play it synchronously
If audioUrl <> "" Then
    cmd = cmd & " :input-slave=""" & audioUrl & """"
End If

' Apply timestamp
If CLng(timestamp) > 0 Then
    cmd = cmd & " --start-time=" & timestamp
End If

' Optimize caching for network streams to reduce lag
cmd = cmd & " --network-caching=3000"

log.WriteLine "Command  : " & cmd

shell.Run cmd, 1, False

log.WriteLine "Done."
log.Close

WScript.Quit 0
