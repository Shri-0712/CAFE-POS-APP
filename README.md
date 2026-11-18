# CafePOS — Native Android Café POS

Kotlin + Jetpack Compose + MVVM + Room offline-first POS for gaming cafés.

## Features
- Multi-customer active order tabs/sessions
- Menu management with Beverages, Snacks, Desserts, Games
- Multiple gaming sessions per order with time-based billing
- Editable café bill settings reflected in receipts/PDF
- Room SQLite persistence for active orders and completed reports
- Daily/weekly/custom report filters
- PDF receipt export, Excel-compatible CSV export scaffold
- Bluetooth/USB ESC/POS printer service scaffold
- Android 8+ (API 26+)

## Build
1. Open this folder in Android Studio.
2. Let Gradle sync.
3. Run on a device/emulator (API 26+).
4. Build APK: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

## Notes
- Printing service contains ESC/POS byte generation and connection placeholders; pair printer-specific SDK/permissions as needed.
- Excel export is CSV-compatible for maximum offline reliability; you can replace it with Apache POI if .xlsx is mandatory.
