PENDULUM CLOCK ANALYZER — PROTOTYPE 1
=====================================

WHAT THIS VERSION DOES
- Uses the iPhone microphone to detect changes in sound level.
- Displays the time between detected sounds.
- Separates alternating intervals into two averages (A and B).
- Displays the difference between those two averages.

IMPORTANT LIMITATIONS
- This is an early sound-detection prototype, not a finished clock-servicing instrument.
- It does NOT yet calculate seconds gained/lost per day, pendulum-bob movement, or which side of the case to raise.
- The microphone detector may miss ticks or react to other noises. We must test and tune it with your clock before relying on its measurements.
- Keep Safari/the installed app open in the foreground. iOS may suspend microphone access when the app is backgrounded or the screen locks.
- The app does not record or upload audio. Audio is processed locally in the browser.
- For reliable clock-rate calculations later, we will need the clock's rated beat interval or pendulum effective length, plus a way to compare the clock with accurate elapsed time.
- For the leveling recommendation, we will need to establish which alternating interval corresponds to each physical direction of swing. Do not raise a side based only on A/B labels.

PUBLISH USING GITHUB PAGES (WINDOWS)
====================================

1. On your Windows computer, download and extract the ZIP file.
   You should have a folder named "pendulum-clock-analyzer" containing:
   index.html, app.js, styles.css, service-worker.js, manifest.webmanifest,
   icon-192.png, icon-512.png, and this README.

2. In a browser, go to https://github.com/ and create a free account if you
   do not already have one. Verify your email if GitHub asks.

3. Sign in. Click the + near the upper-right corner, then choose "New
   repository".

4. For Repository name, enter:
   pendulum-clock-analyzer

5. Choose Public. Leave "Add a README file" unchecked (we are uploading our
   own files). Click "Create repository".

6. On the new empty repository page, choose "uploading an existing file"
   (or open Add file > Upload files).

7. Open the extracted pendulum-clock-analyzer folder in Windows File Explorer.
   Select the FILES INSIDE the folder, not the enclosing folder itself:
   index.html, app.js, styles.css, service-worker.js, manifest.webmanifest,
   icon-192.png, icon-512.png, README-INSTALL.txt.
   Drag those files into the GitHub upload area.

8. Wait for the uploads to finish. In the "Commit changes" area, leave the
   suggested message and click "Commit changes".

9. In the repository, click Settings. In the left sidebar, find Pages
   (usually under "Code and automation").

10. Under "Build and deployment", set Source to "Deploy from a branch".
    Set Branch to "main" and folder to "/ (root)", then click Save.

11. Wait a minute or two. Refresh Settings > Pages. GitHub will show the
    published website address. It will look like:
    https://YOUR-GITHUB-USERNAME.github.io/pendulum-clock-analyzer/
    Use the exact address GitHub displays.

INSTALL ON IPHONE
=================

12. On the iPhone, connect to the internet for the first installation.
    Open that exact GitHub Pages address in Safari (not an in-app browser).

13. Wait for the page to load. Tap Start listening and allow microphone access
    when iOS asks. You can stop again after confirming permission.

14. To add it to the Home Screen, tap Safari's Share button (square with an
    upward arrow), choose "Add to Home Screen", edit the name if desired,
    and tap Add. If "Add to Home Screen" is not visible, scroll the Share
    sheet or use Edit Actions.

15. Open the new Home Screen icon once while online and leave it open briefly
    so the offline files can be cached. Then test by turning on Airplane Mode
    and reopening the app. The page should load offline. Microphone permission
    and audio capture must still be tested on the iPhone.

FIRST CLOCK TEST
================

16. Place the iPhone about 6–12 inches (15–30 cm) from the clock in a quiet
    room. Keep the phone still. Open the app and tap Start listening.

17. Let it listen for at least 2 minutes. Compare the detected-sound count
    with what you hear. The list should show a repeating pattern of intervals.

18. If it detects too few sounds, try moving closer. If it detects extra
    sounds, move farther away and reduce background noise.

19. Send me:
    - Your iPhone model and iOS version.
    - Whether the microphone permission prompt appeared.
    - How many sounds were detected in 2 minutes.
    - Whether the displayed intervals look stable.
    - Whether it misses ticks or detects extra noises.

TROUBLESHOOTING
===============

- Microphone unavailable: make sure the address is the HTTPS GitHub Pages
  address and that you opened it in Safari.
- Permission denied: check iPhone Settings > Safari > Microphone (or the
  website settings in Safari) and allow access, then reload.
- Page does not load offline: while online, open the app once and wait for
  it to finish loading; then close and reopen it. Service-worker caching
  requires the first successful online visit.
- GitHub Pages not published: check Settings > Pages and confirm main /
  (root) is selected. Give GitHub a few minutes to publish.
- If you update the files later, the service worker cache version may need
  to be increased and the app reloaded online to receive the update.

PRIVACY
=======

This prototype requests microphone permission only when Start listening is
pressed. It processes audio in memory and does not save, transmit, or upload
recordings. The hosting provider serves the app files; clock audio stays on
the device.
