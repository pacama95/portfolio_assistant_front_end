# Portfolio Assistant Frontend

A modern, responsive web application for managing and visualizing your investment portfolio.

## Features

### 🎯 Current Implementation
- **Dashboard Overview**: Clean, modern interface with key portfolio metrics
- **Portfolio Summary**: Real-time portfolio value, cost basis, and gain/loss calculations  
- **Interactive Pie Chart**: Visual representation of portfolio allocation by position
- **Color-coded Performance**: Green for gains, red for losses for instant status recognition
- **Mobile Responsive**: Optimized for all screen sizes and PWA-ready
- **TypeScript**: Full type safety with API schema integration

### 📊 Key Metrics Displayed
- Total portfolio market value
- Total cost basis  
- Unrealized gains/losses (amount and percentage)
- Active vs total positions count
- Position allocation visualization

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for modern, utility-first styling
- **TanStack Query** for API state management and caching
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- Your Portfolio Assistant API running on `http://localhost:8081`

### Installation & Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### API Connection

The frontend is configured to connect to your Portfolio Assistant API at `http://localhost:8081/api`. Make sure your backend is running before starting the frontend.

## Project Structure

```
src/
├── api/           # API client and HTTP requests
├── components/    # React components
├── hooks/         # Custom React hooks for API calls
├── types/         # TypeScript type definitions
└── utils/         # Utility functions (formatting, colors)
```

## Next Steps

Potential enhancements to consider:
- Transaction management interface
- Position details pages  
- Historical performance charts
- Real-time market data updates
- Export/import functionality
- Advanced filtering and search

## Mobile & PWA Support

The application is designed mobile-first and includes PWA meta tags for potential future web app installation on mobile devices.