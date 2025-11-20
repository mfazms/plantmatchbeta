# 🌿 PlantMatch – Recommender System for Living Decorative Plants

PlantMatch is a modern web-based application that helps users choose **living decorative plants** suitable for their room conditions, aesthetic preferences, and maintenance levels.  
The app is built with **Next.js** and leverages a **content-based recommendation algorithm** using custom filtering rules and similarity scoring.  
It uses a curated dataset from **Kaggle**, combining plant characteristics such as light, watering needs, and climate adaptability to produce personalized recommendations.

---

## 🚀 Key Features

### 🌱 Core Features
- **Personalized Plant Recommendation** – Smart matching based on your preferences
- **Smart Search** – Fuzzy matching & TF-IDF for accurate results
- **Contextual Filters** – Light, Watering, Climate, Placement, MBTI personality
- **Detailed Plant Information** – Comprehensive care instructions

### 🪴 Garden Management
- **My Garden** – Track plants you're currently growing
- **Plant History** – View all plants (active, died, not suitable)
- **Watering Tracker** – Track daily watering with statistics
- **Care Progress** – Monitor your plant care journey

### 💬 AI Assistant
- **ChatBot Integration** – Powered by Gemini AI
- **Plant Care Tips** – Get personalized advice
- **Recommendation Explanations** – Understand why plants match you

### 📊 Export & Analytics
- **Export to PDF** – Save recommendations as PDF
- **Statistics Dashboard** – View your gardening stats
- **Filter by Status** – Active, Died, Not Suitable plants

### ✨ User Experience
- **Beautiful Animations** – Smooth transitions & effects
- **Responsive Design** – Works on all devices
- **Glass Morphism UI** – Modern aesthetic design
- **Interactive Effects** – Hover, parallax, glowing effects

---

## 👨‍💻 Development Team

| Name | Student ID | GitHub | Email |
|------|-------------|--------|--------|
| Fadillah Nur Laili | 5026221032 | [@FadillahNurLaili](https://github.com/FadillahNurLaili) | – |
| Sintiarani Febyan Putri | 5026221044 | [@sranifp](https://github.com/sranifp) | sintiap288@gmail.com |
| **Moehammad Fazle Mawla Sidiki** | 5026221110 | [@mfazms](https://github.com/mfazms) | fazlesidiki@gmail.com |
| Parisya Naylah Suhaymi | 5026221138 | [@ParisyaNaylah](https://github.com/ParisyaNaylah) | parisyanaylah@gmail.com |
| Candleline Audrina Firsta | 5026221159 | [@Candleline](https://github.com/Candleline) | candlelinef@gmail.com |

---

## 📁 Repository

- 🔗 [Project Repository](https://github.com/YOUR_USERNAME/plantmatch)

---

## 🧰 Prerequisites

Make sure the following tools are installed on your system:

- Node.js (LTS)
- Git & GitHub Desktop
- Visual Studio Code
- Firebase Account (for authentication & database)
- (Optional) Docker Desktop
- (Optional) SonarCloud account
- (Optional) Google Cloud Platform or Vercel account for deployment

---

## ✅ Local Project Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/plantmatch.git
cd plantmatch

# 2. Install dependencies
npm install

# If errors occur, use:
npm install --legacy-peer-deps
```

📌 **Note**: `--legacy-peer-deps` is used to bypass dependency conflicts with older packages.

```bash
# 3. Configure Firebase
# Create .env.local file with your Firebase credentials

# 4. Start the development server
npm run dev
```

The app will run locally on **[http://localhost:3000](http://localhost:3000)**

---

## 🗂️ Folder Structure

```bash
CAPSTONEBETA02/
├── app/                          # App Router (Next.js)
│   ├── api/                      # API Routes
│   │   ├── chat/
│   │   │   └── route.ts          # ChatBot API (Gemini AI)
│   │   ├── plant-image/
│   │   │   └── route.ts          # Plant image proxy
│   │   └── plants/
│   │       └── route.ts          # Plants data API
│   │
│   ├── kebunku/
│   │   └── page.tsx              # My Garden page
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── register/
│   │   └── page.tsx              # Register page
│   ├── rekomendasi/
│   │   └── page.tsx              # Recommendations page
│   ├── riwayat-tanaman/
│   │   └── page.tsx              # Plant History page
│   ├── tanaman/
│   │   └── [id]/
│   │       └── page.tsx          # Plant Detail page
│   │
│   ├── globals.css               # Global styles & animations
│   ├── icon.png.png              # App icon
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/                   # UI Components
│   ├── AnimatedCard.tsx          # Animated card wrapper
│   ├── ChatBot.tsx               # AI ChatBot component
│   ├── ChatButton.tsx            # Floating chat button
│   ├── ExportPDFButton.tsx       # PDF export functionality
│   ├── FiltersPanel.tsx          # Sidebar filters
│   ├── LoadingAnimations.tsx     # Loading states
│   ├── MulaiMenanamButton.tsx    # Start planting button
│   ├── NavigationTabs.tsx        # Tab navigation
│   ├── page_with_loading.tsx     # Page with loading state
│   ├── PlantCard.tsx             # Plant card component
│   ├── PlantHistoryPage.tsx      # History page component
│   ├── PlantImage.tsx            # Optimized plant images
│   ├── PlantList.tsx             # Plant grid/list
│   └── StopPlantingDialog.tsx    # Stop planting confirmation
│
├── lib/                          # Utilities & Logic
│   ├── firebaseConfig.ts         # Firebase configuration
│   ├── garden.ts                 # Garden management functions
│   ├── loadData.ts               # Data loading utilities
│   ├── recommend.ts              # Recommendation algorithm
│   ├── Tailwind.config.ts        # Tailwind configuration
│   └── types.ts                  # TypeScript type definitions
│
├── public/                       # Static Assets
│   ├── data/
│   │   └── PlantsData.json       # Plants database
│   ├── images/                   # Plant images
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── file.svg
│   ├── globe.svg
│   ├── hero.png                  # Hero image/logo
│   ├── hero1.png                 # Alternative hero
│   ├── next.svg
│   ├── site.webmanifest
│   ├── vercel.svg
│   └── window.svg
│
├── firebase-seeder/              # Database seeder
├── node_modules/                 # Dependencies
├── plant-seeder/                 # Plant data seeder
│
├── .env.local                    # Environment variables
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

## ⚙️ CI/CD Configuration (Optional for Deployment)

If you wish to automate build and deployment via GitHub Actions:

1. Create a new GitHub repository
2. Add environment variables under:
   **Settings → Secrets and variables → Actions**
3. Push your local project:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/plantmatch.git
git branch -M main
git push -u origin main
```

✅ Once `.github/workflows/ci.yml` and `cd.yml` are configured, the CI/CD pipeline will run automatically.

---

## 🔄 DevOps Pipeline Flow (Example)

* **CI Workflow**:
  `Lint → Test → Build (Next.js) → Static Analysis`

* **CD Workflow**:
  `Authenticate → Build Docker Image → Deploy to Vercel / GCP Cloud Run`

* **Monitoring (Optional)**:
  Integrate **Google Cloud Monitoring** or **Vercel Analytics** for real-time performance insights.

---

## 🧠 Recommendation Logic Overview

* **Prefiltering:**
  Filters plants based on light, temperature, climate, watering frequency, and MBTI personality compatibility.

* **Scoring:**
  Computes similarity between user preferences and dataset attributes using content-based matching with weighted scoring.

* **Ranking:**
  Displays results sorted by relevance score with detailed reason explanations.

* **AI Enhancement:**
  Optional AI-powered explanations using Gemini AI for why specific plants match user preferences.

---

## 📦 Dataset

🔗 [Indoor House Plants Dataset with Care Instructions](https://www.kaggle.com/datasets/prakash27x/indoor-house-plants-dataset-with-care-instructions)

Includes attributes such as:

* Common & botanical names
* Light & watering needs
* Climate & origin
* Decorative use, toxicity, and description
* MBTI personality matching
* Image URL

---

## 🧪 Testing (Optional)

You can implement component testing using:

* **Jest** + **React Testing Library**
* Store test files under: `components/__tests__/*.test.tsx`

---

## 📊 Nonfunctional Highlights

* **Performance**: Recommendations appear ≤ 2 seconds
* **Security**: Firebase authentication with secure data storage
* **Usability**: Responsive and mobile-friendly interface with smooth animations
* **Transparency**: Displays reasoning for each recommendation
* **Accessibility**: Proper focus states and reduced motion support

---

## 🎨 Design Features

* **Glass Morphism** – Modern transparent UI elements
* **Gradient Backgrounds** – Emerald to teal color scheme
* **Smooth Animations** – Fade-in, slide, pulse, float effects
* **Interactive Elements** – Hover effects, parallax, glowing effects
* **Responsive Layout** – Adapts to all screen sizes

---

## 📄 License

This project is licensed under the **MIT License**.
See the `LICENSE` file for more details.

---

## 📬 Need Help?

If you encounter bugs or have questions, feel free to open an issue via:

➡️ [GitHub Issues](https://github.com/YOUR_USERNAME/plantmatch/issues)

➡️ [Notion](https://www.notion.so/Plantmatch-296197af6217807ea0faf433e602683e?source=copy_link)

Or contact the main developer:

📧 **[fazlesidiki@gmail.com](mailto:fazlesidiki@gmail.com)**
