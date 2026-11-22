# Offline mode and safe settings restore — user guide and design notes

TrueGlide ESC Configurator, branch `trueglide/v34-hors-ligne` (build `0.33.0-dev · 739d256`).
Scope of this proposal: **BLHeli_S and Bluejay** ESCs only.
Bench-tested on 4 × J-H-40 Bluejay 0.19 (24 kHz) behind an F405 flight controller running
TRUEGLIDE (a Betaflight-based firmware), propellers removed, 4S battery. No flight was made with
this build.

This document has two parts:

1. **User guide**: what the feature does and how to use it, step by step.
2. **Design notes**: what was changed in the code, why, and how it is tested.

---

## Part 1 — User guide

### 1.1 What it is for

Today the ESC settings live only inside the ESCs. To change one value you must plug in the
drone, power it, enter passthrough, read, change and write, and you have no copy of what was
there before.

With this branch you can:

- **save** the settings of all ESCs of a drone to a `.json` file;
- **open that file offline**, with nothing plugged in (no USB, no battery), change settings
  and save a new file;
- later, **load a file back into the ESCs** with a preview of every value that will change,
  an automatic backup of the current settings, and a read-back check after writing.

Typical uses: keep one file per drone, prepare settings at the desk without powering anything
(no heat, no VTX running), restore a known-good setup after a re-flash, or share a setup.

### 1.2 Save the settings of a drone (file A)

1. Props off. Plug the **battery first, then USB** (with USB first, some flight controllers
   count too few battery cells).
2. Open the ESC tab, **Connect**, **Read settings**. All ESCs must be read.
3. Click **Save the ESC settings**.
4. A question asks: *"Were the motor order and direction checked on the bench, propellers removed?"*
   - **OK**: the file is marked *bench checked*. Only such a file may later write the motor
     direction back.
   - **Cancel**: the file is saved, but it will **never** write a motor direction.
5. A file `trueglide-esc-reglages_<date>_<time>.json` is downloaded, and the log confirms it
   (file names are in French in this build).

### 1.3 Work offline, nothing plugged in

1. Nothing plugged in. In the ESC tab click **Open a settings file (offline)…** (also offered
   at the end of the port list when a port exists).
2. Choose a file. An **Offline** banner shows the file name, its date and the ESC count.
   All ESCs of the file are shown.
3. **Read**, **Write**, **Flash**, **Restore Default Settings** and motor control are disabled:
   nothing can reach an ESC from this screen.
4. Change settings, then click **Save the file**. A new file ending in `_hors-ligne.json`
   (French for "offline") is downloaded. The original file is never modified.
5. Click **Disconnect (offline)** to leave.

Plugging or unplugging a USB port while a file is open offline does not close the file and
does not open any port.

### 1.4 Write a file back into the ESCs

1. Props off. Battery first, then USB. **Connect**, **Read settings** (all ESCs).
2. Click **Load saved settings** and choose the file.
   If the file holds a different number of ESCs than are connected, or not all ESCs were
   read, nothing is written.
3. **One question** lists every value that will change, per ESC, as
   *value in the ESC → value in the file*, for example `ESC 2 · Beep strength: 9 → 20`.
   - A file edited offline starts with *"File edited offline on …: check each value"*.
   - An ESC that does not match the file (other position, firmware, version, layout or
     target) is **not listed and not written**.
   - A motor direction from a file not checked on the bench is shown as
     *"not written, file not checked on the bench"*.
   - The preview may also show *Low voltage cut: … → …*: this TrueGlide build always writes
     the ESC low-voltage cut-off as disabled, whatever the file says.
4. **Cancel** writes nothing (*"Loading cancelled: nothing was written"*).
   **OK**: the current settings are first saved to a new file, then each ESC is written,
   **read back and compared**: *"ESC n: read back, same as written"*.
   If a read-back differs, the app offers to put back the settings saved just before.
5. The log ends with a reminder to check motor order and direction on the bench before flying.

### 1.5 Bench test summary (22 Nov 2026)

The full 21-step bench protocol was run on `7b156d4`; all key steps passed and all 4 ESCs
were read at every read. Three UI defects found during the test were fixed in `739d256`, which
was re-checked on the bench for these three points only:

| Step | Check | Result |
|---|---|---|
| Save, bench checked | file A downloaded, log says *bench checked* | pass |
| Open offline | banner, 4 ESCs, Read/Write/Flash disabled, no motor control | pass |
| Edit offline | new `_hors-ligne.json` file, direction untouched | pass |
| Load edited file, Cancel | preview `9 → 20` on 4 ESCs, nothing written | pass |
| Load edited file, OK | backup file first, 4 × *read back, same as written* | pass |
| File with wrong firmware revision for ESC 1 | ESC 1 left out, others previewed | pass |
| File not bench checked, direction changed on ESC 2 | *Direction: not written*, ESC 2 stays Reversed | pass |
| Load original file | all settings back to the start state | pass |
| Motors one by one, props off | same direction as before the test | pass |
| Offline with no USB (739d256) | disconnect button reachable, no *missing ESC* box | pass |

Screenshots: to be added after review (no hardware identifiers on them).

---

## Part 2 — Design notes

All changes are in the web app; no firmware is changed. Every user-visible text exists in
English and French (`src/translations/*/common.json`, `log.json`).

### 2.1 The settings file — `src/utils/SettingsBackup.js`

- `buildBackup()` writes a versioned JSON document: `format`, `version` (2, version 1 still
  readable), app version, date, ESC count, and per ESC its index, firmware name, display name,
  layout revision and settings. The top-level flags `benchChecked` (+ date) and
  `editedOffline` (+ date) are added by the app when saving (`handleSaveEscSettings`,
  `handleSaveOffline`).
- `parseBackup()` rejects anything that is not this format or version, or whose ESC entries
  are malformed (*"This file is not a TrueGlide ESC Configurator settings backup: nothing was
  written"*).
- `getRestoredSettings(esc, backup)` decides, **per ESC**, what may be written:
  - never to an ESC whose firmware is broken (`FLASH*FAILED`) or blocked;
  - only from the entry with the **same index**, **same firmware name** and **same layout**,
    and (unless explicitly allowed) the **same layout and firmware revisions**;
  - identity values (`LAYOUT`, `MCU`, `NAME`, revisions…) are never written;
  - a value is written only if the setting is described for this firmware version, its
    description matches the one in the file, and the value is valid for it (range, step or
    list); otherwise it is reported as *out of range* and the ESC keeps its value;
  - settings not offered on screen are left as they are in the ESC.
- `getSettingChanges()` builds the preview lines, using the option label rather than the raw
  number for list settings (`Reversed → Normal`). `isSameValue()` treats `"1"` and `1` as the
  same value, so a list value edited offline does not show as a false change.
- `getMismatchedSettings()` compares what was written with what is read back.

### 2.2 Offline mode — `src/Containers/App/index.jsx`, `PortPicker`, `MainContent`, `Buttonbar`

- `handleOpenOffline()` parses the file and shows its ESCs with `serial.offline` set; it is
  refused while a port is opening or open.
- `isOffline()` is checked at the top of every path that could reach hardware: connect,
  read, write, flash, restore defaults, motor control. While offline these return before
  touching any port.
- `handleSaveOffline()` writes a **new** file (`_hors-ligne.json`, `editedOffline: true`).
  If a motor direction was changed offline, the new file is marked not bench checked.
- `serialConnectHandler` / `serialDisconnectHandler`: a port plugged or unplugged while
  offline only updates the port list.
- Fixes from the bench test (`739d256`):
  - the port list is now a controlled `<select>`: *Open a settings file* never stays
    selected, so it can be chosen again, and the list always shows the port the app uses;
  - after an unplug, the port in use is the first port left (or none), and the
    *select a port* overlay comes back only when no port is left — it is hidden while a file
    is open offline, so **Disconnect (offline)** stays reachable;
  - the *missing ESC?* box is not shown offline (no flight controller to count ESCs).

### 2.3 Safe write — `writeBackup()`

1. Per ESC, compute what would be written (`getRestoredSettings`).
2. Motor rotation keys (`MOTOR_DIRECTION`, `BIDIRECTIONAL_MODE`, `RC_CAR_REVERSING`) are
   kept as they are in the ESC unless the file is bench checked (`keepRotation()`); the
   preview says so.
3. One confirmation lists all changes. Cancel → nothing written.
4. Before writing, the current settings are saved to a file. If that save fails, nothing is
   written.
5. Each ESC is written, read back and compared. On a mismatch the app offers to restore the
   settings saved in step 4.

A related button, **Put back the settings from before the flash**, writes back the copy kept in
memory during a flash, through the same checks.

### 2.4 Tests

- 651 unit and component tests pass (`yarn test`), ESLint has no errors.
- `src/utils/__tests__/MockedEsc.js` simulates ESCs behind a flight controller, so the whole
  offline / preview / write / read-back path runs end-to-end in
  `src/Containers/App/__tests__/simulated.test.jsx`.
- Tests cover: damaged or foreign files, other firmware/version/layout, `FLASH*FAILED` ESCs,
  out-of-range values, direction from a file not bench checked, cancel writes nothing,
  read-back mismatch, no port opened while offline, plug/unplug while offline, and the three
  bench-test fixes.

### 2.5 Known limits and possible follow-ups

- The confirmation uses the browser `confirm()` dialog, where **OK is the default button**.
  A custom dialog with *Cancel* as default would be safer for a dialog that writes to ESCs.
- The offline edit date is shown in UTC (`…Z`); local time would be clearer.
- An ESC left out because it matches nothing in the file is named in the log only after OK;
  it could also be named in the preview.
- Unplugging a port other than the one in use still closes the current connection (existing
  behaviour, unchanged).
- This proposal covers BLHeli_S and Bluejay. On real hardware only Bluejay 0.19 (J-H-40) was
  tested; BLHeli_S is covered by the automated tests only. The code does not exclude AM32,
  which was not tested.
- If another USB port is unplugged during the motor test, the open port is disconnected
  without first sending a motor stop (existing behaviour, to be fixed: when another port is
  unplugged, keep the open connection; stop the motors before any disconnection).
