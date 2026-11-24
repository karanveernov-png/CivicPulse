# CivicPulse

**Your City. Your Voice. Visible Action.**

CivicPulse is an interactive civic issue management platform for Delhi. It helps citizens report neighbourhood problems, track progress, and helps municipal officers verify, assign, and resolve them.

Built for **Track 5 — Smarter Cities and Civic Infrastructure**.

## Live Demo

[Open CivicPulse on Vercel](https://civic-pulse-flame-nu.vercel.app/login)

---

## Highlights

- Separate **Citizen** and **Admin Station** login experiences
- Interactive Delhi map with issue markers and clustering
- Four-step citizen report flow
- Photo, issue type, severity, name, description, and location capture
- Automatic nearby duplicate suggestions
- Community confirmations and support
- Municipal verification, team assignment, status updates, and resolution workflow
- Local demo data with browser persistence
- Responsive desktop and mobile interface

---

## Demo Login

Open the app and choose the required portal.

### Citizen

1. Select **Citizen**
2. Enter any name
3. Continue to the citizen reporting section

### Admin Station

| Field | Demo value |
|---|---|
| Station name | `Admin Station` |
| Password | `admin1234` |

After signing in, the admin can access the complete dashboard, live map, community, reports, and municipal console.

---

## Run the Project

### Requirements

- Node.js 18 or newer
- npm

### Start locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### Production build

```bash
npm run build
npm run preview
```

### Tests and lint

```bash
npx vitest run
npx oxlint src
```

No API key or environment variable is required.

---

## Main Features

### Citizen Portal

Citizens can:

- Select a civic issue category
- Enter name, title, description, and severity
- Upload a photo
- Select a location on the map or use their current location
- Review and submit a report
- View nearby similar reports
- Support or confirm existing reports
- Follow status changes

### Admin Station

Administrators and ward officers can:

- View all reports and city-wide metrics
- Filter issues by status, category, ward, and priority
- Use the live Delhi map
- Verify or reject reports
- Start or resolve work
- Assign municipal teams
- Reopen resolved or rejected reports
- Merge duplicate reports
- Review report timelines and audit history

---

## 60-Second Demo

1. Sign in as **Citizen** and submit a pothole report.
2. Enter a name, description, severity, photo, and map location.
3. Review duplicate suggestions before submitting.
4. Open **Live Map** to locate the report.
5. Sign out and open the **Admin Station**.
6. Use `Admin Station` and `admin1234`.
7. Open **Municipal Console**.
8. Verify a report, assign a team, and resolve it.
9. Confirm that status and analytics update across the app.

---

## Technology

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- MapLibre GL JS
- OpenStreetMap raster tiles
- Recharts
- React Hook Form
- Zod
- Vitest

---

## Project Structure

```text
src/
├── components/
│   ├── analytics/       Charts and analytics views
│   ├── issues/          Issue cards, filters, and timelines
│   ├── layout/          Navigation, header, and logo
│   ├── map/             Live map and location picker
│   ├── municipal/       Municipal action controls
│   └── ui/              Shared buttons, cards, badges, and dialogs
├── data/                Seed reports, teams, wards, and templates
├── lib/                 Validation, geolocation, priority, and duplicate logic
├── pages/               Citizen and municipal application pages
├── state/               Shared state and in-memory workflows
└── types/               TypeScript application models
```

---

## How Data Works

CivicPulse is a frontend demonstration.

- Reports and votes are stored in the browser using `localStorage`
- Seed reports are recreated deterministically
- The app does not send reports to a real municipality
- Multiple devices do not share local demo state
- The login is a demo role selector, not production authentication
- Reset Demo Data restores the original seed reports

For a real deployment, replace the demo state and login with a secure backend, database, authentication service, and official municipal integrations.

---

## Known Demo Limitations

- Location labels use approximate neighbourhood information
- Data is available only in the browser where it was created
- The app does not provide real-time multi-user synchronization
- Duplicate detection and priority scoring use explainable demo heuristics
- The map requires internet access to load OpenStreetMap tiles

---

## Build Status

```text
TypeScript: Passed
Vite build: Passed
Local issue images: Included
Interactive map: OpenStreetMap based
Demo login: Citizen and Admin Station
```
