# Product Requirements Document: Document Automation & Templating System

**Project Name:** DocuTemplate Automator
**Objective:** Transform client's static PDF/DOCX forms into dynamic, web-based interfaces that allow for field modification, dynamic content population, and dynamic branding (logo injection).

---

## 1. Architectural Strategy: Simple Input & Download

To keep the application lightweight and simple, the document generator will focus solely on providing an input interface and downloading the result.

- **No Database Required:** Documents will be generated on the fly. Client data will be sourced from a local JSON file. No need to store generated documents, history, or user sessions.
- **Static Branding:** A static logo (the provided PNG) will be embedded in all generated documents.
- **The Flow:**
  1.  User selects a document type: "Individual Service Plan (ISP)" or "Annual Progress Report (APR)".
  2.  User selects a Client from a dropdown (populated from a local JSON file). This auto-populates relevant identifying information (Name, UCI#, DOB, Address, etc.).
  3.  User fills out the remaining Next.js form fields and toggles specific sections on/off as needed.
  4.  User clicks "Download PDF".
  5.  Rendering Engine generates the PDF with the static logo and triggers a browser download.

---

## 2. Form Logic & Toggle-able Fields

The application will feature two main forms corresponding to the two document types.

- **Document Types:**
  - Individual Service Plan (ISP)
  - Annual Progress Report (APR)
- **Toggle-able Fields:** Each field in the form will have a toggle (e.g., a checkbox or switch) allowing the user to include or exclude that specific field from the final generated document.
- **Data Handling:** React Hook Form will manage the form state, including the values and the "enabled/disabled" state of each field.

---

## 3. Features List

### A. Document Selection & Input

- **Client Selection:** A dropdown menu to select a client. This will read from a local JSON file containing client profiles.
- **Auto-population:** Selecting a client automatically fills in corresponding fields in the form (e.g., Name, UCI#, Date of Birth, Address).
- **Form Interface:** Clean, simple input fields for all variables required by the ISP and APR templates.
- **Field Toggles:** A mechanism next to each input or section to include/exclude it from the generated document.

### B. Static Branding

- **Logo:** The provided logo PNG will be hardcoded into the document templates header (e.g., stored in `/public` and embedded during PDF generation). No logo upload component needed.

### C. Export/Generation

- **Direct Download:** A single "Generate & Download" button that creates the PDF and prompts the user to save it locally.
- **PDF Generation:** Use a simple PDF generation library (like `jspdf` or `@react-pdf/renderer`) to layout the text and the static logo.

---

## Document Templates

### ISP (Individual Service Plan)

**Variables:**

- `{reportDate}`: Date of Report
- `{reportPeriod}`: Period of Report
- `{name}`: Name
- `{uciNumber}`: UCI#
- `{dob}`: Date of Birth
- `{Address}`: Address
- `{Referral Source}`: Referral Source
- `{cordinatorName}`: Service Coordinator
- `{insertCopy}`: Multi-line text for various sections
- `{printName}`: Print Name
- `{position}`: Position

**Structure:**

- INDIVIDUAL SERVICE PLAN
- IDENTIFYING INFORMATION
- RATIONALE FOR SERVICES
- BACKGROUND INFORMATION
- MOTIVATIONAL ANALYSIS
- SELF-CONTROL AND INTERPERSONAL SKILL OBJECTIVES
- SELF-CONTROL AND INTERPERSONAL SKILLS: BARRIERS TO PROGRESS
- SERVICE STRATEGIES
- INTERVENTION RECOMMENDATIONS
- LIFE SKILLS TRAINING
- COMMENTS AND RECOMMENDATIONS

---

### APR (Annual Progress Report)

**Variables:**

- `{reportDate}`: Date of Report
- `{reportPeriod}`: Period of Report
- `{name}`: Name
- `{uciNumber}`: UCI#
- `{dob}`: Date of Birth
- `{Address}`: Address
- `{Referral Source}`: Referral Source
- `{cordinatorName}`: Service Coordinator
- `{insertCopy}`: Multi-line text for various sections
- `{printName}`: Print Name
- `{position}`: Position

**Structure:**

- ANNUAL PROGRESS REPORT
- IDENTIFYING INFORMATION
- BACKGROUND INFORMATION
- RESULTS OF BEHAVIORAL INTERVENTION (Includes Data Summary table for Agitation, Physical Aggression, Property Destruction)
- PROGRESS ON LIFE SKILLS TRAINING (Includes Skill Data Summary table for Exercise, Small Purchase)
- PROGRESS ON SELF-CONTROL AND INTERPERSONAL SKILLS (Includes Behavior Data Summary table for Emotional Outbursts, Elopement, Resistiveness)
- COMMENTS AND RECOMMENDATIONS
