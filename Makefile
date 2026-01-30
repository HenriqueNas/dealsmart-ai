.PHONY: clean setup

# Setup - First time setup
setup:
	@echo "🔧 Setting up DealSmart AI..."
	@if [ ! -f .env ]; then \
		echo "📝 Copying .env.example to .env"; \
		cp .env.example .env; \
		echo "✅ Created .env file"; \
	else \
		echo "ℹ️  .env file already exists"; \
	fi
	@if [ ! -f .env.development ]; then \
		echo "📝 Copying .env.example to .env.development"; \
		cp .env.example .env.development; \
		echo "✅ Created .env.development file"; \
	else \
		echo "ℹ️  .env.development file already exists"; \
	fi
	@echo ""
	@echo "📦 Installing dependencies with pnpm"
	@pnpm install
	@echo ""
	@npx cowsay -n "✌️ Project ready to run - use 'pnpm dev' command"


# Clean - Remove build artifacts and containers
clean:
	@echo "🧹 Cleaning up..."
	@echo "   - Stopping containers..."
	@docker ps -q | xargs -r docker stop 2>/dev/null || true
	@echo "   - Removing node_modules..."
	@rm -rf node_modules
	@echo "   - Removing build artifacts..."
	@find . -type d \( -name ".next" -o -name "dist" \) -prune -exec rm -rf {} + 2>/dev/null || true
	@echo "   - Removing lock files..."
	@find . -type f -name "*.lock" -delete 2>/dev/null || true
	@echo "   - Removing generated files..."
	@rm -rf */generated/
	@rm -f .env .env.development
	@echo ""
	@npx cowsay -d -n "✅ Cleanup complete!"
