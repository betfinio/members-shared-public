# Members Shared Subgraph

A Graph Protocol subgraph for tracking member hierarchy, staking, and legendary data in the betting platform.

## Development

### Prerequisites
- Node.js and Bun
- Graph CLI

### Installation
```bash
bun install
```

### Building
```bash
# Development build
bun run dev

# Production build  
bun run prod

```

### Testing

#### Run All Tests
```bash
bunx graph test
```

#### Run Specific Test Suite
You can run individual test suites by specifying the test suite name:

```bash
# Run only legendary withdraw tests
bunx graph test -- __legendary/legendary-withdraw

```

#### Run Multiple Test Suites with Wildcards
You can use wildcard patterns to run groups of related tests:

```bash
# Run all legendary tests
bunx graph test -- "__legendary*"

# Run all pass tests  
bunx graph test -- "__pass*"

# Run all legendary-nft tests
bunx graph test -- "__legendary-nft*"

