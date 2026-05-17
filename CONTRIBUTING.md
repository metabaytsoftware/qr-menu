# Contributing to qr-menu

Thank you for contributing to qr-menu! This guide explains our development workflow, code standards, and best practices.

---

## 📋 Prerequisites

- Node.js 20+ ([install](https://nodejs.org))
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 15+ (local) or Supabase account
- Git

---

## 🚀 Getting Started

### 1. Clone & Setup

```bash
git clone https://github.com/metabaytsoftware/qr-menu.git
cd qr-menu
pnpm install
```

### 2. Environment Variables

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edit .env with your database credentials

# Frontend
cp apps/web/.env.example apps/web/.env
# Update NEXT_PUBLIC_API_URL if needed
```

### 3. Database Setup

```bash
cd apps/api
npx prisma migrate dev  # Run migrations
npx prisma db seed     # Seed test data (optional)
```

### 4. Start Development Servers

```bash
cd ..  # Back to project root
pnpm dev  # Runs API on :3002 and Web on :3003
```

---

## 🌳 Branch Strategy

### Branch Naming Convention

```
main              # Production-ready code (protected)
├── dev           # Integration branch
├── feature/*     # New features
│   └── feature/add-menu-categories
├── bugfix/*      # Bug fixes
│   └── bugfix/fix-jwt-expiry
└── docs/*        # Documentation
    └── docs/deployment-guide
```

### Creating a New Feature

```bash
# 1. Create branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# 2. Make changes, commit, push
git add .
git commit -m "feat: add menu category filtering"
git push origin feature/your-feature-name

# 3. Open PR to dev (not main)
```

---

## 💻 Code Style & Quality

### TypeScript Standards

- **Strict mode**: All TypeScript files compile with `strict: true`
- **No `any`**: Use explicit types or generics
- **Naming**: camelCase for variables/functions, PascalCase for classes/types

```typescript
// ✅ Good
interface MenuItemProps {
  id: string;
  name: string;
  price: number;
}

const formatPrice = (price: number): string => {
  return `$${(price / 100).toFixed(2)}`;
};

// ❌ Avoid
const formatPrice = (price: any): any => {
  return `$${price}`;
};
```

### Formatting & Linting

```bash
# Automatic formatting
pnpm format

# Check linting
pnpm lint

# Type checking
pnpm type-check

# All checks at once
pnpm check
```

These run automatically on pre-commit (via Husky hooks).

### File Organization

**Backend (NestJS)**:
```
src/modules/menu/
├── menu.controller.ts     # HTTP routes
├── menu.service.ts        # Business logic
├── menu.module.ts         # Module definition
├── dto/
│   ├── create-menu.dto.ts
│   └── update-menu.dto.ts
├── entities/
│   └── menu.entity.ts
└── menu.service.spec.ts   # Tests
```

**Frontend (Next.js)**:
```
src/app/
├── admin/
│   ├── menus/
│   │   ├── page.tsx          # List page
│   │   ├── [id]/page.tsx      # Detail page
│   │   └── create/page.tsx    # Create page
│   └── layout.tsx
└── api/                       # API routes (reverse proxy)
    └── [...path]/route.ts

src/components/
├── Menu/
│   ├── MenuList.tsx          # Reusable component
│   ├── MenuForm.tsx
│   └── MenuList.spec.tsx     # Tests
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test --watch

# Check coverage
pnpm test --coverage
```

**Minimum Requirements**:
- ✅ 80% coverage for new code
- ✅ All public functions tested
- ✅ Edge cases covered

**Example (NestJS service)**:
```typescript
describe('MenuService', () => {
  let service: MenuService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MenuService, PrismaService],
    }).compile();
    service = module.get(MenuService);
    prisma = module.get(PrismaService);
  });

  it('should create a menu', async () => {
    const dto: CreateMenuDto = { name: 'Lunch', venueId: '123' };
    const result = await service.create(dto);
    expect(result.name).toBe('Lunch');
  });
});
```

### Integration Tests

```bash
# Run integration tests (requires database)
pnpm test:integration
```

---

## 📝 Commits & Pull Requests

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <subject>

<body>

<footer>
```

**Type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`  
**Subject**: Imperative mood, lowercase, no period (50 char max)  
**Body**: Explain *why*, not *what* (optional, wrapped at 72 chars)

**Examples**:
```
feat: add menu item discount field

Allows restaurants to set discounts on individual menu items.
Discount applies at order time, updates price calculation.

fix: resolve JWT token expiry validation

Tokens now properly expire after 24 hours instead of remaining valid indefinitely.

docs: update deployment instructions for Cloud Run
```

### Pull Request Process

1. **Push** your branch to GitHub
2. **Create PR** to `dev` branch (not `main`)
3. **Fill PR template**:
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type
   - [ ] Feature
   - [ ] Bug fix
   - [ ] Documentation
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Manual testing done
   - [ ] No regressions
   
   ## Checklist
   - [ ] Followed code style
   - [ ] Updated documentation
   - [ ] No breaking changes
   ```

4. **Automated Checks**:
   - ✅ CI/CD pipeline passes (lint, type-check, tests)
   - ✅ Code coverage maintained

5. **Manual Review**:
   - ✅ At least one approval from maintainer
   - ✅ No merge conflicts

6. **Merge**:
   - Use "Squash & merge" for feature branches
   - Use "Rebase & merge" for small fixes
   - Delete branch after merge

---

## 🐛 Debugging

### Backend (NestJS)

```bash
# Debug with Node inspector
node --inspect-brk dist/main.js

# Or use VS Code Debug config
# .vscode/launch.json:
{
  "type": "node",
  "request": "attach",
  "name": "Attach",
  "port": 9229
}
```

### Frontend (Next.js)

```bash
# Browser DevTools
# Open http://localhost:3003, press F12

# VS Code Debugger
# Debug → Run & Debug → Select "Next.js"
```

### Database

```bash
# Open Prisma Studio (interactive GUI)
cd apps/api
npx prisma studio

# Direct psql access
PGPASSWORD=$PASSWORD psql -h localhost -U postgres -d qr_menu
```

---

## 📚 Documentation Standards

- **READMEs**: Explain setup, running, and basic usage
- **Inline comments**: Only *why*, not *what*
  ```typescript
  // ❌ Avoid: describes what code does
  // Fetch menu items from database
  const items = await db.getMenuItems(menuId);
  
  // ✅ Good: explains non-obvious logic
  // Cache menu items for 5 minutes to reduce DB load during peak hours
  const items = await cache.getOrSet(`menu:${menuId}`, () =>
    db.getMenuItems(menuId),
    { ttl: 300 }
  );
  ```

- **Commit messages**: Explain the "why" behind changes
- **ADRs** (Architecture Decision Records): Document major decisions

---

## ⚠️ Common Mistakes to Avoid

### ❌ Do Not

1. **Commit `.env` files**
   - Use `.env.example` as template
   - Never push secrets, passwords, API keys

2. **Ignore type errors**
   ```bash
   # Bad: Using @ts-ignore
   // @ts-ignore
   const data = apiResponse.nonExistentField;
   
   # Good: Fix the type
   const data = (apiResponse as TypedResponse).field;
   ```

3. **Create over-abstracted code**
   ```typescript
   // ❌ Premature abstraction (used in 1 place)
   const createAbstractFactory = (type) => new Factory[type]();
   
   // ✅ Direct and simple
   const factory = new MenuFactory();
   ```

4. **Mix concerns**
   ```typescript
   // ❌ Service mixing business logic + HTTP handling
   return { status: 200, body: { menu } };
   
   // ✅ Service returns data, controller handles HTTP
   const menu = await this.menuService.findOne(id);
   return { menu };
   ```

5. **Leave console.logs in production code**
   - Use structured logging in NestJS
   - Remove debug logs before committing

### ✅ Do

1. **Write tests first** (TDD):
   ```typescript
   // 1. Write failing test
   it('should throw if menu not found', () => {
     expect(() => service.findOne('invalid')).toThrow();
   });
   
   // 2. Implement to make test pass
   async findOne(id: string) {
     const menu = await this.prisma.menu.findUnique({ where: { id } });
     if (!menu) throw new NotFoundException();
     return menu;
   }
   ```

2. **Keep functions small** (<50 lines)
   - Extract helper functions when too long
   - Single responsibility principle

3. **Validate at boundaries**
   - Validate user input in DTOs
   - Trust internal code

4. **Use type safety**
   - Define interfaces for API responses
   - Use generics for reusable logic

---

## 🚢 Deployment Checklist

Before merging to `main` (production):

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No breaking changes documented
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Documentation updated
- [ ] Changelog entry added

---

## 🆘 Need Help?

- **Questions**: Open an issue with `[QUESTION]` tag
- **Bug Reports**: Use bug report template
- **Feature Requests**: Use feature request template
- **Code Review**: Ask in PR comments

---

## 📞 Code of Conduct

- Be respectful and constructive
- Assume good intent
- Focus on code, not person
- Help junior developers learn

---

**Thank you for contributing to qr-menu!** 🎉

**Last Updated**: 2026-05-17
