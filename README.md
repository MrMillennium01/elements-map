# elements-map

Ein interaktiver Rohstoffatlas: Entdecke die 118 Elemente des Periodensystems und erkunde belegte Vorkommen, jährliche Förderung und bekannte Reserven auf einer Weltkarte.

Die Webapp verwendet React, TypeScript, Vite und MapLibre. Plattformunabhängige Datenmodelle, Daten und Berechnungen liegen in `packages/core/` und können später mit einer React-Native-App geteilt werden.

## Lokal starten

Voraussetzung: Node.js 24.x.

```sh
npm ci
npm run dev
```

Unter Windows PowerShell kann statt `npm` jeweils `npm.cmd` verwendet werden.

## Funktionen und Daten

- Periodensystem mit 118 Elementen, Suche, Familienfiltern und deutschen Infoblättern.
- Drei Kartenmodi: historische Vorkommen als Standorte, Förderung und Reserven als eingefärbte Länderflächen.
- Förder- und Reservewerte für zwölf Rohstoffe aus USGS Mineral Commodity Summaries 2026; Produktionsjahr 2025.
- 1.434 ausgewählte historische MRDS-Standorte. Die Auswahl ist keine vollständige Bestandsaufnahme oder Auskunft über den heutigen Minenbetrieb.
- Datentabellen, CSV-Export, Quellenhinweise und teilbare Ansichten über URL-Parameter.
- Responsive Darstellung, Tastaturbedienung und Datentabellen als Alternative zur WebGL-Karte.

Alle Daten, Ländergrenzen, Schriftarten und Karten-Worker werden lokal ausgeliefert. API-Schlüssel oder externe Kartenkacheln sind nicht erforderlich. Fehlende und vertrauliche Mengen werden von gemeldeten Nullwerten unterschieden. Bei Aluminium wird das Gewicht des Rohstoffs Bauxit dargestellt.

## Prüfen und bauen

```sh
npm run verify
npx playwright install chromium
npm run test:e2e -- --workers=2
```

`verify` führt Lint, Unit-Tests, TypeScript-Prüfung und Produktionsbuild aus. Der Build liegt in `dist/`; `npm run preview` startet eine lokale Vorschau.

Für dieselben Browser-Tests gegen den fertigen Build nach `npm run build` die Umgebungsvariable `PLAYWRIGHT_PREVIEW=1` setzen. Der Testserver nutzt dann Port 4174 statt 4173.

Die Datenherkunft und Auswahlregeln sind in `data/provenance.json` sowie in der App unter „Quellen & Methodik“ hinterlegt. Der Import mit `npm run data:import` verwendet einen lokalen Rohdaten-Cache; die USGS-Ländertabellen werden separat fachlich geprüft.
