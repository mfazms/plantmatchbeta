# 🌿 PlantMatch – Recommender System for Living Decorative Plants

**Check Here 👉 [www.PlantMatch.Web.Id](https://www.plantmatch.web.id)**

PlantMatch is a modern web-based application that helps users choose **living decorative plants** suitable for their room conditions, aesthetic preferences, and maintenance levels.  
The app is built with **Next.js** and leverages a **content-based recommendation algorithm** using custom filtering rules and similarity scoring.  
It uses a curated dataset from **Kaggle**, combining plant characteristics such as light, watering needs, and climate adaptability to produce personalized recommendations.

---

## 🚀 Key Features

### 🌱 Core Features
- **Personalized Plant Recommendation** – Smart matching based on your preferences
- **Smart Search** – Fuzzy matching with Rule-based scoring with content-based filtering for accurate results
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

- 🔗 **[GitHub Repository](https://github.com/mfazms/plantmatch)** *(Update with your actual repo URL)*

---

## 🧰 Prerequisites

Make sure the following tools are installed on your system:

- **Node.js** (LTS version recommended)
- **Git** & GitHub Desktop
- **Visual Studio Code**
- **Firebase Account** (for authentication & database)
- *(Optional)* Docker Desktop
- *(Optional)* SonarCloud account
- *(Optional)* Google Cloud Platform or Vercel account for deployment

---

## ✅ Local Project Setup

```bash
# 1. Clone the repo
git clone https://github.com/mfazms/plantmatch.git
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
# Copy from .env.example or add these variables:
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

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
│   ├── wishlist/
│   │   └── page.tsx              # Wishlist page
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
│   ├── types.ts                  # TypeScript type definitions
│   └── wishlist.ts               # Wishlist management functions
│
├── public/                       # Static Assets
│   ├── data/
│   │   └── PlantsData.json       # Plants database
│   ├── images/                   # Plant images (300+ images)
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── hero.png                  # Hero image/logo
│   └── site.webmanifest
│
├── .env.local                    # Environment variables (gitignored)
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
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

**CI Workflow:**
```
Lint → Test → Build (Next.js) → Static Analysis
```

**CD Workflow:**
```
Authenticate → Build Docker Image → Deploy to Vercel / GCP Cloud Run
```

**Monitoring (Optional):**
Integrate **Google Cloud Monitoring** or **Vercel Analytics** for real-time performance insights.

---

## 🧠 Recommendation Logic Overview

### Content-Based Filtering Algorithm

1. **Prefiltering:**
   - Filters plants based on light requirements
   - Temperature and climate compatibility
   - Watering frequency preferences
   - MBTI personality matching (optional)

2. **Scoring System:**
   - Computes similarity between user preferences and plant attributes
   - Weighted scoring based on multiple factors
   - Normalized scores (0-100%)

3. **Ranking:**
   - Displays results sorted by relevance score
   - Groups by match quality (Perfect, Great, Good, Acceptable)
   - Detailed explanations for each recommendation

4. **AI Enhancement:**
   - Optional AI-powered explanations using Gemini AI
   - Contextual care tips and suggestions
   - Interactive chat for plant care questions

---

## 📦 Dataset

🔗 **[Indoor House Plants Dataset with Care Instructions](https://www.kaggle.com/datasets/prakash27x/indoor-house-plants-dataset-with-care-instructions)**

The dataset includes **300+ plants** with attributes such as:

- Common & botanical names
- Light & watering requirements
- Climate & origin information
- Decorative use & placement recommendations
- Toxicity warnings for pets/children
- Detailed care descriptions
- MBTI personality compatibility
- High-quality image URLs

---

## 🧪 Testing (Optional)

You can implement component testing using:

- **Jest** + **React Testing Library**
- Store test files under: `components/__tests__/*.test.tsx`

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 📊 Nonfunctional Highlights

- **⚡ Performance**: Recommendations appear ≤ 2 seconds
- **🔒 Security**: Firebase authentication with secure data storage
- **📱 Usability**: Responsive and mobile-friendly interface with smooth animations
- **🔍 Transparency**: Displays reasoning for each recommendation
- **♿ Accessibility**: Proper focus states and reduced motion support
- **🌐 SEO**: Optimized meta tags and Open Graph support

---

## 🎨 Design Features

- **Glass Morphism** – Modern transparent UI elements with backdrop blur
- **Gradient Backgrounds** – Emerald to teal color scheme
- **Smooth Animations** – Fade-in, slide, pulse, float effects
- **Interactive Elements** – Hover effects, parallax, glowing card effects
- **Responsive Layout** – Adapts seamlessly to all screen sizes
- **Loading States** – Beautiful skeleton loaders and transitions
- **Dark Mode Ready** – Prepared for dark theme implementation

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init

# Deploy
firebase deploy
```

---

## 📄 License

This project is licensed under the **MIT License**.
See the `LICENSE` file for more details.

---

## 📬 Need Help?

If you encounter bugs or have questions, feel free to:

- 🐛 **[Open an Issue](https://github.com/mfazms/plantmatch/issues)**
- 📖 **[Check Documentation](https://www.notion.so/Plantmatch-296197af6217807ea0faf433e602683e)**
- 📧 **Email**: [fazlesidiki@gmail.com](mailto:fazlesidiki@gmail.com)

---

## 🌟 Acknowledgments

- **Dataset**: [Kaggle - Indoor House Plants Dataset](https://www.kaggle.com/datasets/prakash27x/indoor-house-plants-dataset-with-care-instructions)
- **AI**: Google Gemini AI for chatbot functionality
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

---

## 📸 Screenshots

*Coming soon...*

---

<div align="center">

**Made with 💚 by PlantMatch Team**

⭐ Star this repo if you find it helpful!

</div>