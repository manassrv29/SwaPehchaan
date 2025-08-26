# SwaPehchaan: AI-Powered Life Certificate Verification System

SwaPehchaan is an advanced biometric verification system designed to modernize the life certificate submission process for pensioners through cutting-edge artificial intelligence and computer vision technologies.

## 🌟 Features

- **Face Recognition**: MobileFaceNet-based neural network with ArcFace loss optimization (95%+ accuracy)
- **Liveness Detection**: Real-time blink detection using Eye Aspect Ratio (EAR) analysis
- **Mobile-First Design**: Cross-platform React Native application optimized for elderly users
- **Enterprise Security**: End-to-end encryption with RSA-2048 and comprehensive audit logging
- **Administrative Dashboard**: Complete oversight with manual review capabilities

## 🏗️ System Architecture

### Mobile Application (React Native)
- Cross-platform support for iOS and Android
- Intuitive UI designed for accessibility
- Real-time camera integration for photo capture and liveness detection
- Secure data transmission with encryption

### Backend Services (Flask)
- RESTful API with microservices architecture
- JWT-based authentication and session management
- Comprehensive activity logging and audit trails
- SQLite database with encrypted storage

### AI Components
- MobileFaceNet model optimized for mobile deployment (4.2MB)
- Real-time blink detection for liveness verification
- Face recognition with 128-dimensional feature vectors
- TensorFlow Lite integration for efficient inference

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- React Native environment
- Android Studio / Xcode (for mobile development)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```
   python migrate_db.py
   ```

5. Start the server:
   ```
   python main.py
   ```

### Mobile App Setup

1. Navigate to the mobile directory:
   ```
   cd mobile
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npx expo start
   ```

4. Run on a device or emulator:
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app for physical device

## 📱 Mobile Application

The mobile application provides an intuitive interface for:

- User registration and authentication
- Reference photo capture
- Life certificate submission with liveness verification
- Activity history and status tracking

## 🧠 BlinkDetection Module

The face recognition and liveness detection module includes:

- Face detection using Haar Cascade classifiers
- Facial landmark detection with dlib
- Blink detection using Eye Aspect Ratio (EAR)
- MobileFaceNet model for face recognition

## 🔒 Security Features

- RSA-2048 encryption for sensitive data
- JWT-based session management
- Comprehensive audit logging
- Anti-spoofing measures for liveness verification

## 👨‍💻 Development

### Project Structure

```
SwaPehchaan/
├── backend/               # Flask backend services
│   ├── routes/            # API endpoints
│   ├── models.py          # Database models
│   └── main.py            # Application entry point
├── mobile/                # React Native mobile app
│   ├── screens/           # Application screens
│   ├── components/        # Reusable UI components
│   └── api.ts             # API integration
└── BlinkDetection/        # Face recognition module
    ├── facedetectmodel.py # Face detection implementation
    └── test.py            # Testing utilities
```

## 📊 Performance

- Face Recognition Accuracy: 95%+
- Liveness Detection Accuracy: 94.7%
- Average Verification Time: 5-10 minutes
- Mobile App Size: <20MB

## 📄 License

[Specify your license here]

## 📞 Contact

[Your contact information]
