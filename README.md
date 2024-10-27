# Focuser App

A React Native application for medication tracking and focused work sessions with buddies.

## Features

- Medication Records: Track medications and get reminders
- Buddy Doubling: Find focus partners and earn rewards together

## Development

### Prerequisites

- Node.js 18+
- npm
- Expo CLI
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd focuser
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Development Environment

You can run the app using:
- [Expo Go](https://expo.dev/go) on your physical device
- [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/) (macOS only)

### Project Structure

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

## Testing

### Unit Tests
```bash
npm run test
```

### Type Checking
```bash
npm run typescript
```

### Linting
```bash
npm run lint
```

## CI/CD

This project uses GitHub Actions for continuous integration. The CI pipeline includes:

- Dependency installation
- Type checking
- Linting
- Unit testing

The pipeline runs on:
- Every push to main branch
- Every pull request to main branch

## Deployment

### Android
1. Configure app.json for Android
2. Build the Android app:
```bash
eas build --platform android
```

### iOS
1. Configure app.json for iOS
2. Build the iOS app:
```bash
eas build --platform ios
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks

## Troubleshooting

Common issues and their solutions:

1. Metro bundler issues:
```bash
npm start --reset-cache
```

2. Dependencies issues:
```bash
rm -rf node_modules
npm install
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Contact

Project Link: [https://github.com/yourusername/focuser](https://github.com/yourusername/focuser)
