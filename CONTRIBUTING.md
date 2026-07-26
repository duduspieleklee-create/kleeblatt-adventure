# Contributing to Kleeblatt Adventure Game

## Development Workflow

This document outlines the development workflow for contributing to the Kleeblatt Adventure game project.

## Prerequisites

- Node.js (v18 or higher)
- Docker
- Git
- GalaChain SDK
- Python 3.9+ for backend development

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/kleeblatt-adventure.git
cd kleeblatt-adventure
```

### 2. Set Up the Frontend

```bash
cd game
npm install
npm run dev
```

### 3. Set Up the Backend

```bash
cd ../game-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 4. Set Up the GalaChain Contract

```bash
cd ../game-api/chaincode/kleeblattcoin
npm install
npm run build
```

## Code Structure

### Frontend (game/)
- `src/main.js`: Main game entry point
- `src/core/index.js`: Core game mechanics
- `src/WelcomeScene.js`: Welcome scene implementation
- `src/game-core.js`: Core game logic
- `src/wallet.js`: Wallet integration
- `src/api.js`: API communication layer

### Backend (game-api/)
- `main.py`: FastAPI application entry point
- `models.py`: Database models
- `schemas.py`: Pydantic schemas
- `database.py`: Database configuration
- `auth.py`: Authentication module
- `routers/game.py`: Game-related endpoints
- `daily_awards.py`: Daily award logic
- `chaincode/kleeblattcoin/`: GalaChain contract implementation

## Development Guidelines

### Coding Standards

1. **Frontend (JavaScript/TypeScript)**
   - Use ES6+ features consistently
   - Follow Phaser 3 best practices
   - Maintain clean, readable code
   - Write JSDoc comments for functions

2. **Backend (Python)**
   - Follow PEP 8 style guide
   - Use type hints where appropriate
   - Write docstrings for functions and classes
   - Follow FastAPI conventions

3. **Smart Contracts (TypeScript)**
   - Follow GalaChain SDK patterns
   - Implement proper error handling
   - Write comprehensive tests
   - Document all public functions

### Git Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes and commit with descriptive messages:
   ```bash
   git add .
   git commit -m "Add feature: description of the feature"
   ```

3. Push to the remote branch:
   ```bash
   git push origin feature/my-feature
   ```

4. Create a pull request to merge into `main`

### Testing

1. **Unit Tests**: Write unit tests for all business logic
2. **Integration Tests**: Test API endpoints and database interactions
3. **Contract Tests**: Verify smart contract functionality
4. **End-to-End Tests**: Test complete user flows

Run tests before submitting a pull request:
```bash
# Frontend tests
cd game
npm test

# Backend tests
cd ../game-api
python -m pytest

# Contract tests
cd chaincode/kleeblattcoin
npm test
```

## GalaChain Contract Development

### Creating New Contract Functions

1. Define the function in the contract class
2. Add proper access controls
3. Implement input validation
4. Write comprehensive tests
5. Update documentation

### Testing Contracts

1. Use the GalaChain testing framework
2. Test all possible input combinations
3. Verify error handling
4. Test gas consumption
5. Perform security analysis

## Security Guidelines

1. **Input Validation**: Always validate inputs in contracts
2. **Access Controls**: Implement proper role-based access
3. **Error Handling**: Handle errors gracefully
4. **Secrets Management**: Never commit secrets to the repository
5. **Code Reviews**: Have all code reviewed before merging

## Pull Request Requirements

1. All tests must pass
2. Code must follow established style guides
3. Changes must be documented appropriately
4. Security considerations must be addressed
5. Performance implications must be evaluated

## Deployment Process

1. Create a pull request to the `main` branch
2. Wait for CI/CD pipeline to complete
3. Ensure all security scans pass
4. Get approval from maintainers
5. Merge the pull request
6. Monitor the deployment process

## Best Practices

### Performance
- Optimize database queries
- Cache frequently accessed data
- Minimize contract storage operations
- Use efficient algorithms

### Maintainability
- Write clear, self-documenting code
- Keep functions small and focused
- Use meaningful variable names
- Update documentation as needed

### Security
- Follow the principle of least privilege
- Implement proper error handling
- Protect against common attack vectors
- Regular security audits

## Communication

- Use GitHub issues for bug reports and feature requests
- Join our Discord channel for real-time discussions
- Participate in code reviews
- Contribute to design discussions

## Recognition

Contributors will be recognized in the project's README and release notes. We appreciate all contributions, big or small!

## Questions?

If you have any questions about contributing, feel free to reach out to the maintainers or open an issue.