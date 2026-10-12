# ADIKALA LEDGER — PROJECT SUBMISSION GUIDE
**Course:** Database Management Systems (DBMS)  
**Institution:** CHRIST (Deemed to be University), Delhi NCR Campus  
**Department:** School of Sciences  
**Parent Student Body:** ADIKALA (Izhaar Kala Ka) & 6 Specialized Sub-Clubs  
**Student Author:** Radhika Bansal  

---

## 🌐 1. Live Web Application (Zero Setup Required)

The project is hosted live on GitHub Pages and can be opened on **any laptop, tablet, or phone** without installing Python, Node.js, or MySQL:

👉 **[https://radhika2405-max.github.io/event-volunteer-hour-ledger/](https://radhika2405-max.github.io/event-volunteer-hour-ledger/)**

> **Note:** The live deployment runs in client-side interactive mode with an embedded relational database engine. You can log in, filter the ledger, test hour reviews, generate certificates, inspect audit logs, and download CSV reports directly in the browser!

---

## 🔑 2. Role-Based Evaluation Credentials

You can log in under any of the 5 institutional RBAC roles:

| Role | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@christuniversity.in` | `Admin@123` | Full access: configure policies, audit logs, issue certificates, system stats |
| **Faculty Approver** | `faculty@christuniversity.in` | `Faculty@123` | Verify/correct/reject pending hours, review timesheet discrepancies |
| **Event Coordinator** | `coordinator@christuniversity.in` | `Coord@123` | Create events, assign volunteer shifts, track club participation |
| **Technical Club Lead** | `lead.tech@christuniversity.in` | `Lead@123` | Log shift hours for Technical Sub-club volunteers |
| **Student Volunteer** | `student.a@christuniversity.in` | `Student@123` | Check personal milestone hours, submit timesheets, view certificate |

*(Sample volunteer student: Aarav Sharma — Reg No: `2347101`)*

---

## 🔍 3. Public Certificate Verifier

Anyone can verify cryptographically signed volunteer certificates without logging in:

👉 **[https://radhika2405-max.github.io/event-volunteer-hour-ledger/#/verify](https://radhika2405-max.github.io/event-volunteer-hour-ledger/#/verify)**

**Sample Verification Tokens:**
- **Valid Certificate (Eshan Gupta):**  
  `d3b07384d113edec49eaa6238ad5ff00b98e1a78`
- **Revoked Certificate (Fatima Khan):**  
  `c4ca4238a0b923820dcc509a6f75849b23820dcc`

---

## 💻 4. Running Offline on Any Laptop

If you download or clone the repository to an offline laptop:

### Method A: 1-Click Browser Preview (No installation required)
1. Double-click **`start_preview.bat`** (Windows) or execute `./start_preview.sh` (macOS/Linux).
2. The browser will automatically open:
   `http://localhost:8080/`
3. The interactive system will run smoothly with zero configuration.

### Method B: Full-Stack Development Mode (Flask + MySQL)
1. **Database Setup:**
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/procedures.sql
   mysql -u root -p < database/seed.sql
   ```
2. **Backend API:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python run.py
   ```
3. **Frontend Application:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Access at `http://localhost:5173/`.

---

## 📚 5. Documentation & Viva Artifacts

The repository includes complete documentation in the `docs/` folder:
- **Academic Project Report:** [`docs/PROJECT_REPORT.md`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/PROJECT_REPORT.md) & [`docs/outputs/Event_Volunteer_Hour_Ledger_Academic_Project_Report.pdf`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/outputs/Event_Volunteer_Hour_Ledger_Academic_Project_Report.pdf)
- **Viva Presentation Slides:** [`docs/PRESENTATION.md`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/PRESENTATION.md) & [`docs/outputs/Event_Volunteer_Hour_Ledger_Presentation.pdf`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/outputs/Event_Volunteer_Hour_Ledger_Presentation.pdf)
- **Research Poster:** [`docs/RESEARCH_POSTER.md`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/RESEARCH_POSTER.md) & [`docs/outputs/Event_Volunteer_Hour_Ledger_Research_Poster.pdf`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/docs/outputs/Event_Volunteer_Hour_Ledger_Research_Poster.pdf)
- **Relational Schema & Triggers:** [`database/schema.sql`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/database/schema.sql) and [`database/procedures.sql`](file:///c:/Users/Hp/Downloads/event-volunteer-hour-ledger/database/procedures.sql)
