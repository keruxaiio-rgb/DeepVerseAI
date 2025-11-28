# DeepVerse AI - Theological AI Assistant

A comprehensive AI-powered platform for pastors and Christians, providing advanced theological insights, sermon preparation, and professional presentation generation.

## ✨ Features

- **AI-Powered Theological Assistant**: Get seminary-level insights and biblical analysis
- **Interactive Sermon Preparation**: Complete exegetical-hermeneutical study guides
- **Professional PPTX Generation**: Auto-create sermon presentations
- **Multi-Authentication**: Email, Google, Apple, and GitHub sign-in
- **Referral Program**: Earn bonuses through user referrals
- **Subscription Management**: Premium features with ₱299/month pricing
- **Responsive Design**: Modern UI optimized for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd deepverse-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your API keys and configuration.

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication (Email/Password, Google, Apple)
   - Enable Firestore Database
   - Copy Firebase config to `.env.local`
   - Deploy Firestore security rules:
     ```bash
     firebase deploy --only firestore:rules
     ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📋 Environment Configuration

Copy `.env.example` to `.env.local` and configure:

### Required Variables
```env
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

### Optional Variables
```env
NEXT_PUBLIC_SUBSCRIBED=false
NEXT_PUBLIC_USER_NAME=Guest User
```

## 🏗️ Project Structure

```
deepverse-ai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── chat/              # Main chat interface
│   ├── login/             # Authentication pages
│   ├── signup/            # Registration with referral tracking
│   └── upgrade/           # Subscription management
├── components/            # Reusable UI components
├── lib/                   # Utility functions and prompts
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── firestore.rules        # Firebase security rules
```

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect GitHub repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Firebase Configuration

### Security Rules
The `firestore.rules` file includes:
- User data privacy (users can only access their own data)
- Admin privileges for user management
- Referral system data protection
- Subscription data security

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

## 💳 Subscription & Payments

Current implementation includes:
- **₱299/month** premium subscription
- **10% referral bonuses** (unlimited referrals)
- UI ready for payment integration

*Note: Payment processing requires additional integration with GCash/Bank APIs*

## 📊 Features Overview

### Core Functionality
- **Theological Q&A**: AI-powered biblical analysis
- **Sermon Preparation**: Step-by-step exegetical guides
- **PPTX Generation**: Professional presentation creation
- **Conversation History**: Persistent chat sessions

### User Management
- **Role-Based Access**: Free, Premium, Admin, Demo accounts
- **Referral System**: Secure personalized referral keys
- **Profile Dashboard**: Account management and analytics

### Security Features
- **Firebase Authentication**: Secure user authentication
- **Data Encryption**: Protected API communications
- **Input Validation**: Sanitized user inputs
- **Rate Limiting**: API protection (recommended for production)

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting (recommended)

## 📈 Performance

- **Static Generation**: Fast loading pages
- **Optimized Images**: Automatic image optimization
- **Code Splitting**: Efficient bundle sizes
- **Caching**: Smart caching strategies

## 🔒 Security Considerations

- Environment variables properly secured
- Firebase security rules implemented
- Input sanitization and validation
- HTTPS required for production
- API rate limiting recommended

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for DeepVerse AI.

## 🆘 Support

For technical support or questions:
- Check the documentation
- Review Firebase console for errors
- Ensure all environment variables are set

## 🚀 Future Enhancements

- Payment gateway integration
- Advanced admin panel
- Mobile app development
- Multi-language support
- Advanced analytics
