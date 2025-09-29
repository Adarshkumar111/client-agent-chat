# Client Agent Chat App

A comprehensive chat application with role-based authentication, real-time messaging, and redirect URL functionality for direct communication between agents and users.

## Features

- **Role-based Authentication**: USER and AGENT roles with different permissions
- **Real-time Chat Interface**: Live messaging with role-based visibility
- **Group Management**: Create and manage support groups
- **Direct Messaging**: One-to-one communication between users and agents
- **Private Notes**: Encrypted notes visible only to agents
- **Chat Redirect URLs**: Generate shareable links for direct access to conversations
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15.5.4, React 19, Tailwind CSS
- **Authentication**: NextAuth.js with JWT strategy
- **Database**: PostgreSQL with Neon Serverless (direct SQL queries)
- **Encryption**: crypto-js for private notes
- **Icons**: Heroicons

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd client-agent-chat
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Neon Database Connection
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Set up database tables
npm run db:setup

# Check database status
npm run db:status
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Creating Test Accounts

After setting up the database, create test accounts by registering through the application:

1. Visit `http://localhost:3000/auth/signup`
2. Register accounts with appropriate roles:

**Agent Account Example:**

- Name: `John Agent`
- Email: `john@agent.com`  
- Password: `password123`
- Role: `AGENT`

**User Account Example:**

- Name: `Alice User`
- Email: `alice@user.com`
- Password: `password123`
- Role: `USER`

## Key Features

### For Agents

- **Direct Messaging**: Send messages to users with one-to-one communication
- **Generate Chat URLs**: Create shareable redirect links for direct access to user conversations
- **Private Notes**: Add encrypted notes about users that remain private between agent-user pairs
- **Group Management**: Create and manage support groups
- **User Management**: View and communicate with all active users

### For Users

- **Agent Communication**: Direct messaging with agents
- **View Notes**: See private notes that agents have made (organized by agent)
- **Group Participation**: Join groups created by agents
- **Chat Access**: Use redirect URLs shared by agents to quickly access conversations

### Chat Redirect URLs

The application includes a powerful redirect URL system that allows:

- **Agents** can generate shareable links to specific user conversations
- **Direct Access**: URLs provide immediate access to chat interfaces
- **Secure**: URLs validate permissions and user roles before granting access
- **Flexible**: Support for pre-filled messages and conversation context

#### API Usage

```bash
# Generate a redirect URL for a specific user
GET /api/chat/redirect?userId=USER_ID

# Generate redirect URL with pre-filled message
POST /api/chat/redirect
{
  "userId": "USER_ID",
  "message": "Hello! How can I help you today?"
}
```

## API Endpoints

### WhatsApp Integration

- `POST /api/whatsapp/webhook` - Receive WhatsApp messages
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/send` - Send messages via WhatsApp
- `GET /api/whatsapp/send` - Check integration status

### Chat System

- `GET /api/groups` - List user groups
- `POST /api/groups` - Create new group
- `GET /api/groups/[id]/messages` - Get group messages
- `POST /api/groups/[id]/messages` - Send message

### Authentication

- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/session` - Get current session

## Database Schema

### Core Models

- **Users**: Authentication and profile data
- **Groups**: Chat groups and channels
- **Messages**: Chat messages with WhatsApp integration
- **GroupMembers**: Group membership management
- **PrivateNotes**: Encrypted agent notes
- **WhatsAppConfig**: WhatsApp API configuration

### Key Features details

- Role-based access control (USER/AGENT)
- WhatsApp message tracking (`whatsappId`, `isFromWhatsApp`)
- Encrypted private notes for agents
- Group-based communication

## Security Features

- **Webhook Verification**: HMAC signature validation for WhatsApp webhooks
- **Authentication**: JWT-based session management
- **Authorization**: Role-based access control
- **Encryption**: Private notes encrypted with crypto-js
- **Input Validation**: Sanitized user inputs

## Development

### Project Structure

```code
app/
├── api/              # API routes
├── auth/             # Authentication pages
├── chat/             # Chat interface
├── dashboard/        # User dashboard
├── lib/              # Utilities and services
│   ├── prisma.js     # Database connection utility
│   ├── encryption.js # Encryption utilities
│   └── utils.js      # Helper functions
├── globals.css       # Global styles
├── layout.js         # Root layout
└── page.js           # Homepage

database/
└── schema.sql        # PostgreSQL database schema

lib/
├── prisma.js         # Re-exports database connection
└── queries.js        # SQL query helpers

setup-db.js           # Database setup script
```

### Key Components

- **Chat Interface**: Real-time messaging with role-based visibility
- **Authentication System**: NextAuth configuration with custom providers  
- **Database Layer**: Direct PostgreSQL connection with Neon serverless
- **Query Helpers**: Organized SQL query functions for database operations

## Production Deployment

### Environment Setup

1. Set production `NEXTAUTH_SECRET`
2. Configure production Neon database connection
3. Set up proper domain and SSL certificates
4. Configure environment variables securely

### Security Checklist

- [ ] Strong `NEXTAUTH_SECRET`
- [ ] Database connection secured with SSL
- [ ] HTTPS enabled for production
- [ ] Environment variables protected
- [ ] Role-based access controls verified

## Troubleshooting

### Common Issues

### Authentication Issues

- Ensure `NEXTAUTH_SECRET` is set
- Check database connection
- Verify user credentials in database

### Database Errors

- Run `npm run db:setup` to create tables
- Use `npm run db:status` to check database health
- Verify Neon database connection string
- Ensure SSL is enabled in connection string

### Chat Issues

- Check database connectivity
- Verify user permissions and roles
- Review browser console and server logs for errors

### Logging

Enable verbose logging by checking browser console and server logs for debugging chat functionality.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including chat and redirect URL functionality)
5. Submit a pull request

## License

MIT License - see LICENSE file for details
