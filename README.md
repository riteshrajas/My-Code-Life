# 🚀 Stage - Your Personal Command Center for Life Excellence

<div align="center">

**Transform your daily chaos into purposeful action with AI-powered guidance**

*A revolutionary personal dashboard that helps you live with intention, grow through challenges, and build meaningful connections*

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://mylifecode.vercel.app/dashboard)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6.svg)](https://www.typescriptlang.org/)

</div>

---

## 🎯 Why Stage Exists

**Life is complex. Your tools shouldn't be.**

In a world drowning in productivity apps, to-do lists, and digital noise, Stage cuts through the chaos with a simple truth: **meaningful progress comes from aligning your actions with your deepest values**.

Stage isn't just another dashboard—it's your personal command center for:
- ✨ **Living with purpose** through three foundational life rules
- 🧠 **Making better decisions** with AI-powered ethical guidance  
- 🚀 **Growing stronger** by turning challenges into opportunities
- 💫 **Building deeper connections** with family and meaningful relationships
- 📈 **Tracking real progress** that matters to your life's trajectory

---

## 🎭 Who This App Is For

### 🏆 **High Achievers & Leaders**
- Entrepreneurs, executives, and professionals who want to align success with personal values
- Anyone managing complex projects while maintaining work-life integration
- Leaders who need to make ethical decisions under pressure

### 📚 **Lifelong Learners & Creators**
- Students, researchers, and academics pursuing truth and knowledge
- Writers, artists, and creators seeking authentic expression
- Anyone committed to continuous personal development

### 👨‍👩‍👧‍👦 **Family-Focused Individuals**
- Parents wanting to model integrity and growth for their children
- Family members seeking to strengthen connections across distances
- Anyone who values deep, meaningful relationships over surface interactions

### 🧘 **Intentional Living Practitioners**
- People tired of reactive living who want to become more intentional
- Anyone seeking to break free from social media addiction and digital overwhelm
- Individuals committed to personal philosophy and ethical living

---

## ⚡ Core Features That Set Stage Apart

### 🎯 **The Three Rules Framework**
Built around three scientifically-backed life principles:

1. **🧭 Seek Truth with Relentless Curiosity**
   - Combat cognitive biases and echo chambers
   - Make evidence-based decisions
   - Cultivate intellectual humility and growth

2. **🛡️ Live with Uncompromising Integrity**  
   - Align actions with values consistently
   - Build trust through authentic behavior
   - Take responsibility without excuses

3. **💪 Grow Through Challenges as an Antifragile System**
   - Transform obstacles into opportunities
   - Build resilience through voluntary challenges
   - Iterate and improve continuously

### 🤖 **AI-Powered Gemini Advisor**
- **Real-time ethical guidance** for complex decisions
- **Pattern recognition** in your behavior and choices
- **Personalized insights** based on your values and goals
- **Gentle accountability** that helps you stay aligned

### 📊 **Intelligent Life Analytics**
- **Rule alignment tracking** shows how well you're living your values
- **Progress visualization** across all life areas
- **Habit detection** automatically identifies positive patterns
- **Mood and growth analysis** from your daily reflections

### 👥 **Family Connection Hub**
- **Secure family portal** for staying connected across distances
- **Call scheduling** and status sharing with loved ones
- **Shared contact management** for important relationships
- **Privacy-first** design with individual profile control

### 📝 **Comprehensive Life Management**
- **Daily reflections** with AI analysis and insights
- **Smart task management** linked to your life rules
- **Contact relationship mapping** with interaction history
- **Voice input support** for quick thoughts and reflections

---

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free)
- Google AI API key (free tier available)

### Quick Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/riteshrajas/stage.git
   cd stage
   npm install
   ```

2. **Set Up Your Environment**
   Create a `.env` file:
   ```env
   # Supabase Configuration (Get from supabase.com)
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Gemini AI (Get from ai.google.dev)
   VITE_GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Initialize Your Database**
   Run the provided SQL scripts in your Supabase dashboard:
   ```bash
   # Run these files in Supabase SQL Editor
   src/sql/setup_contacts_table.sql
   src/sql/setup_diary_entries_table.sql
   src/sql/setup_tasks_table.sql
   src/sql/setup_family_members_table.sql
   src/sql/setup_user_settings_table.sql
   src/sql/setup_user_profiles_table.sql
   ```

4. **Launch Your Command Center**
   ```bash
   npm run dev
   ```

5. **Start Your Journey**
   - Open http://localhost:5173
   - Create your account
   - Explore the three life rules
   - Have your first conversation with the AI advisor

### 🎮 Try the Demo
Want to see Stage in action first? Use these demo credentials:
- **Username**: demo_user
- **Password**: stage_demo_2024

---

## 🎨 Technology Stack

**Frontend Excellence**
- ⚛️ **React 18** with TypeScript for type-safe development
- ⚡ **Vite** for lightning-fast build and development
- 🎭 **Framer Motion** for beautiful, purposeful animations
- 🎨 **TailwindCSS** for consistent, responsive design
- 🧩 **Shadcn/UI** for accessible, modern components

**Backend Power**
- 🗄️ **Supabase** for authentication, database, and real-time features
- 🔐 **Row Level Security** for data protection
- 🌐 **Edge Functions** for scalable server-side logic

**AI Integration**
- 🧠 **Google Gemini** for intelligent analysis and guidance
- 📊 **Natural Language Processing** for content analysis
- 🎯 **Custom prompting** for life-rule alignment

---

## 🛠️ Key Use Cases

### 📅 **Daily Workflow**
1. **Morning**: Check AI insights from yesterday's reflections
2. **Throughout day**: Quick voice notes and task capture
3. **Decision points**: Consult AI advisor for ethical guidance
4. **Evening**: Reflect on the day's alignment with your rules

### 🏢 **Professional Applications**
- **Project planning** with integrity and truth-seeking
- **Team leadership** decisions backed by your values
- **Career development** aligned with personal growth
- **Ethical business** choices with AI guidance

### 👨‍👩‍👧‍👦 **Family Life**
- **Stay connected** with distant family members
- **Model values** for children through consistent living
- **Strengthen relationships** through intentional interaction
- **Create family traditions** around growth and learning

---

## 🌟 What Users Are Saying

> *"Stage transformed how I make decisions. The AI advisor helps me stay true to my values even under pressure."*  
> — Sarah K., Startup Founder

> *"Finally, a productivity app that focuses on who I'm becoming, not just what I'm doing."*  
> — Marcus T., Graduate Student

> *"The family features keep us connected across continents. My kids love sharing their growth with grandparents."*  
> — Jennifer L., Working Parent

---

## 🤝 Contributing

We believe the best tools are built by communities that use them. Whether you're fixing bugs, adding features, or improving documentation, your contributions make Stage better for everyone.

**Ways to contribute:**
- 🐛 Report bugs and suggest features
- 💻 Submit code improvements
- 📚 Improve documentation
- 🎨 Design enhancements
- 🌍 Translations and accessibility

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🔒 Privacy & Security

Your personal growth data is precious. Stage is built with privacy-first principles:

- 🔐 **End-to-end encryption** for sensitive data
- 🏠 **Self-hosting options** available
- 🚫 **No data selling** - ever
- 🔍 **Transparent data usage** - you own your insights
- 🛡️ **Regular security audits** and updates

---

## 📈 Roadmap

**Q2 2025**
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Community challenges and accountability

**Q3 2025**
- [ ] Calendar integration (Google, Apple, Outlook)
- [ ] Advanced AI coaching features
- [ ] Team/organization accounts

**Q4 2025**
- [ ] Marketplace for custom AI models
- [ ] Advanced family features
- [ ] Enterprise security features

---

## 📄 License

Stage is open source and available under the [MIT License](LICENSE). Build something amazing! 

---

## 🚀 Ready to Transform Your Life?

Don't let another day pass living reactively. Take control, align with your values, and build the life you truly want.

**[🎯 Start Your Journey Today](https://your-deployment-link.com)**

**Questions?** Join our [Discord community](https://discord.gg/stage) or reach out at hello@stage-app.com

---

*Made with ❤️ for people who refuse to settle for ordinary*
