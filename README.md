# Construction Health & Safety Program (CSHP) Management System

A browser-based web application for managing construction project records, monitoring the assignment and availability of safety personnel, and identifying potential personnel allocation conflicts in support of Construction Health and Safety Program (CSHP) evaluation workflows.

Developed with vanilla JavaScript, HTML5, and CSS3, the system is designed around Philippine construction safety workflows and references DOLE Department Order No. 13 and applicable Philippine Occupational Safety and Health (OSH) standards.

**[Live Demo](https://hansoscargegantoni.github.io/Construction-Health-and-Safety-Program-CSHP-Management-System/)**

> **Note:** This project is a demonstration and record-management tool. Its automated checks support administrative review but do not replace official regulatory evaluation or determine legal compliance.

## Features

### Contract and Project Management

* Manage construction project records, including contract IDs, project names, locations, contractor details, and PCAB license information.
* Record project schedules, estimated peak workforce, designated safety personnel, and evaluation remarks.
* Track project statuses: Active / Ongoing, Under Review, Completed, and Suspended.
* Add and edit contract information through interactive forms.

### Personnel Assignment Conflict Detection

* Detect potential double-booking of Safety Officers and First Aiders across active and under-review projects.
* Normalize personnel names to help identify matching individuals despite common honorifics, suffixes, and name variations.
* Display live conflict warnings while entering personnel information.
* Highlight conflicting assignments through visual status badges and dashboard alerts.
* Flag cases where the same individual is assigned as both Safety Officer and First Aider on the same project.

### Contractor Replacement Notice Generator

* Generate a formatted Notice of CSHP Personnel Replacement Requirement from project details.
* Identify conflicting personnel assignments and associated projects.
* Provide a copy-to-clipboard function for the generated notice.

### Personnel Roster and Availability

* View registered Safety Officers and First Aiders in a dedicated personnel directory.
* Display personnel availability based on active project assignments.
* Search and filter personnel by role, availability, certification, and contract ID.

### Dashboard and Data Table

* Display summary metrics for total contracts, active projects, Safety Officers, First Aiders, and assignment conflicts.
* Search project records across relevant contract, contractor, location, and personnel fields.
* Filter by project status and conflict status.
* Sort table columns in ascending or descending order.
* Navigate from conflict metrics to the corresponding project records.

### Data Management and Portability

* Perform asynchronous CRUD operations through a dedicated storage service.
* Persist records in browser `localStorage`.
* Export contract records to CSV for spreadsheet applications.
* Export and import JSON backups.
* Load sample construction project records for demonstration and testing.

## Technology Stack

| Technology                | Purpose                                                             |
| ------------------------- | ------------------------------------------------------------------- |
| HTML5                     | Semantic structure, forms, dialogs, and application layout          |
| CSS3                      | Responsive styling, visual components, tables, and modal interfaces |
| Vanilla JavaScript (ES6+) | Application logic, event handling, and interactive features         |
| Browser `localStorage`    | Client-side data persistence                                        |
| PowerShell                | Local HTTP server, Windows launcher, and endpoint verification      |
| GitHub Pages              | Hosting the browser-based demonstration                             |

The application has no Node.js or package installation requirement and uses a modular, zero-dependency architecture.

## Architecture

The application separates its presentation, application logic, and data-handling responsibilities into distinct modules.

* **Application controller:** Coordinates user interactions and application components.
* **Storage service:** Provides asynchronous CRUD interfaces and handles local persistence, CSV export, and JSON backup/import.
* **Conflict engine:** Evaluates personnel assignments and detects potential conflicts.
* **UI modules:** Handle contract tables, forms, project details, personnel rosters, and notifications.
* **Configuration and sample data:** Maintain system constants, accreditation levels, PCAB categories, and demonstration records.

The storage abstraction is intended to make a future backend integration easier, although the current implementation remains client-side.

## Project Structure

```text
Construction-CSHP/
├── index.html
├── start.bat
├── serve.ps1
├── css/
│   ├── main.css
│   ├── components.css
│   └── modals.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── services/
│   │   ├── storage.js
│   │   ├── conflict-engine.js
│   │   └── sample-data.js
│   └── ui/
│       ├── table-view.js
│       ├── form-modal.js
│       ├── details-modal.js
│       ├── roster-view.js
│       └── toasts.js
└── test_endpoints.ps1
```

## Running Locally

### Requirements

* A modern web browser.
* Windows and PowerShell for the included launcher and local server scripts.

### Option 1: Windows Launcher

1. Clone or download the repository.
2. Open the project directory.
3. Run `start.bat`.
4. Follow the launcher instructions to open the application in your browser.

### Option 2: PowerShell Server

Run the included `serve.ps1` script from PowerShell according to its configured port and startup instructions, then open the local address in your browser.

The application is designed to run through HTTP so its JavaScript modules and assets can be served correctly.

## Verification and Testing

The project includes `test_endpoints.ps1`, a PowerShell-based endpoint verification script.

The reported test results cover:

* HTTP availability of the application page, CSS files, and JavaScript modules.
* Correct content types for the served assets.
* Detection of conflicting Safety Officer and First Aider assignments.
* Exclusion of completed projects from active assignment conflict checks.
* Generation of formatted personnel replacement notices.

These checks validate selected application behavior and local asset delivery; they do not constitute a complete security audit or formal regulatory compliance certification.

## Current Limitations

* **Client-side persistence:** Records are stored in the browser's `localStorage`. They are not automatically synchronized across different users, browsers, or devices.
* **Demonstration data:** The initial records are sample data and should not be treated as official project records.
* **No shared backend:** The current application does not provide centralized database storage or server-side access control.
* **Compliance support:** Automated conflict detection and generated notices assist administrative workflows but require appropriate human review.

## Future Improvements

* Integrate a backend API and centralized relational database.
* Implement user authentication and role-based access control.
* Add server-side validation, audit logs, and secure data backup.
* Expand automated tests for conflict detection and data management.
* Introduce multi-user access and synchronized records.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
