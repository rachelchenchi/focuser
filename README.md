# Focuser

A collaborative focus timer app that helps users stay productive together. Users can choose to study alone or pair up with a buddy for enhanced motivation and rewards.

## Features

### Core Features
- **Focus Timer**
  - Customizable focus duration (30s for testing, 25/30/45/60 minutes)
  - Pause/Resume functionality
  - Visual countdown timer

### Buddy System
- **Real-time Buddy Matching**
  - Match with users choosing the same focus duration
  - 30-second matching timeout with solo option
  - Real-time partner status updates

### Reward System
- **Dynamic Rewards**
  - Solo completion: 50 coins
  - Buddy completion: 100 coins (both users must complete)
  - Partner left completion: 75 coins
  - Early quit penalty: -10 coins
  - Buddy quit penalty: -20 coins

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

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start Android development build
- `npm run ios` - Start iOS development build
- `npm run web` - Start web development build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typescript` - Run TypeScript checks


## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Contact

Project Link: [https://github.com/rachelchenchi/focuser](https://github.com/rachelchenchi/focuser)
