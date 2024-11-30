# Focuser

A collaborative focus timer app that helps users stay productive together. Users can choose to study alone or pair up with a buddy for enhanced motivation and rewards.

## Features

### Core Features
- **Focus Timer**
  - Customizable focus duration (30s for testing, 30/45/60/120 minutes)
  - Pause/Resume functionality
  - Visual countdown timer

### Buddy System
- **Real-time Buddy Matching**
  - Match with users choosing the same focus duration
  - 30-second matching timeout with solo option
  - Real-time partner status updates

### Reward System
- **Dynamic Rewards**
  - Base reward: 1 coin per minute
  - Solo completion: Base reward
  - Buddy completion: Base reward × 2
  - Partner left completion: Base reward × 1.5
  - Early quit penalty: -20% of base reward
  - Buddy quit penalty: -40% of base reward

Examples:
- 30min solo completion: 30 coins
- 30min buddy completion: 60 coins
- 60min solo completion: 60 coins
- 60min buddy completion: 120 coins

### User Management
- User registration and login
- Persistent coin balance
- Session history tracking

## Project Structure

```
focuser/
├── app/                   # Main application code
│   ├── (tabs)/           # Tab-based navigation
│   └── _layout.tsx       # Root layout
├── assets/               # Static assets
├── components/           # Reusable components
├── constants/            # App constants
└── types/                # TypeScript type definitions
```
## Getting Started

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

3. Start the backend server:
```bash
python app.py
```

### Frontend Setup
1. From the project root directory, start the frontend development server:
```bash
npx expo start
```

This will launch the Expo development server, allowing you to run the app on your device or emulator.

## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Contact

Project Link: [https://github.com/rachelchenchi/focuser](https://github.com/rachelchenchi/focuser)